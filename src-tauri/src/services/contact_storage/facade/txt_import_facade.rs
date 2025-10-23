use rusqlite::{Connection, Result as SqliteResult};
use tauri::AppHandle;
use std::path::Path;

use super::super::repositories::txt_import_records_repo;
use super::super::models::{TxtImportRecordDto, TxtImportRecordList};
use super::common::db_connector::with_db_connection;

/// TXT 导入记录管理门面
/// 
/// 负责所有 TXT 导入记录相关的操作，委托给 txt_import_records_repo
pub struct TxtImportFacade;

impl TxtImportFacade {
    
    /// 从文件路径中提取文件名
    fn extract_file_name(file_path: &str) -> String {
        if file_path.is_empty() {
            return String::from("未知文件");
        }
        
        Path::new(file_path)
            .file_name()
            .and_then(|name| name.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| String::from("未知文件"))
    }
    
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
        // 提取文件名
        let file_name = Self::extract_file_name(file_path);
        
        with_db_connection(app_handle, |conn| {
            // 转换为所需的类型
            let record_id = txt_import_records_repo::create_txt_import_record(
                conn, 
                file_path, 
                &file_name, // 使用提取的文件名
                total_lines, 
                valid_numbers, 
                0, // imported_numbers
                0, // duplicate_numbers
                "pending", // status
                source_info // error_message
            )?;
            
            // 创建并返回 TxtImportRecordDto
            Ok(super::super::models::TxtImportRecordDto {
                id: record_id,
                file_path: file_path.to_string(),
                file_name, // 使用提取的文件名
                file_size: None,
                total_lines,
                valid_numbers,
                imported_numbers: 0,
                duplicate_numbers: 0,
                invalid_numbers: 0,
                status: "pending".to_string(),
                error_message: source_info.map(|s| s.to_string()),
                created_at: chrono::Utc::now().to_rfc3339(),
                imported_at: None,
                industry: None,
                notes: None,
            })
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
                conn, 
                record_id, 
                processed_lines,  // total_numbers
                valid_numbers,    // successful_imports
                0,                // duplicate_numbers
                error_count,      // invalid_numbers
                status,           // import_status
                None              // error_message
            ).map(|_| record_id) // 返回 i64 而不是 ()
        })
    }

    /// 更新TXT导入记录的导入统计（imported_numbers, duplicate_numbers, status）
    pub fn update_txt_import_record_stats(
        app_handle: &AppHandle,
        record_id: i64,
        imported_numbers: i64,
        duplicate_numbers: i64,
        status: &str,
    ) -> Result<(), String> {
        Self::with_db_connection(app_handle, |conn| {
            conn.execute(
                "UPDATE txt_import_records 
                 SET imported_numbers = ?1, duplicate_numbers = ?2, status = ?3, imported_at = datetime('now')
                 WHERE id = ?4",
                rusqlite::params![imported_numbers, duplicate_numbers, status, record_id],
            )?;
            Ok(())
        })
    }

    /// 获取TXT导入统计信息
    pub fn get_txt_import_stats(
        app_handle: &AppHandle,
    ) -> Result<serde_json::Value, String> {
        Self::with_db_connection(app_handle, |conn| {
            let stats = txt_import_records_repo::get_txt_import_stats(conn)?;
            // 转换为 JSON 格式
            let json_stats = serde_json::json!({
                "records": stats.into_iter().map(|(name, count)| {
                    serde_json::json!({"name": name, "count": count})
                }).collect::<Vec<_>>()
            });
            Ok(json_stats)
        })
    }
}