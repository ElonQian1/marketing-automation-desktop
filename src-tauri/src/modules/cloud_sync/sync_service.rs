// src-tauri/src/modules/cloud_sync/sync_service.rs
// module: cloud_sync | layer: infrastructure | role: 云同步服务
// summary: 配置同步、评论上传到云端服务器

use serde::{Deserialize, Serialize};

/// 设备配置（与服务端结构对应）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceConfig {
    pub device_id: String,
    pub device_type: String,
    pub device_name: Option<String>,
    pub ai_api_key: Option<String>,
    pub ai_provider: Option<String>,
    pub config_json: serde_json::Value,
}

/// 评论数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentData {
    pub id: String,
    pub platform: String,
    pub video_url: Option<String>,
    pub author: String,
    pub content: String,
    pub ts: Option<i64>,
}

/// 批量上传请求
#[derive(Debug, Serialize)]
pub struct BatchUploadRequest {
    pub device_id: String,
    pub comments: Vec<CommentData>,
}

// 注意：实际的 HTTP 调用将在前端 TypeScript 中实现
// 这里只定义数据结构供跨层使用
