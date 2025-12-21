// src-tauri/src/core/application/mde_storage_service.rs
// module: core/application | layer: application | role: mde-storage
// summary: MDE 数据存储服务 - 将提取的数据保存到 SQLite

use anyhow::{Result, Context};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tracing::{info, debug, warn};
use chrono::{DateTime, Utc};

use crate::core::domain::mde_extraction::{MdeDataType, MdeExtractedItem};

// ============================================================================
// 存储结果类型
// ============================================================================

/// MDE 存储操作结果
#[derive(Debug, Clone, Serialize)]
pub struct MdeSaveResult {
    /// 操作是否成功
    pub success: bool,
    /// 保存的记录数
    pub saved_count: usize,
    /// 因去重跳过的记录数
    pub skipped_count: usize,
    /// 更新的记录数（如果启用 upsert）
    pub updated_count: usize,
    /// 目标表名
    pub table_name: String,
    /// 错误信息（如果有）
    pub error: Option<String>,
}

impl MdeSaveResult {
    pub fn success(saved: usize, skipped: usize, table: &str) -> Self {
        Self {
            success: true,
            saved_count: saved,
            skipped_count: skipped,
            updated_count: 0,
            table_name: table.to_string(),
            error: None,
        }
    }

    pub fn error(msg: impl Into<String>) -> Self {
        Self {
            success: false,
            saved_count: 0,
            skipped_count: 0,
            updated_count: 0,
            table_name: String::new(),
            error: Some(msg.into()),
        }
    }
}

/// 存储选项
#[derive(Debug, Clone, Deserialize)]
pub struct MdeSaveOptions {
    /// 自定义表名（可选，默认根据数据类型生成）
    pub table_name: Option<String>,
    /// 用于去重的字段列表
    pub dedupe_fields: Vec<String>,
    /// 是否使用 upsert（存在则更新）
    pub upsert: bool,
    /// APP 包名（用于数据隔离）
    pub app_package: Option<String>,
    /// 页面类型（用于数据分类）
    pub page_type: Option<String>,
}

impl Default for MdeSaveOptions {
    fn default() -> Self {
        Self {
            table_name: None,
            dedupe_fields: vec![],
            upsert: false,
            app_package: None,
            page_type: None,
        }
    }
}

// ============================================================================
// 存储服务
// ============================================================================

/// MDE 数据存储服务
/// 
/// 负责将提取的数据保存到 SQLite 数据库
pub struct MdeStorageService {
    db_path: PathBuf,
    conn: Mutex<Option<Connection>>,
}

impl MdeStorageService {
    /// 创建存储服务
    /// 
    /// # Arguments
    /// * `data_dir` - 应用数据目录
    pub fn new(data_dir: PathBuf) -> Self {
        let db_path = data_dir.join("mde_extracted.db");
        Self {
            db_path,
            conn: Mutex::new(None),
        }
    }

    /// 确保数据库连接已建立
    fn ensure_connection(&self) -> Result<()> {
        let mut conn_guard = self.conn.lock().unwrap();
        if conn_guard.is_none() {
            // 确保目录存在
            if let Some(parent) = self.db_path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            
            let conn = Connection::open(&self.db_path)?;
            
            // 开启 WAL 模式
            conn.pragma_update(None, "journal_mode", "WAL")?;
            conn.pragma_update(None, "foreign_keys", "ON")?;
            conn.busy_timeout(std::time::Duration::from_secs(5))?;
            
            // 创建元数据表
            self.create_meta_table(&conn)?;
            
            *conn_guard = Some(conn);
            info!("MDE 存储服务已连接数据库: {:?}", self.db_path);
        }
        Ok(())
    }

