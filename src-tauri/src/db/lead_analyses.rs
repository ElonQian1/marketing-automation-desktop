// src-tauri/src/db/lead_analyses.rs
// module: lead-hunt | layer: infrastructure | role: 分析结果表CRUD操作
// summary: 管理AI分析结果的增删改查

use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeadAnalysis {
    pub id: Option<i64>,
    pub comment_id: String,
    pub intent: String,
    pub confidence: f64,
    pub entities_json: Option<String>,
    pub reply_suggestion: Option<String>,
    pub tags_json: Option<String>,
    pub created_at: i64,
}

/// 插入分析结果
pub fn insert(conn: &Connection, analysis: &LeadAnalysis) -> Result<i64> {
    conn.execute(
        "INSERT INTO lead_analyses (comment_id, intent, confidence, entities_json, reply_suggestion, tags_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            analysis.comment_id,
            analysis.intent,
            analysis.confidence,
            analysis.entities_json,
            analysis.reply_suggestion,
            analysis.tags_json,
            analysis.created_at,
        ],
    )?;
    
    Ok(conn.last_insert_rowid())
}

/// 根据评论ID查询分析结果
pub fn find_by_comment_id(conn: &Connection, comment_id: &str) -> Result<Option<LeadAnalysis>> {
    let mut stmt = conn.prepare(
        "SELECT id, comment_id, intent, confidence, entities_json, reply_suggestion, tags_json, created_at
         FROM lead_analyses WHERE comment_id = ?1 ORDER BY created_at DESC LIMIT 1"
    )?;
    
    let mut rows = stmt.query(params![comment_id])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(LeadAnalysis {
            id: Some(row.get(0)?),
            comment_id: row.get(1)?,
            intent: row.get(2)?,
            confidence: row.get(3)?,
            entities_json: row.get(4)?,
            reply_suggestion: row.get(5)?,
            tags_json: row.get(6)?,
            created_at: row.get(7)?,
        }))
    } else {
        Ok(None)
    }
}

/// 批量插入分析结果
pub fn insert_batch(conn: &Connection, analyses: &[LeadAnalysis]) -> Result<usize> {
    let mut count = 0;
    for analysis in analyses {
        insert(conn, analysis)?;
        count += 1;
    }
    Ok(count)
}

/// 按意图统计
pub fn count_by_intent(conn: &Connection) -> Result<Vec<(String, i64)>> {
    let mut stmt = conn.prepare(
        "SELECT intent, COUNT(*) as count FROM lead_analyses GROUP BY intent ORDER BY count DESC"
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

/// 查询所有分析结果
pub fn list_all(conn: &Connection) -> Result<Vec<LeadAnalysis>> {
    let mut stmt = conn.prepare(
        "SELECT id, comment_id, intent, confidence, entities_json, reply_suggestion, tags_json, created_at
         FROM lead_analyses ORDER BY created_at DESC"
    )?;
    
    let rows = stmt.query_map([], |row| {
        Ok(LeadAnalysis {
            id: Some(row.get(0)?),
            comment_id: row.get(1)?,
            intent: row.get(2)?,
            confidence: row.get(3)?,
            entities_json: row.get(4)?,
            reply_suggestion: row.get(5)?,
            tags_json: row.get(6)?,
            created_at: row.get(7)?,
        })
    })?;
    
    let mut analyses = Vec::new();
    for result in rows {
        analyses.push(result?);
    }
    
    Ok(analyses)
}
