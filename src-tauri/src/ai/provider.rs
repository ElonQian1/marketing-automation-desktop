// src-tauri/src/ai/provider.rs
use async_trait::async_trait;
use crate::ai::ai_types::*;
use anyhow::Result;
use serde_json::Value;

#[derive(Debug)]
pub struct ChatChunk {
    pub delta: String,
}

#[async_trait]
pub trait AIProvider: Send + Sync {
    async fn chat(
        &self,
        req: ChatRequest,
        on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>,
    ) -> Result<Value>;
    
    async fn embeddings(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>>;
}
