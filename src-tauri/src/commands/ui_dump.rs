// src-tauri/src/commands/ui_dump.rs
// module: commands | layer: application | role: UI Dump命令
// summary: 提供获取设备UI Dump的Tauri命令接口

use crate::services::ui_reader_service;

/// 获取设备UI dump XML
#[tauri::command]
pub async fn get_ui_dump(device_id: String) -> Result<String, String> {
    ui_reader_service::get_ui_dump(&device_id).await
}
