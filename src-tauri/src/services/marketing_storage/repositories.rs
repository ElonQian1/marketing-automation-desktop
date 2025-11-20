use rusqlite::{params, Connection, OptionalExtension, Row};
use tauri::AppHandle;
use uuid::Uuid;
use crate::services::contact_storage::repositories::database_repo as contact_db;

use super::models::{
    WatchTargetPayload, WatchTargetRow, ListWatchTargetsQuery,
    CommentPayload, CommentRow, ListCommentsQuery,
    TaskPayload, TaskRow, ListTasksQuery,
    AuditLogPayload,
    ReplyTemplatePayload, ReplyTemplateRow, ListReplyTemplatesQuery,
};

// ==================== SQL 表创建脚本 ====================

const CREATE_TABLES_SQL: &str = r#"
-- 候选池表（符合文档设计 - Round 2｜候选池字段清单（v1））
CREATE TABLE IF NOT EXISTS watch_targets (
  id TEXT PRIMARY KEY,              -- 内部主键（UUID格式，如 wt_01H...）
  dedup_key TEXT NOT NULL UNIQUE,   -- 去重键（platform + id_or_url）
  target_type TEXT NOT NULL,        -- video | account
  platform TEXT NOT NULL,           -- douyin | oceanengine | public
  id_or_url TEXT NOT NULL,          -- 平台唯一标识或URL
  title TEXT,                       -- 视频标题或账号昵称
  source TEXT NOT NULL,             -- manual | csv | whitelist | ads
  industry_tags TEXT,               -- 行业标签（分号分隔）
  region TEXT,                      -- 地域标签
  last_fetch_at TEXT,               -- 上次拉取评论时间
  notes TEXT,                       -- 备注
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

-- 任务表（符合文档设计）
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,                              -- 内部主键（如 tsk_01H...）
  task_type TEXT NOT NULL,                          -- reply | follow
  comment_id TEXT,                                  -- 关联评论（任务类型=reply时）
  target_user_id TEXT,                              -- 目标用户（任务类型=follow时）
  assign_account_id TEXT NOT NULL,                  -- 执行账号ID
  status TEXT NOT NULL DEFAULT 'NEW',               -- NEW | READY | EXECUTING | DONE | FAILED
  executor_mode TEXT NOT NULL,                      -- api | manual
  result_code TEXT,                                 -- OK | RATE_LIMITED | DUPLICATED 等
  error_message TEXT,                               -- 失败原因
  dedup_key TEXT NOT NULL UNIQUE,                   -- 查重键
  priority INTEGER NOT NULL DEFAULT 2,              -- 优先级（1=高，2=中，3=低）
  attempts INTEGER NOT NULL DEFAULT 0,              -- 重试次数
  deadline_at TEXT,                                 -- 截止时间
  lock_owner TEXT,                                  -- 锁定者（多机协作）
  lease_until TEXT,                                 -- 租约到期时间
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  executed_at TEXT,                                 -- 实际执行时间
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
    // 使用新的统一数据库连接获取方式
    let conn = crate::services::contact_storage::repositories::common::database::get_connection(app)?;
    
    // 确保 marketing_storage 相关的表存在
    conn.execute_batch(CREATE_TABLES_SQL)?;
    
    // 执行 marketing storage 特定的模式迁移
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

pub fn upsert_watch_target(conn: &Connection, payload: &WatchTargetPayload) -> rusqlite::Result<String> {
    let id = format!("wt_{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_lowercase());
    let sql = r#"
INSERT INTO watch_targets (id, dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, notes, created_at, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'), datetime('now'))
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
            id,
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
    Ok(id)
}

pub fn bulk_upsert_watch_targets(conn: &mut Connection, payloads: &[WatchTargetPayload]) -> rusqlite::Result<usize> {
    let tx = conn.transaction()?;
    let mut stmt = tx.prepare(
        r#"INSERT INTO watch_targets (id, dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, notes, created_at, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'), datetime('now'))
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
        let id = format!("wt_{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_lowercase());
        stmt.execute(params![
            id,
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
    let sql = r#"SELECT id, dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, last_fetch_at, notes, created_at, updated_at
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
            last_fetch_at: row.get(9)?,
            notes: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    }).optional()
}

pub fn list_watch_targets(conn: &Connection, query: &ListWatchTargetsQuery) -> rusqlite::Result<Vec<WatchTargetRow>> {
    let mut sql = String::from("SELECT id, dedup_key, target_type, platform, id_or_url, title, source, industry_tags, region, last_fetch_at, notes, created_at, updated_at FROM watch_targets WHERE 1=1");
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
            last_fetch_at: row.get(9)?,
            notes: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })?;
    let mut out = Vec::new();
    for r in rows { out.push(r?); }
    Ok(out)
}

pub fn update_watch_target(
    conn: &Connection,
    id: &str,
    title: Option<&str>,
    industry_tags: Option<&str>,
    region: Option<&str>,
    notes: Option<&str>,
    last_fetch_at: Option<&str>,
) -> rusqlite::Result<()> {
    let mut sql = String::from("UPDATE watch_targets SET updated_at = datetime('now')");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    
    if let Some(t) = title {
        sql.push_str(", title = ?");
        params.push(Box::new(t.to_string()));
    }
    if let Some(it) = industry_tags {
        sql.push_str(", industry_tags = ?");
        params.push(Box::new(it.to_string()));
    }
    if let Some(r) = region {
        sql.push_str(", region = ?");
        params.push(Box::new(r.to_string()));
    }
    if let Some(n) = notes {
        sql.push_str(", notes = ?");
        params.push(Box::new(n.to_string()));
    }
    if let Some(lf) = last_fetch_at {
        sql.push_str(", last_fetch_at = ?");
        params.push(Box::new(lf.to_string()));
    }
    
    sql.push_str(" WHERE id = ?");
    params.push(Box::new(id.to_string()));
    
    conn.execute(&sql, rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())))?;
    Ok(())
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
    let tx = conn.transaction()?;
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
    let tx = conn.transaction()?;
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

/// 查询审计日志
pub fn query_audit_logs(
    conn: &Connection,
    start_time: Option<&str>,
    end_time: Option<&str>,
    action_filter: Option<&str>,
    limit: i64,
    offset: i64,
) -> rusqlite::Result<Vec<serde_json::Value>> {
    let mut sql = "SELECT id, action, task_id, account_id, operator, payload_hash, ts FROM audit_logs WHERE 1=1".to_string();
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(start) = start_time {
        sql.push_str(" AND ts >= ?");
        params.push(rusqlite::types::Value::Text(start.to_string()));
    }

    if let Some(end) = end_time {
        sql.push_str(" AND ts <= ?");
        params.push(rusqlite::types::Value::Text(end.to_string()));
    }

    if let Some(action) = action_filter {
        sql.push_str(" AND action LIKE ?");
        params.push(format!("%{}%", action).into());
    }

    sql.push_str(" ORDER BY ts DESC LIMIT ? OFFSET ?");
    params.push(limit.into());
    params.push(offset.into());

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params), |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "action": row.get::<_, String>(1)?,
            "task_id": row.get::<_, Option<String>>(2)?,
            "account_id": row.get::<_, Option<String>>(3)?,
            "operator": row.get::<_, String>(4)?,
            "payload_hash": row.get::<_, String>(5)?,
            "ts": row.get::<_, String>(6)?
        }))
    })?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row?);
    }

    Ok(results)
}

