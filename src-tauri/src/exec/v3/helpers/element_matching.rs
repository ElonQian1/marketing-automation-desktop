// src-tauri/src/exec/v3/helpers/element_matching.rs
// module: exec/v3/helpers | layer: application | role: 元素匹配和XPath解析
// summary: 负责UI元素查找、XPath解析、坐标计算等基础功能

use crate::services::ui_reader_service::UIElement;
use crate::services::execution::matching::{CandidateElement, TargetFeatures};

/// 从XPath提取resource-id
pub fn extract_resource_id_from_xpath(xpath: &str) -> String {
    if let Some(start) = xpath.find("@resource-id='") {
        let start = start + 14; // "@resource-id='"的长度
        if let Some(end) = xpath[start..].find("'") {
            return xpath[start..start + end].to_string();
        }
    }
    String::new()
}

/// 从XPath提取子元素文本过滤条件
/// 
/// Bug Fix: WRONG_ELEMENT_SELECTION_BUG_REPORT.md
/// 匹配模式: [.//*[@text='文本']] 或 [.//*[@content-desc='文本']]
pub fn extract_child_text_filter_from_xpath(xpath: &str) -> Option<String> {
    // 匹配模式: [.//*[@text='文本']]
    if let Some(start) = xpath.find("[.//*[@text='") {
        let start = start + 13; // "[.//*[@text='"的长度
        if let Some(end) = xpath[start..].find("']]") {
            return Some(xpath[start..start + end].to_string());
        }
    }
    // 匹配模式: [.//*[@content-desc='文本']]
    if let Some(start) = xpath.find("[.//*[@content-desc='") {
        let start = start + 21; // "[.//*[@content-desc='"的长度
        if let Some(end) = xpath[start..].find("']]") {
            return Some(xpath[start..start + end].to_string());
        }
    }
    None
}

/// 检查元素是否有包含指定文本的子元素
/// 
/// Bug Fix: WRONG_ELEMENT_SELECTION_BUG_REPORT.md
/// 注意：UIElement 结构体没有 children 字段，但解析时会继承子元素文本
pub fn element_has_child_with_text(
    element: &UIElement,
    child_text: &str
) -> bool {
    // 检查元素自身的文本
    if element.text.as_ref() == Some(&child_text.to_string()) {
        return true;
    }
    if element.content_desc.as_ref() == Some(&child_text.to_string()) {
        return true;
    }
    
    // 如果元素的 text 包含子元素文本（由 parse_ui_elements 的子文本继承逻辑处理）
    // 我们可以通过检查 text 是否包含目标文本来模糊匹配
    if let Some(ref text) = element.text {
        if text.contains(child_text) {
            return true;
        }
    }
    if let Some(ref desc) = element.content_desc {
        if desc.contains(child_text) {
            return true;
        }
    }
    
    false
}

/// 根据文本或描述查找元素（返回单个最佳匹配）
/// 
/// 匹配优先级：
/// 1. 精确匹配text
/// 2. 精确匹配content-desc
/// 3. 包含匹配text
/// 4. 包含匹配content-desc
pub fn find_element_by_text_or_desc<'a>(
    elements: &'a [UIElement], 
    target_text: &str
) -> Option<&'a UIElement> {
    if target_text.is_empty() {
        return None;
    }
    
    // 优先精确匹配text
    if let Some(element) = elements.iter().find(|e| {
        e.text.as_ref() == Some(&target_text.to_string())
    }) {
        return Some(element);
    }
    
    // 其次精确匹配content-desc
    if let Some(element) = elements.iter().find(|e| {
        e.content_desc.as_ref() == Some(&target_text.to_string())
    }) {
        return Some(element);
    }
    
    // 再次包含匹配text
    if let Some(element) = elements.iter().find(|e| {
        if let Some(text) = &e.text {
            text.contains(target_text)
        } else {
            false
        }
    }) {
        return Some(element);
    }
    
    // 最后包含匹配content-desc
    elements.iter().find(|e| {
        if let Some(desc) = &e.content_desc {
            desc.contains(target_text)
        } else {
            false
        }
    })
}

