use rusqlite::{Connection, Result as SqliteResult};

use crate::services::contact_storage::models::{ContactNumberStats, AllIndustryStats};

/// 统计和分析仓储类
/// 
/// 负责联系人数据的统计分析，包括：
/// - 号码池统计信息
/// - 行业分类统计
/// - 导入成功率分析
/// - 设备使用情况统计
pub struct StatisticsRepository;

impl StatisticsRepository {
    /// 获取联系人号码统计信息
    pub fn get_contact_number_stats(conn: &Connection) -> SqliteResult<ContactNumberStats> {
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers",
            [],
            |row| row.get(0),
        )?;

        let available: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers WHERE status = 'available'",
            [],
            |row| row.get(0),
        )?;

        let imported: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers WHERE status = 'imported'",
            [],
            |row| row.get(0),
        )?;

        let failed: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers WHERE status = 'failed'",
            [],
            |row| row.get(0),
        )?;

        let used: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers WHERE used = 1",
            [],
            |row| row.get(0),
        )?;

        let unused: i64 = total - used;

        Ok(ContactNumberStats {
            total,
            available,
            imported,
            failed,
            used,
            unused,
        })
    }

    /// 获取所有行业的统计信息
    pub fn get_all_industry_stats(conn: &Connection) -> SqliteResult<AllIndustryStats> {
        let mut stmt = conn.prepare(
            "SELECT 
                COALESCE(s.industry, '未分类') as industry,
                COUNT(DISTINCT s.id) as session_count,
                SUM(s.imported_count) as total_imported,
                SUM(s.failed_count) as total_failed,
                COUNT(DISTINCT s.device_id) as device_count
             FROM import_sessions s
             GROUP BY COALESCE(s.industry, '未分类')
             ORDER BY total_imported DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(crate::services::contact_storage::models::IndustryStats {
                industry: row.get(0)?,
                session_count: row.get(1)?,
                total_imported: row.get(2)?,
                total_failed: row.get(3)?,
                device_count: row.get(4)?,
            })
        })?;

        let mut industries = Vec::new();
        for row in rows {
            industries.push(row?);
        }

        // 计算总体统计
        let total_sessions: i64 = industries.iter().map(|i| i.session_count).sum();
        let total_imported: i64 = industries.iter().map(|i| i.total_imported).sum();
        let total_failed: i64 = industries.iter().map(|i| i.total_failed).sum();
        let total_devices: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT device_id) FROM import_sessions",
            [],
            |row| row.get(0),
        )?;

        Ok(AllIndustryStats {
            industries,
            total_sessions,
            total_imported,
            total_failed,
            total_devices,
        })
    }

    /// 获取设备使用情况统计
    pub fn get_device_usage_stats(
        conn: &Connection,
        device_id: Option<&str>,
    ) -> SqliteResult<Vec<crate::services::contact_storage::models::DeviceUsageStats>> {
        let sql = if device_id.is_some() {
            "SELECT 
                device_id,
                COUNT(*) as session_count,
                SUM(imported_count) as total_imported,
                SUM(failed_count) as total_failed,
                MIN(started_at) as first_session,
                MAX(started_at) as last_session
             FROM import_sessions 
             WHERE device_id = ?1
             GROUP BY device_id"
        } else {
            "SELECT 
                device_id,
                COUNT(*) as session_count,
                SUM(imported_count) as total_imported,
                SUM(failed_count) as total_failed,
                MIN(started_at) as first_session,
                MAX(started_at) as last_session
             FROM import_sessions 
             GROUP BY device_id
             ORDER BY total_imported DESC"
        };

        let mut stmt = conn.prepare(sql)?;
        
        // 使用统一的闭包处理函数
        let mapper = |row: &rusqlite::Row| -> SqliteResult<crate::services::contact_storage::models::DeviceUsageStats> {
            Ok(crate::services::contact_storage::models::DeviceUsageStats {
                device_id: row.get(0)?,
                session_count: row.get(1)?,
                total_imported: row.get(2)?,
                total_failed: row.get(3)?,
                first_session: row.get(4)?,
                last_session: row.get(5)?,
            })
        };

        let rows = if let Some(device) = device_id {
            stmt.query_map([device], mapper)?
        } else {
            stmt.query_map([], mapper)?
        };

        let mut stats = Vec::new();
        for row in rows {
            stats.push(row?);
        }

        Ok(stats)
    }

    /// 获取批次导入成功率统计
    pub fn get_batch_success_rate_stats(
        conn: &Connection,
        batch_id: Option<&str>,
    ) -> SqliteResult<Vec<crate::services::contact_storage::models::BatchSuccessStats>> {
        let sql = if batch_id.is_some() {
            "SELECT 
                batch_id,
                COUNT(*) as session_count,
                SUM(imported_count) as total_imported,
                SUM(failed_count) as total_failed,
                ROUND(CAST(SUM(imported_count) AS FLOAT) / 
                      NULLIF(SUM(imported_count) + SUM(failed_count), 0) * 100, 2) as success_rate
             FROM import_sessions 
             WHERE batch_id = ?1
             GROUP BY batch_id"
        } else {
            "SELECT 
                batch_id,
                COUNT(*) as session_count,
                SUM(imported_count) as total_imported,
                SUM(failed_count) as total_failed,
                ROUND(CAST(SUM(imported_count) AS FLOAT) / 
                      NULLIF(SUM(imported_count) + SUM(failed_count), 0) * 100, 2) as success_rate
             FROM import_sessions 
             GROUP BY batch_id
             ORDER BY success_rate DESC"
        };

        let mut stmt = conn.prepare(sql)?;
        
        let map_row = |row: &rusqlite::Row| -> rusqlite::Result<crate::services::contact_storage::models::BatchSuccessStats> {
            Ok(crate::services::contact_storage::models::BatchSuccessStats {
                batch_id: row.get(0)?,
                session_count: row.get(1)?,
                total_imported: row.get(2)?,
                total_failed: row.get(3)?,
                success_rate: row.get::<_, Option<f64>>(4)?.unwrap_or(0.0),
            })
        };
        
        let rows = if let Some(batch) = batch_id {
            stmt.query_map([batch], map_row)?
        } else {
            stmt.query_map([], map_row)?
        };

        let mut stats = Vec::new();
        for row in rows {
            stats.push(row?);
        }

        Ok(stats)
    }

    /// 获取时间段内的导入趋势统计
    pub fn get_import_trend_stats(
        conn: &Connection,
        days: i64,
    ) -> SqliteResult<Vec<crate::services::contact_storage::models::ImportTrendStats>> {
        let mut stmt = conn.prepare(
            "SELECT 
                DATE(started_at) as import_date,
                COUNT(*) as session_count,
                SUM(imported_count) as total_imported,
                SUM(failed_count) as total_failed,
                COUNT(DISTINCT device_id) as device_count
             FROM import_sessions 
             WHERE started_at >= datetime('now', '-' || ?1 || ' days')
             GROUP BY DATE(started_at)
             ORDER BY import_date DESC"
        )?;

        let rows = stmt.query_map([days], |row| {
            Ok(crate::services::contact_storage::models::ImportTrendStats {
                import_date: row.get(0)?,
                session_count: row.get(1)?,
                total_imported: row.get(2)?,
                total_failed: row.get(3)?,
                device_count: row.get(4)?,
            })
        })?;

        let mut trends = Vec::new();
        for row in rows {
            trends.push(row?);
        }

        Ok(trends)
    }

    /// 获取号码使用分布统计
    pub fn get_number_usage_distribution(
        conn: &Connection,
    ) -> SqliteResult<crate::services::contact_storage::models::NumberUsageDistribution> {
        // 按状态统计
        let mut stmt = conn.prepare(
            "SELECT status, COUNT(*) as count 
             FROM contact_numbers 
             GROUP BY status"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;

        let mut status_distribution = std::collections::HashMap::new();
        for row in rows {
            let (status, count) = row?;
            status_distribution.insert(status, count);
        }

        // 按批次统计使用情况
        let mut stmt = conn.prepare(
            "SELECT 
                COALESCE(used_batch, '未使用') as batch_status,
                COUNT(*) as count
             FROM contact_numbers 
             GROUP BY COALESCE(used_batch, '未使用')"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;

        let mut batch_distribution = std::collections::HashMap::new();
        for row in rows {
            let (batch_status, count) = row?;
            batch_distribution.insert(batch_status, count);
        }

        Ok(crate::services::contact_storage::models::NumberUsageDistribution {
            status_distribution,
            batch_distribution,
        })
    }
}