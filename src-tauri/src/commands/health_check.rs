// src-tauri/src/commands/health_check.rs
// module: commands | layer: commands | role: 后端健康检查命令
// summary: 提供简单的心跳检测接口

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingResponse {
    pub success: bool,
    pub timestamp: u64,
    pub version: String,
}

/// 后端健康检查 - 轻量级 ping 命令
#[tauri::command]
pub async fn backend_ping() -> Result<PingResponse, String> {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Failed to get timestamp: {}", e))?
        .as_secs();

    Ok(PingResponse {
        success: true,
        timestamp,
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_backend_ping() {
        let result = backend_ping().await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.success);
        assert!(response.timestamp > 0);
        assert!(!response.version.is_empty());
    }
}
