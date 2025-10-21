// src-tauri/src/exec/v3/single_step.rs
// module: exec | layer: application | role: 智能单步执行器
// summary: FastPath 单步执行，复用现有逻辑并统一事件

use serde_json::{json, Value};
use tauri::AppHandle;

use super::types::*;
use super::events::*;

/// 智能单步执行（内部实现）
pub async fn execute_single_step_internal(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    step: SingleStepSpecV3,
) -> Result<Value, String> {
    let start_time = std::time::Instant::now();
    
    // 根据 by-ref 或 by-inline 处理
    match step {
        SingleStepSpecV3::ByRef { analysis_id, step_id } => {
            tracing::info!("📋 [by-ref] 从缓存读取步骤规格: analysisId={}, stepId={}", analysis_id, step_id);
            
            // TODO: 从缓存读取 StepSpec
            // let step_spec = cache.get_step_spec(&analysis_id, &step_id)?;
            
            execute_step_by_ref(app, envelope, &analysis_id, &step_id).await
        }
        SingleStepSpecV3::ByInline { step_id, action, params, quality, constraints, validation } => {
            tracing::info!("📋 [by-inline] 直接执行内联步骤: stepId={}, action={:?}", step_id, action);
            
            execute_step_by_inline(
                app,
                envelope,
                &step_id,
                action,
                params,
                quality,
                constraints,
                validation,
            ).await
        }
    }
}

/// 引用式执行：从缓存读取 StepSpec 后执行
async fn execute_step_by_ref(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    analysis_id: &str,
    step_id: &str,
) -> Result<Value, String> {
    let start_time = std::time::Instant::now();
    
    // 1. 发射设备就绪事件
    emit_device_ready(app, Some(analysis_id.to_string()))?;
    
    // 2. 获取当前屏幕快照
    tracing::info!("📸 获取当前屏幕快照: device={}", envelope.device_id);
    // TODO: 调用现有的 get_current_snapshot(&device_id) 函数
    let screen_hash_now = Some("current-hash-placeholder".to_string());
    emit_snapshot_ready(app, Some(analysis_id.to_string()), screen_hash_now.clone())?;
    
    // 3. TODO: 从缓存读取 StepSpec(analysis_id, step_id)
    // let step_spec = CACHE.get_step_spec(analysis_id, step_id)
    //     .ok_or_else(|| format!("❌ 步骤未找到: {}/{}", analysis_id, step_id))?;
    
    // 暂时使用模拟数据
    tracing::warn!("⚠️ TODO: 实现从缓存读取 StepSpec，当前使用模拟数据");
    
    // 4. 决定是否需要重评
    let should_reevaluate = match envelope.execution_mode {
        ExecutionMode::Strict => {
            tracing::info!("🔍 严格模式：强制重评");
            true
        }
        ExecutionMode::Relaxed => {
            let cached_hash = envelope.snapshot.screen_hash.as_deref();
            let current_hash = screen_hash_now.as_deref();
            let needs_reeval = cached_hash != current_hash;
            tracing::info!(
                "🔍 宽松模式：cached={:?}, current={:?}, 需要重评={}",
                cached_hash,
                current_hash,
                needs_reeval
            );
            needs_reeval
        }
    };
    
    // 5. 开始匹配
    emit_match_started(app, Some(analysis_id.to_string()), Some(step_id.to_string()))?;
    
    // TODO: 从 step_spec 读取 action/params/quality/constraints
    // 这里先用模拟置信度
    let confidence = 0.85_f32;
    
    // 6. 发射匹配成功事件
    emit_matched(app, Some(analysis_id.to_string()), Some(step_id.to_string()), confidence)?;
    
    // 7. TODO: 验证后置条件
    emit_validated(app, Some(analysis_id.to_string()), Some(step_id.to_string()))?;
    
    // 8. TODO: 执行动作
    emit_executed(app, Some(analysis_id.to_string()), Some(step_id.to_string()))?;
    
    // 9. 发射完成事件
    let elapsed_ms = start_time.elapsed().as_millis() as u64;
    emit_complete(
        app,
        Some(analysis_id.to_string()),
        Some(Summary {
            adopted_step_id: Some(step_id.to_string()),
            elapsed_ms: Some(elapsed_ms),
            reason: Some("单步执行成功".to_string()),
        }),
        Some(vec![StepScore {
            step_id: step_id.to_string(),
            confidence,
        }]),
        Some(ResultPayload {
            ok: true,
            coords: None,
            candidate_count: Some(1),
            screen_hash_now,
            validation: Some(ValidationResult {
                passed: true,
                reason: None,
            }),
        }),
    )?;
    
    Ok(json!({
        "ok": true,
        "confidence": confidence,
        "elapsedMs": elapsed_ms
    }))
}