/// 导出审计日志
pub fn export_audit_logs(
    conn: &Connection,
    start_time: Option<&str>,
    end_time: Option<&str>,
    format: &str,
) -> rusqlite::Result<String> {
    let logs = query_audit_logs(conn, start_time, end_time, None, i64::MAX, 0)?;

    match format.to_lowercase().as_str() {
        "csv" => {
            let mut output = String::new();
            output.push_str("ID,Action,Task ID,Account ID,Operator,Payload Hash,Timestamp\n");
            
            for log in logs {
                output.push_str(&format!(
                    "{},{},{},{},{},{},{}\n",
                    log["id"].as_str().unwrap_or(""),
                    log["action"].as_str().unwrap_or(""),
                    log["task_id"].as_str().unwrap_or(""),
                    log["account_id"].as_str().unwrap_or(""),
                    log["operator"].as_str().unwrap_or(""),
                    log["payload_hash"].as_str().unwrap_or(""),
                    log["ts"].as_str().unwrap_or("")
                ));
            }
            Ok(output)
        }
        "json" => {
            serde_json::to_string_pretty(&logs).map_err(|_e| {
                rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "Failed to serialize JSON"
                )))
            })
        }
        _ => Err(rusqlite::Error::InvalidColumnName(format!("Unsupported export format: {}", format)))
    }
}

/// 清理过期审计日志
pub fn cleanup_expired_audit_logs(
    conn: &Connection,
    retention_days: i64,
) -> rusqlite::Result<i64> {
    let affected_rows = conn.execute(
        "DELETE FROM audit_logs WHERE datetime(ts) < datetime('now', printf('-%d days', ?))",
        [retention_days]
    )?;

    Ok(affected_rows as i64)
}

