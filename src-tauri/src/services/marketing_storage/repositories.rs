use rusqlite::{params, Connection, OptionalExtension, Row};
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

-- 去重索引（带TTL）
CREATE TABLE IF NOT EXISTS dedup_index (
  key TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expire_at TEXT NOT NULL,
  by_account TEXT,
  PRIMARY KEY (key, scope)
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
    let conn = contact_db::DatabaseRepository::init_db()?;
    contact_db::DatabaseRepository::init_db_schema(&conn)?; // ensure base tables too
    // ensure our tables
    conn.execute_batch(CREATE_TABLES_SQL)?;
    // best-effort schema migrations for tasks table (new columns if missing)
    apply_task_schema_migrations(&conn)?;
    Ok(conn)
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> rusqlite::Result<bool> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info(\"{}\")", table))?;
    let mut rows = stmt.query([])?;
    while let Some(row) = rows.next()? {
        let name: String = row.get(1)?; // 1 = name
        if name == column { return Ok(true); }
    }
    Ok(false)
}

fn apply_task_schema_migrations(conn: &Connection) -> rusqlite::Result<()> {
    // priority INTEGER DEFAULT 2
    if !column_exists(conn, "tasks", "priority")? {
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 2", []);
    }
    // attempts INTEGER DEFAULT 0
    if !column_exists(conn, "tasks", "attempts")? {
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0", []);
    }
    // deadline_at TEXT NULL
    if !column_exists(conn, "tasks", "deadline_at")? {
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN deadline_at TEXT", []);
    }
    // lock_owner TEXT NULL
    if !column_exists(conn, "tasks", "lock_owner")? {
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN lock_owner TEXT", []);
    }
    // lease_until TEXT NULL
    if !column_exists(conn, "tasks", "lease_until")? {
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN lease_until TEXT", []);
    }
    Ok(())
}

fn map_task_row(row: &Row) -> rusqlite::Result<TaskRow> {
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
        priority: row.get(12)?,
        attempts: row.get(13)?,
        deadline_at: row.get(14)?,
        lock_owner: row.get(15)?,
        lease_until: row.get(16)?,
    })
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

pub fn bulk_upsert_watch_targets(conn: &mut Connection, payloads: &[WatchTargetPayload]) -> rusqlite::Result<usize> {
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
    let priority = task.priority.unwrap_or(2);
    let sql = r#"
INSERT INTO tasks (id, task_type, comment_id, target_user_id, assign_account_id, status, executor_mode, priority, dedup_key, deadline_at, created_at)
VALUES (?1, ?2, ?3, ?4, ?5, 'NEW', ?6, ?7, ?8, ?9, datetime('now'))
"#;
    conn.execute(sql, params![
        id,
        task.task_type,
        task.comment_id,
        task.target_user_id,
        task.assign_account_id,
        task.executor_mode,
        priority,
        task.dedup_key,
        task.deadline_at,
    ])?;
    Ok(id)
}

pub fn update_task_status(conn: &Connection, task_id: &str, status: &str, result_code: Option<&str>, error_message: Option<&str>) -> rusqlite::Result<()> {
    let executed_expr = if matches!(status, "DONE" | "FAILED") {
        "datetime('now')"
    } else {
        "NULL"
    };
    let sql = format!(
        concat!(
            "UPDATE tasks SET status = ?, result_code = ?, error_message = ?, executed_at = ",
            "{} , lock_owner = CASE WHEN ? = 'EXECUTING' THEN lock_owner ELSE NULL END,",
            " lease_until = CASE WHEN ? = 'EXECUTING' THEN lease_until ELSE NULL END WHERE id = ?"
        ),
        executed_expr
    );
    conn.execute(&sql, params![status, result_code, error_message, status, status, task_id])?;
    Ok(())
}

pub fn list_tasks(conn: &Connection, query: &ListTasksQuery) -> rusqlite::Result<Vec<TaskRow>> {
    let mut sql = String::from("SELECT id, task_type, comment_id, target_user_id, assign_account_id, status, executor_mode, result_code, error_message, dedup_key, created_at, executed_at, priority, attempts, deadline_at, lock_owner, lease_until FROM tasks WHERE 1=1");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    
    if let Some(status) = &query.status { sql.push_str(" AND status = ?"); params.push(Box::new(status.clone())); }
    if let Some(task_type) = &query.task_type { sql.push_str(" AND task_type = ?"); params.push(Box::new(task_type.clone())); }
    if let Some(assign_account_id) = &query.assign_account_id { sql.push_str(" AND assign_account_id = ?"); params.push(Box::new(assign_account_id.clone())); }
    
    sql.push_str(" ORDER BY created_at DESC");
    if let Some(limit) = query.limit { sql.push_str(" LIMIT "); sql.push_str(&limit.to_string()); }
    if let Some(offset) = query.offset { sql.push_str(" OFFSET "); sql.push_str(&offset.to_string()); }

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())), |row| map_task_row(row))?;
    let mut out = Vec::new();
    for r in rows { out.push(r?); }
    Ok(out)
}

