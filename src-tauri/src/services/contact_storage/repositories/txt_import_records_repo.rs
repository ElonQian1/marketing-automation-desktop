/// TXT文件导入记录仓储层实现
/// 
/// 提供TXT文件导入记录的数据库操作功能

use rusqlite::{Connection, Result as SqliteResult, params};
use super::super::models::{TxtImportRecordDto, TxtImportRecordList};

/// 创建TXT导入记录（使用 UPSERT 处理重复文件路径）
pub fn create_txt_import_record(
    conn: &Connection,
    file_path: &str,
    file_name: &str,
    total_lines: i64,
    valid_numbers: i64,
    imported_numbers: i64,
    duplicate_numbers: i64,
    status: &str,
    error_message: Option<&str>,
) -> SqliteResult<i64> {
    let mut stmt = conn.prepare(
        "INSERT INTO txt_import_records 
         (file_path, file_name, total_lines, valid_numbers, imported_numbers, duplicate_numbers, status, error_message, imported_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
         ON CONFLICT(file_path) DO UPDATE SET
           file_name = excluded.file_name,
           total_lines = excluded.total_lines,
           valid_numbers = excluded.valid_numbers,
           imported_numbers = excluded.imported_numbers,
           duplicate_numbers = excluded.duplicate_numbers,
           status = excluded.status,
           error_message = excluded.error_message,
           imported_at = datetime('now')"
    )?;
    
    stmt.execute(params![
        file_path,
        file_name,
        total_lines,
        valid_numbers,
        imported_numbers,
        duplicate_numbers,
        status,
        error_message
    ])?;
    
    // 返回记录ID（对于更新操作，返回现有记录的ID）
    conn.query_row(
        "SELECT id FROM txt_import_records WHERE file_path = ?1",
        params![file_path],
        |row| row.get(0)
    )
}

/// 根据文件路径查找TXT导入记录
pub fn find_txt_import_record_by_path(
    conn: &Connection,
    file_path: &str,
) -> SqliteResult<Option<TxtImportRecordDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, file_path, file_name, COALESCE(file_size, 0) as file_size,
                total_lines, valid_numbers, imported_numbers, duplicate_numbers, COALESCE(invalid_numbers, 0) as invalid_numbers,
                status, error_message, created_at, imported_at,
                industry, notes
         FROM txt_import_records WHERE file_path = ?1"
    )?;
    
    let result = stmt.query_row(params![file_path], |row| {
        Ok(TxtImportRecordDto {
            id: row.get(0)?,
            file_path: row.get(1)?,
            file_name: row.get(2)?,
            file_size: Some(row.get(3)?),
            total_lines: row.get(4)?,
            valid_numbers: row.get(5)?,
            imported_numbers: row.get(6)?,
            duplicate_numbers: row.get(7)?,
            invalid_numbers: row.get(8)?,
            status: row.get(9)?,
            error_message: row.get(10)?,
            created_at: row.get(11)?,
            imported_at: row.get(12)?,
            industry: row.get(13)?,
            notes: row.get(14)?,
        })
    });
    
    match result {
        Ok(record) => Ok(Some(record)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

/// 列出TXT导入记录
pub fn list_txt_import_records(
    conn: &Connection,
    limit: i64,
    offset: i64,
    status_filter: Option<&str>,
) -> SqliteResult<TxtImportRecordList> {
    // 获取总数
    let total = if let Some(status) = status_filter {
        conn.query_row(
            "SELECT COUNT(*) FROM txt_import_records WHERE status = ?1",
            params![status],
            |row| row.get(0)
        )?
    } else {
        conn.query_row("SELECT COUNT(*) FROM txt_import_records", [], |row| row.get(0))?
    };
    
    // 获取数据
    let query = if status_filter.is_some() {
        "SELECT id, file_path, file_name, COALESCE(file_size, 0) as file_size,
                total_lines, valid_numbers, imported_numbers, duplicate_numbers, COALESCE(invalid_numbers, 0) as invalid_numbers,
                status, error_message, created_at, imported_at,
                industry, notes
         FROM txt_import_records WHERE status = ?1 ORDER BY created_at DESC LIMIT ?2 OFFSET ?3"
    } else {
        "SELECT id, file_path, file_name, COALESCE(file_size, 0) as file_size,
                total_lines, valid_numbers, imported_numbers, duplicate_numbers, COALESCE(invalid_numbers, 0) as invalid_numbers,
                status, error_message, created_at, imported_at,
                industry, notes
         FROM txt_import_records ORDER BY created_at DESC LIMIT ?1 OFFSET ?2"
    };
    
    let mut stmt = conn.prepare(query)?;
    
    // 统一的闭包处理函数
    let row_mapper = |row: &rusqlite::Row| -> SqliteResult<TxtImportRecordDto> {
        Ok(TxtImportRecordDto {
            id: row.get(0)?,
            file_path: row.get(1)?,
            file_name: row.get(2)?,
            file_size: Some(row.get(3)?),
            total_lines: row.get(4)?,
            valid_numbers: row.get(5)?,
            imported_numbers: row.get(6)?,
            duplicate_numbers: row.get(7)?,
            invalid_numbers: row.get(8)?,
            status: row.get(9)?,
            error_message: row.get(10)?,
            created_at: row.get(11)?,
            imported_at: row.get(12)?,
            industry: row.get(13)?,
            notes: row.get(14)?,
        })
    };
    
    let rows = if let Some(status) = status_filter {
        stmt.query_map(params![status, limit, offset], row_mapper)?
    } else {
        stmt.query_map(params![limit, offset], row_mapper)?
    };
    
    let mut items = Vec::new();
    for row_result in rows {
        items.push(row_result?);
    }
    
    Ok(TxtImportRecordList {
        total,
        items,
        limit,
        offset,
    })
}

/// 更新TXT导入记录的统计信息
pub fn update_txt_import_stats(
    conn: &Connection,
    id: i64,
    total_numbers: i64,
    successful_imports: i64,
    duplicate_numbers: i64,
    invalid_numbers: i64,
    import_status: &str,
    error_message: Option<&str>,
) -> SqliteResult<()> {
    let mut stmt = conn.prepare(
        "UPDATE txt_import_records 
         SET total_numbers = ?1, successful_imports = ?2, duplicate_numbers = ?3, 
             invalid_numbers = ?4, import_status = ?5, error_message = ?6,
             imported_at = datetime('now')
         WHERE id = ?7"
    )?;
    
    stmt.execute(params![
        total_numbers,
        successful_imports,
        duplicate_numbers,
        invalid_numbers,
        import_status,
        error_message,
        id
    ])?;
    
    Ok(())
}

/// 删除TXT导入记录（支持归档删除）
pub fn delete_txt_import_record(
    conn: &Connection,
    id: i64,
    archive_numbers: bool,
) -> SqliteResult<i64> {
    if archive_numbers {
        // 归档删除：更新相关联系人号码的状态
        conn.execute(
            "UPDATE contact_numbers 
             SET status = 'archived', assigned_batch_id = NULL, imported_device_id = NULL, assigned_at = NULL
             WHERE source_file = (SELECT file_path FROM txt_import_records WHERE id = ?1)",
            params![id],
        )?;
    } else {
        // 直接删除：移除相关联系人号码
        conn.execute(
            "DELETE FROM contact_numbers 
             WHERE source_file = (SELECT file_path FROM txt_import_records WHERE id = ?1)",
            params![id],
        )?;
    }
    
    // 删除导入记录
    let affected_rows = conn.execute(
        "DELETE FROM txt_import_records WHERE id = ?1",
        params![id],
    )?;
    
    Ok(affected_rows as i64)
}

/// 获取TXT导入记录统计信息
pub fn get_txt_import_stats(conn: &Connection) -> SqliteResult<Vec<(String, i64)>> {
    let mut stmt = conn.prepare(
        "SELECT import_status, COUNT(*) 
         FROM txt_import_records 
         GROUP BY import_status 
         ORDER BY import_status"
    )?;
    
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    
    let mut stats = Vec::new();
    for row_result in rows {
        stats.push(row_result?);
    }
    
    Ok(stats)
}