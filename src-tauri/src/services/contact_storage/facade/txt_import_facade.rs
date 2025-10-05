use rusqlite::{Connection, Result as SqliteResult};
use tauri::AppHandle;

use super::super::repositories::txt_import_records_repo;
use super::super::models::{TxtImportRecordDto, TxtImportRecordList};
use super::common::db_connector::with_db_connection;

/// TXT 导入记录管理门面
/// 
/// 负责所有 TXT 导入记录相关的操作，委托给 txt_import_records_repo
pub struct TxtImportFacade;

impl TxtImportFacade {
    
    /// 数据库连接辅助方法
    fn with_db_connection<T, F>(app_handle: &AppHandle, func: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> SqliteResult<T>,
    {
        with_db_connection(app_handle, func)
    }

    /// 创建TXT导入记录
    pub fn create_txt_import_record(
        app_handle: &AppHandle,
        file_path: &str,
        total_lines: i64,
        valid_numbers: i64,
        source_info: Option<&str>,
        batch_id: Option<&str>,
    ) -> Result<TxtImportRecordDto, String> {
        with_db_connection(app_handle, |conn| {
            txt_import_records_repo::create_txt_import_record(
                conn, file_path, total_lines, valid_numbers, source_info, batch_id
            )
        })
    }

    /// 列出TXT导入记录
    pub fn list_txt_import_records(
        app_handle: &AppHandle,
        limit: i64,
        offset: i64,
        search_path: Option<&str>,
    ) -> Result<TxtImportRecordList, String> {
        Self::with_db_connection(app_handle, |conn| {
            txt_import_records_repo::list_txt_import_records(conn, limit, offset, search_path)
        })
    }

    /// 删除TXT导入记录
    pub fn delete_txt_import_record(
        app_handle: &AppHandle,
        record_id: i64,
        archive_numbers: bool,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            txt_import_records_repo::delete_txt_import_record(conn, record_id, archive_numbers)
        })
    }

    /// 根据路径查找TXT导入记录
    pub fn find_txt_import_record_by_path(
        app_handle: &AppHandle,
        file_path: &str,
    ) -> Result<Option<TxtImportRecordDto>, String> {
        Self::with_db_connection(app_handle, |conn| {
            txt_import_records_repo::find_txt_import_record_by_path(conn, file_path)
        })
    }

    /// 更新TXT导入统计
    pub fn update_txt_import_stats(
        app_handle: &AppHandle,
        record_id: i64,
        processed_lines: i64,
        valid_numbers: i64,
        error_count: i64,
        status: &str,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            txt_import_records_repo::update_txt_import_stats(
                conn, record_id, processed_lines, valid_numbers, error_count, status
            )
        })
    }

    /// 获取TXT导入统计信息
    pub fn get_txt_import_stats(
        app_handle: &AppHandle,
    ) -> Result<serde_json::Value, String> {
        Self::with_db_connection(app_handle, |conn| {
            txt_import_records_repo::get_txt_import_stats(conn)
        })
    }
}