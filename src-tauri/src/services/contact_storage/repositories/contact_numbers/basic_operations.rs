use rusqlite::{Connection, Result as SqlResult, params};
use super::super::super::models::*;

/// 基础CRUD操作：插入、查询、获取单个号码等

/// 插入联系人号码到数据库
pub fn insert_numbers(
    conn: &Connection,
    numbers: &[(String, String)],
    source_file: &str,
) -> SqlResult<(i64, i64, Vec<String>)> {
    let mut inserted_count = 0;
    let mut duplicate_count = 0;
    let mut errors = Vec::new();
    
    for (phone, name) in numbers {
        match conn.execute(
            "INSERT INTO contact_numbers (phone, name, source_file, created_at) VALUES (?1, ?2, ?3, datetime('now'))",
            params![phone, name, source_file],
        ) {
            Ok(_) => inserted_count += 1,
            Err(rusqlite::Error::SqliteFailure(err, _)) if err.code == rusqlite::ErrorCode::ConstraintViolation => {
                duplicate_count += 1;
            }
            Err(e) => errors.push(format!("插入号码 {} 失败: {}", phone, e)),
        }
    }
    
    Ok((inserted_count, duplicate_count, errors))
}

/// 简单列出联系人号码
pub fn list_numbers(
    conn: &Connection,
    limit: i64,
    offset: i64,
) -> SqlResult<ContactNumberList> {
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers",
        [],
        |row| row.get(0),
    )?;
    
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, status, assigned_at, assigned_batch_id, imported_session_id, imported_device_id 
         FROM contact_numbers ORDER BY id DESC LIMIT ?1 OFFSET ?2"
    )?;
    
    let rows = stmt.query_map(params![limit, offset], |row| {
        Ok(ContactNumberDto {
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
    })?;
    
    let mut items = Vec::new();
    for row_result in rows {
        items.push(row_result?);
    }
    
    Ok(ContactNumberList {
        total,
        items,
        limit,
        offset,
    })
}

/// 根据ID获取单个号码
pub fn get_number_by_id(
    conn: &Connection,
    id: i64,
) -> SqlResult<Option<ContactNumberDto>> {
    let result = conn.query_row(
        "SELECT id, phone, name, source_file, created_at, industry, status, assigned_at, assigned_batch_id, imported_session_id, imported_device_id 
         FROM contact_numbers WHERE id = ?1",
        params![id],
        |row| {
            Ok(ContactNumberDto {
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
    );
    
    match result {
        Ok(dto) => Ok(Some(dto)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

/// 按ID区间获取号码
pub fn fetch_numbers_by_id_range(
    conn: &Connection,
    start_id: i64,
    end_id: i64,
) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, status, assigned_at, assigned_batch_id, imported_session_id, imported_device_id 
         FROM contact_numbers WHERE id BETWEEN ?1 AND ?2 ORDER BY id"
    )?;
    
    let rows = stmt.query_map(params![start_id, end_id], |row| {
        Ok(ContactNumberDto {
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
    })?;
    
    let mut numbers = Vec::new();
    for row_result in rows {
        numbers.push(row_result?);
    }
    
    Ok(numbers)
}