// src-tauri/src/modules/ui_dump/strategies/adb_file.rs
// module: ui_dump | layer: strategies | role: adb-file
// summary: 传统 ADB 文件策略 - 使用 uiautomator dump + pull

use anyhow::{Context, Result};
use async_trait::async_trait;
use std::time::{Duration, Instant};
use tokio::time::timeout;
use tracing::{debug, info, warn};

use crate::modules::ui_dump::domain::capturer_trait::ScreenCapturer;
use crate::modules::ui_dump::ui_dump_types::{DumpMode, DumpResult};
use crate::services::adb::get_device_session;

pub struct AdbFileStrategy {
    timeout_ms: u64,
}

impl AdbFileStrategy {
    pub fn new(timeout_ms: u64) -> Self {
        Self { timeout_ms }
    }
}

#[async_trait]
impl ScreenCapturer for AdbFileStrategy {
    fn name(&self) -> &'static str {
        "AdbFile"
    }

    async fn capture(&self, device_id: &str) -> Result<DumpResult> {
        let start = Instant::now();
        debug!("📦 AdbFile 模式开始: device={}", device_id);

        let session = match get_device_session(device_id).await {
            Ok(s) => s,
            Err(e) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::DumpPull,
                format!("获取设备会话失败: {}", e),
                start.elapsed().as_millis() as u64
            )),
        };

        // 1. 清理旧文件
        let _ = session.shell(&["rm", "/sdcard/ui_dump.xml"]).await;

        // 2. 执行 dump
        let dump_cmd = session.shell(&["uiautomator", "dump", "/sdcard/ui_dump.xml"]);
        match timeout(Duration::from_millis(self.timeout_ms), dump_cmd).await {
            Ok(Ok(_)) => {},
            Ok(Err(e)) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::DumpPull,
                format!("Dump 命令失败: {}", e),
                start.elapsed().as_millis() as u64
            )),
            Err(_) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::DumpPull,
                "Dump 命令超时".to_string(),
                start.elapsed().as_millis() as u64
            )),
        }

        // 3. 读取文件 (cat)
        // 使用 cat 而不是 pull，减少一次文件 I/O 开销
        let cat_cmd = session.shell(&["cat", "/sdcard/ui_dump.xml"]);
        let output = match timeout(Duration::from_millis(5000), cat_cmd).await {
            Ok(Ok(out)) => out,
            Ok(Err(e)) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::DumpPull,
                format!("读取文件失败: {}", e),
                start.elapsed().as_millis() as u64
            )),
            Err(_) => return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::DumpPull,
                "读取文件超时".to_string(),
                start.elapsed().as_millis() as u64
            )),
        };

        let xml_content = String::from_utf8_lossy(&output).to_string();
        
        // 简单验证
        if !xml_content.contains("hierarchy") {
            return Ok(DumpResult::failure(
                device_id.to_string(),
                DumpMode::DumpPull,
                "无效的 XML 内容".to_string(),
                start.elapsed().as_millis() as u64
            ));
        }

        let elapsed = start.elapsed().as_millis() as u64;
        info!("✅ AdbFile 采集成功: {}ms", elapsed);

        Ok(DumpResult::success(
            device_id.to_string(),
            DumpMode::DumpPull,
            xml_content,
            elapsed
        ))
    }
}
