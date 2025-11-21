// src-tauri/src/exec/v3/helpers/phase_handlers.rs
// module: exec | layer: v3/helpers | role: Phase执行处理器
// summary: 拆分chain_engine中的Phase 4评分逻辑和Phase 7智能回退逻辑

use super::super::types::{
    StepRefOrInline, QualitySettings, ValidationSettings, ExecutionMode, StepScore,
    SingleStepSpecV3, ConstraintSettings, ContextEnvelope,
};
use super::super::events::emit_progress;
use super::super::types::Phase;
use super::step_scoring::score_step_with_smart_selection;
use super::analysis_helpers::perform_intelligent_strategy_analysis_from_raw;
use tauri::AppHandle;

/// Phase 4: 根据执行模式（Strict/Relaxed）对步骤进行评分
/// 
/// 评分策略：
/// - Strict模式：总是重新评分所有步骤
/// - Relaxed模式：检查screenHash，如果匹配则复用缓存，否则重新评分
/// 
/// 关键修复：必须使用真实的SmartSelectionEngine进行元素匹配和评分，
/// 否则置信度不准确
pub async fn score_steps_by_mode(
    device_id: &str,
    ui_xml: &str,
    final_ordered_steps: &[StepRefOrInline],
    quality: &QualitySettings,
    execution_mode: &ExecutionMode,
    screen_hash: &str,
    cached_screen_hash: Option<&str>,
) -> Result<Vec<StepScore>, String> {
    let mut step_scores: Vec<StepScore> = Vec::new();
    
    match execution_mode {
        ExecutionMode::Strict => {
            tracing::info!("🔍 严格模式：总是重新评分所有步骤");
            for (idx, step) in final_ordered_steps.iter().enumerate() {
                let step_id = extract_step_id(step, idx);
                
                // 为每个步骤构建SmartSelection协议进行评分
                let confidence = match score_step_with_smart_selection(
                    device_id,
                    ui_xml,
                    step,
                    quality,
                ).await {
                    Ok(score) => {
                        tracing::info!("✅ 步骤 {} 评分: {:.2}", step_id, score);
                        score
                    }
                    Err(e) => {
                        tracing::warn!("❌ 步骤 {} 评分失败: {}", step_id, e);
                        0.0 // 评分失败时给低分
                    }
                };
                
                step_scores.push(StepScore {
                    step_id,
                    confidence,
                });
            }
        }
        ExecutionMode::Relaxed => {
            tracing::info!("🔍 宽松模式：检查screenHash是否匹配");
            
            if cached_screen_hash == Some(screen_hash) {
                tracing::info!("📋 screenHash匹配，尝试复用缓存分数");
                // TODO: 实现缓存分数复用逻辑
                // 暂时还是进行重新评分以确保准确性
            }
            
            // 当前实现：即使在宽松模式下也进行重新评分以确保准确性
            for (idx, step) in final_ordered_steps.iter().enumerate() {
                let step_id = extract_step_id(step, idx);
                
                let confidence = match score_step_with_smart_selection(
                    device_id,
                    ui_xml,
                    step,
                    quality,
                ).await {
                    Ok(score) => {
                        tracing::info!("✅ 步骤 {} 评分: {:.2}", step_id, score);
                        score
                    }
                    Err(e) => {
                        tracing::warn!("❌ 步骤 {} 评分失败: {}", step_id, e);
                        0.0
                    }
                };
                
                step_scores.push(StepScore {
                    step_id,
                    confidence,
                });
            }
        }
    }
    
    Ok(step_scores)
}

