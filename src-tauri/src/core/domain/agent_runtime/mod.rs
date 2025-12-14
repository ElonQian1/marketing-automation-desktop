// src-tauri/src/core/domain/agent_runtime/mod.rs
// module: agent_runtime | layer: domain | role: Agent 运行时核心领域模型
// summary: 定义自主 Agent 的核心概念：目标、状态、记忆、行动

mod agent_goal;
mod agent_state;
mod agent_memory;
mod agent_action;

pub use agent_goal::*;
pub use agent_state::*;
pub use agent_memory::*;
pub use agent_action::*;

use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Agent 运行时配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// 最大连续失败次数（超过后暂停并请求人工干预）
    pub max_consecutive_failures: u32,
    /// 每次行动后的观察间隔
    pub observation_interval: Duration,
    /// 单个目标的最大执行时间
    pub goal_timeout: Duration,
    /// 是否启用自动重试
    pub auto_retry: bool,
    /// 是否需要人工确认高风险操作
    pub require_human_approval_for_risky: bool,
}

impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            max_consecutive_failures: 3,
            observation_interval: Duration::from_millis(500),
            goal_timeout: Duration::from_secs(300), // 5分钟
            auto_retry: true,
            require_human_approval_for_risky: true,
        }
    }
}

/// Agent 运行模式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentMode {
    /// 完全自主：AI 自己决定所有行动
    Autonomous,
    /// 半自主：关键决策需要人工确认
    SemiAutonomous,
    /// 监督模式：每步都需要人工确认
    Supervised,
}

impl Default for AgentMode {
    fn default() -> Self {
        Self::SemiAutonomous
    }
}
