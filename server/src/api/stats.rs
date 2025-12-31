// server/src/api/stats.rs
// module: lead-server | layer: api | role: 统计接口
// summary: 数据统计和 CSV 导出

use axum::{
    extract::State,
    http::{header, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::Serialize;

use crate::db::{self, comments::CommentQuery, DbPool};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsResponse {
    pub success: bool,
    pub total_comments: i64,
    pub by_platform: Vec<PlatformStats>,
    pub by_device: Vec<DeviceStats>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformStats {
    pub platform: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStats {
    pub device_id: String,
    pub count: i64,
}

/// GET /api/stats
/// 获取统计数据
pub async fn get_stats(State(pool): State<DbPool>) -> Result<Json<StatsResponse>, StatusCode> {
    let total = db::comments::count(&pool, None).await.unwrap_or(0);
    
    let by_platform = db::comments::count_by_platform(&pool)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|(platform, count)| PlatformStats { platform, count })
        .collect();
    
    let by_device = db::comments::count_by_device(&pool)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|(device_id, count)| DeviceStats { device_id, count })
        .collect();

    Ok(Json(StatsResponse {
        success: true,
        total_comments: total,
        by_platform,
        by_device,
    }))
}

/// GET /api/export/csv
/// 导出评论为 CSV
pub async fn export_csv(State(pool): State<DbPool>) -> impl IntoResponse {
    let query = CommentQuery {
        device_id: None,
        platform: None,
        page: Some(1),
        page_size: Some(10000), // 最多导出 10000 条
    };

    let comments = db::comments::list(&pool, &query).await.unwrap_or_default();

    // 生成 CSV
    let mut csv = String::new();
    csv.push_str("id,device_id,platform,author,content,video_url,created_at\n");
    
    for c in comments {
        csv.push_str(&format!(
            "{},{},{},\"{}\",\"{}\",{},{}\n",
            c.id,
            c.device_id,
            c.platform,
            c.author.replace('"', "\"\""),
            c.content.replace('"', "\"\"").replace('\n', " "),
            c.video_url.unwrap_or_default(),
            c.created_at.format("%Y-%m-%d %H:%M:%S"),
        ));
    }

    (
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "text/csv; charset=utf-8"),
            (
                header::CONTENT_DISPOSITION,
                "attachment; filename=\"comments.csv\"",
            ),
        ],
        csv,
    )
}
