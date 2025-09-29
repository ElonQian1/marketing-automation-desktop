use rusqlite::{Connection, Result as SqlResult, ToSql};

/// 按可选筛选条件（search/industry/status）返回所有号码的 ID 列表
/// - search: 在 phone/name 上做 LIKE 匹配（模糊）
/// - industry: 精确匹配（去除两侧空白后比较；空视为空串）
/// - status: 精确匹配
pub fn list_number_ids(
    conn: &Connection,
    search: Option<String>,
    industry: Option<String>,
    status: Option<String>,
) -> SqlResult<Vec<i64>> {
    let mut sql = String::from("SELECT id FROM contact_numbers");
    let mut first = true;
    let mut params: Vec<&dyn ToSql> = Vec::new();

    let mut kw_holder: Option<String> = None;
    let mut industry_holder: Option<String> = None;
    let mut status_holder: Option<String> = None;

    if search.as_ref().map(|s| s.trim().is_empty()).unwrap_or(true) == false {
        let kw = format!("%{}%", search.as_ref().unwrap().trim());
        kw_holder = Some(kw);
        sql.push_str(if first { " WHERE (phone LIKE ?1 OR name LIKE ?1)" } else { " AND (phone LIKE ? OR name LIKE ?)" });
        first = false;
        // 两次使用同一个占位参数值
        params.push(kw_holder.as_ref().unwrap());
        params.push(kw_holder.as_ref().unwrap());
    }

    if let Some(ind) = industry.as_ref() {
        let ind_trimmed = ind.trim().to_string();
        industry_holder = Some(ind_trimmed);
        sql.push_str(if first { " WHERE COALESCE(TRIM(industry),'') = ?" } else { " AND COALESCE(TRIM(industry),'') = ?" });
        first = false;
        params.push(industry_holder.as_ref().unwrap());
    }

    if let Some(st) = status.as_ref() {
        let st_val = st.trim().to_string();
        status_holder = Some(st_val);
        sql.push_str(if first { " WHERE status = ?" } else { " AND status = ?" });
        first = false;
        params.push(status_holder.as_ref().unwrap());
    }

    sql.push_str(" ORDER BY id ASC");

    let mut stmt = conn.prepare(&sql)?;
    let mut rows = stmt.query(&params[..])?;
    let mut ids: Vec<i64> = Vec::new();
    while let Some(row) = rows.next()? {
        let id: i64 = row.get(0)?;
        ids.push(id);
    }
    Ok(ids)
}
