CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_summaries (
  id TEXT PRIMARY KEY,
  news_item_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '[]',
  polis_draft TEXT DEFAULT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_item_id) REFERENCES news_items(id)
);

CREATE TABLE IF NOT EXISTS processing_jobs (
  id TEXT PRIMARY KEY,
  news_item_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  source_type TEXT NOT NULL DEFAULT 'manual_import',
  workflow_instance_id TEXT,
  polis_conversation_id TEXT,
  line_delivery_status TEXT,
  line_user_id TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_item_id) REFERENCES news_items(id)
);

CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  processing_job_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'pol.is',
  provider_poll_id TEXT,
  topic TEXT NOT NULL,
  statements_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  poll_url TEXT,
  provider_response_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (processing_job_id) REFERENCES processing_jobs(id)
);

INSERT OR IGNORE INTO news_items (id, title, url, content, status, source)
VALUES (
  'news_001',
  '示範新聞標題',
  'https://example.com/news/1',
  '這裡是 MVP 測試用新聞內容，之後可替換成 RSS 或手動匯入資料。',
  'pending',
  'seed'
);
