use rusqlite::{Connection, Result as SqliteResult};
use tauri::{command, AppHandle};
use crate::services::contact_storage::repositories::common::database::get_connection;

/// 修复 vcf_batches 表结构（添加 is_completed 字段）
#[command]
pub async fn migrate_vcf_batches_schema(app_handle: AppHandle) -> Result<String, String> {
    tracing::info!("🔧 开始 vcf_batches 表结构迁移");
    
    match execute_migration(&app_handle) {
        Ok(message) => {
            tracing::info!("✅ vcf_batches 迁移成功");
            Ok(message)
        },
        Err(e) => {
            let error_msg = format!("vcf_batches 迁移失败: {}", e);
            tracing::error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

fn execute_migration(app_handle: &AppHandle) -> SqliteResult<String> {
    let conn = get_connection(app_handle)?;
    
    // 检查 is_completed 列是否已存在
    let column_exists = check_column_exists(&conn, "vcf_batches", "is_completed")?;
    
    if column_exists {
        return Ok("vcf_batches 表结构已是最新，无需迁移".to_string());
    }
    
    tracing::info!("📋 执行 vcf_batches 表结构迁移（添加 is_completed 字段）");
    
    // 在事务中执行迁移
    conn.execute_batch("
        BEGIN TRANSACTION;
        
        -- 1. 备份现有数据
        CREATE TEMPORARY TABLE vcf_batches_backup AS SELECT * FROM vcf_batches;
        
        -- 2. 删除旧表
        DROP TABLE vcf_batches;
        
        -- 3. 创建新表（完整结构）
        CREATE TABLE vcf_batches (
            batch_id TEXT PRIMARY KEY,
            generated_at TEXT NOT NULL,
            generated_by_device_id TEXT,
            batch_size INTEGER NOT NULL DEFAULT 0,
            used_batch TEXT,
            name_prefix TEXT,
            status TEXT DEFAULT 'pending',
            is_completed INTEGER DEFAULT 0,
            file_path TEXT,
            FOREIGN KEY (used_batch) REFERENCES txt_import_records(batch_id)
        );
        
        -- 4. 恢复数据（设置 is_completed 默认值为 0）
        INSERT INTO vcf_batches (
            batch_id, 
            generated_at, 
            generated_by_device_id, 
            batch_size, 
            used_batch, 
            name_prefix, 
            status, 
            is_completed,
            file_path
        )
        SELECT 
            batch_id, 
            generated_at, 
            generated_by_device_id, 
            batch_size, 
            used_batch, 
            name_prefix, 
            status, 
            0 as is_completed,
            file_path
        FROM vcf_batches_backup;
        
        -- 5. 重建索引
        CREATE INDEX IF NOT EXISTS idx_vcf_batches_status ON vcf_batches(status);
        CREATE INDEX IF NOT EXISTS idx_vcf_batches_used_batch ON vcf_batches(used_batch);
        CREATE INDEX IF NOT EXISTS idx_vcf_batches_device_id ON vcf_batches(generated_by_device_id);
        CREATE INDEX IF NOT EXISTS idx_vcf_batches_is_completed ON vcf_batches(is_completed);
        
        -- 6. 清理临时表
        DROP TABLE vcf_batches_backup;
        
        COMMIT;
    ")?;
    
    let count = conn.query_row(
        "SELECT COUNT(*) FROM vcf_batches",
        [],
        |row| row.get::<_, i64>(0)
    )?;
    
    Ok(format!("✅ vcf_batches 表结构迁移完成，保留了 {} 条记录", count))
}

/// 检查列是否存在
fn check_column_exists(conn: &Connection, table_name: &str, column_name: &str) -> SqliteResult<bool> {
    let query = format!("PRAGMA table_info({})", table_name);
    let mut stmt = conn.prepare(&query)?;
    
    let columns: Result<Vec<String>, _> = stmt
        .query_map([], |row| row.get::<_, String>(1))?
        .collect();
    
    match columns {
        Ok(cols) => Ok(cols.iter().any(|col| col == column_name)),
        Err(e) => Err(e)
    }
}
