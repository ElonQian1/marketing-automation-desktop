// src-tauri/src/exec/v3/chain_engine.rs
// module: exec | layer: v3 | role: V3智能自动链执行引擎
// summary: V3核心算法：智能评分+阈值短路+失败回退，完全替代V2顺序执行
//
// � 详细架构文档: docs/architecture/V3_CHAIN_ENGINE_ARCHITECTURE.md

use super::events::{emit_complete, emit_progress};
use super::types::{
    ChainMode, ChainSpecV3, ConstraintSettings, ContextEnvelope, ExecutionMode, InlineStep, Phase,
    Point, QualitySettings, ResultPayload, SingleStepAction, SingleStepSpecV3, StepRefOrInline, 
    StepScore, Summary, ValidationSettings,
};
use std::time::Instant;
use tauri::AppHandle;

// 🆕 集成执行中止服务
use crate::services::execution_abort_service::{should_abort_execution, register_execution, finish_execution};

// 添加必要的导入以支持真实设备操作
use crate::services::intelligent_analysis_service::{ElementInfo, StrategyCandidate};
use crate::services::universal_ui_page_analyzer::UIElement; // 添加 UIElement 导入

// 🆕 V3 新模块：多候选评估和失败恢复
use super::element_matching::{
    calculate_distance, EvaluationCriteria, MultiCandidateEvaluator, TextComparator, XPathMatcher,
};
// ⚠️ 暂时禁用 recovery_manager（编译错误待修复）
// use super::recovery_manager::{RecoveryContext, attempt_recovery};

// 🆕 导入helpers模块中的辅助函数（避免代码重复）
use super::helpers::element_matching::{
    convert_uielement_to_candidate as helper_convert_candidate, element_has_child_with_text,
    extract_child_text_filter_from_xpath, extract_resource_id_from_xpath,
    extract_target_features_from_params as helper_extract_features,
    find_all_elements_by_text_or_desc as helper_find_all_elements,
    find_element_by_text_or_desc as helper_find_element,
    parse_bounds_center as helper_parse_bounds,
};

// 🆕 导入helpers模块中的智能分析功能（避免代码重复）
use super::helpers::intelligent_analysis::{
    analyze_user_intent_from_params, calculate_context_fitness, calculate_interaction_capability,
    calculate_position_weight, calculate_semantic_match, calculate_text_relevance,
    determine_semantic_role_from_class, extract_all_interactive_elements_from_xml,
    extract_intelligent_targets_from_xml, is_potentially_interactive, score_elements_intelligently,
    DeviceInfo, InteractiveElement, ScoredElement, UserIntent,
};

// 🆕 导入helpers模块中的协议构建功能（避免代码重复）
use super::helpers::protocol_builders::{
    create_smart_selection_protocol_for_execution, create_smart_selection_protocol_for_scoring,
};

// 🆕 导入helpers模块中的策略生成功能（避免代码重复）
use super::helpers::strategy_generation::{
    assess_risk_level, convert_analysis_result_to_v3_steps, convert_strategies_to_v3_steps,
    create_execution_plan, determine_strategy_type, generate_fallback_strategy_steps,
    generate_strategy_candidates, select_optimal_strategies,
};

// 🆕 导入helpers模块中的步骤优化功能（避免代码重复）
use super::helpers::step_optimization::{
    check_if_step_duplicate, extract_step_target_text, get_step_id, merge_and_optimize_steps,
};

// 🆕 导入helpers模块中的执行追踪功能（避免代码重复）
use super::helpers::execution_tracker;

// 🆕 导入helpers模块中的设备管理功能（避免代码重复）
use super::helpers::device_manager;

// 🆕 导入helpers模块中的步骤执行功能（避免代码重复）
use super::helpers::step_executor;

// 🆕 导入helpers模块中的智能分析辅助功能（避免代码重复）
use super::helpers::analysis_helpers::{
    call_frontend_intelligent_analysis, perform_intelligent_strategy_analysis_from_raw,
    should_trigger_intelligent_analysis, should_trigger_intelligent_analysis_early,
};

