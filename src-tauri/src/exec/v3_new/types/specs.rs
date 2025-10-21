// src-tauri/src/exec/v3_new/types/specs.rs
// module: exec | layer: domain | role: 执行规格定义
// summary: 定义单步、链式、静态执行的规格结构，确保字段完整性

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 单步执行规格
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SingleStepSpecV3 {
    pub step_id: String,
    pub strategy_name: String,
    pub target_text: Option<String>,
    pub xpath: Option<String>,
    pub resource_id: Option<String>,
    pub bounds: Option<(i32, i32, i32, i32)>,
    pub action: String,
    pub timeout_ms: Option<u64>,
    pub retry_count: Option<u32>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// 链式执行规格
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainSpecV3 {
    pub chain_id: String,
    pub ordered_steps: Vec<SingleStepSpecV3>,
    pub threshold: f64,
    pub short_circuit: bool,
    pub max_execution_time_ms: Option<u64>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// 静态执行规格 - 修复缺失字段问题
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticSpecV3 {
    pub strategy_id: String,
    pub step_id: String,
    pub locators: StaticLocators,
    pub action: String,
    pub timeout_ms: Option<u64>,
    pub retry_count: Option<u32>,
    pub wait_for_element: bool,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// 静态定位器集合
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticLocators {
    pub xpath: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<String>,
    pub bounds: Option<(i32, i32, i32, i32)>,
    pub class_name: Option<String>,
    pub content_desc: Option<String>,
}

/// 统一任务类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TaskV3 {
    #[serde(rename = "single_step")]
    Step { step: SingleStepSpecV3 },
    
    #[serde(rename = "chain")]
    Chain { spec: ChainSpecV3 },
    
    #[serde(rename = "static")]
    Static { spec: StaticSpecV3 },
}

impl TaskV3 {
    /// 获取任务ID
    pub fn task_id(&self) -> &str {
        match self {
            TaskV3::Step { step } => &step.step_id,
            TaskV3::Chain { spec } => &spec.chain_id,
            TaskV3::Static { spec } => &spec.step_id,
        }
    }
    
    /// 获取任务类型名称
    pub fn task_type(&self) -> &'static str {
        match self {
            TaskV3::Step { .. } => "single_step",
            TaskV3::Chain { .. } => "chain",
            TaskV3::Static { .. } => "static",
        }
    }
}