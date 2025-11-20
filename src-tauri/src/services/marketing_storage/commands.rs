use super::models::{
    WatchTargetPayload, WatchTargetRow,
    CommentPayload, CommentRow,
    TaskPayload, TaskRow, TaskStatus, TaskType, TaskResultCode,
    AuditLogPayload,
    ReplyTemplatePayload, ReplyTemplateRow,
    MarketingPlatform, TargetType,
};
use super::facade::MarketingStorageFacade;

// ==================== 候选池相关命令 ====================

#[tauri::command]
pub fn bulk_upsert_watch_targets(app_handle: tauri::AppHandle, payloads: Vec<WatchTargetPayload>) -> Result<usize, String> {
    MarketingStorageFacade::bulk_upsert_watch_targets(&app_handle, payloads)
}

#[tauri::command]
pub fn get_watch_target_by_dedup_key(app_handle: tauri::AppHandle, dedup_key: String) -> Result<Option<WatchTargetRow>, String> {
    MarketingStorageFacade::get_watch_target_by_dedup_key(&app_handle, &dedup_key)
}

#[tauri::command]
pub fn list_watch_targets(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    platform: Option<String>,
    target_type: Option<String>,
) -> Result<Vec<WatchTargetRow>, String> {
    let platform_enum = platform.map(MarketingPlatform::from);
    let target_type_enum = target_type.map(TargetType::from);
    MarketingStorageFacade::list_watch_targets(&app_handle, limit, offset, platform_enum, target_type_enum)
}

/// Alias for list_watch_targets (frontend expects get_watch_targets)
#[tauri::command]
pub fn get_watch_targets(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    platform: Option<String>,
    target_type: Option<String>,
) -> Result<Vec<WatchTargetRow>, String> {
    list_watch_targets(app_handle, limit, offset, platform, target_type)
}

#[tauri::command]
pub fn update_watch_target(
    app_handle: tauri::AppHandle,
    id: String,
    title: Option<String>,
    industry_tags: Option<String>,
    region: Option<String>,
    notes: Option<String>,
    last_fetch_at: Option<String>,
) -> Result<(), String> {
    MarketingStorageFacade::update_watch_target(
        &app_handle,
        &id,
        title.as_deref(),
        industry_tags.as_deref(),
        region.as_deref(),
        notes.as_deref(),
        last_fetch_at.as_deref(),
    )
}

// ==================== 评论相关命令 ====================

#[tauri::command]
pub fn insert_comment(app_handle: tauri::AppHandle, comment: CommentPayload) -> Result<String, String> {
    MarketingStorageFacade::insert_comment(&app_handle, comment)
}

#[tauri::command]
pub fn list_comments(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    platform: Option<String>,
    source_target_id: Option<String>,
    region: Option<String>,
) -> Result<Vec<CommentRow>, String> {
    let platform_enum = platform.map(MarketingPlatform::from);
    MarketingStorageFacade::list_comments(&app_handle, limit, offset, platform_enum, source_target_id, region)
}

// ==================== 任务相关命令 ====================

#[tauri::command]
pub fn insert_task(app_handle: tauri::AppHandle, task: TaskPayload) -> Result<String, String> {
    MarketingStorageFacade::insert_task(&app_handle, task)
}

#[tauri::command]
pub fn update_task_status(
    app_handle: tauri::AppHandle,
    task_id: String,
    status: TaskStatus,
    result_code: Option<TaskResultCode>,
    error_message: Option<String>,
) -> Result<(), String> {
    MarketingStorageFacade::update_task_status(&app_handle, &task_id, status, result_code, error_message.as_deref())
}

#[tauri::command]
pub fn list_tasks(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    status: Option<TaskStatus>,
    task_type: Option<TaskType>,
    assign_account_id: Option<String>,
) -> Result<Vec<TaskRow>, String> {
    MarketingStorageFacade::list_tasks(&app_handle, limit, offset, status, task_type, assign_account_id)
}

