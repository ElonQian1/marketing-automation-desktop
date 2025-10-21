// src-tauri/src/db/replay_plans.rs
// module: lead-hunt | layer: infrastructure | role: 回放计划表CRUD操作
// summary: 管理回放计划的增删改查和状态更新

use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplayPlan {
    pub id: String,
    pub comment_id: String,
    pub platform: String,
    pub video_url: String,
    pub author: String,
    pub comment: String,
    pub suggested_reply: Option<String>,
    pub status: String,
    pub attempts: i32,
    pub error_message: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 插入回放计划
pub fn insert(conn: &Connection, plan: &ReplayPlan) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO replay_plans 
         (id, comment_id, platform, video_url, author, comment, suggested_reply, status, attempts, error_message, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            plan.id,
            plan.comment_id,
            plan.platform,
            plan.video_url,
            plan.author,
            plan.comment,
            plan.suggested_reply,
            plan.status,
            plan.attempts,
            plan.error_message,
            plan.created_at,
            plan.updated_at,
        ],
    )?;
    Ok(())
}

/// 根据ID查询计划
pub fn find_by_id(conn: &Connection, id: &str) -> Result<Option<ReplayPlan>> {
    let mut stmt = conn.prepare(
        "SELECT id, comment_id, platform, video_url, author, comment, suggested_reply, status, attempts, error_message, created_at, updated_at
         FROM replay_plans WHERE id = ?1"
    )?;
    
    let mut rows = stmt.query(params![id])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(ReplayPlan {
            id: row.get(0)?,
            comment_id: row.get(1)?,
            platform: row.get(2)?,
            video_url: row.get(3)?,
            author: row.get(4)?,
            comment: row.get(5)?,
            suggested_reply: row.get(6)?,
            status: row.get(7)?,
            attempts: row.get(8)?,
            error_message: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        }))
    } else {
        Ok(None)
    }
}

/// 更新计划状态
pub fn update_status(
    conn: &Connection,
    id: &str,
    status: &str,
    error_message: Option<&str>,
) -> Result<()> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    conn.execute(
        "UPDATE replay_plans SET status = ?1, error_message = ?2, updated_at = ?3, attempts = attempts + 1 WHERE id = ?4",
        params![status, error_message, now, id],
    )?;
    Ok(())
}

/// 查询待执行的计划
pub fn list_pending(conn: &Connection, limit: Option<i32>) -> Result<Vec<ReplayPlan>> {
    let sql = if let Some(lim) = limit {
        format!(
            "SELECT id, comment_id, platform, video_url, author, comment, suggested_reply, status, attempts, error_message, created_at, updated_at
             FROM replay_plans WHERE status = 'pending' ORDER BY created_at ASC LIMIT {}",
            lim
        )
    } else {
        "SELECT id, comment_id, platform, video_url, author, comment, suggested_reply, status, attempts, error_message, created_at, updated_at
         FROM replay_plans WHERE status = 'pending' ORDER BY created_at ASC".to_string()
    };
    
    let mut stmt = conn.prepare(&sql)?;
    
    let rows = stmt.query_map([], |row| {
        Ok(ReplayPlan {
            id: row.get(0)?,
            comment_id: row.get(1)?,
            platform: row.get(2)?,
            video_url: row.get(3)?,
            author: row.get(4)?,
            comment: row.get(5)?,
            suggested_reply: row.get(6)?,
            status: row.get(7)?,
            attempts: row.get(8)?,
            error_message: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;
    
    let mut plans = Vec::new();
    for result in rows {
        plans.push(result?);
    }
    
    Ok(plans)
}

/// 查询所有计划
pub fn list_all(conn: &Connection) -> Result<Vec<ReplayPlan>> {
    let mut stmt = conn.prepare(
        "SELECT id, comment_id, platform, video_url, author, comment, suggested_reply, status, attempts, error_message, created_at, updated_at
         FROM replay_plans ORDER BY created_at DESC"
    )?;
    
    let rows = stmt.query_map([], |row| {
        Ok(ReplayPlan {
            id: row.get(0)?,
            comment_id: row.get(1)?,
            platform: row.get(2)?,
            video_url: row.get(3)?,
            author: row.get(4)?,
            comment: row.get(5)?,
            suggested_reply: row.get(6)?,
            status: row.get(7)?,
            attempts: row.get(8)?,
            error_message: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;
    
    let mut plans = Vec::new();
    for result in rows {
        plans.push(result?);
    }
    
    Ok(plans)
}

/// 按状态统计
pub fn count_by_status(conn: &Connection) -> Result<Vec<(String, i64)>> {
    let mut stmt = conn.prepare(
        "SELECT status, COUNT(*) as count FROM replay_plans GROUP BY status"
    )?;
    
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    
    let mut stats = Vec::new();
    for result in rows {
        stats.push(result?);
    }
    
    Ok(stats)
}
