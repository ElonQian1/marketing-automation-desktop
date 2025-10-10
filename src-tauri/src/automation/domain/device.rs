use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Metadata describing a controllable device/account pair.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DeviceAccount {
    pub device_id: String,
    pub account_id: String,
    pub region: Option<String>,
    pub capabilities: Vec<DeviceCapability>,
    pub last_active_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DeviceCapability {
    Reply,
    Follow,
    Like,
}

/// Runtime load metric used for load balancing between devices.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct DeviceLoad {
    pub executing_tasks: u32,
    pub daily_follow_count: u32,
    pub daily_reply_count: u32,
}
