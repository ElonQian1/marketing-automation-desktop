// src-tauri/src/exec/v3/unified_step_executor.rs
// module: exec | layer: v3 | role: 统一步骤执行器
// summary: 同时服务于智能单步和智能自动链的统一执行引擎

use serde_json::Value;
use tauri::AppHandle;

use super::types::*;
use super::helpers::step_executor;

/// 统一的步骤执行结果
#[derive(Debug, Clone)]
pub struct StepExecutionResult {
    pub coords: (i32, i32),
    pub confidence: f32,
    pub executed: bool,
    pub details: Option<Value>,
}

/// 🎯 统一的步骤执行器
/// 
/// 同时服务于：
/// 1. 智能单步执行 (execute_single_step_test_v3)
/// 2. 智能自动链执行 (execute_chain_test_v3 中的每个步骤)
/// 
/// 功能特性：
/// - ✅ 从 STEP_STRATEGY_STORE 读取智能分析配置
/// - ✅ 支持批量执行 (BatchExecutor)
/// - ✅ 支持多候选评估 (MultiCandidateEvaluator)
/// - ✅ 支持结构签名 (structural_signatures)
/// - ✅ 统一错误处理和日志
pub async fn execute_step_unified(
    _app: &AppHandle,
    envelope: &ContextEnvelope,
    inline_step: &InlineStep,
    ui_xml: &str,
    _validation: &ValidationSettings,
) -> Result<StepExecutionResult, String> {
    
    tracing::info!("🎯 [统一执行器] 开始执行步骤: {}", inline_step.step_id);
    
    // 调用现有的智能分析步骤执行器
    // 这个执行器已经包含了所有高级功能：
    // - 从 STEP_STRATEGY_STORE 读取配置
    // - 批量执行模式
    // - 多候选评估
    // - 结构签名匹配
    let (coords_x, coords_y) = step_executor::execute_intelligent_analysis_step(
        &envelope.device_id,
        inline_step,
        ui_xml,
    )
    .await
    .map_err(|e| {
        tracing::error!("❌ [统一执行器] 步骤执行失败: {}", e);
        e
    })?;
    
    tracing::info!(
        "✅ [统一执行器] 步骤执行成功: {} -> ({}, {})",
        inline_step.step_id,
        coords_x,
        coords_y
    );
    
    Ok(StepExecutionResult {
        coords: (coords_x, coords_y),
        confidence: 0.85, // TODO: 从执行结果中提取实际置信度
        executed: true,
        details: None,
    })
}

/// 🔧 辅助函数：从 InlineStep 构造 SingleStepSpecV3
pub fn inline_step_to_single_step_spec(
    inline_step: &InlineStep,
    quality: &QualitySettings,
    constraints: &ConstraintSettings,
    validation: &ValidationSettings,
) -> SingleStepSpecV3 {
    SingleStepSpecV3::ByInline {
        step_id: inline_step.step_id.clone(),
        action: inline_step.action.clone(),
        params: inline_step.params.clone(),
        quality: quality.clone(),
        constraints: constraints.clone(),
        validation: validation.clone(),
    }
}
