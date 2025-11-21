use rusqlite::{Connection, Result};

fn main() -> Result<()> {
    let db_path = "../src-tauri/data/employees.db";
    let conn = Connection::open(db_path)?;
    
    println!("🔍 检查数据库中的UTF-8编码问题...");
    
    // 查询所有记录，检查哪些有编码问题
    let mut stmt = conn.prepare("SELECT id, phone, name, source_file FROM contact_numbers ORDER BY id LIMIT 100")?;
    
    let mut problematic_rows = Vec::new();
    
    let rows = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let phone: String = match row.get(1) {
            Ok(val) => val,
            Err(e) => {
                println!("❌ ID {} phone字段编码错误: {}", id, e);
                problematic_rows.push((id, "phone".to_string()));
                return Ok((id, "".to_string(), "".to_string(), "".to_string()));
            }
        };
        let name: String = match row.get(2) {
            Ok(val) => val,
            Err(e) => {
                println!("❌ ID {} name字段编码错误: {}", id, e);
                problematic_rows.push((id, "name".to_string()));
                "".to_string()
            }
        };
        let source_file: String = match row.get(3) {
            Ok(val) => val,
            Err(e) => {
                println!("❌ ID {} source_file字段编码错误: {}", id, e);
                problematic_rows.push((id, "source_file".to_string()));
                "".to_string()
            }
        };
        
        Ok((id, phone, name, source_file))
    })?;
    
    let mut valid_count = 0;
    for row_result in rows {
        match row_result {
            Ok((id, phone, name, source_file)) => {
                valid_count += 1;
                if valid_count <= 5 {  // 显示前5条正常记录
                    println!("✅ ID {}: phone='{}', name='{}', file='{}'", 
                             id, phone, name, source_file);
                }
            }
            Err(e) => {
                println!("❌ 行读取失败: {}", e);
            }
        }
    }
    
    println!("📊 统计结果:");
    println!("  - 成功读取记录: {}", valid_count);
    println!("  - 编码问题记录: {}", problematic_rows.len());
    
    if !problematic_rows.is_empty() {
        println!("🔧 问题记录详情:");
        for (id, field) in &problematic_rows {
            println!("  - ID {}, 字段: {}", id, field);
        }
        
        println!("🔧 尝试修复编码问题...");
        for (id, field) in &problematic_rows {
            if field == "name" {
                // 将有问题的name字段设置为默认值
                match conn.execute(
                    "UPDATE contact_numbers SET name = '未知' WHERE id = ?",
                    [id]
                ) {
                    Ok(_) => println!("✅ 已修复 ID {} 的 name 字段", id),
                    Err(e) => println!("❌ 修复 ID {} 失败: {}", id, e),
                }
            }
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {

    #[test]
    fn test_utf8_check() {
        // 测试函数可以在这里添加
    }
}