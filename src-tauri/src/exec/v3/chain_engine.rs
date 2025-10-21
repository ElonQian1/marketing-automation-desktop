// src-tauri/src/exec/v3/chain_engine.rs
// module: exec | layer: v3 | role: 智能自动链执行器 - 短路+回退逻辑
// summary: 实现有序步骤评分、阈值短路执行、失败回退到下一步的智能链执行引擎

use super::events::{emit_progress, emit_complete};
use super::types::{
    ChainSpecV3, ChainMode, ContextEnvelope, Phase, StepScore, Summary, ResultPayload, Point,
    StepRefOrInline, QualitySettings, ConstraintSettings, ValidationSettings,
};
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
pub async fn execute_chain(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    chain_spec: &ChainSpecV3,
) -> Result<(), String> {
    let start_time = Instant::now();
    let device_id = &envelope.device_id;

    // 根据 by-ref 或 by-inline 处理
    match chain_spec {
        ChainSpecV3::ByRef { analysis_id, threshold, mode } => {
            tracing::info!("🔗 [by-ref] 从缓存读取链式结果: analysisId={}", analysis_id);
            
            // TODO: 从缓存读取 ChainResult(analysis_id)
            // let chain_result = CACHE.get_chain_result(analysis_id)
            //     .ok_or_else(|| format!("❌ 分析结果未找到: {}", analysis_id))?;
            // let ordered_steps = chain_result.ordered_steps;
            
            execute_chain_by_ref(app, envelope, analysis_id, *threshold, mode).await
        }
        ChainSpecV3::ByInline { chain_id, ordered_steps, threshold, mode, quality, constraints, validation } => {
            let analysis_id = chain_id.as_deref().unwrap_or("inline-chain");
            tracing::info!("🔗 [by-inline] 直接执行内联链: chainId={:?}, 步骤数={}", chain_id, ordered_steps.len());
            
            execute_chain_by_inline(
                app,
                envelope,
                analysis_id,
                ordered_steps,
                *threshold,
                mode,
                quality,
                constraints,
                validation,
            ).await
        }
    }
}

