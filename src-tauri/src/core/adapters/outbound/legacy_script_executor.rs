// src-tauri/src/core/adapters/outbound/legacy_script_executor.rs
// module: core/adapters/outbound | layer: adapters | role: script-execution
// summary: 遗留脚本执行器 - 桥接到现有的 SmartScriptExecutor

use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error};

use crate::core::domain::script::{
    Script, ScriptStep, StepAction, StepType,
    ScriptExecutor, ScriptExecutionResult, StepExecutionResult, ExecutionStatus,
};
use crate::core::shared::{CoreResult};

// 桥接到现有执行系统
use crate::services::smart_script_executor::SmartScriptExecutor;
use crate::services::execution::model::{SmartScriptStep, SmartActionType};

/// 遗留脚本执行器
/// 
/// 桥接到现有的 SmartScriptExecutor 执行系统
pub struct LegacyScriptExecutor {
    status: Arc<RwLock<ExecutionStatus>>,
}

impl LegacyScriptExecutor {
    pub fn new() -> Self {
        Self {
            status: Arc::new(RwLock::new(ExecutionStatus::Idle)),
        }
    }

    /// 创建指定设备的执行器
    fn create_executor(device_id: &str) -> SmartScriptExecutor {
        SmartScriptExecutor::new(device_id.to_string())
    }

    /// 将六边形架构的 ScriptStep 转换为现有的 SmartScriptStep
    fn convert_step(step: &ScriptStep, order: usize) -> SmartScriptStep {
        let (action_type, parameters) = Self::convert_action(&step.action);
        
        SmartScriptStep {
            id: step.id.clone(),
            step_type: action_type,
            name: step.name.clone(),
            description: step.description.clone(),
            parameters,
            enabled: step.enabled,
            order: order as i32,
        }
    }

    /// 将六边形架构的 StepAction 转换为 SmartActionType 和参数
    fn convert_action(action: &StepAction) -> (SmartActionType, serde_json::Value) {
        match action {
            StepAction::Click(target) => {
                let mut params = serde_json::Map::new();
                if let Some(ref xpath) = target.xpath {
                    params.insert("xpath".to_string(), serde_json::json!(xpath));
                }
                if let Some((x, y)) = target.coordinates {
                    params.insert("x".to_string(), serde_json::json!(x));
                    params.insert("y".to_string(), serde_json::json!(y));
                }
                if let Some(ref text) = target.text_match {
                    params.insert("text".to_string(), serde_json::json!(text));
                }
                if let Some(ref res_id) = target.resource_id {
                    params.insert("resource_id".to_string(), serde_json::json!(res_id));
                }
                (SmartActionType::Tap, serde_json::Value::Object(params))
            }
            StepAction::Input(input) => {
                let mut params = serde_json::Map::new();
                params.insert("text".to_string(), serde_json::json!(input.text));
                params.insert("clear_first".to_string(), serde_json::json!(input.clear_first));
                if let Some(ref xpath) = input.target.xpath {
                    params.insert("xpath".to_string(), serde_json::json!(xpath));
                }
                if let Some((x, y)) = input.target.coordinates {
                    params.insert("x".to_string(), serde_json::json!(x));
                    params.insert("y".to_string(), serde_json::json!(y));
                }
                (SmartActionType::Input, serde_json::Value::Object(params))
            }
            StepAction::Swipe(swipe) => {
                let mut params = serde_json::Map::new();
                params.insert("start_x".to_string(), serde_json::json!(swipe.start.0));
                params.insert("start_y".to_string(), serde_json::json!(swipe.start.1));
                params.insert("end_x".to_string(), serde_json::json!(swipe.end.0));
                params.insert("end_y".to_string(), serde_json::json!(swipe.end.1));
                params.insert("duration".to_string(), serde_json::json!(swipe.duration_ms));
                (SmartActionType::Swipe, serde_json::Value::Object(params))
            }
            StepAction::Wait(wait) => {
                let mut params = serde_json::Map::new();
                params.insert("duration_ms".to_string(), serde_json::json!(wait.duration_ms));
                (SmartActionType::Wait, serde_json::Value::Object(params))
            }
            StepAction::Back => {
                let mut params = serde_json::Map::new();
                params.insert("key_code".to_string(), serde_json::json!(4)); // KEYCODE_BACK
                (SmartActionType::KeyEvent, serde_json::Value::Object(params))
            }
            StepAction::Screenshot => {
                (SmartActionType::Unknown, serde_json::json!({}))
            }
            StepAction::Custom(cmd) => {
                // 🤖 根据 command_type 映射到正确的 AI Agent 操作类型
                let action_type = match cmd.command_type.as_str() {
                    "launch_app" => SmartActionType::AiLaunchApp,
                    "find_elements" => SmartActionType::AiFindElements,
                    "tap_relative" => SmartActionType::AiTapRelative,
                    "extract_comments" => SmartActionType::AiExtractComments,
                    _ => SmartActionType::AiCustomCommand,
                };
                let mut params = serde_json::Map::new();
                params.insert("command_type".to_string(), serde_json::json!(cmd.command_type));
                params.insert("params".to_string(), cmd.params.clone());
                (action_type, serde_json::Value::Object(params))
            }
        }
    }
}

