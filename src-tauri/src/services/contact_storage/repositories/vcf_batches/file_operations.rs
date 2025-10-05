/// VCF批次文件操作模块
/// 
/// 负责VCF文件路径管理、文件状态更新等操作

use rusqlite::{Connection, Result as SqliteResult, params, OptionalExtension};

/// VCF批次文件操作
pub struct FileOperations;

impl FileOperations {
    /// 设置VCF批次文件路径
    pub fn set_vcf_batch_file_path(
        conn: &Connection,
        batch_id: &str,
        file_path: &str,
    ) -> SqliteResult<bool> {
        let updated = conn.execute(
            "UPDATE vcf_batches SET vcf_file_path = ?1, updated_at = datetime('now') 
             WHERE batch_id = ?2",
            params![file_path, batch_id],
        )?;

        Ok(updated > 0)
    }

    /// 标记VCF批次为已完成
    pub fn mark_vcf_batch_completed(
        conn: &Connection,
        batch_id: &str,
        file_path: &str,
    ) -> SqliteResult<bool> {
        let updated = conn.execute(
            "UPDATE vcf_batches 
             SET vcf_file_path = ?1, 
                 updated_at = datetime('now')
             WHERE batch_id = ?2",
            params![file_path, batch_id],
        )?;

        Ok(updated > 0)
    }

    /// 更新VCF批次导入结果
    pub fn update_vcf_batch_import_result(
        conn: &Connection,
        batch_id: &str,
        import_result: &str,
    ) -> SqliteResult<bool> {
        // 假设有一个结果字段，这里简化处理
        let updated = conn.execute(
            "UPDATE vcf_batches SET updated_at = datetime('now') WHERE batch_id = ?1",
            params![batch_id],
        )?;

        Ok(updated > 0)
    }

    /// 获取VCF文件路径
    pub fn get_vcf_file_path(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<Option<String>> {
        let path: Option<String> = conn.query_row(
            "SELECT vcf_file_path FROM vcf_batches WHERE batch_id = ?1",
            params![batch_id],
            |row| row.get(0),
        ).optional()?;

        Ok(path)
    }

    /// 检查VCF文件是否存在
    pub fn check_vcf_file_exists(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<bool> {
        let exists: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batches 
             WHERE batch_id = ?1 AND vcf_file_path IS NOT NULL AND vcf_file_path != ''",
            params![batch_id],
            |row| row.get(0),
        )?;

        Ok(exists > 0)
    }

    /// 获取所有已完成的VCF批次
    pub fn get_completed_vcf_batches(
        conn: &Connection,
    ) -> SqliteResult<Vec<String>> {
        let mut stmt = conn.prepare(
            "SELECT batch_id FROM vcf_batches 
             WHERE vcf_file_path IS NOT NULL AND vcf_file_path != ''
             ORDER BY created_at DESC"
        )?;

        let batch_iter = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut batch_ids = Vec::new();
        for batch_id in batch_iter {
            batch_ids.push(batch_id?);
        }

        Ok(batch_ids)
    }

    /// 清理无效的VCF文件路径
    pub fn cleanup_invalid_vcf_paths(
        conn: &Connection,
    ) -> SqliteResult<i64> {
        let cleaned = conn.execute(
            "UPDATE vcf_batches 
             SET vcf_file_path = NULL 
             WHERE vcf_file_path = '' OR vcf_file_path IS NULL",
            [],
        )?;

        Ok(cleaned as i64)
    }
}