// 🆕 导入helpers模块中的步骤评分功能（避免代码重复）
use super::helpers::step_scoring::score_step_with_smart_selection;

// 🆕 导入helpers模块中的Phase处理功能（避免代码重复）
use super::helpers::phase_handlers::{handle_intelligent_fallback, score_steps_by_mode};

// 🆕 导入helpers模块中的智能预处理功能（避免代码重复）
use super::helpers::intelligent_preprocessing::{
    check_and_trigger_early_analysis, log_final_steps, optimize_steps_with_intelligent_analysis,
};

use crate::types::smart_selection::{
    AnchorInfo, ElementFingerprint, SelectionConfig, SelectionMode, SmartSelectionProtocol,
};

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
        ChainSpecV3::ByRef {
            analysis_id,
            threshold,
            mode,
        } => {
            tracing::info!("🔗 [by-ref] 从缓存读取链式结果: analysisId={}", analysis_id);

            // TODO: 从缓存读取 ChainResult(analysis_id)
            // let chain_result = CACHE.get_chain_result(analysis_id)
            //     .ok_or_else(|| format!("❌ 分析结果未找到: {}", analysis_id))?;
            // let ordered_steps = chain_result.ordered_steps;

            execute_chain_by_ref(app, envelope, analysis_id, *threshold, mode).await
        }
        ChainSpecV3::ByInline {
            chain_id,
            ordered_steps,
            threshold,
            mode,
            quality,
            constraints,
            validation,
        } => {
            let analysis_id = chain_id.as_deref().unwrap_or("inline-chain");
            tracing::info!(
                "🔗 [by-inline] 直接执行内联链: chainId={:?}, 步骤数={}",
                chain_id,
                ordered_steps.len()
            );

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
            )
            .await
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

    // 🧠 由于没有从缓存读取到有效的候选步骤，触发智能策略分析
    tracing::info!("🧠 触发智能策略分析：缓存中无有效候选步骤");

    emit_progress(
        app,
        Some(analysis_id.to_string()),
        None,
        Phase::DeviceReady,
        None,
        Some("缓存无候选步骤，启动智能策略分析 (Step 1-8)".to_string()),
        None,
    )?;

    // TODO: 实现从缓存读取 ordered_steps 和策略详情
    // TODO: 如果缓存为空或无效，调用智能策略系统生成候选策略
    //
    // 🎯 V3架构 - 统一步骤序号体系：
    //   Step 1-2: 结构匹配优先（卡片子树、叶子上下文）
    //   Step 3-8: 传统策略（自锚定、子元素驱动、区域约束、XPath兜底、索引兜底、应急兜底）
    //
    // 集成步骤：
    // 1. 尝试从缓存读取 ChainResult
    // 2. 如果缓存无效或为空，获取目标元素信息
    // 3. 调用 StrategyDecisionEngine 进行 Step 1-8 分析
    // 4. 将分析结果转换为 ordered_steps 并执行

    tracing::warn!("🚧 缓存读取和智能分析集成待实现");
    tracing::warn!("   TODO: 实现缓存读取逻辑");
    tracing::warn!(
        "   TODO: 集成 src/modules/intelligent-strategy-system/core/StrategyDecisionEngine"
    );

    // 暂时返回失败，提示需要智能分析
    emit_complete(
        app,
        Some(analysis_id.to_string()),
        Some(Summary {
            adopted_step_id: None,
            elapsed_ms: Some(start_time.elapsed().as_millis() as u64),
            reason: Some("缓存无候选步骤，需要智能策略分析".to_string()),
        }),
        None,
        Some(ResultPayload {
            ok: false, // 标记为失败，提示需要重新分析
            coords: None,
            candidate_count: Some(0),
            screen_hash_now: None,
            validation: None,
        }),
    )?;

    Ok(())
}

