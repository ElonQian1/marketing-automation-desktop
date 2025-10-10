use crate::automation::domain::{AiRecommendation, Comment, TaskId};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiRequest {
    pub task_id: TaskId,
    pub comment: Comment,
    pub knowledge_snippets: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiResponse {
    pub recommendation: AiRecommendation,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub latency_ms: u128,
}

#[async_trait]
pub trait AiDispatcher: Send + Sync {
    async fn process(&self, request: AiRequest) -> anyhow::Result<AiResponse>;
}
