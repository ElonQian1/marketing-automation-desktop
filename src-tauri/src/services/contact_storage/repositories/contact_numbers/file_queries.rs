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
    println!("[SQL] get_numbers_by_files - file_paths: {:?}", file_paths);
    println!("[SQL] get_numbers_by_files - only_available: {}", only_available);
    
    // 🔍 调试：查看数据库中所有的 source_file 值
    let debug_query = "SELECT DISTINCT source_file FROM contact_numbers LIMIT 10";
    let mut debug_stmt = conn.prepare(debug_query)?;
    let existing_files: Vec<String> = debug_stmt
        .query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    println!("[SQL] DEBUG - 数据库中现有的文件路径: {:?}", existing_files);
    
    if file_paths.is_empty() {
        println!("[SQL] get_numbers_by_files - file_paths is empty, returning empty vec");
        return Ok(Vec::new());
    }

    // 构建IN子句的占位符
    let placeholders: Vec<String> = file_paths.iter().map(|_| "?".to_string()).collect();
    let in_clause = placeholders.join(", ");
    
    // 为每个文件路径同时准备完整路径和文件名（用于匹配）
    let mut file_names = Vec::new();
    for path in file_paths {
        // 提取文件名（从路径中取最后一部分）
        let file_name = std::path::Path::new(path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(path);
        file_names.push(file_name.to_string());
    }
    println!("[SQL] DEBUG - 提取的文件名: {:?}", file_names);

    let status_filter = if only_available {
        "AND (status = 'available' OR status IS NULL)"
    } else {
        ""
    };

    // 修改查询：同时匹配完整路径和文件名
    // 使用 OR 条件，支持两种存储格式
    let query = format!(
        r#"
        SELECT 
            id, phone, name, source_file, created_at, 
            industry, status, assigned_at, assigned_batch_id, 
            imported_session_id, imported_device_id
        FROM contact_numbers
        WHERE (source_file IN ({}) OR source_file IN ({}))
        {}
        ORDER BY id ASC
        "#,
        in_clause,      // 完整路径
        placeholders.join(", "),  // 文件名
        status_filter
    );
    
    println!("[SQL] get_numbers_by_files - query: {}", query);

    let mut stmt = conn.prepare(&query)?;
    
    // 绑定参数：先绑定完整路径，再绑定文件名
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    // 第一组：完整路径
    for path in file_paths {
        params.push(Box::new(path.clone()));
    }
    
    // 第二组：文件名
    for file_name in file_names {
        params.push(Box::new(file_name));
    }
    
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    println!("[SQL] DEBUG - 绑定参数数量: {}", param_refs.len());
    
    let rows = stmt.query_map(param_refs.as_slice(), map_contact_number_row)?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    
    println!("[SQL] get_numbers_by_files - result count: {}", result.len());
    
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
