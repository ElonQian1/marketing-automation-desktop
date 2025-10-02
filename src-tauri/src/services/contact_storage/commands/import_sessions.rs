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
        import_sessions_repo::create_import_session(conn, &device_id, &batch_id, &target_app, session_description.as_deref())
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
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::finish_import_session(conn, &session_id, &status, imported_count, error_message.as_deref())
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
        import_sessions_repo::list_import_sessions(conn, limit, offset, device_id.as_deref(), batch_id.as_deref(), status.as_deref())
    })
}

/// 获取导入会话详情
#[command]
pub async fn get_import_session_cmd(
    app_handle: AppHandle,
    session_id: String,
) -> Result<Option<models::ImportSessionDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_session(conn, &session_id)
    })
}

/// 删除导入会话
#[command]
pub async fn delete_import_session_cmd(
    app_handle: AppHandle,
    session_id: String,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::delete_import_session(conn, &session_id)
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
    offset: i64,
) -> Result<models::ImportSessionList, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_sessions_by_device(conn, &device_id, limit, offset)
    })
}

/// 按批次获取导入会话
#[command]
pub async fn get_import_sessions_by_batch_cmd(
    app_handle: AppHandle,
    batch_id: String,
    limit: i64,
    offset: i64,
) -> Result<models::ImportSessionList, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_sessions_by_batch(conn, &batch_id, limit, offset)
    })
}

/// 获取导入会话统计信息
#[command]
pub async fn get_import_session_stats_cmd(
    app_handle: AppHandle,
) -> Result<models::ImportSessionStatsDto, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_session_stats(conn)
    })
}

/// 更新导入会话行业分类
#[command]
pub async fn update_import_session_industry_cmd(
    app_handle: AppHandle,
    session_id: String,
    industry: String,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::update_import_session_industry(conn, &session_id, &industry)
    })
}

/// 将导入会话回滚为失败状态
#[command]
pub async fn revert_import_session_to_failed_cmd(
    app_handle: AppHandle,
    session_id: String,
    reason: String,
) -> Result<models::RevertSessionResultDto, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::revert_import_session_to_failed(conn, &session_id, &reason)
    })
}

/// 批量删除导入会话
#[command]
pub async fn batch_delete_import_sessions_cmd(
    app_handle: AppHandle,
    session_ids: Vec<String>,
) -> Result<i64, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::batch_delete_import_sessions(conn, &session_ids)
    })
}

/// 获取失败的导入会话
#[command]
pub async fn get_failed_import_sessions_cmd(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<models::ImportSessionList, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_failed_import_sessions(conn, limit, offset)
    })
}

/// 获取成功的导入会话
#[command]
pub async fn get_successful_import_sessions_cmd(
    app_handle: AppHandle,
    limit: i64,
    offset: i64,
) -> Result<models::ImportSessionList, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_successful_import_sessions(conn, limit, offset)
    })
}

/// 更新会话状态
#[command]
pub async fn update_import_session_status_cmd(
    app_handle: AppHandle,
    session_id: String,
    status: String,
    error_message: Option<String>,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::update_import_session_status(conn, &session_id, &status, error_message.as_deref())
    })
}

/// 获取会话事件日志
#[command]
pub async fn get_import_session_events_cmd(
    app_handle: AppHandle,
    session_id: String,
) -> Result<Vec<models::ImportEventDto>, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_session_events(conn, &session_id)
    })
}

/// 添加会话事件
#[command]
pub async fn add_import_session_event_cmd(
    app_handle: AppHandle,
    session_id: String,
    event_type: String,
    event_description: String,
    event_data: Option<String>,
) -> Result<bool, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::add_import_session_event(conn, &session_id, &event_type, &event_description, event_data.as_deref())
    })
}

/// 按日期范围获取导入会话
#[command]
pub async fn get_import_sessions_by_date_range_cmd(
    app_handle: AppHandle,
    start_date: String,
    end_date: String,
    limit: i64,
    offset: i64,
) -> Result<models::ImportSessionList, String> {
    with_db_connection(&app_handle, |conn| {
        import_sessions_repo::get_import_sessions_by_date_range(conn, &start_date, &end_date, limit, offset)
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