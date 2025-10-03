use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use super::schema;

/// 公共数据库连接管理
/// 提供统一的数据库连接获取和错误处理

/// 获取数据库连接
pub fn get_connection(app_handle: &AppHandle) -> SqliteResult<Connection> {
    // 使用固定的数据库路径：src-tauri/data/contacts.db
    let exe_dir = std::env::current_exe()
        .expect("failed to get current exe path")
        .parent()
        .expect("failed to get exe directory")
        .to_path_buf();
    
    // 开发环境下，exe在target/debug/，需要回退到src-tauri/data/
    // 生产环境下，确保data目录存在
    let db_dir = if exe_dir.ends_with("target/debug") || exe_dir.ends_with("target\\debug") {
        exe_dir.parent().unwrap().parent().unwrap().join("src-tauri").join("data")
    } else {
        exe_dir.join("data")
    };
    
    std::fs::create_dir_all(&db_dir).expect("failed to create data dir");
    
    let db_path = db_dir.join("contacts.db");
    
    tracing::debug!("尝试连接数据库: {:?}", db_path);
    
    let conn = Connection::open(db_path)?;
    
    // 配置数据库连接 (使用 execute_batch 避免 ExecuteReturnedResults 错误)
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA cache_size = 10000;
         PRAGMA temp_store = memory;
         PRAGMA mmap_size = 268435456;
         PRAGMA busy_timeout = 30000;"
    )?;
    
    // 初始化数据库表结构
    schema::init_contact_storage_tables(&conn)?;
    
    Ok(conn)
}

/// 在事务中执行操作的辅助函数
pub fn execute_in_transaction<T, F>(
    app_handle: &AppHandle,
    operation: F,
) -> SqliteResult<T>
where
    F: FnOnce(&Connection) -> SqliteResult<T>,
{
    let mut conn = get_connection(app_handle)?;
    let tx = conn.transaction()?;
    
    let result = operation(&tx)?;
    
    tx.commit()?;
    Ok(result)
}

/// 标准错误处理和日志记录
pub fn log_database_error(operation: &str, error: &rusqlite::Error) {
    tracing::error!("数据库操作失败 [{}]: {:?}", operation, error);
}

/// 通用的数据库初始化检查
pub fn ensure_tables_exist(conn: &Connection) -> SqliteResult<()> {
    // 使用schema模块进行表初始化
    schema::init_contact_storage_tables(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    
    #[test]
    fn test_database_connection() {
        // 单元测试可以在这里添加
        // 目前保持简单
    }
}