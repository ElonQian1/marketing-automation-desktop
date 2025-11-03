// src-tauri/src/exec/v3/helpers/step_executor.rs
// module: exec | layer: v3/helpers | role: 步骤执行器
// summary: 执行智能分析生成的步骤，包含元素匹配、失败恢复和真实设备操作

use crate::services::ui_reader_service::UIElement;
use super::super::types::{InlineStep, ValidationSettings};
use super::super::element_matching::{  // 🔥 修正路径：从v3/element_matching导入
    MultiCandidateEvaluator,  // ✅ 启用多候选评估器
    EvaluationCriteria,  // ✅ 启用评估标准
};
use super::element_matching::{  // 从helpers/element_matching导入工具函数
    extract_resource_id_from_xpath,
    extract_child_text_filter_from_xpath,
    element_has_child_with_text,
    find_all_elements_by_text_or_desc as helper_find_all_elements,
    parse_bounds_center as helper_parse_bounds,
};
use super::batch_executor::{  // 🆕 导入批量执行模块
    BatchExecutor,
    BatchExecutionConfig,
    should_use_batch_mode,
    validate_batch_prerequisites,
};
// ⚠️ 暂时禁用 recovery_manager（编译错误待修复）
// use super::super::recovery_manager::{RecoveryContext, attempt_recovery};

/// 🔧 执行真实设备操作（包装函数）
/// 
/// 此函数是 execute_intelligent_analysis_step 的包装，用于保持向后兼容
pub async fn execute_step_real_operation(
    device_id: &str,
    step: &InlineStep,
    ui_xml: &str,
    _validation: &ValidationSettings,
) -> Result<(i32, i32), String> {
    execute_intelligent_analysis_step(device_id, step, ui_xml).await
}

