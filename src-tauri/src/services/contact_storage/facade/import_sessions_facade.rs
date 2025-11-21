use rusqlite::{Connection, Result as SqliteResult};
use tauri::AppHandle;
use std::str::FromStr;

use crate::services::contact_storage::repositories::import_sessions_repo::ImportSessionRepository;
use crate::services::contact_storage::models::{ImportSessionDto, ImportSessionList, ImportSessionStatus};
use crate::services::contact_storage::facade::common::db_connector::with_db_connection;

/// 导入会话管理门面
/// 
/// 负责所有导入会话相关的操作，委托给 import_sessions_repo
pub struct ImportSessionsFacade;

impl ImportSessionsFacade {
    
    /// 数据库连接辅助方法
    fn with_db_connection<T, F>(app_handle: &AppHandle, func: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> SqliteResult<T>,
    {
        with_db_connection(app_handle, func)
    }

    /// 创建导入会话
    pub fn create_import_session(
        app_handle: &AppHandle,
        device_id: &str,
        batch_id: &str,
        _total_contacts: i64,
        _session_type: &str,
    ) -> Result<i64, String> {
        with_db_connection(app_handle, |conn| {
            ImportSessionRepository::create_import_session(conn, batch_id, device_id, None)
        })
    }

    /// 更新导入会话状态
    pub fn update_import_session_status(
        app_handle: &AppHandle,
        session_id: i64,
        status: &str,
        imported_count: Option<i64>,
        error_message: Option<&str>,
    ) -> Result<i64, String> {
        let status_enum = ImportSessionStatus::from_str(status)
            .map_err(|e| format!("Invalid status: {}", e))?;

        Self::with_db_connection(app_handle, |conn| {
            ImportSessionRepository::update_import_session_status(
                conn, session_id, status_enum, imported_count, error_message
            )
        })
    }

    /// 列出导入会话
    pub fn list_import_sessions(
        app_handle: &AppHandle,
        limit: i64,
        offset: i64,
        device_filter: Option<&str>,
        batch_filter: Option<&str>,
        status_filter: Option<&str>,
    ) -> Result<ImportSessionList, String> {
        Self::with_db_connection(app_handle, |conn| {
            ImportSessionRepository::list_import_sessions(
                conn, limit, offset, device_filter, batch_filter, status_filter
            )
        })
    }

    /// 根据设备ID查询导入会话
    pub fn list_import_sessions_by_device(
        app_handle: &AppHandle,
        device_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<ImportSessionList, String> {
        Self::with_db_connection(app_handle, |conn| {
            ImportSessionRepository::list_import_sessions(conn, limit, offset, Some(device_id), None, None)
        })
    }

    /// 根据批次ID查询导入会话
    pub fn list_import_sessions_by_batch(
        app_handle: &AppHandle,
        batch_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<ImportSessionList, String> {
        Self::with_db_connection(app_handle, |conn| {
            ImportSessionRepository::list_import_sessions(conn, limit, offset, None, Some(batch_id), None)
        })
    }

    /// 获取导入会话详情
    pub fn get_import_session_by_id(app_handle: &AppHandle, session_id: i64) -> Result<Option<ImportSessionDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            ImportSessionRepository::get_import_session_by_id(conn, session_id)
        })
    }

    /// 删除导入会话
    pub fn delete_import_session(app_handle: &AppHandle, session_id: i64) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            let result = ImportSessionRepository::delete_import_session(conn, session_id)?;
            Ok(result.archived_number_count + result.removed_event_count)
        })
    }

    /// 更新导入会话行业信息
    pub fn update_import_session_industry(
        app_handle: &AppHandle,
        session_id: i64,
        industry: Option<&str>,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            let industry_str = industry.unwrap_or("未知");
            ImportSessionRepository::update_session_industry(conn, session_id, industry_str)?;
            Ok(1) // 返回修改的行数
        })
    }

    /// 回滚导入会话为失败状态
    pub fn revert_import_session_to_failed(
        app_handle: &AppHandle,
        session_id: i64,
        reason: &str,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            ImportSessionRepository::revert_session_to_failed(conn, session_id, reason)
        })
    }
}