// src-tauri/src/core/domain/device/mod.rs
// module: core/domain/device | layer: domain | role: device-aggregate
// summary: 设备领域 - Device 实体和相关业务规则

use serde::{Deserialize, Serialize};

/// 设备实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Device {
    /// 设备 ID
    pub id: String,
    /// 设备名称
    pub name: String,
    /// 设备型号
    pub model: String,
    /// Android 版本
    pub android_version: String,
    /// 屏幕分辨率
    pub screen_resolution: (u32, u32),
    /// 连接状态
    pub status: DeviceStatus,
}

/// 设备连接状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DeviceStatus {
    /// 已连接
    Connected,
    /// 已断开
    Disconnected,
    /// 未授权
    Unauthorized,
    /// 离线
    Offline,
}

impl Device {
    /// 创建新设备
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: "Unknown Device".to_string(),
            model: "Unknown".to_string(),
            android_version: "Unknown".to_string(),
            screen_resolution: (1080, 1920),
            status: DeviceStatus::Disconnected,
        }
    }

    /// 检查设备是否可用
    pub fn is_available(&self) -> bool {
        self.status == DeviceStatus::Connected
    }

    /// 更新设备状态
    pub fn set_status(&mut self, status: DeviceStatus) {
        self.status = status;
    }
}

impl Default for DeviceStatus {
    fn default() -> Self {
        Self::Disconnected
    }
}
