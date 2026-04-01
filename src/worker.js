import { Hono } from 'hono'
import { WorkflowEntrypoint } from 'cloudflare:workers'

const app = new Hono()

const SUMMARY_MODEL = '@cf/meta/llama-3.1-8b-instruct'

function jsonError(c, message, status = 400) {
  return c.json({ ok: false, error: message }, status)
}

function requireBearerToken(c, next) {
  const authHeader = c.req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token || token !== c.env.OPENCLAW_SHARED_TOKEN) {
    return jsonError(c, 'Unauthorized', 401)
  }

  return next()
}

async function insertProcessingJob(env, job) {
  await env.DB.prepare(
    `
      INSERT INTO processing_jobs (
        id, news_item_id, status, source_type, line_user_id, created_at, updated_at
      ) VALUES (?, ?, 'queued', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
  )
    .bind(job.id, job.newsItemId, job.sourceType, job.lineUserId || null)
    .run()
}

async function getNewsItem(env, newsItemId) {
  return env.DB.prepare(
    `
      SELECT id, title, url, content, status, source, created_at, updated_at
      FROM news_items
      WHERE id = ?
    `
  )
    .bind(newsItemId)
    .first()
}

async function getProcessingJob(env, jobId) {
  return env.DB.prepare(
    `
      SELECT id, news_item_id, status, source_type, workflow_instance_id, polis_conversation_id,
             line_delivery_status, line_user_id, last_error, created_at, updated_at
      FROM processing_jobs
      WHERE id = ?
    `
  )
    .bind(jobId)
    .first()
}

async function updateProcessingJob(env, jobId, patch) {
  const fields = []
  const values = []

  for (const [key, value] of Object.entries(patch)) {
    fields.push(`${key} = ?`)
    values.push(value)
  }

  if (fields.length === 0) {
    return
  }

  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(jobId)

  await env.DB.prepare(
    `UPDATE processing_jobs SET ${fields.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run()
}

async function createNewsItem(env, payload) {
  const newsItemId = payload.id || `news_${crypto.randomUUID()}`

  await env.DB.prepare(
    `
      INSERT INTO news_items (
        id, title, url, content, status, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
  )
    .bind(
      newsItemId,
      payload.title,
      payload.url,
      payload.content,
      payload.source || 'manual'
    )
    .run()

  return newsItemId
}

function buildSummaryPrompt(newsItem) {
  return [
    '你是公共議題編輯助理。',
    '請根據以下新聞內容，輸出 JSON，欄位必須包含：summary、keywords、polisTopic、statements。',
    '要求：',
    '1. summary 用繁體中文，120 到 180 字。',
    '2. keywords 提供 3 到 5 個關鍵字陣列。',
    '3. polisTopic 生成一個適合公共討論的投票主題。',
    '4. statements 生成 4 條適合 pol.is 討論的陳述句，每句 30 字內。',
    '5. 嚴格只輸出 JSON，不要加 markdown。',
    '',
    `標題：${newsItem.title}`,
    `網址：${newsItem.url}`,
    `內容：${newsItem.content}`
  ].join('\n')
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch (_error) {
    return null
  }
}

function normalizeAiResult(rawResult) {
  if (!rawResult) {
    return null
  }

  if (typeof rawResult === 'string') {
    return safeJsonParse(rawResult)
  }

  if (typeof rawResult.response === 'string') {
    return safeJsonParse(rawResult.response)
  }

  return rawResult
}

async function saveAiSummary(env, { summaryId, newsItemId, aiResult }) {
  await env.DB.prepare(
    `
      INSERT INTO ai_summaries (
        id, news_item_id, summary, keywords, polis_draft, review_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
  )
    .bind(
      summaryId,
      newsItemId,
      aiResult.summary,
      JSON.stringify(aiResult.keywords || []),
      JSON.stringify({
        topic: aiResult.polisTopic,
        statements: aiResult.statements || []
      })
    )
    .run()
}

async function createPollRecord(env, { pollId, jobId, aiResult, externalResult }) {
  await env.DB.prepare(
    `
      INSERT INTO polls (
        id, processing_job_id, provider, provider_poll_id, topic, statements_json,
        status, poll_url, provider_response_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
  )
    .bind(
      pollId,
      jobId,
      externalResult.provider,
      externalResult.providerPollId,
      aiResult.polisTopic,
      JSON.stringify(aiResult.statements || []),
      externalResult.status,
      externalResult.pollUrl,
      JSON.stringify(externalResult.raw || {})
    )
    .run()
}

async function createPolisConversation(env, aiResult, job) {
  if (!env.POLIS_API_BASE || !env.POLIS_API_TOKEN) {
    return {
      provider: 'pol.is',
      providerPollId: null,
      pollUrl: null,
      status: 'manual_action_required',
      raw: {
        reason: 'POLIS_API_BASE or POLIS_API_TOKEN is not configured'
      }
    }
  }

  const response = await fetch(`${env.POLIS_API_BASE.replace(/\/$/, '')}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.POLIS_API_TOKEN}`
    },
    body: JSON.stringify({
      topic: aiResult.polisTopic,
      statements: aiResult.statements || [],
      metadata: {
        processingJobId: job.id,
        newsItemId: job.news_item_id
      }
    })
  })

  const raw = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`pol.is request failed with status ${response.status}`)
  }

  return {
    provider: 'pol.is',
    providerPollId: raw.id || raw.conversationId || null,
    pollUrl: raw.url || raw.conversationUrl || null,
    status: 'created',
    raw
  }
}

async function pushLineMessage(env, lineUserId, messageText) {
  if (!lineUserId) {
    return { status: 'skipped', raw: { reason: 'No LINE user id' } }
  }

  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return {
      status: 'manual_action_required',
      raw: { reason: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' }
    }
  }

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: messageText
        }
      ]
    })
  })

  const raw = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`LINE push failed with status ${response.status}`)
  }

  return { status: 'sent', raw }
}

function buildLineSummaryMessage(newsItem, aiResult, polisResult) {
  const lines = [
    `新聞摘要：${newsItem.title}`,
    aiResult.summary,
    '',
    `討論主題：${aiResult.polisTopic}`
  ]

  if (polisResult.pollUrl) {
    lines.push(`投票連結：${polisResult.pollUrl}`)
  } else {
    lines.push('投票連結：建立中，稍後補送')
  }

  return lines.join('\n')
}

export class NewsPipelineWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { jobId, newsItemId } = event.payload

    const job = await step.do('load processing job', async () => {
      const processingJob = await getProcessingJob(this.env, jobId)

      if (!processingJob) {
        throw new Error(`Processing job not found: ${jobId}`)
      }

      await updateProcessingJob(this.env, jobId, { status: 'running' })
      return processingJob
    })

    const newsItem = await step.do('load news item', async () => {
      const item = await getNewsItem(this.env, newsItemId)

      if (!item) {
        throw new Error(`News item not found: ${newsItemId}`)
      }

      return item
    })

    const aiResult = await step.do(
      'summarize news with workers ai',
      { retries: { limit: 3, delay: '10 seconds', backoff: 'linear' } },
      async () => {
        const rawResult = await this.env.AI.run(SUMMARY_MODEL, {
          prompt: buildSummaryPrompt(newsItem)
        })
        const normalized = normalizeAiResult(rawResult)

        if (!normalized?.summary || !normalized?.polisTopic) {
          throw new Error('Workers AI did not return the expected JSON payload')
        }

        return normalized
      }
    )

    await step.do('save ai summary', async () => {
      await saveAiSummary(this.env, {
        summaryId: `summary_${crypto.randomUUID()}`,
        newsItemId,
        aiResult
      })

      await this.env.DB.prepare(
        `
          UPDATE news_items
          SET status = 'processed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      )
        .bind(newsItemId)
        .run()
    })

    const polisResult = await step.do(
      'create polis conversation',
      { retries: { limit: 2, delay: '20 seconds', backoff: 'linear' } },
      async () => {
        const created = await createPolisConversation(this.env, aiResult, job)

        await createPollRecord(this.env, {
          pollId: `poll_${crypto.randomUUID()}`,
          jobId,
          aiResult,
          externalResult: created
        })

        await updateProcessingJob(this.env, jobId, {
          polis_conversation_id: created.providerPollId,
          status: created.status === 'created' ? 'poll_created' : 'awaiting_poll_setup'
        })

        return created
      }
    )

    const lineResult = await step.do(
      'push line summary',
      { retries: { limit: 2, delay: '15 seconds', backoff: 'linear' } },
      async () => {
        const messageText = buildLineSummaryMessage(newsItem, aiResult, polisResult)
        const pushed = await pushLineMessage(this.env, job.line_user_id, messageText)

        await updateProcessingJob(this.env, jobId, {
          line_delivery_status: pushed.status
        })

        return pushed
      }
    )

    await step.do('mark job complete', async () => {
      await updateProcessingJob(this.env, jobId, {
        status: 'completed',
        line_delivery_status: lineResult.status
      })
    })

    return {
      jobId,
      newsItemId,
      polisConversationId: polisResult.providerPollId,
      pollUrl: polisResult.pollUrl,
      lineDeliveryStatus: lineResult.status
    }
  }
}

