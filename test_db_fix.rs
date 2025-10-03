use rusqlite::{Connection, Result};
use std::path::Path;

// 简单测试修复的数据库字段
fn main() -> Result<()> {
    // 使用实际应用的数据库路径
    let db_path = "src-tauri/data/employees.db";
    
    if !Path::new(db_path).exists() {
        println!("❌ 数据库文件不存在: {}", db_path);
        return Ok(());
    }
    
    let conn = Connection::open(db_path)?;
    
    println!("✅ 连接数据库成功");
    
    // 检查数据库表结构
    println!("\n🔍 检查数据库表:");
    let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table'")?;
    let table_names: Result<Vec<String>, _> = stmt
        .query_map([], |row| Ok(row.get::<_, String>(0)?))
        .and_then(|mapped| mapped.collect());
    
    match table_names {
        Ok(names) => {
            for name in names {
                println!("  📋 表: {}", name);
            }
        }
        Err(e) => println!("❌ 查询表失败: {}", e),
    }
    
    // 检查 contact_numbers 表结构（如果存在）
    println!("\n🔍 检查 contact_numbers 表结构:");
    match conn.prepare("PRAGMA table_info(contact_numbers)") {
        Ok(mut stmt) => {
            let columns: Result<Vec<(String, String)>, _> = stmt
                .query_map([], |row| {
                    Ok((
                        row.get::<_, String>(1)?, // column name
                        row.get::<_, String>(2)?, // column type
                    ))
                })
                .and_then(|mapped| mapped.collect());
                
            match columns {
                Ok(cols) => {
                    for (name, col_type) in cols {
                        println!("  📊 列: {} ({})", name, col_type);
                    }
                }
                Err(e) => println!("❌ 查询列信息失败: {}", e),
            }
        }
        Err(e) => println!("⚠️ contact_numbers 表不存在或无法访问: {}", e),
    }
    
    // 测试一个安全的查询（不会修改数据）
    println!("\n🧪 测试查询 contact_numbers (如果存在):");
    match conn.prepare("SELECT COUNT(*) FROM contact_numbers WHERE status = 'available'") {
        Ok(mut stmt) => {
            match stmt.query_row([], |row| row.get::<_, i64>(0)) {
                Ok(count) => println!("  ✅ 找到 {} 个状态为 'available' 的号码", count),
                Err(e) => println!("  ❌ 查询失败: {}", e),
            }
        }
        Err(e) => println!("  ⚠️ 无法准备查询: {}", e),
    }
    
    println!("\n🎉 测试完成！");
    Ok(())
}