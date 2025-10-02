/// VCF批次仓储
/// 
/// 负责VCF批次相关的数据操作，包括：
/// - VCF批次的创建和查询
/// - 批次与号码的关联管理
/// - 批次记录的生命周期管理

use chrono::Local;
use rusqlite::{params, Connection, OptionalExtension, Result as SqlResult};
use super::super::models::{VcfBatchDto, VcfBatchList};

/// 创建VCF批次记录
pub fn create_vcf_batch(
    conn: &Connection, 
    batch_id: &str, 
    vcf_file_path: &str, 
    source_start_id: Option<i64>, 
    source_end_id: Option<i64>
) -> SqlResult<()> {
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "INSERT INTO vcf_batches (batch_id, vcf_file_path, source_start_id, source_end_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![batch_id, vcf_file_path, source_start_id, source_end_id, now],
    )?;
    Ok(())
}

/// 列出VCF批次记录
pub fn list_vcf_batches(conn: &Connection, limit: i64, offset: i64) -> SqlResult<VcfBatchList> {
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM vcf_batches", [], |row| row.get(0))?;

    let mut stmt = conn.prepare(
        "SELECT batch_id, vcf_file_path, source_start_id, source_end_id, created_at FROM vcf_batches ORDER BY created_at DESC LIMIT ?1 OFFSET ?2",
    )?;
    let rows = stmt.query_map(params![limit, offset], |row| {
        Ok(VcfBatchDto {
            batch_id: row.get(0)?,
            vcf_file_path: row.get(1)?,
            source_start_id: row.get(2)?,
            source_end_id: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;

    Ok(VcfBatchList {
        items: rows.collect::<Result<Vec<_>, _>>()?,
        total,
        limit,
        offset,
    })
}

/// 获取单个VCF批次记录
pub fn get_vcf_batch(conn: &Connection, batch_id: &str) -> SqlResult<Option<VcfBatchDto>> {
    let mut stmt = conn.prepare(
        "SELECT batch_id, vcf_file_path, source_start_id, source_end_id, created_at FROM vcf_batches WHERE batch_id = ?1",
    )?;
    let result = stmt.query_row(params![batch_id], |row| {
        Ok(VcfBatchDto {
            batch_id: row.get(0)?,
            vcf_file_path: row.get(1)?,
            source_start_id: row.get(2)?,
            source_end_id: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).optional()?;

    Ok(result)
}

/// 创建带号码关联的VCF批次
/// 
/// 在 vcf_batch_numbers 表中记录批次与号码的关联关系
pub fn create_vcf_batch_with_numbers(
    conn: &Connection, 
    batch_id: &str, 
    vcf_file_path: &str, 
    source_start_id: Option<i64>, 
    source_end_id: Option<i64>, 
    number_ids: &[i64]
) -> SqlResult<usize> {
    // 创建批次记录
    create_vcf_batch(conn, batch_id, vcf_file_path, source_start_id, source_end_id)?;

    // 创建批次与号码的关联
    let mut inserted_count = 0;
    for &number_id in number_ids {
        let affected = conn.execute(
            "INSERT OR IGNORE INTO vcf_batch_numbers (batch_id, number_id) VALUES (?1, ?2)",
            params![batch_id, number_id],
        )?;
        inserted_count += affected;
    }

    Ok(inserted_count)
}

/// 删除VCF批次记录及其关联
/// 
/// 同时删除 vcf_batches 和 vcf_batch_numbers 中的相关记录
pub fn delete_vcf_batch(conn: &Connection, batch_id: &str) -> SqlResult<bool> {
    // 删除批次与号码的关联
    conn.execute(
        "DELETE FROM vcf_batch_numbers WHERE batch_id = ?1",
        params![batch_id],
    )?;

    // 删除批次记录
    let affected = conn.execute(
        "DELETE FROM vcf_batches WHERE batch_id = ?1",
        params![batch_id],
    )?;

    Ok(affected > 0)
}

/// 获取VCF批次的统计信息
pub fn get_vcf_batch_stats(conn: &Connection, batch_id: &str) -> SqlResult<Option<VcfBatchStats>> {
    // 首先检查批次是否存在
    let batch_exists: bool = conn.query_row(
        "SELECT 1 FROM vcf_batches WHERE batch_id = ?1",
        params![batch_id],
        |_| Ok(true)
    ).optional()?.unwrap_or(false);

    if !batch_exists {
        return Ok(None);
    }

    // 获取关联的号码统计
    let total_numbers: i64 = conn.query_row(
        "SELECT COUNT(*) FROM vcf_batch_numbers WHERE batch_id = ?1",
        params![batch_id],
        |row| row.get(0)
    )?;

    let used_numbers: i64 = conn.query_row(
        "SELECT COUNT(*) FROM vcf_batch_numbers vbn 
         JOIN contact_numbers cn ON vbn.number_id = cn.id 
         WHERE vbn.batch_id = ?1 AND cn.used = 1",
        params![batch_id],
        |row| row.get(0)
    )?;

    let imported_numbers: i64 = conn.query_row(
        "SELECT COUNT(*) FROM vcf_batch_numbers vbn 
         JOIN contact_numbers cn ON vbn.number_id = cn.id 
         WHERE vbn.batch_id = ?1 AND cn.status = 'imported'",
        params![batch_id],
        |row| row.get(0)
    )?;

    Ok(Some(VcfBatchStats {
        batch_id: batch_id.to_string(),
        total_numbers,
        used_numbers,
        unused_numbers: total_numbers - used_numbers,
        imported_numbers,
        not_imported_numbers: total_numbers - imported_numbers,
    }))
}

/// 批量删除VCF批次
pub fn delete_vcf_batches(conn: &Connection, batch_ids: &[String]) -> SqlResult<i64> {
    if batch_ids.is_empty() {
        return Ok(0);
    }

    let mut total_deleted = 0i64;
    
    for batch_id in batch_ids {
        if delete_vcf_batch(conn, batch_id)? {
            total_deleted += 1;
        }
    }

    Ok(total_deleted)
}

/// VCF批次统计信息
pub struct VcfBatchStats {
    pub batch_id: String,
    pub total_numbers: i64,
    pub used_numbers: i64,
    pub unused_numbers: i64,
    pub imported_numbers: i64,
    pub not_imported_numbers: i64,
}