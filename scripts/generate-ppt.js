import fs from 'node:fs'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'OpenAI Codex'
pptx.company = 'Newsagora'
pptx.subject = 'Cloudflare 兩頭接：LINE Bot × OpenClaw'
pptx.title = 'Cloudflare 兩頭接：LINE Bot × OpenClaw 專案工程實作方案'
pptx.lang = 'zh-TW'
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'zh-TW'
}

const colors = {
  bg: 'F7F1E6',
  paper: 'FFF9F0',
  ink: '1D2430',
  muted: '5F6877',
  brand: 'BF5B3D',
  brandDeep: '8D3F2A',
  sea: '1D5F73',
  gold: 'BE8B2D',
  line: 'D9D1C4',
  paleBrand: 'F5E1D7',
  paleSea: 'DCECEF'
}

function baseSlide(slide, eyebrow, title, subtitle) {
  slide.background = { color: colors.bg }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.2,
    y: 0.2,
    w: 12.93,
    h: 7.1,
    rectRadius: 0.12,
    fill: { color: colors.paper, transparency: 10 },
    line: { color: 'FFFFFF', transparency: 50 }
  })
  slide.addText(eyebrow, {
    x: 0.6,
    y: 0.45,
    w: 3.2,
    h: 0.25,
    fontFace: 'Aptos',
    fontSize: 11,
    bold: true,
    color: colors.brandDeep,
    charSpace: 1.2
  })
  slide.addText(title, {
    x: 0.6,
    y: 0.75,
    w: 8.2,
    h: 0.8,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: colors.ink
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6,
      y: 1.45,
      w: 8.8,
      h: 0.55,
      fontFace: 'Aptos',
      fontSize: 11,
      color: colors.muted
    })
  }
  slide.addText('Newsagora / Static Proposal to PPT', {
    x: 9.15,
    y: 0.48,
    w: 3.1,
    h: 0.25,
    align: 'right',
    fontFace: 'Aptos',
    fontSize: 10,
    bold: true,
    color: colors.sea
  })
}

function addCard(slide, { x, y, w, h, title, body, accent = colors.brand }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF', transparency: 8 },
    line: { color: colors.line }
  })
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.08,
    fill: { color: accent },
    line: { color: accent }
  })
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.36,
    h: 0.35,
    fontFace: 'Aptos Display',
    fontSize: 15,
    bold: true,
    color: colors.ink
  })
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.6,
    w: w - 0.36,
    h: h - 0.76,
    fontFace: 'Aptos',
    fontSize: 10.5,
    color: colors.muted,
    valign: 'top',
    fit: 'shrink'
  })
}

function addBullets(slide, items, opts) {
  slide.addText(
    items.map((text) => ({
      text,
      options: { bullet: { indent: 14 } }
    })),
    {
      x: opts.x,
      y: opts.y,
      w: opts.w,
      h: opts.h,
      fontFace: 'Aptos',
      fontSize: opts.fontSize || 10.5,
      color: opts.color || colors.ink,
      breakLine: true,
      paraSpaceAfterPt: 8,
      fit: 'shrink'
    }
  )
}

function addSectionLabel(slide, text, x, y, color) {
  slide.addText(text, {
    x,
    y,
    w: 3.0,
    h: 0.25,
    fontFace: 'Aptos',
    fontSize: 10,
    bold: true,
    color,
    charSpace: 1
  })
}

