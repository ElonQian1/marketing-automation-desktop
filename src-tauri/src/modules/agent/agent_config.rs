// src-tauri/src/modules/agent/agent_config.rs
// module: agent | layer: infrastructure | role: config-persistence
// summary: AI Agent 配置持久化 - 保存/加载 API Key 和提供商设置

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tracing::{debug, info, warn};

/// Agent 配置（不包含敏感的 API Key）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// AI 提供商类型: "openai", "hunyuan", "deepseek", "custom"
    pub provider: String,
    /// 自定义 base_url（仅 custom 模式）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    /// 模型名称
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
}

impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            provider: "hunyuan".to_string(),
            base_url: None,
            model: None,
        }
    }
}

/// keyring 服务名
const KEYRING_SERVICE: &str = "employee-gui-agent";

/// 配置文件名
const CONFIG_FILE_NAME: &str = "agent_config.json";

/// 获取配置文件路径
fn config_path() -> Result<PathBuf> {
    // 使用 Tauri 的 app_data_dir
    // 路径类似: C:\Users\xxx\AppData\Roaming\employee-gui\
    let dir = dirs::data_dir()
        .ok_or_else(|| anyhow::anyhow!("无法获取数据目录"))?
        .join("employee-gui");
    
    std::fs::create_dir_all(&dir).context("创建配置目录失败")?;
    Ok(dir.join(CONFIG_FILE_NAME))
}

/// 保存 API Key 到系统凭据库
pub fn save_api_key(provider: &str, api_key: &str) -> Result<()> {
    let key_name = format!("agent_{}_key", provider);
    keyring::Entry::new(KEYRING_SERVICE, &key_name)
        .context("创建 keyring entry 失败")?
        .set_password(api_key)
        .context("保存 API Key 到 keyring 失败")?;
    
    info!("🔐 已保存 {} API Key 到系统凭据库", provider);
    Ok(())
}

/// 从系统凭据库加载 API Key
pub fn load_api_key(provider: &str) -> Result<String> {
    let key_name = format!("agent_{}_key", provider);
    let password = keyring::Entry::new(KEYRING_SERVICE, &key_name)
        .context("创建 keyring entry 失败")?
        .get_password()
        .context("从 keyring 读取 API Key 失败")?;
    
    debug!("🔓 已从系统凭据库加载 {} API Key", provider);
    Ok(password)
}

/// 删除保存的 API Key
pub fn delete_api_key(provider: &str) -> Result<()> {
    let key_name = format!("agent_{}_key", provider);
    if let Ok(entry) = keyring::Entry::new(KEYRING_SERVICE, &key_name) {
        // keyring 2.x 使用 delete_password() 或直接忽略错误
        let _ = entry.delete_password();
    }
    Ok(())
}

/// 保存配置（不包含 API Key）
pub fn save_config(config: &AgentConfig) -> Result<()> {
    let path = config_path()?;
    let content = serde_json::to_string_pretty(config)
        .context("序列化配置失败")?;
    
    std::fs::write(&path, content)
        .context("写入配置文件失败")?;
    
    info!("💾 已保存 Agent 配置到 {:?}", path);
    Ok(())
}

/// 加载配置
pub fn load_config() -> Option<AgentConfig> {
    let path = match config_path() {
        Ok(p) => p,
        Err(e) => {
            warn!("获取配置路径失败: {}", e);
            return None;
        }
    };

    if !path.exists() {
        debug!("Agent 配置文件不存在");
        return None;
    }

    match std::fs::read_to_string(&path) {
        Ok(content) => {
            match serde_json::from_str::<AgentConfig>(&content) {
                Ok(config) => {
                    debug!("📂 已加载 Agent 配置: provider={}", config.provider);
                    Some(config)
                }
                Err(e) => {
                    warn!("解析配置文件失败: {}", e);
                    None
                }
            }
        }
        Err(e) => {
            warn!("读取配置文件失败: {}", e);
            None
        }
    }
}

/// 检查是否有保存的有效配置
pub fn has_saved_config() -> bool {
    if let Some(config) = load_config() {
        // 检查是否有对应的 API Key
        load_api_key(&config.provider).is_ok()
    } else {
        false
    }
}

/// 完整配置（包含 API Key，仅用于内部传递）
#[derive(Debug, Clone)]
pub struct FullAgentConfig {
    pub provider: String,
    pub api_key: String,
    pub base_url: Option<String>,
    pub model: Option<String>,
}

/// 加载完整配置（配置 + API Key）
pub fn load_full_config() -> Option<FullAgentConfig> {
    let config = load_config()?;
    let api_key = load_api_key(&config.provider).ok()?;
    
    Some(FullAgentConfig {
        provider: config.provider,
        api_key,
        base_url: config.base_url,
        model: config.model,
    })
}
