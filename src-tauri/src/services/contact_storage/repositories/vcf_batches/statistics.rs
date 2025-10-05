/// VCF批次统计模块
/// 
/// 负责统计查询、数据分析等功能

use rusqlite::{Connection, Result as SqliteResult, params};
use crate::services::contact_storage::models::VcfBatchStatsDto;

/// VCF批次统计操作
pub struct Statistics;

impl Statistics {
    /// 获取VCF批次统计信息
    pub fn get_vcf_batch_stats(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<VcfBatchStatsDto> {
        // 获取基础统计信息
        let mut stmt = conn.prepare(
            "SELECT 
                COUNT(*) as total_batches,
                COALESCE(SUM(total_numbers), 0) as total_numbers,
                COALESCE(SUM(used_numbers), 0) as used_numbers,
                COUNT(CASE WHEN vcf_file_path IS NOT NULL THEN 1 END) as completed_batches
             FROM vcf_batches 
             WHERE batch_id = ?1 OR ?1 = ''"
        )?;

        let stats = stmt.query_row([batch_id], |row| {
            let total_numbers: i64 = row.get(1)?;
            let used_numbers: i64 = row.get(2)?;
            let completed_batches: i64 = row.get(3)?;
            
            Ok(VcfBatchStatsDto {
                total_batches: row.get(0)?,
                total_numbers,
                used_numbers,
                completed_batches,
                average_batch_size: if completed_batches > 0 { total_numbers as f64 / completed_batches as f64 } else { 0.0 },
                success_rate: if total_numbers > 0 { (used_numbers as f64 / total_numbers as f64) * 100.0 } else { 0.0 },
                industries: vec![], // 在这里暂时为空，后续可填充
            })
        })?;

        Ok(stats)
    }

    /// 获取批次号码数量
    pub fn get_vcf_batch_number_count(
        conn: &Connection,
        batch_id: &str,
    ) -> SqliteResult<i64> {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batch_numbers WHERE batch_id = ?1",
            params![batch_id],
            |row| row.get(0),
        )?;

        Ok(count)
    }

    /// 计算批次平均大小
    pub fn calculate_average_batch_size(
        conn: &Connection,
    ) -> SqliteResult<f64> {
        let avg: Option<f64> = conn.query_row(
            "SELECT AVG(total_numbers) FROM vcf_batches WHERE total_numbers > 0",
            [],
            |row| row.get(0),
        )?;

        Ok(avg.unwrap_or(0.0))
    }

    /// 计算批次成功率
    pub fn calculate_batch_success_rate(
        conn: &Connection,
    ) -> SqliteResult<f64> {
        let (total, completed): (i64, i64) = conn.query_row(
            "SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN vcf_file_path IS NOT NULL THEN 1 END) as completed
             FROM vcf_batches",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        if total > 0 {
            Ok((completed as f64 / total as f64) * 100.0)
        } else {
            Ok(0.0)
        }
    }

    /// 获取批次使用情况分布
    pub fn get_batch_usage_distribution(
        conn: &Connection,
    ) -> SqliteResult<Vec<(String, i64)>> {
        let mut stmt = conn.prepare(
            "SELECT 
                CASE 
                    WHEN used_numbers = 0 THEN 'unused'
                    WHEN used_numbers = total_numbers THEN 'fully_used'
                    ELSE 'partially_used'
                END as usage_status,
                COUNT(*) as count
             FROM vcf_batches 
             GROUP BY usage_status"
        )?;

        let distribution_iter = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;

        let mut distribution = Vec::new();
        for item in distribution_iter {
            distribution.push(item?);
        }

        Ok(distribution)
    }

    /// 获取时间范围内的批次统计
    pub fn get_batch_stats_by_time_range(
        conn: &Connection,
        start_date: &str,
        end_date: &str,
    ) -> SqliteResult<VcfBatchStatsDto> {
        let mut stmt = conn.prepare(
            "SELECT 
                COUNT(*) as total_batches,
                COALESCE(SUM(total_numbers), 0) as total_numbers,
                COALESCE(SUM(used_numbers), 0) as used_numbers,
                COUNT(CASE WHEN vcf_file_path IS NOT NULL THEN 1 END) as completed_batches
             FROM vcf_batches 
             WHERE created_at BETWEEN ?1 AND ?2"
        )?;

        let stats = stmt.query_row([start_date, end_date], |row| {
            let total_numbers: i64 = row.get(1)?;
            let used_numbers: i64 = row.get(2)?;
            let completed_batches: i64 = row.get(3)?;
            
            Ok(VcfBatchStatsDto {
                total_batches: row.get(0)?,
                total_numbers,
                used_numbers,
                completed_batches,
                average_batch_size: if completed_batches > 0 { total_numbers as f64 / completed_batches as f64 } else { 0.0 },
                success_rate: if total_numbers > 0 { (used_numbers as f64 / total_numbers as f64) * 100.0 } else { 0.0 },
                industries: vec![], // 在这里暂时为空，后续可填充
            })
        })?;

        Ok(stats)
    }
}