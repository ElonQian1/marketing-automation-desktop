/// 联系人号码仓储
/// 
/// 负责联系人号码的CRUD操作，包括：
/// - 基本的增删改查
/// - 按条件筛选和分页
/// - 批次管理和状态更新
/// - 行业分类管理

use chrono::Local;
use rusqlite::{params, Connection, OptionalExtension, Result as SqlResult};
use super::super::models::{ContactNumberDto, ContactNumberList, ContactNumberStatsRaw};

/// 插入联系人号码
/// 
/// 返回：(插入数量, 重复数量, 错误列表)
pub fn insert_numbers(conn: &Connection, numbers: &[(String, String)], source_file: &str) -> (i64, i64, Vec<String>) {
    let mut inserted: i64 = 0;
    let mut duplicates: i64 = 0;
    let mut errors: Vec<String> = Vec::new();
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    for (phone, name) in numbers {
        let res = conn.execute(
            "INSERT OR IGNORE INTO contact_numbers (phone, name, source_file, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![phone, name, source_file, now],
        );
        match res {
            Ok(affected) => {
                if affected > 0 { inserted += 1; } else { duplicates += 1; }
            }
            Err(e) => errors.push(format!("{}: {}", phone, e)),
        }
    }

    (inserted, duplicates, errors)
}

