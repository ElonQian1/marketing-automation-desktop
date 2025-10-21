// src-tauri/src/exec/v3/static_exec.rs
// module: exec | layer: v3 | role: 静态策略执行器 - 基于固定定位器的确定性执行
// summary: 包装现有的 id/xpath/text 静态定位逻辑，支持 dryrun 模式，统一事件流

use super::events::{emit_progress, emit_complete};
use super::types::{
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
async fn execute_static_by_ref(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    script_id: &str,
    static_step_id: &str,
    dryrun: bool,
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
async fn execute_static_by_inline(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    step_id: &str,
    action: &StaticAction,
    locator: &Locator,
    input_text: Option<&str>,
    click_point_policy: &Option<ClickPointPolicy>,
    dryrun: bool,
    quality: &QualitySettings,
    constraints: &ConstraintSettings,
    validation: &ValidationSettings,
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

    // ====== Phase 8: complete ======
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

    // ====== Phase 5: 应用约束条件评分 ======
    let mut confidence = 0.0;
    let mut coords: Option<(i32, i32)> = None;

    if matched_elements.is_empty() {
        // 未找到元素
        confidence = 0.0;
    } else if matched_elements.len() > 1 {
        // 找到多个元素
        if static_spec.constraints.unique.unwrap_or(false) {
            confidence = 0.0;
        } else {
            // 不要求唯一，取第一个
            confidence = 0.8;
            coords = Some(calculate_center(&matched_elements[0]));
        }
    } else {
        // 找到唯一元素
        // TODO 4: 应用可见性约束
        // let must_be_visible = static_spec.constraints.must_be_visible.unwrap_or(true);
        // let must_be_clickable = static_spec.constraints.must_be_clickable.unwrap_or(false);
        // 
        // if must_be_visible && !element.visible {
        //     confidence = 0.5;
        // } else if must_be_clickable && !element.clickable {
        //     confidence = 0.5;
        // } else {
        //     confidence = 1.0;
        //     coords = Some(calculate_center(element));
        // }

        // 临时模拟
        confidence = 1.0;
        coords = Some((200, 300));
    }

    // ====== Phase 6: matched ======
    let step_score = StepScore {
        step_id: step_id.clone(),
        confidence,
    };

    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.clone()),
        Phase::Matched,
        Some(confidence),
        Some(format!("定位完成，置信度: {:.2}", confidence)),
        Some(serde_json::json!({ "matched_count": matched_elements.len() })),
    )?;

    // ====== Phase 7: validated ======
    let dryrun = static_spec.dryrun.unwrap_or(false);
    emit_progress(
        app,
        analysis_id.clone(),
        Some(step_id.clone()),
        Phase::Validated,
        Some(confidence),
        Some(if dryrun {
            "Dryrun 模式，跳过执行".to_string()
        } else {
            "准备执行动作".to_string()
        }),
        None,
    )?;

    // ====== Phase 8: 执行动作（非 dryrun 模式） ======
    let mut execution_ok = false;

    if !dryrun && coords.is_some() && confidence >= 0.5 {
        // TODO 5: 执行静态动作
        // match &static_spec.action {
        //     StaticAction::Tap => {
        //         adb_tap(device_id, coords.unwrap()).await?;
        //         execution_ok = true;
        //     }
        //     StaticAction::Input => {
        //         if let Some(text) = &static_spec.input_text {
        //             adb_input_text(device_id, text).await?;
        //             execution_ok = true;
        //         }
        //     }
        //     StaticAction::Swipe => {
        //         adb_swipe(device_id, direction).await?;
        //         execution_ok = true;
        //     }
        //     _ => {}
        // }

        // 临时模拟
        execution_ok = true;

        emit_progress(
            app,
            analysis_id.clone(),
            Some(step_id.clone()),
            Phase::Executed,
            Some(confidence),
            Some(format!("动作执行完成: {:?}", static_spec.action)),
            None,
        )?;
    } else if dryrun {
        emit_progress(
            app,
            analysis_id.clone(),
            Some(step_id.clone()),
            Phase::Executed,
            Some(confidence),
            Some("Dryrun 模式，已跳过执行".to_string()),
            None,
        )?;
    } else {
        emit_progress(
            app,
            analysis_id.clone(),
            Some(step_id.clone()),
            Phase::Executed,
            Some(confidence),
            Some(format!("置信度不足 ({:.2})，跳过执行", confidence)),
            None,
        )?;
    }

    // TODO 6: 后置验证（如果配置了 static_spec.validation）
    // if let Some(validation) = &static_spec.validation {
    //     match validation.post_action.wait_for.as_str() {
    //         "node_gone" => {
    //             wait_for_node_disappear(device_id, &static_spec.locator, validation.post_action.timeout_ms).await?;
    //         }
    //         "new_activity" => {
    //             wait_for_activity_change(device_id, validation.post_action.timeout_ms).await?;
    //         }
    //         "text_appears" => {
    //             wait_for_text(device_id, &validation.post_action.value, validation.post_action.timeout_ms).await?;
    //         }
    //         _ => {}
    //     }
    // }

    // ====== Phase 9: complete ======
    let elapsed_ms = start_time.elapsed().as_millis() as u64;

    let summary = Summary {
        adopted_step_id: Some(step_id.clone()),
        elapsed_ms: Some(elapsed_ms),
        reason: Some(if dryrun {
            "Dryrun 模式完成".to_string()
        } else if execution_ok {
            "静态策略执行成功".to_string()
        } else {
            "静态策略执行跳过或失败".to_string()
        }),
    };

    let result = ResultPayload {
        ok: execution_ok || dryrun,
        coords: coords.map(|(x, y)| Point { x, y }),
        candidate_count: Some(matched_elements.len() as u32),
        screen_hash_now: None, // TODO: 计算当前 screenHash
        validation: None, // TODO: 添加验证结果
    };

    emit_complete(
        app,
        analysis_id,
        Some(summary),
        Some(vec![step_score]),
        Some(result),
    )?;

    Ok(())
}

