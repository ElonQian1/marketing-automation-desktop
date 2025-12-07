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
            
            // 🎯 关键修复：根据执行模式选择正确的执行策略
            let mode = params.get("mode").and_then(|v| v.as_str()).unwrap_or("traditional");
            
            // 提取 bounds（所有模式都需要作为回退）
            let bounds_str = params.get("bounds").and_then(|v| v.as_str())
                .or_else(|| params.get("original_data")
                    .and_then(|d| d.get("element_bounds"))
                    .and_then(|v| v.as_str()));
            
            match mode {
                // 🎯 文本匹配模式：直接使用 content-desc 或 text 查找，不需要找卡片根
                "text_matching" => {
                    tracing::info!("🔤 检测到文本匹配模式，使用 content-desc/text 查找");
                    
                    // 提取 content_desc
                    let content_desc = params.get("contentDesc").and_then(|v| v.as_str())
                        .or_else(|| params.get("original_data")
                            .and_then(|d| d.get("key_attributes"))
                            .and_then(|k| k.get("content-desc"))
                            .and_then(|v| v.as_str()));
                    
                    if let Some(desc) = content_desc {
                        if !desc.is_empty() {
                            tracing::info!("🎯 [文本匹配执行] 使用 content-desc=\"{}\"", desc);
                            // 直接使用 XPath 查找，比结构匹配更快更可靠
                            match execute_smart_tap_by_xpath(
                                app,
                                &envelope.device_id,
                                &format!("//*[@content-desc='{}']", desc),
                            ).await {
                                Ok((confidence, coords)) => {
                                    tracing::info!("✅ [文本匹配执行] 成功，置信度: {:.2}, 坐标: {:?}", confidence, coords);
                                    (confidence, coords)
                                }
                                Err(e) => {
                                    tracing::warn!("⚠️ [文本匹配执行] 失败: {}，回退到 bounds 直接点击", e);
                                    if let Some(bounds_str) = bounds_str {
                                        execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                                    } else {
                                        return Err(format!("文本匹配执行失败且无 bounds 可回退: {}", e));
                                    }
                                }
                            }
                        } else if let Some(bounds_str) = bounds_str {
                            tracing::warn!("⚠️ [文本匹配执行] content-desc 为空，回退到 bounds");
                            execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                        } else {
                            return Err("文本匹配执行失败：content-desc 和 bounds 都为空".to_string());
                        }
                    } else if let Some(bounds_str) = bounds_str {
                        tracing::warn!("⚠️ [文本匹配执行] 缺少 content-desc，回退到 bounds");
                        execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                    } else {
                        return Err("文本匹配执行失败：无法提取 content-desc 且无 bounds".to_string());
                    }
                }
                
                // 🎯 ID匹配模式：使用 resource-id 查找
                "id_matching" => {
                    tracing::info!("🆔 检测到ID匹配模式，使用 resource-id 查找");
                    
                    let resource_id = params.get("resourceId").and_then(|v| v.as_str())
                        .or_else(|| params.get("original_data")
                            .and_then(|d| d.get("key_attributes"))
                            .and_then(|k| k.get("resource-id"))
                            .and_then(|v| v.as_str()));
                    
                    if let Some(rid) = resource_id {
                        if !rid.is_empty() {
                            tracing::info!("🎯 [ID匹配执行] 使用 resource-id=\"{}\"", rid);
                            match execute_smart_tap_by_xpath(
                                app,
                                &envelope.device_id,
                                &format!("//*[@resource-id='{}']", rid),
                            ).await {
                                Ok((confidence, coords)) => {
                                    tracing::info!("✅ [ID匹配执行] 成功，置信度: {:.2}, 坐标: {:?}", confidence, coords);
                                    (confidence, coords)
                                }
                                Err(e) => {
                                    tracing::warn!("⚠️ [ID匹配执行] 失败: {}，回退到 bounds", e);
                                    if let Some(bounds_str) = bounds_str {
                                        execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                                    } else {
                                        return Err(format!("ID匹配执行失败且无 bounds 可回退: {}", e));
                                    }
                                }
                            }
                        } else if let Some(bounds_str) = bounds_str {
                            execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                        } else {
                            return Err("ID匹配执行失败：resource-id 和 bounds 都为空".to_string());
                        }
                    } else if let Some(bounds_str) = bounds_str {
                        execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                    } else {
                        return Err("ID匹配执行失败：无法提取 resource-id".to_string());
                    }
                }
                
                // 🎯 XPath匹配模式：直接使用 XPath 查找
                "xpath_matching" => {
                    tracing::info!("📍 检测到XPath匹配模式");
                    
                    let xpath = params.get("xpath").and_then(|v| v.as_str())
                        .or_else(|| params.get("original_data")
                            .and_then(|d| d.get("selected_xpath"))
                            .and_then(|v| v.as_str()));
                    
                    if let Some(xp) = xpath {
                        tracing::info!("🎯 [XPath匹配执行] 使用 xpath=\"{}\"", xp);
                        match execute_smart_tap_by_xpath(
                            app,
                            &envelope.device_id,
                            xp,
                        ).await {
                            Ok((confidence, coords)) => {
                                tracing::info!("✅ [XPath匹配执行] 成功，置信度: {:.2}, 坐标: {:?}", confidence, coords);
                                (confidence, coords)
                            }
                            Err(e) => {
                                tracing::warn!("⚠️ [XPath匹配执行] 失败: {}，回退到 bounds", e);
                                if let Some(bounds_str) = bounds_str {
                                    execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                                } else {
                                    return Err(format!("XPath匹配执行失败且无 bounds 可回退: {}", e));
                                }
                            }
                        }
                    } else if let Some(bounds_str) = bounds_str {
                        execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                    } else {
                        return Err("XPath匹配执行失败：无法提取 xpath".to_string());
                    }
                }
                
                // 🎯 结构匹配模式：需要找卡片根
                "structure_matching" => {
                    tracing::info!("🔍 检测到结构匹配模式，使用真机结构匹配执行");
                    
                    // 提取 index_path
                    let index_path = params.get("original_data")
                        .and_then(|d| d.get("index_path"))
                        .and_then(|v| v.as_array())
                        .map(|arr| arr.iter()
                            .filter_map(|v| v.as_u64().map(|n| n as usize))
                            .collect::<Vec<_>>());
                    
                    if let Some(index_path) = index_path {
                        tracing::info!("📍 [结构匹配执行] 使用 index_path: {:?}", index_path);
                        
                        // 🎯 调用真机结构匹配执行器
                        match execute_structure_match_for_smart_tap(
                            app,
                            &envelope.device_id,
                            &index_path,
                            bounds_str.map(|s| s.to_string()),
                        ).await {
                            Ok((confidence, coords)) => {
                                tracing::info!("✅ [结构匹配执行] 成功，置信度: {:.2}, 坐标: {:?}", confidence, coords);
                                (confidence, coords)
                            }
                            Err(e) => {
                                tracing::warn!("⚠️ [结构匹配执行] 失败: {}，回退到 bounds 直接点击", e);
                                if let Some(bounds_str) = bounds_str {
                                    execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                                } else {
                                    return Err(format!("结构匹配执行失败且无 bounds 可回退: {}", e));
                                }
                            }
                        }
                    } else {
                        tracing::warn!("⚠️ [结构匹配执行] 缺少 index_path，回退到 bounds 直接点击");
                        if let Some(bounds_str) = bounds_str {
                            execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                        } else {
                            match execute_action_unified(envelope, &params).await {
                                Ok((conf, coords)) => (conf, coords),
                                Err(e) => return Err(e)
                            }
                        }
                    }
                }
                
                // 🎯 直接点击模式（leaf_context/traditional）：直接点击目标节点
                "direct_click" | "traditional" => {
                    tracing::info!("📍 使用直接点击模式: mode={}", mode);
                    
                    // 🔍 检查是否有 smartSelection 配置
                    let smart_selection_mode = params.get("smartSelection")
                        .and_then(|ss| ss.get("mode"))
                        .and_then(|m| m.as_str());
                    
                    // 🎯 根据 smartSelection.mode 决定执行策略
                    match smart_selection_mode {
                        // 🔍 "first" 或 "nth:N" 模式：使用叶子上下文结构匹配
                        Some(mode) if mode == "first" || mode.starts_with("nth:") => {
                            let target_index = if mode == "first" {
                                0
                            } else {
                                mode.strip_prefix("nth:").and_then(|s| s.parse::<usize>().ok()).unwrap_or(0)
                            };
                            
                            tracing::info!(
                                "🔍 [叶子上下文-{}] 使用结构匹配搜索第{}个同类元素",
                                mode,
                                target_index + 1
                            );
                            
                            // 提取静态 XML 中的 index_path（用于提取结构特征）
                            let static_index_path = params.get("original_data")
                                .and_then(|d| d.get("index_path"))
                                .and_then(|v| v.as_array())
                                .map(|arr| arr.iter()
                                    .filter_map(|v| v.as_u64().map(|n| n as usize))
                                    .collect::<Vec<_>>());
                            
                            if let Some(static_path) = static_index_path {
                                // 🎯 使用结构匹配查找第N个同类元素
                                match execute_leaf_context_match_nth(
                                    &envelope.device_id,
                                    &static_path,
                                    &params,
                                    target_index,
                                ).await {
                                    Ok((confidence, coords)) => {
                                        tracing::info!(
                                            "✅ [叶子上下文-{}] 找到并点击第{}个结构匹配元素",
                                            mode,
                                            target_index + 1
                                        );
                                        (confidence, coords)
                                    }
                                    Err(e) => {
                                        tracing::warn!("⚠️ [叶子上下文-{}] 结构匹配失败: {}, 回退bounds", mode, e);
                                        if let Some(bounds_str) = bounds_str {
                                            execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                                        } else {
                                            return Err(format!("叶子上下文匹配失败且无 bounds: {}", e));
                                        }
                                    }
                                }
                            } else {
                                tracing::warn!("⚠️ [叶子上下文-{}] 缺少 index_path，回退精准定位", mode);
                                execute_by_index_path_or_bounds(
                                    app,
                                    envelope,
                                    &params,
                                    bounds_str,
                                ).await?
                            }
                        }
                        
                        // 🎯 其他模式或无 smartSelection：使用 index_path 精准定位
                        _ => {
                            if smart_selection_mode.is_some() {
                                tracing::info!("🎯 [智能选择-其他] 模式: {:?}, 使用 index_path 精准定位", smart_selection_mode);
                            }
                            
                            execute_by_index_path_or_bounds(
                                app,
                                envelope,
                                &params,
                                bounds_str,
                            ).await?
                        }
                    }
                }
                
                // 🎯 其他未知模式：兜底处理
                _ => {
                    tracing::warn!("⚠️ 未知模式: mode={}, 使用bounds兜底", mode);
                    if let Some(bounds_str) = bounds_str {
                        execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await?
                    } else {
                        tracing::warn!("⚠️ SmartTap 缺少 bounds 参数, 尝试通用执行");
                        match execute_action_unified(envelope, &params).await {
                            Ok((conf, coords)) => (conf, coords),
                            Err(e) => return Err(e)
                        }
                    }
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
        mode_str if mode_str.starts_with("nth:") => {
            // 🆕 支持 nth:N 格式（用于循环递增）
            let index_str = mode_str.strip_prefix("nth:").unwrap_or("0");
            let index = index_str.parse::<usize>().unwrap_or(0);
            tracing::info!("🔄 [循环递增模式] 使用 nth:{} 选择第{}个元素", index, index + 1);
            SelectionMode::Nth { index }
        }
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

/// 🎯 辅助函数：通过 index_path 或 bounds 执行点击
/// 
/// 优先使用 index_path 精准定位，失败则回退 bounds
async fn execute_by_index_path_or_bounds(
    _app: &AppHandle,
    envelope: &ContextEnvelope,
    params: &Value,
    bounds_str: Option<&str>,
) -> Result<(f32, Option<(i32, i32)>), String> {
    // 提取 index_path
    let index_path = params.get("original_data")
        .and_then(|d| d.get("index_path"))
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter()
            .filter_map(|v| v.as_u64().map(|n| n as usize))
            .collect::<Vec<_>>());
    
    if let Some(index_path) = index_path {
        tracing::info!("🎯 [精准定位] 使用 index_path: {:?}", index_path);
        match execute_direct_click_by_index_path(
            &envelope.device_id,
            &index_path,
        ).await {
            Ok((confidence, coords)) => {
                tracing::info!("✅ [精准定位] index_path定位成功");
                return Ok((confidence, coords));
            }
            Err(e) => {
                tracing::warn!("⚠️ [精准定位] index_path失败: {}, 回退bounds", e);
                if let Some(bounds_str) = bounds_str {
                    return execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await;
                } else {
                    return Err(format!("精准定位失败且无 bounds: {}", e));
                }
            }
        }
    } else if let Some(bounds_str) = bounds_str {
        execute_smart_tap_by_bounds(&envelope.device_id, bounds_str).await
    } else {
        tracing::warn!("⚠️ 缺少 index_path 和 bounds，尝试通用执行");
        match execute_action_unified(envelope, &params).await {
            Ok((conf, coords)) => Ok((conf, coords)),
            Err(e) => Err(e)
        }
    }
}

/// 🔍 叶子上下文结构匹配 - 查找第一个同类元素
/// 
/// 使用静态 XML 中的元素结构特征（祖先、兄弟节点、几何位置），
/// 在真机 XML 中搜索结构相似的元素，然后选择第一个匹配的元素并点击
async fn execute_leaf_context_match_first(
    device_id: &str,
    _static_index_path: &[usize],
    params: &Value,
) -> Result<(f32, Option<(i32, i32)>), String> {
    use crate::services::adb::commands::{adb_dump_ui_xml, adb_tap_coordinate};
    use crate::engine::XmlIndexer;
    
    tracing::info!("🔍 [叶子上下文匹配] 开始结构匹配搜索");
    
    // 1. 获取结构指纹（由智能分析阶段预先提取）
    let fingerprint = params.get("structure_fingerprint")
        .ok_or_else(|| "缺少结构指纹数据".to_string())?;
    
    let target_content_desc = fingerprint.get("content_desc")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let target_text = fingerprint.get("text")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let target_class = fingerprint.get("class_name")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    // 📋 提取静态元素的结构特征
    let static_parent_classes = fingerprint.get("parent_classes")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect::<Vec<_>>())
        .unwrap_or_default();
    
    let static_sibling_count = fingerprint.get("sibling_count")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;
    
    let static_depth = fingerprint.get("depth_level")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;
    
    tracing::info!("📋 [叶子上下文匹配] 目标特征: content-desc='{}', text='{}', class='{}', parents={:?}, siblings={}, depth={}", 
        target_content_desc, target_text, target_class, static_parent_classes, static_sibling_count, static_depth);
    
    // 2. 实时 dump 真机 XML
    let runtime_xml = adb_dump_ui_xml(device_id.to_string()).await
        .map_err(|e| format!("获取真机UI XML失败: {}", e))?;
    
    let runtime_indexer = XmlIndexer::build_from_xml(&runtime_xml)
        .map_err(|e| format!("构建真机XML索引失败: {}", e))?;
    
    tracing::info!("✅ [叶子上下文匹配] 真机XML节点数: {}", runtime_indexer.all_nodes.len());
    
    // 🔍 诊断：输出真机可点击元素
    tracing::info!("🔍 [诊断] 真机可点击元素列表 (前20个):");
    for (idx, node) in runtime_indexer.all_nodes.iter().enumerate().take(20) {
        if node.element.clickable {
            tracing::info!("  #{}: content='{}', text='{}', class='{}', bounds={:?}", 
                idx, node.element.content_desc, node.element.text, 
                node.element.class_name.as_deref().unwrap_or(""), node.bounds);
        }
    }
    
    // 3. 在真机 XML 中搜索所有匹配的候选节点
    let mut candidates = Vec::new();
    
    for (node_idx, node) in runtime_indexer.all_nodes.iter().enumerate() {
        let node_content_desc = node.element.content_desc.as_str();
        let node_text = node.element.text.as_str();
        let node_class = node.element.class_name.as_deref().unwrap_or("");
        
        // 🎯 第一步：基本属性过滤 - 放宽匹配条件
        // 瀑布流卡片：透明层可能没有 content-desc/text，依赖结构匹配
        // 独立按钮：需要 content-desc/text 匹配
        let has_target_text = !target_content_desc.is_empty() || !target_text.is_empty();
        
        let content_match = !target_content_desc.is_empty() && node_content_desc == target_content_desc;
        let text_match = !target_text.is_empty() && node_text == target_text;
        
        // 🆕 语义匹配：支持"已关注"→"关注"互通
        let semantic_match = if !target_content_desc.is_empty() {
            let target_normalized = target_content_desc.replace("已", "").replace("取消", "");
            let node_normalized = node_content_desc.replace("已", "").replace("取消", "");
            !target_normalized.is_empty() && target_normalized == node_normalized
        } else if !target_text.is_empty() {
            let target_normalized = target_text.replace("已", "").replace("取消", "");
            let node_normalized = node_text.replace("已", "").replace("取消", "");
            !target_normalized.is_empty() && target_normalized == node_normalized
        } else {
            false
        };
        
        let class_match = target_class.is_empty() || node_class == target_class;
        
        // 🔍 如果目标有文本/描述，必须匹配（精确或语义）；如果没有，则只匹配结构
        let text_filter_passed = if has_target_text {
            content_match || text_match || semantic_match  // ✅ 语义匹配
        } else {
            class_match && node.element.clickable  // 透明层：可点击 + 类名匹配
        };
        
        if !text_filter_passed || !class_match {
            continue; // 基本过滤不通过，跳过
        }
        
        tracing::debug!("🎯 [候选预筛] node_idx={}, content='{}', text='{}', semantic={}", 
            node_idx, node_content_desc, node_text, semantic_match);
        
        // 🎯 第二步：结构相似度评分（层级上下文匹配）
        let mut score = 0.0f32;
        
        // (1) 文本/描述匹配 (40%)
        if content_match { 
            score += 0.30;  // 精确匹配
        } else if text_match {
            score += 0.30;  // 精确文本匹配
        } else if semantic_match {
            score += 0.25;  // 语义匹配（"已关注"→"关注"）
        }
        
        // (2) 祖先链匹配 (20%) - 检查父节点类名是否相似
        if !static_parent_classes.is_empty() {
            let runtime_parent_classes = extract_parent_classes(&runtime_indexer, node_idx, static_parent_classes.len());
            let parent_similarity = calculate_parent_similarity(&static_parent_classes, &runtime_parent_classes);
            score += parent_similarity * 0.20;
        }
        
        // (3) 兄弟节点数量相似度 (15%)
        let runtime_sibling_count = if static_sibling_count > 0 {
            let count = count_siblings(&runtime_indexer, node_idx);
            let sibling_similarity = calculate_count_similarity(static_sibling_count, count);
            score += sibling_similarity * 0.15;
            count
        } else {
            0
        };
        
        // (4) 树深度相似度 (10%)
        let runtime_depth = if static_depth > 0 {
            let depth = calculate_depth(&runtime_indexer, node_idx);
            let depth_similarity = calculate_count_similarity(static_depth, depth);
            score += depth_similarity * 0.10;
            depth
        } else {
            0
        };
        
        // (5) Class 名称匹配 (15%)
        if class_match && !target_class.is_empty() { 
            score += 0.15; 
        }
        
        candidates.push((node_idx, score, node.clone()));
        
        tracing::debug!("🔍 候选节点 #{}: score={:.3}, content='{}', class='{}', siblings={}, depth={}", 
            node_idx, score, node_content_desc, node_class, runtime_sibling_count, runtime_depth);
    }
    
    if candidates.is_empty() {
        return Err(format!("真机上未找到匹配的元素: content-desc='{}', text='{}'", 
            target_content_desc, target_text));
    }
    
    // 4. 按结构相似度评分排序（降序）
    candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    
    tracing::info!("📊 [叶子上下文匹配] 找到 {} 个候选，TOP 3:", candidates.len());
    for (i, (idx, score, node)) in candidates.iter().take(3).enumerate() {
        tracing::info!("  {}. node_idx={}, score={:.3}, content='{}', class='{}'", 
            i+1, idx, score, node.element.content_desc, node.element.class_name.as_deref().unwrap_or(""));
    }
    
    // 5. 选择第一个（结构相似度最高的）
    let (first_node_idx, confidence, first_node) = &candidates[0];
    
    // 📋 输出完整的元素信息用于诊断
    tracing::info!("🔍 [叶子上下文-诊断] 选中的第一个元素详情:");
    tracing::info!("  - node_idx: {}", first_node_idx);
    tracing::info!("  - content-desc: '{}'", first_node.element.content_desc);
    tracing::info!("  - text: '{}'", first_node.element.text);
    tracing::info!("  - class: '{}'", first_node.element.class_name.as_deref().unwrap_or(""));
    tracing::info!("  - bounds: {:?}", first_node.bounds);
    tracing::info!("  - clickable: {}", first_node.element.clickable);
    
    // 6. 提取坐标并点击（直接使用 bounds）
    let (left, top, right, bottom) = first_node.bounds;
    let coords = ((left + right) / 2, (top + bottom) / 2);
    
    tracing::info!("🎯 [叶子上下文匹配] 点击第一个匹配元素: coords={:?}, confidence={:.3}", coords, confidence);
    
    // 执行点击
    adb_tap_coordinate(device_id.to_string(), coords.0, coords.1).await
        .map_err(|e| format!("点击坐标失败: {}", e))?;
    
    Ok((*confidence, Some(coords)))
}

