// server/src/api/ai_config.rs
// module: lead-server | layer: api | role: AI 配置接口
// summary: 获取服务器兜底 AI Key

use axum::{http::StatusCode, Json};
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FallbackAiConfigResponse {
    pub success: bool,
    pub ai_api_key: Option<String>,
    pub ai_provider: Option<String>,
}

/// GET /api/ai-config/fallback
/// 获取服务器兜底 AI Key（当本地没有配置时使用）
pub async fn get_fallback() -> Result<Json<FallbackAiConfigResponse>, StatusCode> {
    // 从环境变量读取
    let ai_key = std::env::var("FALLBACK_AI_KEY").ok();
    let ai_provider = std::env::var("FALLBACK_AI_PROVIDER").ok();

    Ok(Json(FallbackAiConfigResponse {
        success: ai_key.is_some(),
        ai_api_key: ai_key,
        ai_provider,
    }))
}
