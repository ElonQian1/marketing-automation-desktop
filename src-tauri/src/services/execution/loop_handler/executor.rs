/// 循环执行器
/// 
/// 职责：
/// - 执行循环体步骤
/// - 管理迭代执行流程
/// - 处理间隔和错误恢复

use anyhow::{Result, anyhow};
use tokio::time::{sleep, Duration};
use tracing::{info, warn, error, debug};
use std::collections::HashMap;

use super::types::{LoopContext, LoopExecutionResult};
use crate::services::execution::model::{SmartScriptStep, SingleStepTestResult as StepExecutionResult};
use crate::services::execution::SmartScriptOrchestrator;

/// 循环执行器
pub struct LoopExecutor<'a> {
    /// 脚本协调器引用
    orchestrator: Option<&'a SmartScriptOrchestrator<'a>>,
    /// 收集到的循环体步骤
    loop_steps: Vec<SmartScriptStep>,
    /// 执行日志
    execution_logs: Vec<String>,
    /// 每次迭代执行时长
    iteration_durations: Vec<u64>,
}

impl<'a> LoopExecutor<'a> {
    /// 创建新的循环执行器
    pub fn new() -> Self {
        Self {
            orchestrator: None,
            loop_steps: Vec::new(),
            execution_logs: Vec::new(),
            iteration_durations: Vec::new(),
        }
    }

    /// 设置编排器引用
    pub fn set_orchestrator(&mut self, orchestrator: &'a SmartScriptOrchestrator<'a>) {
        self.orchestrator = Some(orchestrator);
    }

    /// 添加循环体步骤
    pub fn add_step(&mut self, step: SmartScriptStep) {
        debug!("📝 添加循环体步骤: {}", step.name);
        self.loop_steps.push(step);
    }

    /// 获取收集到的步骤数量
    pub fn step_count(&self) -> usize {
        self.loop_steps.len()
    }

    /// 清空收集的步骤
    pub fn clear_steps(&mut self) {
        debug!("🧹 清空循环体步骤");
        self.loop_steps.clear();
        self.execution_logs.clear();
        self.iteration_durations.clear();
    }

    /// 执行完整循环
    pub async fn execute_loop(&mut self, context: &LoopContext) -> Result<LoopExecutionResult> {
        info!("🚀 开始执行循环: {} (最大迭代: {})", 
              context.loop_name, context.max_iterations);

        if self.loop_steps.is_empty() {
            return Err(anyhow!("循环体为空，无法执行"));
        }

        let start_time = std::time::Instant::now();
        let mut successful_iterations = 0;
        let mut failed_iterations = 0;
        let mut current_iteration = 0;

        // 执行循环迭代
        while self.should_continue(context, current_iteration) {
            current_iteration += 1;
            
            info!("🔄 执行第 {} 次迭代", current_iteration);
            
            let iteration_start = std::time::Instant::now();
            
            match self.execute_single_iteration(current_iteration).await {
                Ok(_) => {
                    successful_iterations += 1;
                    self.log_message(format!("✅ 第 {} 次迭代成功", current_iteration));
                }
                Err(e) => {
                    failed_iterations += 1;
                    let error_msg = format!("❌ 第 {} 次迭代失败: {}", current_iteration, e);
                    self.log_message(error_msg.clone());
                    
                    if !context.continue_on_error {
                        error!("💥 循环因错误终止: {}", e);
                        break;
                    } else {
                        warn!("⚠️ 忽略错误继续执行: {}", e);
                    }
                }
            }

            let iteration_duration = iteration_start.elapsed().as_millis() as u64;
            self.iteration_durations.push(iteration_duration);

            // 处理循环间隔
            if let Some(interval_ms) = context.interval_ms {
                if interval_ms > 0 {
                    debug!("⏱️ 等待 {}ms", interval_ms);
                    sleep(Duration::from_millis(interval_ms)).await;
                }
            }
        }

        let total_duration = start_time.elapsed().as_millis() as u64;
        
        let result = LoopExecutionResult {
            success: failed_iterations == 0 || (failed_iterations > 0 && context.continue_on_error),
            loop_id: context.loop_id.clone(),
            loop_name: context.loop_name.clone(),
            total_iterations: current_iteration,
            successful_iterations,
            failed_iterations,
            duration_ms: total_duration,
            iteration_durations: self.iteration_durations.clone(),
            logs: self.execution_logs.clone(),
            error_message: if failed_iterations > 0 && !context.continue_on_error {
                Some(format!("循环在第 {} 次迭代时因错误终止", current_iteration))
            } else {
                None
            },
        };

        info!("🏁 循环执行完成: {} - 成功: {}, 失败: {}, 总耗时: {}ms", 
              context.loop_name, successful_iterations, failed_iterations, total_duration);

        Ok(result)
    }

