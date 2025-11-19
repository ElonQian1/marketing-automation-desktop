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
 * 通过resource-id点击元素
 */
#[command]
pub async fn adb_click_element(
    device_id: String,
    resource_id: String,
) -> Result<bool, String> {
    info!("👆 点击元素: device={}, resource_id={}", device_id, resource_id);

    // 获取设备会话
    let session = get_device_session(&device_id).await
        .map_err(|e| format!("无法获取设备会话: {}", e))?;

    // 获取UI XML
    let xml_content = session.dump_ui().await
        .map_err(|e| format!("获取UI内容失败: {}", e))?;

    // 解析并点击元素
    if let Some((x, y)) = extract_element_coordinates(&xml_content, &resource_id) {
        info!("📍 找到元素坐标: ({}, {})", x, y);
        
        // 执行点击
        session.tap(x, y).await
            .map_err(|e| format!("坐标点击失败: {}", e))?;
        
        info!("✅ 极速坐标点击成功");
        Ok(true)
    } else {
        Err(format!("未找到resource-id为 {} 的可点击元素", resource_id))
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

/**
 * 从 XML 中提取指定 resource-id 元素的中心坐标
 */
fn extract_element_coordinates(xml_content: &str, resource_id: &str) -> Option<(i32, i32)> {
    use regex::Regex;

    // 构建正则表达式匹配包含指定resource-id且clickable="true"的节点
    let pattern = format!(
        r#"<node[^>]*resource-id="{}"[^>]*clickable="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*>"#,
        regex::escape(resource_id)
    );

    if let Ok(re) = Regex::new(&pattern) {
        if let Some(captures) = re.captures(xml_content) {
            if let (Some(left), Some(top), Some(right), Some(bottom)) = (
                captures.get(1)?.as_str().parse::<i32>().ok(),
                captures.get(2)?.as_str().parse::<i32>().ok(),
                captures.get(3)?.as_str().parse::<i32>().ok(),
                captures.get(4)?.as_str().parse::<i32>().ok(),
            ) {
                // 计算中心点
                let center_x = (left + right) / 2;
                let center_y = (top + bottom) / 2;
                return Some((center_x, center_y));
            }
        }
    }

    None
}
