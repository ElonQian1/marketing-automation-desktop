use rusqlite::{Connection, Result as SqlResult, params};

/// 状态管理操作：标记号码状态、重置状态等

/// 按ID数组标记号码为未导入状态
pub fn mark_numbers_as_not_imported_by_ids(
    conn: &Connection,
    number_ids: &[i64],
) -> SqlResult<i64> {
    if number_ids.is_empty() {
        return Ok(0);
    }
    
    let placeholders = number_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!(
        "UPDATE contact_numbers 
         SET used = 0, used_at = NULL, used_batch = NULL, status = 'not_imported', imported_device_id = NULL 
         WHERE id IN ({})",
        placeholders
    );
    
    let mut params = Vec::new();
    for id in number_ids {
        params.push(id as &dyn rusqlite::ToSql);
    }
    
    let affected = conn.execute(&sql, &params[..])?;
    Ok(affected as i64)
}

/// 按ID区间获取未消费的号码
pub fn fetch_numbers_by_id_range_unconsumed(
    conn: &Connection,
    start_id: i64,
    end_id: i64,
) -> SqlResult<Vec<super::super::super::models::ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, status, assigned_at, assigned_batch_id, imported_session_id, imported_device_id 
         FROM contact_numbers 
         WHERE id BETWEEN ?1 AND ?2 AND (used = 0 OR used IS NULL) 
         ORDER BY id"
    )?;
    
    let rows = stmt.query_map(params![start_id, end_id], |row| {
        Ok(super::super::super::models::ContactNumberDto {
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