// src-tauri/src/automation/matching/text.rs
// module: automation | layer: matching | role: 文本匹配工具
// summary: 提供基于文本、描述的元素查找和匹配功能

use crate::services::universal_ui_page_analyzer::UIElement;

/// 检查元素是否有包含指定文本的子元素
/// 
/// 注意：UIElement 结构体没有 children 字段，但解析时会继承子元素文本
pub fn element_has_child_with_text(
    element: &UIElement,
    child_text: &str
) -> bool {
    // 检查元素自身的文本
    if element.text == child_text {
        return true;
    }
    if element.content_desc == child_text {
        return true;
    }
    
    // 如果元素的 text 包含子元素文本（由 parse_ui_elements 的子文本继承逻辑处理）
    // 我们可以通过检查 text 是否包含目标文本来模糊匹配
    if !element.text.is_empty() {
        if element.text.contains(child_text) {
            return true;
        }
    }
    if !element.content_desc.is_empty() {
        if element.content_desc.contains(child_text) {
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
        e.text == target_text
    }) {
        return Some(element);
    }
    
    // 其次精确匹配content-desc
    if let Some(element) = elements.iter().find(|e| {
        e.content_desc == target_text
    }) {
        return Some(element);
    }
    
    // 再次包含匹配text
    if let Some(element) = elements.iter().find(|e| {
        let text = &e.text; if !text.is_empty() {
            text.contains(target_text)
        } else {
            false
        }
    }) {
        return Some(element);
    }
    
    // 最后包含匹配content-desc
    elements.iter().find(|e| {
        let desc = &e.content_desc; if !desc.is_empty() {
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
        if elem.text == target_text.to_string() {
            candidates.push(elem);
        }
    }
    
    // 如果精确匹配已找到，直接返回
    if !candidates.is_empty() {
        return candidates;
    }
    
    // 其次精确匹配content-desc
    for elem in elements.iter() {
        if elem.content_desc == target_text.to_string() {
            candidates.push(elem);
        }
    }
    
    // 如果精确匹配已找到，直接返回
    if !candidates.is_empty() {
        return candidates;
    }
    
    // 再次包含匹配text
    for elem in elements.iter() {
        let text = &elem.text; if !text.is_empty() {
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
        let desc = &elem.content_desc; if !desc.is_empty() {
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
        return Err(format!("无效的坐标格式: {:?}", parts));
    }
    
    let x1 = start_coords[0].parse::<i32>().map_err(|e| e.to_string())?;
    let y1 = start_coords[1].parse::<i32>().map_err(|e| e.to_string())?;
    let x2 = end_coords[0].parse::<i32>().map_err(|e| e.to_string())?;
    let y2 = end_coords[1].parse::<i32>().map_err(|e| e.to_string())?;
    
    Ok(((x1 + x2) / 2, (y1 + y2) / 2))
}
