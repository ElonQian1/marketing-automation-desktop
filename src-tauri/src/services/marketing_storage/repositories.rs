use rusqlite::{params, Connection, OptionalExtension};
use tauri::AppHandle;
use uuid::Uuid;
use crate::services::contact_storage::repositories::database_repo as contact_db;

use super::models::{
    WatchTargetPayload, WatchTargetRow, ListWatchTargetsQuery,
    CommentPayload, CommentRow, ListCommentsQuery,
    TaskPayload, TaskRow, ListTasksQuery,
    ReplyTemplatePayload, ReplyTemplateRow, ListReplyTemplatesQuery,
    AuditLogPayload, AuditLogRow, ListAuditLogsQuery,
    DailyReportPayload, DailyReportRow,
};

// ==================== SQL 表创建脚本 ====================

const CREATE_TABLES_SQL: &str = r#"
-- 候选池表（已存在，保持兼容）
CREATE TABLE IF NOT EXISTS watch_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dedup_key TEXT NOT NULL UNIQUE,
  target_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  id_or_url TEXT NOT NULL,
  title TEXT,
  source TEXT,
  industry_tags TEXT,
  region TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  video_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  like_count INTEGER,
  publish_time TEXT NOT NULL,
  region TEXT,
  source_target_id TEXT NOT NULL,
  inserted_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_target_id) REFERENCES watch_targets(id)
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  comment_id TEXT,
  target_user_id TEXT,
  assign_account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  executor_mode TEXT NOT NULL,
  result_code TEXT,
  error_message TEXT,
  dedup_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  executed_at TEXT,
  FOREIGN KEY (comment_id) REFERENCES comments(id)
);

