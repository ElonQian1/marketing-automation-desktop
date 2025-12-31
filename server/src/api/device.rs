// server/src/api/device.rs
// module: lead-server | layer: api | role: 设备配置接口
// summary: 设备配置的 GET/PUT 接口

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::db::{self, device_configs::UpdateDeviceConfig, DbPool};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceConfigResponse {
    pub success: bool,
    pub data: Option<db::device_configs::DeviceConfig>,
    pub message: Option<String>,
}

/// GET /api/device/:device_id/config
/// 获取设备配置（用于重装恢复）
pub async fn get_config(
    State(pool): State<DbPool>,
    Path(device_id): Path<String>,
) -> Result<Json<DeviceConfigResponse>, StatusCode> {
    match db::device_configs::get_by_id(&pool, &device_id).await {
        Ok(config) => Ok(Json(DeviceConfigResponse {
            success: true,
            data: config,
            message: None,
        })),
        Err(e) => {
            tracing::error!("Failed to get device config: {}", e);
            Ok(Json(DeviceConfigResponse {
                success: false,
                data: None,
                message: Some(e.to_string()),
            }))
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConfigRequest {
    pub device_type: Option<String>,
    pub device_name: Option<String>,
    pub ai_api_key: Option<String>,
    pub ai_provider: Option<String>,
    pub config_json: Option<serde_json::Value>,
}

/// PUT /api/device/:device_id/config
/// 更新设备配置（增量合并）
pub async fn update_config(
    State(pool): State<DbPool>,
    Path(device_id): Path<String>,
    Json(req): Json<UpdateConfigRequest>,
) -> Result<Json<DeviceConfigResponse>, StatusCode> {
    let update = UpdateDeviceConfig {
        device_type: req.device_type,
        device_name: req.device_name,
        ai_api_key: req.ai_api_key,
        ai_provider: req.ai_provider,
        config_json: req.config_json,
    };

    match db::device_configs::upsert(&pool, &device_id, &update).await {
        Ok(config) => {
            tracing::info!("Updated config for device: {}", device_id);
            Ok(Json(DeviceConfigResponse {
                success: true,
                data: Some(config),
                message: None,
            }))
        }
        Err(e) => {
            tracing::error!("Failed to update device config: {}", e);
            Ok(Json(DeviceConfigResponse {
                success: false,
                data: None,
                message: Some(e.to_string()),
            }))
        }
    }
}
