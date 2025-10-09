use rusqlite::{params, Connection, OptionalExtension};
use tauri::AppHandle;
use crate::services::contact_storage::repositories::database_repo as contact_db;

use super::models::{WatchTargetPayload, WatchTargetRow, ListWatchTargetsQuery};

const CREATE_TABLE_SQL: &str = r#"
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
CREATE INDEX IF NOT EXISTS idx_watch_targets_platform ON watch_targets(platform);
CREATE INDEX IF NOT EXISTS idx_watch_targets_type ON watch_targets(target_type);
"#;

pub fn get_connection(app: &AppHandle) -> rusqlite::Result<Connection> {
    // Reuse contact storage DB to keep a single database file
    let conn = contact_db::DatabaseRepo::init_db()?;
    contact_db::DatabaseRepo::init_db_schema(&conn)?; // ensure base tables too
    // ensure our table
    conn.execute_batch(CREATE_TABLE_SQL)?;
    Ok(conn)
}

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