/// 🔄 叶子上下文结构匹配 - 选择第N个
/// 
/// 与 `execute_leaf_context_match_first` 类似，但选择第N个匹配元素
async fn execute_leaf_context_match_nth(
    device_id: &str,
    static_index_path: &[usize],
    params: &Value,
    target_index: usize,
) -> Result<(f32, Option<(i32, i32)>), String> {
    // 复用 execute_leaf_context_match_first 的逻辑，但选择第N个
    use crate::services::adb::commands::{adb_dump_ui_xml, adb_tap_coordinate};
    use crate::engine::XmlIndexer;
    
    tracing::info!("🔍 [叶子上下文匹配-第{}个] 开始结构匹配搜索", target_index + 1);
    
    // 1. 获取结构指纹
    let fingerprint = params.get("structure_fingerprint")
        .ok_or_else(|| "缺少结构指纹数据".to_string())?;
    
    let target_content_desc = fingerprint.get("content_desc")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let target_text = fingerprint.get("text")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let target_class = fingerprint.get("class_name")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    let static_parent_classes = fingerprint.get("parent_classes")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect::<Vec<_>>())
        .unwrap_or_default();
    
    let static_sibling_count = fingerprint.get("sibling_count")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;
    
    let static_depth = fingerprint.get("depth_level")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;
    
    tracing::info!("📋 [叶子上下文匹配-第{}个] 目标特征: content-desc='{}', text='{}', class='{}', parents={:?}, siblings={}, depth={}", 
        target_index + 1, target_content_desc, target_text, target_class, static_parent_classes, static_sibling_count, static_depth);
    
    // 2. 实时 dump 真机 XML
    let runtime_xml = adb_dump_ui_xml(device_id.to_string()).await
        .map_err(|e| format!("获取真机UI XML失败: {}", e))?;
    
    let runtime_indexer = XmlIndexer::build_from_xml(&runtime_xml)
        .map_err(|e| format!("构建真机XML索引失败: {}", e))?;
    
    tracing::info!("✅ [叶子上下文匹配-第{}个] 真机XML节点数: {}", target_index + 1, runtime_indexer.all_nodes.len());
    
    // 3. 搜索候选节点（代码与 first 版本相同）
    let mut candidates = Vec::new();
    
    for (node_idx, node) in runtime_indexer.all_nodes.iter().enumerate() {
        let node_content_desc = node.element.content_desc.as_str();
        let node_text = node.element.text.as_str();
        let node_class = node.element.class_name.as_deref().unwrap_or("");
        
        let has_target_text = !target_content_desc.is_empty() || !target_text.is_empty();
        
        let content_match = !target_content_desc.is_empty() && node_content_desc == target_content_desc;
        let text_match = !target_text.is_empty() && node_text == target_text;
        
        let semantic_match = if !target_content_desc.is_empty() {
            let target_normalized = target_content_desc.replace("已", "").replace("取消", "");
            let node_normalized = node_content_desc.replace("已", "").replace("取消", "");
            !target_normalized.is_empty() && target_normalized == node_normalized
        } else if !target_text.is_empty() {
            let target_normalized = target_text.replace("已", "").replace("取消", "");
            let node_normalized = node_text.replace("已", "").replace("取消", "");
            !target_normalized.is_empty() && target_normalized == node_normalized
        } else {
            false
        };
        
        let class_match = target_class.is_empty() || node_class == target_class;
        
        let text_filter_passed = if has_target_text {
            content_match || text_match || semantic_match
        } else {
            class_match && node.element.clickable
        };
        
        if !text_filter_passed || !class_match {
            continue;
        }
        
        // 计算结构相似度评分
        let mut score = 0.0f32;
        
        if content_match { 
            score += 0.30;
        } else if text_match {
            score += 0.30;
        } else if semantic_match {
            score += 0.25;
        }
        
        if !static_parent_classes.is_empty() {
            let runtime_parent_classes = extract_parent_classes(&runtime_indexer, node_idx, static_parent_classes.len());
            let parent_similarity = calculate_parent_similarity(&static_parent_classes, &runtime_parent_classes);
            score += parent_similarity * 0.20;
        }
        
        if static_sibling_count > 0 {
            let count = count_siblings(&runtime_indexer, node_idx);
            let sibling_similarity = calculate_count_similarity(static_sibling_count, count);
            score += sibling_similarity * 0.15;
        }
        
        if static_depth > 0 {
            let depth = calculate_depth(&runtime_indexer, node_idx);
            let depth_similarity = calculate_count_similarity(static_depth, depth);
            score += depth_similarity * 0.10;
        }
        
        if class_match && !target_class.is_empty() { 
            score += 0.15; 
        }
        
        candidates.push((node_idx, score, node.clone()));
    }
    
    if candidates.is_empty() {
        return Err(format!("真机上未找到匹配的元素: content-desc='{}', text='{}'", 
            target_content_desc, target_text));
    }
    
    // 4. 按评分排序
    candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    
    tracing::info!("📊 [叶子上下文匹配-第{}个] 找到 {} 个候选，TOP 3:", target_index + 1, candidates.len());
    for (i, (idx, score, node)) in candidates.iter().take(3).enumerate() {
        tracing::info!("  {}. node_idx={}, score={:.3}, content='{}', class='{}'", 
            i+1, idx, score, node.element.content_desc, node.element.class_name.as_deref().unwrap_or(""));
    }
    
    // 5. 选择第N个（检查边界）
    if target_index >= candidates.len() {
        return Err(format!("候选元素不足：需要第{}个，但只找到{}个", target_index + 1, candidates.len()));
    }
    
    let (selected_node_idx, confidence, selected_node) = &candidates[target_index];
    
    tracing::info!("🔍 [叶子上下文-第{}个-诊断] 选中的元素详情:", target_index + 1);
    tracing::info!("  - node_idx: {}", selected_node_idx);
    tracing::info!("  - content-desc: '{}'", selected_node.element.content_desc);
    tracing::info!("  - text: '{}'", selected_node.element.text);
    tracing::info!("  - class: '{}'", selected_node.element.class_name.as_deref().unwrap_or(""));
    tracing::info!("  - bounds: {:?}", selected_node.bounds);
    tracing::info!("  - clickable: {}", selected_node.element.clickable);
    
    // 6. 点击
    let (left, top, right, bottom) = selected_node.bounds;
    let coords = ((left + right) / 2, (top + bottom) / 2);
    
    tracing::info!("🎯 [叶子上下文匹配-第{}个] 点击元素: coords={:?}, confidence={:.3}", target_index + 1, coords, confidence);
    
    adb_tap_coordinate(device_id.to_string(), coords.0, coords.1).await
        .map_err(|e| format!("点击坐标失败: {}", e))?;
    
    Ok((*confidence, Some(coords)))
}

