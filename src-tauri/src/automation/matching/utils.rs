// src-tauri/src/automation/matching/utils.rs
// module: automation | layer: matching | role: 匹配工具函数
// summary: 提供元素检查、坐标计算等辅助功能

use crate::services::universal_ui_page_analyzer::UIElement;

/// 确保元素可点击
/// 
/// 如果当前元素不可点击，尝试向上查找可点击的父元素
pub fn ensure_clickable_element(element: &UIElement) -> &UIElement {
    // TODO: 实现向上查找逻辑
    // 目前直接返回原元素
    if !element.clickable {
        tracing::debug!("⚠️ [Utils] 目标元素不可点击，建议向上查找父元素 (未实现)");
    }
    element
}

/// 计算元素中心点
pub fn calculate_center(element: &UIElement) -> (i32, i32) {
    let bounds = &element.bounds;
    let x = bounds.left + (bounds.right - bounds.left) / 2;
    let y = bounds.top + (bounds.bottom - bounds.top) / 2;
    (x, y)
}
