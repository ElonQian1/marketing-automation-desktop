use chrono::Local;
use rusqlite::{params, Connection, OptionalExtension, Result as SqliteResult};
use tauri::AppHandle;

use crate::services::contact_storage::models::{
    TxtImportRecordDto, TxtImportRecordList, DeleteTxtImportRecordResult
};
use super::common::{get_connection, log_database_error};

/// TXT文件导入记录仓储
/// 负责TXT文件导入记录的CRUD操作

/// 创建TXT文件导入记录
pub fn create_txt_import_record(
    app_handle: &AppHandle,
    file_path: &str,
    file_name: &str,
    total_numbers: i64,
    imported_numbers: i64,
    duplicate_numbers: i64,
    status: &str,
    error_message: Option<&str>,
) -> SqliteResult<i64> {
    let conn = get_connection(app_handle)?;
    create_txt_import_record_with_conn(&conn, file_path, file_name, total_numbers, imported_numbers, duplicate_numbers, status, error_message)
}

/// 使用指定连接创建TXT文件导入记录
pub fn create_txt_import_record_with_conn(
    conn: &Connection,
    file_path: &str,
    file_name: &str,
    total_numbers: i64,
    imported_numbers: i64,
    duplicate_numbers: i64,
    status: &str,
    error_message: Option<&str>,
) -> SqliteResult<i64> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    let result = conn.execute(
        "INSERT INTO txt_import_records (file_path, file_name, total_numbers, imported_numbers, duplicate_numbers, status, error_message, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![file_path, file_name, total_numbers, imported_numbers, duplicate_numbers, status, error_message, now],
    );

    match result {
        Ok(_) => {
            tracing::info!("成功创建TXT导入记录: {} ({} 个号码)", file_name, total_numbers);
            Ok(conn.last_insert_rowid())
        }
        Err(e) => {
            log_database_error("create_txt_import_record", &e);
            Err(e)
        }
    }
}

/// 获取TXT文件导入记录列表
pub fn list_txt_import_records(
    app_handle: &AppHandle,
    limit: i64,
    offset: i64,
) -> SqliteResult<TxtImportRecordList> {
    let conn = get_connection(app_handle)?;
    list_txt_import_records_with_conn(&conn, limit, offset)
}

/// 使用指定连接获取TXT文件导入记录列表
pub fn list_txt_import_records_with_conn(
    conn: &Connection,
    limit: i64,
    offset: i64,
) -> SqliteResult<TxtImportRecordList> {
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM txt_import_records",
        [],
        |row| row.get(0),
    ).map_err(|e| {
        log_database_error("list_txt_import_records_count", &e);
        e
    })?;

    let mut stmt = conn.prepare(
        "SELECT id, file_path, file_name, total_numbers, imported_numbers, duplicate_numbers, status, error_message, created_at 
         FROM txt_import_records 
         ORDER BY created_at DESC 
         LIMIT ?1 OFFSET ?2"
    ).map_err(|e| {
        log_database_error("list_txt_import_records_prepare", &e);
        e
    })?;

    let mut rows = stmt.query(params![limit, offset]).map_err(|e| {
        log_database_error("list_txt_import_records_query", &e);
        e
    })?;

    let mut items = Vec::new();

    while let Some(row) = rows.next()? {
        items.push(TxtImportRecordDto {
            id: row.get(0)?,
            file_path: row.get(1)?,
            file_name: row.get(2)?,
            total_numbers: row.get(3)?,
            imported_numbers: row.get(4)?,
            duplicate_numbers: row.get(5)?,
            status: row.get(6)?,
            error_message: row.get(7).ok(),
            created_at: row.get(8)?,
        });
    }

    tracing::debug!("查询TXT导入记录: {} 条记录，总计 {} 条", items.len(), total);

    Ok(TxtImportRecordList { total, items })
}

/// 删除TXT文件导入记录（可选择是否归档相关号码）
pub fn delete_txt_import_record(
    app_handle: &AppHandle,
    record_id: i64,
    archive_numbers: bool,
) -> SqliteResult<DeleteTxtImportRecordResult> {
    let conn = get_connection(app_handle)?;
    delete_txt_import_record_with_conn(&conn, record_id, archive_numbers)
}

/// 使用指定连接删除TXT文件导入记录
pub fn delete_txt_import_record_with_conn(
    conn: &Connection,
    record_id: i64,
    archive_numbers: bool,
) -> SqliteResult<DeleteTxtImportRecordResult> {
    let record_info: Option<String> = conn
        .query_row(
            "SELECT file_path FROM txt_import_records WHERE id = ?1",
            params![record_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| {
            log_database_error("delete_txt_import_record_find", &e);
            e
        })?;

    if record_info.is_none() {
        tracing::warn!("尝试删除不存在的TXT导入记录: {}", record_id);
        return Ok(DeleteTxtImportRecordResult {
            record_id,
            archived_number_count: 0,
            success: false,
        });
    }

    let file_path = record_info.unwrap();
    let mut archived_number_count: i64 = 0;

    let tx = conn.unchecked_transaction().map_err(|e| {
        log_database_error("delete_txt_import_record_transaction", &e);
        e
    })?;

    if archive_numbers {
        // 将来源为该文件的号码重置为未导入状态
        archived_number_count = tx
            .execute(
                "UPDATE contact_numbers SET used = 0, status = 'not_imported', imported_device_id = NULL, used_batch = NULL WHERE source_file = ?1",
                params![&file_path],
            )
            .map_err(|e| {
                log_database_error("delete_txt_import_record_archive", &e);
                e
            })? as i64;
    }

    // 删除记录
    tx.execute(
        "DELETE FROM txt_import_records WHERE id = ?1",
        params![record_id],
    ).map_err(|e| {
        log_database_error("delete_txt_import_record_delete", &e);
        e
    })?;

    tx.commit().map_err(|e| {
        log_database_error("delete_txt_import_record_commit", &e);
        e
    })?;

    tracing::info!("删除TXT导入记录 {}, 归档号码: {}", record_id, archived_number_count);

    Ok(DeleteTxtImportRecordResult {
        record_id,
        archived_number_count,
        success: true,
    })
}

/// 根据文件路径查找TXT导入记录
pub fn find_txt_import_record_by_path(
    app_handle: &AppHandle,
    file_path: &str,
) -> SqliteResult<Option<TxtImportRecordDto>> {
    let conn = get_connection(app_handle)?;
    find_txt_import_record_by_path_with_conn(&conn, file_path)
}

/// 使用指定连接根据文件路径查找TXT导入记录
pub fn find_txt_import_record_by_path_with_conn(
    conn: &Connection,
    file_path: &str,
) -> SqliteResult<Option<TxtImportRecordDto>> {
    let result = conn.query_row(
        "SELECT id, file_path, file_name, total_numbers, imported_numbers, duplicate_numbers, status, error_message, created_at 
         FROM txt_import_records 
         WHERE file_path = ?1",
        params![file_path],
        |row| {
            Ok(TxtImportRecordDto {
                id: row.get(0)?,
                file_path: row.get(1)?,
                file_name: row.get(2)?,
                total_numbers: row.get(3)?,
                imported_numbers: row.get(4)?,
                duplicate_numbers: row.get(5)?,
                status: row.get(6)?,
                error_message: row.get(7).ok(),
                created_at: row.get(8)?,
            })
        },
    ).optional();

    match result {
        Ok(record) => Ok(record),
        Err(e) => {
            log_database_error("find_txt_import_record_by_path", &e);
            Err(e)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    
    #[test]
    fn test_txt_import_record_operations() {
        // 单元测试可以在这里添加
        // 目前保持简单
    }
}