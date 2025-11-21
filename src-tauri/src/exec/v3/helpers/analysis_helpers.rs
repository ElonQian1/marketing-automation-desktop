// src-tauri/src/exec/v3/helpers/analysis_helpers.rs
// module: v3 | layer: helpers | role: 智能分析辅助函数 - 触发判断与前端调用
// summary: 提供智能分析的触发条件判断和前端调用功能

use crate::exec::v3::StepRefOrInline;
use crate::services::intelligent_analysis_service::{
    IntelligentAnalysisRequest, UserSelectionContext,
};

// ================================================================
// 📝 日志辅助函数
// ================================================================

/// 📝 辅助函数：简化JSON中的XML字段显示（仅显示长度而非完整内容）
///
/// 🔧 修复：
/// - 增强递归处理，确保深度嵌套的XML也能被截断
/// - 增加更多XML字段名称的识别（xml, raw_xml等）
/// - 对超过1000字符的字符串字段也进行截断（防止其他大字段）
pub fn truncate_xml_in_json(json_value: &serde_json::Value) -> serde_json::Value {
    match json_value {
        serde_json::Value::Object(map) => {
            let mut new_map = serde_json::Map::new();
            for (key, value) in map {
                // 🔧 扩展XML字段识别
                let is_xml_field = key == "original_xml"
                    || key == "xmlContent"
                    || key == "xml_content"
                    || key == "xml"
                    || key == "raw_xml"
                    || key == "ui_xml"
                    || key == "snapshot_xml";

                if is_xml_field {
                    // 如果是XML字段，只显示长度
                    if let Some(xml_str) = value.as_str() {
                        new_map.insert(
                            key.clone(),
                            serde_json::json!(format!("<XML:{} bytes>", xml_str.len())),
                        );
                    } else {
                        new_map.insert(key.clone(), value.clone());
                    }
                } else if value.is_object() {
                    // 🔧 关键修复：对所有嵌套对象都递归处理，不限于特定键名
                    new_map.insert(key.clone(), truncate_xml_in_json(value));
                } else if value.is_array() {
                    // 递归处理数组
                    new_map.insert(key.clone(), truncate_xml_in_json(value));
                } else if let Some(str_value) = value.as_str() {
                    // 🆕 对超长字符串也进行截断（可能是其他大文本字段）
                    if str_value.len() > 1000 {
                        new_map.insert(
                            key.clone(),
                            serde_json::json!(format!("<LONG_TEXT:{} bytes>", str_value.len())),
                        );
                    } else {
                        new_map.insert(key.clone(), value.clone());
                    }
                } else {
                    new_map.insert(key.clone(), value.clone());
                }
            }
            serde_json::Value::Object(new_map)
        }
        serde_json::Value::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(|v| truncate_xml_in_json(v)).collect())
        }
        _ => json_value.clone(),
    }
}

// ================================================================
// 🧠 智能分析触发判断函数
// ================================================================

/// 🆕 提前检测是否需要智能分析（基于原始参数，不依赖Legacy结果）
///
/// 这个函数在Legacy引擎执行前就进行检测，如果发现参数为空，
/// 直接触发智能分析，跳过Legacy引擎的预筛选过程
///
/// 参数：
/// - step_params: 步骤参数
///
/// 返回：
/// - true: 跳过Legacy，直接智能分析
/// - false: 继续正常流程（先Legacy后智能）
pub fn should_trigger_intelligent_analysis_early(step_params: &serde_json::Value) -> bool {
    // 🚫 结构模式兜底：显式结构模式禁止提前触发智能分析
    if is_explicit_structural_mode_from_params(step_params) {
        tracing::info!("🛑 [结构模式] 显式结构模式下禁用提前触发智能分析");
        return false;
    }

    // 检查关键参数是否为空
    let target_text = step_params
        .get("targetText")
        .and_then(|v| v.as_str())
        .filter(|s| !s.trim().is_empty());

    let content_desc = step_params
        .get("contentDesc")
        .and_then(|v| v.as_str())
        .filter(|s| !s.trim().is_empty());

    let text = step_params
        .get("text")
        .and_then(|v| v.as_str())
        .filter(|s| !s.trim().is_empty());

    // 检查smartSelection嵌套参数
    let smart_selection_params = step_params.get("smartSelection").and_then(|ss| {
        ss.get("targetText")
            .and_then(|v| v.as_str())
            .filter(|s| !s.trim().is_empty())
            .or_else(|| {
                ss.get("contentDesc")
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.trim().is_empty())
            })
            .or_else(|| {
                ss.get("text")
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.trim().is_empty())
            })
    });

    // 如果所有关键参数都为空，触发智能分析
    if target_text.is_none()
        && content_desc.is_none()
        && text.is_none()
        && smart_selection_params.is_none()
    {
        tracing::info!("🧠 提前触发智能分析：所有目标文本参数为空，跳过Legacy引擎预筛选");
        return true;
    }

    false
}

