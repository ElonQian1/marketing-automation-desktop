use rusqlite::{Connection, Result as SqlResult, params};
use super::super::models::*;

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
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
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
            used: row.get(6)?,
            used_at: row.get(7)?,
            used_batch: row.get(8)?,
            status: row.get(9)?,
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

/// 按ID区间获取号码
pub fn fetch_numbers_by_id_range(
    conn: &Connection,
    start_id: i64,
    end_id: i64,
) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers WHERE id >= ?1 AND id <= ?2 ORDER BY id"
    )?;
    
    let rows = stmt.query_map(params![start_id, end_id], |row| {
        Ok(ContactNumberDto {
            id: row.get(0)?,
            phone: row.get(1)?,
            name: row.get(2)?,
            source_file: row.get(3)?,
            created_at: row.get(4)?,
            industry: row.get(5)?,
            used: row.get(6)?,
            used_at: row.get(7)?,
            used_batch: row.get(8)?,
            status: row.get(9)?,
            imported_device_id: row.get(10)?,
        })
    })?;
    
    let mut numbers = Vec::new();
    for row_result in rows {
        numbers.push(row_result?);
    }
    
    Ok(numbers)
}

/// 获取统计信息
pub fn get_contact_number_stats(
    conn: &Connection,
) -> SqlResult<ContactNumberStatsRaw> {
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM contact_numbers", [], |row| row.get(0))?;
    
    let unclassified: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE industry IS NULL",
        [],
        |row| row.get(0),
    )?;
    
    let not_imported: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE status IS NULL OR status = 'not_imported'",
        [],
        |row| row.get(0),
    )?;
    
    let mut per_industry = std::collections::HashMap::new();
    let mut stmt = conn.prepare("SELECT industry, COUNT(*) FROM contact_numbers WHERE industry IS NOT NULL GROUP BY industry")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    
    for row_result in rows {
        let (industry, count) = row_result?;
        per_industry.insert(industry, count);
    }
    
    Ok(ContactNumberStatsRaw {
        total,
        unclassified,
        not_imported,
        per_industry,
    })
}

/// 获取所有不同的行业标签
pub fn get_distinct_industries(conn: &Connection) -> SqlResult<Vec<String>> {
    let mut stmt = conn.prepare("SELECT DISTINCT industry FROM contact_numbers WHERE industry IS NOT NULL ORDER BY industry")?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    
    let mut industries = Vec::new();
    for row_result in rows {
        industries.push(row_result?);
    }
    
    Ok(industries)
}