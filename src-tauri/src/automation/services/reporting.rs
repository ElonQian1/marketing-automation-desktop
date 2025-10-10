use crate::automation::domain::{DailySummary, FollowLogEntry, ReplyLogEntry};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportType {
    FollowLog,
    ReplyLog,
    DailySummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportRequest {
    pub report_type: ReportType,
    pub date: String, // YYYY-MM-DD
    pub destination: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportPayload {
    Follow(Vec<FollowLogEntry>),
    Reply(Vec<ReplyLogEntry>),
    Summary(DailySummary),
}

#[async_trait]
pub trait ReportingService: Send + Sync {
    async fn generate(&self, request: ReportRequest) -> anyhow::Result<ReportPayload>;
}
