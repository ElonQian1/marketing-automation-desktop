// src-tauri/src/exec/v3_new/types/results.rs
// module: exec | layer: domain | role: 执行结果类型定义
// summary: 统一的执行结果类型，解决字段不匹配问题

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 统一的执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    /// 执行是否成功
    pub success: bool,
    /// 结果消息
    pub message: String,
    /// 执行时间（毫秒）
    pub execution_time_ms: u64,
    /// 结果数据
    pub data: Option<serde_json::Value>,
    /// 步骤评分（链式执行时使用）
    pub scores: Option<Vec<StepScore>>,
    /// 元素信息（定位成功时使用）
    pub element_info: Option<ElementInfo>,
    /// 执行元数据
    pub metadata: HashMap<String, serde_json::Value>,
}

/// 步骤评分信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepScore {
    pub step_id: String,
    pub strategy_name: String,
    pub confidence: f64,
    pub execution_time_ms: u64,
    pub success: bool,
    pub error_message: Option<String>,
    pub element_found: bool,
    pub action_completed: bool,
}

/// 元素信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementInfo {
    pub xpath: Option<String>,
    pub resource_id: Option<String>,
    pub text: Option<String>,
    pub class_name: Option<String>,
    pub content_desc: Option<String>,
    pub bounds: Option<(i32, i32, i32, i32)>,
    pub center: Option<(i32, i32)>,
    pub clickable: bool,
    pub enabled: bool,
    pub visible: bool,
}

/// 点击坐标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

impl ExecutionResult {
    /// 创建成功结果
    pub fn success(message: &str, execution_time_ms: u64) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            execution_time_ms,
            data: None,
            scores: None,
            element_info: None,
            metadata: HashMap::new(),
        }
    }
    
    /// 创建失败结果
    pub fn failure(message: &str, execution_time_ms: u64) -> Self {
        Self {
            success: false,
            message: message.to_string(),
            execution_time_ms,
            data: None,
            scores: None,
            element_info: None,
            metadata: HashMap::new(),
        }
    }
    
    /// 添加数据
    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data);
        self
    }
    
    /// 添加元素信息
    pub fn with_element_info(mut self, element_info: ElementInfo) -> Self {
        self.element_info = Some(element_info);
        self
    }
    
    /// 添加步骤评分
    pub fn with_scores(mut self, scores: Vec<StepScore>) -> Self {
        self.scores = Some(scores);
        self
    }
    
    /// 添加元数据
    pub fn with_metadata(mut self, key: &str, value: serde_json::Value) -> Self {
        self.metadata.insert(key.to_string(), value);
        self
    }
    
    /// 获取点击坐标
    pub fn get_click_point(&self) -> Option<Point> {
        self.element_info.as_ref()?.center.map(|(x, y)| Point { x, y })
    }
    
    /// 检查是否找到元素
    pub fn element_found(&self) -> bool {
        self.element_info.is_some()
    }
    
    /// 获取执行耗时描述
    pub fn execution_time_description(&self) -> String {
        if self.execution_time_ms < 1000 {
            format!("{}ms", self.execution_time_ms)
        } else {
            format!("{:.1}s", self.execution_time_ms as f64 / 1000.0)
        }
    }
}

impl StepScore {
    /// 创建成功的步骤评分
    pub fn success(
        step_id: &str,
        strategy_name: &str,
        confidence: f64,
        execution_time_ms: u64,
        element_found: bool,
    ) -> Self {
        Self {
            step_id: step_id.to_string(),
            strategy_name: strategy_name.to_string(),
            confidence,
            execution_time_ms,
            success: true,
            error_message: None,
            element_found,
            action_completed: true,
        }
    }
    
    /// 创建失败的步骤评分
    pub fn failure(
        step_id: &str,
        strategy_name: &str,
        execution_time_ms: u64,
        error_message: &str,
    ) -> Self {
        Self {
            step_id: step_id.to_string(),
            strategy_name: strategy_name.to_string(),
            confidence: 0.0,
            execution_time_ms,
            success: false,
            error_message: Some(error_message.to_string()),
            element_found: false,
            action_completed: false,
        }
    }
    
    /// 检查是否达到阈值
    pub fn meets_threshold(&self, threshold: f64) -> bool {
        self.success && self.confidence >= threshold
    }
}

impl ElementInfo {
    /// 创建元素信息
    pub fn new() -> Self {
        Self {
            xpath: None,
            resource_id: None,
            text: None,
            class_name: None,
            content_desc: None,
            bounds: None,
            center: None,
            clickable: false,
            enabled: false,
            visible: false,
        }
    }
    
    /// 计算中心点
    pub fn calculate_center(&mut self) {
        if let Some((left, top, right, bottom)) = self.bounds {
            self.center = Some(((left + right) / 2, (top + bottom) / 2));
        }
    }
    
    /// 获取元素描述
    pub fn description(&self) -> String {
        let mut parts = Vec::new();
        
        if let Some(text) = &self.text {
            parts.push(format!("text='{}'", text));
        }
        if let Some(resource_id) = &self.resource_id {
            parts.push(format!("resource-id='{}'", resource_id));
        }
        if let Some(class_name) = &self.class_name {
            parts.push(format!("class='{}'", class_name));
        }
        
        if parts.is_empty() {
            "未知元素".to_string()
        } else {
            parts.join(", ")
        }
    }
}

impl Default for ElementInfo {
    fn default() -> Self {
        Self::new()
    }
}