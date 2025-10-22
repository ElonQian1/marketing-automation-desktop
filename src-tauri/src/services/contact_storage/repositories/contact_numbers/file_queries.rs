// src-tauri/src/services/contact_storage/repositories/contact_numbers/file_queries.rs
// 文件相关查询功能

use rusqlite::{Connection, Result as SqliteResult, Row};
use super::super::super::models::FileInfoDto;

/// 获取所有已导入的文件列表及统计信息
pub fn get_imported_file_list(conn: &Connection) -> SqliteResult<Vec<FileInfoDto>> {
    let query = r#"
        SELECT 
            COALESCE(source_file, '') as source_file,
            COUNT(*) as total_count,
            SUM(CASE WHEN status = 'available' OR status IS NULL THEN 1 ELSE 0 END) as available_count,
            SUM(CASE WHEN status = 'imported' THEN 1 ELSE 0 END) as imported_count,
            MIN(created_at) as first_import_at,
            MAX(created_at) as last_import_at
        FROM contact_numbers
        WHERE source_file IS NOT NULL AND source_file != ''
        GROUP BY source_file
        ORDER BY last_import_at DESC
    "#;

    let mut stmt = conn.prepare(query)?;
    let rows = stmt.query_map([], |row| {
        let source_file: String = row.get(0)?;
        let file_name = extract_file_name(&source_file);
        
        Ok(FileInfoDto {
            source_file: source_file.clone(),
            file_name,
            total_count: row.get(1)?,
            available_count: row.get(2)?,
            imported_count: row.get(3)?,
            first_import_at: row.get(4)?,
            last_import_at: row.get(5)?,
        })
    })?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    
    Ok(result)
}

/// 根据文件路径列表获取联系人号码
pub fn get_numbers_by_files(
    conn: &Connection,
    file_paths: &[String],
    only_available: bool,
) -> SqliteResult<Vec<crate::services::contact_storage::models::ContactNumberDto>> {
    if file_paths.is_empty() {
        return Ok(Vec::new());
    }

    // 构建IN子句的占位符
    let placeholders: Vec<String> = file_paths.iter().map(|_| "?".to_string()).collect();
    let in_clause = placeholders.join(", ");

    let status_filter = if only_available {
        "AND (status = 'available' OR status IS NULL)"
    } else {
        ""
    };

    let query = format!(
        r#"
        SELECT 
            id, phone, name, source_file, created_at, 
            industry, status, assigned_at, assigned_batch_id, 
            imported_session_id, imported_device_id
        FROM contact_numbers
        WHERE source_file IN ({})
        {}
        ORDER BY id ASC
        "#,
        in_clause,
        status_filter
    );

    let mut stmt = conn.prepare(&query)?;
    
    // 绑定参数
    let params: Vec<&dyn rusqlite::ToSql> = file_paths
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();
    
    let rows = stmt.query_map(params.as_slice(), map_contact_number_row)?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    
    Ok(result)
}

/// 检查文件是否已导入
pub fn check_file_imported(conn: &Connection, file_path: &str) -> SqliteResult<bool> {
    let query = "SELECT COUNT(*) FROM contact_numbers WHERE source_file = ?";
    let mut stmt = conn.prepare(query)?;
    let count: i64 = stmt.query_row([file_path], |row| row.get(0))?;
    Ok(count > 0)
}

/// 获取指定文件的号码统计
pub fn get_file_stats(conn: &Connection, file_path: &str) -> SqliteResult<Option<FileInfoDto>> {
    let query = r#"
        SELECT 
            source_file,
            COUNT(*) as total_count,
            SUM(CASE WHEN status = 'available' OR status IS NULL THEN 1 ELSE 0 END) as available_count,
            SUM(CASE WHEN status = 'imported' THEN 1 ELSE 0 END) as imported_count,
            MIN(created_at) as first_import_at,
            MAX(created_at) as last_import_at
        FROM contact_numbers
        WHERE source_file = ?
        GROUP BY source_file
    "#;

    let mut stmt = conn.prepare(query)?;
    match stmt.query_row([file_path], |row| {
        let source_file: String = row.get(0)?;
        let file_name = extract_file_name(&source_file);
        
        Ok(FileInfoDto {
            source_file: source_file.clone(),
            file_name,
            total_count: row.get(1)?,
            available_count: row.get(2)?,
            imported_count: row.get(3)?,
            first_import_at: row.get(4)?,
            last_import_at: row.get(5)?,
        })
    }) {
        Ok(info) => Ok(Some(info)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

// ========== 辅助函数 ==========

/// 从完整路径中提取文件名
fn extract_file_name(path: &str) -> String {
    // 处理空字符串
    if path.is_empty() {
        return String::from("未知文件");
    }
    
    // 去除首尾空白
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return String::from("未知文件");
    }
    
    // 尝试从路径中提取文件名
    let file_name = trimmed
        .split(['/', '\\'])
        .filter(|s| !s.is_empty())  // 过滤空字符串（处理尾部斜杠的情况）
        .last()
        .unwrap_or(trimmed);
    
    // 如果提取结果为空，返回默认值
    if file_name.is_empty() {
        String::from("未知文件")
    } else {
        file_name.to_string()
    }
}

/// 映射数据库行到 ContactNumberDto
fn map_contact_number_row(row: &Row) -> SqliteResult<crate::services::contact_storage::models::ContactNumberDto> {
    Ok(crate::services::contact_storage::models::ContactNumberDto {
        id: row.get(0)?,
        phone: row.get(1)?,
        name: row.get(2)?,
        source_file: row.get(3)?,
        created_at: row.get(4)?,
        industry: row.get(5)?,
        status: row.get(6)?,
        assigned_at: row.get(7)?,
        assigned_batch_id: row.get(8)?,
        imported_session_id: row.get(9)?,
        imported_device_id: row.get(10)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_file_name() {
        // 正常路径
        assert_eq!(extract_file_name("/path/to/file.txt"), "file.txt");
        assert_eq!(extract_file_name("C:\\Windows\\file.txt"), "file.txt");
        assert_eq!(extract_file_name("file.txt"), "file.txt");
        
        // 边界情况
        assert_eq!(extract_file_name(""), "未知文件");
        assert_eq!(extract_file_name("   "), "未知文件");
        assert_eq!(extract_file_name("/"), "未知文件");
        assert_eq!(extract_file_name("\\"), "未知文件");
        assert_eq!(extract_file_name("/path/to/"), "to");
        assert_eq!(extract_file_name("C:\\folder\\"), "folder");
        
        // 混合路径分隔符
        assert_eq!(extract_file_name("/path\\to/file.txt"), "file.txt");
    }
}
