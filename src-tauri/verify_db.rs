// 验证数据库修复的简单脚本

use rusqlite::Connection;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db_path = "data/employees.db";
    println!("正在连接数据库: {}", db_path);
    
    let conn = Connection::open(db_path)?;
    
    // 检查contact_numbers表结构
    println!("\n=== contact_numbers表结构 ===");
    let mut stmt = conn.prepare("PRAGMA table_info(contact_numbers)")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i32>(0)?,     // cid
            row.get::<_, String>(1)?,  // name
            row.get::<_, String>(2)?,  // type
            row.get::<_, i32>(3)?,     // notnull
            row.get::<_, Option<String>>(4)?, // dflt_value
            row.get::<_, i32>(5)?,     // pk
        ))
    })?;
    
    for row in rows {
        let (cid, name, type_info, notnull, dflt_value, pk) = row?;
        println!("{}: {} {} (notnull={}, pk={}, default={:?})", 
                cid, name, type_info, notnull, pk, dflt_value);
    }
    
    // 检查索引
    println!("\n=== contact_numbers表索引 ===");
    let mut stmt = conn.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='contact_numbers'")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, Option<String>>(1)?,
        ))
    })?;
    
    for row in rows {
        let (name, sql) = row?;
        println!("索引: {} -> {:?}", name, sql);
    }
    
    // 尝试查询数据
    println!("\n=== 数据查询测试 ===");
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM contact_numbers", [], |row| row.get(0))?;
    println!("contact_numbers表记录数: {}", count);
    
    println!("\n✅ 数据库验证成功！");
    Ok(())
}