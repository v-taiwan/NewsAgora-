# Cloudflare 方案 1 實作指南

這份方案的定義是：

- 自動化主幹全部放在 Cloudflare
- `pol.is / polis.tw` 當作外部投票服務
- `LINE Bot` 當作最後的通知與互動出口

## 1. 這條流程怎麼跑

完整資料流如下：

1. 你匯入一則新聞
2. Worker 將新聞寫入 `D1`
3. Worker 把處理任務送進 `Queue`
4. Queue consumer 啟動 `Workflow`
5. Workflow 呼叫 `Workers AI` 產生摘要、關鍵字、投票題目與 statements
6. Workflow 嘗試呼叫 `pol.is` API 建立投票
7. Workflow 呼叫 `LINE Messaging API` 把摘要與投票連結推回給使用者

這樣設計的關鍵好處是：

- LINE webhook 不會被長流程卡住
- AI 失敗時可以靠 Workflow 重試
- pol.is 或 LINE 暫時失敗時可以單獨觀察與補救
- 所有狀態都能落在 D1

## 2. 目前專案已經補上的骨架

- `src/worker.js`
  現在已經包含：
  - `POST /api/news/import`
  - `GET /api/news/pending`
  - `GET /api/jobs/:id`
  - `GET /api/polis/payloads`
  - Queue consumer
  - Workflow class `NewsPipelineWorkflow`
- `wrangler.toml`
  已經補上：
  - `D1` binding
  - `Queue` producer / consumer
  - `Workflow` binding
  - `Workers AI` binding
- `.dev.vars.example`
  放本機開發要用的 secrets 範例
- `schema.sql`
  已經補上：
  - `news_items`
  - `ai_summaries`
  - `processing_jobs`
  - `polls`

## 3. 你要怎麼理解這個 MVP

### `POST /api/news/import`

這是你手動匯入新聞的入口。

送進來之後，不會同步等摘要完成，而是先：

1. 存新聞
2. 建 job
3. 丟 queue
4. 立刻回傳 `jobId`

這樣前端或管理介面就不會卡住。

### Queue

Queue 的責任很單純：

- 把同步請求改成非同步流程
- 幫你把匯入事件跟後續 AI 任務解耦

Cloudflare 官方文件也明確強調 Queues 適合解耦系統元件，並支援 guaranteed delivery、batching 與重試。
來源：
- [Cloudflare Queues](https://developers.cloudflare.com/queues/reference/how-queues-works/)
- [Wrangler queue config](https://developers.cloudflare.com/workers/wrangler/configuration/)

### Workflow

Workflow 的責任是把多步驟流程變成可追蹤、可重試、可持久化的任務。

這個專案裡，Workflow 目前負責：

1. 載入新聞與 job
2. 呼叫 Workers AI 生成摘要與投票題目
3. 寫回 D1
4. 呼叫 pol.is
5. 呼叫 LINE push message
6. 更新 job 狀態

Cloudflare 官方文件說明，Workflow 透過 `step.do()` 可以讓每個步驟可個別重試，而且 Workflow 可由 Worker 透過 binding 的 `create()` 啟動。
來源：
- [Cloudflare Workflows Workers API](https://developers.cloudflare.com/workflows/build/workers-api/)
- [Trigger Workflows](https://developers.cloudflare.com/workflows/build/trigger-workflows/)

### Workers AI

Workers AI 目前用 binding 的 `env.AI.run()` 來跑模型。

官方文件目前提供的標準型式是：

- 在 `wrangler.toml` 裡加 `[ai] binding = "AI"`
- 在 Worker 裡使用 `await env.AI.run(model, input)`

來源：
- [Workers AI bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/)

## 4. 關於 pol.is，我們現在採取的策略

這裡我要特別像老師一樣提醒你：

這一段現在是「可整合骨架」，不是「已確認可直接上線的正式 API 實作」。

原因是公開可確認的資訊顯示：

- `pro.pol.is` 提到有 `Bulk upload seed statements (CSV/API)`
- 也提到有 `Raw data export via API`

但這不足以證明你目前帳號一定能直接用同一套公開 API 自動建立 conversation。
所以程式目前先保留：

- `POLIS_API_BASE`
- `POLIS_API_TOKEN`

只要你後面拿到實際可用的 API 規格，我們就能把這段補成正式版。

來源：
- [pro.pol.is](https://pro.pol.is/)

## 5. LINE 這邊的實作原則

這條方案不要把長流程塞在 reply token 裡。

LINE 官方文件明確提醒：

- reply token 只能使用一次
- 原則上應在收到 webhook 後一分鐘內使用
- 建議 webhook 事件非同步處理

所以這個方案裡，我們把真正的摘要與投票連結改成 `push message`，比較穩。

來源：
- [LINE Messaging API reference](https://developers.line.biz/en/reference/messaging-api/nojs/)
- [Receive messages (webhook)](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)

## 6. 你下一步要在 Cloudflare 上做什麼

1. 建立 D1 database
2. 建立 queue `news-pipeline-queue`
3. 在 Cloudflare 帳號中啟用 Workers AI binding
4. 把 `wrangler.toml` 的 `database_id` 換成真的 D1 id
5. 在本機建立 `.dev.vars`
6. 用 `wrangler secret put` 補上正式環境 secrets
7. 執行 `schema.sql`
8. 部署 worker

對應指令可以先記這幾個：

```bash
npx wrangler d1 create newsagora-mvp
npx wrangler queues create news-pipeline-queue
npx wrangler secret put OPENCLAW_SHARED_TOKEN
npx wrangler secret put POLIS_API_TOKEN
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
```

## 7. 這一版最誠實的狀態

現在這版已經是「正確方向的工程骨架」。

它已經足夠讓你學會：

- Cloudflare 怎麼扛整條自動化主流程
- Queue 跟 Workflow 怎麼分工
- Workers AI 怎麼插進內容處理流程
- D1 怎麼承接狀態

但還有兩塊要等下一課補完：

1. LINE webhook signature 驗證
2. pol.is 實際 API 規格接線
