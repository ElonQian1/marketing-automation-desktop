use rusqlite::{Connection, Result as SqlResult};
use super::super::super::models::*;
use std::collections::HashMap;

/// 统计和查询操作：获取统计信息、行业分布等

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
    
    let mut per_industry = HashMap::new();
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