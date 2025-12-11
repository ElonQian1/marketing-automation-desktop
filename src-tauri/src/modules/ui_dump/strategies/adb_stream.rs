// src-tauri/src/modules/ui_dump/strategies/adb_stream.rs
// module: ui_dump | layer: strategies | role: adb-stream
// summary: ADB 流式策略 - 使用 exec-out uiautomator dump /dev/stdout

use anyhow::{Context, Result};
use async_trait::async_trait;
use std::time::{Duration, Instant};
use tokio::time::timeout;
use tracing::{debug, info, warn};

use crate::modules::ui_dump::domain::capturer_trait::ScreenCapturer;
use crate::modules::ui_dump::ui_dump_types::{DumpMode, DumpResult};
use crate::services::adb::get_device_session;

pub struct AdbStreamStrategy {
    timeout_ms: u64,
}

impl AdbStreamStrategy {
    pub fn new(timeout_ms: u64) -> Self {
        Self { timeout_ms }
    }
}

#[async_trait]
impl ScreenCapturer for AdbStreamStrategy {
    fn name(&self) -> &'static str {
        "AdbStream"
    }

    async fn capture(&self, device_id: &str) -> Result<DumpResult> {
        let start = Instant::now();
        debug!("🌊 AdbStream 模式开始: device={}", device_id);

        let session = match get_device_session(device_id).await {
            Ok(s) => s,
            Err(e) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::ExecOut,
                format!("获取设备会话失败: {}", e),
                start.elapsed().as_millis() as u64
            )),
        };

        // 直接输出到 stdout
        // 注意：exec-out 是 adb client 的功能，rust adb client 可能需要特殊处理
        // 这里假设 session.shell 支持 exec-out 或者我们用 shell 命令模拟
        // 实际上 `adb shell uiautomator dump /dev/tty` 或者直接捕获 stdout
        
        // 尝试使用 shell 命令直接输出
        let dump_cmd = session.shell(&["uiautomator", "dump", "/dev/tty"]);
        
        let output = match timeout(Duration::from_millis(self.timeout_ms), dump_cmd).await {
            Ok(Ok(out)) => out,
            Ok(Err(e)) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::ExecOut,
                format!("ExecOut 命令失败: {}", e),
                start.elapsed().as_millis() as u64
            )),
            Err(_) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::ExecOut,
                "ExecOut 命令超时".to_string(),
                start.elapsed().as_millis() as u64
            )),
        };

        let xml_content = String::from_utf8_lossy(&output).to_string();

        // 验证内容
        if !xml_content.contains("hierarchy") {
             // 如果直接输出失败，可能是设备不支持 /dev/tty 输出，或者输出混杂了日志
             // 这里可以尝试降级，但作为策略，我们只返回失败
             return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::ExecOut,
                "未获取到有效的 XML 内容".to_string(),
                start.elapsed().as_millis() as u64
            ));
        }

        let elapsed = start.elapsed().as_millis() as u64;
        info!("✅ AdbStream 采集成功: {}ms", elapsed);

        Ok(DumpResult::success(
            device_id.to_string(),
            DumpMode::ExecOut,
            xml_content,
            elapsed
        ))
    }
}
