/// 数据库表结构定义和初始化 - V2.0 简化版
/// 
/// 设计原则：
/// 1. 简化字段，去除冗余
/// 2. 统一命名规范
/// 3. 清晰的状态管理
/// 4. 易于维护和扩展
/// 
/// 变更说明：
/// - 移除了 vcf_batches 的复杂迁移逻辑
/// - 简化了字段名称（status统一化）
/// - 优化了索引设计
/// - 添加了更清晰的注释

use rusqlite::{Connection, Result as SqliteResult};

/// 数据库表初始化
/// 
/// 创建所有必需的表，包括：
/// - contact_numbers: 联系人号码池
/// - vcf_batches: VCF批次管理
/// - import_sessions: 导入会话记录
/// - txt_import_records: TXT文件导入记录
pub fn init_contact_storage_tables(conn: &Connection) -> SqliteResult<()> {
    tracing::info!("🚀 开始初始化数据库表结构 V2.0");
    
    // 创建联系人号码表
    create_contact_numbers_table(conn)?;
    
    // 创建VCF批次表
    create_vcf_batches_table(conn)?;
    
    // 创建导入会话表
    create_import_sessions_table(conn)?;
    
    // 创建TXT文件导入记录表
    create_txt_import_records_table(conn)?;

    tracing::info!("✅ 数据库表初始化完成");
    Ok(())
}

/// 创建 contact_numbers 表
/// 
/// 存储从TXT文件导入的联系人号码
/// 
/// 状态流转: available → assigned → imported
fn create_contact_numbers_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS contact_numbers (
            -- 主键
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            
            -- 联系人信息
            phone TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            
            -- 来源信息
            source_file TEXT NOT NULL,
            txt_import_id INTEGER,  -- 关联 txt_import_records.id
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            
            -- 业务状态
            status TEXT NOT NULL DEFAULT 'available',  -- available, assigned, imported
            industry TEXT,
            
            -- 分配与使用
            assigned_batch_id TEXT,  -- 关联 vcf_batches.batch_id
            assigned_at TEXT,
            
            imported_device_id TEXT,
            imported_session_id INTEGER,  -- 关联 import_sessions.id
            imported_at TEXT,
            
            -- 唯一约束
            UNIQUE(phone, source_file)
        )",
        [],
    )?;

    // 创建索引提高查询性能
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_status ON contact_numbers(status)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_phone ON contact_numbers(phone)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_batch ON contact_numbers(assigned_batch_id)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_industry ON contact_numbers(industry)",
        [],
    )?;

    tracing::debug!("✅ contact_numbers 表创建完成");
    Ok(())
}

/// 创建 vcf_batches 表
/// 
/// 存储VCF文件生成批次信息
/// 
/// 状态流转: pending → generated → importing → completed
fn create_vcf_batches_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS vcf_batches (
            -- 主键
            batch_id TEXT PRIMARY KEY,
            batch_name TEXT NOT NULL,
            
            -- 生成信息
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            vcf_file_path TEXT,
            
            -- 号码来源
            source_type TEXT NOT NULL DEFAULT 'manual',  -- manual, txt_import, auto
            contact_count INTEGER NOT NULL DEFAULT 0,
            
            -- 批次状态
            status TEXT NOT NULL DEFAULT 'pending',  -- pending, generated, importing, completed
            
            -- 元数据
            industry TEXT,
            description TEXT,
            notes TEXT
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_vcf_batches_status ON vcf_batches(status)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_vcf_batches_created_at ON vcf_batches(created_at)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_vcf_batches_industry ON vcf_batches(industry)",
        [],
    )?;

    tracing::debug!("✅ vcf_batches 表创建完成");
    Ok(())
}

/// 创建 import_sessions 表
/// 
/// 存储联系人导入会话信息
/// 
/// 状态流转: pending → running → success/failed/partial
fn create_import_sessions_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS import_sessions (
            -- 主键
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            
            -- 关联信息
            device_id TEXT NOT NULL,
            batch_id TEXT NOT NULL,  -- 关联 vcf_batches.batch_id
            
            -- 导入信息
            target_app TEXT NOT NULL,
            industry TEXT,
            
            -- 导入统计
            total_count INTEGER NOT NULL DEFAULT 0,
            success_count INTEGER NOT NULL DEFAULT 0,
            failed_count INTEGER NOT NULL DEFAULT 0,
            
            -- 会话状态
            status TEXT NOT NULL DEFAULT 'pending',  -- pending, running, success, failed, partial
            error_message TEXT,
            
            -- 时间记录
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            started_at TEXT,
            finished_at TEXT,
            
            -- 元数据
            description TEXT,
            notes TEXT
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_import_sessions_device_id ON import_sessions(device_id)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_import_sessions_batch_id ON import_sessions(batch_id)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_import_sessions_created_at ON import_sessions(created_at)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_import_sessions_industry ON import_sessions(industry)",
        [],
    )?;

    tracing::debug!("✅ import_sessions 表创建完成");
    Ok(())
}

