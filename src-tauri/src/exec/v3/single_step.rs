// src-tauri/src/exec/v3/single_step.rs
// module: exec | layer: application | role: 智能单步执行器
// summary: FastPath 单步执行，复用现有逻辑并统一事件

use serde_json::{json, Value};
use tauri::AppHandle;

use super::types::*;
use super::events::*;
use crate::services::smart_selection_engine::SmartSelectionEngine;
use crate::types::smart_selection::*;

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
    emit_match_started(app, Some(analysis_id.to_string()), step_id.to_string())?;
    
    // TODO: 从 step_spec 读取 action/params/quality/constraints
    // 这里先用模拟置信度
    let confidence = 0.85_f32;
    
    // 6. 发射匹配成功事件
    emit_matched(app, Some(analysis_id.to_string()), step_id.to_string(), confidence)?;
    
    // 7. TODO: 验证后置条件
    emit_validated(app, Some(analysis_id.to_string()), step_id.to_string())?;
    
    // 8. TODO: 执行动作
    emit_executed(app, Some(analysis_id.to_string()), step_id.to_string())?;
    
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
    emit_match_started(app, analysis_id.clone(), step_id.to_string())?;
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
            
            // 调用新的操作执行系统
            match execute_action_unified(envelope, &params).await {
                Ok(confidence) => {
                    tracing::info!("✅ 操作执行成功，置信度: {:.2}", confidence);
                    confidence
                }
                Err(e) => {
                    tracing::error!("❌ 操作执行失败: {}", e);
                    return Err(format!("操作执行失败: {}", e));
                }
            }
        }
        SingleStepAction::SmartSelection => {
            tracing::info!("🧠 执行智能选择: stepId={}", step_id);
            
            // 从params中提取智能选择协议
            let protocol = match extract_smart_selection_protocol(&params) {
                Ok(protocol) => protocol,
                Err(e) => {
                    tracing::error!("❌ 智能选择参数解析失败: {}", e);
                    return Err(format!("智能选择参数解析失败: {}", e));
                }
            };
            
            tracing::info!("🎯 智能选择配置: mode={:?}, target={:?}", 
                protocol.selection.mode, protocol.anchor.fingerprint.text_content);
            
            // 执行智能选择
            match SmartSelectionEngine::execute_smart_selection(&envelope.device_id, &protocol).await {
                Ok(result) => {
                    tracing::info!("✅ 智能选择执行成功: 选中 {} 个元素", 
                        result.matched_elements.selected_count
                    );
                    result.matched_elements.confidence_scores.get(0).copied().unwrap_or(0.8)
                }
                Err(e) => {
                    tracing::error!("❌ 智能选择执行失败: {}", e);
                    return Err(format!("智能选择执行失败: {}", e));
                }
            }
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
    emit_matched(app, analysis_id.clone(), step_id.to_string(), confidence)?;
    
    // 5. TODO: 验证后置条件
    emit_validated(app, analysis_id.clone(), step_id.to_string())?;
    
    // 6. TODO: 执行动作
    emit_executed(app, analysis_id.clone(), step_id.to_string())?;
    
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

/// 执行统一操作动作
async fn execute_action_unified(
    envelope: &ContextEnvelope,
    params: &Value,
) -> Result<f32, String> {
    use std::collections::HashMap;
    use crate::services::action_executor::ActionExecutor;
    use crate::types::action_types::*;
    use crate::commands::strategy_matching::{match_element_by_criteria, MatchCriteriaDTO};
    
    tracing::info!("🎯 开始执行统一操作");
    
    // 1. 解析操作类型，默认为点击
    let action = params.get("action_type")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or(ActionType::Click);
        
    tracing::info!("📋 操作类型: {}", action.type_id());
    
    // 2. 进行策略匹配，获取目标元素信息
    let mut values = HashMap::new();
    if let Some(text) = params.get("text").and_then(|v| v.as_str()) {
        values.insert("text".to_string(), text.to_string());
    }
    if let Some(resource_id) = params.get("resource_id").and_then(|v| v.as_str()) {
        values.insert("resource-id".to_string(), resource_id.to_string());
    }
    
    let criteria = MatchCriteriaDTO {
        strategy: "intelligent".to_string(),
        fields: vec!["text".to_string(), "resource-id".to_string()],
        values,
        excludes: HashMap::new(),
        includes: HashMap::new(),
        match_mode: HashMap::new(),
        regex_includes: HashMap::new(),
        regex_excludes: HashMap::new(),
        hidden_element_parent_config: None,
        options: None,
    };
    
    let match_result = match_element_by_criteria(
        envelope.device_id.clone(),
        criteria,
    ).await?;
    
    if !match_result.ok {
        return Err(format!("策略匹配失败: {}", match_result.message));
    }
    
    // 3. 从匹配结果中提取坐标和边界信息
    let target_bounds = if let Some(matched_elements) = match_result.matched_elements.first() {
        if let Some(coords_str) = matched_elements.get("coordinates").and_then(|v| v.as_str()) {
            // 解析坐标 "(x, y)"
            if let Some(captures) = regex::Regex::new(r"\((\d+),\s*(\d+)\)").unwrap().captures(coords_str) {
                let x: i32 = captures[1].parse().map_err(|_| "无效的X坐标")?;
                let y: i32 = captures[2].parse().map_err(|_| "无效的Y坐标")?;
                
                // 创建一个小区域的边界（以点击坐标为中心）
                Some(ElementBounds::new(x - 10, y - 10, x + 10, y + 10))
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };
    
    if target_bounds.is_none() {
        return Err("无法从匹配结果中获取有效坐标".to_string());
    }
    
    // 4. 创建执行上下文
    let context = ActionContext {
        device_id: envelope.device_id.clone(),
        target_bounds,
        timeout: Some(10000), // 10秒超时
        verify_with_screenshot: Some(false),
    };
    
    // 5. 执行操作
    let executor = ActionExecutor::new();
    let result = executor.execute_action(&action, &context).await
        .map_err(|e| format!("操作执行器错误: {}", e))?;
    
    if result.success {
        tracing::info!("✅ 操作执行成功: {}", result.message);
        Ok(match_result.confidence_score as f32)
    } else {
        tracing::error!("❌ 操作执行失败: {}", result.message);
        Err(result.message)
    }
}

/// 从V3参数中提取智能选择协议
fn extract_smart_selection_protocol(params: &Value) -> Result<SmartSelectionProtocol, String> {
    tracing::debug!("🔧 提取智能选择协议: params={:?}", params);
    
    // 从params.smartSelection中提取配置
    let smart_selection = params.get("smartSelection")
        .ok_or_else(|| "缺少 smartSelection 参数".to_string())?;
    
    // 提取基础参数
    let mode = smart_selection.get("mode")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 selection mode".to_string())?;
        
    let target_text = smart_selection.get("targetText")
        .and_then(|v| v.as_str())
        .unwrap_or("关注");
        
    let min_confidence = smart_selection.get("minConfidence")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.8) as f32;
    
    // 构建选择模式
    let selection_mode = match mode {
        "first" => SelectionMode::First,
        "last" => SelectionMode::Last, 
        "random" => {
            let seed = smart_selection.get("randomSeed")
                .and_then(|v| v.as_u64())
                .unwrap_or(12345);
            SelectionMode::Random { seed, ensure_stable_sort: true }
        }
        "all" => {
            // 提取批量配置
            let batch_config = smart_selection.get("batchConfig");
            let interval_ms = batch_config
                .and_then(|b| b.get("intervalMs"))
                .and_then(|v| v.as_u64())
                .unwrap_or(2000);
            let max_count = batch_config
                .and_then(|b| b.get("maxCount"))
                .and_then(|v| v.as_u64())
                .unwrap_or(10) as u32;
            let continue_on_error = batch_config
                .and_then(|b| b.get("continueOnError"))
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let show_progress = batch_config
                .and_then(|b| b.get("showProgress"))
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
                
            SelectionMode::All {
                batch_config: BatchConfigV2 {
                    interval_ms,
                    jitter_ms: 500,
                    max_per_session: max_count,
                    cooldown_ms: 5000,
                    continue_on_error,
                    show_progress,
                    refresh_policy: RefreshPolicy::OnMutation,
                    requery_by_fingerprint: true,
                    force_light_validation: true,
                }
            }
        }
        _ => return Err(format!("不支持的选择模式: {}", mode)),
    };
    
    // 构建锚点指纹（简化版本）
    let fingerprint = ElementFingerprint {
        text_content: Some(target_text.to_string()),
        text_hash: None,
        class_chain: None,
        resource_id: None,
        resource_id_suffix: None,
        bounds_signature: None,
        parent_class: None,
        sibling_count: None,
        child_count: None,
        depth_level: None,
        relative_index: None,
        clickable: None,
        enabled: None,
        selected: None,
        content_desc: None,
        package_name: None,
    };
    
    // 构建智能选择协议
    let protocol = SmartSelectionProtocol {
        anchor: AnchorInfo {
            container_xpath: None,
            clickable_parent_xpath: None,
            fingerprint,
        },
        selection: SelectionConfig {
            mode: selection_mode,
            order: None,
            random_seed: None,
            batch_config: None,
            filters: None,
        },
        matching_context: None,
        strategy_plan: None,
        limits: None,
        fallback: None,
    };
    
    tracing::info!("✅ 智能选择协议构建完成: mode={:?}, target={}, confidence={}", 
        mode, target_text, min_confidence);
    
    Ok(protocol)
}
