// src-tauri/src/exec/v3_new/core/executor.rs
// module: exec | layer: application | role: 统一执行器接口
// summary: 定义V3执行器的统一接口，支持不同类型的执行引擎

use async_trait::async_trait;
use tauri::AppHandle;
use anyhow::Result;

use crate::exec::v3_new::types::*;

/// 统一的V3执行器接口
#[async_trait]
pub trait V3Executor: Send + Sync {
    /// 执行器类型名称
    fn executor_type(&self) -> &'static str;
    
    /// 验证规格是否有效
    async fn validate_spec(&self, spec: &TaskV3) -> Result<()>;
    
    /// 执行任务
    async fn execute(
        &self,
        app: &AppHandle,
        context: &ContextEnvelope,
        task: &TaskV3,
    ) -> Result<ExecutionResult>;
    
    /// 估算执行时间（可选实现）
    async fn estimate_execution_time(&self, task: &TaskV3) -> Result<u64> {
        // 默认实现：根据任务类型返回估算时间
        let base_time = match task {
            TaskV3::Step { .. } => 5000,      // 5秒
            TaskV3::Static { .. } => 3000,    // 3秒
            TaskV3::Chain { spec } => {
                // 链式执行：每步5秒
                spec.ordered_steps.len() as u64 * 5000
            }
        };
        Ok(base_time)
    }
    
    /// 检查是否支持指定任务类型
    fn supports_task(&self, task: &TaskV3) -> bool;
    
    /// 获取执行器优先级（数值越小优先级越高）
    fn priority(&self) -> u8 {
        100 // 默认优先级
    }
}

/// 单步执行器接口
#[async_trait]
pub trait SingleStepExecutor: V3Executor {
    async fn execute_single_step(
        &self,
        app: &AppHandle,
        context: &ContextEnvelope,
        spec: &SingleStepSpecV3,
    ) -> Result<ExecutionResult>;
}

/// 链式执行器接口
#[async_trait]
pub trait ChainExecutor: V3Executor {
    async fn execute_chain(
        &self,
        app: &AppHandle,
        context: &ContextEnvelope,
        spec: &ChainSpecV3,
    ) -> Result<ExecutionResult>;
    
    /// 评估单个步骤
    async fn evaluate_step(
        &self,
        app: &AppHandle,
        context: &ContextEnvelope,
        step: &SingleStepSpecV3,
    ) -> Result<StepScore>;
    
    /// 检查是否应该短路退出
    fn should_short_circuit(&self, scores: &[StepScore], threshold: f64) -> bool {
        if let Some(last_score) = scores.last() {
            !last_score.meets_threshold(threshold)
        } else {
            false
        }
    }
}

/// 静态执行器接口
#[async_trait]
pub trait StaticExecutor: V3Executor {
    async fn execute_static(
        &self,
        app: &AppHandle,
        context: &ContextEnvelope,
        spec: &StaticSpecV3,
    ) -> Result<ExecutionResult>;
    
    /// 验证定位器
    async fn validate_locators(&self, locators: &StaticLocators) -> Result<()>;
}

/// 执行器工厂接口
pub trait ExecutorFactory: Send + Sync {
    /// 创建适合指定任务的执行器
    fn create_executor(&self, task: &TaskV3) -> Result<Box<dyn V3Executor>>;
    
    /// 获取所有可用的执行器
    fn available_executors(&self) -> Vec<&'static str>;
    
    /// 检查是否支持指定任务类型
    fn supports_task_type(&self, task_type: &str) -> bool;
}

/// 执行器性能统计
#[derive(Debug, Clone)]
pub struct ExecutorStats {
    pub executor_type: String,
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub total_execution_time_ms: u64,
    pub average_execution_time_ms: f64,
}

impl ExecutorStats {
    pub fn new(executor_type: &str) -> Self {
        Self {
            executor_type: executor_type.to_string(),
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            total_execution_time_ms: 0,
            average_execution_time_ms: 0.0,
        }
    }
    
    pub fn record_execution(&mut self, success: bool, execution_time_ms: u64) {
        self.total_executions += 1;
        self.total_execution_time_ms += execution_time_ms;
        
        if success {
            self.successful_executions += 1;
        } else {
            self.failed_executions += 1;
        }
        
        self.average_execution_time_ms = 
            self.total_execution_time_ms as f64 / self.total_executions as f64;
    }
    
    pub fn success_rate(&self) -> f64 {
        if self.total_executions == 0 {
            0.0
        } else {
            self.successful_executions as f64 / self.total_executions as f64
        }
    }
}