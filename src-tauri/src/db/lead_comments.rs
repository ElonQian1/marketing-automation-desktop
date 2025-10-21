// src-tauri/src/db/lead_comments.rs
// module: lead-hunt | layer: infrastructure | role: 评论表CRUD操作
// summary: 管理评论的增删改查

use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeadComment {
    pub id: String,
    pub platform: String,
    pub video_url: Option<String>,
    pub author: String,
    pub content: String,
    pub ts: Option<i64>,
    pub created_at: i64,
}

/// 插入单条评论
pub fn insert(conn: &Connection, comment: &LeadComment) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO lead_comments (id, platform, video_url, author, content, ts, created_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            comment.id,
            comment.platform,
            comment.video_url,
            comment.author,
            comment.content,
            comment.ts,
            comment.created_at,
        ],
    )?;
    Ok(())
}

/// 批量插入评论
pub fn insert_batch(conn: &Connection, comments: &[LeadComment]) -> Result<usize> {
    let mut count = 0;
    for comment in comments {
        insert(conn, comment)?;
        count += 1;
    }
    Ok(count)
}

/// 根据ID查询评论
pub fn find_by_id(conn: &Connection, id: &str) -> Result<Option<LeadComment>> {
    let mut stmt = conn.prepare(
        "SELECT id, platform, video_url, author, content, ts, created_at 
         FROM lead_comments WHERE id = ?1"
    )?;
    
    let mut rows = stmt.query(params![id])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(LeadComment {
            id: row.get(0)?,
            platform: row.get(1)?,
            video_url: row.get(2)?,
            author: row.get(3)?,
            content: row.get(4)?,
            ts: row.get(5)?,
            created_at: row.get(6)?,
        }))
    } else {
        Ok(None)
    }
}

/// 查询所有评论
pub fn list_all(conn: &Connection) -> Result<Vec<LeadComment>> {
    let mut stmt = conn.prepare(
        "SELECT id, platform, video_url, author, content, ts, created_at 
         FROM lead_comments ORDER BY created_at DESC"
    )?;
    
    let rows = stmt.query_map([], |row| {
        Ok(LeadComment {
            id: row.get(0)?,
            platform: row.get(1)?,
            video_url: row.get(2)?,
            author: row.get(3)?,
            content: row.get(4)?,
            ts: row.get(5)?,
            created_at: row.get(6)?,
        })
    })?;
    
    let mut comments = Vec::new();
    for comment_result in rows {
        comments.push(comment_result?);
    }
    
    Ok(comments)
}

/// 按平台筛选
pub fn list_by_platform(conn: &Connection, platform: &str) -> Result<Vec<LeadComment>> {
    let mut stmt = conn.prepare(
        "SELECT id, platform, video_url, author, content, ts, created_at 
         FROM lead_comments WHERE platform = ?1 ORDER BY created_at DESC"
    )?;
    
    let rows = stmt.query_map(params![platform], |row| {
        Ok(LeadComment {
            id: row.get(0)?,
            platform: row.get(1)?,
            video_url: row.get(2)?,
            author: row.get(3)?,
            content: row.get(4)?,
            ts: row.get(5)?,
            created_at: row.get(6)?,
        })
    })?;
    
    let mut comments = Vec::new();
    for comment_result in rows {
        comments.push(comment_result?);
    }
    
    Ok(comments)
}

/// 删除评论
pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM lead_comments WHERE id = ?1", params![id])?;
    Ok(())
}

/// 统计评论数量
pub fn count(conn: &Connection) -> Result<i64> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM lead_comments", [], |row| row.get(0))?;
    Ok(count)
}
