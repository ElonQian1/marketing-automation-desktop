use tauri::AppHandle;
use super::models::{
    WatchTargetPayload, WatchTargetRow, ListWatchTargetsQuery,
    CommentPayload, CommentRow, ListCommentsQuery,
    TaskPayload, TaskRow, ListTasksQuery, TaskStatus, TaskType, TaskResultCode,
    AuditLogPayload,
    ReplyTemplatePayload, ReplyTemplateRow, ListReplyTemplatesQuery,
    MarketingPlatform, TargetType,
};
use super::repositories as repo;

pub struct MarketingStorageFacade;

impl MarketingStorageFacade {
    // ==================== 候选池相关 ====================

    pub fn bulk_upsert_watch_targets(app_handle: &AppHandle, payloads: Vec<WatchTargetPayload>) -> Result<usize, String> {
        let mut conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::bulk_upsert_watch_targets(&mut conn, &payloads).map_err(|e| e.to_string())
    }

    pub fn get_watch_target_by_dedup_key(app_handle: &AppHandle, dedup_key: &str) -> Result<Option<WatchTargetRow>, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::get_watch_target_by_dedup_key(&conn, dedup_key).map_err(|e| e.to_string())
    }

    pub fn list_watch_targets(
        app_handle: &AppHandle,
        limit: Option<i64>,
        offset: Option<i64>,
        platform: Option<MarketingPlatform>,
        target_type: Option<TargetType>,
    ) -> Result<Vec<WatchTargetRow>, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        let q = ListWatchTargetsQuery { limit, offset, platform, target_type };
        repo::list_watch_targets(&conn, &q).map_err(|e| e.to_string())
    }

    pub fn update_watch_target(
        app_handle: &AppHandle,
        id: &str,
        title: Option<&str>,
        industry_tags: Option<&str>,
        region: Option<&str>,
        notes: Option<&str>,
        last_fetch_at: Option<&str>,
    ) -> Result<(), String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::update_watch_target(
            &conn,
            id,
            title,
            industry_tags,
            region,
            notes,
            last_fetch_at,
        ).map_err(|e| e.to_string())
    }

    // ==================== 评论相关 ====================

    pub fn insert_comment(app_handle: &AppHandle, comment: CommentPayload) -> Result<String, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::insert_comment(&conn, &comment).map_err(|e| e.to_string())
    }

    pub fn list_comments(
        app_handle: &AppHandle,
        limit: Option<i64>,
        offset: Option<i64>,
        platform: Option<MarketingPlatform>,
        source_target_id: Option<String>,
        region: Option<String>,
    ) -> Result<Vec<CommentRow>, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        let q = ListCommentsQuery { limit, offset, platform, source_target_id, region };
        repo::list_comments(&conn, &q).map_err(|e| e.to_string())
    }

    // ==================== 任务相关 ====================

    pub fn insert_task(app_handle: &AppHandle, task: TaskPayload) -> Result<String, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::insert_task(&conn, &task).map_err(|e| e.to_string())
    }

    pub fn update_task_status(
        app_handle: &AppHandle,
        task_id: &str,
        status: TaskStatus,
        result_code: Option<TaskResultCode>,
        error_message: Option<&str>,
    ) -> Result<(), String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::update_task_status(&conn, task_id, status, result_code, error_message).map_err(|e| e.to_string())
    }

    pub fn list_tasks(
        app_handle: &AppHandle,
        limit: Option<i64>,
        offset: Option<i64>,
        status: Option<TaskStatus>,
        task_type: Option<TaskType>,
        assign_account_id: Option<String>,
    ) -> Result<Vec<TaskRow>, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        let q = ListTasksQuery { limit, offset, status, task_type, assign_account_id };
        repo::list_tasks(&conn, &q).map_err(|e| e.to_string())
    }

    pub fn lock_next_ready_task(
        app_handle: &AppHandle,
        account_id: &str,
        lease_seconds: Option<i64>,
    ) -> Result<Option<TaskRow>, String> {
        let mut conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        let lease = lease_seconds.unwrap_or(120);
        repo::lock_next_ready_task(&mut conn, account_id, lease).map_err(|e| e.to_string())
    }

    pub fn mark_task_result(
        app_handle: &AppHandle,
        task_id: &str,
        result_code: Option<TaskResultCode>,
        error_message: Option<&str>,
    ) -> Result<(), String> {
        let mut conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::mark_task_result(&mut conn, task_id, result_code, error_message).map_err(|e| e.to_string())
    }

    // ==================== 审计日志相关 ====================

    pub fn insert_audit_log(app_handle: &AppHandle, log: AuditLogPayload) -> Result<String, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::insert_audit_log(&conn, &log).map_err(|e| e.to_string())
    }

    pub fn check_and_reserve_dedup(
        app_handle: &AppHandle,
        key: &str,
        scope: &str,
        ttl_days: i64,
        by_account: Option<&str>,
    ) -> Result<bool, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::check_and_reserve_dedup(&conn, key, scope, ttl_days, by_account).map_err(|e| e.to_string())
    }

    pub fn query_audit_logs(
        app_handle: &AppHandle,
        start_time: Option<&str>,
        end_time: Option<&str>,
        action_filter: Option<&str>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<serde_json::Value>, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::query_audit_logs(&conn, start_time, end_time, action_filter, limit.unwrap_or(100), offset.unwrap_or(0)).map_err(|e| e.to_string())
    }

    pub fn export_audit_logs(
        app_handle: &AppHandle,
        start_time: Option<&str>,
        end_time: Option<&str>,
        format: Option<&str>,
    ) -> Result<String, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::export_audit_logs(&conn, start_time, end_time, format.unwrap_or("csv")).map_err(|e| e.to_string())
    }

    pub fn cleanup_expired_audit_logs(
        app_handle: &AppHandle,
        retention_days: i64,
    ) -> Result<i64, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::cleanup_expired_audit_logs(&conn, retention_days).map_err(|e| e.to_string())
    }

    pub fn batch_store_audit_logs(
        app_handle: &AppHandle,
        logs: Vec<AuditLogPayload>,
    ) -> Result<i64, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::batch_store_audit_logs(&conn, &logs).map_err(|e| e.to_string())
    }

    // ==================== 回复模板相关 ====================

    pub fn insert_reply_template(
        app_handle: &AppHandle,
        payload: ReplyTemplatePayload,
    ) -> Result<String, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::insert_reply_template(&conn, &payload).map_err(|e| e.to_string())
    }

    pub fn list_reply_templates(
        app_handle: &AppHandle,
        limit: Option<i64>,
        offset: Option<i64>,
        channel: Option<String>,
        enabled: Option<bool>,
    ) -> Result<Vec<ReplyTemplateRow>, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        let q = ListReplyTemplatesQuery { limit, offset, channel, enabled };
        repo::list_reply_templates(&conn, &q).map_err(|e| e.to_string())
    }

    pub fn update_reply_template(
        app_handle: &AppHandle,
        id: &str,
        template_name: Option<&str>,
        channel: Option<&str>,
        text: Option<&str>,
        variables: Option<&str>,
        category: Option<&str>,
        enabled: Option<bool>,
    ) -> Result<(), String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::update_reply_template(
            &conn,
            id,
            template_name,
            channel,
            text,
            variables,
            category,
            enabled,
        ).map_err(|e| e.to_string())
    }

    // ==================== 统计相关 ====================

    pub fn get_precise_acquisition_stats(
        app_handle: &AppHandle,
    ) -> Result<serde_json::Value, String> {
        let conn = repo::get_connection(app_handle).map_err(|e| e.to_string())?;
        repo::get_precise_acquisition_stats(&conn).map_err(|e| e.to_string())
    }
}