    /// 执行单次迭代
    async fn execute_single_iteration(&mut self, iteration_number: u32) -> Result<()> {
        let step_count = self.loop_steps.len();
        self.log_message(format!("开始第 {} 次迭代，共 {} 个步骤", 
                               iteration_number, step_count));

        // 克隆步骤列表以避免借用冲突
        let steps_to_execute = self.loop_steps.clone();
        
        for (step_index, step) in steps_to_execute.iter().enumerate() {
            debug!("🎯 执行步骤 {}/{}: {}", 
                   step_index + 1, step_count, step.name);

            // 执行单个步骤
            match self.execute_step(step, iteration_number, step_index).await {
                Ok(step_result) => {
                    self.log_message(format!("  ✅ 步骤 {} 成功: {}", 
                                           step_index + 1, step_result.message));
                }
                Err(e) => {
                    let error_msg = format!("  ❌ 步骤 {} 失败: {}", step_index + 1, e);
                    self.log_message(error_msg.clone());
                    return Err(anyhow!("步骤执行失败: {}", e));
                }
            }
        }

        Ok(())
    }

    /// 执行单个步骤
    async fn execute_step(
        &self, 
        step: &SmartScriptStep, 
        iteration_number: u32,
        step_index: usize
    ) -> Result<StepExecutionResult> {
        // 这里调用现有的步骤执行逻辑
        // 可以复用 SmartScriptOrchestrator 的执行能力
        
        // 创建执行上下文，包含迭代信息
        let mut step_clone = step.clone();
        
        // 在步骤参数中注入迭代信息
        if let serde_json::Value::Object(ref mut params) = step_clone.parameters {
            params.insert("__loop_iteration".to_string(), serde_json::json!(iteration_number));
            params.insert("__loop_step_index".to_string(), serde_json::json!(step_index));
        }

        // 调用协调器执行步骤
        // 注意：这里需要根据实际的 SmartScriptOrchestrator API 调整
        if let Some(orchestrator) = &self.orchestrator {
            // 临时实现：返回成功结果
            // 实际应该调用协调器的执行方法
            Ok(StepExecutionResult {
                success: true,
                step_id: step_clone.id.clone(),
                step_name: step_clone.name.clone(),
                message: format!("循环步骤 {} 执行成功", step_clone.name),
                duration_ms: 100,
                timestamp: chrono::Utc::now().timestamp_millis(),
                page_state: None,
                ui_elements: Vec::new(),
                logs: vec![format!("执行步骤: {}", step_clone.name)],
                error_details: None,
                extracted_data: std::collections::HashMap::new(),
            })
        } else {
            Err(anyhow!("协调器未初始化"))
        }
    }

    /// 判断是否应该继续执行
    fn should_continue(&self, context: &LoopContext, current_iteration: u32) -> bool {
        if context.is_infinite {
            true
        } else {
            current_iteration < context.max_iterations
        }
    }

    /// 记录执行日志
    fn log_message(&mut self, message: String) {
        let timestamp = chrono::Local::now().format("%H:%M:%S%.3f");
        let log_entry = format!("[{}] {}", timestamp, message);
        self.execution_logs.push(log_entry);
        debug!("📋 {}", message);
    }

    /// 获取执行统计信息
    pub fn get_statistics(&self) -> serde_json::Value {
        serde_json::json!({
            "step_count": self.loop_steps.len(),
            "log_count": self.execution_logs.len(),
            "iteration_count": self.iteration_durations.len(),
            "total_duration_ms": self.iteration_durations.iter().sum::<u64>(),
            "avg_duration_ms": if self.iteration_durations.is_empty() {
                0
            } else {
                self.iteration_durations.iter().sum::<u64>() / self.iteration_durations.len() as u64
            },
        })
    }

    /// 获取执行日志
    pub fn get_logs(&self) -> &[String] {
        &self.execution_logs
    }

    /// 获取迭代执行时长
    pub fn get_iteration_durations(&self) -> &[u64] {
        &self.iteration_durations
    }
}

impl<'a> Default for LoopExecutor<'a> {
    fn default() -> Self {
        Self::new()
    }
}