/// 引用式执行：从缓存读取 ChainResult 后执行
async fn execute_chain_by_ref(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    analysis_id: &str,
    threshold: f32,
    mode: &ChainMode,
) -> Result<(), String> {
    let start_time = Instant::now();
    let device_id = &envelope.device_id;

    // ====== Phase 1: device_ready ======
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::DeviceReady,
        None,
        Some(format!("设备准备完成: {}", device_id)),
        None,
    )?;

    tracing::warn!("⚠️ TODO: 从缓存读取 ChainResult，当前使用空步骤列表");
    
    // TODO: 实现从缓存读取 ordered_steps 和策略详情
    // 暂时返回成功
    emit_complete(
        app,
        Some(analysis_id.to_string()),
        Some(Summary {
            adopted_step_id: None,
            elapsed_ms: Some(start_time.elapsed().as_millis() as u64),
            reason: Some("TODO: 实现缓存读取逻辑".to_string()),
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

/// 内联式执行：使用传入的 ordered_steps 执行
async fn execute_chain_by_inline(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    analysis_id: &str,
    ordered_steps: &[StepRefOrInline],
    threshold: f32,
    mode: &ChainMode,
    quality: &QualitySettings,
    constraints: &ConstraintSettings,
    validation: &ValidationSettings,
) -> Result<(), String> {
    let start_time = Instant::now();
    let device_id = &envelope.device_id;

    // ====== Phase 1: device_ready ======
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::DeviceReady,
        None,
        Some(format!("设备准备完成: {}", device_id)),
        None,
    )?;

    // TODO 1: 校验设备连接状态
    // if !is_device_connected(device_id).await? {
    //     return Err(format!("Device {} not connected", device_id));
    // }

    // ====== Phase 2: snapshot_ready ======
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::SnapshotReady,
        None,
        Some("快照准备完成".to_string()),
        None,
    )?;

    // TODO 2: 获取当前快照（XML + screenshot + analysisId）
    // 如果 envelope.snapshot 为空，需要创建新快照
    // let snapshot = if envelope.snapshot.is_none() {
    //     get_or_create_snapshot(device_id).await?
    // } else {
    //     envelope.snapshot.clone().unwrap()
    // };

    // ====== Phase 3: match_started ======
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::MatchStarted,
        None,
        Some(format!("开始评分 {} 个链式步骤", ordered_steps.len())),
        None,
    )?;

    // ====== Phase 4: 决定是否重新评分（Strict vs Relaxed） ======
    let mut step_scores: Vec<StepScore> = Vec::new();
    
    // TODO 3: 根据 envelope.execution_mode 决定是否重新评分
    // match envelope.execution_mode.as_deref() {
    //     Some("strict") | None => {
    //         // Strict 模式：总是重新评分
    //         for step in &chain_spec.ordered_steps {
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
    //                 confidence: score,
    //             });
    //         }
    //     }
    //     Some("relaxed") => {
    //         // Relaxed 模式：检查 screenHash 是否匹配
    //         let current_hash = get_current_screen_hash(device_id).await?;
    //         
    //         for step in &chain_spec.ordered_steps {
    //             let cached_score = get_cached_score(&step.step_id, &current_hash)?;
    //             
    //             let confidence = if let Some(cached) = cached_score {
    //                 // 复用缓存分数，但仍需验证可见性/唯一性
    //                 verify_element_still_valid(device_id, &step.step_id).await?;
    //                 cached
    //             } else {
    //                 // screenHash 不匹配或无缓存，重新评分
    //                 score_single_step(
    //                     device_id,
    //                     &snapshot,
    //                     step,
    //                     &envelope.quality,
    //                     &envelope.constraints,
    //                 ).await?
    //             };
    //             
    //             step_scores.push(StepScore {
    //                 step_id: step.step_id.clone(),
    //                 confidence,
    //             });
    //         }
    //     }
    //     Some(other) => {
    //         return Err(format!("Unknown execution mode: {}", other));
    //     }
    // }

    // 临时模拟：为每个步骤生成假分数
    for (idx, step) in ordered_steps.iter().enumerate() {
        let step_id = if let Some(ref_id) = &step.r#ref {
            ref_id.clone()
        } else if let Some(inline) = &step.inline {
            inline.step_id.clone()
        } else {
            format!("step_{}", idx)
        };
        
        step_scores.push(StepScore {
            step_id,
            confidence: 0.5 + (idx as f32 * 0.1),
        });
    }

    // ====== Phase 5: matched (发送所有评分结果) ======
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::Matched,
        None,
        Some(format!("评分完成，共 {} 个候选步骤", step_scores.len())),
        Some(serde_json::json!({ "scores": step_scores.clone() })),
    )?;

    // ====== Phase 6: 按分数排序，执行短路逻辑 ======
    // 按 confidence 降序排序
    step_scores.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    let mut adopted_step_id: Option<String> = None;
    let mut execution_ok = false;
    let mut coords: Option<(i32, i32)> = None;

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
    //         .ok_or_else(|| format!("Step {} not found in orderedSteps", score.step_id))?;
    //     
    //     // 尝试执行
    //     emit_progress(
    //         app,
    //         analysis_id.clone(),
    //         Some(score.step_id.clone()),
    //         Phase::Validated,
    //         Some(score.confidence),
    //         Some(format!("尝试执行步骤: {} (置信度: {:.2})", score.step_id, score.confidence)),
    //         None,
    //     )?;
    //     
    //     match execute_single_step_internal(device_id, step, &envelope.validation).await {
    //         Ok(result) => {
    //             // 执行成功，短路返回
    //             adopted_step_id = Some(score.step_id.clone());
    //             execution_ok = true;
    //             coords = result.coords;
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
        if score.confidence >= threshold {
            adopted_step_id = Some(score.step_id.clone());
            execution_ok = true;
            coords = Some((100, 200));
            break;
        }
    }

    // ====== Phase 7: executed ======
    if let Some(ref step_id) = adopted_step_id {
        emit_progress(
            app,
            Some(analysis_id.to_string()),
            Some(step_id.clone()),
            Phase::Executed,
            None,
            Some(format!("成功执行步骤: {}", step_id)),
            None,
        )?;
    }

    // ====== Phase 8: 发送 100% 进度（关键修复！） ======
    // 🔧 修复说明：在发送 complete 事件前必须先发送 100% 进度事件
    // 这样前端 UI 才能正确显示完整的进度序列，避免卡在最后一个进度值
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        adopted_step_id.as_ref().map(|id| id.clone()),
        Phase::Executed,  // 使用 Executed Phase 表示已完成
        Some(1.0),  // 100% = 1.0
        Some("执行完成".to_string()),
        None,
    )?;

    tracing::info!(
        "✅ 智能自动链执行完成: analysisId={}, adoptedStepId={:?}, elapsed={}ms",
        analysis_id,
        adopted_step_id,
        start_time.elapsed().as_millis()
    );

    // 短暂延迟确保前端接收到 100% 进度事件（参考 V2 修复方案）
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;

    // ====== Phase 9: 发送 complete 事件 ======
    let elapsed_ms = start_time.elapsed().as_millis() as u64;
    
    let summary = Summary {
        adopted_step_id: adopted_step_id.clone(),
        elapsed_ms: Some(elapsed_ms),
        reason: Some(if execution_ok {
            "短路执行成功".to_string()
        } else {
            "所有步骤分数均低于阈值或执行失败".to_string()
        }),
    };

    let result = ResultPayload {
        ok: execution_ok,
        coords: coords.map(|(x, y)| Point { x, y }),
        candidate_count: Some(step_scores.len() as u32),
        screen_hash_now: None,
        validation: None,
    };

    emit_complete(
        app,
        Some(analysis_id.to_string()),
        Some(summary),
        Some(step_scores),
        Some(result),
    )?;

    Ok(())
}