/// 🚨 V3链式执行核心函数 - 必须包含真机设备操作
///
/// ⚠️ 重要历史警告：此函数曾经只执行模拟分析，不执行真机操作！
///
/// 真机操作验证清单：
/// ✅ 设备连接检查 (简化版避免复杂依赖)
/// ✅ 真实UI XML dumping (adb_dump_ui_xml)
/// ✅ SmartSelectionEngine执行 (实际元素匹配和点击)
/// ✅ 从execution_info.click_coordinates获取真实点击坐标
///
/// 🚫 绝对禁止仅返回"executed"状态而不执行真机操作！
fn execute_chain_by_inline<'a>(
    app: &'a AppHandle,
    envelope: &'a ContextEnvelope,
    analysis_id: &'a str,
    ordered_steps: &'a [StepRefOrInline],
    threshold: f32,
    mode: &'a ChainMode,
    quality: &'a QualitySettings,
    constraints: &'a ConstraintSettings,
    validation: &'a ValidationSettings,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + 'a>> {
    Box::pin(async move {
        let start_time = Instant::now();
        let device_id = &envelope.device_id;

        // 🆕 【执行注册】注册执行到中止服务
        let execution_id = format!("v3_chain_{}", analysis_id);
        register_execution(execution_id.clone(), device_id.clone());
        
        // 🔒 【统一锁定入口】使用 RAII 守卫确保所有路径都能正确释放
        // 这会在函数开始时锁定，在函数结束时（无论成功/失败）自动释放
        let _execution_guard = execution_tracker::lock_with_guard(analysis_id)?;

        // 🆕 【提前智能分析检测】在Legacy引擎执行前检查参数，直接触发智能分析
        if let Some(intelligent_steps) =
            check_and_trigger_early_analysis(app, analysis_id, device_id, ordered_steps).await?
        {
            // ✅ 显式释放当前锁（让守卫析构）
            drop(_execution_guard);

            // 递归执行智能生成的步骤（递归调用时会重新锁定）
            return execute_chain_by_inline(
                app,
                envelope,
                analysis_id,
                &intelligent_steps,
                threshold,
                mode,
                quality,
                constraints,
                validation,
            )
            .await;
        }

        // 🎯 V3修复：智能策略分析策略调整
        // 只有在缺少候选步骤或步骤质量不佳时才触发智能分析，避免不必要的重复生成
        let generated_steps = optimize_steps_with_intelligent_analysis(
            app,
            analysis_id,
            device_id,
            ordered_steps,
            quality,
            threshold,
        )
        .await?;

        let final_ordered_steps = &generated_steps;

        // 🔍 调试日志：显示最终步骤列表详情
        log_final_steps(final_ordered_steps);

        emit_progress(
            app,
            Some(analysis_id.to_string()),
            None,
            Phase::MatchStarted,
            None,
            Some(format!("准备执行 {} 个候选步骤", final_ordered_steps.len())),
            None,
        )?;

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

        // 1. 校验设备连接状态 - 简化版本（暂时跳过，避免复杂的依赖）
        // 注意：在生产环境中应该进行设备连接检查
        device_manager::check_device_connection(device_id).await?;

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

        // 2. 🎯 获取 XML 数据源（三级降级：全局缓存 → 步骤快照 → 实时设备）
        let ui_xml = super::helpers::xml_source_resolver::resolve_xml_source(app, envelope).await?;
        
        // 计算当前屏幕哈希（用于判断是否需要重评分）
        let screen_hash = super::helpers::device_manager::calculate_screen_hash(&ui_xml);

        // ====== Phase 3: match_started ======
        if final_ordered_steps.as_ptr() == ordered_steps.as_ptr() {
            // 没有进行智能分析，正常发送match_started事件
            emit_progress(
                app,
                Some(analysis_id.to_string()),
                None,
                Phase::MatchStarted,
                None,
                Some(format!("开始评分 {} 个链式步骤", final_ordered_steps.len())),
                None,
            )?;
        }

        // ====== Phase 4: 决定是否重新评分（Strict vs Relaxed） ======
        let mut step_scores = score_steps_by_mode(
            device_id,
            &ui_xml,
            &final_ordered_steps,
            quality,
            &envelope.execution_mode,
            &screen_hash,
            envelope.snapshot.screen_hash.as_deref(),
        )
        .await?;

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

        // 4. 按置信度排序，尝试执行分数 ≥ threshold 的步骤 - 真实设备操作
        // 关键修复：必须进行真实的设备点击操作，而不仅仅是分析
        for score in &step_scores {
            // 🛑 【中止检查】在每个步骤执行前检查是否应该中止
            if should_abort_execution(&execution_id) {
                tracing::warn!("🛑 [V3执行] 检测到中止信号，停止执行链: {}", analysis_id);
                finish_execution(&execution_id);
                return Err("执行已被用户中止".to_string());
            }

            if score.confidence < threshold {
                tracing::info!(
                    "⏭️ 跳过低分步骤 {} (置信度: {:.2} < 阈值: {:.2})",
                    score.step_id,
                    score.confidence,
                    threshold
                );
                continue;
            }

            // 找到对应的步骤定义
            let step = final_ordered_steps
                .iter()
                .find(|s| {
                    let step_id = if let Some(ref_id) = &s.r#ref {
                        ref_id.as_str()
                    } else if let Some(inline) = &s.inline {
                        inline.step_id.as_str()
                    } else {
                        ""
                    };
                    step_id == score.step_id
                })
                .ok_or_else(|| format!("步骤 {} 在orderedSteps中未找到", score.step_id))?;

            // 发射验证开始事件
            emit_progress(
                app,
                Some(analysis_id.to_string()),
                Some(score.step_id.clone()),
                Phase::Validated,
                Some(score.confidence),
                Some(format!(
                    "尝试执行步骤: {} (置信度: {:.2})",
                    score.step_id, score.confidence
                )),
                None,
            )?;

            // 提取 inline 步骤
            let inline_step = step
                .inline
                .as_ref()
                .ok_or_else(|| format!("步骤 {} 没有inline定义", score.step_id))?;

            // 🎯 核心修改：调用智能单步执行器，建立包含关系
            // 智能自动链 = 智能单步的循环执行
            tracing::info!("🔗 [智能自动链] 调用智能单步执行器: stepId={}", score.step_id);
            
            // 构造 SingleStepSpecV3
            let single_step_spec = SingleStepSpecV3::ByInline {
                step_id: inline_step.step_id.clone(),
                action: inline_step.action.clone(),
                params: inline_step.params.clone(),
                quality: quality.clone(),
                constraints: constraints.clone(),
                validation: validation.clone(),
            };
            
            // 调用智能单步执行器（复用单步逻辑）
            match super::single_step::execute_single_step_internal(
                app,
                envelope,
                single_step_spec,
            )
            .await
            {
                Ok(result) => {
                    // 从返回结果中提取坐标信息
                    let click_coords = if let Some(coords_val) = result.get("coords") {
                        // 尝试解析坐标
                        if let (Some(x), Some(y)) = (
                            coords_val.get(0).and_then(|v| v.as_i64()),
                            coords_val.get(1).and_then(|v| v.as_i64()),
                        ) {
                            (x as i32, y as i32)
                        } else {
                            // 如果没有坐标，使用默认值
                            (0, 0)
                        }
                    } else {
                        (0, 0)
                    };
                    
                    // 执行成功，短路返回
                    tracing::info!(
                        "✅ [智能自动链] 步骤 {} 执行成功 (通过智能单步)，坐标: {:?}",
                        score.step_id,
                        click_coords
                    );
                    adopted_step_id = Some(score.step_id.clone());
                    execution_ok = true;
                    coords = Some(click_coords);
                    break;
                }
                Err(err) => {
                    // 执行失败，记录日志并尝试下一个
                    tracing::warn!(
                        "❌ [智能自动链] 步骤 {} 执行失败 (通过智能单步): {}，尝试下一个候选步骤",
                        score.step_id,
                        err
                    );
                    continue;
                }
            }
        }

        // ====== Phase 7: executed ======
        // 🚨 关键修复：只有在真正执行了操作时才发送executed事件，避免误报成功
        if execution_ok && adopted_step_id.is_some() {
            let step_id = adopted_step_id.as_ref().unwrap();
            emit_progress(
                app,
                Some(analysis_id.to_string()),
                Some(step_id.clone()),
                Phase::Executed,
                Some(1.0), // 真正执行成功时才设置100%置信度
                Some(format!("成功执行步骤: {}", step_id)),
                None,
            )?;

            tracing::info!(
                "✅ 真实设备操作完成: stepId={}, coords={:?}",
                step_id,
                coords
            );
        } else {
            // 🧠 传统匹配失败，触发智能分析作为后备方案
            let fallback_result = handle_intelligent_fallback(
                app,
                analysis_id,
                device_id,
                ordered_steps,
                &ui_xml,
                quality,
                validation,
                threshold,
            )
            .await?;

            adopted_step_id = fallback_result.0;
            coords = fallback_result.1;
            execution_ok = fallback_result.2;
        }

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

        // 🔓 【执行保护】RAII 守卫会在函数结束时自动释放锁
        // 不再需要手动 unlock，由 _execution_guard 的 Drop 实现自动管理

        // 🆕 【执行清理】完成执行后清理中止服务状态
        finish_execution(&execution_id);

        Ok(())
    })
}

