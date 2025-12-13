// src-tauri/src/core/shared/config.rs
// module: core/shared | layer: shared | role: configuration
// summary: 应用配置管理

use serde::{Deserialize, Serialize};

/// MCP 服务器配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    /// 是否启用 MCP 服务器
    pub enabled: bool,
    /// 监听端口
    pub port: u16,
    /// 允许的来源 (CORS)
    pub allowed_origins: Vec<String>,
}

impl Default for McpServerConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            port: 3100,
            allowed_origins: vec!["*".to_string()],
        }
    }
}

/// 脚本存储配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptStorageConfig {
    /// 脚本存储目录
    pub scripts_dir: String,
    /// 模板存储目录
    pub templates_dir: String,
}

impl Default for ScriptStorageConfig {
    fn default() -> Self {
        Self {
            scripts_dir: "data/scripts".to_string(),
            templates_dir: "data/templates".to_string(),
        }
    }
}

/// 核心应用配置
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CoreConfig {
    pub mcp: McpServerConfig,
    pub script_storage: ScriptStorageConfig,
}
