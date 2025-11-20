use crate::services::adb::get_device_session;
use serde::{Deserialize, Serialize};
use tauri::command;
use tracing::{info, error};

/**
 * 快速UI操作结果
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct QuickUiResult {
    pub success: bool,
    pub message: String,
    pub data: Option<String>,
    pub elapsed_ms: u64,
}

/**
 * 快速抓取页面XML内容
 * 
 * 专为对话框检测优化的快速UI dump命令
 */
#[command]
pub async fn adb_dump_ui_xml(device_id: String) -> Result<String, String> {
    let start_time = std::time::Instant::now();
    info!("🔍 快速抓取UI XML: device={}", device_id);

    // 获取设备会话
    let session = get_device_session(&device_id).await
        .map_err(|e| format!("无法获取设备会话: {}", e))?;

    // 执行UI dump
    match session.dump_ui().await {
        Ok(output) => {
            let elapsed = start_time.elapsed().as_millis();
            
            // 验证XML格式
            if output.trim().is_empty() || !output.trim_start().starts_with("<?xml") {
                error!("❌ 获取的内容不是有效的XML格式");
                return Err("获取的页面内容无效，可能是应用保护机制导致".to_string());
            }
            
            info!("✅ UI XML抓取完成: {}ms", elapsed);
            Ok(output)
        }
        Err(e) => {
            error!("❌ UI XML抓取失败: {}", e);
            Err(format!("UI抓取失败: {}", e))
        }
    }
}

/**
 * 通过坐标点击
 */
#[command]
pub async fn adb_tap_coordinate(
    device_id: String,
    x: i32,
    y: i32,
) -> Result<bool, String> {
    info!("🎯 坐标点击: device={}, x={}, y={}", device_id, x, y);

    // 获取设备会话
    let session = get_device_session(&device_id).await
        .map_err(|e| format!("无法获取设备会话: {}", e))?;

    // 执行点击
    session.tap(x, y).await
        .map_err(|e| format!("坐标点击失败: {}", e))?;
    
    info!("✅ 坐标点击完成");
    Ok(true)
}