// ====== 内部辅助函数（TODO: 实现） ======

// � [已迁移] 步骤评分函数已迁移到 helpers/step_scoring.rs
// - score_step_with_smart_selection - 基于SmartSelection引擎的智能评分

// 🔧 [已迁移] 协议构建函数已迁移到 helpers/protocol_builders.rs

// 🔧 [已迁移] 协议构建函数已迁移到 helpers/protocol_builders.rs
// - create_smart_selection_protocol_for_scoring
// - create_smart_selection_protocol_for_execution

// 🔧 [已迁移] 智能分析触发判断函数已迁移到 helpers/analysis_helpers.rs
// - should_trigger_intelligent_analysis_early   - 提前检测是否需要智能分析
// - should_trigger_intelligent_analysis         - 判断是否需要触发智能策略分析
// - perform_intelligent_strategy_analysis_from_raw - 从原始数据执行智能策略分析

// 🔧 [已迁移] 设备管理相关函数已迁移到 helpers/device_manager.rs
// - get_ui_snapshot                      - 获取UI XML快照
// - calculate_screen_hash                - 计算屏幕哈希
// - get_snapshot_with_hash               - 获取快照和哈希
// - check_device_connection              - 检查设备连接
// - get_device_basic_info                - 获取设备基础信息
// - ensure_device_ready                  - 验证设备准备就绪
// - is_screen_changed                    - 比较屏幕哈希

