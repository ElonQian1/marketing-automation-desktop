use crate::automation::domain::{
    CommentId, DeviceAccount, Task, TaskAction, TaskId, TaskPriority, TaskStatus,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TaskFilter {
    pub status: Option<TaskStatus>,
    pub action: Option<TaskAction>,
    pub device_account_id: Option<String>,
    pub created_after: Option<DateTime<Utc>>,
    pub created_before: Option<DateTime<Utc>>,
    pub limit: Option<u32>,
}

#[async_trait]
pub trait TaskLifecycleService: Send + Sync {
    async fn create_from_comment(
        &self,
        comment_id: CommentId,
        action: TaskAction,
    ) -> anyhow::Result<TaskId>;

    async fn update_status(
        &self,
        task_id: &TaskId,
        status: TaskStatus,
        error: Option<String>,
    ) -> anyhow::Result<()>;

    async fn attach_ai_recommendation(
        &self,
        task_id: &TaskId,
        recommendation: crate::automation::domain::AiRecommendation,
    ) -> anyhow::Result<()>;
}

#[async_trait]
pub trait TaskAssignmentService: Send + Sync {
    async fn reserve_for_device(
        &self,
        task_id: &TaskId,
        device: &DeviceAccount,
        lease_seconds: u64,
    ) -> anyhow::Result<()>;

    async fn release(&self, task_id: &TaskId) -> anyhow::Result<()>;

    async fn reprioritize(
        &self,
        task_id: &TaskId,
        new_priority: TaskPriority,
    ) -> anyhow::Result<()>;
}

#[async_trait]
pub trait TaskQueryService: Send + Sync {
    async fn fetch_next(
        &self,
        priority_floor: TaskPriority,
    ) -> anyhow::Result<Option<Task>>;

    async fn list(&self, filter: TaskFilter) -> anyhow::Result<Vec<Task>>;
}
