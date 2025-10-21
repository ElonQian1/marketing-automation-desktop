// src-tauri/src/exec/v3_new/types/context.rs
// module: exec | layer: domain | role: 执行上下文定义
// summary: 统一的执行上下文管理，确保参数完整性

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 执行上下文包装器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextEnvelope {
    pub device_id: String,
    pub session_id: String,
    pub constraints: ExecutionConstraints,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// 执行约束条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionConstraints {
    /// 全局超时时间（毫秒）
    pub timeout_ms: u64,
    /// 最大重试次数
    pub max_retries: u32,
    /// 是否要求屏幕变化
    pub require_screen_change: bool,
    /// 是否启用智能等待
    pub enable_smart_wait: bool,
    /// 是否启用截图验证
    pub enable_screenshot_validation: bool,
}

impl ContextEnvelope {
    /// 创建新的上下文包装器
    pub fn new(device_id: &str, session_id: &str) -> Self {
        Self {
            device_id: device_id.to_string(),
            session_id: session_id.to_string(),
            constraints: ExecutionConstraints::default(),
            metadata: HashMap::new(),
        }
    }
    
    /// 设置超时时间
    pub fn with_timeout(mut self, timeout_ms: u64) -> Self {
        self.constraints.timeout_ms = timeout_ms;
        self
    }
    
    /// 设置最大重试次数
    pub fn with_max_retries(mut self, max_retries: u32) -> Self {
        self.constraints.max_retries = max_retries;
        self
    }
    
    /// 设置是否要求屏幕变化
    pub fn with_screen_change_required(mut self, required: bool) -> Self {
        self.constraints.require_screen_change = required;
        self
    }
    
    /// 添加元数据
    pub fn with_metadata(mut self, key: &str, value: serde_json::Value) -> Self {
        self.metadata.insert(key.to_string(), value);
        self
    }
    
    /// 获取设备ID
    pub fn device_id(&self) -> &str {
        &self.device_id
    }
    
    /// 获取会话ID
    pub fn session_id(&self) -> &str {
        &self.session_id
    }
    
    /// 获取约束条件
    pub fn constraints(&self) -> &ExecutionConstraints {
        &self.constraints
    }
    
    /// 获取元数据
    pub fn metadata(&self, key: &str) -> Option<&serde_json::Value> {
        self.metadata.get(key)
    }
}

impl ExecutionConstraints {
    /// 创建默认约束
    pub fn new() -> Self {
        Self {
            timeout_ms: 30000,  // 30秒默认超时
            max_retries: 3,
            require_screen_change: false,
            enable_smart_wait: true,
            enable_screenshot_validation: false,
        }
    }
    
    /// 创建严格约束（用于生产环境）
    pub fn strict() -> Self {
        Self {
            timeout_ms: 15000,  // 15秒超时
            max_retries: 1,     // 只重试1次
            require_screen_change: true,
            enable_smart_wait: true,
            enable_screenshot_validation: true,
        }
    }
    
    /// 创建宽松约束（用于测试环境）
    pub fn lenient() -> Self {
        Self {
            timeout_ms: 60000,  // 60秒超时
            max_retries: 5,     // 重试5次
            require_screen_change: false,
            enable_smart_wait: true,
            enable_screenshot_validation: false,
        }
    }
    
    /// 检查是否超时
    pub fn is_timeout(&self, elapsed_ms: u64) -> bool {
        elapsed_ms >= self.timeout_ms
    }
    
    /// 检查是否还能重试
    pub fn can_retry(&self, current_attempt: u32) -> bool {
        current_attempt < self.max_retries
    }
    
    /// 获取剩余超时时间
    pub fn remaining_timeout(&self, elapsed_ms: u64) -> u64 {
        if elapsed_ms >= self.timeout_ms {
            0
        } else {
            self.timeout_ms - elapsed_ms
        }
    }
}

impl Default for ExecutionConstraints {
    fn default() -> Self {
        Self::new()
    }
}

/// 执行状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionState {
    pub start_time: u64,
    pub current_step: Option<String>,
    pub attempt_count: u32,
    pub last_error: Option<String>,
    pub screen_changed: bool,
}

impl ExecutionState {
    /// 创建新的执行状态
    pub fn new() -> Self {
        Self {
            start_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            current_step: None,
            attempt_count: 0,
            last_error: None,
            screen_changed: false,
        }
    }
    
    /// 开始新步骤
    pub fn start_step(&mut self, step_id: &str) {
        self.current_step = Some(step_id.to_string());
        self.attempt_count = 0;
        self.last_error = None;
    }
    
    /// 记录重试
    pub fn record_retry(&mut self, error: &str) {
        self.attempt_count += 1;
        self.last_error = Some(error.to_string());
    }
    
    /// 记录屏幕变化
    pub fn record_screen_change(&mut self) {
        self.screen_changed = true;
    }
    
    /// 获取已用时间
    pub fn elapsed_ms(&self) -> u64 {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        now - self.start_time
    }
}

impl Default for ExecutionState {
    fn default() -> Self {
        Self::new()
    }
}