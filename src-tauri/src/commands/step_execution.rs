// src-tauri/src/commands/step_execution.rs
// module: commands | layer: application | role: 步骤执行命令
// summary: 统一的步骤执行管道，支持匹配+动作

use serde::{Deserialize, Serialize};
use tauri::command;
use tracing::{info, warn, error};
use crate::types::action_types::{ActionType, ActionResult, ActionContext, ElementBounds};
use crate::services::action_executor::ActionExecutor;
use crate::commands::strategy_matching::{match_element_by_criteria, MatchCriteriaDTO};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepExecutionRequest {
    pub device_id: String,
    pub step: StepDefinition,
    pub mode: ExecutionMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepDefinition {
    pub id: String,
    pub name: String,
    pub selector: MatchCriteriaDTO,
    pub action: ActionType,
    pub strategy: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExecutionMode {
    #[serde(rename = "match-only")]
    MatchOnly,
    #[serde(rename = "execute-step")]
    ExecuteStep,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepExecutionResult {
    pub success: bool,
    pub step_id: String,
    pub message: String,
    pub duration_ms: u64,
    pub matched_element: Option<MatchedElementInfo>,
    pub action_result: Option<ActionResult>,
    pub logs: Vec<String>,
    pub error_details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchedElementInfo {
    pub bounds: ElementBounds,
    pub confidence: f64,
    pub strategy_used: String,
}

#[command]
pub async fn run_step(request: StepExecutionRequest) -> Result<StepExecutionResult, String> {
    let start_time = Instant::now();
    let step_name = &request.step.name;
    let device_id = &request.device_id;
    
    info!("🚀 开始执行步骤: {} (设备: {}, 模式: {:?})", step_name, device_id, request.mode);
    
    let mut logs = Vec::new();
    logs.push(format!("开始执行步骤: {}", step_name));
    
    // 步骤1：匹配元素
    info!("🔍 步骤1：匹配元素");
    logs.push("步骤1：元素匹配".to_string());
    
    let match_result = match match_element_by_criteria(
        device_id.clone(),
        request.step.selector.clone()
    ).await {
        Ok(result) => result,
        Err(e) => {
            error!("元素匹配失败: {}", e);
            return Ok(StepExecutionResult {
                success: false,
                step_id: request.step.id,
                message: format!("元素匹配失败: {}", e),
                duration_ms: start_time.elapsed().as_millis() as u64,
                matched_element: None,
                action_result: None,
                logs,
                error_details: Some(e),
            });
        }
    };
    
    if !match_result.ok {
        warn!("元素匹配未成功: {}", match_result.message);
        return Ok(StepExecutionResult {
            success: false,
            step_id: request.step.id,
            message: format!("元素匹配失败: {}", match_result.message),
            duration_ms: start_time.elapsed().as_millis() as u64,
            matched_element: None,
            action_result: None,
            logs,
            error_details: Some(match_result.message),
        });
    }
    
    logs.push("✅ 元素匹配成功".to_string());
    
    // 解析匹配结果中的边界信息
    let element_bounds = match parse_bounds_from_match_result(&match_result) {
        Some(bounds) => bounds,
        None => {
            warn!("无法解析元素边界信息");
            return Ok(StepExecutionResult {
                success: false,
                step_id: request.step.id,
                message: "匹配成功但无法解析元素边界".to_string(),
                duration_ms: start_time.elapsed().as_millis() as u64,
                matched_element: None,
                action_result: None,
                logs,
                error_details: Some("无法解析元素边界".to_string()),
            });
        }
    };
    
    let matched_element = MatchedElementInfo {
        bounds: element_bounds.clone(),
        confidence: match_result.confidence_score,
        strategy_used: request.step.strategy.clone(),
    };
    
    // 如果是仅匹配模式，到此结束
    if matches!(request.mode, ExecutionMode::MatchOnly) {
        info!("🎯 仅匹配模式，跳过动作执行");
        logs.push("仅匹配模式，完成".to_string());
        return Ok(StepExecutionResult {
            success: true,
            step_id: request.step.id,
            message: format!("元素匹配成功，置信度: {:.2}", matched_element.confidence),
            duration_ms: start_time.elapsed().as_millis() as u64,
            matched_element: Some(matched_element),
            action_result: None,
            logs,
            error_details: None,
        });
    }
    
    // 步骤2：执行动作
    info!("🎯 步骤2：执行动作 ({:?})", request.step.action);
    logs.push(format!("步骤2：执行动作 - {}", request.step.action.type_id()));
    
    let action_context = ActionContext {
        device_id: device_id.clone(),
        target_bounds: Some(element_bounds),
        timeout: Some(5000), // 5秒超时
        verify_with_screenshot: None,
    };
    
    let executor = ActionExecutor::new();
    let action_result = match executor.execute_action(&request.step.action, &action_context).await {
        Ok(result) => result,
        Err(e) => {
            error!("动作执行失败: {}", e);
            return Ok(StepExecutionResult {
                success: false,
                step_id: request.step.id,
                message: format!("动作执行失败: {}", e),
                duration_ms: start_time.elapsed().as_millis() as u64,
                matched_element: Some(matched_element),
                action_result: None,
                logs,
                error_details: Some(e.to_string()),
            });
        }
    };
    
    if action_result.success {
        logs.push("✅ 动作执行成功".to_string());
        info!("✅ 步骤执行完成: {}", step_name);
    } else {
        logs.push("❌ 动作执行失败".to_string());
        warn!("❌ 步骤执行失败: {}", step_name);
    }
    
    Ok(StepExecutionResult {
        success: action_result.success,
        step_id: request.step.id,
        message: format!("匹配成功 → {}", action_result.message),
        duration_ms: start_time.elapsed().as_millis() as u64,
        matched_element: Some(matched_element),
        action_result: Some(action_result),
        logs,
        error_details: None,
    })
}

// 从匹配结果中解析边界信息
fn parse_bounds_from_match_result(match_result: &crate::commands::strategy_matching::MatchResult) -> Option<ElementBounds> {
    // 尝试从匹配结果中提取边界信息
    for element in &match_result.matched_elements {
        if let Some(bounds_str) = element.get("bounds").and_then(|v| v.as_str()) {
            return parse_bounds_string(bounds_str);
        }
    }
    
    // 如果上述方法失败，尝试其他方式
    None
}

// 解析边界字符串，例如 "[100,200][300,400]"
fn parse_bounds_string(bounds_str: &str) -> Option<ElementBounds> {
    // 简单的边界字符串解析
    if let Some(captures) = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")
        .ok()?
        .captures(bounds_str) {
        let left: i32 = captures.get(1)?.as_str().parse().ok()?;
        let top: i32 = captures.get(2)?.as_str().parse().ok()?;
        let right: i32 = captures.get(3)?.as_str().parse().ok()?;
        let bottom: i32 = captures.get(4)?.as_str().parse().ok()?;
        
        Some(ElementBounds::new(left, top, right, bottom))
    } else {
        None
    }
}