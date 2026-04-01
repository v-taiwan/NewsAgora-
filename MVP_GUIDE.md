# Newsagora MVP 實作教學

這份文件的目的不是只告訴你「要做什麼」，而是帶你理解「為什麼這樣做」。

## 1. 我們現在的 MVP 是什麼

先把 MVP 控制在這四個能力：

1. `POST /line/webhook`
   接住 LINE 平台送來的事件。
2. `GET /api/news/pending`
   讓 OpenClaw 可以拉取待處理新聞。
3. `POST /api/news/:id/process`
   讓 OpenClaw 把摘要、關鍵字、題目草稿回寫。
4. `GET /api/polis/payloads`
   讓後續投放流程拿到可發送的題目。

這樣定義 MVP 的好處是：先把資料流打通，再逐步補強安全、資料庫與外部平台串接。

## 2. 專案裡每個關鍵檔案在做什麼

- `src/worker.js`
  Worker API 的主入口，所有路由從這裡開始。
- `wrangler.toml`
  Cloudflare Worker 的設定檔，包含入口檔、環境變數與 D1 綁定。
- `.dev.vars.example`
  本機開發時要用的環境變數範例。
- `schema.sql`
  D1 的資料表結構與示範資料。

## 3. 本機開發怎麼跑

### 步驟 A：準備本機環境變數

建立一份 `.dev.vars`：

```bash
cp .dev.vars.example .dev.vars
```

然後把裡面的 `OPENCLAW_SHARED_TOKEN` 改成你自己的開發 token。

### 步驟 B：啟動 Worker API

```bash
npm run dev:api
```

如果順利，你就會拿到一個本機 Worker 開發網址。

### 步驟 C：先測最小路由

測試首頁：

```bash
curl http://127.0.0.1:8787/
```

測試受保護 API：

```bash
curl -H "Authorization: Bearer 你的token" http://127.0.0.1:8787/api/news/pending
```

如果沒有帶 token，應該回 `401`。這代表你的 API 邊界保護有生效。

## 4. 怎麼串接 Cloudflare

你可以把串接流程理解成四步。

### 第一步：登入 Cloudflare

```bash
npx wrangler login
```

這會讓你的本機 Wrangler 取得 Cloudflare 帳號權限。

### 第二步：建立 D1 資料庫

```bash
npx wrangler d1 create newsagora-mvp
```

執行後，Cloudflare 會回傳一個 `database_id`。把它貼回 `wrangler.toml` 的 `database_id` 欄位。

### 第三步：把 schema 套進 D1

本機資料庫：

```bash
npx wrangler d1 execute newsagora-mvp --local --file=schema.sql
```

遠端資料庫：

```bash
npx wrangler d1 execute newsagora-mvp --remote --file=schema.sql
```

### 第四步：部署 Worker

```bash
npm run deploy:api
```

部署成功後，你會得到一個 `*.workers.dev` 網址，這就是未來 LINE webhook 或 OpenClaw 要打的 API 入口。

## 5. 你要怎麼把 Cloudflare 想清楚

請先記住這個心智模型：

- Cloudflare Worker = 你的 API 入口與安全邊界
- D1 = 你的 MVP 資料庫
- Wrangler = 你在本機跟 Cloudflare 溝通的工具

也就是說，真正暴露在外面的不是 OpenClaw，也不是資料庫，而是 Worker。
這樣架構比較安全，也比較容易逐步擴充。

## 6. 我建議你的實作順序

1. 先讓 `npm run dev:api` 可以正常啟動。
2. 再測通 `GET /api/news/pending`。
3. 接著實作真正的 LINE signature 驗證。
4. 再把 `mockNewsItems` 改成 D1 查詢。
5. 最後才接 LINE Messaging API 與真正的 OpenClaw 排程。

## 7. 下一課要做什麼

最值得立刻做的下一步是：

實作 `POST /line/webhook` 的 LINE signature 驗證。

原因很簡單，這是你從「示意骨架」走向「真實可上線系統」的第一個關鍵門檻。