    /// 创建元数据表
    fn create_meta_table(&self, conn: &Connection) -> Result<()> {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS mde_extraction_meta (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL UNIQUE,
                data_type TEXT NOT NULL,
                app_package TEXT,
                created_at TEXT NOT NULL,
                last_updated TEXT NOT NULL,
                total_records INTEGER DEFAULT 0
            )",
            [],
        )?;
        Ok(())
    }

    /// 保存提取的数据
    /// 
    /// # Arguments
    /// * `items` - 提取的数据项列表
    /// * `data_type` - 数据类型
    /// * `options` - 存储选项
    pub fn save(
        &self,
        items: &[MdeExtractedItem],
        data_type: MdeDataType,
        options: MdeSaveOptions,
    ) -> Result<MdeSaveResult> {
        if items.is_empty() {
            return Ok(MdeSaveResult::success(0, 0, ""));
        }

        self.ensure_connection()?;
        
        let table_name = options.table_name.clone()
            .unwrap_or_else(|| self.generate_table_name(&data_type, options.app_package.as_deref()));
        
        let conn_guard = self.conn.lock().unwrap();
        let conn = conn_guard.as_ref().unwrap();
        
        // 确保目标表存在
        self.ensure_table_exists(conn, &table_name, items)?;
        
        // 保存数据
        let mut saved_count = 0;
        let mut skipped_count = 0;
        
        for item in items {
            let should_skip = if !options.dedupe_fields.is_empty() {
                self.check_duplicate(conn, &table_name, item, &options.dedupe_fields)?
            } else {
                false
            };
            
            if should_skip {
                skipped_count += 1;
                debug!("跳过重复项: {:?}", item.fields.get("id"));
                continue;
            }
            
            self.insert_item(conn, &table_name, item, &options)?;
            saved_count += 1;
        }
        
        // 更新元数据
        self.update_meta(conn, &table_name, &data_type, options.app_package.as_deref())?;
        
        info!(
            "MDE 存储完成: {} 条保存, {} 条跳过, 表: {}",
            saved_count, skipped_count, table_name
        );
        
        Ok(MdeSaveResult::success(saved_count, skipped_count, &table_name))
    }

    /// 生成表名
    fn generate_table_name(&self, data_type: &MdeDataType, app_package: Option<&str>) -> String {
        let type_name = match data_type {
            MdeDataType::Comments => "comments",
            MdeDataType::Products => "products",
            MdeDataType::Users => "users",
            MdeDataType::Posts => "posts",
            MdeDataType::Messages => "messages",
            MdeDataType::Custom(name) => name.as_str(),
        };
        
        if let Some(pkg) = app_package {
            // 简化包名: com.ss.android.ugc.aweme -> aweme
            let short_pkg = pkg.split('.').last().unwrap_or(pkg);
            format!("mde_{}_{}", short_pkg, type_name)
        } else {
            format!("mde_{}", type_name)
        }
    }

    /// 确保表存在（根据第一条数据的字段动态创建）
    fn ensure_table_exists(
        &self,
        conn: &Connection,
        table_name: &str,
        items: &[MdeExtractedItem],
    ) -> Result<()> {
        // 检查表是否存在
        let exists: bool = conn.query_row(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            [table_name],
            |_| Ok(true),
        ).unwrap_or(false);
        
        if exists {
            return Ok(());
        }
        
        // 从第一条数据推断字段
        let first_item = items.first().context("无数据项")?;
        
        let mut columns = vec![
            "id INTEGER PRIMARY KEY AUTOINCREMENT".to_string(),
            "mde_item_id TEXT".to_string(),
            "mde_source_app TEXT".to_string(),
            "mde_page_type TEXT".to_string(),
            "mde_extracted_at TEXT NOT NULL".to_string(),
            "mde_confidence REAL".to_string(),
        ];
        
        // 根据数据字段添加列
        for (key, _value) in &first_item.fields {
            // 跳过系统字段
            if key.starts_with("mde_") {
                continue;
            }
            // 所有用户字段都用 TEXT 类型（简化处理）
            columns.push(format!("{} TEXT", key));
        }
        
        let create_sql = format!(
            "CREATE TABLE {} ({})",
            table_name,
            columns.join(", ")
        );
        
        conn.execute(&create_sql, [])?;
        info!("创建 MDE 表: {}", table_name);
        
        Ok(())
    }

    /// 检查是否重复
    fn check_duplicate(
        &self,
        conn: &Connection,
        table_name: &str,
        item: &MdeExtractedItem,
        dedupe_fields: &[String],
    ) -> Result<bool> {
        if dedupe_fields.is_empty() {
            return Ok(false);
        }
        
        let mut conditions = vec![];
        let mut values: Vec<String> = vec![];
        
        for field in dedupe_fields {
            if let Some(value) = item.fields.get(field) {
                conditions.push(format!("{} = ?", field));
                values.push(value.as_string());
            }
        }
        
        if conditions.is_empty() {
            return Ok(false);
        }
        
        let query = format!(
            "SELECT 1 FROM {} WHERE {} LIMIT 1",
            table_name,
            conditions.join(" AND ")
        );
        
        let exists: bool = conn.query_row(
            &query,
            rusqlite::params_from_iter(values.iter()),
            |_| Ok(true),
        ).unwrap_or(false);
        
        Ok(exists)
    }

    /// 插入单条数据
    fn insert_item(
        &self,
        conn: &Connection,
        table_name: &str,
        item: &MdeExtractedItem,
        options: &MdeSaveOptions,
    ) -> Result<()> {
        let mut columns = vec![
            "mde_item_id".to_string(),
            "mde_source_app".to_string(),
            "mde_page_type".to_string(),
            "mde_extracted_at".to_string(),
            "mde_confidence".to_string(),
        ];
        
        let mut placeholders = vec!["?", "?", "?", "?", "?"];
        let now = Utc::now().to_rfc3339();
        
        // 使用 bounds 或生成 id
        let item_id = item.bounds.clone()
            .unwrap_or_else(|| format!("item_{}", chrono::Utc::now().timestamp_millis()));
        
        let mut values: Vec<String> = vec![
            item_id,
            options.app_package.clone().unwrap_or_default(),
            options.page_type.clone().unwrap_or_default(),
            now,
            item.confidence.to_string(),
        ];
        
        // 添加用户字段
        for (key, value) in &item.fields {
            if key.starts_with("mde_") {
                continue;
            }
            columns.push(key.clone());
            placeholders.push("?");
            values.push(value.as_string());
        }
        
        let insert_sql = format!(
            "INSERT INTO {} ({}) VALUES ({})",
            table_name,
            columns.join(", "),
            placeholders.join(", ")
        );
        
        conn.execute(
            &insert_sql,
            rusqlite::params_from_iter(values.iter()),
        )?;
        
        Ok(())
    }

    /// 更新元数据表
    fn update_meta(
        &self,
        conn: &Connection,
        table_name: &str,
        data_type: &MdeDataType,
        app_package: Option<&str>,
    ) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        let type_str = format!("{:?}", data_type);
        
        conn.execute(
            "INSERT INTO mde_extraction_meta (table_name, data_type, app_package, created_at, last_updated)
             VALUES (?1, ?2, ?3, ?4, ?4)
             ON CONFLICT(table_name) DO UPDATE SET
                last_updated = ?4,
                total_records = (SELECT COUNT(*) FROM ?1)",
            params![table_name, type_str, app_package.unwrap_or(""), now],
        )?;
        
        Ok(())
    }

    /// 查询已保存的数据
    pub fn query(
        &self,
        table_name: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<Vec<serde_json::Value>> {
        self.ensure_connection()?;
        
        let conn_guard = self.conn.lock().unwrap();
        let conn = conn_guard.as_ref().unwrap();
        
        let query = format!(
            "SELECT * FROM {} LIMIT {} OFFSET {}",
            table_name,
            limit.unwrap_or(100),
            offset.unwrap_or(0)
        );
        
        let mut stmt = conn.prepare(&query)?;
        let column_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
        
        let rows = stmt.query_map([], |row| {
            let mut obj = serde_json::Map::new();
            for (i, name) in column_names.iter().enumerate() {
                let value: String = row.get(i).unwrap_or_default();
                obj.insert(name.clone(), serde_json::Value::String(value));
            }
            Ok(serde_json::Value::Object(obj))
        })?;
        
        let mut results = vec![];
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }

    /// 获取表统计信息
    pub fn get_stats(&self, table_name: &str) -> Result<serde_json::Value> {
        self.ensure_connection()?;
        
        let conn_guard = self.conn.lock().unwrap();
        let conn = conn_guard.as_ref().unwrap();
        
        let count: i64 = conn.query_row(
            &format!("SELECT COUNT(*) FROM {}", table_name),
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        Ok(serde_json::json!({
            "table_name": table_name,
            "total_records": count,
        }))
    }

    /// 列出所有 MDE 表
    pub fn list_tables(&self) -> Result<Vec<serde_json::Value>> {
        self.ensure_connection()?;
        
        let conn_guard = self.conn.lock().unwrap();
        let conn = conn_guard.as_ref().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT table_name, data_type, app_package, created_at, last_updated, total_records 
             FROM mde_extraction_meta ORDER BY last_updated DESC"
        )?;
        
        let rows = stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "table_name": row.get::<_, String>(0).unwrap_or_default(),
                "data_type": row.get::<_, String>(1).unwrap_or_default(),
                "app_package": row.get::<_, String>(2).unwrap_or_default(),
                "created_at": row.get::<_, String>(3).unwrap_or_default(),
                "last_updated": row.get::<_, String>(4).unwrap_or_default(),
                "total_records": row.get::<_, i64>(5).unwrap_or(0),
            }))
        })?;
        
        let mut results = vec![];
        for row in rows {
            results.push(row?);
        }
        
        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use crate::core::domain::mde_extraction::MdeFieldValue;
    use tempfile::TempDir;

    #[test]
    fn test_save_and_query() {
        let temp_dir = TempDir::new().unwrap();
        let service = MdeStorageService::new(temp_dir.path().to_path_buf());
        
        let mut fields = HashMap::new();
        fields.insert("username".to_string(), MdeFieldValue::Text("测试用户".to_string()));
        fields.insert("content".to_string(), MdeFieldValue::Text("测试评论内容".to_string()));
        
        let item = MdeExtractedItem {
            data_type: MdeDataType::Comments,
            id: Some("test_001".to_string()),
            fields,
            confidence: Some(0.95),
            source_element: None,
        };
        
        let options = MdeSaveOptions {
            app_package: Some("com.ss.android.ugc.aweme".to_string()),
            ..Default::default()
        };
        
        let result = service.save(&[item], MdeDataType::Comments, options).unwrap();
        
        assert!(result.success);
        assert_eq!(result.saved_count, 1);
        assert_eq!(result.table_name, "mde_aweme_comments");
    }
}
