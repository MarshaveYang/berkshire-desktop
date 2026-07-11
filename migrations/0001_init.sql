-- 报告表：保存每一次技能运行生成的研究报告
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,               -- uuid
  skill_id TEXT NOT NULL,            -- 对应 skills/manifest.json 中的 id
  skill_name TEXT NOT NULL,          -- 冗余存储，方便列表展示不用再查 manifest
  ticker TEXT NOT NULL,              -- 用户输入的股票代码/公司名/行业词
  title TEXT NOT NULL,               -- 报告标题（一般是 “{ticker} · {skill_name}”）
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | done | error
  provider TEXT NOT NULL,            -- claude | openai | deepseek
  model TEXT,                        -- 具体模型名
  content TEXT,                      -- 生成的 Markdown 正文
  error_message TEXT,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_skill_id ON reports (skill_id);
CREATE INDEX IF NOT EXISTS idx_reports_ticker ON reports (ticker);
