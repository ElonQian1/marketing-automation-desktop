use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Filters used when transforming comments into executable tasks.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentPolicy {
    pub keywords: Vec<String>,
    pub region_whitelist: Vec<String>,
    pub min_like_count: Option<i64>,
    pub max_age_hours: Option<i64>,
}

impl Default for CommentPolicy {
    fn default() -> Self {
        Self {
            keywords: Vec::new(),
            region_whitelist: Vec::new(),
            min_like_count: None,
            max_age_hours: Some(24),
        }
    }
}

impl CommentPolicy {
    pub fn accepts(
        &self,
        content: &str,
        region: Option<&str>,
        publish_time: DateTime<Utc>,
        like_count: Option<i64>,
    ) -> bool {
        if let Some(max_age) = self.max_age_hours {
            if publish_time < Utc::now() - chrono::Duration::hours(max_age) {
                return false;
            }
        }

        if let Some(min_likes) = self.min_like_count {
            if like_count.unwrap_or(0) < min_likes {
                return false;
            }
        }

        if !self.region_whitelist.is_empty() {
            match region {
                Some(r) if self.region_whitelist.iter().any(|allow| allow == r) => {}
                _ => return false,
            }
        }

        if self.keywords.is_empty() {
            return true;
        }

        self.keywords.iter().any(|kw| content.contains(kw))
    }
}
