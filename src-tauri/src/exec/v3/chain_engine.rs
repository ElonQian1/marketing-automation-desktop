// src-tauri/src/exec/v3/chain_engine.rs
// module: exec | layer: v3 | role: 智能自动链执行器 - 短路+回退逻辑
// summary: 实现有序步骤评分、阈值短路执行、失败回退到下一步的智能链执行引擎

use super::events::{emit_progress, emit_complete};
use super::types::{ChainSpecV3, ContextEnvelope, Phase, StepScore, Summary, ResultPayload};
use tauri::AppHandle;
use std::time::Instant;

/// 智能自动链执行器主入口
///
/// **核心逻辑**：
/// 1. **有序评分阶段**：对 chainSpec.orderedSteps 中的所有步骤进行评分
///    - Strict 模式：重新评分所有步骤
///    - Relaxed 模式：screenHash 匹配则复用缓存分数，否则重新评分
/// 2. **短路执行阶段**：按评分从高到低尝试执行
///    - 分数 ≥ chainSpec.threshold 的步骤被选中执行
///    - 执行成功 → 立即返回 complete 事件，不尝试后续步骤
///    - 执行失败 → 回退到下一个高分步骤继续尝试
/// 3. **兜底逻辑**：所有步骤都失败 → 返回失败 complete 事件
///
/// **事件流**：
/// - device_ready → snapshot_ready → match_started → matched (N steps) → validated → executed → complete
pub async fn execute_chain(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    chain_spec: &ChainSpecV3,
) -> Result<ExecutionEventV3> {
    let start_time = Instant::now();
    let device_id = &envelope.device_id;

    // ====== Phase 1: device_ready ======
    emit_progress(
        app,
        device_id,
        ProgressPhase::DeviceReady,
        "设备准备完成",
    )?;

    // TODO 1: 校验设备连接状态
    // if !is_device_connected(device_id).await? {
    //     return Err(anyhow!("Device {} not connected", device_id));
    // }

    // ====== Phase 2: snapshot_ready ======
    emit_progress(
        app,
        device_id,
        ProgressPhase::SnapshotReady,
        "快照准备完成",
    )?;

    // TODO 2: 获取当前快照（XML + screenshot + analysisId）
    // 如果 envelope.snapshot 为空，需要创建新快照
    // let snapshot = if envelope.snapshot.as_ref().map(|s| s.analysis_id.is_empty()).unwrap_or(true) {
    //     get_or_create_snapshot(device_id).await?
    // } else {
    //     envelope.snapshot.clone().unwrap()
    // };

    // ====== Phase 3: match_started ======
    emit_progress(
        app,
        device_id,
        ProgressPhase::MatchStarted,
        &format!("开始评分 {} 个链式步骤", chain_spec.ordered_steps.len()),
    )?;

    // ====== Phase 4: 决定是否重新评分（Strict vs Relaxed） ======
    let mut step_scores: Vec<StepScore> = Vec::new();
    
    // TODO 3: 根据 envelope.execution_mode 决定是否重新评分
    // match envelope.execution_mode.as_ref().map(|s| s.as_str()) {
    //     Some("strict") | None => {
    //         // Strict 模式：总是重新评分
    //         for (idx, step) in chain_spec.ordered_steps.iter().enumerate() {
    //             let score = score_single_step(
    //                 device_id,
    //                 &snapshot,
    //                 step,
    //                 &envelope.quality,
    //                 &envelope.constraints,
    //             ).await?;
    //             
    //             step_scores.push(StepScore {
    //                 step_id: step.step_id.clone(),
    //                 confidence: score.confidence,
    //                 cached: false,
    //                 reason: format!("步骤#{} 评分完成", idx + 1),
    //             });
    //         }
    //     }
    //     Some("relaxed") => {
    //         // Relaxed 模式：检查 screenHash 是否匹配
    //         let current_hash = get_current_screen_hash(device_id).await?;
    //         
    //         for (idx, step) in chain_spec.ordered_steps.iter().enumerate() {
    //             let cached_score = get_cached_score(&step.step_id, &current_hash)?;
    //             
    //             let score = if let Some(cached) = cached_score {
    //                 // 复用缓存分数，但仍需验证可见性/唯一性
    //                 verify_element_still_valid(device_id, &step.step_id).await?;
    //                 StepScore {
    //                     step_id: step.step_id.clone(),
    //                     confidence: cached.confidence,
    //                     cached: true,
    //                     reason: format!("步骤#{} 使用缓存分数", idx + 1),
    //                 }
    //             } else {
    //                 // screenHash 不匹配或无缓存，重新评分
    //                 let fresh_score = score_single_step(
    //                     device_id,
    //                     &snapshot,
    //                     step,
    //                     &envelope.quality,
    //                     &envelope.constraints,
    //                 ).await?;
    //                 
    //                 StepScore {
    //                     step_id: step.step_id.clone(),
    //                     confidence: fresh_score.confidence,
    //                     cached: false,
    //                     reason: format!("步骤#{} 重新评分", idx + 1),
    //                 }
    //             };
    //             
    //             step_scores.push(score);
    //         }
    //     }
    //     Some(other) => {
    //         return Err(anyhow!("Unknown execution mode: {}", other));
    //     }
    // }

    // 临时模拟：为每个步骤生成假分数
    for (idx, step) in chain_spec.ordered_steps.iter().enumerate() {
        step_scores.push(StepScore {
            step_id: step.step_id.clone(),
            confidence: 0.5 + (idx as f64 * 0.1), // 模拟分数递增
            cached: false,
            reason: format!("步骤#{} 模拟评分", idx + 1),
        });
    }

    // ====== Phase 5: matched (发送所有评分结果) ======
    emit_progress(
        app,
        device_id,
        ProgressPhase::Matched,
        &format!("评分完成，共 {} 个候选步骤", step_scores.len()),
    )?;

    // ====== Phase 6: 按分数排序，执行短路逻辑 ======
    // 按 confidence 降序排序
    step_scores.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    let mut adopted_step_id: Option<String> = None;
    let mut execution_result: Option<ExecutionResult> = None;

    // TODO 4: 按顺序尝试执行分数 ≥ threshold 的步骤
    // for score in &step_scores {
    //     if score.confidence < chain_spec.threshold {
    //         // 分数不达标，跳过
    //         continue;
    //     }
    //     
    //     // 找到对应的步骤定义
    //     let step = chain_spec.ordered_steps.iter()
    //         .find(|s| s.step_id == score.step_id)
    //         .ok_or_else(|| anyhow!("Step {} not found in orderedSteps", score.step_id))?;
    //     
    //     // 尝试执行
    //     emit_progress(
    //         app,
    //         device_id,
    //         ProgressPhase::Validated,
    //         &format!("尝试执行步骤: {} (置信度: {:.2})", score.step_id, score.confidence),
    //     )?;
    //     
    //     match execute_single_step_internal(device_id, step, &envelope.validation).await {
    //         Ok(result) => {
    //             // 执行成功，短路返回
    //             adopted_step_id = Some(score.step_id.clone());
    //             execution_result = Some(result);
    //             break;
    //         }
    //         Err(err) => {
    //             // 执行失败，记录日志并尝试下一个
    //             tracing::warn!(
    //                 "步骤 {} 执行失败: {}，尝试下一个候选步骤",
    //                 score.step_id,
    //                 err
    //             );
    //             continue;
    //         }
    //     }
    // }

    // 临时模拟：选择第一个分数 ≥ threshold 的步骤
    for score in &step_scores {
        if score.confidence >= chain_spec.threshold {
            adopted_step_id = Some(score.step_id.clone());
            execution_result = Some(ExecutionResult {
                ok: true,
                coords: Some((100, 200)), // 模拟坐标
                candidate_count: Some(step_scores.len()),
                screen_hash_now: Some("mock_hash_123".to_string()),
                validation: None,
            });
            break;
        }
    }

    // ====== Phase 7: executed ======
    if adopted_step_id.is_some() {
        emit_progress(
            app,
            device_id,
            ProgressPhase::Executed,
            &format!("成功执行步骤: {:?}", adopted_step_id),
        )?;
    }

    // ====== Phase 8: complete ======
    let elapsed_ms = start_time.elapsed().as_millis() as u64;
    
    let event = if let Some(step_id) = adopted_step_id {
        ExecutionEventV3::Complete {
            device_id: device_id.clone(),
            summary: crate::exec::v3::types::ExecutionSummary {
                adopted_step_id: Some(step_id),
                elapsed_ms,
                reason: "短路执行成功".to_string(),
            },
            scores: step_scores,
            result: execution_result,
        }
    } else {
        ExecutionEventV3::Complete {
            device_id: device_id.clone(),
            summary: crate::exec::v3::types::ExecutionSummary {
                adopted_step_id: None,
                elapsed_ms,
                reason: "所有步骤分数均低于阈值或执行失败".to_string(),
            },
            scores: step_scores,
            result: Some(ExecutionResult {
                ok: false,
                coords: None,
                candidate_count: None,
                screen_hash_now: None,
                validation: None,
            }),
        }
    };

    emit_complete(app, &event)?;
    Ok(event)
}

