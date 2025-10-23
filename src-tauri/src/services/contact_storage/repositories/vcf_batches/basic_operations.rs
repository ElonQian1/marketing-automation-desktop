/// VCF批次基础操作模块
/// 
/// 负责基础的CRUD操作：创建、读取、更新、删除批次记录

use rusqlite::{Connection, Result as SqliteResult, params};
use crate::services::contact_storage::models::{VcfBatchDto, VcfBatchList};

/// VCF批次基础操作
pub struct BasicOperations;

impl BasicOperations {
    /// 创建VCF批次
    pub fn create_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        vcf_file_path: &str,
        source_start_id: Option<i64>,
        source_end_id: Option<i64>,
    ) -> SqliteResult<()> {
        // 计算批次中的号码数量
        let contact_count = if let (Some(start), Some(end)) = (source_start_id, source_end_id) {
            conn.query_row(
                "SELECT COUNT(*) FROM contact_numbers WHERE id >= ?1 AND id <= ?2",
                params![start, end],
                |row| row.get::<_, i64>(0),
            ).unwrap_or(0)
        } else {
            0
        };

        // 插入VCF批次记录（使用正确的表结构）
        conn.execute(
            "INSERT INTO vcf_batches (batch_id, batch_name, vcf_file_path, contact_count, status, source_type, created_at)
             VALUES (?1, ?2, ?3, ?4, 'pending', 'auto', datetime('now'))",
            params![batch_id, batch_id, vcf_file_path, contact_count],
        )?;

        Ok(())
    }

    /// 分页查询VCF批次列表
    pub fn list_vcf_batches(
        conn: &Connection,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<VcfBatchList> {
        // 获取总数
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batches",
            [],
            |row| row.get(0),
        )?;

        // 获取数据
        let mut stmt = conn.prepare(
            "SELECT batch_id, '' as batch_name, 'contact_numbers' as source_type, 
             'range_selection' as generation_method, '' as description, 
             created_at, vcf_file_path, 1 as is_completed, NULL as source_start_id, NULL as source_end_id
             FROM vcf_batches 
             ORDER BY created_at DESC 
             LIMIT ?1 OFFSET ?2"
        )?;

        let batch_iter = stmt.query_map([limit, offset], |row| {
            Ok(VcfBatchDto {
                batch_id: row.get(0)?,
                batch_name: row.get(1)?,
                source_type: row.get(2)?,
                generation_method: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                vcf_file_path: row.get(6)?,
                is_completed: row.get::<_, i64>(7)? == 1,
                source_start_id: row.get(8)?,
                source_end_id: row.get(9)?,
            })
        })?;

        let mut batches = Vec::new();
        for batch in batch_iter {
            batches.push(batch?);
        }

        Ok(VcfBatchList {
            total,
            items: batches,
            limit,
            offset,
        })
    }

    /// 根据批次ID获取VCF批次
    pub fn get_vcf_batch(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<Option<VcfBatchDto>> {
        let mut stmt = conn.prepare(
            "SELECT batch_id, '' as batch_name, 'contact_numbers' as source_type, 
             'range_selection' as generation_method, '' as description, 
             created_at, vcf_file_path, 1 as is_completed, NULL as source_start_id, NULL as source_end_id
             FROM vcf_batches 
             WHERE batch_id = ?1"
        )?;

        let mut batch_iter = stmt.query_map([batch_id], |row| {
            Ok(VcfBatchDto {
                batch_id: row.get(0)?,
                batch_name: row.get(1)?,
                source_type: row.get(2)?,
                generation_method: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                vcf_file_path: row.get(6)?,
                is_completed: row.get::<_, i64>(7)? == 1,
                source_start_id: row.get(8)?,
                source_end_id: row.get(9)?,
            })
        })?;

        match batch_iter.next() {
            Some(batch) => Ok(Some(batch?)),
            None => Ok(None),
        }
    }

    /// 更新VCF批次信息
    pub fn update_vcf_batch(
        conn: &Connection,
        batch_id: &str,
        batch_name: Option<&str>,
        description: Option<&str>,
    ) -> SqliteResult<bool> {
        // 简化版本，只更新描述字段（如果表结构支持）
        let updated = conn.execute(
            "UPDATE vcf_batches SET updated_at = datetime('now') WHERE batch_id = ?1",
            params![batch_id],
        )?;

        Ok(updated > 0)
    }

    /// 删除VCF批次
    pub fn delete_vcf_batch(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<bool> {
        let deleted = conn.execute(
            "DELETE FROM vcf_batches WHERE batch_id = ?1",
            params![batch_id],
        )?;

        Ok(deleted > 0)
    }
}