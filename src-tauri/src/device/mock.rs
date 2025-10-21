// src-tauri/src/device/mock.rs
// module: device | layer: infrastructure | role: Mock设备提供者实现
// summary: 模拟设备操作，用于测试和演示

use super::provider::{DeviceAction, DumpProvider, ScreenDump, WaitCondition};
use async_trait::async_trait;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::time::{sleep, Duration};

/// Mock 设备提供者（不依赖真实设备）
pub struct MockDumpProvider {
    /// 模拟设备ID
    pub device_id: String,
}

impl MockDumpProvider {
    pub fn new(device_id: String) -> Self {
        Self { device_id }
    }

    /// 生成模拟的 XML Dump（包含一些常见元素）
    fn generate_mock_xml(&self) -> String {
        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" bounds="[0,0][1080,2400]">
    <node index="0" text="私信" class="android.widget.TextView" bounds="[100,200][300,280]"/>
    <node index="1" text="发送" class="android.widget.Button" bounds="[800,2200][1000,2300]"/>
    <node index="2" text="" class="android.widget.EditText" bounds="[100,2100][750,2250]"/>
    <node index="3" text="用户主页" class="android.widget.TextView" bounds="[100,500][400,580]"/>
  </node>
</hierarchy>"#
        )
    }
}

#[async_trait]
impl DumpProvider for MockDumpProvider {
    async fn get_current_screen(&self) -> Result<ScreenDump, String> {
        // 模拟网络延迟
        sleep(Duration::from_millis(100)).await;

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("时间错误: {}", e))?
            .as_millis() as i64;

        Ok(ScreenDump {
            xml: self.generate_mock_xml(),
            timestamp,
        })
    }

    async fn perform_action(&self, action: &DeviceAction) -> Result<(), String> {
        // 模拟动作执行延迟
        let delay_ms = match action {
            DeviceAction::Click { x, y } => {
                println!("[Mock] 点击坐标: ({}, {})", x, y);
                150
            }
            DeviceAction::Input { text } => {
                println!("[Mock] 输入文本: {}", text);
                text.len() as u64 * 50 // 模拟输入速度
            }
            DeviceAction::Swipe { x1, y1, x2, y2, duration_ms } => {
                println!("[Mock] 滑动: ({},{}) -> ({},{}) 耗时{}ms", x1, y1, x2, y2, duration_ms);
                *duration_ms
            }
            DeviceAction::Back => {
                println!("[Mock] 按返回键");
                100
            }
            DeviceAction::Sleep { ms } => {
                println!("[Mock] 等待 {}ms", ms);
                *ms
            }
        };

        sleep(Duration::from_millis(delay_ms)).await;
        Ok(())
    }

    async fn wait_for_condition(
        &self,
        condition: &WaitCondition,
        timeout_ms: u64,
    ) -> Result<bool, String> {
        match condition {
            WaitCondition::ElementAppears { text } => {
                println!("[Mock] 等待元素出现: {}", text);
                // 模拟：50% 概率在超时前出现
                let wait_time = timeout_ms / 2;
                sleep(Duration::from_millis(wait_time)).await;
                Ok(true)
            }
            WaitCondition::ElementDisappears { text } => {
                println!("[Mock] 等待元素消失: {}", text);
                let wait_time = timeout_ms / 3;
                sleep(Duration::from_millis(wait_time)).await;
                Ok(true)
            }
            WaitCondition::Timeout { ms } => {
                println!("[Mock] 等待 {}ms", ms);
                sleep(Duration::from_millis(*ms)).await;
                Ok(true)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mock_provider() {
        let provider = MockDumpProvider::new("mock_device".to_string());

        // 测试截图
        let dump = provider.get_current_screen().await.unwrap();
        assert!(dump.xml.contains("android.widget.TextView"));

        // 测试点击
        provider.perform_action(&DeviceAction::Click { x: 100, y: 200 }).await.unwrap();

        // 测试输入
        provider.perform_action(&DeviceAction::Input { text: "Hello".to_string() }).await.unwrap();

        // 测试等待
        let result = provider.wait_for_condition(
            &WaitCondition::ElementAppears { text: "发送".to_string() },
            1000,
        ).await.unwrap();
        assert!(result);
    }
}
