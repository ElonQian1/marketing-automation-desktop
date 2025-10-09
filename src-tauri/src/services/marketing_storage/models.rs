use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchTargetPayload {
    pub dedup_key: String,
    pub target_type: String,   // enum as string ("user"|"post"|"topic")
    pub platform: String,      // enum as string
    pub id_or_url: String,
    pub title: Option<String>,
    pub source: Option<String>,
    pub industry_tags: Option<String>, // comma separated
    pub region: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchTargetRow {
    pub id: i64,
    pub dedup_key: String,
    pub target_type: String,
    pub platform: String,
    pub id_or_url: String,
    pub title: Option<String>,
    pub source: Option<String>,
    pub industry_tags: Option<String>,
    pub region: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListWatchTargetsQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub platform: Option<String>,
    pub target_type: Option<String>,
}
