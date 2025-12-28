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
    // 🤖 AI Agent 专用操作类型
    AiLaunchApp,       // 启动应用
    AiFindElements,    // 智能查找元素
    AiTapRelative,     // 相对位置点击
    AiExtractComments, // 提取评论数据
    AiCustomCommand,   // 通用自定义命令
    // 🆕 受控兜底：未知动作类型（避免 serde 硬崩）
    #[serde(other)]
    Unknown,
}

impl SmartActionType {
    /// 判断该操作类型是否会导致页面结构大幅变化
    /// 这类操作后必须重新 dump XML
    /// 
    /// 注意：这只是基于类型的判断，完整判断需要结合参数 `may_cause_page_change`
    pub fn causes_page_change(&self) -> bool {
        matches!(
            self,
            SmartActionType::Swipe
                | SmartActionType::SmartScroll
                | SmartActionType::SmartNavigation
                | SmartActionType::KeyEvent  // 返回键等会改变页面
        )
    }
    
    /// 🔥 增强版：结合参数判断是否会导致页面变化
    /// 
    /// - 首先检查参数中的 `may_cause_page_change` 标记（用户显式指定）
    /// - 其次检查操作类型的默认行为
    pub fn causes_page_change_with_params(&self, params: &serde_json::Value) -> bool {
        // 优先检查用户显式标记
        if let Some(marked) = params.get("may_cause_page_change").and_then(|v| v.as_bool()) {
            return marked;
        }
        
        // 回退到类型默认判断
        self.causes_page_change()
    }
    
    /// 判断该操作类型是否需要元素定位（需要 XML）
    pub fn needs_element_locating(&self) -> bool {
        matches!(
            self,
            SmartActionType::Tap
                | SmartActionType::SmartTap
                | SmartActionType::LongPress
                | SmartActionType::Input
                | SmartActionType::SmartFindElement
                | SmartActionType::BatchMatch
                | SmartActionType::ExtractElement
                | SmartActionType::VerifyAction
                | SmartActionType::RecognizePage
        )
    }
    
    /// 判断该操作类型是否可以跳过 dump（纯延时/控制流）
    pub fn can_skip_dump(&self) -> bool {
        matches!(
            self,
            SmartActionType::Wait
                | SmartActionType::WaitForPageState
                | SmartActionType::LoopStart
                | SmartActionType::LoopEnd
                | SmartActionType::ContactGenerateVcf
                | SmartActionType::ContactImportToDevice
        )
    }
    
    /// 🔥 增强版：结合参数判断是否可以跳过 dump
    /// 
    /// - 如果用户标记了 `may_cause_page_change`，则不能跳过
    /// - 否则使用类型默认判断
    pub fn can_skip_dump_with_params(&self, params: &serde_json::Value) -> bool {
        // 如果用户标记此操作会导致页面变化，则不能跳过
        if let Some(true) = params.get("may_cause_page_change").and_then(|v| v.as_bool()) {
            return false;
        }
        
        self.can_skip_dump()
    }
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
