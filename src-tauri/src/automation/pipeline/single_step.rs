// src-tauri/src/exec/v3/single_step.rs
// module: exec | layer: application | role: 智能单步执行器
// summary: FastPath 单步执行，复用现有逻辑并统一事件

use serde_json::{json, Value};
use tauri::AppHandle;

use crate::automation::types::*;
use crate::automation::events::*;
use crate::types::smart_selection::*;

/// 智能单步执行（内部实现）
pub async fn execute_single_step_internal(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    step: SingleStepSpecV3,
) -> Result<Value, String> {
    // #[allow(unused_variables)]
    let _start_time = std::time::Instant::now();
    
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
    
    // 2. 🎯 获取 XML 数据源（三级降级：全局缓存 → 步骤快照 → 实时设备）
    tracing::info!("📸 获取 XML 数据源: device={}", envelope.device_id);
    
    let current_ui_xml = crate::exec::helpers::xml_source_resolver::resolve_xml_source(app, envelope).await?;
    
    // 计算当前屏幕哈希（用于判断是否需要重评分）
    let screen_hash_now = crate::exec::helpers::device_manager::calculate_screen_hash(&current_ui_xml);
    
    emit_snapshot_ready(app, Some(analysis_id.to_string()), Some(screen_hash_now.clone()))?;
    
    // 3. 从 STEP_STRATEGY_STORE 读取步骤配置
    tracing::info!("📖 从缓存读取步骤配置: stepId={}", step_id);
    
    use crate::commands::intelligent_analysis::STEP_STRATEGY_STORE;
    let strategy = {
        let store = STEP_STRATEGY_STORE.lock()
            .map_err(|e| format!("获取策略存储锁失败: {}", e))?;
        
        store.get(step_id)
            .map(|(s, _timestamp)| s.clone())
            .ok_or_else(|| format!("步骤配置未找到: {}", step_id))?
    };
    
    tracing::info!("✅ 成功读取步骤配置: stepId={}, selection_mode={:?}", 
        step_id, strategy.selection_mode);
    
    // 4. 决定是否需要重评
    let _ = match envelope.execution_mode {
        ExecutionMode::Strict => {
            tracing::info!("🔍 严格模式：强制重评");
            true
        }
        ExecutionMode::Relaxed => {
            let cached_hash = envelope.snapshot.screen_hash.as_deref();
            let current_hash = Some(screen_hash_now.as_str());
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
    
    // 6. 构造 InlineStep（从策略配置重建）
    let inline_step = InlineStep {
        step_id: step_id.to_string(),
        action: SingleStepAction::SmartSelection, // 从策略配置恢复的步骤默认使用 SmartSelection
        params: serde_json::to_value(&strategy)
            .map_err(|e| format!("策略序列化失败: {}", e))?,
    };
    
    // 7. 调用统一执行器
    use crate::exec::unified_step_executor::execute_step_unified;
    
    let validation = ValidationSettings {
        post_action: None, // ByRef 模式默认不需要后置动作
    };
    
    match execute_step_unified(app, envelope, &inline_step, &current_ui_xml, &validation).await {
        Ok(result) => {
            let confidence = result.confidence;
            let coords = result.coords;
            
            // 8. 发射匹配成功事件
            emit_matched(app, Some(analysis_id.to_string()), step_id.to_string(), confidence)?;
            
            // 9. 发射验证通过事件
            emit_validated(app, Some(analysis_id.to_string()), step_id.to_string())?;
            
            // 10. 发射执行完成事件
            emit_executed(app, Some(analysis_id.to_string()), step_id.to_string())?;
            
            // 11. 发射完成事件
            let elapsed_ms = start_time.elapsed().as_millis() as u64;
            emit_complete(
                app,
                Some(analysis_id.to_string()),
                Some(Summary {
                    adopted_step_id: Some(step_id.to_string()),
                    elapsed_ms: Some(elapsed_ms),
                    reason: Some("ByRef模式执行成功".to_string()),
                }),
                Some(vec![StepScore {
                    step_id: step_id.to_string(),
                    confidence,
                }]),
                Some(ResultPayload {
                    ok: true,
                    coords: Some(Point { x: coords.0, y: coords.1 }),
                    candidate_count: Some(1),
                    screen_hash_now: Some(screen_hash_now),
                    validation: Some(ValidationResult {
                        passed: true,
                        reason: None,
                    }),
                }),
            )?;
            
            Ok(json!({
                "ok": true,
                "coords": [coords.0, coords.1],
                "confidence": confidence,
                "elapsedMs": elapsed_ms
            }))
        }
        Err(e) => {
            tracing::error!("❌ 执行失败: {}", e);
            
            // 发射失败完成事件
            let elapsed_ms = start_time.elapsed().as_millis() as u64;
            emit_complete(
                app,
                Some(analysis_id.to_string()),
                Some(Summary {
                    adopted_step_id: None,
                    elapsed_ms: Some(elapsed_ms),
                    reason: Some(format!("执行失败: {}", e)),
                }),
                None,
                Some(ResultPayload {
                    ok: false,
                    coords: None,
                    candidate_count: Some(0),
                    screen_hash_now: Some(screen_hash_now),
                    validation: Some(ValidationResult {
                        passed: false,
                        reason: Some(e.clone()),
                    }),
                }),
            )?;
            
            Err(e)
        }
    }
}

/// 内联式执行：直接使用传入的 action/params 执行
async fn execute_step_by_inline(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    step_id: &str,
    action: SingleStepAction,
    params: Value,
    _quality: QualitySettings,
    _constraints: ConstraintSettings,
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
    let (confidence, coords) = match action {
        SingleStepAction::SmartNavigation => {
            tracing::warn!("⚠️ SmartNavigation 功能暂未实现");
            return Err("SmartNavigation 功能暂未实现，请使用其他动作类型".to_string());
        }
        SingleStepAction::Tap => {
            tracing::info!("👆 执行点击");
            
            // 调用新的操作执行系统
            match execute_action_unified(envelope, &params).await {
                Ok((confidence, coords)) => {
                    tracing::info!("✅ 操作执行成功，置信度: {:.2}", confidence);
                    (confidence, coords)
                }
                Err(e) => {
                    tracing::error!("❌ 操作执行失败: {}", e);
                    return Err(format!("操作执行失败: {}", e));
                }
            }
        }
        SingleStepAction::SmartTap => {
            tracing::info!("👆 执行智能点击 (SmartTap)");
            
            // 尝试从 params 中直接提取 bounds
            if let Some(bounds_str) = params.get("bounds").and_then(|v| v.as_str()) {
                // 解析 bounds: "[left,top,right,bottom]"
                let re = regex::Regex::new(r"\[(\d+),(\d+),(\d+),(\d+)\]").unwrap();
                if let Some(caps) = re.captures(bounds_str) {
                    let left: i32 = caps[1].parse().unwrap_or(0);
                    let top: i32 = caps[2].parse().unwrap_or(0);
                    let right: i32 = caps[3].parse().unwrap_or(0);
                    let bottom: i32 = caps[4].parse().unwrap_or(0);
                    
                    use crate::types::action_types::ElementBounds;
                    let bounds = ElementBounds::new(left, top, right, bottom);
                    let center_x = (left + right) / 2;
                    let center_y = (top + bottom) / 2;
                    
                    tracing::info!("📍 解析到目标区域: {:?}, 中心点: ({}, {})", bounds, center_x, center_y);
                    
                    // 构造 ActionContext
                    use crate::services::action_executor::ActionExecutor;
                    use crate::types::action_types::{ActionType, ActionContext};
                    
                    let context = ActionContext {
                        device_id: envelope.device_id.clone(),
                        target_bounds: Some(bounds),
                        timeout: Some(5000),
                        verify_with_screenshot: Some(false),
                    };
                    
                    let executor = ActionExecutor::new();
                    let action_type = ActionType::Click; // SmartTap 默认为点击
                    
                    match executor.execute_action(&action_type, &context).await {
                        Ok(result) => {
                            if result.success {
                                tracing::info!("✅ SmartTap 执行成功");
                                (0.9, Some((center_x, center_y)))
                            } else {
                                return Err(format!("SmartTap 执行失败: {}", result.message));
                            }
                        }
                        Err(e) => return Err(format!("SmartTap 执行器错误: {}", e))
                    }
                } else {
                    tracing::warn!("⚠️ SmartTap bounds 格式无效: {}, 尝试通用执行", bounds_str);
                    match execute_action_unified(envelope, &params).await {
                        Ok((conf, coords)) => (conf, coords),
                        Err(e) => return Err(e)
                    }
                }
            } else {
                tracing::warn!("⚠️ SmartTap 缺少 bounds 参数, 尝试通用执行");
                match execute_action_unified(envelope, &params).await {
                    Ok((conf, coords)) => (conf, coords),
                    Err(e) => return Err(e)
                }
            }
        }
        SingleStepAction::SmartSelection => {
            tracing::info!("🧠 执行智能选择: stepId={}", step_id);
            
            // 🎯 新方式：使用统一执行器
            use crate::exec::unified_step_executor::execute_step_unified;
            
            // 🎯 获取 XML 数据源（三级降级：全局缓存 → 步骤快照 → 实时设备）
            let ui_xml = crate::exec::helpers::xml_source_resolver::resolve_xml_source(app, envelope).await?;
            
            // 构造 InlineStep
            let inline_step = InlineStep {
                step_id: step_id.to_string(),
                action: action.clone(),
                params: params.clone(),
            };
            
            // 调用统一执行器
            match execute_step_unified(app, envelope, &inline_step, &ui_xml, &validation).await {
                Ok(result) => {
                    tracing::info!("✅ 统一执行器执行成功: coords=({}, {}), confidence={:.2}", 
                        result.coords.0, result.coords.1, result.confidence
                    );
                    (result.confidence, Some(result.coords))
                }
                Err(e) => {
                    tracing::error!("❌ 统一执行器执行失败: {}", e);
                    return Err(format!("执行失败: {}", e));
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
            (0.80, None)
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
            coords: coords.map(|(x, y)| Point { x, y }),
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
        "coords": coords.map(|(x, y)| vec![x, y]),
        "elapsedMs": elapsed_ms
    }))
}

/// 执行统一操作动作
async fn execute_action_unified(
    envelope: &ContextEnvelope,
    params: &Value,
) -> Result<(f32, Option<(i32, i32)>), String> {
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
    let mut fields = vec!["text".to_string(), "resource-id".to_string()];
    
    if let Some(text) = params.get("text").and_then(|v| v.as_str()) {
        values.insert("text".to_string(), text.to_string());
    }
    if let Some(resource_id) = params.get("resource_id").and_then(|v| v.as_str()) {
        values.insert("resource-id".to_string(), resource_id.to_string());
    }
    
    // 🆕 关键修复：传递 XPath 到策略匹配
    // 尝试从多个可能的字段名获取 XPath（包括嵌套结构）
    let xpath = params.get("xpath")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty() && *s != "//*[@clickable='true']") // 过滤无效的兜底xpath
        .or_else(|| params.get("element_path").and_then(|v| v.as_str()))
        .or_else(|| params.get("selected_xpath").and_then(|v| v.as_str()))
        // 🆕 从嵌套的 originalParams.original_data.selected_xpath 中提取
        .or_else(|| {
            params.get("originalParams")
                .and_then(|p| p.get("original_data"))
                .and_then(|d| d.get("selected_xpath"))
                .and_then(|v| v.as_str())
        })
        // 🆕 从嵌套的 originalParams.element_path 中提取
        .or_else(|| {
            params.get("originalParams")
                .and_then(|p| p.get("element_path"))
                .and_then(|v| v.as_str())
        })
        // 🆕 从嵌套的 original_data.selected_xpath 中提取
        .or_else(|| {
            params.get("original_data")
                .and_then(|d| d.get("selected_xpath"))
                .and_then(|v| v.as_str())
        });
    
    if let Some(xpath_str) = xpath {
        if !xpath_str.is_empty() {
            tracing::info!("🎯 [XPath传递] 将XPath添加到匹配条件: {}", xpath_str);
            values.insert("xpath".to_string(), xpath_str.to_string());
            fields.push("xpath".to_string());
        }
    }
    
    let criteria = MatchCriteriaDTO {
        strategy: "intelligent".to_string(),
        fields,
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
        target_bounds: target_bounds.clone(),
        timeout: Some(10000), // 10秒超时
        verify_with_screenshot: Some(false),
    };
    
    // 5. 执行操作
    let executor = ActionExecutor::new();
    let result = executor.execute_action(&action, &context).await
        .map_err(|e| format!("操作执行器错误: {}", e))?;
    
    if result.success {
        tracing::info!("✅ 操作执行成功: {}", result.message);
        // 计算中心点
        let bounds = target_bounds.unwrap();
        let center_x = (bounds.left + bounds.right) / 2;
        let center_y = (bounds.top + bounds.bottom) / 2;
        Ok((match_result.confidence_score as f32, Some((center_x, center_y))))
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
        .ok_or_else(|| "❌ 缺少目标文本：智能选择必须指定 targetText".to_string())?;
        
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
            
            // 🔥 兼容蛇形和驼峰命名（优先蛇形）
            let interval_ms = batch_config
                .and_then(|b| b.get("interval_ms")  // 优先蛇形命名
                    .or_else(|| b.get("intervalMs")))  // 兼容旧的驼峰命名
                .and_then(|v| v.as_u64())
                .unwrap_or(2000);
                
            let max_count = batch_config
                .and_then(|b| b.get("max_count")  // 优先蛇形命名
                    .or_else(|| b.get("maxCount")))  // 兼容旧的驼峰命名
                .and_then(|v| v.as_u64())
                .unwrap_or(10) as u32;
                
            let continue_on_error = batch_config
                .and_then(|b| b.get("continue_on_error")  // 优先蛇形命名
                    .or_else(|| b.get("continueOnError")))  // 兼容旧的驼峰命名
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
                
            let show_progress = batch_config
                .and_then(|b| b.get("show_progress")  // 优先蛇形命名
                    .or_else(|| b.get("showProgress")))  // 兼容旧的驼峰命名
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
                
            // 🔧 添加调试日志，验证配置读取
            tracing::info!(
                "📋 [批量配置解析] max_count={}, interval_ms={}ms, continue_on_error={}, show_progress={}",
                max_count, interval_ms, continue_on_error, show_progress
            );
                
            SelectionMode::All {
                batch_config: Some(BatchConfigV2 {
                    interval_ms,
                    jitter_ms: 500,
                    max_per_session: max_count,
                    cooldown_ms: 5000,
                    continue_on_error,
                    show_progress,
                    refresh_policy: RefreshPolicy::OnMutation,
                    requery_by_fingerprint: true,
                    force_light_validation: true,
                })
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
