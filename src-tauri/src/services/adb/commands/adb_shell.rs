// src/services/adb/commands/adb_shell.rs
// module: adb | layer: commands | role: Shell命令执行
// summary: 安全的ADB shell命令执行，提供设备验证和会话支持

use tracing::{info, error};
use crate::services::adb::get_device_session;

/// 安全的ADB Shell命令执行器
/// 
/// 使用设备会话执行shell命令，自动处理设备连接验证
#[tauri::command]
#[allow(non_snake_case)]
pub async fn safe_adb_shell_command(
    deviceId: String,
    shellCommand: String,
) -> Result<String, String> {
    info!(
        "🔧 开始执行安全Shell命令: {} (设备: {})",
        shellCommand, deviceId
    );

    // 获取设备会话（自动验证设备在线）
    let session = get_device_session(&deviceId).await
        .map_err(|e| format!("无法获取设备会话: {}", e))?;

    // 执行shell命令
    match session.execute_command(&shellCommand).await {
        Ok(output) => {
            info!("🎉 Shell命令执行成功");
            Ok(output)
        }
        Err(e) => {
            error!("💥 Shell命令执行失败: {}", e);
            Err(format!("Shell命令执行失败: {}", e))
        }
    }
}