pub fn lock_next_ready_task(conn: &mut Connection, account_id: &str, lease_seconds: i64) -> rusqlite::Result<Option<TaskRow>> {
    let lease = if lease_seconds <= 0 { 120 } else { lease_seconds };
    let mut tx = conn.transaction()?;
    let select_sql = r#"
SELECT id FROM tasks
WHERE status = 'READY'
  AND (lease_until IS NULL OR lease_until <= datetime('now'))
  AND (deadline_at IS NULL OR deadline_at > datetime('now'))
ORDER BY priority ASC, created_at ASC
LIMIT 1
"#;
    let task_id: Option<String> = tx
        .query_row(select_sql, [], |row| row.get(0))
        .optional()?;

    if let Some(id) = task_id {
        tx.execute(
            "UPDATE tasks SET status = 'EXECUTING', lock_owner = ?, lease_until = datetime('now', printf('+%d seconds', ?)), attempts = attempts + 1 WHERE id = ?",
            params![account_id, lease, id],
        )?;
        let task = {
            let mut stmt = tx.prepare("SELECT id, task_type, comment_id, target_user_id, assign_account_id, status, executor_mode, result_code, error_message, dedup_key, created_at, executed_at, priority, attempts, deadline_at, lock_owner, lease_until FROM tasks WHERE id = ?")?;
            stmt.query_row(params![id.clone()], |row| map_task_row(row))?
        };
        tx.commit()?;
        Ok(Some(task))
    } else {
        tx.commit()?;
        Ok(None)
    }
}

pub fn mark_task_result(
    conn: &mut Connection,
    task_id: &str,
    result_code: Option<&str>,
    error_message: Option<&str>,
) -> rusqlite::Result<()> {
    let mut tx = conn.transaction()?;
    let (current_status, attempts): (String, i32) = tx.query_row(
        "SELECT status, attempts FROM tasks WHERE id = ?",
        params![task_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    let rc = result_code.unwrap_or("OK");
    let mut new_status = match rc {
        "RATE_LIMITED" | "TEMP_ERROR" => "READY",
        "OK" | "DUPLICATED" => "DONE",
        "PERMISSION_DENIED" | "NOT_FOUND" | "BLOCKED" | "PERM_ERROR" => "FAILED",
        _ => "FAILED",
    };

    if rc == "RATE_LIMITED" && current_status == "NEW" {
        new_status = "READY";
    }

    let lease_delay = match rc {
        "RATE_LIMITED" => Some(300),
        "TEMP_ERROR" => {
            let delay = match attempts {
                a if a <= 1 => 30,
                2 => 60,
                3 => 120,
                _ => 180,
            };
            Some(delay)
        }
        _ => None,
    };

    let executed_expr = if matches!(new_status, "DONE" | "FAILED") {
        "datetime('now')"
    } else {
        "NULL"
    };

    let lease_expr = if let Some(delay) = lease_delay {
        format!("datetime('now', '+{} seconds')", delay)
    } else {
        "NULL".to_string()
    };

    let default_error = match rc {
        "DUPLICATED" => Some("任务已查重跳过".to_string()),
        "RATE_LIMITED" => Some("命中频控策略，延迟重试".to_string()),
        "TEMP_ERROR" => Some("临时错误，稍后重试".to_string()),
        _ => None,
    };

    let mut final_error = error_message.map(|s| s.to_string());
    if final_error.is_none() {
        final_error = default_error;
    }

    let final_result_code = rc.to_string();
    let final_result_code_param: Option<&str> = Some(final_result_code.as_str());

    let sql = format!(
        "UPDATE tasks SET status = ?, result_code = ?, error_message = ?, executed_at = {} , lock_owner = NULL, lease_until = {} WHERE id = ?",
        executed_expr,
        lease_expr
    );

    tx.execute(
        &sql,
        params![
            new_status,
            final_result_code_param,
            final_error.as_deref(),
            task_id
        ],
    )?;

    tx.commit()?;
    Ok(())
}

// ==================== 去重索引（带TTL） ====================

/// Try to reserve a dedup key with TTL.
/// Returns true if reserved (no active duplicate), false if an active entry already exists.
pub fn check_and_reserve_dedup(
    conn: &Connection,
    key: &str,
    scope: &str,
    ttl_days: i64,
    by_account: Option<&str>,
) -> rusqlite::Result<bool> {
    // 1) check existing non-expired
    let exists_sql = r#"
SELECT 1 FROM dedup_index
WHERE key = ?1 AND scope = ?2 AND expire_at > datetime('now')
LIMIT 1
"#;
    let mut stmt = conn.prepare(exists_sql)?;
    let exists = stmt.exists(params![key, scope])?;
    if exists {
        return Ok(false);
    }

    // 2) insert / replace with new expiration
    let insert_sql = r#"
INSERT INTO dedup_index (key, scope, created_at, expire_at, by_account)
VALUES (?1, ?2, datetime('now'), datetime('now', printf('+%d days', ?3)), ?4)
ON CONFLICT(key, scope) DO UPDATE SET
  created_at = excluded.created_at,
  expire_at = excluded.expire_at,
  by_account = COALESCE(excluded.by_account, dedup_index.by_account)
"#;
    conn.execute(insert_sql, params![key, scope, ttl_days, by_account])?;
    Ok(true)
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