/// 🧭 从参数中判断是否显式开启了结构模式（matchingStrategy === 'structural'）
/// 支持在顶层或 originalParams 内声明。
pub fn is_explicit_structural_mode_from_params(params: &serde_json::Value) -> bool {
    let top_level = params
        .get("matchingStrategy")
        .and_then(|v| v.as_str())
        .map(|s| s.eq_ignore_ascii_case("structural"))
        .unwrap_or(false);

    let nested = params
        .get("originalParams")
        .and_then(|p| p.get("matchingStrategy"))
        .and_then(|v| v.as_str())
        .map(|s| s.eq_ignore_ascii_case("structural"))
        .unwrap_or(false);

    top_level || nested
}

/// 🔍 判断是否需要触发智能策略分析（Step 0-6分析）
///
/// 触发条件：
/// 1. 没有候选步骤（ordered_steps为空）
/// 2. 候选步骤质量不足（缺少关键参数）
/// 3. 质量设置要求进行智能分析
///
/// 参数：
/// - ordered_steps: Legacy引擎生成的候选步骤列表
/// - quality: 质量设置
///
/// 返回：
/// - true: 需要智能分析（Legacy结果不理想）
/// - false: 不需要智能分析（Legacy结果可用）
pub fn should_trigger_intelligent_analysis(
    ordered_steps: &[StepRefOrInline],
    _quality: &crate::exec::v3::QualitySettings,
) -> bool {
    use crate::exec::v3::SingleStepAction;

    // 1. 如果没有候选步骤，必须进行智能分析
    if ordered_steps.is_empty() {
        tracing::info!("🧠 触发智能分析原因：无候选步骤");
        return true;
    }

    // 2. 检查步骤质量：是否存在缺少关键参数的步骤
    let mut has_invalid_steps = false;
    for (idx, step) in ordered_steps.iter().enumerate() {
        if let Some(inline) = &step.inline {
            // 检查SmartSelection步骤是否有有效的目标文本参数
            match &inline.action {
                SingleStepAction::SmartSelection => {
                    // ✅ 结构模式下允许空文本：只要有skeleton就算参数完整
                    let is_structural = is_explicit_structural_mode_from_params(&inline.params);
                    
                    if is_structural {
                        // 结构模式：检查是否有structural_signatures.skeleton
                        let has_skeleton = inline.params
                            .get("structural_signatures")
                            .and_then(|sigs| sigs.get("skeleton"))
                            .and_then(|sk| sk.as_array())
                            .map(|arr| !arr.is_empty())
                            .unwrap_or(false);
                        
                        if !has_skeleton {
                            tracing::warn!(
                                "🧠 步骤 {} 结构模式缺少skeleton（参数不完整）",
                                idx
                            );
                            has_invalid_steps = true;
                        }
                        // ✅ 有skeleton则参数完整，targetText允许为空
                    } else {
                        // 非结构模式：必须有目标文本参数
                        let has_valid_target_text = inline
                            .params
                            .get("targetText")
                            .and_then(|v| v.as_str())
                            .filter(|s| !s.trim().is_empty())
                            .is_some()
                            || inline
                                .params
                                .get("contentDesc")
                                .and_then(|v| v.as_str())
                                .filter(|s| !s.trim().is_empty())
                                .is_some()
                            || inline
                                .params
                                .get("text")
                                .and_then(|v| v.as_str())
                                .filter(|s| !s.trim().is_empty())
                                .is_some()
                            || inline
                                .params
                                .get("smartSelection")
                                .and_then(|ss| {
                                    ss.get("targetText")
                                        .and_then(|v| v.as_str())
                                        .filter(|s| !s.trim().is_empty())
                                        .or_else(|| {
                                            ss.get("contentDesc")
                                                .and_then(|v| v.as_str())
                                                .filter(|s| !s.trim().is_empty())
                                        })
                                        .or_else(|| {
                                            ss.get("text")
                                                .and_then(|v| v.as_str())
                                                .filter(|s| !s.trim().is_empty())
                                        })
                                })
                                .is_some();

                        if !has_valid_target_text {
                            tracing::warn!(
                                "🧠 步骤 {} SmartSelection缺少有效目标文本参数（空字符串不算有效）",
                                idx
                            );
                            has_invalid_steps = true;
                        }
                    }
                }
                SingleStepAction::Tap => {
                    let has_target_text =
                        inline.params.get("text").and_then(|v| v.as_str()).is_some()
                            || inline
                                .params
                                .get("contentDesc")
                                .and_then(|v| v.as_str())
                                .is_some()
                            || inline
                                .params
                                .get("targetText")
                                .and_then(|v| v.as_str())
                                .is_some();

                    // ✅ V3修复：如果已有高置信度的XPath，也视为有效步骤
                    let has_high_confidence_xpath = inline.params.get("xpath").is_some()
                        && inline
                            .params
                            .get("confidence")
                            .and_then(|v| v.as_f64())
                            .unwrap_or(0.0)
                            >= 0.7;

                    if !has_target_text && !has_high_confidence_xpath {
                        tracing::warn!("🧠 步骤 {} Tap缺少目标文本参数且置信度不足", idx);
                        has_invalid_steps = true;
                    }
                }
                _ => {
                    // 其他类型的步骤暂时认为有效
                }
            }
        }
    }

    if has_invalid_steps {
        tracing::info!("🧠 触发智能分析原因：存在参数不完整的步骤");
        return true;
    }

    // 3. 🎯 V3修复：更严格的智能分析触发条件
    // 避免在已有良好候选步骤时进行不必要的智能分析

    // 4. 只有在候选步骤确实不足时才触发智能分析（提高门槛）
    if ordered_steps.is_empty() {
        tracing::info!("🧠 触发智能分析原因：完全没有候选步骤");
        return true;
    }

    // 5. 🔧 V3优化：如果有高质量的前端生成步骤，不需要后端再次生成
    // 检查是否所有步骤都有完整的参数配置
    let mut valid_step_count = 0;
    for step in ordered_steps {
        if let Some(inline) = &step.inline {
            match &inline.action {
                SingleStepAction::SmartSelection | SingleStepAction::Tap => {
                    // 🎯 修复：检查参数是否存在且不为空字符串
                    let has_complete_params = inline
                        .params
                        .get("targetText")
                        .and_then(|v| v.as_str())
                        .filter(|s| !s.trim().is_empty())
                        .is_some()
                        || inline
                            .params
                            .get("text")
                            .and_then(|v| v.as_str())
                            .filter(|s| !s.trim().is_empty())
                            .is_some()
                        || inline
                            .params
                            .get("contentDesc")
                            .and_then(|v| v.as_str())
                            .filter(|s| !s.trim().is_empty())
                            .is_some()
                        || inline
                            .params
                            .get("smartSelection")
                            .and_then(|ss| {
                                ss.get("targetText")
                                    .and_then(|v| v.as_str())
                                    .filter(|s| !s.trim().is_empty())
                                    .or_else(|| {
                                        ss.get("contentDesc")
                                            .and_then(|v| v.as_str())
                                            .filter(|s| !s.trim().is_empty())
                                    })
                                    .or_else(|| {
                                        ss.get("text")
                                            .and_then(|v| v.as_str())
                                            .filter(|s| !s.trim().is_empty())
                                    })
                            })
                            .is_some();

                    // ✅ V3修复：如果已有高置信度的XPath，也视为有效步骤
                    let has_high_confidence_xpath = inline.params.get("xpath").is_some()
                        && inline
                            .params
                            .get("confidence")
                            .and_then(|v| v.as_f64())
                            .unwrap_or(0.0)
                            >= 0.7;

                    if has_complete_params || has_high_confidence_xpath {
                        valid_step_count += 1;
                    }
                }
                _ => {
                    valid_step_count += 1; // 其他类型步骤认为有效
                }
            }
        } else if step.r#ref.is_some() {
            valid_step_count += 1; // 引用类型步骤认为有效
        }
    }

    // 🔧 V3修复：SmartSelection动作检测
    // ✅ 结构模式下不应触发智能分析,因为已有structural_signatures
    for step in ordered_steps {
        if let Some(inline) = &step.inline {
            if matches!(inline.action, SingleStepAction::SmartSelection) {
                // ✅ 检查是否是结构模式
                let is_structural = is_explicit_structural_mode_from_params(&inline.params);
                
                if is_structural {
                    // 结构模式：检查是否有structural_signatures
                    let has_structural_sigs = inline.params
                        .get("structural_signatures")
                        .and_then(|sigs| sigs.get("skeleton"))
                        .and_then(|sk| sk.as_array())
                        .map(|arr| !arr.is_empty())
                        .unwrap_or(false);
                    
                    if has_structural_sigs {
                        tracing::info!(
                            "🏗️ [结构模式] SmartSelection有完整structural_signatures,不触发智能分析"
                        );
                        // ✅ 有结构签名,不需要智能分析
                        continue;
                    } else {
                        tracing::warn!(
                            "⚠️ [结构模式] SmartSelection缺少structural_signatures,触发智能分析"
                        );
                        return true;
                    }
                } else {
                    // 非结构模式：SmartSelection应该触发智能分析
                    tracing::info!("🧠 触发智能分析原因：检测到SmartSelection动作(非结构模式)");
                    return true;
                }
            }

            // 🆕 检测通用名称：如果targetText是"智能操作 N"这类通用名称，应该触发智能分析
            if let Some(target_text) = inline.params.get("targetText").and_then(|v| v.as_str()) {
                if target_text.starts_with("智能操作")
                    || target_text.starts_with("智能点击")
                    || target_text.starts_with("智能按钮")
                    || target_text.starts_with("智能")
                {
                    tracing::info!(
                        "🧠 触发智能分析原因：检测到通用targetText '{}'，需要智能分析获取真实文本",
                        target_text
                    );
                    return true;
                }
            }

            // 🆕 检测smartSelection内的通用名称
            if let Some(smart_selection) = inline.params.get("smartSelection") {
                if let Some(target_text) =
                    smart_selection.get("targetText").and_then(|v| v.as_str())
                {
                    if target_text.starts_with("智能操作")
                        || target_text.starts_with("智能点击")
                        || target_text.starts_with("智能按钮")
                        || target_text.starts_with("智能")
                    {
                        tracing::info!("🧠 触发智能分析原因：检测到smartSelection通用targetText '{}'，需要智能分析", target_text);
                        return true;
                    }
                }
            }
        }
    }

    // 对于非SmartSelection动作，检查参数完整性
    if valid_step_count >= ordered_steps.len() && ordered_steps.len() >= 1 {
        tracing::info!(
            "🎯 不触发智能分析：已有 {} 个高质量候选步骤",
            valid_step_count
        );
        return false;
    }

    tracing::info!(
        "🧠 触发智能分析原因：有效步骤不足 ({}/{} 有效)",
        valid_step_count,
        ordered_steps.len()
    );
    true
}

