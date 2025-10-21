// src-tauri/src/device/provider.rs
// module: device | layer: domain | role: 设备提供者接口定义
// summary: 定义屏幕截图、动作执行、条件等待的抽象接口

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// 屏幕快照（XML Dump）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenDump {
    /// XML 内容
    pub xml: String,
    /// 截图时间戳
    pub timestamp: i64,
}

/// 执行动作类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum DeviceAction {
    /// 点击坐标
    Click { x: i32, y: i32 },
    /// 输入文本
    Input { text: String },
    /// 滑动
    Swipe { x1: i32, y1: i32, x2: i32, y2: i32, duration_ms: u64 },
    /// 返回键
    Back,
    /// 等待指定毫秒
    Sleep { ms: u64 },
}

/// 等待条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WaitCondition {
    /// 等待元素出现（通过 text 属性匹配）
    ElementAppears { text: String },
    /// 等待元素消失
    ElementDisappears { text: String },
    /// 等待指定时间
    Timeout { ms: u64 },
}

/// 设备提供者接口（抽象设备操作）
#[async_trait]
pub trait DumpProvider: Send + Sync {
    /// 获取当前屏幕快照
    async fn get_current_screen(&self) -> Result<ScreenDump, String>;

    /// 执行动作
    async fn perform_action(&self, action: &DeviceAction) -> Result<(), String>;

    /// 等待条件满足（返回是否满足）
    async fn wait_for_condition(
        &self,
        condition: &WaitCondition,
        timeout_ms: u64,
    ) -> Result<bool, String>;
}