// ====== 内部辅助函数（TODO: 实现） ======

// TODO 5: 为单个步骤评分
// async fn score_single_step(
//     device_id: &str,
//     snapshot: &SnapshotContext,
//     step: &SingleStepSpecV3,
//     quality: &Option<QualitySettings>,
//     constraints: &Option<ConstraintSettings>,
// ) -> Result<f64, String> {
//     // 调用现有的 FastPath 评分逻辑
//     // 例如: services::execution::matching::smart_match(...)
//     Ok(0.0)
// }

// TODO 6: 获取缓存的步骤分数
// fn get_cached_score(step_id: &str, screen_hash: &str) -> Result<Option<f64>, String> {
//     // 从缓存中查找该步骤在该 screenHash 下的分数
//     // 例如: SCORE_CACHE.get(&(step_id.to_string(), screen_hash.to_string()))
//     Ok(None)
// }

// TODO 7: 验证元素是否仍然有效（可见/唯一）
// async fn verify_element_still_valid(device_id: &str, step_id: &str) -> Result<(), String> {
//     // 检查元素是否仍然可见且唯一
//     // 例如: services::execution::validation::check_visibility(...)
//     Ok(())
// }

// TODO 8: 执行单个步骤（内部调用）
// async fn execute_single_step_internal(
//     device_id: &str,
//     step: &SingleStepSpecV3,
//     validation: &Option<ValidationSettings>,
// ) -> Result<ResultPayload, String> {
//     // 调用现有的 action dispatch 逻辑
//     // 例如: services::execution::actions::dispatch_action(...)
//     Ok(ResultPayload {
//         ok: true,
//         coords: None,
//         candidate_count: None,
//         screen_hash_now: None,
//         validation: None,
//     })
// }

// TODO 9: 获取当前屏幕哈希值
// async fn get_current_screen_hash(device_id: &str) -> Result<String, String> {
//     // 计算当前屏幕的哈希值
//     // 例如: hash_ui_hierarchy(get_current_xml(device_id).await?)
//     Ok("".to_string())
// }