/// 📐 辅助函数：提取父节点类名链
fn extract_parent_classes(indexer: &crate::engine::XmlIndexer, node_idx: usize, depth: usize) -> Vec<String> {
    let mut classes = Vec::new();
    let mut current_idx = node_idx;
    
    for _ in 0..depth {
        if let Some(parent_idx) = indexer.all_nodes.get(current_idx).and_then(|n| n.parent_index) {
            if let Some(parent_class) = indexer.all_nodes[parent_idx].element.class_name.as_ref() {
                classes.push(parent_class.clone());
            }
            current_idx = parent_idx;
        } else {
            break;
        }
    }
    classes
}

/// 📐 辅助函数：计算父节点链相似度
fn calculate_parent_similarity(static_parents: &[String], runtime_parents: &[String]) -> f32 {
    if static_parents.is_empty() || runtime_parents.is_empty() {
        return 0.0;
    }
    
    let min_len = static_parents.len().min(runtime_parents.len());
    let mut match_count = 0;
    
    for i in 0..min_len {
        if static_parents[i] == runtime_parents[i] {
            match_count += 1;
        }
    }
    
    match_count as f32 / static_parents.len() as f32
}

/// 📐 辅助函数：统计兄弟节点数量
fn count_siblings(indexer: &crate::engine::XmlIndexer, node_idx: usize) -> usize {
    if let Some(parent_idx) = indexer.all_nodes.get(node_idx).and_then(|n| n.parent_index) {
        // 统计同一父节点下的所有子节点
        indexer.all_nodes.iter()
            .filter(|n| n.parent_index == Some(parent_idx))
            .count()
    } else {
        0
    }
}

