use tauri::command;
use tracing::{info, warn, error};

use crate::utils::adb_utils::execute_adb_command;

/// 执行 adb content query 并统计返回的行数（以 "Row " 开头的行）
fn count_rows_from_output(output: &str) -> i32 {
    output
        .lines()
        .filter(|line| line.trim_start().starts_with("Row "))
        .count() as i32
}

/// 尝试通过不同 URI 获取联系人数量
async fn try_query_contact_count(device_id: &str) -> Result<i32, String> {
    // 方案1：ContactsContract.Contacts 可见联系人
    let args1 = [
        "-s",
        device_id,
        "shell",
        "content",
        "query",
        "--uri",
        "content://com.android.contacts/contacts",
        "--projection",
        "_id",
    ];

    match execute_adb_command(&args1) {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let count = count_rows_from_output(&stdout);
                // 某些设备可能返回空，但命令成功；继续尝试 raw_contacts
                if count > 0 {
                    return Ok(count);
                }
            }
        }
        Err(e) => {
            warn!("Contacts query failed: {}", e);
        }
    }

    // 方案2：raw_contacts（过滤 deleted=0）
    let args2 = [
        "-s",
        device_id,
        "shell",
        "content",
        "query",
        "--uri",
        "content://com.android.contacts/raw_contacts",
        "--projection",
        "_id,deleted",
        "--where",
        "deleted=0",
    ];

    match execute_adb_command(&args2) {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let mut count = count_rows_from_output(&stdout);
                // 某些 ROM 仍会把 header 行或无关行算进去；这里保底非负
                if count < 0 { count = 0; }
                return Ok(count);
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("content query 失败: {}", stderr));
            }
        }
        Err(e) => Err(format!("执行ADB命令失败: {}", e)),
    }
}

/// 获取设备内联系人数量（兼容 `{ device_id }` 与 `{ deviceId }` 两种写法）
// #[command] - Moved to plugin:contacts
#[allow(non_snake_case)]
pub async fn get_device_contact_count(
    device_id: Option<String>,
    deviceId: Option<String>,
) -> Result<i32, String> {
    let id = match (device_id.clone(), deviceId.clone()) {
        (Some(id), _) => id,
        (None, Some(id)) => id,
        (None, None) => {
            warn!("❌ get_device_contact_count 缺少参数: device_id/deviceId 皆为 None");
            return Err("缺少参数：device_id / deviceId".to_string());
        },
    };

    info!("📇 查询设备联系人数量: {} (raw inputs: device_id={:?}, deviceId={:?})", id, device_id, deviceId);
    
    // 增强错误处理：提供更详细的错误分类
    match try_query_contact_count(&id).await {
        Ok(count) => {
            info!("✅ 设备 {} 联系人查询成功: {} 个", id, count);
            Ok(count)
        },
        Err(e) => {
            // 错误分类处理
            if e.contains("device") && (e.contains("not found") || e.contains("offline")) {
                warn!("🔌 设备 {} 已断开连接: {}", id, e);
                Err(format!("device '{}' not found", id))
            } else if e.contains("timeout") || e.contains("连接") {
                warn!("⏱️ 设备 {} 连接超时: {}", id, e);
                Err(format!("device '{}' timeout", id))
            } else if e.contains("permission") || e.contains("权限") {
                warn!("🔐 设备 {} 权限不足: {}", id, e);
                Err(format!("device '{}' permission denied", id))
            } else {
                error!("❌ 设备 {} 查询失败: {}", id, e);
                Err(e)
            }
        },
    }
}
