use rusqlite::{Connection, Result as SqlResult, params};
use super::super::super::models::*;

/// 批次管理操作：分配号码到设备、标记使用状态、批次查询等

/// 标记ID区间内的号码为已使用
pub fn mark_numbers_used_by_id_range(
    conn: &Connection,
    start_id: i64,
    end_id: i64,
    batch_id: &str,
) -> SqlResult<i64> {
    let affected = conn.execute(
        "UPDATE contact_numbers 
         SET used = 1, used_at = datetime('now'), used_batch = ?1, status = 'imported' 
         WHERE id >= ?2 AND id <= ?3",
        params![batch_id, start_id, end_id],
    )?;
    
    Ok(affected as i64)
}

/// 分配号码给设备
pub fn allocate_numbers_to_device(
    conn: &Connection,
    device_id: &str,
    count: i64,
    industry: Option<&str>,
) -> SqlResult<Vec<ContactNumberDto>> {
    // 查询可用号码并收集结果
    let mut numbers = Vec::new();
    
    if let Some(ind) = industry {
        let mut stmt = conn.prepare(
            "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
             FROM contact_numbers 
             WHERE (used = 0 OR used IS NULL) AND industry = ?1 
             ORDER BY id 
             LIMIT ?2"
        )?;
        
        let rows = stmt.query_map(params![ind, count], |row| {
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
        
        for row_result in rows {
            numbers.push(row_result?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
             FROM contact_numbers 
             WHERE (used = 0 OR used IS NULL) 
             ORDER BY id 
             LIMIT ?1"
        )?;
        
        let rows = stmt.query_map(params![count], |row| {
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
        
        for row_result in rows {
            numbers.push(row_result?);
        }
    }
    
    // 标记这些号码为已分配给设备
    if !numbers.is_empty() {
        let ids: Vec<i64> = numbers.iter().map(|n| n.id).collect();
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let update_sql = format!(
            "UPDATE contact_numbers 
             SET imported_device_id = ? 
             WHERE id IN ({})",
            placeholders
        );
        
        let mut update_params: Vec<&dyn rusqlite::ToSql> = vec![&device_id];
        for id in &ids {
            update_params.push(id);
        }
        
        conn.execute(&update_sql, &update_params[..])?;
    }
    
    Ok(numbers)
}

/// 设置指定ID区间号码的行业标签
pub fn set_industry_by_id_range(
    conn: &Connection,
    start_id: i64,
    end_id: i64,
    industry: &str,
) -> SqlResult<i64> {
    let affected = conn.execute(
        "UPDATE contact_numbers SET industry = ?1 WHERE id >= ?2 AND id <= ?3",
        params![industry, start_id, end_id],
    )?;
    
    Ok(affected as i64)
}

/// 为VCF批次标记号码行业
pub fn tag_numbers_industry_by_vcf_batch(
    conn: &Connection,
    batch_id: &str,
    industry: &str,
) -> SqlResult<i64> {
    let affected = conn.execute(
        "UPDATE contact_numbers SET industry = ?1 WHERE used_batch = ?2",
        params![industry, batch_id],
    )?;
    
    Ok(affected as i64)
}