/// 📐 辅助函数：计算节点深度
fn calculate_depth(indexer: &crate::engine::XmlIndexer, node_idx: usize) -> usize {
    let mut depth = 0;
    let mut current_idx = node_idx;
    
    while let Some(parent_idx) = indexer.all_nodes.get(current_idx).and_then(|n| n.parent_index) {
        depth += 1;
        current_idx = parent_idx;
    }
    depth
}

/// 📐 辅助函数：计算数量相似度
fn calculate_count_similarity(static_count: usize, runtime_count: usize) -> f32 {
    if static_count == 0 && runtime_count == 0 {
        return 1.0;
    }
    if static_count == 0 || runtime_count == 0 {
        return 0.0;
    }
    
    let diff = (static_count as f32 - runtime_count as f32).abs();
    let max_count = static_count.max(runtime_count) as f32;
    
    (1.0 - (diff / max_count)).max(0.0)
}

/// 🎯 真机结构匹配执行器
/// 
/// 使用 index_path 在真机上执行结构匹配，找到同类瀑布流卡片并点击
async fn execute_structure_match_for_smart_tap(
    _app: &AppHandle,
    device_id: &str,
    index_path: &[usize],
    _bounds_str: Option<String>,
) -> Result<(f32, Option<(i32, i32)>), String> {
    use crate::services::adb::commands::adb_dump_ui_xml;
    use crate::services::adb::commands::adb_tap_coordinate;
    use crate::engine::XmlIndexer;
    use crate::domain::structure_runtime_match::ClickNormalizer;
    
    tracing::info!("🔍 [结构匹配执行] 开始，device={}, index_path={:?}", device_id, index_path);
    
    // 1. 实时 dump 真机 XML
    let ui_xml = adb_dump_ui_xml(device_id.to_string()).await
        .map_err(|e| format!("获取真机UI XML失败: {}", e))?;
    
    tracing::info!("✅ [结构匹配执行] 获取真机XML成功，长度: {}", ui_xml.len());
    
    // 2. 构建 XML 索引器
    let xml_indexer = XmlIndexer::build_from_xml(&ui_xml)
        .map_err(|e| format!("构建XML索引失败: {}", e))?;
    
    // 3. 使用 index_path 查找目标节点
    let clicked_node_idx = xml_indexer.find_node_by_index_path(index_path)
        .ok_or_else(|| format!("通过 index_path 未找到目标元素: {:?}", index_path))?;
    
    tracing::info!("✅ [结构匹配执行] 找到目标节点: index={}", clicked_node_idx);
    
    // 4. 推导四节点上下文
    let normalizer = ClickNormalizer::new(&xml_indexer);
    let clicked_node = &xml_indexer.all_nodes[clicked_node_idx];
    let normalized = normalizer.normalize_click(clicked_node.bounds)
        .map_err(|e| format!("四节点推导失败: {}", e))?;
    
    tracing::info!("✅ [结构匹配执行] 四节点推导完成: clickable_parent={}", 
        normalized.clickable_parent.node_index);
    
    // 5. 获取可点击父节点的 bounds 并计算中心点
    let clickable_node = &xml_indexer.all_nodes[normalized.clickable_parent.node_index];
    let (left, top, right, bottom) = clickable_node.bounds;
    let center_x = (left + right) / 2;
    let center_y = (top + bottom) / 2;
    
    tracing::info!("📍 [结构匹配执行] 目标点击坐标: ({}, {}), bounds={:?}", 
        center_x, center_y, clickable_node.bounds);
    
    // 6. 执行点击
    adb_tap_coordinate(device_id.to_string(), center_x, center_y).await
        .map_err(|e| format!("点击执行失败: {}", e))?;
    
    tracing::info!("✅ [结构匹配执行] 点击成功");
    
    Ok((0.95, Some((center_x, center_y))))
}

