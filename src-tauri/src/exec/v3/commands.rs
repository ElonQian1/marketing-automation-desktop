// src-tauri/src/exec/v3/commands.rs
// module: exec | layer: application | role: V3 执行命令
// summary: 三条执行链的统一命令入口

use anyhow::Result;
use serde_json::Value;
use tauri::{AppHandle, State};

use super::types::*;
use super::single_step::execute_single_step_internal;
// use super::chain_engine::execute_chain; // 暂时禁用，等待重构
use super::static_exec::execute_static;

/// 执行智能单步测试（V3）
#[tauri::command]
pub async fn execute_single_step_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    step: SingleStepSpecV3,
) -> Result<Value, String> {
    tracing::info!("🧪 [V3] 收到智能单步测试请求: stepId={}", step.step_id);
    
    // TODO: 将 envelope 的内容合并到 step 中,目前先直接传递 step
    execute_single_step_internal(&app, step)
        .await
        .map_err(|e| e.to_string())
}

/// 执行智能自动链测试（V3）
/// 暂时禁用，等待 chain_engine 重构完成
/*
#[tauri::command]
pub async fn execute_chain_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    spec: ChainSpecV3,
) -> Result<Value, String> {
    tracing::info!(
        "🔗 [V3] 收到智能自动链测试请求: 步骤数={}, 阈值={}",
        spec.ordered_steps.len(),
        spec.threshold
    );
    
    let result = execute_chain(&app, &envelope, &spec)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::to_value(&result).map_err(|e| e.to_string())
}
*/

/// 执行静态策略测试（V3）
#[tauri::command]
pub async fn execute_static_strategy_test_v3(
    app: AppHandle,
    envelope: ContextEnvelope,
    spec: StaticSpecV3,
) -> Result<Value, String> {
    tracing::info!(
        "🎯 [V3] 收到静态策略测试请求: strategyId={:?}",
        spec.strategy_id
    );
    
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
