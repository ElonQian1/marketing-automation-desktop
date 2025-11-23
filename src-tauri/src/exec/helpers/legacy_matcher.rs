// src-tauri/src/exec/helpers/legacy_matcher.rs
// module: exec | layer: helpers | role: 传统匹配器
// summary: 处理基于 XPath 和 Text 的传统元素匹配流程

use serde_json::Value;
use crate::services::universal_ui_page_analyzer::UIElement;
use crate::automation::matching::strategy::{collect_candidate_elements, evaluate_best_candidate};
use crate::automation::matching::text::parse_bounds_center as helper_parse_bounds;

/// 尝试执行传统匹配流程
/// 
/// 1. 解析 UI 元素
/// 2. 收集候选元素
/// 3. 评估最佳候选
/// 4. 返回坐标
pub fn try_legacy_matching_flow(
    ui_xml: &str,
    merged_params: &Value,
    step_id: &str,
) -> Result<(i32, i32), String> {
    // 1. 提取必要参数
    let selected_xpath = merged_params
        .get("original_data")
        .and_then(|od| od.get("selected_xpath"))
        .and_then(|v| v.as_str());

    let xpath: &str = selected_xpath
        .or_else(|| merged_params.get("xpath").and_then(|v| v.as_str()))
        .ok_or_else(|| format!("智能分析步骤 {} 缺少xpath参数", step_id))?;

    // 🔥 P0修复: 正确提取 targetText（支持多层嵌套）
    let target_text = extract_target_text_from_params(merged_params);

    let confidence = merged_params
        .get("confidence")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.8);

    let strategy_type = merged_params
        .get("strategy_type")
        .and_then(|v| v.as_str())
        .unwrap_or("智能策略");

    let xpath_source = if selected_xpath.is_some() {
        "静态分析精确XPath"
    } else {
        "智能分析生成XPath"
    };

    tracing::info!(
        "🧠 [智能执行] 进入传统匹配流程: xpath={} (来源:{}), target='{}', confidence={:.3}, strategy={}",
        xpath, xpath_source, target_text, confidence, strategy_type
    );

    // 2. 解析UI元素
    let elements = crate::services::universal_ui_page_analyzer::parse_ui_elements_simple(ui_xml)
        .map_err(|e| format!("解析UI XML失败: {}", e))?;

    // 3. 提取 original_bounds（用于候选预过滤）
    let original_bounds = merged_params.get("original_data")
        .and_then(|od| od.get("element_bounds"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    // 4. 收集候选元素
    let candidate_elements = collect_candidate_elements(
        &elements, 
        strategy_type, 
        xpath, 
        &target_text, 
        original_bounds.as_deref(),
        merged_params
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
    
    // 5. 评估最佳候选
    // 提取匹配方向
    let match_direction = merged_params
        .get("match_direction")
        .and_then(|v| v.as_str());

    let target_element_option = evaluate_best_candidate(
        candidate_elements,
        merged_params,
        ui_xml,
        match_direction,
    )?;
    
    let target_element = target_element_option
        .ok_or_else(|| format!(
            "无法找到匹配的元素 (策略: {}, 目标: '{}', XPath: {})",
            strategy_type, target_text, xpath
        ))?;

    // 6. 解析坐标
    helper_parse_bounds(&target_element.bounds.to_string())
}

/// 从参数中提取目标文本
fn extract_target_text_from_params(params: &Value) -> String {
    params.get("original_data")
        .and_then(|od| od.get("element_text"))
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .or_else(|| {
            params.get("smartSelection")
                .and_then(|v| v.get("targetText"))
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
        })
        .or_else(|| {
            params.get("target_text").and_then(|v| v.as_str())
        })
        .unwrap_or("")
        .to_string()
}
