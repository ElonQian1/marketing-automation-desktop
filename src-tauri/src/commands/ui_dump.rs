// src-tauri/src/commands/ui_dump.rs
// module: commands | layer: application | role: UI Dump命令
// summary: 提供获取设备UI Dump的Tauri命令接口

use tauri::command;
use serde::{Deserialize, Serialize};
use crate::services::adb::AdbService;
use crate::services::universal_ui_page_analyzer::{UniversalUIPageAnalyzer, UIElement};
use chrono;

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceUIState {
    pub device_id: String,
    pub xml_content: String,
    pub elements: Vec<UIElement>,
    pub timestamp: String,
    pub page_type: String,
    pub suggested_action: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum UIPageType {
    Desktop,                    // 桌面
    FileManagerEmpty,           // 文件管理器-空目录
    FileManagerBrowsing,        // 文件管理器-浏览中
    FileManagerWithVcf,         // 文件管理器-找到VCF文件
    ContactsApp,                // 联系人应用
    PermissionDialog,           // 权限对话框
    Unknown(String),            // 未知页面
}

#[derive(Debug, Serialize, Deserialize)]
pub enum NextAction {
    OpenFileManager,        // 打开文件管理器
    NavigateToDownloads,    // 导航到下载目录
    CheckDownloadFolder,    // 检查下载文件夹
    LookForVcfFile,        // 查找VCF文件
    ClickVcfFile,          // 点击VCF文件
    ConfirmImport,         // 确认导入
    GrantPermission,       // 授予权限
    AnalyzeCurrentState,   // 分析当前状态
}

/// 实时读取设备UI界面状态
#[command]
pub async fn read_device_ui_state(device_id: String) -> Result<DeviceUIState, String> {
    println!("🔍 开始读取设备 {} 的UI状态", device_id);
    
    let adb_service = AdbService::new();
    
    // 1. 使用adb获取当前UI dump
    let ui_xml = adb_service.dump_ui_hierarchy(&device_id).await
        .map_err(|e| format!("获取UI层次结构失败: {}", e))?;
    
    // 2. 使用 UniversalUIPageAnalyzer 解析XML获取关键元素
    let analyzer = UniversalUIPageAnalyzer::new();
    // 使用 unfiltered 解析以获取尽可能多的元素
    let elements = analyzer.parse_xml_elements_unfiltered(&ui_xml)
        .map_err(|e| format!("XML解析失败: {}", e))?;
    
    // 3. 分析页面类型 (简化版，后续可扩展)
    let page_type = "Unknown".to_string();
    
    // 4. 建议下一步操作 (简化版)
    let suggested_action = "AnalyzeCurrentState".to_string();
    
    // 5. 获取当前时间戳
    let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    let ui_state = DeviceUIState {
        device_id: device_id.clone(),
        xml_content: ui_xml,
        elements,
        timestamp,
        page_type,
        suggested_action,
    };
    
    println!("✅ UI状态读取完成");
    
    Ok(ui_state)
}

/// 获取设备UI dump XML (保留原有接口)
#[command]
pub async fn get_ui_dump(device_id: String) -> Result<String, String> {
    let adb_service = AdbService::new();
    adb_service.dump_ui_hierarchy(&device_id).await
        .map_err(|e| format!("获取UI层次结构失败: {}", e))
}

