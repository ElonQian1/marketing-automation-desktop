/// 复杂查询和过滤模块
/// 处理高级查询逻辑，如搜索、过滤、分页等

use rusqlite::{Connection, Result as SqliteResult};
use crate::services::contact_storage::models::{ContactNumberDto, ContactStatus};

/// 高级搜索和过滤查询
pub fn search_contact_numbers(
    conn: &Connection,
    keyword: Option<&str>,
    industry: Option<&str>,
    status: Option<&ContactStatus>,
    limit: i64,
    offset: i64,
) -> SqliteResult<Vec<ContactNumberDto>> {
    let mut where_conditions = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(kw) = keyword {
        where_conditions.push("phone LIKE ?");
        params_vec.push(Box::new(format!("%{}%", kw)));
    }

    if let Some(ind) = industry {
        where_conditions.push("industry = ?");
        params_vec.push(Box::new(ind.to_string()));
    }

    if let Some(st) = status {
        where_conditions.push("status = ?");
        params_vec.push(Box::new(st.clone()));
    }

    let where_clause = if where_conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_conditions.join(" AND "))
    };

    params_vec.push(Box::new(limit));
    params_vec.push(Box::new(offset));

    // V2.0: 更新为新字段顺序
    let sql = format!(
        "SELECT id, phone, name, source_file, created_at, industry, status, assigned_at, assigned_batch_id, imported_session_id, imported_device_id 
         FROM contact_numbers {} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?",
        where_clause
    );

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(&params_refs[..], |row| {
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

    let mut results = Vec::new();
    for row in rows {
        results.push(row?);
    }
    Ok(results)
}

/// 统计搜索结果数量
pub fn count_search_results(
    conn: &Connection,
    keyword: Option<&str>,
    industry: Option<&str>,
    status: Option<&ContactStatus>,
) -> SqliteResult<i64> {
    let mut where_conditions = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(kw) = keyword {
        where_conditions.push("phone LIKE ?");
        params_vec.push(Box::new(format!("%{}%", kw)));
    }

    if let Some(ind) = industry {
        where_conditions.push("industry = ?");
        params_vec.push(Box::new(ind.to_string()));
    }

    if let Some(st) = status {
        where_conditions.push("status = ?");
        params_vec.push(Box::new(st.clone()));
    }

    let where_clause = if where_conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_conditions.join(" AND "))
    };

    let sql = format!(
        "SELECT COUNT(*) FROM contact_numbers {}",
        where_clause
    );

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    
    conn.query_row(&sql, &params_refs[..], |row| row.get(0))
}

/// 获取所有满足条件的联系人号码ID
pub fn list_all_contact_number_ids(
    conn: &Connection,
    keyword: Option<&str>,
    industry: Option<&str>,
    status: Option<&ContactStatus>,
) -> SqliteResult<Vec<i64>> {
    let mut where_conditions = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(kw) = keyword {
        where_conditions.push("phone LIKE ?");
        params_vec.push(Box::new(format!("%{}%", kw)));
    }

    if let Some(ind) = industry {
        where_conditions.push("industry = ?");
        params_vec.push(Box::new(ind.to_string()));
    }

    if let Some(st) = status {
        where_conditions.push("status = ?");
        params_vec.push(Box::new(st.clone()));
    }

    let where_clause = if where_conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_conditions.join(" AND "))
    };

    let sql = format!(
        "SELECT id FROM contact_numbers {} ORDER BY id",
        where_clause
    );

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(&params_refs[..], |row| {
        Ok(row.get::<_, i64>(0)?)
    })?;

    let mut ids = Vec::new();
    for row_result in rows {
        ids.push(row_result?);
    }
    Ok(ids)
}