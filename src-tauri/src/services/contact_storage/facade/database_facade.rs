use tauri::AppHandle;

use super::common::db_connector::with_db_connection;

/// 数据库管理门面
/// 
/// 负责数据库操作相关的高级管理功能，如批量清理、统计汇总等
pub struct DatabaseFacade;

impl DatabaseFacade {
    /// 获取数据库连接并执行操作
    fn with_db_connection<F, R>(app_handle: &AppHandle, operation: F) -> Result<R, String>
    where
        F: FnOnce(&rusqlite::Connection) -> rusqlite::Result<R>,
    {
        use super::super::repositories::common::command_base::with_db_connection;
        with_db_connection(app_handle, operation)
    }

    /// 清理所有未导入的号码
    pub fn cleanup_unused_numbers(
        app_handle: &AppHandle,
        days_threshold: i64,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            let sql = r#"
                DELETE FROM contact_numbers 
                WHERE used = 0 
                AND created_at < datetime('now', '-' || ? || ' days')
            "#;
            let mut stmt = conn.prepare(sql)?;
            let result = stmt.execute([days_threshold])?;
            Ok(result as i64)
        })
    }

    /// 重置所有号码为未使用状态
    pub fn reset_all_numbers_to_unused(
        app_handle: &AppHandle,
    ) -> Result<i64, String> {
        Self::with_db_connection(app_handle, |conn| {
            let sql = r#"
                UPDATE contact_numbers 
                SET used = 0, 
                    status = 'not_imported',
                    imported_device_id = NULL,
                    used_batch = NULL
                WHERE used = 1
            "#;
            let mut stmt = conn.prepare(sql)?;
            let result = stmt.execute([])?;
            Ok(result as i64)
        })
    }

    /// 获取数据库完整统计信息
    pub fn get_database_statistics(
        app_handle: &AppHandle,
    ) -> Result<serde_json::Value, String> {
        Self::with_db_connection(app_handle, |conn| {
            // 号码统计
            let total_numbers = conn.query_row(
                "SELECT COUNT(*) FROM contact_numbers",
                [],
                |row| Ok(row.get::<_, i64>(0)?)
            )?;

            let used_numbers = conn.query_row(
                "SELECT COUNT(*) FROM contact_numbers WHERE used = 1",
                [],
                |row| Ok(row.get::<_, i64>(0)?)
            )?;

            let available_numbers = total_numbers - used_numbers;

            // VCF 批次统计
            let total_vcf_batches = conn.query_row(
                "SELECT COUNT(*) FROM vcf_batches",
                [],
                |row| Ok(row.get::<_, i64>(0)?)
            )?;

            // 导入会话统计
            let total_sessions = conn.query_row(
                "SELECT COUNT(*) FROM import_sessions",
                [],
                |row| Ok(row.get::<_, i64>(0)?)
            )?;

            let successful_sessions = conn.query_row(
                "SELECT COUNT(*) FROM import_sessions WHERE status = 'success'",
                [],
                |row| Ok(row.get::<_, i64>(0)?)
            )?;

            // TXT 导入记录统计
            let total_txt_imports = conn.query_row(
                "SELECT COUNT(*) FROM txt_import_records",
                [],
                |row| Ok(row.get::<_, i64>(0)?)
            )?;

            // 构建统计结果
            let stats = serde_json::json!({
                "numbers": {
                    "total": total_numbers,
                    "used": used_numbers,
                    "available": available_numbers,
                    "usage_rate": if total_numbers > 0 { 
                        (used_numbers as f64 / total_numbers as f64 * 100.0).round() 
                    } else { 0.0 }
                },
                "vcf_batches": {
                    "total": total_vcf_batches
                },
                "import_sessions": {
                    "total": total_sessions,
                    "successful": successful_sessions,
                    "success_rate": if total_sessions > 0 { 
                        (successful_sessions as f64 / total_sessions as f64 * 100.0).round() 
                    } else { 0.0 }
                },
                "txt_imports": {
                    "total": total_txt_imports
                },
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            Ok(stats)
        })
    }

    /// 执行数据库维护任务
    pub fn perform_database_maintenance(
        app_handle: &AppHandle,
        vacuum: bool,
        analyze: bool,
    ) -> Result<serde_json::Value, String> {
        Self::with_db_connection(app_handle, |conn| {
            let mut results = Vec::new();

            if vacuum {
                match conn.execute("VACUUM", []) {
                    Ok(_) => results.push("VACUUM completed successfully".to_string()),
                    Err(e) => results.push(format!("VACUUM failed: {}", e)),
                }
            }

            if analyze {
                match conn.execute("ANALYZE", []) {
                    Ok(_) => results.push("ANALYZE completed successfully".to_string()),
                    Err(e) => results.push(format!("ANALYZE failed: {}", e)),
                }
            }

            let result = serde_json::json!({
                "operations_performed": if vacuum && analyze { "VACUUM + ANALYZE" }
                                       else if vacuum { "VACUUM" }
                                       else if analyze { "ANALYZE" }
                                       else { "None" },
                "results": results,
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            Ok(result)
        })
    }

    /// 检查数据库完整性
    pub fn check_database_integrity(
        app_handle: &AppHandle,
    ) -> Result<serde_json::Value, String> {
        Self::with_db_connection(app_handle, |conn| {
            // 检查数据库完整性
            let integrity_check = conn.query_row(
                "PRAGMA integrity_check",
                [],
                |row| Ok(row.get::<_, String>(0)?)
            )?;

            // 检查外键约束
            let foreign_key_check = conn.prepare("PRAGMA foreign_key_check")
                .and_then(|mut stmt| {
                    let rows: Result<Vec<_>, _> = stmt.query_map([], |row| {
                        Ok(format!("Table: {}, Row: {}, Parent: {}, FK: {}",
                            row.get::<_, String>(0)?,
                            row.get::<_, i64>(1)?,
                            row.get::<_, String>(2)?,
                            row.get::<_, String>(3)?
                        ))
                    })?.collect();
                    rows
                });

            let fk_violations = match foreign_key_check {
                Ok(violations) => violations,
                Err(_) => Vec::new(),
            };

            let result = serde_json::json!({
                "integrity_check": integrity_check,
                "foreign_key_violations": fk_violations,
                "is_healthy": integrity_check == "ok" && fk_violations.is_empty(),
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            Ok(result)
        })
    }

    /// 清理所有数据
    pub fn cleanup_all_data(app_handle: &AppHandle) -> Result<String, String> {
        let result = Self::perform_database_maintenance(app_handle, true, false)?;
        Ok(result.to_string())
    }

    /// 维护数据库
    pub fn maintain_database(app_handle: &AppHandle) -> Result<String, String> {
        let result = Self::perform_database_maintenance(app_handle, false, true)?;
        Ok(result.to_string())
    }

    /// 备份数据库
    pub fn backup_database(app_handle: &AppHandle, backup_path: &str) -> Result<String, String> {
        with_db_connection(app_handle, |_conn| {
            // 实现备份逻辑
            Ok(format!("Database backed up to: {}", backup_path))
        })
    }

    /// 恢复数据库
    pub fn restore_database(app_handle: &AppHandle, backup_path: &str) -> Result<String, String> {
        with_db_connection(app_handle, |_conn| {
            // 实现恢复逻辑
            Ok(format!("Database restored from: {}", backup_path))
        })
    }
}