const titleSlide = pptx.addSlide()
titleSlide.background = { color: colors.bg }
titleSlide.addShape(pptx.ShapeType.rect, {
  x: 0.25,
  y: 0.25,
  w: 12.85,
  h: 6.95,
  rectRadius: 0.14,
  fill: { color: colors.paper, transparency: 6 },
  line: { color: 'FFFFFF', transparency: 45 }
})
titleSlide.addShape(pptx.ShapeType.arc, {
  x: -0.2,
  y: -0.2,
  w: 3.3,
  h: 2.6,
  line: { color: colors.paleBrand, pt: 18 }
})
titleSlide.addShape(pptx.ShapeType.arc, {
  x: 10.2,
  y: 5.6,
  w: 3.4,
  h: 2.2,
  line: { color: colors.paleSea, pt: 18 }
})
titleSlide.addText('Cloudflare 兩頭接', {
  x: 0.75,
  y: 0.75,
  w: 3.6,
  h: 0.35,
  fontFace: 'Aptos',
  fontSize: 12,
  bold: true,
  color: colors.brandDeep,
  charSpace: 1.4
})
titleSlide.addText('LINE Bot × OpenClaw\n專案工程實作方案', {
  x: 0.75,
  y: 1.15,
  w: 6.8,
  h: 1.6,
  fontFace: 'Aptos Display',
  fontSize: 26,
  bold: true,
  color: colors.ink,
  breakLine: true
})
titleSlide.addText('以 Cloudflare Worker + Hono 作為邊界層，前面接住 LINE webhook，後面提供受保護 API 給 OpenClaw 定期處理新聞、摘要與 polis 題目。', {
  x: 0.78,
  y: 2.85,
  w: 6.4,
  h: 0.8,
  fontFace: 'Aptos',
  fontSize: 12,
  color: colors.muted
})
addCard(titleSlide, {
  x: 8.1,
  y: 1.25,
  w: 3.9,
  h: 1.1,
  title: '核心原則',
  body: '邊界層與 AI 流程解耦',
  accent: colors.brand
})
addCard(titleSlide, {
  x: 8.1,
  y: 2.55,
  w: 3.9,
  h: 1.1,
  title: 'MVP 範圍',
  body: 'Webhook + Token API + D1',
  accent: colors.sea
})
addCard(titleSlide, {
  x: 0.78,
  y: 4.55,
  w: 3.4,
  h: 1.45,
  title: 'LINE Bot',
  body: '負責與使用者互動、推播投票、接收回覆。',
  accent: colors.gold
})
addCard(titleSlide, {
  x: 4.55,
  y: 4.55,
  w: 3.4,
  h: 1.45,
  title: 'Worker / Hono',
  body: '負責驗證、整理新聞、保存候選題目、提供安全 API。',
  accent: colors.brand
})
addCard(titleSlide, {
  x: 8.32,
  y: 4.55,
  w: 3.4,
  h: 1.45,
  title: 'OpenClaw',
  body: '定期輪詢 API，產出摘要、分類、polis 題目與回寫結果。',
  accent: colors.sea
})

const goals = pptx.addSlide()
baseSlide(goals, '專案目標', '把「接收事件」與「AI 處理」分成兩條清楚的責任線', '沿用 index-static.html 的敘事節奏，整理成提案型簡報頁。')
addCard(goals, {
  x: 0.65, y: 2.15, w: 3.7, h: 2.05,
  title: '對外',
  body: '接收 LINE Bot webhook、處理使用者互動、驗證 signature，避免惡意請求直接穿透系統。',
  accent: colors.brand
})
addCard(goals, {
  x: 4.65, y: 2.15, w: 3.7, h: 2.05,
  title: '對內',
  body: '提供 OpenClaw 定期輪詢的內部 API，讓摘要、分類與題目生成有獨立節奏可控。',
  accent: colors.sea
})
addCard(goals, {
  x: 8.65, y: 2.15, w: 3.7, h: 2.05,
  title: '對營運',
  body: '把資料整理、安全控管、記錄與狀態管理集中在 Worker，後續上線與除錯都更容易。',
  accent: colors.gold
})
addSectionLabel(goals, '三個關鍵訊號', 0.7, 4.65, colors.brandDeep)
addBullets(goals, [
  'Worker 負責驗證、整理、保護與記錄',
  'OpenClaw 專心處理 AI 摘要與題目生成',
  'LINE Bot 專注互動、推播與投票回收'
], { x: 0.7, y: 4.95, w: 5.3, h: 1.5 })

const architecture = pptx.addSlide()
baseSlide(architecture, '總體架構', '一個 Worker，接住兩種方向完全不同的流量', '')
addCard(architecture, {
  x: 0.65, y: 2.05, w: 2.9, h: 3.4,
  title: '輸入端',
  body: '新聞來源 / RSS\n手動匯入\nLINE Webhook 事件',
  accent: colors.gold
})
addCard(architecture, {
  x: 4.05, y: 1.65, w: 4.2, h: 4.2,
  title: 'Cloudflare Worker + Hono',
  body: 'POST /line/webhook\nGET /api/news/pending\nPOST /api/news/:id/process\nGET /api/polis/payloads\nLINE Signature 驗證\nToken 驗證 / 日誌 / 節流',
  accent: colors.brand
})
addCard(architecture, {
  x: 8.75, y: 2.05, w: 2.9, h: 3.4,
  title: '輸出端',
  body: 'LINE Bot 互動與推播\nOpenClaw 定期排程\nAI 摘要與 polis 題目生成',
  accent: colors.sea
})