app.get('/', (c) => {
  return c.json({
    ok: true,
    service: 'newsagora-api',
    mode: 'cloudflare-option-1',
    message: 'Queue + Workflow + Workers AI + pol.is + LINE skeleton is ready'
  })
})

app.post('/line/webhook', async (c) => {
  const rawBody = await c.req.text()

  return c.json({
    ok: true,
    message: 'Webhook endpoint received payload',
    nextStep: 'Implement LINE signature validation and asynchronous queue handoff',
    receivedBytes: rawBody.length
  })
})

app.use('/api/*', requireBearerToken)

app.post('/api/news/import', async (c) => {
  const payload = await c.req.json()

  if (!payload?.title || !payload?.url || !payload?.content) {
    return jsonError(c, 'title, url and content are required')
  }

  const newsItemId = await createNewsItem(c.env, payload)
  const jobId = `job_${crypto.randomUUID()}`

  await insertProcessingJob(c.env, {
    id: jobId,
    newsItemId,
    sourceType: payload.sourceType || 'manual_import',
    lineUserId: payload.lineUserId || null
  })

  await c.env.NEWS_PIPELINE_QUEUE.send({
    jobId,
    newsItemId
  })

  return c.json({
    ok: true,
    newsItemId,
    jobId,
    status: 'queued'
  })
})

