// src-tauri/src/infrastructure/database.rs
// module: infrastructure | layer: infrastructure | role: database-utils
// summary: 共享数据库连接与配置工具

use anyhow::Result;
use rusqlite::Connection;
use std::path::Path;

/// 获取配置好的数据库连接
/// 
/// 自动开启:
/// - WAL 模式 (Write-Ahead Logging)
/// - 外键约束 (Foreign Keys)
pub fn get_connection<P: AsRef<Path>>(path: P) -> Result<Connection> {
    let conn = Connection::open(path)?;
    
    // 开启 WAL 模式以提高并发性能
    conn.pragma_update(None, "journal_mode", "WAL")?;
    
    // 开启外键约束
    conn.pragma_update(None, "foreign_keys", "ON")?;
    
    // 设置忙碌超时 (5秒)
    conn.busy_timeout(std::time::Duration::from_secs(5))?;

    Ok(conn)
}