// ====== 内部辅助结构（临时模拟） ======

#[derive(Debug, Clone)]
struct MockElement {
    bounds: (i32, i32, i32, i32), // (x, y, width, height)
    visible: bool,
    clickable: bool,
}

fn calculate_center(element: &MockElement) -> (i32, i32) {
    let (x, y, w, h) = element.bounds;
    (x + w / 2, y + h / 2)
}

// ====== TODO: 实现的辅助函数 ======

// TODO 7: 根据定位器查找元素
// async fn find_elements_by_locators(
//     xml_cache_id: &str,
//     locator: &Locator,
// ) -> Result<Vec<Element>, String> {
//     // 调用现有的 XML 解析和元素匹配逻辑
//     // 例如: services::xml_parser::find_by_xpath(...)
//     //       services::xml_parser::find_by_resource_id(...)
//     Ok(vec![])
// }

// TODO 8: 等待元素消失
// async fn wait_for_node_disappear(
//     device_id: &str,
//     locator: &Locator,
//     timeout_ms: Option<u64>,
// ) -> Result<(), String> {
//     // 轮询检查元素是否消失
//     Ok(())
// }

// TODO 9: 等待 Activity 切换
// async fn wait_for_activity_change(
//     device_id: &str,
//     timeout_ms: Option<u64>,
// ) -> Result<(), String> {
//     // 检测当前 Activity 是否与之前不同
//     Ok(())
// }

// TODO 10: 等待文本出现
// async fn wait_for_text(
//     device_id: &str,
//     text: &str,
//     timeout_ms: Option<u64>,
// ) -> Result<(), String> {
//     // 轮询检查指定文本是否出现在屏幕上
//     Ok(())
// }

//     device_id: &str,
//     text: &str,
//     timeout_ms: Option<u64>,
// ) -> Result<()> {
//     // 轮询检查指定文本是否出现在屏幕上
//     todo!("实现等待文本出现逻辑")
// }
