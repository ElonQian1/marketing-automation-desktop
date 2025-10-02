use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// 公共数据库连接管理
/// 提供统一的数据库连接获取和错误处理

/// 获取数据库连接
pub fn get_connection(app_handle: &AppHandle) -> SqliteResult<Connection> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    
    std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
    
    let db_path = app_dir.join("contact_storage.db");
    
    tracing::debug!("尝试连接数据库: {:?}", db_path);
    
    let conn = Connection::open(db_path)?;
    
    // 启用外键支持
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
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
    // 这里可以添加表存在性检查和自动创建逻辑
    // 目前保持简单，依赖现有的表结构
    Ok(())
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