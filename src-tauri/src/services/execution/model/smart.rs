//! smart.rs - SmartScript 兼容数据模型
//! 目标：承载从 `smart_script_executor` 迁出的前端契约结构，便于后续统一到 ExecStep

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 智能脚本步骤的操作类型（与前端保持兼容）。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SmartActionType {
    // 基础操作类型
    Tap,
    Input,
    Wait,
    Swipe,
    KeyEvent,     // 🔥 新增：系统按键事件
    LongPress,    // 🔥 新增：长按操作
    // 智能操作类型
    SmartTap,
    SmartScroll,  // 🔥 新增：智能滚动步骤类型
    SmartFindElement,
    BatchMatch,
    RecognizePage,
    VerifyAction,
    WaitForPageState,
    ExtractElement,
    SmartNavigation,
    // 循环控制类型
    LoopStart,
    LoopEnd,
    // 通讯录自动化操作
    ContactGenerateVcf,
    ContactImportToDevice,
    // 🆕 受控兜底：未知动作类型（避免 serde 硬崩）
    #[serde(other)]
    Unknown,
}

/// 前端传入的原始智能脚本步骤结构。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartScriptStep {
    pub id: String,
    pub step_type: SmartActionType,
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
    pub enabled: bool,
    pub order: i32,
}

/// 单步测试的结果结构（供 UI 展示与调试）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SingleStepTestResult {
    pub success: bool,
    pub step_id: String,
    pub step_name: String,
    pub message: String,
    pub duration_ms: u64,
    pub timestamp: i64,
    pub page_state: Option<String>,
    pub ui_elements: Vec<serde_json::Value>,
    pub logs: Vec<String>,
    pub error_details: Option<String>,
    pub extracted_data: HashMap<String, serde_json::Value>,
}

/// 批量执行智能脚本的总体结果。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartExecutionResult {
    pub success: bool,
    pub total_steps: u32,
    pub executed_steps: u32,
    pub failed_steps: u32,
    pub skipped_steps: u32,
    pub duration_ms: u64,
    pub logs: Vec<String>,
    pub final_page_state: Option<String>,
    pub extracted_data: HashMap<String, serde_json::Value>,
    pub message: String,
}

/// 执行时的配置项（兼容旧接口）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartExecutorConfig {
    pub continue_on_error: bool,
    pub auto_verification_enabled: bool,
    pub smart_recovery_enabled: bool,
    pub detailed_logging: bool,
}
