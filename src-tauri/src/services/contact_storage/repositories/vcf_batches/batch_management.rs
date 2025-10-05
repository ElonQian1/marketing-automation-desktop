/// VCF批次管理模块
/// 
/// 负责批次与号码的关联管理、批量操作等高级功能

use rusqlite::{Connection, Result as SqliteResult, params};
use crate::services::contact_storage::models::{ContactNumberDto, ContactNumberList};

/// VCF批次管理操作
pub struct BatchManagement;

impl BatchManagement {
    /// 创建批次号码映射
    pub fn create_batch_number_mapping(
        conn: &Connection,
        batch_id: &str,
        source_start_id: i64,
        source_end_id: i64,
    ) -> SqliteResult<()> {
        let mut stmt = conn.prepare(
            "INSERT INTO vcf_batch_numbers (batch_id, phone_number, vcf_entry_index)
             SELECT ?1, phone_number, ROW_NUMBER() OVER (ORDER BY id) - 1
             FROM contact_numbers 
             WHERE id >= ?2 AND id <= ?3"
        )?;
        
        stmt.execute(params![batch_id, source_start_id, source_end_id])?;
        Ok(())
    }

    /// 获取批次关联的号码列表
    pub fn get_batch_numbers(
        conn: &Connection,
        batch_id: &str,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ContactNumberList> {
        // 获取总数
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batch_numbers vbn 
             JOIN contact_numbers cn ON vbn.phone_number = cn.phone 
             WHERE vbn.batch_id = ?1",
            params![batch_id],
            |row| row.get(0),
        )?;

        // 获取数据
        let mut stmt = conn.prepare(
            "SELECT cn.id, cn.phone, cn.name, cn.source_file, cn.created_at, 
             cn.industry, cn.status, cn.assigned_at, cn.assigned_batch_id, 
             cn.imported_session_id, cn.imported_device_id
             FROM vcf_batch_numbers vbn 
             JOIN contact_numbers cn ON vbn.phone_number = cn.phone 
             WHERE vbn.batch_id = ?1
             ORDER BY vbn.vcf_entry_index
             LIMIT ?2 OFFSET ?3"
        )?;

        let number_iter = stmt.query_map([batch_id, &limit.to_string(), &offset.to_string()], |row| {
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

        let mut numbers = Vec::new();
        for number in number_iter {
            numbers.push(number?);
        }

        Ok(ContactNumberList {
            total,
            items: numbers,
            limit,
            offset,
        })
    }

    /// 批量删除VCF批次
    pub fn batch_delete_vcf_batches(
        conn: &Connection,
        batch_ids: &[String],
    ) -> SqliteResult<i64> {
        if batch_ids.is_empty() {
            return Ok(0);
        }

        let placeholders = batch_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!("DELETE FROM vcf_batches WHERE batch_id IN ({})", placeholders);
        
        let params: Vec<&dyn rusqlite::ToSql> = batch_ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();
        let deleted = conn.execute(&query, &params[..])?;

        Ok(deleted as i64)
    }

    /// 按设备获取最近的VCF批次
    pub fn get_recent_vcf_batches_by_device(
        conn: &Connection,
        device_id: &str,
        limit: i64,
    ) -> SqliteResult<Vec<String>> {
        let mut stmt = conn.prepare(
            "SELECT DISTINCT vb.batch_id
             FROM vcf_batches vb
             JOIN import_sessions is ON is.batch_id = vb.batch_id
             WHERE is.device_id = ?1
             ORDER BY vb.created_at DESC
             LIMIT ?2"
        )?;

        let batch_iter = stmt.query_map([device_id, &limit.to_string()], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut batch_ids = Vec::new();
        for batch_id in batch_iter {
            batch_ids.push(batch_id?);
        }

        Ok(batch_ids)
    }

    /// 获取最近的VCF批次
    pub fn get_recent_vcf_batches(
        conn: &Connection,
        limit: i64,
    ) -> SqliteResult<Vec<String>> {
        let mut stmt = conn.prepare(
            "SELECT batch_id FROM vcf_batches 
             ORDER BY created_at DESC 
             LIMIT ?1"
        )?;

        let batch_iter = stmt.query_map([limit], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut batch_ids = Vec::new();
        for batch_id in batch_iter {
            batch_ids.push(batch_id?);
        }

        Ok(batch_ids)
    }

    /// 按名称搜索VCF批次
    pub fn search_vcf_batches_by_name(
        conn: &Connection,
        name_pattern: &str,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<Vec<String>> {
        let mut stmt = conn.prepare(
            "SELECT batch_id FROM vcf_batches 
             WHERE batch_id LIKE ?1 
             ORDER BY created_at DESC 
             LIMIT ?2 OFFSET ?3"
        )?;

        let pattern = format!("%{}%", name_pattern);
        let batch_iter = stmt.query_map([&pattern, &limit.to_string(), &offset.to_string()], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut batch_ids = Vec::new();
        for batch_id in batch_iter {
            batch_ids.push(batch_id?);
        }

        Ok(batch_ids)
    }
}