// 🔧 [已迁移] 智能分析相关函数已迁移到 helpers/intelligent_analysis.rs
// - extract_all_interactive_elements_from_xml
// - is_potentially_interactive
// - determine_semantic_role_from_class
// - analyze_user_intent_from_params
// - score_elements_intelligently
// - calculate_* 系列评分函数
// - extract_intelligent_targets_from_xml

// 🔧 [已迁移] 策略生成相关函数已迁移到 helpers/strategy_generation.rs
// - generate_strategy_candidates        - 从评分元素生成策略候选
// - determine_strategy_type              - 确定策略类型
// - create_execution_plan                - 创建执行计划
// - assess_risk_level                    - 评估风险等级
// - select_optimal_strategies            - 选择最优策略
// - convert_strategies_to_v3_steps       - 转换为V3步骤格式
// - generate_fallback_strategy_steps     - 生成回退策略
// - convert_analysis_result_to_v3_steps  - 智能分析结果转换

// 🔧 [已迁移] 智能分析触发判断函数已迁移到 helpers/analysis_helpers.rs
// - should_trigger_intelligent_analysis_early   - 提前检测是否需要智能分析
// - should_trigger_intelligent_analysis         - 判断是否需要触发智能策略分析
// - perform_intelligent_strategy_analysis_from_raw - 从原始数据执行智能策略分析
// - call_frontend_intelligent_analysis_with_context - 增强版前端调用（包含上下文）
// - call_frontend_intelligent_analysis             - 标准前端智能分析调用