/// 🧠 执行智能分析生成的步骤
/// 
/// 智能分析生成的步骤包含完整的执行策略，无需重新运行 legacy 匹配引擎
pub async fn execute_intelligent_analysis_step(
    device_id: &str,
    inline: &InlineStep,
    ui_xml: &str,
) -> Result<(i32, i32), String> {
    
    tracing::info!("🧠 [智能执行] 开始执行智能分析步骤: {}", inline.step_id);
    
    // 🔥 关键修复：从 STEP_STRATEGY_STORE 读取保存的配置（支持多key回退查找）
    let saved_config = {
        use crate::commands::intelligent_analysis::STEP_STRATEGY_STORE;
        
        if let Ok(store) = STEP_STRATEGY_STORE.lock() {
            // 🎯 策略1: 尝试用当前 step_id (intelligent_step_X) 查找
            let mut found_config = store.get(&inline.step_id)
                .map(|(strategy, _timestamp)| {
                    tracing::info!("📖 [配置读取] 用 step_id={} 找到配置", inline.step_id);
                    (strategy.selection_mode.clone(), strategy.batch_config.clone())
                });
            
            // 🎯 策略2: 如果没找到，尝试从 originalParams 中提取原始 stepId 再查找
            if found_config.is_none() {
                if let Some(orig_params) = inline.params.get("originalParams") {
                    // 尝试从不同位置提取原始 step_id
                    let possible_keys = vec![
                        orig_params.get("stepId").and_then(|v| v.as_str()),
                        orig_params.get("step_id").and_then(|v| v.as_str()),
                        // 从父级 original_data 提取
                        inline.params.get("original_data")
                            .and_then(|od| od.get("step_id"))
                            .and_then(|v| v.as_str()),
                    ];
                    
                    for possible_key in possible_keys.into_iter().flatten() {
                        if let Some((strategy, _timestamp)) = store.get(possible_key) {
                            tracing::info!("✅ [配置读取-回退] 用原始 step_id={} 找到配置", possible_key);
                            tracing::info!("   selection_mode={:?}, batch_config={:?}", 
                                strategy.selection_mode, strategy.batch_config);
                            found_config = Some((strategy.selection_mode.clone(), strategy.batch_config.clone()));
                            break;
                        }
                    }
                }
            }
            
            if found_config.is_none() {
                tracing::warn!("⚠️ [配置读取] Store 中没有找到配置，尝试了以下keys:");
                tracing::warn!("   1. 当前step_id: {}", inline.step_id);
                if let Some(orig_params) = inline.params.get("originalParams") {
                    if let Some(orig_id) = orig_params.get("stepId").or_else(|| orig_params.get("step_id")) {
                        tracing::warn!("   2. 原始step_id: {:?}", orig_id);
                    }
                }
                tracing::warn!("   将使用参数中的默认配置");
            }
            
            found_config
        } else {
            tracing::error!("❌ [配置读取] 无法锁定 STEP_STRATEGY_STORE");
            None
        }
    };
    
    // 🔥 合并保存的配置到执行参数
    let mut merged_params = inline.params.clone();
    if let Some((selection_mode, batch_config)) = saved_config {
        if let Some(mode) = selection_mode {
            tracing::info!("🔧 [配置合并] 使用保存的 selection_mode: {}", mode);
            
            // 更新 smartSelection.mode
            if let Some(smart_sel) = merged_params.get_mut("smartSelection") {
                if let Some(obj) = smart_sel.as_object_mut() {
                    obj.insert("mode".to_string(), serde_json::json!(mode));
                    
                    // 如果是批量模式，同时更新 batchConfig
                    if mode == "all" {
                        if let Some(config) = batch_config {
                            tracing::info!("🔧 [配置合并] 使用保存的 batchConfig: {:?}", config);
                            obj.insert("batchConfig".to_string(), config);
                        }
                    }
                }
            } else {
                // 如果没有 smartSelection，创建一个
                merged_params.as_object_mut().map(|obj| {
                    let mut smart_sel = serde_json::Map::new();
                    smart_sel.insert("mode".to_string(), serde_json::json!(mode));
                    
                    if mode == "all" {
                        if let Some(config) = batch_config {
                            smart_sel.insert("batchConfig".to_string(), config);
                        }
                    }
                    
                    obj.insert("smartSelection".to_string(), serde_json::json!(smart_sel));
                });
            }
        }
    }
    
    // 🔧 修复1：优先使用原始XPath（用户静态分析时选择的精确路径）
    let selected_xpath = merged_params.get("original_data")
        .and_then(|od| od.get("selected_xpath"))
        .and_then(|v| v.as_str());
    
    let xpath = selected_xpath.or_else(|| {
        merged_params.get("xpath").and_then(|v| v.as_str())
    }).ok_or_else(|| format!("智能分析步骤 {} 缺少xpath参数", inline.step_id))?;
    
    // 🔥 P0修复: 正确提取 targetText（支持多层嵌套）
    let target_text = extract_target_text_from_params(&merged_params);
    
    let confidence = merged_params.get("confidence")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.8);
    
    let strategy_type = merged_params.get("strategy_type")
        .and_then(|v| v.as_str())
        .unwrap_or("智能策略");
    
    let xpath_source = if selected_xpath.is_some() {
        "静态分析精确XPath"
    } else {
        "智能分析生成XPath"
    };
    
    tracing::info!("🧠 [智能执行] 策略信息: xpath={} (来源:{}), target='{}', confidence={:.3}, strategy={}",
        xpath, xpath_source, target_text, confidence, strategy_type);
    
    // 解析UI元素
    let elements = crate::services::ui_reader_service::parse_ui_elements(ui_xml)
        .map_err(|e| format!("解析UI XML失败: {}", e))?;
    
    // 🏗️ 优先检测结构匹配：如果存在structural_signatures，优先使用Runtime系统
    let has_structural_sigs = merged_params.get("structural_signatures").is_some()
        || merged_params.get("original_data")
            .and_then(|od| od.get("structural_signatures"))
            .is_some();
    
    if has_structural_sigs {
        tracing::info!("🏗️ [V3执行器] 检测到结构签名，尝试使用Runtime系统");
        
        match super::sm_integration::v3_match_with_structural_matching(
            device_id,
            ui_xml,
            &merged_params,
        ).await {
            Ok(sm_elements) if !sm_elements.is_empty() => {
                tracing::info!("✅ [V3执行器] 结构匹配成功，找到 {} 个候选元素", sm_elements.len());
                
                // 🎯 直接使用SM的结果进行候选评估（转换为引用）
                let sm_element_refs: Vec<&UIElement> = sm_elements.iter().collect();
                let target_element_option = evaluate_best_candidate(
                    sm_element_refs,
                    &merged_params,
                    ui_xml,
                    None,
                )?;  // 先unwrap Result
                
                // 再unwrap Option
                let element = target_element_option
                    .ok_or_else(|| "结构匹配成功但候选评估未返回元素".to_string())?;
                
                // helper_parse_bounds 返回 Result<(i32, i32), String>
                let coords = helper_parse_bounds(&element.bounds.clone().unwrap_or_default())?;
                
                tracing::info!("🎯 [V3执行器] 结构匹配最终选择: ({}, {})", coords.0, coords.1);
                return Ok(coords);
            }
            Ok(_) => {
                tracing::warn!("⚠️ [V3执行器] 结构匹配返回空结果，fallback到传统匹配");
            }
            Err(e) => {
                tracing::warn!("⚠️ [V3执行器] 结构匹配失败: {}，fallback到传统匹配", e);
            }
        }
    } else {
        tracing::debug!("📋 [V3执行器] 未检测到结构签名，使用传统匹配流程");
    }
    
    // � 提取 original_bounds（用于候选预过滤）
    let original_bounds = merged_params.get("original_data")
        .and_then(|od| od.get("element_bounds"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    // 🔧 修复2：收集候选元素（传统流程）
    let candidate_elements = collect_candidate_elements(
        &elements, 
        strategy_type, 
        xpath, 
        &target_text, 
        original_bounds.as_deref(),
        &merged_params  // 🔥 传递完整参数
    );
    
    tracing::info!("🎯 [候选收集] 找到 {} 个匹配的候选元素", candidate_elements.len());
    
    // 🔍 详细输出匹配到的元素信息（调试用）
    if !candidate_elements.is_empty() {
        tracing::info!("📋 [候选详情] 匹配到的元素信息:");
        for (i, elem) in candidate_elements.iter().enumerate() {
            tracing::info!("  [{}] bounds={:?}, text={:?}, resource_id={:?}, clickable={:?}", 
                i + 1, 
                elem.bounds, 
                elem.text, 
                elem.resource_id,
                elem.clickable
            );
        }
    }
    
    // 🔍 数据完整性检查（关键诊断信息）
    if let Some(original_data) = merged_params.get("original_data") {
        tracing::info!("✅ [数据完整性] original_data 存在");
        
        if let Some(original_xml) = original_data.get("original_xml") {
            if let Some(xml_str) = original_xml.as_str() {
                if xml_str.is_empty() {
                    tracing::warn!("⚠️ [数据完整性] original_xml 为空字符串！");
                } else {
                    tracing::info!("✅ [数据完整性] original_xml 长度: {} bytes", xml_str.len());
                }
            } else {
                tracing::warn!("⚠️ [数据完整性] original_xml 不是字符串类型！");
            }
        } else {
            tracing::warn!("⚠️ [数据完整性] original_data 缺少 original_xml 字段！");
        }
        
        if let Some(selected_xpath) = original_data.get("selected_xpath") {
            tracing::info!("✅ [数据完整性] selected_xpath: {:?}", selected_xpath);
        } else {
            tracing::warn!("⚠️ [数据完整性] original_data 缺少 selected_xpath 字段！");
        }
        
        if let Some(children_texts) = original_data.get("children_texts") {
            if let Some(arr) = children_texts.as_array() {
                tracing::info!("✅ [数据完整性] children_texts: {} 个子元素文本", arr.len());
            }
        }
    } else {
        tracing::error!("❌ [数据完整性] original_data 完全缺失！失败恢复能力严重受限！");
    }
    
    // 🔥 P0修复：添加详细的批量模式检测日志
    tracing::info!("🔍 [批量检测-DEBUG] 开始检测批量模式");
    tracing::info!("🔍 [批量检测-DEBUG] merged_params keys: {:?}", 
        merged_params.as_object().map(|obj| obj.keys().collect::<Vec<_>>()));
    
    // 检查顶层 smartSelection
    if let Some(smart_sel) = merged_params.get("smartSelection") {
        tracing::info!("🔍 [批量检测-DEBUG] 找到顶层 smartSelection: {:?}", smart_sel);
        if let Some(mode) = smart_sel.get("mode") {
            tracing::info!("🔍 [批量检测-DEBUG] 顶层 mode: {:?}", mode);
        } else {
            tracing::warn!("⚠️ [批量检测-DEBUG] 顶层 smartSelection 没有 mode 字段！");
        }
    } else {
        tracing::warn!("⚠️ [批量检测-DEBUG] 顶层没有 smartSelection 字段！");
    }
    
    // 检查 originalParams
    if let Some(orig_params) = merged_params.get("originalParams") {
        tracing::info!("🔍 [批量检测-DEBUG] 找到 originalParams");
        if let Some(smart_sel) = orig_params.get("smartSelection") {
            tracing::info!("🔍 [批量检测-DEBUG] originalParams 中的 smartSelection: {:?}", smart_sel);
            if let Some(mode) = smart_sel.get("mode") {
                tracing::info!("🔍 [批量检测-DEBUG] originalParams mode: {:?}", mode);
            }
        } else {
            tracing::warn!("⚠️ [批量检测-DEBUG] originalParams 没有 smartSelection！");
        }
    } else {
        tracing::warn!("⚠️ [批量检测-DEBUG] 没有 originalParams 字段！");
    }
    
    // 🔥 检测批量模式（增强版：支持多路径检测）
    let batch_mode = merged_params
        .get("smartSelection")
        .and_then(|v| v.get("mode"))
        .and_then(|v| v.as_str())
        .or_else(|| {
            // 兜底：从 originalParams 提取
            merged_params
                .get("originalParams")
                .and_then(|v| v.get("smartSelection"))
                .and_then(|v| v.get("mode"))
                .and_then(|v| v.as_str())
        })
        .unwrap_or("first");

    tracing::info!("🔍 [批量检测] mode={}, 候选数={}", batch_mode, candidate_elements.len());

    // 🔥 根据模式决定执行方式
    if batch_mode == "all" {
        tracing::info!("🔄 [批量模式] 检测到批量全部模式");
        tracing::info!("   策略：复用'第一个'的匹配逻辑，循环找到所有符合条件的目标并点击");
        
        // ✅ 批量模式：循环执行"第一个"的完整匹配逻辑
        return execute_batch_mode_with_first_strategy(
            device_id,
            candidate_elements,
            &merged_params,
            &target_text,
            &inline.step_id,
            ui_xml,
            &elements,
            strategy_type,
            xpath,
        )
        .await;
    }
    
    // 🎯 单次模式：找到最佳候选并点击一次
    tracing::info!("🎯 [单次模式] 将从 {} 个候选中选择最佳匹配", candidate_elements.len());

    let mut target_element = evaluate_best_candidate(candidate_elements, &merged_params, ui_xml, None)?;  // match_direction = None（单步模式）
    
    // 🆕 修复：失败恢复机制
    if target_element.is_none() {
        target_element = attempt_element_recovery(&merged_params, &elements)?;
    }
    
    // 最终检查：如果仍然没有找到元素，报告失败
    let target_element = target_element.ok_or_else(|| {
        format!(
            "未找到匹配的元素，strategy={}, target_text={}, xpath={}\n\
            已尝试：1) 真机XML匹配 2) 原始XML重新分析 3) 相似元素搜索\n\
            所有恢复策略均失败",
            strategy_type, target_text, xpath
        )
    })?;
    
    // 🔧 检查元素可点击性
    let clickable_element = ensure_clickable_element(target_element);
    
    // 执行单次点击
    execute_click_action(device_id, clickable_element, &target_text, &inline.step_id).await
}

/// 🔄 批量模式执行（复用"第一个"的匹配策略）
/// 
/// 核心理念：
/// - 一次 UI dump
/// - 循环 N 次，每次都用"第一个"的完整匹配逻辑找到最佳目标
/// - 点击后元素状态变化（如"关注"→"已关注"），自动排除已操作的元素
async fn execute_batch_mode_with_first_strategy<'a>(
    device_id: &str,
    mut candidate_elements: Vec<&'a UIElement>,
    params: &serde_json::Value,
    target_text: &str,
    step_id: &str,
    ui_xml: &str,
    all_elements: &'a [UIElement],
    strategy_type: &str,
    _xpath: &str,
) -> Result<(i32, i32), String> {
    // 解析批量配置
    let config = BatchExecutionConfig::from_params(params, step_id)?;

    tracing::info!(
        "🔄 [批量模式] 开始批量执行（复用'第一个'策略）"
    );
    tracing::info!(
        "📋 [批量配置] maxCount={}, intervalMs={}ms, continueOnError={}",
        config.max_count,
        config.interval_ms,
        config.continue_on_error
    );
    tracing::info!(
        "📊 [初始候选] 从 UI dump 中找到 {} 个初始候选元素",
        candidate_elements.len()
    );

    let mut success_count = 0;
    let mut last_coords = (0, 0);

    // 🔥 循环执行：每次都用"第一个"的逻辑找到当前最佳目标
    for i in 0..config.max_count {
        let index = i + 1;

        if config.show_progress {
            tracing::info!("🔄 [批量执行 {}/{}] 开始寻找目标元素", index, config.max_count);
        }

        // ✅ 复用"第一个"的完整匹配逻辑，使用用户配置的匹配方向
        let mut target_element = evaluate_best_candidate(
            candidate_elements.clone(),
            params,
            ui_xml,
            Some(&config.match_direction)  // 传递用户配置的匹配方向
        )?;
        
        // 如果没找到，尝试失败恢复
        if target_element.is_none() {
            target_element = attempt_element_recovery(params, all_elements)?;
        }
        
        // 如果仍然没找到，根据配置决定是否继续
        let target_element = match target_element {
            Some(elem) => elem,
            None => {
                tracing::warn!(
                    "⚠️ [批量执行 {}/{}] 未找到符合条件的目标元素",
                    index,
                    config.max_count
                );
                
                if config.continue_on_error {
                    tracing::info!("   continueOnError=true，尝试下一个");
                    continue;
                } else {
                    tracing::warn!("   continueOnError=false，提前终止");
                    break;
                }
            }
        };
        
        // 🔧 检查元素可点击性
        let clickable_element = ensure_clickable_element(target_element);
        
        // 生成元素信息（用于日志）
        let element_info = format!(
            "text={:?}, bounds={:?}, resource_id={:?}",
            clickable_element.text,
            clickable_element.bounds,
            clickable_element.resource_id
        );

        if config.show_progress {
            tracing::info!("🎯 [批量执行 {}/{}] 找到目标: {}", index, config.max_count, element_info);
        }

        // 执行点击
        match execute_click_action(device_id, clickable_element, target_text, step_id).await {
            Ok((x, y)) => {
                success_count += 1;
                last_coords = (x, y);
                
                if config.show_progress {
                    tracing::info!(
                        "✅ [批量执行 {}/{}] 点击成功: ({}, {}) | {}",
                        index,
                        config.max_count,
                        x,
                        y,
                        element_info
                    );
                }
                
                // 🔥 关键优化：从候选列表中移除已点击的元素
                // 这样下次循环会自动找到下一个符合条件的目标
                candidate_elements.retain(|e| {
                    // 通过 bounds 判断是否是同一个元素
                    e.bounds != clickable_element.bounds
                });
                
                if config.show_progress {
                    tracing::info!(
                        "📊 [候选更新] 移除已点击元素，剩余 {} 个候选",
                        candidate_elements.len()
                    );
                }
            }
            Err(e) => {
                tracing::warn!(
                    "❌ [批量执行 {}/{}] 点击失败: {} | {}",
                    index,
                    config.max_count,
                    e,
                    element_info
                );

                // 检查是否需要提前终止
                if !config.continue_on_error {
                    tracing::warn!("⚠️ [批量执行] continueOnError=false，提前终止");
                    break;
                }
            }
        }

        // 添加间隔（最后一个不需要）
        if index < config.max_count {
            if config.show_progress {
                tracing::info!("⏱️ [批量执行] 等待 {}ms 后继续", config.interval_ms);
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(config.interval_ms)).await;
        }
        
        // 🔥 提前终止条件：候选列表为空
        if candidate_elements.is_empty() {
            tracing::info!(
                "✅ [批量执行] 所有符合条件的目标已点击完毕（{} 个成功）",
                success_count
            );
            break;
        }
    }

    tracing::info!(
        "✅ [批量模式] 执行完成，成功 {} 个点击",
        success_count
    );

    // 根据结果返回
    if success_count > 0 {
        Ok(last_coords) // 返回最后一次点击的坐标
    } else {
        Err("批量模式执行失败，0 个点击成功".to_string())
    }
}

