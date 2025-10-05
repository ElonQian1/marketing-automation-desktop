use rusqlite::{Connection, Result as SqliteResult, params};
use chrono;

use crate::services::contact_storage::models::{
    ImportSessionDto, ImportSessionList, ImportSessionEventDto, 
    ImportSessionEventList, DeleteImportSessionResult
};

/// 导入会话仓储类
/// 
/// 负责导入会话的管理，包括：
/// - 会话创建和状态更新
/// - 会话查询和过滤
/// - 会话事件记录
pub struct ImportSessionRepository;

impl ImportSessionRepository {
    /// 创建新的导入会话
    pub fn create_import_session(
        conn: &Connection,
        batch_id: &str,
        device_id: &str,
        industry: Option<&str>,
    ) -> SqliteResult<i64> {
        // 生成唯一会话ID
        let session_id = format!("session_{}", chrono::Utc::now().timestamp_millis());
        
        let mut stmt = conn.prepare(
            "INSERT INTO import_sessions 
             (session_id, device_id, batch_id, target_app, session_description, 
              status, success_count, failed_count, started_at, created_at, industry) 
             VALUES (?1, ?2, ?3, 'unknown', NULL, 'pending', 0, 0, datetime('now'), datetime('now'), ?4)"
        )?;

        stmt.execute(params![session_id, device_id, batch_id, industry])?;
        Ok(conn.last_insert_rowid())
    }

    /// 完成导入会话
    pub fn finish_import_session(
        conn: &Connection,
        session_id: i64,
        status: &str,
        imported_count: i64,
        failed_count: i64,
        error_message: Option<&str>,
    ) -> SqliteResult<()> {
        let mut stmt = conn.prepare(
            "UPDATE import_sessions 
             SET status = ?2, success_count = ?3, failed_count = ?4, error_message = ?5,
                 finished_at = datetime('now')
             WHERE id = ?1"
        )?;

        stmt.execute(params![session_id, status, imported_count, failed_count, error_message])?;
        Ok(())
    }

    /// 更新导入会话进度
    pub fn update_import_progress(
        conn: &Connection,
        session_id: i64,
        imported_count: i64,
        failed_count: i64,
    ) -> SqliteResult<()> {
        let mut stmt = conn.prepare(
            "UPDATE import_sessions 
             SET success_count = ?2, failed_count = ?3
             WHERE id = ?1"
        )?;

        stmt.execute(params![session_id, imported_count, failed_count])?;
        Ok(())
    }

    /// 更新导入会话状态
    pub fn update_import_session_status(
        conn: &Connection,
        session_id: i64,
        status: &str,
        imported_count: Option<i64>,
        error_message: Option<&str>,
    ) -> SqliteResult<i64> {
        let mut stmt = conn.prepare(
            "UPDATE import_sessions 
             SET status = ?2, success_count = COALESCE(?3, success_count), 
                 error_message = ?4, finished_at = datetime('now')
             WHERE id = ?1"
        )?;

        stmt.execute(params![session_id, status, imported_count, error_message])?;
        Ok(conn.changes() as i64)
    }

