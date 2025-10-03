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

/// 根据ID获取单个号码
pub fn get_number_by_id(
    conn: &Connection,
    id: i64,
) -> SqlResult<Option<ContactNumberDto>> {
    let result = conn.query_row(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
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
                used: row.get(6)?,
                used_at: row.get(7)?,
                used_batch: row.get(8)?,
                status: row.get(9)?,
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
    
    let used: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE used = 1",
        [],
        |row| row.get(0),
    )?;
    
    let unused: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE used = 0 OR used IS NULL",
        [],
        |row| row.get(0),
    )?;
    
    let vcf_generated: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE used_batch IS NOT NULL",
        [],
        |row| row.get(0),
    )?;
    
    let imported: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE status = 'imported'",
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
        used,
        unused,
        vcf_generated,
        imported,
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

/// 获取指定数量的联系人号码
pub fn fetch_numbers(
    conn: &Connection,
    count: i64,
) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers ORDER BY id ASC LIMIT ?1"
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
    
    let mut numbers = Vec::new();
    for row_result in rows {
        numbers.push(row_result?);
    }
    
    Ok(numbers)
}

/// 获取未分类的联系人号码
pub fn fetch_unclassified_numbers(
    conn: &Connection,
    count: i64,
    only_unconsumed: bool,
) -> SqlResult<Vec<ContactNumberDto>> {
    let sql = if only_unconsumed {
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers 
         WHERE industry IS NULL AND (used = 0 OR used IS NULL) 
         ORDER BY id ASC LIMIT ?1"
    } else {
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers 
         WHERE industry IS NULL 
         ORDER BY id ASC LIMIT ?1"
    };
    
    let mut stmt = conn.prepare(sql)?;
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
    
    let mut numbers = Vec::new();
    for row_result in rows {
        numbers.push(row_result?);
    }
    
    Ok(numbers)
}

/// 按ID区间获取未消费的联系人号码
pub fn fetch_numbers_by_id_range_unconsumed(
    conn: &Connection,
    start_id: i64,
    end_id: i64,
) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers 
         WHERE id >= ?1 AND id <= ?2 AND (used = 0 OR used IS NULL) 
         ORDER BY id"
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

/// 列出未使用批次的联系人号码
pub fn list_numbers_without_batch(
    conn: &Connection,
    limit: i64,
    offset: i64,
) -> SqlResult<ContactNumberList> {
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE used_batch IS NULL",
        [],
        |row| row.get(0),
    )?;
    
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers 
         WHERE used_batch IS NULL 
         ORDER BY id DESC LIMIT ?1 OFFSET ?2"
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

/// 为设备分配号码（简化版本，返回分配的信息）
pub fn allocate_numbers_to_device(
    conn: &Connection,
    device_id: &str,
    count: i64,
    industry: Option<&str>,
) -> SqlResult<(String, String, Vec<i64>, i64)> {
    // 简化实现：查找可用号码
    let mut stmt = if let Some(ind) = industry {
        conn.prepare(
            "SELECT id FROM contact_numbers 
             WHERE (used = 0 OR used IS NULL) AND industry = ?1 
             ORDER BY id ASC LIMIT ?2"
        )?
    } else {
        conn.prepare(
            "SELECT id FROM contact_numbers 
             WHERE (used = 0 OR used IS NULL) 
             ORDER BY id ASC LIMIT ?1"
        )?
    };
    
    let mut number_ids = Vec::new();
    if let Some(ind) = industry {
        let rows = stmt.query_map(params![ind, count], |row| row.get::<_, i64>(0))?;
        for row_result in rows {
            number_ids.push(row_result?);
        }
    } else {
        let rows = stmt.query_map(params![count], |row| row.get::<_, i64>(0))?;
        for row_result in rows {
            number_ids.push(row_result?);
        }
    }
    
    // 生成批次ID和文件路径（使用简单的时间戳）
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let batch_id = format!("batch_{}", timestamp);
    let vcf_file_path = format!("/tmp/{}.vcf", batch_id);
    
    Ok((batch_id, vcf_file_path, number_ids.clone(), number_ids.len() as i64))
}

