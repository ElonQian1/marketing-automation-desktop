// src-tauri/src/modules/universal_ui/mod.rs
// module: universal_ui | layer: api | role: Universal UI分析系统Tauri插件
// summary: Universal UI页面分析的Tauri插件封装，提供页面采集、元素提取等功能

use std::collections::HashMap;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
use tracing::info;

// 🎯 重导出 services 层的命令函数和类型
// 命令实现保留在 services 层，插件仅做封装
use crate::services::universal_ui_page_analyzer::{
    UIElement,
    UniversalPageCaptureResult,
};

// ==================== 插件命令定义 ====================
// 注意：Tauri 插件命令需要在插件模块内定义，不能直接重导出

/// 分析Universal UI页面 - 采集设备当前页面的XML和截图
#[tauri::command]
async fn analyze_page<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    device_id: String,
) -> Result<UniversalPageCaptureResult, String> {
    info!("🔌 [Plugin:universal_ui] 调用 analyze_page，设备: {}", device_id);
    
    // 委托给 services 层实现
    crate::services::universal_ui_page_analyzer::analyze_universal_ui_page(app_handle, device_id).await
}

/// 提取页面元素 - 从XML内容解析UI元素
#[tauri::command]
async fn extract_elements(
    xml_content: String,
) -> Result<Vec<UIElement>, String> {
    info!("🔌 [Plugin:universal_ui] 调用 extract_elements，XML长度: {}", xml_content.len());
    
    // 委托给 services 层实现
    crate::services::universal_ui_page_analyzer::extract_page_elements(xml_content).await
}

/// 确认事件处理
#[tauri::command]
async fn acknowledge_event(
    _event_id: String,
    _event_type: String,
    _acknowledged_at: Option<i64>,
    _additional_data: Option<serde_json::Value>,
) -> Result<(), String> {
    // Stub implementation
    Ok(())
}

/// 分类UI元素 - 按元素类型分组
#[tauri::command]
async fn classify_elements(
    elements: Vec<UIElement>,
) -> Result<HashMap<String, Vec<UIElement>>, String> {
    info!("🔌 [Plugin:universal_ui] 调用 classify_elements，元素数: {}", elements.len());
    
    // 委托给 services 层实现
    crate::services::universal_ui_page_analyzer::classify_ui_elements(elements).await
}

/// 去重元素 - 移除重复的UI元素
#[tauri::command]
async fn deduplicate(
    elements: Vec<UIElement>,
) -> Result<Vec<UIElement>, String> {
    info!("🔌 [Plugin:universal_ui] 调用 deduplicate，元素数: {}", elements.len());
    
    // 委托给 services 层实现
    crate::services::universal_ui_page_analyzer::deduplicate_elements(elements).await
}

/// 识别页面类型 - 根据XML内容和包名判断页面类型
#[tauri::command]
async fn identify_page(
    xml_content: String,
    app_package: String,
) -> Result<String, String> {
    info!("🔌 [Plugin:universal_ui] 调用 identify_page，包名: {}", app_package);
    
    // 委托给 services 层实现
    crate::services::universal_ui_page_analyzer::identify_page_type(xml_content, app_package).await
}

#[tauri::command]
async fn save_page_analysis(_analysis: serde_json::Value) -> Result<String, String> {
    Ok("stub_id".to_string())
}

#[tauri::command]
async fn get_page_analysis_by_id(_analysis_id: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({}))
}

#[tauri::command]
async fn get_page_analyses_by_device(_device_id: String, _limit: Option<u32>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
async fn get_page_analyses_by_app(_app_package: String, _limit: Option<u32>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
async fn get_page_analyses_by_type(_page_type: String, _limit: Option<u32>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
async fn cleanup_old_page_analyses(_older_than_days: i32) -> Result<usize, String> {
    Ok(0)
}

#[tauri::command]
async fn get_page_analysis_statistics() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "total_count": 0,
        "total_size_bytes": 0,
        "oldest_analysis": null,
        "newest_analysis": null
    }))
}

// ==================== 插件初始化 ====================

/// 导出插件初始化函数
/// 
/// 前端调用格式：
/// - `invoke('plugin:universal_ui|analyze_page', { deviceId: '...' })`
/// - `invoke('plugin:universal_ui|extract_elements', { xmlContent: '...' })`
/// - `invoke('plugin:universal_ui|classify_elements', { elements: [...] })`
/// - `invoke('plugin:universal_ui|deduplicate', { elements: [...] })`
/// - `invoke('plugin:universal_ui|identify_page', { xmlContent: '...', appPackage: '...' })`
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    info!("🔌 初始化 Universal UI 插件");
    
    Builder::new("universal_ui")
        .invoke_handler(tauri::generate_handler![
            analyze_page,
            extract_elements,
            acknowledge_event,
            classify_elements,
            deduplicate,
            identify_page,
            save_page_analysis,
            get_page_analysis_by_id,
            get_page_analyses_by_device,
            get_page_analyses_by_app,
            get_page_analyses_by_type,
            cleanup_old_page_analyses,
            get_page_analysis_statistics
        ])
        .build()
}