/// 🔄 批量模式执行（旧版：逐一点击所有候选）
/// 
/// ⚠️ 已废弃：不应该使用此函数，改用 execute_batch_mode_with_first_strategy
#[allow(dead_code)]
async fn execute_batch_mode<'a>(
    device_id: &str,
    candidates: Vec<&'a UIElement>,
    params: &serde_json::Value,
    target_text: &str,
    step_id: &str,
) -> Result<(i32, i32), String> {
    // 验证前置条件
    validate_batch_prerequisites(&candidates, params)?;

    // 解析批量配置
    let config = BatchExecutionConfig::from_params(params, step_id)?;

    tracing::info!(
        "🔄 [批量模式] 开始批量执行，共 {} 个候选（最多执行 {} 个）",
        candidates.len(),
        config.max_count
    );

    tracing::info!(
        "📋 [批量配置] maxCount={}, intervalMs={}ms, continueOnError={}",
        config.max_count,
        config.interval_ms,
        config.continue_on_error
    );

    let mut success_count = 0;
    let total = candidates.len().min(config.max_count);

    // 直接循环执行，不使用复杂的闭包
    for (i, candidate) in candidates.iter().take(config.max_count).enumerate() {
        let index = i + 1;

        if config.show_progress {
            tracing::info!("🔄 [批量执行] 点击第 {}/{} 个候选", index, total);
        }

        // 检查元素可点击性
        let clickable = ensure_clickable_element(candidate);

        // 生成元素信息（用于日志）
        let element_info = format!(
            "text={:?}, bounds={:?}, resource_id={:?}",
            clickable.text, clickable.bounds, clickable.resource_id
        );

        // 执行点击
        match execute_click_action(device_id, clickable, target_text, step_id).await {
            Ok((x, y)) => {
                success_count += 1;
                if config.show_progress {
                    tracing::info!(
                        "✅ [批量执行] 第 {} 个点击成功: ({}, {}) | {}",
                        index,
                        x,
                        y,
                        element_info
                    );
                }
            }
            Err(e) => {
                tracing::warn!(
                    "❌ [批量执行] 第 {} 个点击失败: {} | {}",
                    index,
                    e,
                    element_info
                );

                // 检查是否需要提前终止
                if !config.continue_on_error {
                    tracing::warn!("⚠️ [批量执行] continueOnError=false，提前终止");
                    break;
                }
            }
        }

        // 添加间隔（最后一个不需要）
        if index < total {
            if config.show_progress {
                tracing::info!("⏱️ [批量执行] 等待 {}ms 后继续", config.interval_ms);
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(config.interval_ms)).await;
        }
    }

    tracing::info!(
        "✅ [批量模式] 执行完成，成功 {}/{} 个点击",
        success_count,
        total
    );

    // 根据结果返回
    if success_count > 0 {
        Ok((0, 0)) // 批量模式返回虚拟坐标
    } else {
        Err(format!(
            "批量模式执行失败，0/{} 个点击成功",
            total
        ))
    }
}