-- 话术模板表
CREATE TABLE IF NOT EXISTS reply_templates (
  id TEXT PRIMARY KEY,
  template_name TEXT NOT NULL,
  channel TEXT NOT NULL,
  text TEXT NOT NULL,
  variables TEXT,
  category TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  task_id TEXT,
  account_id TEXT,
  operator TEXT NOT NULL,
  payload_hash TEXT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 日报表
CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  follow_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_watch_targets_platform ON watch_targets(platform);
CREATE INDEX IF NOT EXISTS idx_watch_targets_type ON watch_targets(target_type);
CREATE INDEX IF NOT EXISTS idx_comments_platform ON comments(platform);
CREATE INDEX IF NOT EXISTS idx_comments_source_target ON comments(source_target_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_account ON tasks(assign_account_id);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON reply_templates(channel);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_task ON audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON daily_reports(date);
"#;

pub fn get_connection(app: &AppHandle) -> rusqlite::Result<Connection> {
    // Reuse contact storage DB to keep a single database file
    let conn = contact_db::DatabaseRepo::init_db()?;
    contact_db::DatabaseRepo::init_db_schema(&conn)?; // ensure base tables too
    // ensure our tables
    conn.execute_batch(CREATE_TABLES_SQL)?;
    Ok(conn)
}

// ==================== 候选池操作函数 ====================

pub fn upsert_watch_target(conn: &Connection, payload: &WatchTargetPayload) -> rusqlite::Result<()> {
    let sql = r#"
INSERT INTO watch_targets (dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, notes, created_at, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'), datetime('now'))
ON CONFLICT(dedup_key) DO UPDATE SET
  target_type=excluded.target_type,
  platform=excluded.platform,
  id_or_url=excluded.id_or_url,
  title=excluded.title,
  source=excluded.source,
  industry_tags=excluded.industry_tags,
  region=excluded.region,
  notes=excluded.notes,
  updated_at=datetime('now');
"#;
    conn.execute(
        sql,
        params![
            payload.dedup_key,
            payload.target_type,
            payload.platform,
            payload.id_or_url,
            payload.title,
            payload.source,
            payload.industry_tags,
            payload.region,
            payload.notes,
        ],
    )?;
    Ok(())
}

pub fn bulk_upsert_watch_targets(conn: &Connection, payloads: &[WatchTargetPayload]) -> rusqlite::Result<usize> {
    let tx = conn.transaction()?;
    let mut stmt = tx.prepare(
        r#"INSERT INTO watch_targets (dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, notes, created_at, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'), datetime('now'))
ON CONFLICT(dedup_key) DO UPDATE SET
  target_type=excluded.target_type,
  platform=excluded.platform,
  id_or_url=excluded.id_or_url,
  title=excluded.title,
  source=excluded.source,
  industry_tags=excluded.industry_tags,
  region=excluded.region,
  notes=excluded.notes,
  updated_at=datetime('now');"#,
    )?;
    for p in payloads {
        stmt.execute(params![
            p.dedup_key,
            p.target_type,
            p.platform,
            p.id_or_url,
            p.title,
            p.source,
            p.industry_tags,
            p.region,
            p.notes,
        ])?;
    }
    stmt.finalize()?;
    tx.commit()?;
    Ok(payloads.len())
}

pub fn get_watch_target_by_dedup_key(conn: &Connection, dedup_key: &str) -> rusqlite::Result<Option<WatchTargetRow>> {
    let sql = r#"SELECT id, dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, notes, created_at, updated_at
FROM watch_targets WHERE dedup_key = ?1 LIMIT 1"#;
    conn.query_row(sql, params![dedup_key], |row| {
        Ok(WatchTargetRow {
            id: row.get(0)?,
            dedup_key: row.get(1)?,
            target_type: row.get(2)?,
            platform: row.get(3)?,
            id_or_url: row.get(4)?,
            title: row.get(5)?,
            source: row.get(6)?,
            industry_tags: row.get(7)?,
            region: row.get(8)?,
            notes: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    }).optional()
}

pub fn list_watch_targets(conn: &Connection, query: &ListWatchTargetsQuery) -> rusqlite::Result<Vec<WatchTargetRow>> {
    let mut sql = String::from("SELECT id, dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, notes, created_at, updated_at FROM watch_targets WHERE 1=1");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    if let Some(platform) = &query.platform { sql.push_str(" AND platform = ?"); params.push(Box::new(platform.clone())); }
    if let Some(target_type) = &query.target_type { sql.push_str(" AND target_type = ?"); params.push(Box::new(target_type.clone())); }
    sql.push_str(" ORDER BY id DESC");
    if let Some(limit) = query.limit { sql.push_str(" LIMIT "); sql.push_str(&limit.to_string()); }
    if let Some(offset) = query.offset { sql.push_str(" OFFSET "); sql.push_str(&offset.to_string()); }

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())), |row| {
        Ok(WatchTargetRow {
            id: row.get(0)?,
            dedup_key: row.get(1)?,
            target_type: row.get(2)?,
            platform: row.get(3)?,
            id_or_url: row.get(4)?,
            title: row.get(5)?,
            source: row.get(6)?,
            industry_tags: row.get(7)?,
            region: row.get(8)?,
            notes: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;
    let mut out = Vec::new();
    for r in rows { out.push(r?); }
    Ok(out)
}

// ==================== 评论操作函数 ====================

pub fn insert_comment(conn: &Connection, comment: &CommentPayload) -> rusqlite::Result<String> {
    let id = format!("cmt_{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_lowercase());
    let sql = r#"
INSERT INTO comments (id, platform, video_id, author_id, content, like_count, publish_time, region, source_target_id, inserted_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))
"#;
    conn.execute(sql, params![
        id,
        comment.platform,
        comment.video_id,
        comment.author_id,
        comment.content,
        comment.like_count,
        comment.publish_time,
        comment.region,
        comment.source_target_id,
    ])?;
    Ok(id)
}

pub fn list_comments(conn: &Connection, query: &ListCommentsQuery) -> rusqlite::Result<Vec<CommentRow>> {
    let mut sql = String::from("SELECT id, platform, video_id, author_id, content, like_count, publish_time, region, source_target_id, inserted_at FROM comments WHERE 1=1");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    
    if let Some(platform) = &query.platform { sql.push_str(" AND platform = ?"); params.push(Box::new(platform.clone())); }
    if let Some(source_target_id) = &query.source_target_id { sql.push_str(" AND source_target_id = ?"); params.push(Box::new(source_target_id.clone())); }
    if let Some(region) = &query.region { sql.push_str(" AND region = ?"); params.push(Box::new(region.clone())); }
    
    sql.push_str(" ORDER BY inserted_at DESC");
    if let Some(limit) = query.limit { sql.push_str(" LIMIT "); sql.push_str(&limit.to_string()); }
    if let Some(offset) = query.offset { sql.push_str(" OFFSET "); sql.push_str(&offset.to_string()); }

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())), |row| {
        Ok(CommentRow {
            id: row.get(0)?,
            platform: row.get(1)?,
            video_id: row.get(2)?,
            author_id: row.get(3)?,
            content: row.get(4)?,
            like_count: row.get(5)?,
            publish_time: row.get(6)?,
            region: row.get(7)?,
            source_target_id: row.get(8)?,
            inserted_at: row.get(9)?,
        })
    })?;
    let mut out = Vec::new();
    for r in rows { out.push(r?); }
    Ok(out)
}

// ==================== 任务操作函数 ====================

pub fn insert_task(conn: &Connection, task: &TaskPayload) -> rusqlite::Result<String> {
    let id = format!("tsk_{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_lowercase());
    let sql = r#"
INSERT INTO tasks (id, task_type, comment_id, target_user_id, assign_account_id, status, executor_mode, dedup_key, created_at)
VALUES (?1, ?2, ?3, ?4, ?5, 'NEW', ?6, ?7, datetime('now'))
"#;
    conn.execute(sql, params![
        id,
        task.task_type,
        task.comment_id,
        task.target_user_id,
        task.assign_account_id,
        task.executor_mode,
        task.dedup_key,
    ])?;
    Ok(id)
}

pub fn update_task_status(conn: &Connection, task_id: &str, status: &str, result_code: Option<&str>, error_message: Option<&str>) -> rusqlite::Result<()> {
    let sql = r#"
UPDATE tasks SET status = ?2, result_code = ?3, error_message = ?4, executed_at = datetime('now')
WHERE id = ?1
"#;
    conn.execute(sql, params![task_id, status, result_code, error_message])?;
    Ok(())
}

pub fn list_tasks(conn: &Connection, query: &ListTasksQuery) -> rusqlite::Result<Vec<TaskRow>> {
    let mut sql = String::from("SELECT id, task_type, comment_id, target_user_id, assign_account_id, status, executor_mode, result_code, error_message, dedup_key, created_at, executed_at FROM tasks WHERE 1=1");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    
    if let Some(status) = &query.status { sql.push_str(" AND status = ?"); params.push(Box::new(status.clone())); }
    if let Some(task_type) = &query.task_type { sql.push_str(" AND task_type = ?"); params.push(Box::new(task_type.clone())); }
    if let Some(assign_account_id) = &query.assign_account_id { sql.push_str(" AND assign_account_id = ?"); params.push(Box::new(assign_account_id.clone())); }
    
    sql.push_str(" ORDER BY created_at DESC");
    if let Some(limit) = query.limit { sql.push_str(" LIMIT "); sql.push_str(&limit.to_string()); }
    if let Some(offset) = query.offset { sql.push_str(" OFFSET "); sql.push_str(&offset.to_string()); }

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())), |row| {
        Ok(TaskRow {
            id: row.get(0)?,
            task_type: row.get(1)?,
            comment_id: row.get(2)?,
            target_user_id: row.get(3)?,
            assign_account_id: row.get(4)?,
            status: row.get(5)?,
            executor_mode: row.get(6)?,
            result_code: row.get(7)?,
            error_message: row.get(8)?,
            dedup_key: row.get(9)?,
            created_at: row.get(10)?,
            executed_at: row.get(11)?,
        })
    })?;
    let mut out = Vec::new();
    for r in rows { out.push(r?); }
    Ok(out)
}

// ==================== 审计日志操作函数 ====================

pub fn insert_audit_log(conn: &Connection, log: &AuditLogPayload) -> rusqlite::Result<String> {
    let id = format!("aud_{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_lowercase());
    let sql = r#"
INSERT INTO audit_logs (id, action, task_id, account_id, operator, payload_hash, ts)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
"#;
    conn.execute(sql, params![
        id,
        log.action,
        log.task_id,
        log.account_id,
        log.operator,
        log.payload_hash,
    ])?;
    Ok(id)
}