#[tauri::command]
pub fn lock_next_ready_task(
    app_handle: tauri::AppHandle,
    account_id: String,
    lease_seconds: Option<i64>,
) -> Result<Option<TaskRow>, String> {
    MarketingStorageFacade::lock_next_ready_task(&app_handle, &account_id, lease_seconds)
}

#[tauri::command]
pub fn mark_task_result(
    app_handle: tauri::AppHandle,
    task_id: String,
    result_code: Option<TaskResultCode>,
    error_message: Option<String>,
) -> Result<(), String> {
    MarketingStorageFacade::mark_task_result(&app_handle, &task_id, result_code, error_message.as_deref())
}


// ==================== 审计日志相关命令 ====================

#[tauri::command]
pub fn insert_audit_log(app_handle: tauri::AppHandle, log: AuditLogPayload) -> Result<String, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::insert_audit_log(&conn, &log).map_err(|e| e.to_string())
}

// ==================== 去重索引（带TTL） ====================

#[tauri::command]
pub fn check_and_reserve_dedup(
    app_handle: tauri::AppHandle,
    key: String,
    scope: String,
    ttl_days: i64,
    by_account: Option<String>,
) -> Result<bool, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::check_and_reserve_dedup(&conn, &key, &scope, ttl_days, by_account.as_deref()).map_err(|e| e.to_string())
}

// ==================== 扩展审计日志命令 ====================

#[tauri::command]
pub fn query_audit_logs(
    app_handle: tauri::AppHandle,
    start_time: Option<String>,
    end_time: Option<String>,
    action_filter: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<serde_json::Value>, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::query_audit_logs(&conn, start_time.as_deref(), end_time.as_deref(), action_filter.as_deref(), limit.unwrap_or(100), offset.unwrap_or(0)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_audit_logs(
    app_handle: tauri::AppHandle,
    start_time: Option<String>,
    end_time: Option<String>,
    format: Option<String>,
) -> Result<String, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::export_audit_logs(&conn, start_time.as_deref(), end_time.as_deref(), format.as_deref().unwrap_or("csv")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cleanup_expired_audit_logs(
    app_handle: tauri::AppHandle,
    retention_days: i64,
) -> Result<i64, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::cleanup_expired_audit_logs(&conn, retention_days).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn batch_store_audit_logs(
    app_handle: tauri::AppHandle,
    logs: Vec<AuditLogPayload>,
) -> Result<i64, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::batch_store_audit_logs(&conn, &logs).map_err(|e| e.to_string())
}

// ==================== 回复模板相关命令 ====================

#[tauri::command]
pub fn insert_reply_template(
    app_handle: tauri::AppHandle,
    payload: ReplyTemplatePayload,
) -> Result<String, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::insert_reply_template(&conn, &payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_reply_templates(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    channel: Option<String>,
    enabled: Option<bool>,
) -> Result<Vec<ReplyTemplateRow>, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let q = ListReplyTemplatesQuery { limit, offset, channel, enabled };
    repo::list_reply_templates(&conn, &q).map_err(|e| e.to_string())
}

/// Alias for list_reply_templates (frontend expects get_reply_templates with no params)
#[tauri::command]
pub fn get_reply_templates(
    app_handle: tauri::AppHandle,
) -> Result<Vec<ReplyTemplateRow>, String> {
    list_reply_templates(app_handle, None, None, None, None)
}

#[tauri::command]
pub fn update_reply_template(
    app_handle: tauri::AppHandle,
    id: String,
    template_name: Option<String>,
    channel: Option<String>,
    text: Option<String>,
    variables: Option<String>,
    category: Option<String>,
    enabled: Option<bool>,
) -> Result<(), String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::update_reply_template(
        &conn,
        &id,
        template_name.as_deref(),
        channel.as_deref(),
        text.as_deref(),
        variables.as_deref(),
        category.as_deref(),
        enabled,
    ).map_err(|e| e.to_string())
}

// ==================== 统计相关命令 ====================

#[tauri::command]
pub fn get_precise_acquisition_stats(
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::get_precise_acquisition_stats(&conn).map_err(|e| e.to_string())
}