/// 提取目标文本（支持多层嵌套）
fn extract_target_text_from_params(params: &serde_json::Value) -> String {
    params.get("smartSelection")
        .and_then(|v| v.get("targetText"))
        .and_then(|v| v.as_str())
        .or_else(|| {
            // 回退1: 从顶层提取（兼容旧格式）
            params.get("targetText").and_then(|v| v.as_str())
        })
        .or_else(|| {
            // 回退2: 从 original_data 提取
            params.get("original_data")
                .and_then(|od| od.get("element_text"))
                .and_then(|v| v.as_str())
        })
        .unwrap_or("")
        .to_string()
}

/// 收集候选元素
fn collect_candidate_elements<'a>(
    elements: &'a [UIElement],
    strategy_type: &str,
    xpath: &str,
    target_text: &str,
    original_bounds: Option<&str>,  // 🔥 新增：用户选择的 bounds
    params: &serde_json::Value,     // 🔥 新增：完整参数，用于提取 children_texts
) -> Vec<&'a UIElement> {
    // 🔥 P0修复：先按 XPath 或 class 收集初步候选
    let mut candidates: Vec<&UIElement> = match strategy_type {
        "self_anchor" => {
            // 🔥 对于自锚定策略，优先使用resource-id + 子元素文本过滤
            if xpath.contains("@resource-id") {
                let resource_id = extract_resource_id_from_xpath(xpath);
                
                // 🔥 检查是否有子元素文本过滤条件
                if let Some(child_text) = extract_child_text_filter_from_xpath(xpath) {
                    tracing::info!("🔍 [元素匹配] 使用子元素文本过滤: resource-id='{}' + 子元素text='{}'", resource_id, child_text);
                    
                    // 收集所有同时满足 resource-id 和子元素文本的元素
                    elements.iter().filter(|e| {
                        let has_resource_id = e.resource_id.as_ref() == Some(&resource_id);
                        let has_child_text = element_has_child_with_text(e, &child_text);
                        
                        if has_resource_id && has_child_text {
                            tracing::info!("✅ [候选收集] 找到匹配元素: resource-id='{}', text='{:?}', bounds='{:?}'", 
                                         resource_id, e.text, e.bounds);
                        }
                        
                        has_resource_id && has_child_text
                    }).collect()
                } else {
                    // 没有子元素过滤，收集所有匹配 resource-id 的元素
                    tracing::warn!("⚠️ [元素匹配] XPath 没有子元素过滤，仅使用 resource-id 匹配（可能不准确）");
                    elements.iter().filter(|e| {
                        e.resource_id.as_ref() == Some(&resource_id)
                    }).collect()
                }
            } else {
                helper_find_all_elements(elements, target_text)
            }
        },
        "child_driven" => {
            // 🔥 对于子元素驱动策略，优先使用 children_texts，如果为空则回退到 targetText
            let search_text = params.get("original_data")
                .and_then(|od| od.get("children_texts"))
                .and_then(|ct| ct.as_array())
                .and_then(|arr| arr.first())
                .and_then(|v| v.as_str())
                .filter(|s| !s.trim().is_empty())
                .unwrap_or(target_text);
            
            if search_text.is_empty() {
                tracing::warn!("⚠️ [child_driven策略] 无可用文本，尝试使用element_text");
                let element_text = params.get("original_data")
                    .and_then(|od| od.get("element_text"))
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.trim().is_empty())
                    .unwrap_or("");
                helper_find_all_elements(elements, element_text)
            } else {
                tracing::info!("🔍 [child_driven策略] 使用子元素文本搜索: '{}'", search_text);
                helper_find_all_elements(elements, search_text)
            }
        },
        "content_desc" => {
            // 🔥 P0修复：为 content-desc 策略添加专门处理
            if xpath.contains("@content-desc") {
                // 从 XPath 提取 content-desc 的值: //*[@content-desc='添加朋友']
                let content_desc = extract_content_desc_from_xpath(xpath);
                
                if !content_desc.is_empty() {
                    tracing::info!("🔍 [元素匹配] 使用 content-desc 匹配: '{}'", content_desc);
                    
                    // 🐛 DEBUG: 打印所有非空content-desc元素(最多前20个)
                    tracing::info!("📋 [DEBUG] 列出所有带 content-desc 的元素:");
                    let mut desc_count = 0;
                    for (i, elem) in elements.iter().enumerate() {
                        if let Some(cd) = &elem.content_desc {
                            if !cd.trim().is_empty() {
                                tracing::info!("  [{}] content_desc='{}', text={:?}, bounds={:?}", 
                                            i, cd, elem.text, elem.bounds);
                                desc_count += 1;
                                if desc_count >= 20 { break; } // 限制输出数量
                            }
                        }
                    }
                    
                    if desc_count == 0 {
                        tracing::warn!("⚠️ [DEBUG] XML中没有任何非空的content-desc属性!");
                    } else {
                        tracing::info!("📊 [DEBUG] 共找到 {} 个带content-desc的元素(显示前20个)", desc_count);
                    }
                    
                    // 收集所有匹配 content-desc 的元素
                    let candidates: Vec<_> = elements.iter().filter(|e| {
                        // 🐛 DEBUG: 更详细的比较逻辑
                        match &e.content_desc {
                            Some(cd) if !cd.trim().is_empty() => {
                                let matches = cd.trim() == content_desc.trim();
                                if matches {
                                    tracing::info!("✅ [候选收集] 找到匹配元素: content-desc='{}', bounds='{:?}'", 
                                                 content_desc, e.bounds);
                                }
                                matches
                            },
                            _ => false
                        }
                    }).collect();
                    
                    if candidates.is_empty() {
                        tracing::warn!("⚠️ [元素匹配] 未找到 content-desc='{}' 的元素，已检查 {} 个元素", 
                                     content_desc, elements.len());
                    }
                    
                    candidates
                } else {
                    tracing::warn!("⚠️ [元素匹配] 无法从 XPath 提取 content-desc 值，回退到文本匹配");
                    helper_find_all_elements(elements, target_text)
                }
            } else {
                // 没有 content-desc 属性，回退到文本匹配
                helper_find_all_elements(elements, target_text)
            }
        },
        _ => {
            // 默认策略：综合文本和描述匹配所有候选
            helper_find_all_elements(elements, target_text)
        }
    };
    
    // 🔥 批量模式检测：从 params 中提取 mode
    let batch_mode = params.get("smartSelection")
        .and_then(|v| v.get("mode"))
        .and_then(|v| v.as_str())
        .unwrap_or("first");
    
    // 🔥 P0修复：根据 mode 决定是否使用 Bounds 精确过滤
    if let Some(user_bounds) = original_bounds {
        if batch_mode == "all" {
            // 🎯 批量模式：优先过滤可点击元素
            tracing::info!("🔄 [批量模式] 开始过滤 {} 个候选", candidates.len());
            
            // 1️⃣ 优先选择可点击的元素
            let clickable_candidates: Vec<_> = candidates.iter()
                .filter(|e| {
                    // clickable 是 Option<bool>，直接判断
                    e.clickable.unwrap_or(false)
                })
                .copied()
                .collect();
            
            if !clickable_candidates.is_empty() {
                tracing::info!(
                    "✅ [批量模式-可点击过滤] 从 {} 个候选中筛选出 {} 个可点击元素",
                    candidates.len(),
                    clickable_candidates.len()
                );
                tracing::info!("   用户选择bounds='{}' 将用于相似度排序", user_bounds);
                // TODO: 实现 Bounds 相似度排序
                return clickable_candidates;
            } else {
                // 2️⃣ 如果没有可点击元素，保留所有候选（兜底）
                tracing::warn!(
                    "⚠️ [批量模式-可点击过滤] 未找到可点击元素，保留全部 {} 个候选",
                    candidates.len()
                );
                return candidates;
            }
        } else {
            // 🎯 单次模式：使用 Bounds 精确过滤
            let exact_match: Vec<_> = candidates.iter()
                .filter(|e| {
                    e.bounds.as_ref().map(|b| {
                        let normalize = |s: &str| s.replace(" ", "");
                        normalize(b) == normalize(user_bounds)
                    }).unwrap_or(false)
                })
                .copied()
                .collect();
            
            if !exact_match.is_empty() {
                tracing::info!("✅ [Bounds过滤] 找到 {} 个完全匹配用户选择bounds的元素 (从 {} 个候选中过滤)", 
                             exact_match.len(), candidates.len());
                return exact_match;
            } else {
                tracing::warn!("⚠️ [Bounds过滤] 未找到完全匹配用户bounds='{}' 的元素，使用全部 {} 个候选", 
                             user_bounds, candidates.len());
            }
        }
    }
    
    candidates
}

