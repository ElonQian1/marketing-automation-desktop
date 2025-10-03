use rusqlite::{Connection, Result, params};

fn main() -> Result<()> {
    let db_path = "../src-tauri/data/contacts.db";
    let conn = Connection::open(db_path)?;
    
    println!("🧪 测试数据库字段修复");
    
    // 1. 检查当前有哪些号码与测试记录关联
    println!("\n📋 查询与记录ID=9关联的号码:");
    let mut stmt = conn.prepare("
        SELECT id, phone, status, assigned_batch_id 
        FROM contact_numbers 
        WHERE txt_import_id = 9
    ")?;
    
    let rows = stmt.query_map(params![9], |row| {
        Ok((
            row.get::<_, i64>(0)?,    // id
            row.get::<_, String>(1)?, // phone  
            row.get::<_, String>(2)?, // status
            row.get::<_, Option<String>>(3)?, // assigned_batch_id
        ))
    })?;
    
    let mut phone_ids = Vec::new();
    for row in rows {
        let (id, phone, status, batch_id) = row?;
        phone_ids.push(id);
        println!("  📞 ID={}, Phone={}, Status={}, Batch={:?}", 
                 id, phone, status, batch_id);
    }
    
    if phone_ids.is_empty() {
        println!("⚠️ 没有找到与记录ID=9关联的号码");
        return Ok(());
    }
    
    // 2. 测试归档删除SQL（模拟我们修复的代码）
    println!("\n🔄 测试归档删除操作...");
    
    // 开始事务
    let tx = conn.unchecked_transaction()?;
    
    // 首先恢复相关号码状态（这是我们修复的SQL）
    let affected_numbers = tx.execute(
        "UPDATE contact_numbers 
         SET status = 'available', 
             assigned_batch_id = NULL, 
             assigned_at = NULL, 
             imported_device_id = NULL, 
             imported_session_id = NULL, 
             imported_at = NULL 
         WHERE txt_import_id = ?",
        params![9]
    )?;
    
    println!("✅ 成功恢复 {} 个号码状态为'available'", affected_numbers);
    
    // 然后删除TXT导入记录
    let deleted_records = tx.execute(
        "DELETE FROM txt_import_records WHERE id = ?",
        params![9]
    )?;
    
    println!("✅ 成功删除 {} 个TXT导入记录", deleted_records);
    
    // 验证操作结果
    println!("\n🔍 验证操作结果:");
    if phone_ids.len() >= 2 {
        let mut check_stmt = tx.prepare("
            SELECT id, phone, status, assigned_batch_id 
            FROM contact_numbers 
            WHERE id IN (?, ?, ?)
        ")?;
        
        let check_rows = check_stmt.query_map(params![phone_ids[0], phone_ids[1], phone_ids.get(2).unwrap_or(&0)], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })?;
        
        for row in check_rows {
            let (id, phone, status, batch_id) = row?;
            println!("  📞 验证 ID={}, Phone={}, Status={}, Batch={:?}", 
                     id, phone, status, batch_id);
        }
        drop(check_stmt); // 显式释放语句
    }
    
    // 提交事务
    tx.commit()?;
    
    println!("\n🎉 归档删除测试完成！所有SQL操作都成功，没有'no such column: used'错误！");
    
    Ok(())
}