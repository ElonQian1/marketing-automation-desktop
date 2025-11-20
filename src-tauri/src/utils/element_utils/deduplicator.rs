// src-tauri/src/utils/element_utils/deduplicator.rs
// module: utils | layer: utilities | role: 元素去重器
// summary: 基于位置+文本的智能去重逻辑

use crate::services::universal_ui_page_analyzer::UIElement;
use crate::utils::element_utils::ElementBounds;
use std::collections::HashSet;
use tracing::{debug, info};

/// 去重候选元素（基于位置容差和文本）
/// 
/// # Arguments
/// * `elements` - 待去重的元素列表
/// * `tolerance` - 位置容差（像素），推荐值: 10
/// 
/// # Returns
/// 去重后的元素列表
/// 
/// # Algorithm
/// 使用Y坐标分桶(bucket) + 文本内容生成去重键：
/// - Y坐标分桶：`y_bucket = center_y / tolerance`
/// - 去重键：`"y{bucket}_t{text}"`
/// - 优势：同一行的相似元素会被去重，避免重复点击
pub fn deduplicate_by_position<T>(
    elements: Vec<T>,
    tolerance: i32,
    get_ui_element: impl Fn(&T) -> &UIElement,
) -> Vec<T> {
    let original_count = elements.len();
    let mut seen = HashSet::new();
    let mut deduplicated = Vec::new();

    for element in elements {
        let ui_elem = get_ui_element(&element);
        let dedupe_key = generate_dedupe_key(ui_elem, tolerance);

        if seen.insert(dedupe_key.clone()) {
            deduplicated.push(element);
        } else {
            debug!("🔄 去重：跳过重复元素 (key: {})", dedupe_key);
        }
    }

    info!(
        "✅ 去重完成：{} → {} 个候选元素",
        original_count,
        deduplicated.len()
    );

    deduplicated
}

/// 生成去重键：基于位置分桶 + 文本
fn generate_dedupe_key(element: &UIElement, tolerance: i32) -> String {
    let bounds = element
        .bounds
        .as_ref()
        .and_then(|b| ElementBounds::from_bounds_string(b));

    if let Some(b) = bounds {
        // 计算中心点Y坐标并按容差分桶
        let center_y = (b.top + b.bottom) / 2;
        let y_bucket = center_y / tolerance;

        // 组合位置和文本作为去重键
        let text_key = element.text.as_deref().unwrap_or("");
        format!("y{}_t{}", y_bucket, text_key)
    } else {
        // 没有边界信息时仅使用文本
        element
            .text
            .clone()
            .unwrap_or_else(|| "no_text".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_dedupe_key() {
        let mut elem = UIElement::default();
        elem.bounds = Some("[100,200][300,400]".to_string());
        elem.text = Some("测试".to_string());

        let key = generate_dedupe_key(&elem, 10);
        // center_y = (200 + 400) / 2 = 300
        // y_bucket = 300 / 10 = 30
        assert_eq!(key, "y30_t测试");
    }

    #[test]
    fn test_deduplicate_same_position() {
        let mut elem1 = UIElement::default();
        elem1.bounds = Some("[100,200][300,400]".to_string());
        elem1.text = Some("测试".to_string());

        let mut elem2 = UIElement::default();
        elem2.bounds = Some("[100,205][300,405]".to_string()); // 稍微偏移，但在容差内
        elem2.text = Some("测试".to_string());

        let elements = vec![elem1, elem2];
        let result = deduplicate_by_position(elements, 10, |e| e);
        
        assert_eq!(result.len(), 1); // 应该去重为1个
    }
}