/// 🎯 通过 index_path 直接点击目标节点（用于 leaf_context, direct_click 模式）
/// 
/// 不进行卡片根回溯，直接点击 index_path 指向的节点本身
async fn execute_direct_click_by_index_path(
    device_id: &str,
    index_path: &[usize],
) -> Result<(f32, Option<(i32, i32)>), String> {
    use crate::services::adb::commands::ui_automation::{adb_dump_ui_xml, adb_tap_coordinate};
    use crate::engine::XmlIndexer;
    
    tracing::info!("🎯 [直接点击] 通过 index_path 定位节点: {:?}", index_path);
    
    // 1. 获取真机 XML
    let ui_xml = adb_dump_ui_xml(device_id.to_string()).await
        .map_err(|e| format!("获取设备UI失败: {}", e))?;
    
    tracing::info!("✅ [直接点击] 获取真机XML成功，长度: {}", ui_xml.len());
    
    // 2. 构建索引
    let indexer = XmlIndexer::build_from_xml(&ui_xml)
        .map_err(|e| format!("构建XML索引失败: {}", e))?;
    
    // 3. 通过 index_path 找到目标节点
    let target_node_index = indexer.find_node_by_index_path(index_path)
        .ok_or_else(|| format!("通过 index_path 未找到目标节点"))?;
    
    let target_node = &indexer.all_nodes[target_node_index];
    
    tracing::info!("✅ [直接点击] 找到目标节点: index={}, class={:?}, desc={:?}", 
        target_node_index, 
        target_node.element.class_name,
        target_node.element.content_desc);
    
    // 4. 直接点击这个节点的中心点（不回溯）
    let (left, top, right, bottom) = target_node.bounds;
    let center_x = (left + right) / 2;
    let center_y = (top + bottom) / 2;
    
    tracing::info!("📍 [直接点击] 目标坐标: ({}, {}), bounds=[{},{},{},{}]", 
        center_x, center_y, left, top, right, bottom);
    
    // 5. 执行点击
    adb_tap_coordinate(device_id.to_string(), center_x, center_y).await
        .map_err(|e| format!("点击执行失败: {}", e))?;
    
    tracing::info!("✅ [直接点击] 点击成功");
    
    Ok((0.95, Some((center_x, center_y))))
}