/// Phase 7 智能回退：当传统步骤执行失败时，触发智能策略分析作为后备方案
/// 
/// 回退策略：
/// 1. 从原始步骤提取参数
/// 2. 调用智能策略分析系统生成候选步骤
/// 3. 评分并按置信度排序
/// 4. 尝试执行置信度 >= threshold 的智能步骤
/// 
/// 返回：
/// - adopted_step_id: 成功执行的步骤ID（如果有）
/// - coords: 点击坐标（如果有）
/// - execution_ok: 是否成功执行
#[allow(clippy::too_many_arguments)]
pub async fn handle_intelligent_fallback(
    app: &AppHandle,
    analysis_id: &str,
    device_id: &str,
    ordered_steps: &[StepRefOrInline],
    ui_xml: &str,
    quality: &QualitySettings,
    validation: &ValidationSettings,
    threshold: f32,
) -> Result<(Option<String>, Option<(i32, i32)>, bool), String> {
    // 🚫 结构模式兜底：若本次链存在显式结构模式，则禁用智能回退
    if steps_have_explicit_structural_mode(ordered_steps) {
        tracing::warn!("🛑 [结构模式] 显式结构模式下禁用智能回退，直接返回失败");

        emit_progress(
            app,
            Some(analysis_id.to_string()),
            None,
            Phase::Finished,
            Some(0.0),
            Some("结构模式严格失败：禁用智能回退".to_string()),
            None,
        )?;

        return Ok((None, None, false));
    }

    tracing::warn!("⚠️ 传统步骤执行失败 (没有步骤满足执行条件)，触发智能分析作为后备方案");
    
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::DeviceReady,
        None,
        Some("🧠 传统匹配失败，启动智能分析后备方案".to_string()),
        None,
    )?;
    
    // 执行智能策略分析作为后备
    // 从第一个步骤提取参数
    let original_params = if let Some(first_step) = ordered_steps.first() {
        if let Some(inline) = &first_step.inline {
            inline.params.clone()
        } else {
            serde_json::json!({})
        }
    } else {
        serde_json::json!({})
    };
    
    match perform_intelligent_strategy_analysis_from_raw(
        device_id,
        &original_params,
        ui_xml,
        app,
    ).await {
        Ok(intelligent_candidates) => {
            if !intelligent_candidates.is_empty() {
                tracing::info!("✅ 后备智能策略分析成功生成 {} 个候选步骤", intelligent_candidates.len());
                
                // 评分和执行智能生成的候选步骤
                let mut intelligent_scores = Vec::new();
                for step in &intelligent_candidates {
                    if let Some(inline) = &step.inline {
                        let step_score = score_step_with_smart_selection(
                            device_id, ui_xml, step, quality
                        ).await.unwrap_or(0.0);
                        
                        intelligent_scores.push(StepScore {
                            step_id: inline.step_id.clone(),
                            confidence: step_score,
                        });
                    }
                }
                
                // 排序并尝试执行智能生成的步骤
                intelligent_scores.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
                
                for score in &intelligent_scores {
                    if score.confidence >= threshold {
                        let step = intelligent_candidates.iter()
                            .find(|s| s.inline.as_ref().map(|i| &i.step_id) == Some(&score.step_id))
                            .unwrap();
                        
                        // 提取 inline 步骤
                        let inline_step = step.inline.as_ref()
                            .ok_or_else(|| format!("智能步骤 {} 没有inline定义", score.step_id))?;
                        
                        tracing::info!("🧠 尝试执行智能生成步骤: {} (置信度: {:.2})", score.step_id, score.confidence);
                        
                        // 🎯 修改：使用统一的单步执行器，而不是直接调用底层
                        use super::super::single_step::execute_single_step_internal;
                        
                        // 构造 SingleStepSpecV3
                        let single_step_spec = SingleStepSpecV3::ByInline {
                            step_id: inline_step.step_id.clone(),
                            action: inline_step.action.clone(),
                            params: inline_step.params.clone(),
                            quality: quality.clone(),
                            constraints: ConstraintSettings::default(), // 使用默认约束
                            validation: validation.clone(),
                        };
                        
                        // 构造 ContextEnvelope（临时简化版本）
                        let envelope = ContextEnvelope {
                            device_id: device_id.to_string(),
                            app: super::super::types::AppCtx {
                                package: "unknown".to_string(),
                                activity: None,
                            },
                            snapshot: super::super::types::SnapshotCtx {
                                analysis_id: Some(analysis_id.to_string()),
                                screen_hash: None,
                                xml_cache_id: None,
                                xml_content: None,  // 🆕 智能降级功能支持
                            },
                            execution_mode: ExecutionMode::Strict,
                        };
                        
                        // 调用统一的单步执行器
                        match execute_single_step_internal(app, &envelope, single_step_spec).await {
                            Ok(result) => {
                                // 从返回结果中提取坐标信息
                                let click_coords = if let Some(coords_val) = result.get("coords") {
                                    if let (Some(x), Some(y)) = (
                                        coords_val.get(0).and_then(|v| v.as_i64()),
                                        coords_val.get(1).and_then(|v| v.as_i64()),
                                    ) {
                                        (x as i32, y as i32)
                                    } else {
                                        (0, 0)
                                    }
                                } else {
                                    (0, 0)
                                };
                                
                                tracing::info!("✅ 智能步骤 {} 执行成功 (通过单步执行器)，坐标: {:?}", score.step_id, click_coords);
                                
                                // 发送执行成功事件
                                emit_progress(
                                    app,
                                    Some(analysis_id.to_string()),
                                    Some(score.step_id.clone()),
                                    Phase::Executed,
                                    Some(1.0),
                                    Some(format!("🧠 智能分析成功执行步骤: {}", score.step_id)),
                                    None,
                                )?;
                                
                                tracing::info!("✅ 智能分析后备方案执行成功: stepId={}, coords={:?}", score.step_id, click_coords);
                                
                                return Ok((Some(score.step_id.clone()), Some(click_coords), true));
                            }
                            Err(err) => {
                                tracing::warn!("❌ 智能步骤 {} 执行失败 (通过单步执行器): {}", score.step_id, err);
                                continue;
                            }
                        }
                    }
                }
                
                tracing::warn!("❌ 所有智能生成步骤都未满足阈值或执行失败");
            } else {
                tracing::warn!("❌ 后备智能策略分析未生成候选步骤");
            }
        }
        Err(e) => {
            tracing::warn!("❌ 后备智能策略分析失败: {}", e);
        }
    }
    
    // 智能分析也失败了
    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::Finished,
        Some(0.0),
        Some("传统匹配和智能分析都未找到可执行的步骤".to_string()),
        None,
    )?;
    
    tracing::warn!("❌ 链式执行失败: 传统匹配和智能分析都未找到可执行步骤 (阈值: {:.2})", threshold);
    
    Ok((None, None, false))
}

