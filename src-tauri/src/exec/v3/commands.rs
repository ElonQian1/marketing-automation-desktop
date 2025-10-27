// src-tauri/src/exec/v3/commands.rs
// module: exec | layer: application | role: V3 执行命令
// summary: 三条执行链的统一命令入口

use anyhow::Result;
use serde_json::Value;
use tauri::{AppHandle, State};

use super::types::*;
use super::single_step::execute_single_step_internal;
use super::chain_engine::execute_chain; // 启用 V3 智能链执行引擎
use super::static_exec::execute_static;

/// 执行智能单步测试（V3）
#[tauri::command]
pub async fn execute_single_step_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    step: SingleStepSpecV3,
) -> Result<Value, String> {
    let step_id = match &step {
        SingleStepSpecV3::ByRef { step_id, .. } => step_id.clone(),
        SingleStepSpecV3::ByInline { step_id, .. } => step_id.clone(),
    };
    
    tracing::info!("🧪 [V3] 收到智能单步测试请求: stepId={}", step_id);
    
    execute_single_step_internal(&app, &envelope, step)
        .await
        .map_err(|e| e.to_string())
}

/// 执行智能自动链测试（V3）
/// 🚀 V3核心功能：智能短路 + 失败回退 + 90%数据精简
#[tauri::command]
pub async fn execute_chain_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    spec: serde_json::Value, // 🔍 临时使用Value来调试原始JSON
) -> Result<Value, String> {
    // 🔍 调试：打印收到的原始JSON
    tracing::warn!("🔍 [DEBUG] 收到的原始spec JSON: {}", serde_json::to_string_pretty(&spec).unwrap_or_default());
    
    // 🔍 尝试反序列化为ChainSpecV3
    let parsed_spec: ChainSpecV3 = match serde_json::from_value(spec.clone()) {
        Ok(s) => {
            tracing::info!("✅ [DEBUG] ChainSpecV3反序列化成功");
            s
        },
        Err(e) => {
            tracing::error!("❌ [DEBUG] ChainSpecV3反序列化失败: {:?}", e);
            tracing::error!("❌ [DEBUG] 失败的JSON数据: {}", serde_json::to_string_pretty(&spec).unwrap_or_default());
            return Err(format!("ChainSpecV3反序列化失败: {}", e));
        }
    };
    let (analysis_id, threshold) = match &parsed_spec {
        ChainSpecV3::ByRef { analysis_id, threshold, .. } => (Some(analysis_id.clone()), *threshold),
        ChainSpecV3::ByInline { chain_id, threshold, ordered_steps, .. } => {
            (chain_id.clone(), *threshold)
        }
    };
    
    let steps_count = match &parsed_spec {
        ChainSpecV3::ByRef { .. } => "from-cache",
        ChainSpecV3::ByInline { ordered_steps, .. } => &ordered_steps.len().to_string(),
    };
    
    tracing::info!(
        "🔗 [V3] 收到智能自动链测试请求: analysisId={:?}, 步骤数={}, 阈值={}",
        analysis_id, steps_count, threshold
    );
    
    let result = execute_chain(&app, &envelope, &parsed_spec)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

/// 执行静态策略测试（V3）
#[tauri::command]
pub async fn execute_static_strategy_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    spec: StaticSpecV3,
) -> Result<Value, String> {
    let strategy_info = match &spec {
        StaticSpecV3::ByRef { script_id, static_step_id, .. } => {
            format!("scriptId={}, stepId={}", script_id, static_step_id)
        }
        StaticSpecV3::ByInline { strategy_id, .. } => {
            format!("strategyId={:?} (inline)", strategy_id)
        }
    };
    
    tracing::info!("🎯 [V3] 收到静态策略测试请求: {}", strategy_info);
    
    let result = execute_static(&app, &envelope, &spec)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

/// 可选：统一任务入口（根据 kind 路由）
#[tauri::command]
pub async fn execute_task_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    task: TaskV3,
) -> Result<Value, String> {
    match task {
        TaskV3::Step { step } => {
            tracing::info!("📍 [V3] 任务路由 → 智能单步");
            execute_single_step_test_v3(app, envelope, step).await
        }
        TaskV3::Chain { spec } => {
            tracing::info!("📍 [V3] 任务路由 → 智能自动链 (暂时禁用)");
            Err("Chain execution temporarily disabled for refactoring".to_string())
        }
        TaskV3::Static { spec } => {
            tracing::info!("📍 [V3] 任务路由 → 静态策略");
            execute_static_strategy_test_v3(app, envelope, spec).await
        }
    }
}