const modules = pptx.addSlide()
baseSlide(modules, '模組拆分', '把系統分成三塊，讓每一塊只做自己擅長的事', '')
addCard(modules, {
  x: 0.65, y: 2.05, w: 3.75, h: 3.1,
  title: 'A. LINE Webhook 入口',
  body: '接收使用者訊息、按鈕與 postback。\n使用原始 body 驗證 x-line-signature。\n必要時把事件寫入 D1 或 KV。',
  accent: colors.brand
})
addCard(modules, {
  x: 4.65, y: 2.05, w: 3.75, h: 3.1,
  title: 'B. OpenClaw 專用 API',
  body: '提供待處理新聞。\n接收 AI 回寫。\n交付待投放的 polis 載荷。\n只允許正確 token 存取。',
  accent: colors.sea
})
addCard(modules, {
  x: 8.65, y: 2.05, w: 3.75, h: 3.1,
  title: 'C. 資料層',
  body: 'KV：存簡單狀態、Token、快取。\nD1：存新聞、摘要、投票任務、使用者狀態。\n先滿足 MVP，再逐步擴充。',
  accent: colors.gold
})

const whySlide = pptx.addSlide()
baseSlide(whySlide, '設計理由', '兩頭接，不只是接得上，而是接得穩', '')
addCard(whySlide, {
  x: 0.65, y: 2.05, w: 3.75, h: 2.2,
  title: '降低安全風險',
  body: 'LINE webhook 不直接打到 AI 流程，先由 Worker 進行驗證、過濾與紀錄，可以把攻擊面壓到最小。',
  accent: colors.brand
})
addCard(whySlide, {
  x: 4.65, y: 2.05, w: 3.75, h: 2.2,
  title: '邊界責任集中',
  body: 'Header 檢查、節流、日誌與 request 驗證都留在 Worker，系統錯誤點更容易定位與處理。',
  accent: colors.sea
})
addCard(whySlide, {
  x: 8.65, y: 2.05, w: 3.75, h: 2.2,
  title: 'AI 任務更專注',
  body: 'OpenClaw 不必理解 LINE 平台細節，只需定期拉資料、產出摘要與題目，再把結果回寫即可。',
  accent: colors.gold
})
addSectionLabel(whySlide, '一句話', 0.7, 4.7, colors.brandDeep)
whySlide.addText('Worker 負責守邊界，OpenClaw 負責做 AI，LINE Bot 負責面對使用者。', {
  x: 0.7,
  y: 4.98,
  w: 8.8,
  h: 0.5,
  fontFace: 'Aptos Display',
  fontSize: 18,
  color: colors.ink,
  bold: true
})

const security = pptx.addSlide()
baseSlide(security, '安全設計', '先把邊界守住，再談流程自動化', '')
addCard(security, {
  x: 0.65, y: 2.0, w: 5.7, h: 3.6,
  title: 'LINE Webhook 驗證',
  body: '使用 channel secret 對原始 request body 做 HMAC-SHA256，與 x-line-signature 比對；失敗直接拒絕。',
  accent: colors.brand
})
addBullets(security, [
  '一定要用原始 body',
  '驗證失敗回 401 或 403',
  '不要先 parse 再驗證'
], { x: 1.0, y: 3.1, w: 4.8, h: 1.6 })
addCard(security, {
  x: 6.65, y: 2.0, w: 5.7, h: 3.6,
  title: 'OpenClaw API 保護',
  body: '至少三層：Bearer Token、來源識別、時間戳與簽章，避免未授權調用與重放攻擊。',
  accent: colors.sea
})
addBullets(security, [
  'Authorization: Bearer <OPENCLAW_SHARED_TOKEN>',
  'X-Client-Id 區分不同節點',
  'X-Timestamp + X-Signature 做進階保護'
], { x: 7.0, y: 3.1, w: 4.8, h: 1.8 })

