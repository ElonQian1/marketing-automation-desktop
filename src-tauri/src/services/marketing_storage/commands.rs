use super::models::{
    WatchTargetPayload, WatchTargetRow, ListWatchTargetsQuery,
    CommentPayload, CommentRow, ListCommentsQuery,
    TaskPayload, TaskRow, ListTasksQuery,
    AuditLogPayload,
};
use super::repositories as repo;

// ==================== 候选池相关命令 ====================

#[tauri::command]
pub fn bulk_upsert_watch_targets(app_handle: tauri::AppHandle, payloads: Vec<WatchTargetPayload>) -> Result<usize, String> {
    let mut conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::bulk_upsert_watch_targets(&mut conn, &payloads).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_watch_target_by_dedup_key(app_handle: tauri::AppHandle, dedup_key: String) -> Result<Option<WatchTargetRow>, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::get_watch_target_by_dedup_key(&conn, &dedup_key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_watch_targets(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    platform: Option<String>,
    target_type: Option<String>,
) -> Result<Vec<WatchTargetRow>, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let q = ListWatchTargetsQuery { limit, offset, platform, target_type };
    repo::list_watch_targets(&conn, &q).map_err(|e| e.to_string())
}

// ==================== 评论相关命令 ====================

#[tauri::command]
pub fn insert_comment(app_handle: tauri::AppHandle, comment: CommentPayload) -> Result<String, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::insert_comment(&conn, &comment).map_err(|e| e.to_string())
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
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let q = ListCommentsQuery { limit, offset, platform, source_target_id, region };
    repo::list_comments(&conn, &q).map_err(|e| e.to_string())
}

// ==================== 任务相关命令 ====================

#[tauri::command]
pub fn insert_task(app_handle: tauri::AppHandle, task: TaskPayload) -> Result<String, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::insert_task(&conn, &task).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_task_status(
    app_handle: tauri::AppHandle,
    task_id: String,
    status: String,
    result_code: Option<String>,
    error_message: Option<String>,
) -> Result<(), String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::update_task_status(&conn, &task_id, &status, result_code.as_deref(), error_message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_tasks(
    app_handle: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
    status: Option<String>,
    task_type: Option<String>,
    assign_account_id: Option<String>,
) -> Result<Vec<TaskRow>, String> {
    let conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let q = ListTasksQuery { limit, offset, status, task_type, assign_account_id };
    repo::list_tasks(&conn, &q).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn lock_next_ready_task(
    app_handle: tauri::AppHandle,
    account_id: String,
    lease_seconds: Option<i64>,
) -> Result<Option<TaskRow>, String> {
    let mut conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let lease = lease_seconds.unwrap_or(120);
    repo::lock_next_ready_task(&mut conn, &account_id, lease).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_task_result(
    app_handle: tauri::AppHandle,
    task_id: String,
    result_code: Option<String>,
    error_message: Option<String>,
) -> Result<(), String> {
    let mut conn = repo::get_connection(&app_handle).map_err(|e| e.to_string())?;
    repo::mark_task_result(&mut conn, &task_id, result_code.as_deref(), error_message.as_deref()).map_err(|e| e.to_string())
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
