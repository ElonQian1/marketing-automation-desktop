// src-tauri/src/db/schema.rs
// module: lead-hunt | layer: infrastructure | role: 数据库表结构定义
// summary: 定义所有表的schema和类型

/// 评论表
pub const LEAD_COMMENTS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS lead_comments (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,  -- 'douyin' | 'xhs'
    video_url TEXT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    ts INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
"#;

/// 分析结果表
pub const LEAD_ANALYSES_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS lead_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id TEXT NOT NULL,
    intent TEXT NOT NULL,  -- '询价' | '询地址' | '售后' | '咨询' | '无效'
    confidence REAL NOT NULL,
    entities_json TEXT,  -- JSON: {product, quantity, location, phone, priceTarget}
    reply_suggestion TEXT,
    tags_json TEXT,  -- JSON: string[]
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (comment_id) REFERENCES lead_comments(id) ON DELETE CASCADE
)
"#;

/// 回放计划表
pub const REPLAY_PLANS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS replay_plans (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    video_url TEXT NOT NULL,
    author TEXT NOT NULL,
    comment TEXT NOT NULL,
    suggested_reply TEXT,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'running' | 'done' | 'failed'
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (comment_id) REFERENCES lead_comments(id) ON DELETE CASCADE
)
"#;

/// 索引定义
pub const INDICES: &[&str] = &[
    "CREATE INDEX IF NOT EXISTS idx_comments_platform ON lead_comments(platform)",
    "CREATE INDEX IF NOT EXISTS idx_comments_created_at ON lead_comments(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_analyses_comment_id ON lead_analyses(comment_id)",
    "CREATE INDEX IF NOT EXISTS idx_analyses_intent ON lead_analyses(intent)",
    "CREATE INDEX IF NOT EXISTS idx_plans_status ON replay_plans(status)",
    "CREATE INDEX IF NOT EXISTS idx_plans_created_at ON replay_plans(created_at)",
];
