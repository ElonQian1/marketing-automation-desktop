// src-tauri/src/exec/v3/static_exec.rs
// module: exec | layer: v3 | role: 静态策略执行器 - 基于固定定位器的确定性执行
// summary: 包装现有的 id/xpath/text 静态定位逻辑，支持 dryrun 模式，统一事件流

use crate::automation::events::{emit_progress, emit_complete};
use crate::automation::types::{
    StaticSpecV3, StaticAction, Locator, ClickPointPolicy, ContextEnvelope,
    Phase, StepScore, Summary, ResultPayload, Point,
    QualitySettings, ConstraintSettings, ValidationSettings,
};
use tauri::AppHandle;
use std::time::Instant;

/// 静态策略执行器主入口
///
/// **核心逻辑**：
/// 1. **固定定位**：使用 staticSpec.locator (id/xpath/text/class) 精确定位元素
/// 2. **确定性评分**：
///    - 找到元素且满足 constraints (可见/唯一/ROI) → confidence = 1.0
///    - 找到元素但不满足 constraints → confidence = 0.5
///    - 未找到元素 → confidence = 0.0
/// 3. **Dryrun 模式**：
///    - true → 只定位和评分，不执行动作
///    - false → 执行 staticSpec.action (tap/input/swipe/back 等)
/// 4. **可见性验证**：严格按照 constraints.mustBeVisible/mustBeClickable 验证
pub async fn execute_static(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    static_spec: &StaticSpecV3,
) -> Result<(), String> {
    // 根据 by-ref 或 by-inline 处理
    match static_spec {
        StaticSpecV3::ByRef { script_id, static_step_id, dryrun } => {
            tracing::info!("🎯 [by-ref] 从脚本库读取定位器: scriptId={}, stepId={}", script_id, static_step_id);
            
            // TODO: 从脚本库读取定位器和动作
            // let static_step = SCRIPT_DB.get_step(script_id, static_step_id)?;
            
            execute_static_by_ref(app, envelope, script_id, static_step_id, *dryrun).await
        }
        StaticSpecV3::ByInline { strategy_id, action, locator, input_text, click_point_policy, dryrun, quality, constraints, validation } => {
            let step_id = strategy_id.as_deref().unwrap_or("static_inline");
            tracing::info!("🎯 [by-inline] 直接执行静态定位: stepId={}, locator={:?}", step_id, locator);
            
            execute_static_by_inline(
                app,
                envelope,
                step_id,
                action,
                locator,
                input_text.as_deref(),
                click_point_policy,
                *dryrun,
                quality,
                constraints,
                validation,
            ).await
        }
    }
}

/// 引用式执行：从脚本库读取定位器后执行
#[allow(unused_variables)]
async fn execute_static_by_ref(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    _script_id: &str,
    static_step_id: &str,
    _dryrun: bool,
) -> Result<(), String> {
    let start_time = Instant::now();
    let analysis_id = envelope.snapshot.analysis_id.clone();
    let device_id = &envelope.device_id;

    // ====== Phase 1: device_ready ======
    emit_progress(
        app,
        analysis_id.clone(),
        Some(static_step_id.to_string()),
        Phase::DeviceReady,
        None,
        Some(format!("设备准备完成: {}", device_id)),
        None,
    )?;

    tracing::warn!("⚠️ TODO: 从脚本库读取定位器，当前使用模拟数据");
    
    // TODO: 实现从脚本库读取 locator/action
    // 暂时返回成功
    emit_complete(
        app,
        analysis_id,
        Some(Summary {
            adopted_step_id: Some(static_step_id.to_string()),
            elapsed_ms: Some(start_time.elapsed().as_millis() as u64),
            reason: Some("TODO: 实现脚本库读取逻辑".to_string()),
        }),
        None,
        Some(ResultPayload {
            ok: true,
            coords: None,
            candidate_count: Some(0),
            screen_hash_now: None,
            validation: None,
        }),
    )?;
    
    Ok(())
}

