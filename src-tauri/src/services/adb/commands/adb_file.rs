// src/services/adb/commands/adb_file.rs
// module: adb | layer: commands | role: 文件操作命令
// summary: ADB文件传输命令（push/pull），提供设备验证

use tracing::{info, error};
use crate::services::adb::get_device_session;
use tokio::process::Command;
#[cfg(windows)]
// use std::os::windows::process::CommandExt;

/// 安全的ADB Push命令
/// 
/// 将本地文件推送到设备
#[tauri::command]
#[allow(non_snake_case)]
pub async fn safe_adb_push(
    deviceId: String,
    localPath: String,
    remotePath: String,
) -> Result<String, String> {
    info!("📂 开始推送文件: {} -> {} (设备: {})", localPath, remotePath, deviceId);

    // 获取设备会话（自动验证设备在线）
    let session = get_device_session(&deviceId).await
        .map_err(|e| format!("无法获取设备会话: {}", e))?;
    
    let adb_path = session.get_adb_path().await;

    let mut cmd = Command::new(adb_path);
    cmd.args(&["-s", &deviceId, "push", &localPath, &remotePath]);
    
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    match cmd.output().await {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                info!("✅ 文件推送成功: {}", stdout);
                Ok(stdout)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                error!("❌ 文件推送失败: {}", stderr);
                Err(format!("文件推送失败: {}", stderr))
            }
        }
        Err(e) => {
            error!("💥 执行ADB push命令失败: {}", e);
            Err(format!("执行ADB push命令失败: {}", e))
        }
    }
}