/// 收集所有匹配的元素（用于多候选评估）
/// 
/// 与find_element_by_text_or_desc不同，此函数返回所有匹配的元素
/// 用于后续的多候选智能评估
pub fn find_all_elements_by_text_or_desc<'a>(
    elements: &'a [UIElement], 
    target_text: &str
) -> Vec<&'a UIElement> {
    if target_text.is_empty() {
        return Vec::new();
    }
    
    let mut candidates = Vec::new();
    
    // 优先精确匹配text
    for elem in elements.iter() {
        if elem.text.as_ref() == Some(&target_text.to_string()) {
            candidates.push(elem);
        }
    }
    
    // 如果精确匹配已找到，直接返回
    if !candidates.is_empty() {
        return candidates;
    }
    
    // 其次精确匹配content-desc
    for elem in elements.iter() {
        if elem.content_desc.as_ref() == Some(&target_text.to_string()) {
            candidates.push(elem);
        }
    }
    
    // 如果精确匹配已找到，直接返回
    if !candidates.is_empty() {
        return candidates;
    }
    
    // 再次包含匹配text
    for elem in elements.iter() {
        if let Some(text) = &elem.text {
            if text.contains(target_text) {
                candidates.push(elem);
            }
        }
    }
    
    // 如果包含匹配已找到，直接返回
    if !candidates.is_empty() {
        return candidates;
    }
    
    // 最后包含匹配content-desc
    for elem in elements.iter() {
        if let Some(desc) = &elem.content_desc {
            if desc.contains(target_text) {
                candidates.push(elem);
            }
        }
    }
    
    candidates
}

/// 解析bounds字符串并计算中心点坐标
/// 
/// bounds格式: "[left,top][right,bottom]"
/// 返回: (center_x, center_y)
pub fn parse_bounds_center(bounds: &str) -> Result<(i32, i32), String> {
    let bounds = bounds.trim_start_matches('[').trim_end_matches(']');
    let parts: Vec<&str> = bounds.split("][").collect();
    
    if parts.len() != 2 {
        return Err(format!("无效的bounds格式: {}", bounds));
    }
    
    let start_coords: Vec<&str> = parts[0].split(',').collect();
    let end_coords: Vec<&str> = parts[1].split(',').collect();
    
    if start_coords.len() != 2 || end_coords.len() != 2 {
        return Err(format!("无效的坐标格式: {}", bounds));
    }
    
    let left: i32 = start_coords[0].parse().map_err(|_| "无法解析left坐标")?;
    let top: i32 = start_coords[1].parse().map_err(|_| "无法解析top坐标")?;
    let right: i32 = end_coords[0].parse().map_err(|_| "无法解析right坐标")?;
    let bottom: i32 = end_coords[1].parse().map_err(|_| "无法解析bottom坐标")?;
    
    let center_x = (left + right) / 2;
    let center_y = (top + bottom) / 2;
    
    Ok((center_x, center_y))
}

/// 将UIElement转换为CandidateElement（用于多候选评估）
pub fn convert_uielement_to_candidate(
    elem: &UIElement,
    index: usize,
) -> CandidateElement {
    CandidateElement {
        bounds: elem.bounds.clone(),
        text: elem.text.clone(),
        content_desc: elem.content_desc.clone(),
        resource_id: elem.resource_id.clone(),
        clickable: elem.clickable.unwrap_or(false),
        class_name: elem.class.clone(),  // UIElement使用class字段
        index: Some(index),
    }
}

/// 从步骤参数中提取目标特征（用于多候选评估）
/// 
/// 提取优先级：
/// 1. smartSelection中的字段
/// 2. 顶层参数字段
/// 3. original_data中的字段
pub fn extract_target_features_from_params(
    params: &serde_json::Value
) -> TargetFeatures {
    // 提取目标文本
    let expected_text = params.get("smartSelection")
        .and_then(|v| v.get("targetText"))
        .and_then(|v| v.as_str())
        .or_else(|| params.get("targetText").and_then(|v| v.as_str()))
        .or_else(|| {
            params.get("original_data")
                .and_then(|od| od.get("element_text"))
                .and_then(|v| v.as_str())
        })
        .map(|s| s.to_string());
    
    // 提取目标content-desc
    let expected_content_desc = params.get("smartSelection")
        .and_then(|v| v.get("contentDesc"))
        .and_then(|v| v.as_str())
        .or_else(|| params.get("contentDesc").and_then(|v| v.as_str()))
        .or_else(|| {
            params.get("original_data")
                .and_then(|od| od.get("content_desc"))
                .and_then(|v| v.as_str())
        })
        .map(|s| s.to_string());
    
    // 提取resource-id
    let expected_resource_id = params.get("original_data")
        .and_then(|od| od.get("resource_id"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    
    // 🔥 关键：提取期望位置（用户点击的坐标）
    let expected_position = params.get("original_data")
        .and_then(|od| od.get("click_position"))
        .and_then(|pos| {
            let x = pos.get("x")?.as_i64()?;
            let y = pos.get("y")?.as_i64()?;
            Some((x as i32, y as i32))
        })
        .or_else(|| {
            // 回退：从bounds计算中心点
            params.get("original_data")
                .and_then(|od| od.get("bounds"))
                .and_then(|v| v.as_str())
                .and_then(|bounds_str| {
                    parse_bounds_center(bounds_str).ok()
                })
        });
    
    TargetFeatures {
        expected_text,
        expected_content_desc,
        expected_resource_id,
        expected_position,
    }
}
