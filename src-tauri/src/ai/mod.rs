// src-tauri/src/ai/mod.rs
pub mod config;
pub mod provider;
pub mod providers {
    pub mod hunyuan;
    pub mod openai;
}
pub mod router;
pub mod types;
pub mod commands;