/// 创建 txt_import_records 表
/// 
/// 存储TXT文件导入的统计信息和记录
/// 
/// 状态说明:
/// - success: 成功导入
/// - empty: 空文件
/// - all_duplicates: 全部重复
/// - partial: 部分成功
/// - failed: 失败
fn create_txt_import_records_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS txt_import_records (
            -- 主键
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            
            -- 文件信息
            file_path TEXT NOT NULL UNIQUE,
            file_name TEXT NOT NULL,
            file_size INTEGER NOT NULL DEFAULT 0,
            
            -- 导入统计
            total_lines INTEGER NOT NULL DEFAULT 0,
            valid_numbers INTEGER NOT NULL DEFAULT 0,
            imported_numbers INTEGER NOT NULL DEFAULT 0,
            duplicate_numbers INTEGER NOT NULL DEFAULT 0,
            invalid_numbers INTEGER NOT NULL DEFAULT 0,
            
            -- 导入状态
            status TEXT NOT NULL DEFAULT 'success',  -- success, empty, all_duplicates, partial, failed
            error_message TEXT,
            
            -- 时间记录
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            imported_at TEXT NOT NULL DEFAULT (datetime('now')),
            
            -- 元数据
            industry TEXT,
            notes TEXT
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_txt_import_status ON txt_import_records(status)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_txt_import_created_at ON txt_import_records(created_at)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_txt_import_industry ON txt_import_records(industry)",
        [],
    )?;

    tracing::debug!("✅ txt_import_records 表创建完成");
    Ok(())
}

/// 检查表是否存在
pub fn table_exists(conn: &Connection, table_name: &str) -> SqliteResult<bool> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
        [table_name],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

/// 获取数据库版本信息
pub fn get_database_version(conn: &Connection) -> SqliteResult<String> {
    conn.query_row("SELECT sqlite_version()", [], |row| {
        let version: String = row.get(0)?;
        Ok(format!("SQLite {}", version))
    })
}

/// 获取表的列信息（用于调试）
#[allow(dead_code)]
pub fn get_table_columns(conn: &Connection, table_name: &str) -> SqliteResult<Vec<String>> {
    let query = format!("PRAGMA table_info({})", table_name);
    let mut stmt = conn.prepare(&query)?;
    
    let columns: Vec<String> = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        Ok(name)
    })?.collect::<Result<_, _>>()?;
    
    Ok(columns)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_table_creation() {
        let conn = Connection::open_in_memory().unwrap();
        
        // 测试初始化
        init_contact_storage_tables(&conn).unwrap();
        
        // 验证表是否存在
        assert!(table_exists(&conn, "contact_numbers").unwrap());
        assert!(table_exists(&conn, "vcf_batches").unwrap());
        assert!(table_exists(&conn, "import_sessions").unwrap();
        assert!(table_exists(&conn, "txt_import_records").unwrap());
    }

    #[test]
    fn test_contact_numbers_structure() {
        let conn = Connection::open_in_memory().unwrap();
        create_contact_numbers_table(&conn).unwrap();
        
        // 测试插入数据
        conn.execute(
            "INSERT INTO contact_numbers (phone, name, source_file, status) VALUES (?1, ?2, ?3, ?4)",
            ["13800138000", "测试联系人", "test.txt", "available"],
        ).unwrap();
        
        // 验证数据
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers WHERE status = 'available'",
            [],
            |row| row.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_vcf_batches_structure() {
        let conn = Connection::open_in_memory().unwrap();
        create_vcf_batches_table(&conn).unwrap();
        
        // 测试插入数据
        conn.execute(
            "INSERT INTO vcf_batches (batch_id, batch_name, source_type, status) VALUES (?1, ?2, ?3, ?4)",
            ["test-batch-001", "测试批次", "manual", "pending"],
        ).unwrap();
        
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batches",
            [],
            |row| row.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_txt_import_records_structure() {
        let conn = Connection::open_in_memory().unwrap();
        create_txt_import_records_table(&conn).unwrap();
        
        // 测试插入空文件记录
        conn.execute(
            "INSERT INTO txt_import_records (file_path, file_name, status, total_lines) 
             VALUES (?1, ?2, ?3, ?4)",
            ["C:/test.txt", "test.txt", "empty", 0],
        ).unwrap();
        
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM txt_import_records WHERE status = 'empty'",
            [],
            |row| row.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }
}
```