use std::sync::Arc;
use std::time::Duration;

use crate::automation::domain::{
    AiClassification, AiIntent, AiPriority, AiRecommendation, AiReplyOption,
};
use crate::automation::services::{AiDispatcher, AiRequest, AiResponse};
use async_trait::async_trait;
use reqwest::Client;
use tracing::{debug, warn};

#[derive(Clone)]
pub struct OpenAiClient {
    api_key: String,
    model: String,
    base_url: String,
    http: Arc<Client>,
    timeout: Duration,
}

impl OpenAiClient {
    pub fn new(api_key: String, model: impl Into<String>) -> anyhow::Result<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?;

        Ok(Self {
            api_key,
            model: model.into(),
            base_url: "https://api.openai.com/v1".to_string(),
            http: Arc::new(client),
            timeout: Duration::from_secs(30),
        })
    }

    pub fn from_env() -> anyhow::Result<Self> {
        let api_key = std::env::var("OPENAI_API_KEY")
            .map_err(|_| anyhow::anyhow!("OPENAI_API_KEY not set"))?;
        let model = std::env::var("OPENAI_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string());
        Self::new(api_key, model)
    }

    pub fn with_base_url(mut self, base_url: impl Into<String>) -> Self {
        self.base_url = base_url.into();
        self
    }

    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    /// Internal helper that will eventually call the OpenAI Responses API.
    async fn call_openai(&self, request: &AiRequest) -> anyhow::Result<AiResponse> {
        // TODO: replace with real API call. For now return a deterministic stub to unblock integration.
        warn!(
            "OpenAiClient::call_openai invoked with stub implementation for task {}",
            request.task_id.0
        );

        let recommendation = AiRecommendation {
            classification: AiClassification {
                intent: AiIntent::Other,
                sentiment: 0,
                needs_follow_up: false,
                language: request.comment.language.clone(),
            },
            priority: AiPriority {
                score: 50,
                reason: Some("Stub recommendation".into()),
            },
            action: "reply".to_string(),
            confidence: Some(0.5),
            reply_options: vec![AiReplyOption {
                id: "A".into(),
                text: format!("感谢反馈，后续我们会持续关注：{}", request.comment.content),
                tone: Some("warm".into()),
                confidence: Some(0.5),
            }],
            alerts: Vec::new(),
            model: self.model.clone(),
        };

        Ok(AiResponse {
            recommendation,
            prompt_tokens: 0,
            completion_tokens: 0,
            latency_ms: 0,
        })
    }
}

#[async_trait]
impl AiDispatcher for OpenAiClient {
    async fn process(&self, request: AiRequest) -> anyhow::Result<AiResponse> {
        debug!(
            "Dispatching AI request for task {} with model {}",
            request.task_id.0, self.model
        );

        // In the future we will build the prompt and invoke the API here.
        self.call_openai(&request).await
    }
}