/// 从 XPath 提取 content-desc 的值
/// 
/// 例如：`//*[@content-desc='添加朋友']` -> `"添加朋友"`
fn extract_content_desc_from_xpath(xpath: &str) -> String {
    if let Some(start_idx) = xpath.find("@content-desc=") {
        let value_start = start_idx + "@content-desc=".len();
        
        // 跳过引号（单引号或双引号）
        let rest = &xpath[value_start..];
        let quote_char = if rest.starts_with('\'') { '\'' } else if rest.starts_with('"') { '"' } else { return String::new() };
        
        // 提取引号之间的内容
        if let Some(value) = rest.strip_prefix(quote_char) {
            if let Some(end_idx) = value.find(quote_char) {
                return value[..end_idx].to_string();
            }
        }
    }
    
    String::new()
}

/// 评估最佳候选元素
fn evaluate_best_candidate<'a>(
    candidate_elements: Vec<&'a UIElement>,
    params: &serde_json::Value,
    ui_xml: &str,  // 🔥 新增：当前XML内容，用于子元素文本提取
    match_direction: Option<&str>,  // 🆕 匹配方向："forward" | "backward" | None(单步模式)
) -> Result<Option<&'a UIElement>, String> {
    if candidate_elements.len() > 1 {
        tracing::info!("🔍 [多候选评估] 启动模块化评估器（{} 个候选）", candidate_elements.len());
        
        // 从 original_data 提取评估准则
        let original_data = params.get("original_data");
        
        // 🔥 修复：优先使用 element_text，如果为空则回退到 children_texts[0]
        let target_text_option = original_data
            .and_then(|od| od.get("element_text"))
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())  // 🔥 过滤空字符串
            .or_else(|| {
                params.get("smartSelection")
                    .and_then(|v| v.get("targetText"))
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty())  // 🔥 过滤空字符串
            })
            .or_else(|| {
                // 🔥 回退：使用 children_texts 的第一个元素（父容器+子文本模式）
                original_data
                    .and_then(|od| od.get("children_texts"))
                    .and_then(|v| v.as_array())
                    .and_then(|arr| arr.first())
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty())
            })
            .map(|s| s.to_string());
        
        let target_content_desc = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("content-desc"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let original_bounds = original_data
            .and_then(|od| od.get("element_bounds"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 提取子元素文本（用于更精准的匹配）
        let children_texts = original_data
            .and_then(|od| od.get("children_texts"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        
        // 🔍 DEBUG: 输出目标文本来源
        tracing::info!("🔍 [目标文本提取] target_text={:?}, children_texts={:?}", target_text_option, children_texts);
        
        let original_resource_id = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("resource-id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🔥 提取 selected_xpath（用户精确选择的绝对全局XPath）
        let selected_xpath = original_data
            .and_then(|od| od.get("selected_xpath"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🆕 NEW: 提取匹配策略标记
        let matching_strategy = original_data
            .and_then(|od| od.get("matching_strategy"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🆕 NEW: 提取兄弟元素文本
        let sibling_texts = original_data
            .and_then(|od| od.get("sibling_texts"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        
        // 🆕 NEW: 提取父元素信息
        let parent_info = original_data
            .and_then(|od| od.get("parent_info"))
            .and_then(|v| v.as_object())
            .map(|obj| {
                use crate::exec::v3::element_matching::multi_candidate_evaluator::ParentInfo;
                ParentInfo {
                    content_desc: obj.get("contentDesc")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                    text: obj.get("text")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                    resource_id: obj.get("resourceId")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string(),
                }
            });
        
        // 🔍 DEBUG: 输出新提取的策略信息
        if matching_strategy.is_some() || !sibling_texts.is_empty() || parent_info.is_some() {
            tracing::info!("🔥 [策略标记提取] matching_strategy={:?}, sibling_texts={:?}, parent_info={:?}", 
                         matching_strategy, sibling_texts, parent_info);
        }
        
        // ✅ 创建语义分析器实例
        use crate::exec::v3::semantic_analyzer::analyzer::SemanticAnalyzer;
        use crate::exec::v3::semantic_analyzer::config::TextMatchingMode;
        
        let mut semantic_analyzer = SemanticAnalyzer::new();
        
        // 🔥 从前端配置读取文本匹配模式，优先级：smartSelection > originalParams
        let (text_matching_mode, antonym_detection_enabled) = {
            // 尝试从smartSelection配置中获取
            let smart_selection_config = params
                .get("smartSelection")
                .and_then(|v| v.as_object())
                .or_else(|| {
                    params
                        .get("originalParams")
                        .and_then(|v| v.as_object())
                        .and_then(|obj| obj.get("smartSelection"))
                        .and_then(|v| v.as_object())
                });
            
            if let Some(config) = smart_selection_config {
                let mode = config
                    .get("textMatchingMode")
                    .and_then(|v| v.as_str())
                    .unwrap_or("exact"); // 默认绝对匹配
                
                let antonym_enabled = config
                    .get("antonymCheckEnabled")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false); // 默认禁用反义词检测
                
                tracing::info!("🧠 [文本匹配配置] 从前端获取: mode={}, antonym_enabled={}", mode, antonym_enabled);
                
                match mode {
                    "partial" => (TextMatchingMode::Partial, antonym_enabled),
                    _ => (TextMatchingMode::Exact, false), // 绝对匹配强制禁用反义词检测
                }
            } else {
                tracing::warn!("⚠️ [文本匹配配置] 未找到前端配置，使用默认值: mode=exact, antonym_enabled=false");
                (TextMatchingMode::Exact, false) // 默认使用绝对匹配
            }
        };
        
        semantic_analyzer.set_text_matching_mode(text_matching_mode);
        semantic_analyzer.set_antonym_detection(antonym_detection_enabled);

        // ✅ 构建评估准则（完整版）
        let criteria = EvaluationCriteria {
            target_text: target_text_option.clone(), // 克隆避免move
            target_content_desc,
            original_bounds,
            original_resource_id,
            children_texts,
            // 🔥 根据匹配方向决定 prefer_last
            // - None（单步模式）: prefer_last = false（信任智能匹配，不跳过第一个）
            // - "forward"（正向）: prefer_last = false（从第一个开始）
            // - "backward"（反向）: prefer_last = true（从最后一个开始）
            prefer_last: match match_direction {
                Some("forward") => false,   // 正向：从第一个开始
                Some("backward") => true,   // 反向：从最后一个开始
                _ => false,                 // ✅ 单步模式：信任智能匹配系统，从第一个开始
            },
            selected_xpath, // 🔥 传递用户选择的XPath（最高优先级匹配依据）
            xml_content: Some(ui_xml.to_string()), // 🔥 传递当前XML，用于子元素文本提取
            matching_strategy, // 🆕 NEW: 匹配策略标记
            sibling_texts, // 🆕 NEW: 兄弟元素文本
            parent_info, // 🆕 NEW: 父元素信息
            semantic_analyzer: Some(semantic_analyzer), // 🆕 NEW: 语义分析器
        };
        
        // ✅ 使用 MultiCandidateEvaluator 进行综合评估
        tracing::info!("🧠 [多候选评估] 开始综合评分，criteria.selected_xpath={:?}", criteria.selected_xpath);
        
        if let Some(best_candidate) = MultiCandidateEvaluator::evaluate_candidates(candidate_elements.clone(), &criteria) {
            // 🚨 检查分数是否达到最低有效阈值
            const MIN_VALID_SCORE: f32 = 0.3; // 设置最低有效分数
            
            if best_candidate.score < MIN_VALID_SCORE {
                tracing::error!("🚨 [目标不存在] 最佳候选分数过低 ({:.3} < {:.1})，当前页面可能不存在真正的目标元素", 
                               best_candidate.score, MIN_VALID_SCORE);
                tracing::error!("   📍 最佳候选详情: text={:?}, content-desc={:?}, bounds={:?}", 
                               best_candidate.element.text, 
                               best_candidate.element.content_desc,
                               best_candidate.element.bounds);
                tracing::error!("   🔍 评分原因:");
                for reason in &best_candidate.reasons {
                    tracing::error!("      └─ {}", reason);
                }
                
                // 特殊检查：如果是反义词情况，给出更明确的错误信息
                if best_candidate.reasons.iter().any(|r| r.contains("反义词") || r.contains("语义相反")) {
                    if let Some(ref target_text) = criteria.target_text {
                        return Err(format!(
                            "当前页面不存在可点击的'{}' 按钮，所有找到的按钮都是相反状态（如'已{}'）。\n建议：请检查页面状态，或者更新页面后重试。",
                            target_text, target_text
                        ));
                    }
                }
                
                return Err(format!(
                    "当前页面不存在符合条件的目标元素（最高分仅{:.3}），请检查页面状态或目标选择是否正确。",
                    best_candidate.score
                ));
            }
            
            tracing::info!("✅ [多候选评估] 最佳匹配: score={:.3}", best_candidate.score);
            tracing::info!("   📍 详情: text={:?}, content-desc={:?}, bounds={:?}", 
                         best_candidate.element.text, 
                         best_candidate.element.content_desc,
                         best_candidate.element.bounds);
            tracing::info!("   🔍 评分原因:");
            for reason in &best_candidate.reasons {
                tracing::info!("      └─ {}", reason);
            }
            
            return Ok(Some(best_candidate.element));
        } else {
            tracing::warn!("⚠️ [多候选评估] 评估失败，使用第一个候选");
            return Ok(candidate_elements.first().copied());
        }
    } else {
        // 只有一个或零个候选，直接使用
        Ok(candidate_elements.first().copied())
    }
}

/// 尝试元素恢复
fn attempt_element_recovery<'a>(
    params: &serde_json::Value,
    elements: &'a [UIElement],
) -> Result<Option<&'a UIElement>, String> {
    tracing::warn!("⚠️ [智能执行] 真机XML中未找到目标元素，启动失败恢复机制");
    
    // ⚠️ 暂时禁用失败恢复逻辑（RecoveryContext 编译错误待修复）
    // TODO: 修复 RecoveryContext 和 attempt_recovery 的导入问题
    /*
    // 尝试构建恢复上下文
    if let Some(recovery_ctx) = RecoveryContext::from_params(params) {
        tracing::info!("🔧 [失败恢复] 恢复上下文构建成功，开始恢复流程");
        
        // 使用 recovery_manager 进行智能恢复（获取候选列表）
        match attempt_recovery(&recovery_ctx, elements) {
            Ok(recovery_result) => {
                tracing::info!("✅ [失败恢复] 恢复流程完成，找到 {} 个候选元素", 
                             recovery_result.candidates.len());
                tracing::info!("   📍 恢复策略: {}", recovery_result.recovery_strategy);
                
                if !recovery_result.candidates.is_empty() {
                    // 🆕 使用新的多候选评估器进行最终选择
                    tracing::info!("🧠 [失败恢复] 使用多候选评估器进行最终选择");
                    
                    // 提取目标特征
                    let target_text = if let Some(ref original) = recovery_result.original_target {
                        original.text.clone()
                    } else {
                        recovery_ctx.element_text.clone()
                    };
                    
                    let target_content_desc = if let Some(ref original) = recovery_result.original_target {
                        original.content_desc.clone()
                    } else {
                        recovery_ctx.content_desc.clone()
                    };
                    
                    let original_bounds = if let Some(ref original) = recovery_result.original_target {
                        original.bounds.clone()
                    } else {
                        recovery_ctx.element_bounds.clone()
                    };
                    
                    let original_resource_id = if let Some(ref original) = recovery_result.original_target {
                        original.resource_id.clone()
                    } else {
                        recovery_ctx.resource_id.clone()
                    };
                    
                    // ✅ 启用多候选评估器
                    let mut semantic_analyzer = SemanticAnalyzer::new();
                    semantic_analyzer.set_text_matching_mode(TextMatchingMode::Partial);
                    semantic_analyzer.set_antonym_detection(true);
                    
                    let criteria = EvaluationCriteria {
                        target_text,
                        target_content_desc,
                        original_bounds,
                        original_resource_id,
                        children_texts: vec![],
                        prefer_last: false, // 恢复场景不需要优先最后一个
                        selected_xpath: Some(recovery_ctx.selected_xpath.clone()), // 🔥 传递用户选择的XPath
                        xml_content: None, // 🔥 真机XML已经在当前上下文中
                        matching_strategy: None, // 恢复场景不使用策略标记
                        sibling_texts: vec![],
                        parent_info: None,
                        semantic_analyzer: Some(semantic_analyzer), // 🆕 NEW: 语义分析器
                    };
                    
                    // 将候选转换为引用列表
                    let candidate_refs: Vec<&UIElement> = recovery_result.candidates.iter().collect();
                    
                    // 使用新的多候选评估器
                    if let Some(best_candidate) = MultiCandidateEvaluator::evaluate_candidates(candidate_refs, &criteria) {
                        tracing::info!("✅ [失败恢复] 多候选评估完成，最佳候选评分: {:.3}", best_candidate.score);
                        tracing::info!("   📍 选中元素: text={:?}, bounds={:?}", 
                                     best_candidate.element.text, best_candidate.element.bounds);
                        
                        // 在 elements 中找到匹配的元素（使用真机XML的元素）
                        let matched = elements.iter()
                            .find(|e| e.bounds == best_candidate.element.bounds && e.text == best_candidate.element.text);
                        
                        return Ok(matched);
                    } else {
                        tracing::error!("❌ [失败恢复] 多候选评估失败：没有合适的候选");
                    }
                    
                    // 从 elements 中找到匹配的元素（返回引用）
                    if let Some(first_candidate) = recovery_result.candidates.first() {
                        let matched = elements.iter()
                            .find(|e| e.bounds == first_candidate.bounds && e.text == first_candidate.text);
                        return Ok(matched);
                    }
                    return Ok(None);
                } else {
                    tracing::error!("❌ [失败恢复] 没有找到相似候选元素");
                }
            }
            Err(e) => {
                tracing::error!("❌ [失败恢复] 恢复失败: {}", e);
                tracing::error!("   💡 建议：UI结构可能已变化，请重新录制该步骤");
            }
        }
    } else {
        tracing::warn!("⚠️ [失败恢复] 无法构建恢复上下文（缺少 original_data）");
        tracing::warn!("   💡 提示：确保前端传递了完整的 original_data 字段");
    }
    */
    
    // 暂时直接返回 None
    tracing::warn!("⚠️ 失败恢复逻辑已禁用，返回 None");
    Ok(None)
}

/// 确保元素可点击
fn ensure_clickable_element<'a>(element: &'a UIElement) -> &'a UIElement {
    if element.clickable.unwrap_or(false) {
        element
    } else {
        tracing::info!("🧠 [智能执行] 目标元素不可点击，查找可点击的父容器");
        // TODO: 实现完整的层级向上查找
        element
    }
}

/// 执行点击操作
async fn execute_click_action(
    device_id: &str,
    element: &UIElement,
    target_text: &str,
    step_id: &str,
) -> Result<(i32, i32), String> {
    // 提取点击坐标
    let click_point = if let Some(bounds_str) = &element.bounds {
        tracing::info!("🔍 [坐标计算] 原始bounds字符串: '{}'", bounds_str);
        let point = helper_parse_bounds(bounds_str)
            .map_err(|e| format!("解析bounds失败: {}", e))?;
        tracing::info!("✅ [坐标计算] 解析结果: center=({}, {})", point.0, point.1);
        point
    } else {
        return Err(format!("元素缺少bounds信息，target_text={}", target_text));
    };
    
    tracing::info!("🧠 [智能执行] 准备点击坐标: ({}, {}) for target_text={}", 
        click_point.0, click_point.1, target_text);
    tracing::info!("🔍 [元素信息] class={:?}, resource_id={:?}, clickable={:?}", 
        element.class, element.resource_id, element.clickable);
    
    // 执行真实点击操作
    match crate::infra::adb::input_helper::tap_injector_first(
        &crate::utils::adb_utils::get_adb_path(),
        device_id,
        click_point.0,
        click_point.1,
        None,
    ).await {
        Ok(_) => {
            tracing::info!("🧠 ✅ 智能分析步骤执行成功: {} -> 点击坐标({}, {})", 
                step_id, click_point.0, click_point.1);
            Ok(click_point)
        }
        Err(e) => {
            tracing::error!("🧠 ❌ 智能分析步骤执行失败: {} -> {}", step_id, e);
            Err(format!("智能分析步骤执行失败: {}", e))
        }
    }
}
