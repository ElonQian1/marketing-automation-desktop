// src-tauri/src/core/domain/agent_runtime/agent_action.rs
// module: agent_runtime | layer: domain | role: Agent 行动定义
// summary: 定义 Agent 可执行的行动类型和行动结果

use serde::{Deserialize, Serialize};
use std::time::SystemTime;

/// 行动类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    /// 点击坐标
    Tap { x: i32, y: i32 },
    /// 点击元素（通过文本或描述定位）
    TapElement { text: Option<String>, description: Option<String> },
    /// 滑动
    Swipe { start_x: i32, start_y: i32, end_x: i32, end_y: i32, duration_ms: u32 },
    /// 输入文本
    InputText { text: String },
    /// 按键
    KeyPress { key_code: String },
    /// 启动应用
    LaunchApp { package: String },
    /// 等待
    Wait { duration_ms: u32 },
    /// 截图
    Screenshot,
    /// 获取屏幕 UI 树
    GetScreen,
    /// 执行 ADB 命令
    AdbCommand { command: String },
    /// 执行脚本
    ExecuteScript { script_id: String },
    /// 请求人工确认
    RequestApproval { message: String },
    /// AI 自定义行动（通过工具调用）
    Custom { tool_name: String, params: serde_json::Value },
}

/// 行动风险等级
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum RiskLevel {
    /// 无风险：查看、截图等
    None,
    /// 低风险：点击、滑动等
    Low,
    /// 中风险：输入文本、启动应用
    Medium,
    /// 高风险：执行脚本、删除操作
    High,
    /// 关键：需要强制人工确认
    Critical,
}

impl ActionType {
    /// 获取行动的风险等级
    pub fn risk_level(&self) -> RiskLevel {
        match self {
            Self::Screenshot | Self::GetScreen | Self::Wait { .. } => RiskLevel::None,
            Self::Tap { .. } | Self::TapElement { .. } | Self::Swipe { .. } | Self::KeyPress { .. } => RiskLevel::Low,
            Self::InputText { .. } | Self::LaunchApp { .. } => RiskLevel::Medium,
            Self::ExecuteScript { .. } | Self::AdbCommand { .. } => RiskLevel::High,
            Self::RequestApproval { .. } => RiskLevel::None,
            Self::Custom { .. } => RiskLevel::Medium, // 默认中等风险
        }
    }

    /// 获取行动描述
    pub fn description(&self) -> String {
        match self {
            Self::Tap { x, y } => format!("点击坐标 ({}, {})", x, y),
            Self::TapElement { text, description } => {
                let target = text.as_ref().or(description.as_ref()).map(|s| s.as_str()).unwrap_or("未知");
                format!("点击元素: {}", target)
            }
            Self::Swipe { start_x, start_y, end_x, end_y, .. } => {
                format!("滑动 ({},{}) → ({},{})", start_x, start_y, end_x, end_y)
            }
            Self::InputText { text } => format!("输入文本: {}", text),
            Self::KeyPress { key_code } => format!("按键: {}", key_code),
            Self::LaunchApp { package } => format!("启动应用: {}", package),
            Self::Wait { duration_ms } => format!("等待 {}ms", duration_ms),
            Self::Screenshot => "截图".to_string(),
            Self::GetScreen => "获取屏幕".to_string(),
            Self::AdbCommand { command } => format!("ADB: {}", command),
            Self::ExecuteScript { script_id } => format!("执行脚本: {}", script_id),
            Self::RequestApproval { message } => format!("请求确认: {}", message),
            Self::Custom { tool_name, .. } => format!("调用工具: {}", tool_name),
        }
    }
}

/// 行动计划项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlannedAction {
    /// 序号
    pub index: usize,
    /// 行动类型
    pub action: ActionType,
    /// 预期结果描述
    pub expected_result: String,
    /// 失败时的备选行动
    pub fallback: Option<Box<PlannedAction>>,
}

/// 行动结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionResult {
    /// 成功
    Success {
        /// 结果数据
        data: serde_json::Value,
        /// 结果描述
        message: String,
    },
    /// 失败
    Failure {
        /// 错误信息
        error: String,
        /// 是否可重试
        retryable: bool,
    },
    /// 需要人工确认
    NeedsApproval {
        /// 确认消息
        message: String,
        /// 待确认的行动
        pending_action: ActionType,
    },
    /// 超时
    Timeout {
        /// 超时时间（毫秒）
        timeout_ms: u64,
    },
}

impl ActionResult {
    pub fn success(message: impl Into<String>) -> Self {
        Self::Success {
            data: serde_json::Value::Null,
            message: message.into(),
        }
    }

    pub fn success_with_data(message: impl Into<String>, data: serde_json::Value) -> Self {
        Self::Success {
            data,
            message: message.into(),
        }
    }

    pub fn failure(error: impl Into<String>, retryable: bool) -> Self {
        Self::Failure {
            error: error.into(),
            retryable,
        }
    }

    pub fn is_success(&self) -> bool {
        matches!(self, Self::Success { .. })
    }

    pub fn is_retryable(&self) -> bool {
        match self {
            Self::Failure { retryable, .. } => *retryable,
            Self::Timeout { .. } => true,
            _ => false,
        }
    }
}

/// 行动执行记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionRecord {
    /// 行动
    pub action: ActionType,
    /// 结果
    pub result: ActionResult,
    /// 开始时间
    pub started_at: SystemTime,
    /// 结束时间
    pub ended_at: SystemTime,
    /// 持续时间（毫秒）
    pub duration_ms: u64,
    /// 重试次数
    pub retry_count: u32,
}

impl ActionRecord {
    pub fn new(action: ActionType, result: ActionResult, started_at: SystemTime, ended_at: SystemTime) -> Self {
        let duration_ms = ended_at
            .duration_since(started_at)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        Self {
            action,
            result,
            started_at,
            ended_at,
            duration_ms,
            retry_count: 0,
        }
    }
}