impl Default for LegacyScriptExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ScriptExecutor for LegacyScriptExecutor {
    async fn execute(
        &self,
        script: &Script,
        device_id: &str,
    ) -> CoreResult<ScriptExecutionResult> {
        info!("🚀 执行脚本: {} on {} (通过 SmartScriptExecutor 桥接)", script.name, device_id);
        
        *self.status.write().await = ExecutionStatus::Running;
        
        let start = std::time::Instant::now();
        let mut step_results = Vec::new();
        let mut failed_step = None;
        let mut success = true;
        
        // 创建执行器
        let _executor = Self::create_executor(device_id);
        
        for (index, step) in script.steps.iter().enumerate() {
            if !step.enabled {
                info!("⏭️ 跳过禁用的步骤: {}", step.name);
                continue;
            }
            
            let step_result = self.execute_step_with_order(step, device_id, index).await;
            
            match step_result {
                Ok(result) => {
                    if !result.success {
                        failed_step = Some(index);
                        success = false;
                        step_results.push(result);
                        
                        if !script.config.continue_on_error {
                            break;
                        }
                    } else {
                        step_results.push(result);
                    }
                }
                Err(e) => {
                    error!("❌ 步骤 {} 执行错误: {}", step.name, e);
                    failed_step = Some(index);
                    success = false;
                    step_results.push(StepExecutionResult {
                        step_id: step.id.clone(),
                        step_name: step.name.clone(),
                        success: false,
                        elapsed_ms: 0,
                        error: Some(e.to_string()),
                        screenshot: None,
                    });
                    
                    if !script.config.continue_on_error {
                        break;
                    }
                }
            }
        }
        
        *self.status.write().await = ExecutionStatus::Idle;
        
        let elapsed = start.elapsed().as_millis() as u64;
        info!("✅ 脚本执行完成: 成功={}, 用时={}ms", success, elapsed);
        
        Ok(ScriptExecutionResult {
            script_id: script.id.clone(),
            device_id: device_id.to_string(),
            success,
            total_steps: script.steps.len(),
            completed_steps: step_results.iter().filter(|r| r.success).count(),
            failed_step,
            elapsed_ms: elapsed,
            error: failed_step.map(|i| format!("步骤 {} 执行失败", i + 1)),
            step_results,
        })
    }

    async fn execute_step(
        &self,
        step: &ScriptStep,
        device_id: &str,
    ) -> CoreResult<StepExecutionResult> {
        // 调用带 order 的版本，默认 order 为 0
        self.execute_step_with_order(step, device_id, 0).await
    }

    async fn stop(&self) -> CoreResult<()> {
        info!("⏹️ 停止执行");
        *self.status.write().await = ExecutionStatus::Stopping;
        Ok(())
    }

    async fn get_status(&self) -> ExecutionStatus {
        *self.status.read().await
    }
}

impl LegacyScriptExecutor {
    async fn execute_step_with_order(
        &self,
        step: &ScriptStep,
        device_id: &str,
        order: usize,
    ) -> CoreResult<StepExecutionResult> {
        info!("▶️ 执行步骤: {} on {} (类型: {:?})", step.name, device_id, step.action);
        
        let start = std::time::Instant::now();
        
        // 转换为 SmartScriptStep
        let smart_step = Self::convert_step(step, order);
        
        // 创建执行器并执行
        let executor = Self::create_executor(device_id);
        
        match executor.execute_single_step(smart_step).await {
            Ok(result) => {
                info!("✅ 步骤执行成功: {} ({}ms)", step.name, result.duration_ms);
                Ok(StepExecutionResult {
                    step_id: step.id.clone(),
                    step_name: step.name.clone(),
                    success: result.success,
                    elapsed_ms: result.duration_ms,
                    error: if result.success { None } else { Some(result.message) },
                    screenshot: result.page_state,
                })
            }
            Err(e) => {
                error!("❌ 步骤执行失败: {} - {}", step.name, e);
                Ok(StepExecutionResult {
                    step_id: step.id.clone(),
                    step_name: step.name.clone(),
                    success: false,
                    elapsed_ms: start.elapsed().as_millis() as u64,
                    error: Some(e.to_string()),
                    screenshot: None,
                })
            }
        }
    }
}
