use crate::automation::domain::{Comment, CommentId};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// Command payload produced by upstream scrapers or manual importers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestCommand {
    pub batch_id: String,
    pub comments: Vec<Comment>,
    pub deduplicate: bool,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RejectedComment {
    pub comment_id: Option<CommentId>,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestOutcome {
    pub accepted: Vec<CommentId>,
    pub rejected: Vec<RejectedComment>,
}

#[async_trait]
pub trait CommentIngestService: Send + Sync {
    async fn ingest(&self, command: IngestCommand) -> anyhow::Result<IngestOutcome>;
}
