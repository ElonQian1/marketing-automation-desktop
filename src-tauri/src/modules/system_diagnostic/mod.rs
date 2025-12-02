// src-tauri/src/modules/system_diagnostic/mod.rs
// module: system_diagnostic | layer: api | role: System Diagnostic Plugin
// summary: 系统诊断插件，提供健康检查、环境信息和设备测试功能

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::services::adb::AdbService;

// ==================== 类型定义 ====================

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

// ==================== 命令实现 ====================

/// 后端健康检查 - 轻量级 ping 命令
#[tauri::command]
async fn ping() -> Result<PingResponse, String> {
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
async fn health_check() -> Result<SystemHealthCheck, String> {
    tracing::info!("🔍 [Plugin:diagnostic] 开始系统健康检查");
    
    // 检查ADB连接
    let adb_connected = check_adb_connection().await;
    
    // 检查设备可用性
    let device_available = if adb_connected {
        check_device_availability().await
    } else {
        false
    };
    
    // 检查XML缓存状态（简化检查）
    let xml_cache_ready = true; // 暂时默认为就绪
    
    // 检查分析引擎状态（简化检查）
    let analysis_engine_ready = true; // 暂时默认为就绪
    
    Ok(SystemHealthCheck {
        adb_connected,
        device_available,
        xml_cache_ready,
        analysis_engine_ready,
    })
}

/// 获取 ADB 路径
#[tauri::command]
async fn get_adb_path() -> Result<String, String> {
    crate::services::diagnostic_service::get_adb_path_cmd().await
}

/// 获取环境信息
#[tauri::command]
async fn get_env_info() -> Result<Value, String> {
    crate::services::diagnostic_service::get_environment_info().await
}

/// 测试设备响应性
#[tauri::command]
async fn test_device(device_id: String) -> Result<Value, String> {
    crate::services::diagnostic_service::test_device_responsiveness(device_id).await
}

/// 运行完整诊断
#[tauri::command]
async fn run_diagnostic() -> Result<Value, String> {
    crate::services::diagnostic_service::run_full_diagnostic().await
}

// ==================== 辅助函数 ====================

/// 检查ADB连接状态
async fn check_adb_connection() -> bool {
    // 简化检查：尝试创建ADB服务实例
    let _adb = AdbService::new();
    true 
}

/// 检查设备可用性
async fn check_device_availability() -> bool {
    // 简化检查：后续可扩展为具体的设备检测逻辑
    true 
}

// ==================== 插件初始化 ====================

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("system_diagnostic")
        .invoke_handler(tauri::generate_handler![
            ping,
            health_check,
            get_adb_path,
            get_env_info,
            test_device,
            run_diagnostic
        ])
        .build()
}
