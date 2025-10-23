use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use crate::services::contact_storage::models::ContactDbConfig;

/// 数据库管理仓储类
/// 
/// 负责数据库的初始化和配置管理，包括：
/// - 数据库连接管理
/// - 数据库路径配置
/// - 数据库初始化和表创建
/// - 数据库健康检查
pub struct DatabaseRepository;

impl DatabaseRepository {
    /// 获取联系人数据库路径
    pub fn get_contacts_db_path() -> SqliteResult<PathBuf> {
        let mut db_path = std::env::current_dir().unwrap_or_default();
        db_path.push("data");
        db_path.push("contacts.db");
        Ok(db_path)
    }

    /// 初始化数据库连接
    pub fn init_db() -> SqliteResult<Connection> {
        let db_path = Self::get_contacts_db_path()?;
        
        // 确保目录存在
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CANTOPEN),
                    Some(format!("无法创建数据库目录: {}", e)),
                )
            })?;
        }

        let conn = Connection::open(&db_path)?;
        
        // 启用外键约束
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        
        // 创建表结构
        Self::create_tables(&conn)?;
        
        Ok(conn)
    }

    /// 初始化数据库模式（用于兼容旧接口）
    pub fn init_db_schema(conn: &Connection) -> SqliteResult<()> {
        // 启用外键约束
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        Ok(())
    }

    /// 创建数据库表结构
    fn create_tables(conn: &Connection) -> SqliteResult<()> {
        // 创建联系人号码表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS contact_numbers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                batch_id TEXT NOT NULL,
                imported_at TEXT,
                used INTEGER DEFAULT 0,
                used_batch TEXT,
                status TEXT DEFAULT 'not_imported' CHECK (status IN ('not_imported', 'imported', 'failed', 'available')),
                imported_device_id TEXT,
                imported_session_id INTEGER,
                error_message TEXT,
                FOREIGN KEY (imported_session_id) REFERENCES import_sessions(id)
            )",
            [],
        )?;

        // 创建VCF批次表（新schema）
        conn.execute(
            "CREATE TABLE IF NOT EXISTS vcf_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT UNIQUE NOT NULL,
                batch_name TEXT NOT NULL DEFAULT '',
                vcf_file_path TEXT NOT NULL,
                source_type TEXT NOT NULL DEFAULT 'auto',
                contact_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
                industry TEXT,
                description TEXT,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )",
            [],
        )?;
        
        // 迁移旧表结构（如果存在total_numbers列）
        let has_old_columns = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('vcf_batches') WHERE name IN ('total_numbers', 'used_numbers')",
            [],
            |row| row.get::<_, i32>(0)
        ).unwrap_or(0) > 0;
        
        if has_old_columns {
            // 备份旧数据
            let _ = conn.execute(
                "CREATE TABLE IF NOT EXISTS vcf_batches_backup AS SELECT * FROM vcf_batches",
                []
            );
            
            // 删除旧表
            let _ = conn.execute("DROP TABLE IF EXISTS vcf_batches", []);
            
            // 创建新表
            conn.execute(
                "CREATE TABLE vcf_batches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    batch_id TEXT UNIQUE NOT NULL,
                    batch_name TEXT NOT NULL DEFAULT '',
                    vcf_file_path TEXT NOT NULL,
                    source_type TEXT NOT NULL DEFAULT 'auto',
                    contact_count INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
                    industry TEXT,
                    description TEXT,
                    notes TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )",
                []
            )?;
            
            // 迁移数据（如果备份表存在）
            let _ = conn.execute(
                "INSERT INTO vcf_batches (batch_id, batch_name, vcf_file_path, source_type, contact_count, status, created_at)
                 SELECT batch_id, batch_id as batch_name, vcf_file_path, 'auto' as source_type, 
                        COALESCE(total_numbers, 0) as contact_count, 'completed' as status, created_at
                 FROM vcf_batches_backup",
                []
            );
        }

        // 创建VCF批次号码映射表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS vcf_batch_numbers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                vcf_entry_index INTEGER NOT NULL,
                FOREIGN KEY (batch_id) REFERENCES vcf_batches(batch_id)
            )",
            [],
        )?;

        // 创建导入会话表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS import_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                device_id TEXT NOT NULL,
                industry TEXT,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
                imported_count INTEGER DEFAULT 0,
                failed_count INTEGER DEFAULT 0,
                started_at TEXT DEFAULT (datetime('now')),
                finished_at TEXT,
                error_message TEXT,
                FOREIGN KEY (batch_id) REFERENCES vcf_batches(batch_id)
            )",
            [],
        )?;

        // 创建导入会话事件表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS import_session_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                occurred_at TEXT DEFAULT (datetime('now')),
                device_id TEXT NOT NULL,
                status TEXT NOT NULL,
                imported_count INTEGER DEFAULT 0,
                failed_count INTEGER DEFAULT 0,
                error_message TEXT,
                FOREIGN KEY (session_id) REFERENCES import_sessions(id)
            )",
            [],
        )?;

        // 创建索引以提高查询性能
        Self::create_indexes(conn)?;

        Ok(())
    }

    /// 创建数据库索引
    fn create_indexes(conn: &Connection) -> SqliteResult<()> {
        // 联系人号码表索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_contact_numbers_phone ON contact_numbers(phone_number)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_contact_numbers_batch ON contact_numbers(batch_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_contact_numbers_status ON contact_numbers(status)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_contact_numbers_used ON contact_numbers(used)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_contact_numbers_device ON contact_numbers(imported_device_id)",
            [],
        )?;

        // VCF批次表索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_vcf_batches_batch_id ON vcf_batches(batch_id)",
            [],
        )?;

        // 导入会话表索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_import_sessions_batch ON import_sessions(batch_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_import_sessions_device ON import_sessions(device_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_import_sessions_industry ON import_sessions(industry)",
            [],
        )?;

        // 导入会话事件表索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_import_session_events_session ON import_session_events(session_id)",
            [],
        )?;

        Ok(())
    }

    /// 获取数据库配置信息
    pub fn get_database_config(conn: &Connection) -> SqliteResult<ContactDbConfig> {
        let db_path = Self::get_contacts_db_path()?;
        
        // 获取数据库文件大小
        let file_size = std::fs::metadata(&db_path)
            .map(|metadata| metadata.len())
            .unwrap_or(0);

        // 获取数据库版本信息
        let schema_version: String = conn.query_row(
            "PRAGMA schema_version",
            [],
            |row| row.get(0),
        ).unwrap_or_else(|_| "unknown".to_string());

        let user_version: i64 = conn.query_row(
            "PRAGMA user_version",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        // 获取表统计信息
        let table_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        // 获取索引统计信息
        let index_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='index'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        Ok(ContactDbConfig {
            db_path: db_path.to_string_lossy().to_string(),
            file_size,
            schema_version,
            user_version,
            table_count,
            index_count,
        })
    }

    /// 验证数据库连接健康状态
    pub fn check_database_health(conn: &Connection) -> SqliteResult<bool> {
        // 执行基本查询测试连接
        let _: i64 = conn.query_row("SELECT 1", [], |row| row.get(0))?;
        
        // 检查关键表是否存在
        let tables = vec![
            "contact_numbers",
            "vcf_batches", 
            "vcf_batch_numbers",
            "import_sessions",
            "import_session_events"
        ];

        for table in tables {
            let exists: i64 = conn.query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
                [table],
                |row| row.get(0),
            )?;
            
            if exists == 0 {
                return Ok(false);
            }
        }

        // 检查外键约束是否启用
        let foreign_keys: i64 = conn.query_row(
            "PRAGMA foreign_keys",
            [],
            |row| row.get(0),
        )?;

        Ok(foreign_keys == 1)
    }

    /// 获取数据库统计摘要
    pub fn get_database_summary(conn: &Connection) -> SqliteResult<crate::services::contact_storage::models::DatabaseSummary> {
        let total_numbers: i64 = conn.query_row(
            "SELECT COUNT(*) FROM contact_numbers",
            [],
            |row| row.get(0),
        )?;

        let total_batches: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vcf_batches",
            [],
            |row| row.get(0),
        )?;

        let total_sessions: i64 = conn.query_row(
            "SELECT COUNT(*) FROM import_sessions",
            [],
            |row| row.get(0),
        )?;

        let successful_sessions: i64 = conn.query_row(
            "SELECT COUNT(*) FROM import_sessions WHERE status = 'success'",
            [],
            |row| row.get(0),
        )?;

        let total_imported: i64 = conn.query_row(
            "SELECT COALESCE(SUM(imported_count), 0) FROM import_sessions",
            [],
            |row| row.get(0),
        )?;

        let total_failed: i64 = conn.query_row(
            "SELECT COALESCE(SUM(failed_count), 0) FROM import_sessions",
            [],
            |row| row.get(0),
        )?;

        Ok(crate::services::contact_storage::models::DatabaseSummary {
            total_numbers,
            total_batches,
            total_sessions,
            successful_sessions,
            total_imported,
            total_failed,
        })
    }
}