// ================================================================
// 🔗 前端智能分析调用函数
// ================================================================

/// 🚀 从原始数据执行智能策略分析（Step 0-6完整流程）
///
/// 这是智能分析的主入口函数，执行完整的7步分析流程：
/// - Step 0: 获取原始UI结构和设备状态
/// - Step 1: 解析XML，提取所有可交互元素
/// - Step 2: 应用语义理解和上下文分析
/// - Step 3: 多维度评分（文本、位置、结构、属性）
/// - Step 4: 生成候选策略并排序
/// - Step 5: 选择最优策略
/// - Step 6: 验证和执行准备
///
/// 参数：
/// - device_id: 设备ID
/// - original_params: 原始前端参数
/// - ui_xml: 原始XML，未经预处理
/// - app_handle: 用于获取设备状态等
///
/// 返回：
/// - Ok(Vec<StepRefOrInline>): 智能分析生成的候选步骤列表
/// - Err(String): 分析失败错误
pub async fn perform_intelligent_strategy_analysis_from_raw(
    device_id: &str,
    original_params: &serde_json::Value,
    ui_xml: &str,
    app_handle: &tauri::AppHandle,
) -> Result<Vec<StepRefOrInline>, String> {
    use super::device_manager;
    use super::intelligent_analysis::*;
    use super::strategy_generation::*;

    // 🚫 结构模式兜底：显式结构模式下跳过Step 0-6智能分析
    if is_explicit_structural_mode_from_params(original_params) {
        tracing::info!("🛑 [结构模式] 显式结构模式：跳过 Step 0-6 智能分析");
        return Ok(vec![]);
    }

    tracing::info!("🧠 开始智能策略分析 (Step 0-6) - 从原始数据直接处理");

    // 🔍 【调试】检查stepId是否存在于original_params中
    if let Some(step_id) = original_params.get("stepId") {
        tracing::info!("✅ [stepId检查] 在original_params中找到stepId: {}", step_id);
    } else {
        tracing::warn!("⚠️ [stepId检查] original_params中缺少stepId字段！");
    }

    // �📝 使用简化版日志（XML字段只显示长度）
    let truncated_params = truncate_xml_in_json(original_params);
    tracing::info!(
        "   📋 原始参数: {}",
        serde_json::to_string(&truncated_params).unwrap_or_default()
    );
    tracing::info!("   📱 XML长度: {} 字符", ui_xml.len());

    // Step 0: 获取设备状态和UI基础信息
    let device_info = device_manager::get_device_basic_info(device_id, app_handle).await?;
    tracing::info!("✅ Step 0: 设备状态获取完成");

    // Step 1: 从原始XML解析所有潜在可交互元素（不受Legacy限制）
    let all_interactive_elements = extract_all_interactive_elements_from_xml(ui_xml)?;
    tracing::info!(
        "✅ Step 1: 从XML解析出 {} 个潜在可交互元素",
        all_interactive_elements.len()
    );

    // Step 2: 应用语义理解，基于原始参数推断用户意图
    let user_intent = analyze_user_intent_from_params(original_params)?;
    tracing::info!("✅ Step 2: 用户意图分析完成 - {:?}", user_intent);

    // Step 3: 多维度评分系统（不依赖Legacy的单一clickable判断）
    let scored_candidates =
        score_elements_intelligently(&all_interactive_elements, &user_intent, &device_info)?;
    tracing::info!(
        "✅ Step 3: 完成 {} 个元素的智能评分",
        scored_candidates.len()
    );

    // Step 4: 生成多种策略候选并排序
    let strategy_candidates = generate_strategy_candidates(&scored_candidates, original_params)?;
    tracing::info!("✅ Step 4: 生成 {} 个策略候选", strategy_candidates.len());

    // Step 5: 选择最优策略（考虑置信度、风险、成功率）
    let optimal_strategies = select_optimal_strategies(&strategy_candidates)?;
    tracing::info!("✅ Step 5: 选出 {} 个最优策略", optimal_strategies.len());

    // Step 6: 转换为V3执行格式
    let v3_steps = convert_strategies_to_v3_steps(&optimal_strategies, original_params)?;
    tracing::info!("✅ Step 6: 转换为 {} 个V3执行步骤", v3_steps.len());

    // 调用前端智能策略系统进行验证和优化
    match call_frontend_intelligent_analysis_with_context(
        &user_intent,
        ui_xml,
        device_id,
        original_params,
    )
    .await
    {
        Ok(steps) => {
            tracing::info!("✅ 智能策略分析完成，生成 {} 个候选步骤", steps.len());
            return Ok(steps);
        }
        Err(e) => {
            tracing::warn!("⚠️ 智能策略分析失败，使用回退策略: {}", e);
        }
    }

    // Step 3: 回退策略 - 返回基础候选步骤
    tracing::info!("🔄 使用回退策略");
    Ok(generate_fallback_strategy_steps())
}

