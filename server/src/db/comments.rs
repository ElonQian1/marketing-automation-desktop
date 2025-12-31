// server/src/db/comments.rs
// module: lead-server | layer: infrastructure | role: 评论 CRUD
// summary: 评论的增删改查

use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool, Row};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LeadComment {
    pub id: String,
    pub device_id: String,
    pub platform: String,
    pub video_url: Option<String>,
    pub author: String,
    pub content: String,
    pub ts: Option<i64>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewComment {
    pub id: String,
    pub platform: String,
    pub video_url: Option<String>,
    pub author: String,
    pub content: String,
    pub ts: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentQuery {
    pub device_id: Option<String>,
    pub platform: Option<String>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

/// 批量插入评论（去重）
pub async fn batch_upsert(
    pool: &PgPool,
    device_id: &str,
    comments: &[NewComment],
) -> Result<usize> {
    let mut count = 0;
    
    for comment in comments {
        let result = sqlx::query(
            r#"
            INSERT INTO lead_comments (id, device_id, platform, video_url, author, content, ts)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
            "#
        )
        .bind(&comment.id)
        .bind(device_id)
        .bind(&comment.platform)
        .bind(&comment.video_url)
        .bind(&comment.author)
        .bind(&comment.content)
        .bind(comment.ts)
        .execute(pool)
        .await?;
        
        if result.rows_affected() > 0 {
            count += 1;
        }
    }
    
    Ok(count)
}

/// 分页查询评论
pub async fn list(pool: &PgPool, query: &CommentQuery) -> Result<Vec<LeadComment>> {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(20).min(100);
    let offset = (page - 1) * page_size;

    let comments = sqlx::query_as::<_, LeadComment>(
        r#"
        SELECT id, device_id, platform, video_url, author, content, ts, created_at, updated_at
        FROM lead_comments
        WHERE ($1::text IS NULL OR device_id = $1)
          AND ($2::text IS NULL OR platform = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#
    )
    .bind(&query.device_id)
    .bind(&query.platform)
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok(comments)
}

/// 统计评论数量
pub async fn count(pool: &PgPool, device_id: Option<&str>) -> Result<i64> {
    let row = sqlx::query(
        r#"
        SELECT COUNT(*) as count
        FROM lead_comments
        WHERE ($1::text IS NULL OR device_id = $1)
        "#
    )
    .bind(device_id)
    .fetch_one(pool)
    .await?;

    Ok(row.get::<i64, _>("count"))
}

/// 按平台统计
pub async fn count_by_platform(pool: &PgPool) -> Result<Vec<(String, i64)>> {
    let rows = sqlx::query(
        r#"
        SELECT platform, COUNT(*) as count
        FROM lead_comments
        GROUP BY platform
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(|r| (r.get("platform"), r.get("count"))).collect())
}

/// 按设备统计
pub async fn count_by_device(pool: &PgPool) -> Result<Vec<(String, i64)>> {
    let rows = sqlx::query(
        r#"
        SELECT device_id, COUNT(*) as count
        FROM lead_comments
        GROUP BY device_id
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(|r| (r.get("device_id"), r.get("count"))).collect())
}