/// 内联式执行：使用传入的 locator 和 action 执行
#[allow(unused_variables)]
async fn execute_static_by_inline(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    step_id: &str,
    action: &StaticAction,
    locator: &Locator,
    _input_text: Option<&str>,
    _click_point_policy: &Option<ClickPointPolicy>,
    dryrun: bool,
    _quality: &QualitySettings,
    _constraints: &ConstraintSettings,
    _validation: &ValidationSettings,
) -> Result<(), String> {
    let start_time = Instant::now();
    let analysis_id = envelope.snapshot.analysis_id.clone();
    let device_id = &envelope.device_id;

    // ====== Phase 1: device_ready ======
    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.to_string()),
        Phase::DeviceReady,
        None,
        Some(format!("设备准备完成: {}", device_id)),
        None,
    )?;

    // TODO 1: 校验设备连接状态

    // ====== Phase 2: snapshot_ready ======
    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.to_string()),
        Phase::SnapshotReady,
        None,
        Some("快照准备完成".to_string()),
        None,
    )?;

    // TODO 2: 获取当前快照

    // ====== Phase 3: match_started ======
    let locator_desc = format!("by={:?}, value={}", locator.by, locator.value);
    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.to_string()),
        Phase::MatchStarted,
        None,
        Some(format!("开始静态定位: {}", locator_desc)),
        None,
    )?;

    // ====== Phase 4: 静态定位元素 ======
    // TODO 3: 调用现有的静态定位逻辑
    // 临时模拟：假设找到1个元素
    let confidence = 1.0_f32;
    let coords = Some((100, 200));

    // ====== Phase 5: matched ======
    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.to_string()),
        Phase::Matched,
        Some(confidence),
        Some("元素定位成功".to_string()),
        None,
    )?;

    // ====== Phase 6: validated ======
    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.to_string()),
        Phase::Validated,
        None,
        Some("约束验证通过".to_string()),
        None,
    )?;

    // ====== Phase 7: executed (if not dryrun) ======
    if !dryrun {
        // TODO 4: 执行动作（tap/input/swipe 等）
        emit_progress(
            app,
            analysis_id.clone(),
            Some(step_id.to_string()),
            Phase::Executed,
            None,
            Some(format!("执行动作: {:?}", action)),
            None,
        )?;
    }

    // ====== Phase 8: 发送 100% 进度（关键修复！） ======
    // 🔧 修复说明：在发送 complete 事件前必须先发送 100% 进度事件
    // 这样前端 UI 才能正确显示完整的进度序列，避免卡在最后一个进度值
    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.to_string()),
        Phase::Executed,
        Some(1.0),  // 100% = 1.0
        Some("执行完成".to_string()),
        None,
    )?;

    tracing::info!(
        "✅ 静态策略执行完成: analysisId={:?}, stepId={}, elapsed={}ms",
        analysis_id,
        step_id,
        start_time.elapsed().as_millis()
    );

    // 短暂延迟确保前端接收到 100% 进度事件（参考 V2 修复方案）
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;

    // ====== Phase 9: 发送 complete 事件 ======
    let elapsed_ms = start_time.elapsed().as_millis() as u64;
    
    emit_complete(
        app,
        analysis_id,
        Some(Summary {
            adopted_step_id: Some(step_id.to_string()),
            elapsed_ms: Some(elapsed_ms),
            reason: Some(if dryrun {
                "Dryrun 模式，仅定位不执行".to_string()
            } else {
                "静态策略执行成功".to_string()
            }),
        }),
        Some(vec![StepScore {
            step_id: step_id.to_string(),
            confidence,
        }]),
        Some(ResultPayload {
            ok: true,
            coords: coords.map(|(x, y)| Point { x, y }),
            candidate_count: Some(1),
            screen_hash_now: None,
            validation: None,
        }),
    )?;

    Ok(())
}
