use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Strongly typed identifier for comments.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CommentId(pub String);

impl CommentId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    pub fn random() -> Self {
        Self(Uuid::new_v4().to_string())
    }
}

/// Contextual video information that accompanies a comment.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoContext {
    pub video_id: String,
    pub title: Option<String>,
    pub url: Option<String>,
    pub view_count: Option<i64>,
    pub like_count: Option<i64>,
    pub comment_count: Option<i64>,
    pub published_at: Option<DateTime<Utc>>,
}

/// Normalized comment entity used across ingestion, AI and execution layers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: CommentId,
    pub platform: String,
    pub video: VideoContext,
    pub author_id: String,
    pub author_handle: Option<String>,
    pub content: String,
    pub like_count: Option<i64>,
    pub publish_time: DateTime<Utc>,
    pub region: Option<String>,
    pub language: Option<String>,
    pub source_target_id: Option<String>,
    pub ingested_at: DateTime<Utc>,
}

/// Query parameters used when building task queues.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CommentQuery {
    pub platform: Option<String>,
    pub region: Option<String>,
    pub keywords: Vec<String>,
    pub created_after: Option<DateTime<Utc>>,
    pub created_before: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
}