// 🔧 [已迁移] 步骤优化相关函数已迁移到 helpers/step_optimization.rs
// - merge_and_optimize_steps       - 合并智能分析步骤和原始步骤
// - check_if_step_duplicate         - 检查步骤是否重复
// - extract_step_target_text        - 提取目标文本用于去重
// - get_step_id                     - 获取步骤ID用于日志

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

// ================================================================
// 🚨 【V3执行引擎重复点击问题防护总结】
// ================================================================
//
// 📋 问题根因：
//   V3智能自动链执行过程中，存在两个不同的执行阶段，容易导致重复点击：
//   1️⃣ 评分阶段 - 用于计算步骤可行性，不应执行真实操作
//   2️⃣ 执行阶段 - 用于执行真实设备操作，必须且仅执行一次
//
// 🔧 解决方案：
//   ✅ 评分阶段 (score_step_with_smart_selection):
//      - 仅调用 SmartSelectionEngine::parse_xml_and_find_candidates
//      - 严禁调用 tap_injector_first 或任何执行函数
//      - 只返回置信度分数，不执行设备操作
//
//   ✅ 执行阶段 (execute_step_real_operation):
//      - 使用 SmartSelectionEngine::analyze_for_coordinates_only 获取坐标
//      - 根据选择模式调用相应次数的 tap_injector_first
//      - 确保每种模式都有明确的执行逻辑和次数
//
// 🎛️ 选择模式执行保证：
//   • "first" 模式  → 执行且仅执行第1个坐标的点击
//   • "all" 模式    → 执行且仅执行所有坐标的批量点击
//   • "random" 模式 → 执行且仅执行随机选择坐标的点击
//   • 其他模式      → 执行且仅执行第1个坐标的点击 (默认行为)
//
// ⚠️ 开发注意事项：
//   1. 在修改评分阶段代码时，绝不添加任何 tap_injector_* 调用
//   2. 在修改执行阶段代码时，确保每个分支都有且仅有一次点击操作
//   3. 新增选择模式时，必须明确定义其点击执行逻辑
//   4. 所有日志都应明确标识当前处于评分阶段还是执行阶段
//
// 🔍 调试技巧：
//   - 搜索日志中的 "【评分阶段】" 和 "【执行阶段】" 标识
//   - 确认 "仅评分，无实际点击" 和 "执行成功" 的日志对应关系
//   - 检查每个选择模式的执行次数是否符合预期
//
// 📊 验证检查清单：
//   □ "first" 模式只点击一次，且为第一个匹配元素
//   □ "all" 模式点击所有匹配元素，每个元素只点击一次
//   □ 评分阶段的日志不包含任何 "点击执行成功" 信息
//   □ 执行阶段的日志包含明确的坐标和执行结果
//   □ 整个流程中没有出现重复的 tap_injector_first 调用
//
// ================================================================

// 🔧 [已迁移] 步骤执行相关函数已迁移到 helpers/step_executor.rs
// - execute_step_real_operation          - 执行真实设备操作（包装函数）
// - execute_intelligent_analysis_step    - 执行智能分析生成的步骤（主函数）
// - extract_target_text_from_params      - 提取目标文本
// - collect_candidate_elements           - 收集候选元素
// - evaluate_best_candidate              - 评估最佳候选
// - attempt_element_recovery             - 尝试元素恢复
// - ensure_clickable_element             - 确保元素可点击
// - execute_click_action                 - 执行点击操作

// ============================================
// 辅助函数已全部迁移到 helpers/ 子模块
// 所有 element_matching 相关函数请使用：
//   - extract_resource_id_from_xpath
//   - extract_child_text_filter_from_xpath
//   - element_has_child_with_text
//   - helper_find_element (原 find_element_by_text_or_desc)
//   - helper_find_all_elements (原 find_all_elements_by_text_or_desc)
//   - helper_parse_bounds (原 parse_bounds_center)
//   - helper_convert_candidate (原 convert_uielement_to_candidate)
//   - helper_extract_features (原 extract_target_features_from_params)
// ============================================

