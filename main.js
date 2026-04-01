import { createApp, nextTick } from './node_modules/vue/dist/vue.esm-browser.js'

createApp({
  data() {
    return {
      activeEndpoint: 'pending',
      activeLayer: 'worker',
      activeStage: 'collect',
      heroSignals: [
        'Worker 負責驗證、整理、保護與記錄',
        'OpenClaw 專心處理 AI 摘要與題目生成',
        'LINE Bot 專注互動、推播與投票回收'
      ],
      valueCards: [
        {
          title: '對外',
          body: '接收 LINE Bot webhook、處理使用者互動、驗證 signature，避免惡意請求直接穿透系統。'
        },
        {
          title: '對內',
          body: '提供 OpenClaw 定期輪詢的內部 API，讓摘要、分類與題目生成有獨立節奏可控。'
        },
        {
          title: '對營運',
          body: '把資料整理、安全控管、記錄與狀態管理集中在 Worker，後續上線與除錯都更容易。'
        }
      ],
      modules: [
        {
          title: 'A. LINE Webhook 入口',
          tone: 'red',
          body: '接收使用者訊息、按鈕與 postback，使用原始 body 驗證 x-line-signature，必要時把事件寫進 D1 或 KV。'
        },
        {
          title: 'B. OpenClaw 專用 API',
          tone: 'blue',
          body: '提供待處理新聞、接收 AI 回寫、交付待投放的 polis 載荷，只允許帶正確 token 的客戶端存取。'
        },
        {
          title: 'C. 資料層',
          tone: 'gold',
          body: '以 KV 處理簡單狀態與快取，以 D1 保存新聞、摘要、任務、使用者與 bot 事件，先滿足 MVP，再逐步擴充。'
        }
      ],
      reasons: [
        {
          title: '降低安全風險',
          body: 'LINE webhook 不直接打到 AI 流程，先由 Worker 進行驗證、過濾與紀錄，可以把攻擊面壓到最小。'
        },
        {
          title: '邊界責任集中',
          body: 'Header 檢查、節流、日誌與 request 驗證都留在 Worker，系統錯誤點更容易定位與處理。'
        },
        {
          title: 'AI 任務更專注',
          body: 'OpenClaw 不必理解 LINE 平台細節，只需定期拉資料、產出摘要與題目，再把結果回寫即可。'
        }
      ],
      layers: {
        input: {
          label: '輸入端',
          items: ['新聞來源 / RSS', '手動匯入', 'LINE Webhook 事件']
        },
        worker: {
          label: 'Worker 邊界層',
          items: [
            'POST /line/webhook',
            'GET /api/news/pending',
            'POST /api/news/:id/process',
            'GET /api/polis/payloads',
            'LINE Signature 驗證',
            'Token 驗證 / 日誌 / 節流'
          ]
        },
        output: {
          label: '輸出端',
          items: ['LINE Bot 互動與推播', 'OpenClaw 定期排程', 'AI 摘要與 polis 題目生成']
        }
      },
      securityBlocks: [
        {
          title: 'LINE Webhook 驗證',
          body: '使用 channel secret 對原始 request body 做 HMAC-SHA256，與 x-line-signature 比對，失敗直接拒絕。',
          bullets: ['一定使用原始 body', '先驗證再 parse', '失敗回 401 或 403']
        },
        {
          title: 'OpenClaw API 保護',
          body: '最少先做三層：Bearer Token、來源識別、時間戳與簽章，避免未授權調用與重放攻擊。',
          bullets: [
            'Authorization: Bearer <TOKEN>',
            'X-Client-Id 區分節點',
            'X-Timestamp + X-Signature 進階保護'
          ]
        }
      ],
      endpoints: {
        webhook: {
          id: 'webhook',
          method: 'POST',
          path: '/line/webhook',
          summary: '接收 LINE 平台 webhook，成功回 200 OK，簽章驗證失敗回 401 Unauthorized。',
          request: `POST /line/webhook\nx-line-signature: <signature>\nContent-Type: application/json`,
          response: `200 OK\n{\n  "ok": true\n}`
        },
        pending: {
          id: 'pending',
          method: 'GET',
          path: '/api/news/pending',
          summary: '由 OpenClaw 定期拉取待處理新聞，header 需帶共享 token。',
          request: `GET /api/news/pending\nAuthorization: Bearer <OPENCLAW_SHARED_TOKEN>`,
          response: `{\n  "items": [\n    {\n      "id": "news_001",\n      "title": "某新聞標題",\n      "url": "https://example.com/news/1",\n      "content": "新聞內文或擷取內容",\n      "createdAt": "2026-03-27T10:00:00Z"\n    }\n  ]\n}`
        },
        process: {
          id: 'process',
          method: 'POST',
          path: '/api/news/:id/process',
          summary: '回寫 AI 摘要、關鍵字、polis draft 與狀態，讓 Worker 管理處理進度。',
          request: `POST /api/news/news_001/process\nAuthorization: Bearer <OPENCLAW_SHARED_TOKEN>\nContent-Type: application/json`,
          response: `{\n  "summary": "AI 生成摘要",\n  "keywords": ["救災", "資訊流通", "地方政府"],\n  "polisDraft": {\n    "topic": "未來救災資訊流程如何改進？",\n    "statements": [\n      "政府應建立單一災情資訊入口",\n      "地方與中央的撤離標準應公開透明"\n    ]\n  },\n  "status": "processed"\n}`
        },
        polis: {
          id: 'polis',
          method: 'GET',
          path: '/api/polis/payloads',
          summary: '提供後續投放流程所需的投票載荷，銜接審核、推播與投票機制。',
          request: `GET /api/polis/payloads\nAuthorization: Bearer <OPENCLAW_SHARED_TOKEN>`,
          response: `{\n  "items": [\n    {\n      "id": "polis_001",\n      "topic": "未來救災資訊流程如何改進？",\n      "reviewStatus": "approved"\n    }\n  ]\n}`
        }
      },
      stages: {
        collect: {
          step: '01',
          title: '收集',
          body: '新聞從 RSS、手動匯入或 webhook 進入 news_items，狀態先標為 pending。'
        },
        ai: {
          step: '02',
          title: 'AI 整理',
          body: 'OpenClaw 用排程抓取待處理新聞，產生摘要、標題整理與 polis statements。'
        },
        review: {
          step: '03',
          title: '審核',
          body: '加入 review_status，避免不適當題目直接流向使用者，提高內容品質與安全性。'
        },
        delivery: {
          step: '04',
          title: 'LINE 投放',
          body: 'Worker 從 polis_tasks 取出可投放題目，透過 Messaging API 推送並回收互動結果。'
        }
      },
      roadmap: [
        '建立 Cloudflare Worker + Hono 專案骨架。',
        '完成 POST /line/webhook 與 LINE signature 驗證。',
        '加入 /api/* Bearer Token middleware。',
        '建立 D1 schema，先落 news_items 與 ai_summaries。',
        '讓 OpenClaw 能抓待處理新聞並回寫摘要。',
        '最後再接 LINE 推播與 polis 投票資料流。'
      ],
      docs: [
        { label: 'LINE Messaging API', href: 'https://developers.line.biz/en/docs/messaging-api/' },
        { label: 'Cloudflare Workers', href: 'https://developers.cloudflare.com/workers/' },
        { label: 'Hono Docs', href: 'https://hono.dev/docs/' }
      ]
    }
  },
  computed: {
    activeEndpointCard() {
      return this.endpoints[this.activeEndpoint]
    },
    activeLayerCard() {
      return this.layers[this.activeLayer]
    },
    activeStageCard() {
      return this.stages[this.activeStage]
    }
  },
  methods: {
    methodClass(method) {
      return method.toLowerCase() === 'get' ? 'get' : 'post'
    },
    async refreshReveal() {
      await nextTick()

      if (this.revealObserver) {
        this.revealObserver.disconnect()
      }

      const revealItems = [...document.querySelectorAll('.reveal-target')]
      this.revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
            }
          })
        },
        {
          threshold: 0.14,
          rootMargin: '0px 0px -8% 0px'
        }
      )

      revealItems.forEach((item, index) => {
        item.classList.add('reveal')
        item.style.transitionDelay = `${Math.min(index * 60, 240)}ms`
        this.revealObserver.observe(item)
      })
    }
  },
  async mounted() {
    await this.refreshReveal()
  },
  beforeUnmount() {
    if (this.revealObserver) {
      this.revealObserver.disconnect()
    }
  },
  template: `
    <div class="page-shell">
      <header class="hero reveal-target">
        <nav class="topbar">
          <span class="brand">Newsagora / Vue Prototype</span>
          <div class="topbar-actions">
            <button class="ghost-chip" type="button" @click="activeLayer = 'worker'">聚焦 Worker</button>
            <a class="pill-link" href="./index-static.html">看靜態版</a>
            <a class="pill-link" href="#roadmap">實作順序</a>
          </div>
        </nav>

        <div class="hero-grid">
          <section class="hero-copy reveal-target">
            <p class="eyebrow">Cloudflare 兩頭接</p>
            <h1>LINE Bot × OpenClaw 專案工程實作方案</h1>
            <p class="hero-text">
              用 <strong>Cloudflare Worker + Hono</strong> 當邊界層，前面安全接住 LINE webhook，
              後面提供受保護 API 給 OpenClaw 定期處理新聞、摘要與 polis 題目，讓整體資料流更穩、更清楚、更容易擴充。
            </p>

            <div class="hero-actions">
              <a class="button primary" href="#architecture">看總體架構</a>
              <a class="button secondary" href="#apis">看 API 規格</a>
            </div>

            <ul class="signal-list">
              <li v-for="signal in heroSignals" :key="signal">{{ signal }}</li>
            </ul>
          </section>

          <aside class="hero-panel">
            <div class="stat-card reveal-target">
              <span class="stat-label">核心原則</span>
              <strong>邊界層與 AI 流程解耦</strong>
            </div>
            <div class="stat-card reveal-target">
              <span class="stat-label">MVP 範圍</span>
              <strong>Webhook + Token API + D1</strong>
            </div>
            <div class="insight-card reveal-target">
              <p class="eyebrow">Vue 互動展示</p>
              <div class="layer-tabs compact">
                <button
                  v-for="(layer, key) in layers"
                  :key="key"
                  type="button"
                  class="tab-button"
                  :class="{ active: activeLayer === key }"
                  @click="activeLayer = key"
                >
                  {{ layer.label }}
                </button>
              </div>
              <div class="layer-preview">
                <h3>{{ activeLayerCard.label }}</h3>
                <ul>
                  <li v-for="item in activeLayerCard.items" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <main>
        <section class="section reveal-target" id="vision">
          <div class="section-heading">
            <p class="eyebrow">專案目標</p>
            <h2>把「接收事件」與「AI 處理」分成兩條清楚的責任線</h2>
          </div>
          <div class="cards three-up">
            <article class="card reveal-target" v-for="card in valueCards" :key="card.title">
              <h3>{{ card.title }}</h3>
              <p>{{ card.body }}</p>
            </article>
          </div>
        </section>

        <section class="section reveal-target" id="architecture">
          <div class="section-heading">
            <p class="eyebrow">總體架構</p>
            <h2>一個 Worker，接住兩種方向完全不同的流量</h2>
          </div>

          <div class="architecture-layout">
            <button
              class="lane reveal-target"
              type="button"
              :class="{ selected: activeLayer === 'input' }"
              @click="activeLayer = 'input'"
            >
              <h3>{{ layers.input.label }}</h3>
              <ul>
                <li v-for="item in layers.input.items" :key="item">{{ item }}</li>
              </ul>
            </button>

            <button
              class="hub reveal-target"
              type="button"
              :class="{ selected: activeLayer === 'worker' }"
              @click="activeLayer = 'worker'"
            >
              <h3>{{ layers.worker.label }}</h3>
              <ul>
                <li v-for="item in layers.worker.items" :key="item"><code>{{ item }}</code></li>
              </ul>
            </button>

            <button
              class="lane reveal-target"
              type="button"
              :class="{ selected: activeLayer === 'output' }"
              @click="activeLayer = 'output'"
            >
              <h3>{{ layers.output.label }}</h3>
              <ul>
                <li v-for="item in layers.output.items" :key="item">{{ item }}</li>
              </ul>
            </button>
          </div>
        </section>

        <section class="section reveal-target">
          <div class="section-heading">
            <p class="eyebrow">模組拆分</p>
            <h2>把系統分成三塊，讓每一塊只做自己擅長的事</h2>
          </div>
          <div class="cards three-up">
            <article
              class="card reveal-target"
              v-for="module in modules"
              :key="module.title"
              :class="'accent-' + module.tone"
            >
              <h3>{{ module.title }}</h3>
              <p>{{ module.body }}</p>
            </article>
          </div>
        </section>

        <section class="section split-section reveal-target">
          <div class="section-heading">
            <p class="eyebrow">為什麼這樣設計</p>
            <h2>兩頭接，不只是接得上，而是接得穩</h2>
          </div>
          <div class="reason-grid">
            <article class="reason reveal-target" v-for="reason in reasons" :key="reason.title">
              <h3>{{ reason.title }}</h3>
              <p>{{ reason.body }}</p>
            </article>
          </div>
        </section>

        <section class="section security-section reveal-target">
          <div class="section-heading">
            <p class="eyebrow">安全設計</p>
            <h2>先把邊界守住，再談流程自動化</h2>
          </div>
          <div class="security-grid">
            <article class="security-card reveal-target" v-for="block in securityBlocks" :key="block.title">
              <h3>{{ block.title }}</h3>
              <p>{{ block.body }}</p>
              <ul>
                <li v-for="bullet in block.bullets" :key="bullet"><code>{{ bullet }}</code></li>
              </ul>
            </article>
          </div>
        </section>

        <section class="section reveal-target" id="apis">
          <div class="section-heading">
            <p class="eyebrow">MVP API 規格</p>
            <h2>第一版先把最關鍵的四個入口釘穩</h2>
          </div>

          <div class="api-shell">
            <div class="api-list">
              <button
                v-for="endpoint in Object.values(endpoints)"
                :key="endpoint.id"
                type="button"
                class="api-card reveal-target"
                :class="{ active: activeEndpoint === endpoint.id }"
                @click="activeEndpoint = endpoint.id"
              >
                <p class="method" :class="methodClass(endpoint.method)">{{ endpoint.method }}</p>
                <h3>{{ endpoint.path }}</h3>
                <p>{{ endpoint.summary }}</p>
              </button>
            </div>

            <div class="code-showcase reveal-target">
              <div class="code-header">
                <span>{{ activeEndpointCard.path }}</span>
                <span>{{ activeEndpointCard.method }}</span>
              </div>
              <div class="code-panels">
                <div class="code-panel">
                  <p class="panel-label">Request</p>
                  <pre><code>{{ activeEndpointCard.request }}</code></pre>
                </div>
                <div class="code-panel">
                  <p class="panel-label">Response</p>
                  <pre><code>{{ activeEndpointCard.response }}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section split-section reveal-target">
          <div class="section-heading">
            <p class="eyebrow">資料流</p>
            <h2>從收集到投放，先建立一條最短可行的處理管線</h2>
          </div>

          <div class="stage-shell">
            <div class="stage-rail">
              <button
                v-for="(stage, key) in stages"
                :key="key"
                type="button"
                class="stage-button"
                :class="{ active: activeStage === key }"
                @click="activeStage = key"
              >
                <span>{{ stage.step }}</span>
                <strong>{{ stage.title }}</strong>
              </button>
            </div>

            <article class="stage-preview reveal-target">
              <p class="eyebrow">目前焦點</p>
              <h3>{{ activeStageCard.step }} {{ activeStageCard.title }}</h3>
              <p>{{ activeStageCard.body }}</p>
            </article>
          </div>
        </section>

        <section class="section roadmap-section reveal-target" id="roadmap">
          <div class="section-heading">
            <p class="eyebrow">實作順序</p>
            <h2>先把最值錢的事情做好，不急著把系統做滿</h2>
          </div>
          <ol class="roadmap-list">
            <li v-for="item in roadmap" :key="item">{{ item }}</li>
          </ol>
        </section>

        <section class="section footer-panel reveal-target">
          <div class="quote-card reveal-target">
            <p class="eyebrow">一句話總結</p>
            <p class="quote">
              用 Cloudflare Worker + Hono 當邊界層，前面接 LINE Bot，後面開受 Token 保護的 API 給 OpenClaw 定期呼叫，
              會比讓 LINE 直接碰 OpenClaw 更安全，也更容易維護。
            </p>
          </div>
          <div class="links-card reveal-target">
            <h3>官方文件入口</h3>
            <ul>
              <li v-for="doc in docs" :key="doc.href">
                <a :href="doc.href" target="_blank" rel="noreferrer">{{ doc.label }}</a>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  `
}).mount('#app')
