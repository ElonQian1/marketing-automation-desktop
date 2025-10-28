// src-tauri/src/exec/v3/helpers/step_executor.rs
// module: exec | layer: v3/helpers | role: 步骤执行器
// summary: 执行智能分析生成的步骤，包含元素匹配、失败恢复和真实设备操作

use crate::services::ui_reader_service::UIElement;
use super::super::types::{InlineStep, ValidationSettings};
use super::element_matching::{
    // MultiCandidateEvaluator,  // 🔧 暂时注释：等待重构完成
    // EvaluationCriteria,  // 🔧 暂时注释：等待重构完成
    extract_resource_id_from_xpath,
    extract_child_text_filter_from_xpath,
    element_has_child_with_text,
    find_all_elements_by_text_or_desc as helper_find_all_elements,
    parse_bounds_center as helper_parse_bounds,
};
use super::super::recovery_manager::{RecoveryContext, attempt_recovery};

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
    
    // 🔧 修复1：优先使用原始XPath（用户静态分析时选择的精确路径）
    let selected_xpath = inline.params.get("original_data")
        .and_then(|od| od.get("selected_xpath"))
        .and_then(|v| v.as_str());
    
    let xpath = selected_xpath.or_else(|| {
        inline.params.get("xpath").and_then(|v| v.as_str())
    }).ok_or_else(|| format!("智能分析步骤 {} 缺少xpath参数", inline.step_id))?;
    
    // 🔥 P0修复: 正确提取 targetText（支持多层嵌套）
    let target_text = extract_target_text_from_params(&inline.params);
    
    let confidence = inline.params.get("confidence")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.8);
    
    let strategy_type = inline.params.get("strategy_type")
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
    
    // 🔧 修复2：收集候选元素
    let candidate_elements = collect_candidate_elements(&elements, strategy_type, xpath, &target_text);
    
    tracing::info!("🎯 [候选收集] 找到 {} 个匹配的候选元素", candidate_elements.len());
    
    // 🆕 多候选评估：使用模块化评估系统
    let mut target_element = evaluate_best_candidate(candidate_elements, &inline.params)?;
    
    // 🆕 修复3：失败恢复机制
    if target_element.is_none() {
        target_element = attempt_element_recovery(&inline.params, &elements)?;
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
    
    // 执行点击操作
    execute_click_action(device_id, clickable_element, &target_text, &inline.step_id).await
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
) -> Vec<&'a UIElement> {
    match strategy_type {
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
            // 对于子元素驱动策略，查找所有包含目标文本的元素
            helper_find_all_elements(elements, target_text)
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
    }
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
) -> Result<Option<&'a UIElement>, String> {
    if candidate_elements.len() > 1 {
        tracing::info!("🔍 [多候选评估] 启动模块化评估器（{} 个候选）", candidate_elements.len());
        
        // 从 original_data 提取评估准则
        let original_data = params.get("original_data");
        
        let target_text_option = original_data
            .and_then(|od| od.get("element_text"))
            .and_then(|v| v.as_str())
            .or_else(|| {
                params.get("smartSelection")
                    .and_then(|v| v.get("targetText"))
                    .and_then(|v| v.as_str())
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
        
        let original_resource_id = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("resource-id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // 🔧 TODO: 重构完成后恢复多候选评估逻辑
        // 构建评估准则
        // let criteria = EvaluationCriteria {
        //     target_text: target_text_option,
        //     target_content_desc,
        //     original_bounds,
        //     original_resource_id,
        //     children_texts,
        //     prefer_last: true, // 用户需求：优先选择最后一个（避免选择列表第一项）
        // };
        
        // 使用 MultiCandidateEvaluator 进行综合评估
        // if let Some(best_candidate) = MultiCandidateEvaluator::evaluate_candidates(candidate_elements.clone(), &criteria) {
        //     tracing::info!("✅ [多候选评估] 最佳匹配: score={:.3}, reasons={}", 
        //                  best_candidate.score, best_candidate.reasons.join(", "));
        //     tracing::info!("   📍 详情: text={:?}, content-desc={:?}, bounds={:?}", 
        //                  best_candidate.element.text, 
        //                  best_candidate.element.content_desc,
        //                  best_candidate.element.bounds);
        //     
        //     Ok(Some(best_candidate.element))
        // } else {
        //     tracing::warn!("⚠️ [多候选评估] 评估失败，使用第一个候选");
        //     Ok(candidate_elements.first().copied())
        // }
        
        // 临时降级逻辑：直接使用第一个候选
        tracing::warn!("🔧 [临时降级] 多候选评估模块重构中，使用第一个候选元素");
        Ok(candidate_elements.first().copied())
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
                    
                    // 🔧 TODO: 重构完成后恢复多候选评估逻辑
                    // let criteria = EvaluationCriteria {
                    //     target_text,
                    //     target_content_desc,
                    //     original_bounds,
                    //     original_resource_id,
                    //     children_texts: vec![],
                    //     prefer_last: false, // 恢复场景不需要优先最后一个
                    // };
                    
                    // 将候选转换为引用列表
                    // let candidate_refs: Vec<&UIElement> = recovery_result.candidates.iter().collect();
                    
                    // 使用新的多候选评估器
                    // if let Some(best_candidate) = MultiCandidateEvaluator::evaluate_candidates(candidate_refs, &criteria) {
                    //     tracing::info!("✅ [失败恢复] 多候选评估完成，最佳候选评分: {:.3}", best_candidate.score);
                    //     tracing::info!("   📍 选中元素: text={:?}, bounds={:?}", 
                    //                  best_candidate.element.text, best_candidate.element.bounds);
                    //     
                    //     // 在 elements 中找到匹配的元素（使用真机XML的元素）
                    //     let matched = elements.iter()
                    //         .find(|e| e.bounds == best_candidate.element.bounds && e.text == best_candidate.element.text);
                    //     
                    //     return Ok(matched);
                    // } else {
                    //     tracing::error!("❌ [失败恢复] 多候选评估失败：没有合适的候选");
                    // }
                    
                    // 临时降级逻辑：直接使用第一个候选
                    tracing::warn!("🔧 [临时降级] 多候选评估模块重构中，使用第一个恢复候选");
                    
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
        helper_parse_bounds(bounds_str)
            .map_err(|e| format!("解析bounds失败: {}", e))?
    } else {
        return Err(format!("元素缺少bounds信息，target_text={}", target_text));
    };
    
    tracing::info!("🧠 [智能执行] 计算出点击坐标: ({}, {}) for target_text={}", 
        click_point.0, click_point.1, target_text);
    
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
