// src-tauri/src/commands/run_step_v2/types/response.rs
// module: step-execution | layer: types | role: 响应类型
// summary: 步骤执行响应数据结构 - 匹配结果、执行信息、边界等

use serde::{Serialize, Deserialize};

/// 匹配结果（单个候选元素）
#[derive(Debug, Clone, Serialize)]
pub struct MatchResult {
    pub id: String,
    pub score: f64,
    pub confidence: f64,
    pub bounds: Bounds,
    pub text: Option<String>,
    pub class_name: Option<String>,
    pub package_name: Option<String>,
}

/// 边界坐标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

/// 执行信息
#[derive(Debug, Clone, Serialize)]
pub struct ExecutionInfo { 
    pub ok: bool, 
    pub action: String,
    pub execution_time_ms: u64,
}

/// 步骤执行响应（V2协议）
#[derive(Debug, Serialize)]
pub struct StepExecResponse {
    pub ok: bool,
    pub message: String,
    pub matched: Option<MatchResult>,
    pub executed_action: Option<String>,
    pub verify_passed: Option<bool>,
    pub error_code: Option<String>,
    pub raw_logs: Option<Vec<String>>,
}

/// 匹配信息（内部使用）
#[derive(Debug, Clone)]
pub struct MatchInfo { 
    pub uniqueness: i32, 
    pub confidence: f32,
    pub elements_found: i32,
}

/// 旧版兼容：步骤执行结果
#[derive(Debug, Serialize)]
pub struct StepExecutionResult {
    pub success: bool,
    pub message: String,
    pub execution_time_ms: u64,
    pub verification_passed: bool,
    pub found_elements: Vec<crate::services::ui_reader_service::UIElement>,
}
