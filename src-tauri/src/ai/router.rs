// src-tauri/src/ai/router.rs
use crate::ai::{
    config::AISettings,
    provider::AIProvider,
    providers::{hunyuan::HunyuanProvider, openai::OpenAIProvider},
    types::*,
};
use anyhow::Result;
use serde_json::Value;
use std::sync::Arc;

pub enum ProviderEnum {
    OpenAI(Arc<OpenAIProvider>),
    Hunyuan(Arc<HunyuanProvider>),
}

pub struct AIRouter {
    pub p: ProviderEnum,
    pub settings: AISettings,
}

impl AIRouter {
    pub fn new(settings: AISettings) -> Self {
        let p = match settings.provider.as_str() {
            "hunyuan" => ProviderEnum::Hunyuan(Arc::new(HunyuanProvider::new(
                settings.hunyuan_api_key.clone(),
                settings
                    .base_url_hunyuan
                    .clone()
                    .unwrap_or_else(|| "https://api.hunyuan.cloud.tencent.com/v1".into()),
            ))),
            _ => ProviderEnum::OpenAI(Arc::new(OpenAIProvider::new(
                settings.openai_api_key.clone(),
                settings
                    .base_url_openai
                    .clone()
                    .unwrap_or_else(|| "https://api.openai.com/v1".into()),
            ))),
        };
        Self { p, settings }
    }

    pub async fn chat<F: Fn(super::provider::ChatChunk) + Send + 'static>(
        &self,
        req: ChatRequest,
        on_stream: Option<F>,
    ) -> Result<Value> {
        match &self.p {
            ProviderEnum::OpenAI(p) => {
                p.chat(req, on_stream.map(|f| Box::new(f) as _)).await
            }
            ProviderEnum::Hunyuan(p) => {
                p.chat(req, on_stream.map(|f| Box::new(f) as _)).await
            }
        }
    }

    pub async fn embed(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>> {
        match &self.p {
            ProviderEnum::OpenAI(p) => p.embeddings(model, input).await,
            ProviderEnum::Hunyuan(p) => p.embeddings(model, input).await,
        }
    }
}
