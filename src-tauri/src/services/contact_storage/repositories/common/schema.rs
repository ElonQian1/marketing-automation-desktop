/// 数据库表结构定义和初始化
/// 
/// 包含联系人存储系统的所有表的DDL语句

use rusqlite::{Connection, Result as SqliteResult};

/// 数据库表初始化
/// 
/// 创建所有必需的表，包括：
/// - contact_numbers: 联系人号码表
/// - vcf_batches: VCF批次表
/// - import_sessions: 导入会话表
/// - txt_import_records: TXT文件导入记录表
pub fn init_contact_storage_tables(conn: &Connection) -> SqliteResult<()> {
    // 注意：PRAGMA语句已在database.rs的get_connection()中统一配置
    // 此处仅负责创建表结构
    
    // 创建联系人号码表
    create_contact_numbers_table(conn)?;
    
    // 创建VCF批次表
    create_vcf_batches_table(conn)?;
    
    // 创建导入会话表
    create_import_sessions_table(conn)?;
    
    // 创建TXT文件导入记录表
    create_txt_import_records_table(conn)?;

    tracing::info!("数据库表初始化完成");
    Ok(())
}

/// 创建 contact_numbers 表
/// 
/// 存储从TXT文件导入的联系人号码
fn create_contact_numbers_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS contact_numbers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            name TEXT NOT NULL,
            source_file TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            
            -- 业务元数据字段
            industry TEXT,
            used INTEGER DEFAULT 0,
            used_at TEXT,
            used_batch TEXT,
            status TEXT DEFAULT 'not_imported',
            imported_device_id TEXT,
            
            -- 创建唯一索引避免重复号码
            UNIQUE(phone, source_file)
        )",
        [],
    )?;

    // 创建索引提高查询性能
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_phone ON contact_numbers(phone)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_used ON contact_numbers(used)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_industry ON contact_numbers(industry)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_contact_numbers_status ON contact_numbers(status)",
        [],
    )?;

    tracing::debug!("contact_numbers 表创建完成");
    Ok(())
}

/// 创建 vcf_batches 表
/// 
/// 存储VCF文件生成批次信息
fn create_vcf_batches_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS vcf_batches (
            batch_id TEXT PRIMARY KEY,
            batch_name TEXT NOT NULL,
            source_type TEXT NOT NULL,
            generation_method TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            vcf_file_path TEXT,
            is_completed INTEGER DEFAULT 0,
            source_start_id INTEGER,
            source_end_id INTEGER
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_vcf_batches_created_at ON vcf_batches(created_at)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_vcf_batches_is_completed ON vcf_batches(is_completed)",
        [],
    )?;

    tracing::debug!("vcf_batches 表创建完成");
    Ok(())
}

/// 创建 import_sessions 表
/// 
/// 存储联系人导入会话信息
fn create_import_sessions_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS import_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            device_id TEXT NOT NULL,
            batch_id TEXT NOT NULL,
            target_app TEXT NOT NULL,
            session_description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            imported_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            finished_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            error_message TEXT,
            industry TEXT
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

    tracing::debug!("import_sessions 表创建完成");
    Ok(())
}

/// 创建 txt_import_records 表
/// 
/// 存储TXT文件导入的统计信息和记录
fn create_txt_import_records_table(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS txt_import_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            
            -- 文件信息
            file_path TEXT NOT NULL UNIQUE,
            file_name TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            file_modified_at TEXT,
            
            -- 导入统计
            total_numbers INTEGER DEFAULT 0,
            successful_imports INTEGER DEFAULT 0,
            duplicate_numbers INTEGER DEFAULT 0,
            invalid_numbers INTEGER DEFAULT 0,
            
            -- 导入状态
            import_status TEXT DEFAULT 'pending',  -- pending, success, failed, partial
            error_message TEXT,
            
            -- 时间记录
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            imported_at TEXT,
            updated_at TEXT DEFAULT (datetime('now')),
            
            -- 元数据
            industry TEXT,
            notes TEXT
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_txt_import_file_path ON txt_import_records(file_path)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_txt_import_status ON txt_import_records(import_status)",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_txt_import_created_at ON txt_import_records(created_at)",
        [],
    )?;

    // 创建触发器来自动更新 updated_at
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_txt_import_updated_at 
         AFTER UPDATE ON txt_import_records
         BEGIN
             UPDATE txt_import_records SET updated_at = datetime('now') WHERE id = NEW.id;
         END",
        [],
    )?;

    tracing::debug!("txt_import_records 表创建完成");
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
        assert!(table_exists(&conn, "import_sessions").unwrap());
    }

    #[test]
    fn test_contact_numbers_structure() {
        let conn = Connection::open_in_memory().unwrap();
        create_contact_numbers_table(&conn).unwrap();
        
        // 测试插入数据
        conn.execute(
            "INSERT INTO contact_numbers (phone, name, source_file) VALUES (?1, ?2, ?3)",
            ["13800138000", "测试联系人", "test.txt"],
        ).unwrap();
        
        // 验证数据
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers",
            [],
            |row| row.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }
}