/// 列出未使用批次的联系人号码（带筛选）
pub fn list_numbers_without_batch_filtered(
    conn: &Connection,
    limit: i64,
    offset: i64,
    industry: Option<String>,
    status: Option<String>,
) -> SqlResult<ContactNumberList> {
    let mut where_conditions = vec!["used_batch IS NULL".to_string()];
    let mut params_vec = Vec::new();
    
    if let Some(ind) = &industry {
        where_conditions.push("industry = ?".to_string());
        params_vec.push(ind as &dyn rusqlite::ToSql);
    }
    
    if let Some(st) = &status {
        where_conditions.push("status = ?".to_string());
        params_vec.push(st as &dyn rusqlite::ToSql);
    }
    
    let where_clause = where_conditions.join(" AND ");
    
    let total: i64 = {
        let sql = format!("SELECT COUNT(*) FROM contact_numbers WHERE {}", where_clause);
        let mut stmt = conn.prepare(&sql)?;
        stmt.query_row(&params_vec[..], |row| row.get(0))?
    };
    
    params_vec.push(&limit as &dyn rusqlite::ToSql);
    params_vec.push(&offset as &dyn rusqlite::ToSql);
    
    let sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers WHERE {} ORDER BY id DESC LIMIT ? OFFSET ?",
        where_clause
    );
    
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(&params_vec[..], |row| {
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

/// 按批次列出联系人号码（带行业筛选）
pub fn list_numbers_by_batch_filtered(
    conn: &Connection,
    batch_id: &str,
    only_used: Option<bool>,
    industry: Option<String>,
    limit: i64,
    offset: i64,
) -> SqlResult<ContactNumberList> {
    let mut where_conditions = vec!["used_batch = ?".to_string()];
    let mut params_vec: Vec<&dyn rusqlite::ToSql> = vec![&batch_id];
    
    if let Some(used_only) = only_used {
        if used_only {
            where_conditions.push("used = 1".to_string());
        } else {
            where_conditions.push("(used = 0 OR used IS NULL)".to_string());
        }
    }
    
    if let Some(ind) = &industry {
        where_conditions.push("industry = ?".to_string());
        params_vec.push(ind as &dyn rusqlite::ToSql);
    }
    
    let where_clause = where_conditions.join(" AND ");
    
    let total: i64 = {
        let sql = format!("SELECT COUNT(*) FROM contact_numbers WHERE {}", where_clause);
        let mut stmt = conn.prepare(&sql)?;
        stmt.query_row(&params_vec[..], |row| row.get(0))?
    };
    
    params_vec.push(&limit as &dyn rusqlite::ToSql);
    params_vec.push(&offset as &dyn rusqlite::ToSql);
    
    let sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers WHERE {} ORDER BY id DESC LIMIT ? OFFSET ?",
        where_clause
    );
    
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(&params_vec[..], |row| {
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

/// 按批次列出联系人号码
pub fn list_numbers_by_batch(
    conn: &Connection,
    batch_id: &str,
    only_used: Option<bool>,
    limit: i64,
    offset: i64,
) -> SqlResult<ContactNumberList> {
    let (where_clause, total_where) = if let Some(used_only) = only_used {
        if used_only {
            ("WHERE used_batch = ?1 AND used = 1", "WHERE used_batch = ?1 AND used = 1")
        } else {
            ("WHERE used_batch = ?1 AND (used = 0 OR used IS NULL)", "WHERE used_batch = ?1 AND (used = 0 OR used IS NULL)")
        }
    } else {
        ("WHERE used_batch = ?1", "WHERE used_batch = ?1")
    };
    
    let total: i64 = conn.query_row(
        &format!("SELECT COUNT(*) FROM contact_numbers {}", total_where),
        params![batch_id],
        |row| row.get(0),
    )?;
    
    let sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers {} ORDER BY id DESC LIMIT ?2 OFFSET ?3",
        where_clause
    );
    
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(params![batch_id, limit, offset], |row| {
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

/// 列出联系人号码（增强筛选版本）
pub fn list_numbers_filtered(
    conn: &Connection,
    limit: i64,
    offset: i64,
    search: Option<String>,
    industry: Option<String>,
    status: Option<String>,
) -> SqlResult<ContactNumberList> {
    let mut where_conditions = Vec::new();
    let mut params_vec: Vec<String> = Vec::new();
    
    if let Some(search_term) = &search {
        where_conditions.push("(phone LIKE ? OR name LIKE ?)".to_string());
        let search_pattern = format!("%{}%", search_term);
        params_vec.push(search_pattern.clone());
        params_vec.push(search_pattern);
    }
    
    if let Some(ind) = &industry {
        where_conditions.push("industry = ?".to_string());
        params_vec.push(ind.clone());
    }
    
    if let Some(st) = &status {
        where_conditions.push("status = ?".to_string());
        params_vec.push(st.clone());
    }
    
    let where_clause = if where_conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_conditions.join(" AND "))
    };
    
    let total: i64 = {
        let sql = format!("SELECT COUNT(*) FROM contact_numbers {}", where_clause);
        let mut stmt = conn.prepare(&sql)?;
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p as &dyn rusqlite::ToSql).collect();
        stmt.query_row(&params_refs[..], |row| row.get(0))?
    };
    
    params_vec.push(limit.to_string());
    params_vec.push(offset.to_string());
    
    let sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers {} ORDER BY id DESC LIMIT ? OFFSET ?",
        where_clause
    );
    
    let mut stmt = conn.prepare(&sql)?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p as &dyn rusqlite::ToSql).collect();
    let rows = stmt.query_map(&params_refs[..], |row| {
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

/// 为VCF批次列出联系人号码
pub fn list_numbers_for_vcf_batch(
    conn: &Connection,
    batch_id: &str,
    limit: i64,
    offset: i64,
) -> SqlResult<ContactNumberList> {
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE used_batch = ?1",
        params![batch_id],
        |row| row.get(0),
    )?;
    
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers WHERE used_batch = ?1 ORDER BY id DESC LIMIT ?2 OFFSET ?3"
    )?;
    
    let rows = stmt.query_map(params![batch_id, limit, offset], |row| {
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

/// 为VCF批次中的号码标记行业分类
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