app.get('/api/news/pending', async (c) => {
  const result = await c.env.DB.prepare(
    `
      SELECT id, title, url, content, status, source, created_at, updated_at
      FROM news_items
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 20
    `
  ).run()

  return c.json({ items: result.results || [] })
})

app.get('/api/jobs/:id', async (c) => {
  const job = await getProcessingJob(c.env, c.req.param('id'))

  if (!job) {
    return jsonError(c, 'Job not found', 404)
  }

  return c.json({ ok: true, job })
})

app.post('/api/news/:id/process', async (c) => {
  const id = c.req.param('id')
  const payload = await c.req.json()
  const item = await getNewsItem(c.env, id)

  if (!item) {
    return jsonError(c, 'News item not found', 404)
  }

  await saveAiSummary(c.env, {
    summaryId: `summary_${crypto.randomUUID()}`,
    newsItemId: id,
    aiResult: {
      summary: payload.summary || '',
      keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
      polisTopic: payload.polisDraft?.topic || '',
      statements: Array.isArray(payload.polisDraft?.statements) ? payload.polisDraft.statements : []
    }
  })

  await c.env.DB.prepare(
    `
      UPDATE news_items
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
    .bind(payload.status || 'processed', id)
    .run()

  return c.json({
    ok: true,
    newsItemId: id,
    status: payload.status || 'processed'
  })
})

app.get('/api/polis/payloads', async (c) => {
  const result = await c.env.DB.prepare(
    `
      SELECT id, provider, provider_poll_id, topic, status, poll_url, created_at, updated_at
      FROM polls
      ORDER BY created_at DESC
      LIMIT 20
    `
  ).run()

  return c.json({ items: result.results || [] })
})

app.get('/api/workflows/:id', async (c) => {
  const instance = await c.env.NEWS_PIPELINE_WORKFLOW.get(c.req.param('id'))
  return c.json({ ok: true, status: await instance.status() })
})

export default {
  fetch: app.fetch,
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const { jobId, newsItemId } = message.body
        const instance = await env.NEWS_PIPELINE_WORKFLOW.create({
          id: jobId,
          params: { jobId, newsItemId }
        })

        await updateProcessingJob(env, jobId, {
          status: 'workflow_started',
          workflow_instance_id: instance.id
        })
      } catch (error) {
        const jobId = message.body?.jobId

        if (jobId) {
          await updateProcessingJob(env, jobId, {
            status: 'queue_failed',
            last_error: error instanceof Error ? error.message : String(error)
          })
        }

        throw error
      }
    }
  }
}
