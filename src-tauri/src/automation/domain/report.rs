use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FollowLogEntry {
    pub followed_at: DateTime<Utc>,
    pub account_id: String,
    pub account_handle: Option<String>,
    pub video_id: Option<String>,
    pub device_id: Option<String>,
    pub operator: String,
    pub source: Option<String>,
    pub remarks: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyLogEntry {
    pub replied_at: DateTime<Utc>,
    pub video_url: Option<String>,
    pub comment_id: String,
    pub comment_author: Option<String>,
    pub comment_content: String,
    pub reply_account_id: String,
    pub reply_content: String,
    pub ai_option_id: Option<String>,
    pub operator: String,
    pub status: String,
    pub modified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySummary {
    pub date: String,
    pub follow_count: u32,
    pub reply_count: u32,
    pub ai_acceptance_rate: Option<f32>,
    pub manual_override_rate: Option<f32>,
    pub filename_follow: Option<String>,
    pub filename_reply: Option<String>,
}
