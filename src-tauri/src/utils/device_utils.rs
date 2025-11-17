// src-tauri/src/utils/device_utils.rs
// module: utils | layer: infra | role: 设备连接验证工具
// summary: 提供设备连接状态验证功能

use std::process::Command;

/// 验证设备连接状态
/// 
/// 通过执行简单的 ADB shell 命令来检测设备是否在线并可通信
/// 
/// # 参数
/// * `device_id` - 设备序列号
/// 
/// # 返回
/// * `Ok(true)` - 设备连接正常
/// * `Ok(false)` - 设备无响应或命令执行失败
/// * `Err(String)` - ADB命令执行错误
#[tauri::command]
pub async fn validate_device_connection(device_id: String) -> Result<bool, String> {
    let adb_path = crate::utils::adb_utils::get_adb_path();
    
    let output = Command::new(&adb_path)
        .args(&["-s", &device_id, "shell", "echo", "test"])
        .output()
        .map_err(|e| format!("设备连接验证失败: {}", e))?;

    Ok(output.status.success())
}
