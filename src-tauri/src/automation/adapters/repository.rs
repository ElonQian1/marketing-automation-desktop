use crate::automation::domain::{Comment, CommentId, TaskAction, TaskId};
use chrono::Utc;
use tauri::AppHandle;

use crate::services::marketing_storage::models::{
    CommentPayload, ExecutorMode, MarketingPlatform, TaskPayload, TaskResultCode, TaskStatus,
    TaskType,
};
use crate::services::marketing_storage::repositories as repo;

/// Thin adapter that bridges the new automation layer with the existing
/// marketing storage repositories.
#[derive(Clone)]
pub struct MarketingStorageAdapter {
    app_handle: AppHandle,
}

impl MarketingStorageAdapter {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    fn conn(&self) -> anyhow::Result<rusqlite::Connection> {
        repo::get_connection(&self.app_handle).map_err(anyhow::Error::from)
    }

    /// Persist a comment in the marketing storage schema.
    pub fn save_comment(&self, comment: &Comment) -> anyhow::Result<CommentId> {
        let conn = self.conn()?;
        let video_id = comment.video.video_id.clone();
        let source_target_id = comment
            .source_target_id
            .clone()
            .ok_or_else(|| anyhow::anyhow!("missing source_target_id for comment {}", comment.id.0))?;

        let payload = CommentPayload {
            platform: MarketingPlatform::from(comment.platform.clone()),
            video_id,
            author_id: comment.author_id.clone(),
            content: comment.content.clone(),
            like_count: comment.like_count.map(|v| v as i32),
            publish_time: comment.publish_time.to_rfc3339(),
            region: comment.region.clone(),
            source_target_id,
        };

        let id = repo::insert_comment(&conn, &payload)?;
        Ok(CommentId::new(id))
    }

    /// Create a task referencing an existing comment and assign it to an account.
    pub fn queue_task(
        &self,
        comment_id: &CommentId,
        action: TaskAction,
        assign_account_id: &str,
        dedup_key: Option<String>,
    ) -> anyhow::Result<TaskId> {
        let conn = self.conn()?;

        let task_type_str = match action {
            TaskAction::Reply => "reply",
            TaskAction::Follow => "follow",
            TaskAction::Ignore => "ignore",
            TaskAction::Escalate => "escalate",
        };

        let payload = TaskPayload {
            task_type: TaskType::from(task_type_str.to_string()),
            comment_id: Some(comment_id.0.clone()),
            target_user_id: None,
            assign_account_id: assign_account_id.to_string(),
            executor_mode: ExecutorMode::Manual,
            dedup_key: dedup_key.unwrap_or_else(|| format!("task:{}", comment_id.0)),
            priority: None,
            deadline_at: None,
        };

        let id = repo::insert_task(&conn, &payload)?;
        Ok(TaskId::new(id))
    }

    /// Helper for generating synthetic dedup keys when none provided.
    pub fn derive_dedup_key(&self, comment: &Comment, action: TaskAction) -> String {
        let scope = match action {
            TaskAction::Reply => "reply",
            TaskAction::Follow => "follow",
            TaskAction::Ignore => "ignore",
            TaskAction::Escalate => "escalate",
        };
        format!(
            "{}:{}:{}:{}",
            scope,
            comment.platform,
            comment.author_id,
            comment.publish_time.format("%Y%m%d%H%M%S")
        )
    }

    /// Update task status after execution.
    pub fn mark_task_result(
        &self,
        task_id: &TaskId,
        status: &str,
        result_code: Option<String>,
        error: Option<String>,
    ) -> anyhow::Result<()> {
        let conn = self.conn()?;
        repo::update_task_status(
            &conn,
            &task_id.0,
            TaskStatus::from(status.to_string()),
            result_code.map(TaskResultCode::from),
            error.as_deref(),
        )?;
        Ok(())
    }

    /// Reserve dedup key with default TTL (1 day) to avoid duplicate actions.
    pub fn reserve_dedup(
        &self,
        key: &str,
        scope: &str,
        ttl_days: i64,
        account_id: Option<&str>,
    ) -> anyhow::Result<bool> {
        let conn = self.conn()?;
        let reserved = repo::check_and_reserve_dedup(&conn, key, scope, ttl_days, account_id)?;
        Ok(reserved)
    }

    /// Convenience API to generate a follow-up daily summary row placeholder.
    pub fn ensure_daily_report_placeholder(&self, date: &str) -> anyhow::Result<()> {
        let conn = self.conn()?;
        let sql = r#"
INSERT OR IGNORE INTO daily_reports (id, date, follow_count, reply_count, file_path, created_at)
VALUES (?1, ?2, 0, 0, '', datetime('now'))
"#;
        let id = format!("rep_{}", Utc::now().timestamp_micros());
        conn.execute(sql, rusqlite::params![id, date])?;
        Ok(())
    }
}
