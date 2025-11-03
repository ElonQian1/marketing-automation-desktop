// src-tauri/src/commands/run_step_v2/types/request.rs
// module: step-execution | layer: types | role: 请求类型
// summary: 步骤执行请求数据结构 - 执行模式、验证配置等

use serde::{Serialize, Deserialize};
use super::selector::ElementSelector;
use super::strategy::DecisionChainPlan;

/// 步骤执行请求（V2协议）
#[derive(Debug, Clone, Deserialize)]
pub struct StepExecRequest {
    pub selector: ElementSelector,
    pub action: String,
    pub verify_after_action: Option<bool>,
    pub mode: Option<StepExecMode>,
    pub decision_chain: Option<DecisionChainPlan>,
}

/// 执行模式
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StepExecMode {
    Interactive,
    Batch,
}

/// 批量执行配置
#[derive(Debug, Clone, Deserialize)]
pub struct BatchConfig {
    pub min_interval_ms: Option<u64>,
    pub max_interval_ms: Option<u64>,
    pub max_retries: Option<u32>,
    pub stop_on_error: Option<bool>,
}

/// 验证配置
#[derive(Debug, Clone, Deserialize)]
pub struct VerificationConfig {
    pub enabled: bool,
    pub expected_state: Option<String>,
    pub timeout_ms: Option<u64>,
}
