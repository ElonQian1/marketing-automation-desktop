// src-tauri/src/modules/cloud_sync/mod.rs
// module: cloud_sync | layer: infrastructure | role: 云同步模块入口
// summary: 设备ID生成、配置同步、评论上传

mod device_id;
mod sync_service;

use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager};

pub use device_id::get_device_id;
pub use sync_service::*;

/// 获取本机设备ID
#[tauri::command]
async fn get_machine_id() -> Result<String, String> {
    device_id::get_device_id().map_err(|e| e.to_string())
}

/// 获取云同步服务器地址
#[tauri::command]
fn get_cloud_server_url() -> String {
    std::env::var("LEAD_SERVER_URL")
        .unwrap_or_else(|_| "http://119.91.19.232:8080".to_string())
}

/// 初始化插件
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("cloud_sync")
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            get_cloud_server_url,
        ])
        .build()
}
