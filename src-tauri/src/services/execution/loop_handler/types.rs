/// 循环处理相关的类型定义

use serde::{Deserialize, Serialize};
use crate::services::execution::model::SmartScriptStep;

/// 循环配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoopConfig {
    /// 循环ID
    pub loop_id: String,
    /// 循环名称
    pub loop_name: String,
    /// 最大迭代次数
    pub max_iterations: u32,
    /// 是否无限循环
    pub is_infinite: bool,
    /// 循环间隔（毫秒）
    pub interval_ms: Option<u64>,
    /// 遇到错误时是否继续
    pub continue_on_error: bool,
}

/// 循环上下文
#[derive(Debug, Clone)]
pub struct LoopContext {
    /// 循环ID
    pub loop_id: String,
    /// 循环名称
    pub loop_name: String,
    /// 当前迭代次数
    pub current_iteration: u32,
    /// 最大迭代次数
    pub max_iterations: u32,
    /// 是否无限循环
    pub is_infinite: bool,
    /// 循环开始时间
    pub start_time: std::time::Instant,
    /// 循环间隔
    pub interval_ms: Option<u64>,
    /// 遇到错误时是否继续
    pub continue_on_error: bool,
    /// 循环变量
    pub variables: std::collections::HashMap<String, serde_json::Value>,
}

/// 循环执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoopExecutionResult {
    /// 执行是否成功
    pub success: bool,
    /// 循环ID
    pub loop_id: String,
    /// 循环名称
    pub loop_name: String,
    /// 总迭代次数
    pub total_iterations: u32,
    /// 成功迭代次数
    pub successful_iterations: u32,
    /// 失败迭代次数
    pub failed_iterations: u32,
    /// 总执行时长（毫秒）
    pub duration_ms: u64,
    /// 每次迭代的执行时长
    pub iteration_durations: Vec<u64>,
    /// 执行日志
    pub logs: Vec<String>,
    /// 错误消息（如果有）
    pub error_message: Option<String>,
}

/// 循环处理结果
#[derive(Debug, Clone)]
pub enum LoopHandleResult {
    /// 循环开始
    LoopStarted {
        context: LoopContext,
        message: String,
    },
    /// 循环完成
    LoopCompleted {
        result: LoopExecutionResult,
        message: String,
    },
    /// 收集循环体步骤
    CollectingSteps {
        message: String,
    },
}

impl LoopHandleResult {
    /// 获取消息
    pub fn get_message(&self) -> &str {
        match self {
            LoopHandleResult::LoopStarted { message, .. } => message,
            LoopHandleResult::LoopCompleted { message, .. } => message,
            LoopHandleResult::CollectingSteps { message } => message,
        }
    }

    /// 获取执行结果（如果有）
    pub fn get_execution_result(&self) -> Option<&LoopExecutionResult> {
        match self {
            LoopHandleResult::LoopCompleted { result, .. } => Some(result),
            _ => None,
        }
    }

    /// 获取循环上下文（如果有）
    pub fn get_context(&self) -> Option<&LoopContext> {
        match self {
            LoopHandleResult::LoopStarted { context, .. } => Some(context),
            _ => None,
        }
    }
}

/// 循环状态
#[derive(Debug, Clone, PartialEq)]
pub enum LoopState {
    /// 空闲状态
    Idle,
    /// 收集循环体步骤
    Collecting,
    /// 执行中
    Executing,
    /// 已完成
    Completed,
    /// 错误状态
    Error,
}