/// 列出联系人号码（基础版本）
pub fn list_numbers(conn: &Connection, limit: i64, offset: i64, search: Option<String>) -> SqlResult<ContactNumberList> {
    let mut kw: Option<String> = None;

    if let Some(s) = search {
        let s = s.trim().to_string();
        if !s.is_empty() {
            kw = Some(format!("%{}%", s));
        }
    }

    let total: i64 = if let Some(ref keyword) = kw {
        let total_sql = "SELECT COUNT(*) FROM contact_numbers WHERE phone LIKE ?1 OR name LIKE ?1";
        conn.query_row(total_sql, params![keyword], |row| row.get(0))?
    } else {
        let total_sql = "SELECT COUNT(*) FROM contact_numbers";
        conn.query_row(total_sql, [], |row| row.get(0))?
    };

    let items: SqlResult<Vec<ContactNumberDto>> = if let Some(ref keyword) = kw {
        let list_sql = "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id FROM contact_numbers WHERE (phone LIKE ?1 OR name LIKE ?1) ORDER BY id DESC LIMIT ?2 OFFSET ?3";
        let mut stmt = conn.prepare(list_sql)?;
        let rows = stmt.query_map(params![keyword, limit, offset], |row| {
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
        rows.collect()
    } else {
        let list_sql = "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id FROM contact_numbers ORDER BY id DESC LIMIT ?1 OFFSET ?2";
        let mut stmt = conn.prepare(list_sql)?;
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
        rows.collect()
    };

    Ok(ContactNumberList {
        items: items?,
        total,
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
    status: Option<String>
) -> SqlResult<ContactNumberList> {
    let mut where_conditions = Vec::new();
    let mut params_list = Vec::new();

    if let Some(kw) = search.as_ref().filter(|s| !s.trim().is_empty()) {
        where_conditions.push("(phone LIKE ? OR name LIKE ?)".to_string());
        let kw_pattern = format!("%{}%", kw.trim());
        params_list.push(kw_pattern.clone());
        params_list.push(kw_pattern);
    }

    if let Some(ind) = industry.as_ref().filter(|s| !s.trim().is_empty()) {
        where_conditions.push("industry = ?".to_string());
        params_list.push(ind.clone());
    }

    if let Some(st) = status.as_ref().filter(|s| !s.trim().is_empty()) {
        where_conditions.push("status = ?".to_string());
        params_list.push(st.clone());
    }

    let where_sql = if where_conditions.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", where_conditions.join(" AND "))
    };

    let total_sql = format!("SELECT COUNT(*) FROM contact_numbers{}", where_sql);
    let total: i64 = {
        let mut stmt = conn.prepare(&total_sql)?;
        stmt.query_row(&params_list.iter().map(|s| s.as_str()).collect::<Vec<_>>(), |row| row.get(0))?
    };

    let list_sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id FROM contact_numbers{} ORDER BY id DESC LIMIT ? OFFSET ?",
        where_sql
    );

    let mut list_params = params_list.clone();
    list_params.push(limit.to_string());
    list_params.push(offset.to_string());

    let mut stmt = conn.prepare(&list_sql)?;
    let rows = stmt.query_map(&list_params.iter().map(|s| s.as_str()).collect::<Vec<_>>(), |row| {
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

    Ok(ContactNumberList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 获取联系人号码（按数量）
pub fn fetch_numbers(conn: &Connection, count: i64) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id FROM contact_numbers ORDER BY id ASC LIMIT ?1",
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

    rows.collect()
}

/// 获取未分类的联系人号码
pub fn fetch_unclassified_numbers(conn: &Connection, count: i64, only_unconsumed: bool) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = if only_unconsumed {
        conn.prepare(
            "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id FROM contact_numbers \
             WHERE (industry IS NULL OR industry = '') AND (used = 0 OR used IS NULL) ORDER BY id ASC LIMIT ?1",
        )?
    } else {
        conn.prepare(
            "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id FROM contact_numbers \
             WHERE (industry IS NULL OR industry = '') ORDER BY id ASC LIMIT ?1",
        )?
    };

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

    rows.collect()
}

/// 按ID区间获取联系人号码
pub fn fetch_numbers_by_id_range(conn: &Connection, start_id: i64, end_id: i64) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id \
         FROM contact_numbers WHERE id >= ?1 AND id <= ?2 ORDER BY id ASC",
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

    rows.collect()
}

/// 按ID区间获取未消费的联系人号码
pub fn fetch_numbers_by_id_range_unconsumed(conn: &Connection, start_id: i64, end_id: i64) -> SqlResult<Vec<ContactNumberDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id \
         FROM contact_numbers WHERE id >= ?1 AND id <= ?2 AND (used = 0 OR used IS NULL) ORDER BY id ASC",
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

    rows.collect()
}

/// 标记ID区间内的号码为已使用
pub fn mark_numbers_used_by_id_range(conn: &Connection, start_id: i64, end_id: i64, batch_id: &str) -> SqlResult<i64> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let affected = conn.execute(
        "UPDATE contact_numbers SET used = 1, used_at = ?1, used_batch = ?2 WHERE id >= ?3 AND id <= ?4",
        params![now, batch_id, start_id, end_id],
    )?;
    Ok(affected as i64)
}

/// 标记指定ID的号码为未导入状态
pub fn mark_numbers_as_not_imported_by_ids(conn: &Connection, number_ids: &[i64]) -> SqlResult<i64> {
    if number_ids.is_empty() {
        return Ok(0);
    }

    // 构建 IN 子句的占位符
    let placeholders = number_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!(
        "UPDATE contact_numbers SET used = 0, status = 'not_imported', imported_device_id = NULL WHERE id IN ({})",
        placeholders
    );

    let params: Vec<&dyn rusqlite::ToSql> = number_ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();
    let affected = conn.execute(&sql, &params[..])?;
    Ok(affected as i64)
}

/// 获取联系人号码统计信息
pub fn get_contact_number_stats(conn: &Connection) -> SqlResult<ContactNumberStatsRaw> {
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM contact_numbers", [], |row| row.get(0))?;
    let used: i64 = conn.query_row("SELECT COUNT(*) FROM contact_numbers WHERE used = 1", [], |row| row.get(0))?;
    let unused: i64 = total - used;
    
    let vcf_generated: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE status = 'vcf_generated'", 
        [], 
        |row| row.get(0)
    )?;
    
    let imported: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE status = 'imported'", 
        [], 
        |row| row.get(0)
    )?;

    Ok(ContactNumberStatsRaw {
        total,
        used,
        unused,
        vcf_generated,
        imported,
    })
}

/// 按ID区间设置号码的行业分类
pub fn set_numbers_industry_by_id_range(conn: &Connection, start_id: i64, end_id: i64, industry: &str) -> SqlResult<i64> {
    let affected = conn.execute(
        "UPDATE contact_numbers SET industry = ?1 WHERE id >= ?2 AND id <= ?3",
        params![industry, start_id, end_id],
    )?;
    Ok(affected as i64)
}

