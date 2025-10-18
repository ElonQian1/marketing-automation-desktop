// src-tauri/src/commands/health_check.rs
// module: commands | layer: commands | role: 后端健康检查命令
// summary: 提供系统健康检查和心跳检测接口

use serde::{Deserialize, Serialize};
use crate::services::adb_service::core::AdbService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingResponse {
    pub success: bool,
    pub timestamp: u64,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemHealthCheck {
    pub adb_connected: bool,
    pub device_available: bool,
    pub xml_cache_ready: bool,
    pub analysis_engine_ready: bool,
}

/// 后端健康检查 - 轻量级 ping 命令
#[tauri::command]
pub async fn backend_ping() -> Result<PingResponse, String> {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Failed to get timestamp: {}", e))?
        .as_secs();

    Ok(PingResponse {
        success: true,
        timestamp,
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

/// 分析系统完整健康检查
#[tauri::command]
pub async fn analysis_health_check() -> Result<SystemHealthCheck, String> {
    tracing::info!("🔍 [HealthCheck] 开始系统健康检查");
    
    // 检查ADB连接
    let adb_connected = check_adb_connection().await;
    tracing::debug!("ADB连接状态: {}", adb_connected);
    
    // 检查设备可用性
    let device_available = if adb_connected {
        check_device_availability().await
    } else {
        false
    };
    tracing::debug!("设备可用性: {}", device_available);
    
    // 检查XML缓存状态（简化检查）
    let xml_cache_ready = true; // 暂时默认为就绪
    
    // 检查分析引擎状态（简化检查）
    let analysis_engine_ready = true; // 暂时默认为就绪
    
    let health_check = SystemHealthCheck {
        adb_connected,
        device_available,
        xml_cache_ready,
        analysis_engine_ready,
    };
    
    tracing::info!("✅ [HealthCheck] 健康检查完成: {:?}", health_check);
    Ok(health_check)
}

/// 检查ADB连接状态
async fn check_adb_connection() -> bool {
    // 简化检查：尝试创建ADB服务实例
    let _adb = AdbService::new();
    tracing::debug!("ADB服务初始化成功");
    true // 如果能创建实例则认为连接正常
}

/// 检查设备可用性
async fn check_device_availability() -> bool {
    // 简化检查：后续可扩展为具体的设备检测逻辑
    tracing::debug!("设备可用性检查 - 暂时返回true");
    true // 暂时默认设备可用
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_backend_ping() {
        let result = backend_ping().await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.success);
        assert!(response.timestamp > 0);
        assert!(!response.version.is_empty());
    }

    #[tokio::test]
    async fn test_analysis_health_check() {
        let result = analysis_health_check().await;
        assert!(result.is_ok());
        let health = result.unwrap();
        // 基本结构检查，不要求具体值
        println!("Health check result: {:?}", health);
    }
}
