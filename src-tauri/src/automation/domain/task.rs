use super::ai::AiRecommendation;
use super::comment::CommentId;
use super::device::DeviceAccount;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TaskId(pub String);

impl TaskId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    pub fn random() -> Self {
        Self(Uuid::new_v4().to_string())
    }
}

/// Actions that can be executed against a task.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskAction {
    Reply,
    Follow,
    Ignore,
    Escalate,
}

/// Priority bucket calculated jointly by rules and AI.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum TaskPriority {
    P0,
    P1,
    P2,
    P3,
}

impl Default for TaskPriority {
    fn default() -> Self {
        TaskPriority::P2
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    New,
    Queued,
    AiEnriched,
    Assigned,
    Executing,
    Done,
    Ignored,
    Failed,
    Expired,
}

/// Task aggregates the comment, AI recommendation and execution metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: TaskId,
    pub action: TaskAction,
    pub comment_id: Option<CommentId>,
    pub target_user_id: Option<String>,
    pub assigned_device: Option<DeviceAccount>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub deadline: Option<DateTime<Utc>>,
    pub queued_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub lock_owner: Option<String>,
    pub lock_expires_at: Option<DateTime<Utc>>,
    pub attempts: u32,
    pub last_error: Option<String>,
    pub ai_recommendation: Option<AiRecommendation>,
}

impl Task {
    pub fn new(action: TaskAction) -> Self {
        let now = Utc::now();
        Self {
            id: TaskId::random(),
            action,
            comment_id: None,
            target_user_id: None,
            assigned_device: None,
            status: TaskStatus::New,
            priority: TaskPriority::default(),
            deadline: None,
            queued_at: now,
            updated_at: now,
            lock_owner: None,
            lock_expires_at: None,
            attempts: 0,
            last_error: None,
            ai_recommendation: None,
        }
    }

    pub fn with_comment(mut self, comment_id: CommentId) -> Self {
        self.comment_id = Some(comment_id);
        self
    }

    pub fn with_target_user(mut self, target_user_id: String) -> Self {
        self.target_user_id = Some(target_user_id);
        self
    }
}
