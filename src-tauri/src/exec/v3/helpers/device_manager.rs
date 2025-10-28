// src-tauri/src/exec/v3/helpers/device_manager.rs
// module: exec | layer: v3/helpers | role: 设备和UI管理
// summary: 管理设备连接、UI快照获取、屏幕哈希计算等设备相关操作

use crate::services::quick_ui_automation::adb_dump_ui_xml;
use super::intelligent_analysis::DeviceInfo;

/// 获取设备的UI XML快照
/// 
/// 这是真实设备操作的核心函数，获取当前屏幕的UI结构
pub async fn get_ui_snapshot(device_id: &str) -> Result<String, String> {
    tracing::info!("📱 [设备管理] 开始获取设备 {} 的UI快照", device_id);
    
    let ui_xml = adb_dump_ui_xml(device_id.to_string()).await
        .map_err(|e| format!("获取UI快照失败: {}", e))?;
    
    tracing::info!("✅ [设备管理] UI快照获取成功，长度: {} 字符", ui_xml.len());
    Ok(ui_xml)
}

/// 计算UI XML的屏幕哈希值
/// 
/// 用于检测屏幕是否发生变化，支持缓存复用
pub fn calculate_screen_hash(ui_xml: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    ui_xml.hash(&mut hasher);
    let hash = format!("{:x}", hasher.finish());
    
    tracing::debug!("🔐 [设备管理] 计算屏幕哈希: {} (前8位)", &hash[..8]);
    hash
}

/// 获取设备的完整快照（包括XML和哈希）
/// 
/// Returns: (ui_xml, screen_hash)
pub async fn get_snapshot_with_hash(device_id: &str) -> Result<(String, String), String> {
    let ui_xml = get_ui_snapshot(device_id).await?;
    let screen_hash = calculate_screen_hash(&ui_xml);
    
    tracing::info!("✅ [设备管理] 快照获取完成，hash: {}", &screen_hash[..8]);
    Ok((ui_xml, screen_hash))
}

/// 检查设备连接状态（简化版）
/// 
/// ⚠️ 当前实现是简化版本，假设设备已连接
/// TODO: 实现真实的设备连接检查
pub async fn check_device_connection(device_id: &str) -> Result<bool, String> {
    tracing::info!("🔧 [设备管理] 跳过设备连接检查（TODO: 实现真实的设备检查）");
    tracing::info!("✅ [设备管理] 假设设备 {} 连接正常", device_id);
    Ok(true)
}

/// 获取设备基础信息
/// 
/// 包括：设备ID、屏幕尺寸、当前应用、屏幕方向等
pub async fn get_device_basic_info(
    device_id: &str, 
    _app_handle: &tauri::AppHandle
) -> Result<DeviceInfo, String> {
    tracing::info!("📱 [设备管理] 获取设备 {} 的基础信息", device_id);
    
    // 获取屏幕尺寸（简化版本）
    // TODO: 从真实设备获取实际屏幕尺寸
    let screen_size = (1080_i32, 2340_i32);
    
    // 获取当前应用（简化版本）
    // TODO: 从真实设备获取当前前台应用
    let current_app = Some("com.unknown.app".to_string());
    
    let device_info = DeviceInfo {
        device_id: device_id.to_string(),
        screen_size: Some((screen_size.0 as u32, screen_size.1 as u32)),
        current_app,
        orientation: Some("portrait".to_string()),
    };
    
    tracing::info!("✅ [设备管理] 设备信息获取完成: {:?}x{:?}, orientation={:?}", 
        device_info.screen_size, device_info.orientation, device_info.current_app);
    
    Ok(device_info)
}

/// 验证设备是否准备就绪
/// 
/// 检查设备连接状态，确保可以执行后续操作
pub async fn ensure_device_ready(device_id: &str) -> Result<(), String> {
    tracing::info!("🔍 [设备管理] 验证设备 {} 是否准备就绪", device_id);
    
    // 检查设备连接
    let is_connected = check_device_connection(device_id).await?;
    
    if !is_connected {
        return Err(format!("设备 {} 未连接或不可用", device_id));
    }
    
    // 尝试获取UI快照验证设备可用性
    let _ = get_ui_snapshot(device_id).await?;
    
    tracing::info!("✅ [设备管理] 设备 {} 已准备就绪", device_id);
    Ok(())
}

/// 比较两个屏幕哈希是否匹配
/// 
/// 用于判断屏幕是否发生变化，决定是否需要重新评分
pub fn is_screen_changed(current_hash: &str, cached_hash: Option<&str>) -> bool {
    match cached_hash {
        Some(cached) => {
            let changed = current_hash != cached;
            if changed {
                tracing::info!("🔄 [设备管理] 屏幕已变化: {} -> {}", 
                    &cached[..8.min(cached.len())], 
                    &current_hash[..8.min(current_hash.len())]);
            } else {
                tracing::info!("✅ [设备管理] 屏幕未变化，hash匹配: {}", &current_hash[..8]);
            }
            changed
        }
        None => {
            tracing::info!("🆕 [设备管理] 首次获取屏幕快照: {}", &current_hash[..8]);
            true // 没有缓存时认为屏幕已变化
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_screen_hash() {
        let xml1 = "<node text='test1'/>";
        let xml2 = "<node text='test2'/>";
        let xml3 = "<node text='test1'/>"; // 与xml1相同
        
        let hash1 = calculate_screen_hash(xml1);
        let hash2 = calculate_screen_hash(xml2);
        let hash3 = calculate_screen_hash(xml3);
        
        assert_eq!(hash1, hash3); // 相同内容应该产生相同哈希
        assert_ne!(hash1, hash2); // 不同内容应该产生不同哈希
    }

    #[test]
    fn test_is_screen_changed() {
        let hash1 = "abc123def456";
        let hash2 = "xyz789uvw012";
        
        // 没有缓存时应该返回true
        assert!(is_screen_changed(hash1, None));
        
        // 哈希不同时应该返回true
        assert!(is_screen_changed(hash1, Some(hash2)));
        
        // 哈希相同时应该返回false
        assert!(!is_screen_changed(hash1, Some(hash1)));
    }
}
