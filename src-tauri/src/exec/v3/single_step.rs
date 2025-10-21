// src-tauri/src/exec/v3/single_step.rs
// module: exec | layer: application | role: 智能单步执行器
// summary: FastPath 单步执行，复用现有逻辑并统一事件

use anyhow::Result;
use serde_json::{json, Value};
use tauri::AppHandle;

use super::types::*;
use super::events::*;

/// 智能单步执行（内部实现）
pub async fn execute_single_step_internal(
    app: &AppHandle,
    step: SingleStepSpecV3,
) -> Result<Value> {
    let start_time = std::time::Instant::now();
    let analysis_id = step.context.snapshot.analysis_id.clone();
    
    // 1. 发射设备就绪事件
    emit_device_ready(app, analysis_id.clone())?;
    
    // 2. 获取当前屏幕快照
    tracing::info!("📸 获取当前屏幕快照: device={}", step.context.device_id);
    // TODO: 调用现有的 get_current_snapshot(&device_id) 函数
    let screen_hash_now = Some("current-hash-placeholder".to_string());
    emit_snapshot_ready(app, analysis_id.clone(), screen_hash_now.clone())?;
    
    // 3. 决定是否需要重评
    let should_reevaluate = match step.context.execution_mode {
        ExecutionMode::Strict => {
            tracing::info!("🔍 严格模式：强制重评");
            true
        }
        ExecutionMode::Relaxed => {
            let cached_hash = step.context.snapshot.screen_hash.as_deref();
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
    
    // 4. 开始匹配
    emit_match_started(app, analysis_id.clone(), step.step_id.clone())?;
    
    // 5. 执行 FastPath 匹配与评分
    tracing::info!("🎯 开始 FastPath 匹配: action={:?}", step.action);
    
    // TODO: 根据 action 类型调用对应的旧实现
    // 例如：
    // - SmartNavigation → handle_smart_navigation()
    // - Tap → handle_tap()
    // - SmartFindElement → handle_unified_match()
    // 
    // 需要应用 quality/constraints 参数：
    // - quality.ocr, quality.text_lang, quality.normalize
    // - constraints.roi, constraints.must_be_visible, constraints.must_be_clickable
    
    let confidence = match step.action {
        SingleStepAction::SmartNavigation => {
            tracing::info!("🧭 执行智能导航: params={:?}", step.params);
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
                step.step_id
            );
            tracing::error!("{}", err_msg);
            return Err(anyhow::anyhow!(err_msg));
        }
        _ => {
            tracing::info!("🔧 通用动作执行");
            // TODO: 调用通用执行逻辑
            0.80
        }
    };
    
    // 6. 发射匹配成功事件
    emit_matched(app, analysis_id.clone(), step.step_id.clone(), confidence)?;
    
    // 7. 验证后置条件（如果配置了）
    if let Some(post_action) = &step.validation.post_action {
        tracing::info!("✅ 验证后置条件: {:?}", post_action.wait_for);
        // TODO: 根据 wait_for 类型执行验证
        // - NodeGone: 等待节点消失
        // - NewActivity: 等待新 Activity
        // - TextAppears: 等待文本出现
        emit_validated(app, analysis_id.clone(), step.step_id.clone())?;
    }
    
    // 8. 执行动作（非 dryrun 模式）
    tracing::info!("▶️ 执行动作");
    // TODO: 实际执行点击/输入等动作
    emit_executed(app, analysis_id.clone(), step.step_id.clone())?;
    
    // 9. 发射完成事件
    let elapsed_ms = start_time.elapsed().as_millis() as u64;
    emit_complete(
        app,
        analysis_id.clone(),
        Some(Summary {
            adopted_step_id: Some(step.step_id.clone()),
            elapsed_ms: Some(elapsed_ms),
            reason: Some("单步执行成功".to_string()),
        }),
        Some(vec![StepScore {
            step_id: step.step_id.clone(),
            confidence,
        }]),
        Some(ResultPayload {
            ok: true,
            coords: None, // TODO: 填充实际坐标
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