    /// 获取会话事件列表 (list_import_session_events 的别名)
    pub fn list_import_session_events(
        conn: &Connection,
        session_id: i64,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ImportSessionEventList> {
        Self::get_session_events(conn, session_id, limit, offset)
    }

    /// 根据会话ID获取单个导入会话 (get_import_session 的别名)
    pub fn get_import_session(
        conn: &Connection,
        session_id: i64,
    ) -> SqliteResult<Option<ImportSessionDto>> {
        Self::get_import_session_by_id(conn, session_id)
    }

    /// 创建新的导入会话（原版本，保持兼容）
    pub fn create_import_session_original(
        conn: &Connection,
        session_id: &str,
        device_id: &str,
        batch_id: &str,
        target_app: &str,
        session_description: Option<&str>,
        industry: Option<&str>,
    ) -> SqliteResult<i64> {
        let mut stmt = conn.prepare(
            "INSERT INTO import_sessions 
             (session_id, device_id, batch_id, target_app, session_description, 
              status, success_count, failed_count, started_at, created_at, industry) 
             VALUES (?1, ?2, ?3, ?4, ?5, 'pending', 0, 0, datetime('now'), datetime('now'), ?6)"
        )?;

        stmt.execute(params![session_id, device_id, batch_id, target_app, session_description, industry])?;
        Ok(conn.last_insert_rowid())
    }

    /// 更新会话状态
    pub fn update_session_status(
        conn: &Connection,
        session_id: i64,
        status: &str,
        success_count: Option<i64>,
        failed_count: Option<i64>,
        error_message: Option<&str>,
    ) -> SqliteResult<()> {
        let mut stmt = conn.prepare(
            "UPDATE import_sessions 
             SET status = ?2, success_count = COALESCE(?3, success_count), 
                 failed_count = COALESCE(?4, failed_count), error_message = ?5,
                 finished_at = CASE WHEN ?2 IN ('success', 'failed') THEN datetime('now') ELSE finished_at END
             WHERE id = ?1"
        )?;

        stmt.execute(params![session_id, status, success_count, failed_count, error_message])?;
        Ok(())
    }

    /// 根据ID获取导入会话
    pub fn get_import_session_by_id(
        conn: &Connection,
        session_id: i64,
    ) -> SqliteResult<Option<ImportSessionDto>> {
        let mut stmt = conn.prepare(
            "SELECT id, session_id, device_id, batch_id, target_app, session_description, 
                    status, success_count, failed_count, started_at, finished_at, created_at, 
                    error_message, industry
             FROM import_sessions 
             WHERE id = ?1"
        )?;

        let mut rows = stmt.query_map([session_id], |row| {
            Ok(ImportSessionDto {
                id: row.get(0)?,
                session_id: row.get(1)?,
                device_id: row.get(2)?,
                batch_id: row.get(3)?,
                target_app: row.get(4)?,
                session_description: row.get(5)?,
                status: row.get(6)?,
                success_count: row.get(7)?,
                failed_count: row.get(8)?,
                started_at: row.get(9)?,
                finished_at: row.get(10)?,
                created_at: row.get(11)?,
                error_message: row.get(12)?,
                industry: row.get(13)?,
            })
        })?;

        match rows.next() {
            Some(session) => Ok(Some(session?)),
            None => Ok(None),
        }
    }

    /// 分页查询导入会话列表
    pub fn list_import_sessions(
        conn: &Connection,
        limit: i64,
        offset: i64,
        device_id: Option<&str>,
        batch_id: Option<&str>,
        industry: Option<&str>,
    ) -> SqliteResult<ImportSessionList> {
        // 构建过滤条件
        let mut where_conditions = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];

        if let Some(device) = device_id {
            where_conditions.push("device_id = ?");
            params.push(Box::new(device.to_string()));
        }
        if let Some(batch) = batch_id {
            where_conditions.push("batch_id = ?");
            params.push(Box::new(batch.to_string()));
        }
        if let Some(ind) = industry {
            where_conditions.push("industry = ?");
            params.push(Box::new(ind.to_string()));
        }

        let where_clause = if where_conditions.is_empty() {
            String::new()
        } else {
            format!(" WHERE {}", where_conditions.join(" AND "))
        };

        // 获取总数
        let count_sql = format!("SELECT COUNT(*) FROM import_sessions{}", where_clause);
        let params_ref: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let total: i64 = conn.query_row(&count_sql, &params_ref[..], |row| row.get(0))?;

        // 添加分页参数
        let mut all_params = params_ref;
        all_params.push(&limit);
        all_params.push(&offset);

        // 获取数据
        let data_sql = format!(
            "SELECT id, session_id, device_id, batch_id, target_app, session_description, 
                    status, success_count, failed_count, started_at, finished_at, created_at, 
                    error_message, industry
             FROM import_sessions{} 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?", 
            where_clause
        );

        let mut stmt = conn.prepare(&data_sql)?;
        let session_rows = stmt.query_map(&all_params[..], |row| {
            Ok(ImportSessionDto {
                id: row.get(0)?,
                session_id: row.get(1)?,
                device_id: row.get(2)?,
                batch_id: row.get(3)?,
                target_app: row.get(4)?,
                session_description: row.get(5)?,
                status: row.get(6)?,
                success_count: row.get(7)?,
                failed_count: row.get(8)?,
                started_at: row.get(9)?,
                finished_at: row.get(10)?,
                created_at: row.get(11)?,
                error_message: row.get(12)?,
                industry: row.get(13)?,
            })
        })?;

        let sessions: Result<Vec<_>, _> = session_rows.collect();

        Ok(ImportSessionList {
            total,
            items: sessions?,
            limit,
            offset,
        })
    }