/// 批量存储审计日志
pub fn batch_store_audit_logs(
    conn: &Connection,
    logs: &[AuditLogPayload],
) -> rusqlite::Result<i64> {
    let mut inserted_count = 0;
    let tx = conn.unchecked_transaction()?;
    
    for log in logs {
        let id = format!("aud_{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_lowercase());
        tx.execute(
            "INSERT INTO audit_logs (id, action, task_id, account_id, operator, payload_hash, ts) VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))",
            params![
                id,
                log.action,
                log.task_id,
                log.account_id,
                log.operator,
                log.payload_hash,
            ]
        )?;
        inserted_count += 1;
    }

    tx.commit()?;
    Ok(inserted_count)
}

// ==================== 回复模板操作函数 ====================

pub fn insert_reply_template(conn: &Connection, payload: &ReplyTemplatePayload) -> rusqlite::Result<String> {
    let id = format!("tpl_{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_lowercase());
    let sql = r#"
INSERT INTO reply_templates (id, template_name, channel, text, variables, category, enabled, created_at, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))
"#;
    conn.execute(sql, params![
        id,
        payload.template_name,
        payload.channel,
        payload.text,
        payload.variables,
        payload.category,
        payload.enabled,
    ])?;
    Ok(id)
}

pub fn list_reply_templates(conn: &Connection, query: &ListReplyTemplatesQuery) -> rusqlite::Result<Vec<ReplyTemplateRow>> {
    let mut sql = String::from("SELECT id, template_name, channel, text, variables, category, enabled, created_at, updated_at FROM reply_templates WHERE 1=1");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    
    if let Some(channel) = &query.channel {
        sql.push_str(" AND channel = ?");
        params.push(Box::new(channel.clone()));
    }
    if let Some(enabled) = query.enabled {
        sql.push_str(" AND enabled = ?");
        params.push(Box::new(enabled));
    }
    
    sql.push_str(" ORDER BY created_at DESC");
    if let Some(limit) = query.limit {
        sql.push_str(" LIMIT ");
        sql.push_str(&limit.to_string());
    }
    if let Some(offset) = query.offset {
        sql.push_str(" OFFSET ");
        sql.push_str(&offset.to_string());
    }

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())), |row| {
        Ok(ReplyTemplateRow {
            id: row.get(0)?,
            template_name: row.get(1)?,
            channel: row.get(2)?,
            text: row.get(3)?,
            variables: row.get(4)?,
            category: row.get(5)?,
            enabled: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

pub fn update_reply_template(
    conn: &Connection,
    id: &str,
    template_name: Option<&str>,
    channel: Option<&str>,
    text: Option<&str>,
    variables: Option<&str>,
    category: Option<&str>,
    enabled: Option<bool>,
) -> rusqlite::Result<()> {
    let mut sql = String::from("UPDATE reply_templates SET updated_at = datetime('now')");
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    
    if let Some(tn) = template_name {
        sql.push_str(", template_name = ?");
        params.push(Box::new(tn.to_string()));
    }
    if let Some(ch) = channel {
        sql.push_str(", channel = ?");
        params.push(Box::new(ch.to_string()));
    }
    if let Some(t) = text {
        sql.push_str(", text = ?");
        params.push(Box::new(t.to_string()));
    }
    if let Some(v) = variables {
        sql.push_str(", variables = ?");
        params.push(Box::new(v.to_string()));
    }
    if let Some(cat) = category {
        sql.push_str(", category = ?");
        params.push(Box::new(cat.to_string()));
    }
    if let Some(en) = enabled {
        sql.push_str(", enabled = ?");
        params.push(Box::new(en));
    }
    
    sql.push_str(" WHERE id = ?");
    params.push(Box::new(id.to_string()));
    
    conn.execute(&sql, rusqlite::params_from_iter(params.iter().map(|b| b.as_ref())))?;
    Ok(())
}

// ==================== 统计查询函数 ====================

pub fn get_precise_acquisition_stats(conn: &Connection) -> rusqlite::Result<serde_json::Value> {
    // 统计候选池数量
    let watch_targets_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM watch_targets",
        [],
        |row| row.get(0)
    )?;
    
    // 统计评论数量
    let comments_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM comments",
        [],
        |row| row.get(0)
    )?;
    
    // 统计任务数量（按状态分组）
    let mut tasks_stats = std::collections::HashMap::new();
    let mut stmt = conn.prepare("SELECT status, COUNT(*) FROM tasks GROUP BY status")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    
    let mut total_tasks = 0i64;
    for row in rows {
        let (status, count) = row?;
        tasks_stats.insert(status, count);
        total_tasks += count;
    }
    
    // 统计回复模板数量
    let reply_templates_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM reply_templates WHERE enabled = 1",
        [],
        |row| row.get(0)
    )?;
    
    // 构建JSON响应
    Ok(serde_json::json!({
        "watch_targets_count": watch_targets_count,
        "comments_count": comments_count,
        "tasks_count": {
            "total": total_tasks,
            "by_status": tasks_stats,
        },
        "reply_templates_count": reply_templates_count,
    }))
}

