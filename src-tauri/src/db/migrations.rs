// src-tauri/src/db/migrations.rs
// module: lead-hunt | layer: infrastructure | role: 数据库迁移管理
// summary: 管理数据库版本和迁移脚本

use rusqlite::{Connection, Result};
use super::schema::*;

/// 迁移版本表
const MIGRATIONS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
)
"#;

/// 获取当前数据库版本
fn get_current_version(conn: &Connection) -> Result<i32> {
    // 确保迁移表存在
    conn.execute(MIGRATIONS_TABLE, [])?;
    
    let version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    Ok(version)
}

/// 记录迁移版本
fn record_migration(conn: &Connection, version: i32) -> Result<()> {
    conn.execute(
        "INSERT INTO schema_migrations (version) VALUES (?1)",
        [version],
    )?;
    Ok(())
}

/// 迁移 v1: 创建初始表
fn migrate_v1(conn: &Connection) -> Result<()> {
    println!("[Migration] Running v1: Create initial tables");
    
    // 创建表
    conn.execute(LEAD_COMMENTS_TABLE, [])?;
    conn.execute(LEAD_ANALYSES_TABLE, [])?;
    conn.execute(REPLAY_PLANS_TABLE, [])?;
    
    // 创建索引
    for index_sql in INDICES {
        conn.execute(index_sql, [])?;
    }
    
    record_migration(conn, 1)?;
    println!("[Migration] v1 completed");
    Ok(())
}

/// 运行所有待执行的迁移
pub fn run_all(conn: &Connection) -> Result<()> {
    let current_version = get_current_version(conn)?;
    println!("[Migration] Current database version: {}", current_version);
    
    // 按顺序运行迁移
    if current_version < 1 {
        migrate_v1(conn)?;
    }
    
    // 未来迁移在这里添加
    // if current_version < 2 {
    //     migrate_v2(conn)?;
    // }
    
    println!("[Migration] All migrations completed");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_migrations() {
        let conn = Connection::open_in_memory().unwrap();
        run_all(&conn).unwrap();
        
        // 验证表是否创建
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table'")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>>>()
            .unwrap();
        
        assert!(tables.contains(&"lead_comments".to_string()));
        assert!(tables.contains(&"lead_analyses".to_string()));
        assert!(tables.contains(&"replay_plans".to_string()));
    }
}