/// 🆕 增强版前端调用（包含上下文）
///
/// 调用前端智能分析服务，提供完整的用户选择上下文。
///
/// 参数：
/// - user_intent: 用户意图分析结果
/// - ui_xml: UI XML内容
/// - device_id: 设备ID
/// - original_params: 原始参数（包含original_data）
///
/// 返回：
/// - Ok(Vec<StepRefOrInline>): 转换后的V3步骤列表
/// - Err(anyhow::Error): 分析或转换失败
async fn call_frontend_intelligent_analysis_with_context(
    user_intent: &super::intelligent_analysis::UserIntent,
    ui_xml: &str,
    device_id: &str,
    original_params: &serde_json::Value,
) -> Result<Vec<StepRefOrInline>, anyhow::Error> {
    

    tracing::info!("🔗 调用增强版前端智能策略分析系统");

    // 🔥 【调试】打印简化版的 original_params（XML字段只显示长度）
    let truncated_params = truncate_xml_in_json(original_params);
    tracing::info!(
        "🔍 [DEBUG] original_params 内容: {}",
        serde_json::to_string_pretty(&truncated_params)
            .unwrap_or_else(|_| "无法序列化".to_string())
    );

    // 🔥 【核心修复】从 original_params 提取用户选择上下文
    let user_selection = if let Some(original_data) = original_params.get("original_data") {
        // 从 original_data 提取完整的用户选择信息
        let selected_xpath = original_data
            .get("selected_xpath")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let element_text = original_data
            .get("element_text")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string());

        let element_bounds = original_data
            .get("element_bounds")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let key_attrs = original_data.get("key_attributes");
        let resource_id = key_attrs
            .and_then(|attrs| attrs.get("resource-id"))
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string());

        let class_name = key_attrs
            .and_then(|attrs| attrs.get("class"))
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string());

        let content_desc = key_attrs
            .and_then(|attrs| attrs.get("content-desc"))
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string());

        let children_texts = original_data
            .get("children_texts")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        // 如果有有效的 XPath，构造 UserSelectionContext
        if !selected_xpath.is_empty() {
            tracing::info!(
                "🔥 [修复验证] 从original_data提取用户选择: xpath={}, content_desc={:?}, text={:?}",
                selected_xpath,
                content_desc,
                element_text
            );

            Some(UserSelectionContext {
                selected_xpath,
                bounds: element_bounds,
                text: element_text,
                resource_id,
                class_name,
                content_desc,
                ancestors: vec![],
                children_texts,
                i18n_variants: None,
                index_path: None,  // 🔥 从 original_data 中没有 index_path，设为 None
            })
        } else {
            tracing::warn!("⚠️ original_data 中 selected_xpath 为空");
            None
        }
    } else {
        tracing::warn!("⚠️ params 中缺少 original_data");
        None
    };

    // 构建增强的分析请求
    let request = IntelligentAnalysisRequest {
        analysis_id: format!(
            "v3_intelligent_raw_{}",
            chrono::Utc::now().timestamp_millis()
        ),
        device_id: device_id.to_string(),
        ui_xml_content: ui_xml.to_string(),
        user_selection,
        // 🔧 修复：直接传递纯净的目标文本，而不是描述性格式
        target_element_hint: if user_intent.target_text.is_empty() {
            None
        } else {
            Some(user_intent.target_text.clone())
        },
        analysis_mode: "step0_to_6_from_raw".to_string(),
        max_candidates: 5,
        min_confidence: 0.6,
    };

    // 调用智能分析服务
    let analysis_result =
        crate::services::intelligent_analysis_service::mock_intelligent_analysis(request).await?;

    // 🔥 【批量模式修复】转换结果为 V3 格式，同时保留原始的 smartSelection 配置
    let steps = super::strategy_generation::convert_analysis_result_to_v3_steps_with_config(
        analysis_result,
        Some(original_params), // ✅ 传入原始参数，保留 smartSelection 和 originalParams
    )?;

    tracing::info!(
        "✅ 增强版前端智能分析完成，转换为 {} 个 V3 步骤",
        steps.len()
    );
    Ok(steps)
}

