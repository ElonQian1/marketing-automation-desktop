// src-tauri/src/modules/ui_dump/strategies/adb_stream.rs
// module: ui_dump | layer: strategies | role: adb-stream
// summary: ADB 流式策略 - 使用 exec-out uiautomator dump /dev/stdout

use anyhow::Result;
use async_trait::async_trait;
use tracing::debug;

use crate::modules::ui_dump::domain::capturer_trait::ScreenCapturer;
use crate::modules::ui_dump::ui_dump_exec_out::ExecOutExecutor;
use crate::modules::ui_dump::ui_dump_types::DumpResult;

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
        debug!("🌊 AdbStream 模式开始: device={}", device_id);
        
        // 使用 ExecOutExecutor 执行真正的 adb exec-out 命令
        let executor = ExecOutExecutor::new(self.timeout_ms);
        executor.execute(device_id).await
    }
}
