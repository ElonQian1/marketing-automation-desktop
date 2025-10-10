use serde::{Deserialize, Serialize};

/// Classification labels returned by the AI layer.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AiIntent {
    Inquiry,
    Complaint,
    Praise,
    Spam,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiClassification {
    pub intent: AiIntent,
    pub sentiment: i8, // range -2..=2
    pub needs_follow_up: bool,
    pub language: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiPriority {
    pub score: u8, // 0..=100
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiReplyOption {
    pub id: String,
    pub text: String,
    pub tone: Option<String>,
    pub confidence: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiRecommendation {
    pub classification: AiClassification,
    pub priority: AiPriority,
    pub action: String,
    pub confidence: Option<f32>,
    pub reply_options: Vec<AiReplyOption>,
    pub alerts: Vec<String>,
    pub model: String,
}