/// 标准前端智能分析调用
///
/// 使用元素上下文字符串调用前端智能分析系统。
///
/// 参数：
/// - element_context: 元素上下文描述
/// - ui_xml: UI XML内容
/// - device_id: 设备ID
///
/// 返回：
/// - Ok(Vec<StepRefOrInline>): 转换后的V3步骤列表
/// - Err(anyhow::Error): 分析或转换失败
pub async fn call_frontend_intelligent_analysis(
    element_context: &str,
    ui_xml: &str,
    device_id: &str,
) -> Result<Vec<StepRefOrInline>, anyhow::Error> {
    use super::strategy_generation::convert_analysis_result_to_v3_steps;

    tracing::info!("🔗 调用前端智能策略分析系统");

    // 构建分析请求
    let request = IntelligentAnalysisRequest {
        analysis_id: format!("v3_intelligent_{}", chrono::Utc::now().timestamp_millis()),
        device_id: device_id.to_string(),
        ui_xml_content: ui_xml.to_string(),
        user_selection: None,
        target_element_hint: Some(element_context.to_string()),
        analysis_mode: "step0_to_6".to_string(),
        max_candidates: 5,
        min_confidence: 0.6,
    };

    // 调用智能分析服务（目前使用模拟版本，后续集成真实的前端调用）
    let analysis_result =
        crate::services::intelligent_analysis_service::mock_intelligent_analysis(request).await?;

    // 转换结果为 V3 格式
    let steps = convert_analysis_result_to_v3_steps(analysis_result)?;

    tracing::info!("✅ 前端智能分析完成，转换为 {} 个 V3 步骤", steps.len());
    Ok(steps)
}
