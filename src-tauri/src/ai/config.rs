// src-tauri/src/ai/config.rs
use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AISettings {
    pub provider: String, // "openai" | "hunyuan"
    pub default_chat_model: String,
    pub default_embed_model: String,
    pub temperature: f32,
    pub stream: bool,
    pub max_retries: u32,
    pub concurrency: u32, // AI批量请求并发数
    pub base_url_openai: Option<String>,
    pub base_url_hunyuan: Option<String>,
    #[serde(skip)]
    pub openai_api_key: String,
    #[serde(skip)]
    pub hunyuan_api_key: String,
}

impl Default for AISettings {
    fn default() -> Self {
        Self {
            provider: "openai".into(),
            default_chat_model: "gpt-4o-mini".into(),
            default_embed_model: "text-embedding-3-large".into(),
            temperature: 0.2,
            stream: true,
            max_retries: 3,
            concurrency: 4, // 默认4并发
            base_url_openai: None,
            base_url_hunyuan: None,
            openai_api_key: String::new(),
            hunyuan_api_key: String::new(),
        }
    }
}

pub fn config_path() -> Result<PathBuf> {
    let dir = dirs::config_dir()
        .ok_or_else(|| anyhow::anyhow!("Cannot resolve config dir"))?
        .join("marketing-automation-desktop");
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("ai_settings.json"))
}

pub fn load_settings() -> AISettings {
    let p = match config_path() {
        Ok(p) => p,
        Err(_) => return AISettings::default(),
    };
    if let Ok(bytes) = std::fs::read(p) {
        if let Ok(s) = serde_json::from_slice::<AISettings>(&bytes) {
            return s;
        }
    }
    AISettings::default()
}

pub fn save_settings(s: &AISettings) -> Result<()> {
    let p = config_path()?;
    let mut s2 = s.clone();
    // 不落盘密钥
    s2.openai_api_key.clear();
    s2.hunyuan_api_key.clear();
    std::fs::write(p, serde_json::to_vec_pretty(&s2)?)?;
    Ok(())
}
