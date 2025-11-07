// src-tauri/src/services/adb_service/initialization.rs
// module: adb | layer: services | role: ADB 核心初始化服务
// summary: 负责 ADB server 启动和设备跟踪器初始化，确保正确的启动顺序

use tracing::{info, warn};
use std::time::Duration;
use std::thread;

use super::core::AdbService;
use crate::services::adb_device_tracker::initialize_device_tracker;
use crate::utils::adb_utils;

/// ADB 核心系统初始化
/// 
/// 执行顺序：
/// 1. 启动 ADB server (端口 5037)
/// 2. 等待 server 就绪
/// 3. 初始化设备跟踪器
/// 
/// 这是 ADB 功能的核心初始化流程，必须在应用启动时调用
pub fn initialize_adb_system() -> Result<(), String> {
    info!("🚀 开始初始化 ADB 核心系统");
    
    // 1. 获取 ADB 路径
    let adb_path = adb_utils::get_adb_path();
    info!("📍 ADB 路径: {}", adb_path);
    
    // 2. 启动 ADB server
    let adb_service = AdbService::new();
    match adb_service.start_server(&adb_path) {
        Ok(output) => {
            info!("✅ ADB server 启动成功: {}", output.trim());
        }
        Err(e) => {
            warn!("⚠️ ADB server 启动失败: {}，将尝试继续（可能已在运行）", e);
        }
    }
    
    // 3. 短暂延迟，确保 server 完全启动并监听端口 5037
    info!("⏳ 等待 ADB server 就绪...");
    thread::sleep(Duration::from_millis(800));
    
    // 4. 初始化设备跟踪器
    initialize_device_tracker()?;
    
    info!("✅ ADB 核心系统初始化完成");
    Ok(())
}

/// 检查 ADB server 是否运行
pub fn is_adb_server_running() -> bool {
    use std::net::TcpStream;
    
    match TcpStream::connect_timeout(
        &"127.0.0.1:5037".parse().unwrap(),
        Duration::from_millis(500)
    ) {
        Ok(_) => true,
        Err(_) => false,
    }
}

/// 确保 ADB server 运行（带重试）
pub fn ensure_adb_server_running(max_retries: u32) -> Result<(), String> {
    let adb_path = adb_utils::get_adb_path();
    let adb_service = AdbService::new();
    
    for attempt in 1..=max_retries {
        if is_adb_server_running() {
            info!("✅ ADB server 已在运行");
            return Ok(());
        }
        
        info!("🔄 尝试启动 ADB server (第 {}/{} 次)", attempt, max_retries);
        
        if let Err(e) = adb_service.start_server(&adb_path) {
            warn!("⚠️ 启动失败: {}", e);
            if attempt < max_retries {
                thread::sleep(Duration::from_millis(1000));
                continue;
            }
            return Err(format!("无法启动 ADB server，已重试 {} 次", max_retries));
        }
        
        thread::sleep(Duration::from_millis(800));
    }
    
    if is_adb_server_running() {
        Ok(())
    } else {
        Err("ADB server 启动超时".to_string())
    }
}
