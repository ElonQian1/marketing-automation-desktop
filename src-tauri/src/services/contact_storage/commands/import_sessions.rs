/// 导入会话命令
/// 
/// 提供导入会话相关的 Tauri 命令处理函数

use tauri::{command, AppHandle};
use super::super::repositories::common::command_base::with_db_connection;
use super::super::repositories::import_sessions_repo;
use super::super::models;

/// 创建导入会话
#[command]
pub async fn create_import_session_cmd(
    app_handle: AppHandle,
    device_id: String,
    batch_id: String,
    target_app: String,
    session_description: Option<String>,
) -> Result<models::ImportSessionDto, String> {
    with_db_connection(&app_handle, |conn| {
        let session_id = import_sessions_repo::create_import_session(conn, &batch_id, &device_id)?;
        // V2.0: 返回新的DTO结构
        Ok(models::ImportSessionDto {
            id: session_id,
            session_id: session_id.to_string(),
            device_id: device_id.clone(),
            batch_id: batch_id.clone(),
            target_app,
            session_description,
            status: "pending".to_string(),
            success_count: 0,
            failed_count: 0,
            started_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            finished_at: None,
            created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            error_message: None,
            industry: None,
        })
    })
}

/// 完成导入会话
#[command]
pub async fn finish_import_session_cmd(
    app_handle: AppHandle,
    session_id: String,
    status: String,
    imported_count: i64,
    error_message: Option<String>,
) -> Result<bool, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::finish_import_session(conn, id, &status, imported_count, 0, error_message.as_deref())?;
        Ok(true)
    })
}

/// 列出导入会话
#[command]
pub async fn list_import_sessions_cmd(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
    device_id: Option<String>,
    batch_id: Option<String>,
    status: Option<String>,
) -> Result<models::ImportSessionList, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::list_import_sessions(conn, device_id.as_deref(), batch_id.as_deref(), status.as_deref(), limit, offset)
    })
}

/// 获取导入会话详情
#[command]
pub async fn get_import_session_cmd(
    app_handle: AppHandle,
    session_id: String,
) -> Result<Option<models::ImportSessionDto>, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_session(conn, id)
    })
}

/// 删除导入会话
#[command]
pub async fn delete_import_session_cmd(
    app_handle: AppHandle,
    session_id: String,
) -> Result<bool, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::delete_import_session(conn, id, false)?;
        Ok(true)
    })
}

/// 获取最近的导入会话
#[command]
pub async fn get_recent_import_sessions_cmd(
    app_handle: AppHandle,
    limit: i64,
) -> Result<Vec<models::ImportSessionDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_recent_import_sessions(conn, limit)
    })
}

/// 按设备获取导入会话
#[command]
pub async fn get_import_sessions_by_device_cmd(
    app_handle: AppHandle,
    device_id: String,
    limit: i64,
) -> Result<Vec<models::ImportSessionDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_sessions_by_device(conn, &device_id, limit)
    })
}

/// 按批次获取导入会话
#[command]
pub async fn get_import_sessions_by_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
    limit: i64,
) -> Result<Vec<models::ImportSessionDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_sessions_by_batch(conn, &batch_id, limit)
    })
}

/// 获取导入会话统计信息
#[command]
pub async fn get_import_session_stats_cmd(
    app_handle: AppHandle,
) -> Result<models::ImportSessionStatsDto, String> {
    with_db_connection(&app_handle, |conn| {
        let stats = import_sessions_repo::get_import_session_stats(conn, None)?;
        Ok(models::ImportSessionStatsDto {
            total_sessions: stats.total_sessions,
            successful_sessions: stats.successful_sessions,
            failed_sessions: stats.failed_sessions,
            pending_sessions: stats.pending_sessions,
            total_imported: stats.total_imported_numbers,
            total_failed: stats.total_failed_numbers,
        })
    })
}

/// 更新导入会话行业分类
#[command]
pub async fn update_import_session_industry_cmd(
    app_handle: AppHandle,
    session_id: String,
    industry: String,
) -> Result<bool, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::update_import_session_industry(conn, id, Some(&industry))?;
        Ok(true)
    })
}

/// 将导入会话回滚为失败状态
#[command]
pub async fn revert_import_session_to_failed_cmd(
    app_handle: AppHandle,
    session_id: String,
    reason: String,
) -> Result<models::RevertSessionResultDto, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        let reverted_count = import_sessions_repo::revert_import_session_to_failed(conn, id, Some(&reason))?;
        Ok(models::RevertSessionResultDto {
            session_id: session_id.clone(),
            reverted_numbers: reverted_count,
            old_status: "success".to_string(),
            new_status: "failed".to_string(),
        })
    })
}

/// 批量删除导入会话
#[command]
pub async fn batch_delete_import_sessions_cmd(
    app_handle: AppHandle,
    session_ids: Vec<String>,
) -> Result<i64, String> {
    let ids: Result<Vec<i64>, _> = session_ids.iter().map(|s| s.parse::<i64>()).collect();
    let ids = ids.map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::batch_delete_import_sessions(conn, &ids)
    })
}

/// 获取失败的导入会话
#[command]
pub async fn get_failed_import_sessions_cmd(
    app_handle: AppHandle,
    limit: i64,
) -> Result<Vec<models::ImportSessionDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_failed_import_sessions(conn, limit)
    })
}

/// 获取成功的导入会话
#[command]
pub async fn get_successful_import_sessions_cmd(
    app_handle: AppHandle,
    limit: i64,
) -> Result<Vec<models::ImportSessionDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_successful_import_sessions(conn, limit)
    })
}

/// 更新会话状态
#[command]
pub async fn update_import_session_status_cmd(
    app_handle: AppHandle,
    session_id: String,
    status: String,
) -> Result<bool, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::update_import_session_status(conn, id, &status)?;
        Ok(true)
    })
}

/// 获取会话事件日志
#[command]
pub async fn get_import_session_events_cmd(
    app_handle: AppHandle,
    session_id: String,
) -> Result<Vec<models::ImportEventDto>, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        let event_list = import_sessions_repo::get_import_session_events(conn, id, 100, 0)?;
        let events = event_list.items.into_iter().map(|e| models::ImportEventDto {
            event_id: e.id.to_string(),
            session_id: e.session_id.to_string(),
            event_type: e.event_type,
            event_description: e.event_data.clone().unwrap_or_default(),
            event_data: e.event_data,
            created_at: e.created_at,
        }).collect();
        Ok(events)
    })
}

/// 添加会话事件
#[command]
pub async fn add_import_session_event_cmd(
    app_handle: AppHandle,
    session_id: String,
    event_type: String,
    event_data: Option<String>,
) -> Result<bool, String> {
    let id = session_id.parse::<i64>().map_err(|e| format!("Invalid session_id: {}", e))?;
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::add_import_session_event(conn, id, &event_type, event_data.as_deref().unwrap_or(""))?;
        Ok(true)
    })
}

/// 按日期范围获取导入会话
#[command]
pub async fn get_import_sessions_by_date_range_cmd(
    app_handle: AppHandle,
    start_date: String,
    end_date: String,
    limit: i64,
) -> Result<Vec<models::ImportSessionDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_sessions_by_date_range(conn, &start_date, &end_date, limit)
    })
}

/// 获取所有行业分类
#[command]
pub async fn get_distinct_session_industries_cmd(
    app_handle: AppHandle,
) -> Result<Vec<String>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_distinct_session_industries(conn)
    })
}