// ====== 内部辅助函数（TODO: 实现） ======

/// TODO 5: 为单个步骤评分
// async fn score_single_step(
//     device_id: &str,
//     snapshot: &SnapshotContext,
//     step: &SingleStepSpecV3,
//     quality: &Option<QualitySettings>,
//     constraints: &Option<ConstraintSettings>,
// ) -> Result<StepScore> {
//     // 调用现有的 FastPath 评分逻辑
//     // 例如: services::execution::matching::smart_match(...)
//     todo!("集成现有评分逻辑")
// }

/// TODO 6: 获取缓存的步骤分数
// fn get_cached_score(step_id: &str, screen_hash: &str) -> Result<Option<StepScore>> {
//     // 从缓存中查找该步骤在该 screenHash 下的分数
//     // 例如: SCORE_CACHE.get(&(step_id.to_string(), screen_hash.to_string()))
//     todo!("实现分数缓存查询")
// }

/// TODO 7: 验证元素是否仍然有效（可见/唯一）
// async fn verify_element_still_valid(device_id: &str, step_id: &str) -> Result<()> {
//     // 检查元素是否仍然可见且唯一
//     // 例如: services::execution::validation::check_visibility(...)
//     todo!("实现元素有效性验证")
// }

/// TODO 8: 执行单个步骤（内部调用）
// async fn execute_single_step_internal(
//     device_id: &str,
//     step: &SingleStepSpecV3,
//     validation: &Option<ValidationSettings>,
// ) -> Result<ExecutionResult> {
//     // 调用现有的 action dispatch 逻辑
//     // 例如: services::execution::actions::dispatch_action(...)
//     todo!("集成现有动作执行逻辑")
// }

/// TODO 9: 获取当前屏幕哈希值
// async fn get_current_screen_hash(device_id: &str) -> Result<String> {
//     // 计算当前屏幕的哈希值
//     // 例如: hash_ui_hierarchy(get_current_xml(device_id).await?)
//     todo!("实现屏幕哈希计算")
// }
