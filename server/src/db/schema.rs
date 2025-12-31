// server/src/db/schema.rs
// module: lead-server | layer: infrastructure | role: 数据库表结构
// summary: PostgreSQL 表定义

/// 用户表
pub const CREATE_USERS: &str = r#"
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    nickname VARCHAR(64),
    role VARCHAR(16) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
"#;

/// 设备配置表（关联用户）
pub const CREATE_DEVICE_CONFIGS: &str = r#"
CREATE TABLE IF NOT EXISTS device_configs (
    device_id VARCHAR(128) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(16) NOT NULL,
    device_name VARCHAR(64),
    ai_api_key TEXT,
    ai_provider VARCHAR(32),
    config_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
"#;

/// 评论表（按设备隔离）
pub const CREATE_LEAD_COMMENTS: &str = r#"
CREATE TABLE IF NOT EXISTS lead_comments (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(128) NOT NULL,
    platform VARCHAR(16) NOT NULL,
    video_url TEXT,
    author VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    ts BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
"#;

/// 分析结果表
pub const CREATE_LEAD_ANALYSES: &str = r#"
CREATE TABLE IF NOT EXISTS lead_analyses (
    id SERIAL PRIMARY KEY,
    comment_id VARCHAR(64) REFERENCES lead_comments(id) ON DELETE CASCADE,
    intent VARCHAR(32) NOT NULL,
    confidence REAL NOT NULL,
    entities_json JSONB,
    reply_suggestion TEXT,
    tags_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
"#;

/// 服务器公共配置
pub const CREATE_SERVER_CONFIGS: &str = r#"
CREATE TABLE IF NOT EXISTS server_configs (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
"#;

/// 索引定义
pub const INDICES: &[&str] = &[
    "CREATE INDEX IF NOT EXISTS idx_comments_device ON lead_comments(device_id)",
    "CREATE INDEX IF NOT EXISTS idx_comments_platform ON lead_comments(platform)",
    "CREATE INDEX IF NOT EXISTS idx_comments_created ON lead_comments(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_analyses_comment ON lead_analyses(comment_id)",
    "CREATE INDEX IF NOT EXISTS idx_analyses_intent ON lead_analyses(intent)",
    "CREATE INDEX IF NOT EXISTS idx_device_user ON device_configs(user_id)",
];