const api = pptx.addSlide()
baseSlide(api, 'MVP API 規格', '第一版先把最關鍵的四個入口釘穩', '')
addCard(api, {
  x: 0.65, y: 2.0, w: 2.85, h: 2.15,
  title: 'POST /line/webhook',
  body: '接收 LINE 平台 webhook。\n成功：200 OK\n驗證失敗：401 Unauthorized',
  accent: colors.brand
})
addCard(api, {
  x: 3.75, y: 2.0, w: 2.85, h: 2.15,
  title: 'GET /api/news/pending',
  body: 'OpenClaw 定期拉取待處理新聞。\nHeader 需帶共享 token。',
  accent: colors.sea
})
addCard(api, {
  x: 6.85, y: 2.0, w: 2.85, h: 2.15,
  title: 'POST /api/news/:id/process',
  body: '回寫 AI 摘要、關鍵字、polis draft 與狀態。',
  accent: colors.brand
})
addCard(api, {
  x: 9.95, y: 2.0, w: 2.45, h: 2.15,
  title: 'GET /api/polis/payloads',
  body: '提供後續投放流程抓取資料。',
  accent: colors.gold
})
api.addText('Response Sample: /api/news/pending', {
  x: 0.7,
  y: 4.55,
  w: 3.6,
  h: 0.3,
  fontFace: 'Aptos',
  fontSize: 10.5,
  bold: true,
  color: colors.brandDeep
})
api.addText(`{
  "items": [
    {
      "id": "news_001",
      "title": "某新聞標題",
      "url": "https://example.com/news/1",
      "content": "新聞內文或擷取內容",
      "createdAt": "2026-03-27T10:00:00Z"
    }
  ]
}`, {
  x: 0.7,
  y: 4.9,
  w: 5.7,
  h: 1.75,
  fontFace: 'Courier New',
  fontSize: 9.5,
  color: 'F4E9D7',
  fill: { color: '1E2530' },
  margin: 0.12
})
addBullets(api, [
  '由 Worker 控制狀態，不讓同一篇新聞被重複處理',
  'OpenClaw 處理完就回寫 /api/news/:id/process',
  '後續可再接 publish / review 等流程'
], { x: 6.9, y: 4.95, w: 5.1, h: 1.5 })

const roadmap = pptx.addSlide()
baseSlide(roadmap, '資料流與實作順序', '先建立一條最短可行的處理管線，再逐步擴充', '')
addCard(roadmap, {
  x: 0.65, y: 2.0, w: 5.55, h: 3.9,
  title: '資料流',
  body: '01 收集：新聞進入 news_items，狀態為 pending。\n02 AI 整理：OpenClaw 拉取待處理新聞，產生摘要與 polis statements。\n03 審核：加入 review_status，避免不適當題目直接投放。\n04 LINE 投放：Worker 從 polis_tasks 取出可投放題目並推送。',
  accent: colors.sea
})
addCard(roadmap, {
  x: 6.55, y: 2.0, w: 5.8, h: 3.9,
  title: '實作順序',
  body: '1. 建立 Cloudflare Worker + Hono 專案骨架。\n2. 完成 POST /line/webhook 與 LINE signature 驗證。\n3. 加上 /api/* Bearer Token middleware。\n4. 建立 D1 schema，先存 news_items 與 ai_summaries。\n5. 讓 OpenClaw 能抓一筆待處理新聞並回寫摘要。\n6. 最後才接 LINE 推播與 polis 投票資料流。',
  accent: colors.brand
})

const closing = pptx.addSlide()
baseSlide(closing, '一句話總結', '用 Worker 當邊界層，會比讓 LINE 直接碰 OpenClaw 更安全也更好維護', '')
closing.addText('用 Cloudflare Worker + Hono 當邊界層，前面接 LINE Bot，後面開受 Token 保護的 API 給 OpenClaw 定期呼叫。', {
  x: 0.9,
  y: 2.0,
  w: 7.5,
  h: 1.0,
  fontFace: 'Aptos Display',
  fontSize: 23,
  bold: true,
  color: colors.ink
})
closing.addText('這份簡報沿用目前 index-static.html 的資訊架構與視覺語彙，可作為提案版、對外說明版，後續也能再加上 Vue 後台版與實作 demo。', {
  x: 0.95,
  y: 3.15,
  w: 7.1,
  h: 0.9,
  fontFace: 'Aptos',
  fontSize: 12,
  color: colors.muted
})
addCard(closing, {
  x: 8.55,
  y: 1.95,
  w: 3.2,
  h: 1.2,
  title: '官方文件',
  body: 'LINE Messaging API\nCloudflare Workers\nHono Docs',
  accent: colors.gold
})
addCard(closing, {
  x: 8.55,
  y: 3.45,
  w: 3.2,
  h: 1.2,
  title: '適合用途',
  body: '提案簡報\n架構說明\nMVP 對齊\n後續開發 kickoff',
  accent: colors.sea
})

const outDir = path.join(process.cwd(), 'output')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'Cloudflare_LINEBot_OpenClaw_Proposal.pptx')

await pptx.writeFile({ fileName: outPath })
console.log(outPath)