/// 🎯 通过 XPath 查找并点击元素（用于 text_matching, id_matching, xpath_matching 模式）
/// 
/// 集成了执行网关验证，确保：
/// 1. 策略在真机上确实能匹配到目标
/// 2. 不会因多匹配导致误操作
/// 3. 混淆ID会被降权处理
async fn execute_smart_tap_by_xpath(
    _app: &tauri::AppHandle,
    device_id: &str,
    xpath: &str,
) -> Result<(f32, Option<(i32, i32)>), String> {
    use crate::services::adb::commands::ui_automation::{adb_dump_ui_xml, adb_tap_coordinate};
    use crate::engine::XmlIndexer;
    use crate::automation::pipeline::execution_gate::{ExecutionGate, GateConfig, GateRecommendation};
    
    tracing::info!("🔍 [XPath查找] 开始执行: xpath=\"{}\"", xpath);
    
    // 1. 获取真机 XML
    let ui_xml = adb_dump_ui_xml(device_id.to_string()).await
        .map_err(|e| format!("获取设备UI失败: {}", e))?;
    
    tracing::info!("✅ [XPath查找] 获取真机XML成功，长度: {}", ui_xml.len());
    
    // 🔒 2. 执行网关验证（长期主义：先验证再执行）
    let gate = ExecutionGate::new(GateConfig {
        min_confidence: 0.5,
        max_allowed_matches: 3,
        strict_mode: false,
        check_id_stability: true,
    });
    
    let verification = gate.verify_xpath_strategy(xpath, &ui_xml, 0.95)?;
    
    // 根据验证结果决定如何执行
    match verification.recommendation {
        GateRecommendation::Abort => {
            return Err(format!(
                "执行网关拒绝执行: {} (matches={}, confidence={:.2})",
                verification.reason,
                verification.actual_matches,
                verification.adjusted_confidence
            ));
        }
        GateRecommendation::UseBoundsDirectly => {
            // 不在这里处理，让上层决定是否使用 bounds fallback
            return Err(format!(
                "建议使用bounds直接点击: {} (matches={})",
                verification.reason,
                verification.actual_matches
            ));
        }
        GateRecommendation::UseFallback => {
            tracing::warn!(
                "⚠️ [XPath查找] 网关建议使用备选策略: {}",
                verification.reason
            );
            // 继续尝试，但记录警告
        }
        GateRecommendation::Proceed => {
            tracing::info!(
                "✅ [XPath查找] 网关验证通过: confidence={:.2}",
                verification.adjusted_confidence
            );
        }
    }
    
    // 3. 构建索引并查找
    let indexer = XmlIndexer::build_from_xml(&ui_xml)
        .map_err(|e| format!("构建XML索引失败: {}", e))?;
    
    // 4. 尝试用 XPath 查找元素
    let target_node = if xpath.contains("@content-desc=") {
        // 提取 content-desc 值
        let re = regex::Regex::new(r#"@content-desc=['"](.*?)['"]"#).unwrap();
        if let Some(caps) = re.captures(xpath) {
            let desc = &caps[1];
            tracing::info!("🔍 [XPath查找] 提取 content-desc: {}", desc);
            
            // 在索引中查找，通过 element.content_desc
            indexer.all_nodes.iter().enumerate()
                .find(|(_, n)| n.element.content_desc == desc)
                .map(|(i, _)| i)
        } else {
            None
        }
    } else if xpath.contains("@resource-id=") {
        // 提取 resource-id 值
        let re = regex::Regex::new(r#"@resource-id=['"](.*?)['"]"#).unwrap();
        if let Some(caps) = re.captures(xpath) {
            let rid = &caps[1];
            tracing::info!("🔍 [XPath查找] 提取 resource-id: {}", rid);
            
            indexer.all_nodes.iter().enumerate()
                .find(|(_, n)| n.element.resource_id.as_deref() == Some(rid))
                .map(|(i, _)| i)
        } else {
            None
        }
    } else if xpath.contains("@text=") {
        // 提取 text 值
        let re = regex::Regex::new(r#"@text=['"](.*?)['"]"#).unwrap();
        if let Some(caps) = re.captures(xpath) {
            let text = &caps[1];
            tracing::info!("🔍 [XPath查找] 提取 text: {}", text);
            
            indexer.all_nodes.iter().enumerate()
                .find(|(_, n)| n.element.text == text)
                .map(|(i, _)| i)
        } else {
            None
        }
    } else {
        None
    };
    
    if let Some(node_idx) = target_node {
        let node = &indexer.all_nodes[node_idx];
        let (left, top, right, bottom) = node.bounds;
        let center_x = (left + right) / 2;
        let center_y = (top + bottom) / 2;
        
        tracing::info!("✅ [XPath查找] 找到目标节点: index={}, bounds=({},{},{},{}), 中心点=({},{})",
            node_idx, left, top, right, bottom, center_x, center_y);
        
        // 5. 执行点击
        adb_tap_coordinate(device_id.to_string(), center_x, center_y).await
            .map_err(|e| format!("XPath点击执行失败: {}", e))?;
        
        tracing::info!("✅ [XPath查找] 点击成功");
        
        // 使用验证后调整的置信度
        Ok((verification.adjusted_confidence as f32, Some((center_x, center_y))))
    } else {
        Err(format!("XPath未找到匹配元素: {}", xpath))
    }
}

/// 🎯 通过 bounds 直接点击
async fn execute_smart_tap_by_bounds(
    device_id: &str,
    bounds_str: &str,
) -> Result<(f32, Option<(i32, i32)>), String> {
    use crate::services::action_executor::ActionExecutor;
    use crate::types::action_types::{ActionType, ActionContext, ElementBounds};
    
    // 解析 bounds: "[left,top][right,bottom]"
    let re = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").unwrap();
    if let Some(caps) = re.captures(bounds_str) {
        let left: i32 = caps[1].parse().unwrap_or(0);
        let top: i32 = caps[2].parse().unwrap_or(0);
        let right: i32 = caps[3].parse().unwrap_or(0);
        let bottom: i32 = caps[4].parse().unwrap_or(0);
        
        let bounds = ElementBounds::new(left, top, right, bottom);
        let center_x = (left + right) / 2;
        let center_y = (top + bottom) / 2;
        
        tracing::info!("📍 [Bounds点击] 解析到目标区域: {:?}, 中心点: ({}, {})", bounds, center_x, center_y);
        
        let context = ActionContext {
            device_id: device_id.to_string(),
            target_bounds: Some(bounds),
            timeout: Some(5000),
            verify_with_screenshot: Some(false),
        };
        
        let executor = ActionExecutor::new();
        let action_type = ActionType::Click;
        
        match executor.execute_action(&action_type, &context).await {
            Ok(result) => {
                if result.success {
                    tracing::info!("✅ [Bounds点击] 执行成功");
                    Ok((0.9, Some((center_x, center_y))))
                } else {
                    Err(format!("Bounds点击失败: {}", result.message))
                }
            }
            Err(e) => Err(format!("Bounds点击执行器错误: {}", e))
        }
    } else {
        Err(format!("Bounds格式无效: {}", bounds_str))
    }
}
