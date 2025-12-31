// server/src/api/comments.rs
// module: lead-server | layer: api | role: 评论接口
// summary: 评论的批量上传和查询接口

use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::db::{self, comments::{CommentQuery, NewComment}, DbPool};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchUploadRequest {
    pub device_id: String,
    pub comments: Vec<NewComment>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchUploadResponse {
    pub success: bool,
    pub inserted_count: usize,
    pub message: Option<String>,
}

/// POST /api/comments/batch
/// 批量上传评论（自动去重）
pub async fn batch_upload(
    State(pool): State<DbPool>,
    Json(req): Json<BatchUploadRequest>,
) -> Result<Json<BatchUploadResponse>, StatusCode> {
    let comment_count = req.comments.len();
    
    match db::comments::batch_upsert(&pool, &req.device_id, &req.comments).await {
        Ok(inserted) => {
            tracing::info!(
                "Batch uploaded {} comments from device {}, {} new",
                comment_count, req.device_id, inserted
            );
            Ok(Json(BatchUploadResponse {
                success: true,
                inserted_count: inserted,
                message: None,
            }))
        }
        Err(e) => {
            tracing::error!("Failed to batch upload comments: {}", e);
            Ok(Json(BatchUploadResponse {
                success: false,
                inserted_count: 0,
                message: Some(e.to_string()),
            }))
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListCommentsQuery {
    pub device_id: Option<String>,
    pub platform: Option<String>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListCommentsResponse {
    pub success: bool,
    pub data: Vec<db::comments::LeadComment>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

/// GET /api/comments
/// 分页查询评论
pub async fn list_comments(
    State(pool): State<DbPool>,
    Query(query): Query<ListCommentsQuery>,
) -> Result<Json<ListCommentsResponse>, StatusCode> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20);

    let db_query = CommentQuery {
        device_id: query.device_id.clone(),
        platform: query.platform,
        page: Some(page),
        page_size: Some(page_size),
    };

    let comments = db::comments::list(&pool, &db_query).await.unwrap_or_default();
    let total = db::comments::count(&pool, query.device_id.as_deref())
        .await
        .unwrap_or(0);

    Ok(Json(ListCommentsResponse {
        success: true,
        data: comments,
        total,
        page,
        page_size,
    }))
}
