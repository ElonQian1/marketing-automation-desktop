// server/src/config.rs
// module: lead-server | layer: infrastructure | role: 配置管理
// summary: 从环境变量加载配置

use anyhow::Result;

#[derive(Debug, Clone)]
pub struct Config {
    /// 服务器监听地址
    pub server_addr: String,
    /// PostgreSQL 数据库连接 URL
    pub database_url: String,
    /// 服务器兜底 AI API Key (可选)
    pub fallback_ai_key: Option<String>,
    /// AI 提供商 (openai/claude/deepseek)
    pub fallback_ai_provider: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        // 尝试加载 .env 文件
        let _ = dotenvy::dotenv();

        Ok(Config {
            server_addr: std::env::var("SERVER_ADDR")
                .unwrap_or_else(|_| "0.0.0.0:8080".to_string()),
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://leadhunt:leadhunt@localhost/leadhunt_db".to_string()),
            fallback_ai_key: std::env::var("FALLBACK_AI_KEY").ok(),
            fallback_ai_provider: std::env::var("FALLBACK_AI_PROVIDER").ok(),
        })
    }
}
