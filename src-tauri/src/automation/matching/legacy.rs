// src-tauri/src/automation/matching/legacy.rs
// module: automation | layer: matching | role: 传统匹配器
// summary: 处理基于 XPath 和 Text 的传统元素匹配流程

use serde_json::Value;
use crate::automation::matching::strategy::{collect_candidate_elements, evaluate_best_candidate};
use crate::automation::matching::recovery::attempt_element_recovery;
use crate::automation::matching::utils::{ensure_clickable_element, calculate_center};

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

    let mut target_element_option = evaluate_best_candidate(
        candidate_elements,
        merged_params,
        ui_xml,
        match_direction,
    )?;
    
    // 🆕 修复：失败恢复机制
    if target_element_option.is_none() {
        target_element_option = attempt_element_recovery(merged_params, &elements)?;
    }
    
    // 最终检查：如果仍然没有找到元素，报告失败
    let target_element = target_element_option.ok_or_else(|| {
        format!(
            "未找到匹配的元素，strategy={}, target_text={}, xpath={}\n\
            已尝试：1) 真机XML匹配 2) 原始XML重新分析 3) 相似元素搜索\n\
            所有恢复策略均失败",
            strategy_type, target_text, xpath
        )
    })?;
    
    // 🔧 检查元素可点击性
    let clickable_element = ensure_clickable_element(target_element);

    // 计算中心点
    let (x, y) = calculate_center(clickable_element);
    
    Ok((x, y))
}

/// 尝试执行批量匹配流程
pub async fn try_batch_matching_flow(
    device_id: &str,
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

    let target_text = extract_target_text_from_params(merged_params);
    let strategy_type = merged_params
        .get("strategy_type")
        .and_then(|v| v.as_str())
        .unwrap_or("智能策略");

    // 2. 解析UI元素
    let elements = crate::services::universal_ui_page_analyzer::parse_ui_elements_simple(ui_xml)
        .map_err(|e| format!("解析UI XML失败: {}", e))?;

    // 3. 提取 original_bounds
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
    
    if candidate_elements.is_empty() {
        return Err(format!("批量模式未找到任何匹配元素: xpath={}", xpath));
    }

    // 5. 执行批量操作
    use crate::automation::pipeline::batch::execute_batch_mode;
    execute_batch_mode(device_id, candidate_elements, merged_params, step_id).await
        .map_err(|e| e.to_string())
}

/// 提取目标文本（支持多层嵌套）
fn extract_target_text_from_params(params: &Value) -> String {
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
