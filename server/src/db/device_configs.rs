// server/src/db/device_configs.rs
// module: lead-server | layer: infrastructure | role: 设备配置 CRUD
// summary: 设备配置的增删改查

use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DeviceConfig {
    pub device_id: String,
    pub device_type: String,
    pub device_name: Option<String>,
    pub ai_api_key: Option<String>,
    pub ai_provider: Option<String>,
    #[sqlx(json)]
    pub config_json: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDeviceConfig {
    pub device_type: Option<String>,
    pub device_name: Option<String>,
    pub ai_api_key: Option<String>,
    pub ai_provider: Option<String>,
    pub config_json: Option<serde_json::Value>,
}

/// 获取设备配置
pub async fn get_by_id(pool: &PgPool, device_id: &str) -> Result<Option<DeviceConfig>> {
    let config = sqlx::query_as::<_, DeviceConfig>(
        r#"
        SELECT device_id, device_type, device_name, 
               ai_api_key, ai_provider, config_json,
               created_at, updated_at
        FROM device_configs
        WHERE device_id = $1
        "#
    )
    .bind(device_id)
    .fetch_optional(pool)
    .await?;

    Ok(config)
}

/// 创建或更新设备配置（增量合并）
pub async fn upsert(
    pool: &PgPool,
    device_id: &str,
    update: &UpdateDeviceConfig,
) -> Result<DeviceConfig> {
    let default_json = serde_json::json!({});
    let config_json = update.config_json.as_ref().unwrap_or(&default_json);
    
    let config = sqlx::query_as::<_, DeviceConfig>(
        r#"
        INSERT INTO device_configs (device_id, device_type, device_name, ai_api_key, ai_provider, config_json)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (device_id) DO UPDATE SET
            device_type = COALESCE($2, device_configs.device_type),
            device_name = COALESCE($3, device_configs.device_name),
            ai_api_key = COALESCE($4, device_configs.ai_api_key),
            ai_provider = COALESCE($5, device_configs.ai_provider),
            config_json = device_configs.config_json || COALESCE($6, '{}'::jsonb),
            updated_at = NOW()
        RETURNING device_id, device_type, device_name, ai_api_key, ai_provider, config_json, created_at, updated_at
        "#
    )
    .bind(device_id)
    .bind(update.device_type.as_deref().unwrap_or("unknown"))
    .bind(&update.device_name)
    .bind(&update.ai_api_key)
    .bind(&update.ai_provider)
    .bind(config_json)
    .fetch_one(pool)
    .await?;

    Ok(config)
}

/// 获取所有设备列表
pub async fn list_all(pool: &PgPool) -> Result<Vec<DeviceConfig>> {
    let configs = sqlx::query_as::<_, DeviceConfig>(
        r#"
        SELECT device_id, device_type, device_name, ai_api_key, ai_provider, config_json, created_at, updated_at
        FROM device_configs
        ORDER BY updated_at DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(configs)
}
