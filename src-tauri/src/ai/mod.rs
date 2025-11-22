// src-tauri/src/ai/mod.rs
pub mod ai_config;
pub mod provider;
pub mod providers {
    pub mod hunyuan;
    pub mod openai;
}
pub mod router;
pub mod ai_types;
pub mod commands;