/// 列出未关联到任何批次的号码
pub fn list_numbers_without_batch(conn: &Connection, limit: i64, offset: i64) -> SqlResult<ContactNumberList> {
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM contact_numbers WHERE used_batch IS NULL OR used_batch = ''",
        [],
        |row| row.get(0),
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id \
         FROM contact_numbers WHERE used_batch IS NULL OR used_batch = '' ORDER BY id DESC LIMIT ?1 OFFSET ?2",
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

    Ok(ContactNumberList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 列出未关联到任何批次的号码（带筛选）
pub fn list_numbers_without_batch_filtered(
    conn: &Connection, 
    limit: i64, 
    offset: i64, 
    industry: Option<String>, 
    status: Option<String>
) -> SqlResult<ContactNumberList> {
    let mut where_conditions = vec!["(used_batch IS NULL OR used_batch = '')".to_string()];
    let mut params_list = Vec::new();

    if let Some(ind) = industry.as_ref().filter(|s| !s.trim().is_empty()) {
        where_conditions.push("industry = ?".to_string());
        params_list.push(ind.clone());
    }

    if let Some(st) = status.as_ref().filter(|s| !s.trim().is_empty()) {
        where_conditions.push("status = ?".to_string());
        params_list.push(st.clone());
    }

    let where_sql = format!(" WHERE {}", where_conditions.join(" AND "));

    let total_sql = format!("SELECT COUNT(*) FROM contact_numbers{}", where_sql);
    let total: i64 = {
        let mut stmt = conn.prepare(&total_sql)?;
        stmt.query_row(&params_list.iter().map(|s| s.as_str()).collect::<Vec<_>>(), |row| row.get(0))?
    };

    let list_sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id \
         FROM contact_numbers{} ORDER BY id DESC LIMIT ? OFFSET ?",
        where_sql
    );

    let mut list_params = params_list.clone();
    list_params.push(limit.to_string());
    list_params.push(offset.to_string());

    let mut stmt = conn.prepare(&list_sql)?;
    let rows = stmt.query_map(&list_params.iter().map(|s| s.as_str()).collect::<Vec<_>>(), |row| {
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

    Ok(ContactNumberList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 获取所有行业分类
pub fn get_distinct_industries(conn: &Connection) -> SqlResult<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT industry FROM contact_numbers WHERE industry IS NOT NULL AND industry != '' ORDER BY industry"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(row.get::<_, String>(0)?)
    })?;

    rows.collect()
}

/// 为设备分配联系人号码
/// 
/// 返回：(批次ID, VCF文件路径, 号码ID列表, 分配数量)
pub fn allocate_numbers_to_device(
    conn: &Connection, 
    device_id: &str, 
    count: i64, 
    industry: Option<&str>
) -> SqlResult<(String, String, Vec<i64>, i64)> {
    // 生成批次ID和VCF文件路径
    let now = Local::now();
    let timestamp = now.format("%Y%m%d_%H%M%S").to_string();
    let batch_id = format!("batch_{}_{}", device_id, timestamp);
    let vcf_file_path = format!("vcf/{}.vcf", batch_id);

    // 查询可用号码
    let sql = if let Some(ind) = industry {
        "SELECT id FROM contact_numbers WHERE (used = 0 OR used IS NULL) AND industry = ? ORDER BY id ASC LIMIT ?"
    } else {
        "SELECT id FROM contact_numbers WHERE (used = 0 OR used IS NULL) ORDER BY id ASC LIMIT ?"
    };

    let mut stmt = conn.prepare(sql)?;
    let rows = if let Some(ind) = industry {
        stmt.query_map(params![ind, count], |row| Ok(row.get::<_, i64>(0)?))?
    } else {
        stmt.query_map(params![count], |row| Ok(row.get::<_, i64>(0)?))?
    };

    let number_ids: Vec<i64> = rows.collect::<Result<Vec<_>, _>>()?;
    let actual_count = number_ids.len() as i64;

    if actual_count > 0 {
        // 标记号码为已使用
        let now_str = now.format("%Y-%m-%d %H:%M:%S").to_string();
        let placeholders = number_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let update_sql = format!(
            "UPDATE contact_numbers SET used = 1, used_at = ?, used_batch = ?, status = 'vcf_generated', imported_device_id = ? WHERE id IN ({})",
            placeholders
        );

        let mut params: Vec<&dyn rusqlite::ToSql> = vec![
            &now_str as &dyn rusqlite::ToSql,
            &batch_id as &dyn rusqlite::ToSql,
            &device_id as &dyn rusqlite::ToSql,
        ];
        for id in &number_ids {
            params.push(id as &dyn rusqlite::ToSql);
        }

        conn.execute(&update_sql, &params[..])?;
    }

    Ok((batch_id, vcf_file_path, number_ids, actual_count))
}

/// 按批次列出联系人号码
pub fn list_numbers_by_batch(
    conn: &Connection, 
    batch_id: &str, 
    only_used: Option<bool>, 
    limit: i64, 
    offset: i64
) -> SqlResult<ContactNumberList> {
    let (where_clause, params) = if let Some(used_filter) = only_used {
        if used_filter {
            ("WHERE used_batch = ? AND used = 1", vec![batch_id, "1"])
        } else {
            ("WHERE used_batch = ? AND (used = 0 OR used IS NULL)", vec![batch_id, "0"])
        }
    } else {
        ("WHERE used_batch = ?", vec![batch_id])
    };

    let total_sql = format!("SELECT COUNT(*) FROM contact_numbers {}", where_clause);
    let total: i64 = {
        let mut stmt = conn.prepare(&total_sql)?;
        stmt.query_row(&params[..], |row| row.get(0))?
    };

    let list_sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id \
         FROM contact_numbers {} ORDER BY id DESC LIMIT ? OFFSET ?",
        where_clause
    );

    let mut list_params = params;
    list_params.push(&limit.to_string());
    list_params.push(&offset.to_string());

    let mut stmt = conn.prepare(&list_sql)?;
    let rows = stmt.query_map(&list_params[..], |row| {
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

    Ok(ContactNumberList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
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
    let mut params_list = vec![batch_id.to_string()];

    if let Some(used_filter) = only_used {
        if used_filter {
            where_conditions.push("used = 1".to_string());
        } else {
            where_conditions.push("(used = 0 OR used IS NULL)".to_string());
        }
    }

    if let Some(ind) = industry.as_ref().filter(|s| !s.trim().is_empty()) {
        where_conditions.push("industry = ?".to_string());
        params_list.push(ind.clone());
    }

    let where_sql = format!(" WHERE {}", where_conditions.join(" AND "));

    let total_sql = format!("SELECT COUNT(*) FROM contact_numbers{}", where_sql);
    let total: i64 = {
        let mut stmt = conn.prepare(&total_sql)?;
        stmt.query_row(&params_list.iter().map(|s| s.as_str()).collect::<Vec<_>>(), |row| row.get(0))?
    };

    let list_sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id \
         FROM contact_numbers{} ORDER BY id DESC LIMIT ? OFFSET ?",
        where_sql
    );

    let mut list_params = params_list.clone();
    list_params.push(limit.to_string());
    list_params.push(offset.to_string());

    let mut stmt = conn.prepare(&list_sql)?;
    let rows = stmt.query_map(&list_params.iter().map(|s| s.as_str()).collect::<Vec<_>>(), |row| {
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

    Ok(ContactNumberList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 为VCF批次列出联系人号码
pub fn list_numbers_for_vcf_batch(conn: &Connection, batch_id: &str, limit: i64, offset: i64) -> SqlResult<ContactNumberList> {
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM vcf_batch_numbers vbn 
         JOIN contact_numbers cn ON vbn.number_id = cn.id 
         WHERE vbn.batch_id = ?",
        params![batch_id],
        |row| row.get(0),
    )?;

    let mut stmt = conn.prepare(
        "SELECT cn.id, cn.phone, cn.name, cn.source_file, cn.created_at, cn.industry, cn.used, cn.used_at, cn.used_batch, cn.status, cn.imported_device_id 
         FROM vcf_batch_numbers vbn 
         JOIN contact_numbers cn ON vbn.number_id = cn.id 
         WHERE vbn.batch_id = ? 
         ORDER BY cn.id DESC LIMIT ? OFFSET ?",
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

    Ok(ContactNumberList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 为VCF批次中的号码标记行业分类
pub fn tag_numbers_industry_by_vcf_batch(conn: &Connection, batch_id: &str, industry: &str) -> SqlResult<i64> {
    let affected = conn.execute(
        "UPDATE contact_numbers SET industry = ?1 
         WHERE id IN (
             SELECT number_id FROM vcf_batch_numbers WHERE batch_id = ?2
         )",
        params![industry, batch_id],
    )?;
    Ok(affected as i64)
}