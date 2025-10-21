// src-tauri/src/db/mod.rs
// module: lead-hunt | layer: infrastructure | role: 数据库模块入口
// summary: 统一管理SQLite连接和迁移

pub mod schema;
pub mod migrations;
pub mod lead_comments;
pub mod lead_analyses;
pub mod replay_plans;

#[cfg(debug_assertions)]
pub mod seed;

use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// 获取数据库文件路径
pub fn db_path(app_handle: &AppHandle) -> anyhow::Result<PathBuf> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| anyhow::anyhow!("Failed to get app data dir: {}", e))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("lead_hunt.db"))
}

/// 获取数据库连接
pub fn get_connection(app_handle: &AppHandle) -> anyhow::Result<Connection> {
    let path = db_path(app_handle)?;
    let conn = Connection::open(&path)?;
    
    // 启用外键约束
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    Ok(conn)
}

/// 初始化数据库（运行所有迁移）
pub fn initialize(app_handle: &AppHandle) -> anyhow::Result<()> {
    let conn = get_connection(app_handle)?;
    migrations::run_all(&conn)?;
    println!("[DB] Database initialized successfully");
    Ok(())
}