/// 辅助函数：从StepRefOrInline提取步骤ID
fn extract_step_id(step: &StepRefOrInline, idx: usize) -> String {
    if let Some(ref_id) = &step.r#ref {
        ref_id.clone()
    } else if let Some(inline) = &step.inline {
        inline.step_id.clone()
    } else {
        format!("step_{}", idx)
    }
}

/// 辅助函数：检测是否显式结构模式（matchingStrategy === 'structural'）
/// 检查 inline.params 顶层以及 originalParams 内的 matchingStrategy
fn steps_have_explicit_structural_mode(steps: &[StepRefOrInline]) -> bool {
    for step in steps {
        if let Some(inline) = &step.inline {
            // 顶层 matchingStrategy
            let top = inline
                .params
                .get("matchingStrategy")
                .and_then(|v| v.as_str())
                .map(|s| s.eq_ignore_ascii_case("structural"))
                .unwrap_or(false);

            // originalParams 内 matchingStrategy
            let nested = inline
                .params
                .get("originalParams")
                .and_then(|p| p.get("matchingStrategy"))
                .and_then(|v| v.as_str())
                .map(|s| s.eq_ignore_ascii_case("structural"))
                .unwrap_or(false);

            if top || nested {
                return true;
            }
        }
    }
    false
}