/// 内联式执行：直接使用传入的 action/params 执行
async fn execute_step_by_inline(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    step_id: &str,
    action: SingleStepAction,
    params: Value,
    quality: QualitySettings,
    constraints: ConstraintSettings,
    validation: ValidationSettings,
) -> Result<Value, String> {
    let start_time = std::time::Instant::now();
    let analysis_id = envelope.snapshot.analysis_id.clone();
    
    // 1. 发射设备就绪事件
    emit_device_ready(app, analysis_id.clone())?;
    
    // 2. 获取当前屏幕快照
    tracing::info!("📸 获取当前屏幕快照: device={}", envelope.device_id);
    let screen_hash_now = Some("current-hash-placeholder".to_string());
    emit_snapshot_ready(app, analysis_id.clone(), screen_hash_now.clone())?;
    
    // 3. 开始匹配
    emit_match_started(app, analysis_id.clone(), Some(step_id.to_string()))?;
    tracing::info!("🎯 开始 FastPath 匹配: action={:?}", action);
    
    // TODO: 根据 action 类型调用对应的旧实现
    let confidence = match action {
        SingleStepAction::SmartNavigation => {
            tracing::info!("🧭 执行智能导航: params={:?}", params);
            // TODO: 调用 handle_smart_navigation 并获取置信度
            0.85
        }
        SingleStepAction::Tap => {
            tracing::info!("👆 执行点击");
            // TODO: 调用 handle_tap
            0.95
        }
        SingleStepAction::Unknown => {
            let err_msg = format!(
                "❌ 未知动作类型：步骤 '{}' 的类型无法识别。请检查前端类型映射。",
                step_id
            );
            tracing::error!("{}", err_msg);
            return Err(err_msg);
        }
        _ => {
            tracing::info!("🔧 通用动作执行");
            // TODO: 调用通用执行逻辑
            0.80
        }
    };
    
    // 4. 发射匹配成功事件
    emit_matched(app, analysis_id.clone(), Some(step_id.to_string()), confidence)?;
    
    // 5. TODO: 验证后置条件
    emit_validated(app, analysis_id.clone(), Some(step_id.to_string()))?;
    
    // 6. TODO: 执行动作
    emit_executed(app, analysis_id.clone(), Some(step_id.to_string()))?;
    
    // 7. 发射完成事件
    let elapsed_ms = start_time.elapsed().as_millis() as u64;
    emit_complete(
        app,
        analysis_id.clone(),
        Some(Summary {
            adopted_step_id: Some(step_id.to_string()),
            elapsed_ms: Some(elapsed_ms),
            reason: Some("单步执行成功".to_string()),
        }),
        Some(vec![StepScore {
            step_id: step_id.to_string(),
            confidence,
        }]),
        Some(ResultPayload {
            ok: true,
            coords: None,
            candidate_count: Some(1),
            screen_hash_now,
            validation: Some(ValidationResult {
                passed: true,
                reason: None,
            }),
        }),
    )?;
    
    Ok(json!({
        "ok": true,
        "confidence": confidence,
        "elapsedMs": elapsed_ms
    }))
}