    /// 添加导入会话事件
    pub fn add_import_session_event(
        conn: &Connection,
        session_id: i64,
        event_type: &str,
        event_data: Option<&str>,
    ) -> SqliteResult<i64> {
        let mut stmt = conn.prepare(
            "INSERT INTO import_session_events 
             (session_id, event_type, event_data, created_at, occurred_at) 
             VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))"
        )?;

        stmt.execute(params![session_id, event_type, event_data])?;
        Ok(conn.last_insert_rowid())
    }

    /// 获取会话事件列表
    pub fn get_session_events(
        conn: &Connection,
        session_id: i64,
        limit: i64,
        offset: i64,
    ) -> SqliteResult<ImportSessionEventList> {
        // 获取总数
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM import_session_events WHERE session_id = ?1",
            [session_id],
            |row| row.get(0),
        )?;

        // 获取数据
        let mut stmt = conn.prepare(
            "SELECT id, session_id, event_type, event_data, created_at, occurred_at, 
                    NULL as device_id, NULL as status, NULL as imported_count, 
                    NULL as failed_count, NULL as error_message
             FROM import_session_events 
             WHERE session_id = ?1 
             ORDER BY created_at DESC 
             LIMIT ?2 OFFSET ?3"
        )?;

        let event_rows = stmt.query_map([session_id, limit, offset], |row| {
            Ok(ImportSessionEventDto {
                id: row.get(0)?,
                session_id: row.get(1)?,
                event_type: row.get(2)?,
                event_data: row.get(3)?,
                created_at: row.get(4)?,
                occurred_at: row.get(5)?,
                device_id: row.get(6)?,
                status: row.get(7)?,
                imported_count: row.get(8)?,
                failed_count: row.get(9)?,
                error_message: row.get(10)?,
            })
        })?;

        let events: Result<Vec<_>, _> = event_rows.collect();

        Ok(ImportSessionEventList {
            total,
            items: events?,
            limit,
            offset,
        })
    }

    /// 删除导入会话及相关数据
    pub fn delete_import_session(
        conn: &Connection,
        session_id: i64,
    ) -> SqliteResult<DeleteImportSessionResult> {
        // 回滚关联的联系人号码
        let archived_number_count = conn.execute(
            "UPDATE contact_numbers 
             SET status = 'available', imported_session_id = NULL, imported_device_id = NULL
             WHERE imported_session_id = ?1",
            [session_id],
        )?;

        // 删除会话事件
        let removed_event_count = conn.execute(
            "DELETE FROM import_session_events WHERE session_id = ?1",
            [session_id],
        )?;

        // 删除会话本身
        conn.execute("DELETE FROM import_sessions WHERE id = ?1", [session_id])?;

        Ok(DeleteImportSessionResult {
            session_id,
            archived_number_count: archived_number_count as i64,
            removed_event_count: removed_event_count as i64,
            removed_batch_link_count: 0, // 这里可能需要根据实际业务逻辑调整
            removed_batch_record: false,
        })
    }

    /// 更新会话行业分类
    pub fn update_session_industry(
        conn: &Connection,
        session_id: i64,
        industry: &str,
    ) -> SqliteResult<()> {
        let mut stmt = conn.prepare(
            "UPDATE import_sessions SET industry = ?2 WHERE id = ?1"
        )?;

        stmt.execute(params![session_id, industry])?;
        Ok(())
    }

    /// 回滚会话状态（将成功的会话标记为失败）
    pub fn revert_session_to_failed(
        conn: &Connection,
        session_id: i64,
        reason: &str,
    ) -> SqliteResult<i64> {
        // 回滚关联的联系人号码
        let reverted_count = conn.execute(
            "UPDATE contact_numbers 
             SET status = 'available', imported_session_id = NULL, imported_device_id = NULL
             WHERE imported_session_id = ?1",
            [session_id],
        )?;

        // 更新会话状态
        let error_message = format!("用户手动回滚: {}", reason);
        conn.execute(
            "UPDATE import_sessions 
             SET status = 'failed', error_message = ?2 
             WHERE id = ?1",
            params![session_id, error_message],
        )?;

        Ok(reverted_count as i64)
    }
}