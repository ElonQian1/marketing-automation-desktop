// src-tauri/src/utils/element_deduplicator.rs
// module: utils | layer: infrastructure | role: 元素去重器
// summary: 基于位置和文本对UI元素进行智能去重

use crate::services::universal_ui_page_analyzer::UIElement;
// ✅ 改用V3的BoundsRect
use crate::exec::v3::element_matching::bounds_matcher::BoundsRect;
use std::collections::HashSet;
use tracing::{debug, info};

/// 元素去重器
pub struct ElementDeduplicator;

impl ElementDeduplicator {
    /// 对候选元素进行去重
    /// 
    /// 去重策略：
    /// - 基于Y坐标分桶（容差范围内认为是同一行）
    /// - 相同Y桶内，文本相同的元素认为重复
    /// 
    /// # Arguments
    /// * `elements` - 待去重的元素列表
    /// * `tolerance` - Y坐标容差（像素），默认10px
    /// 
    /// # Returns
    /// 去重后的元素列表
    pub fn deduplicate<T>(elements: Vec<T>, tolerance: i32) -> Vec<T>
    where
        T: HasElement,
    {
        let original_count = elements.len();
        let mut seen = HashSet::new();
        let mut deduplicated = Vec::new();

        for element in elements {
            let dedupe_key = Self::generate_dedupe_key(element.element(), tolerance);

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
        let b = &element.bounds;
        
        // 计算中心点Y坐标并按容差分桶
        let center_y = (b.top + b.bottom) as f32 / 2.0;
        let y_bucket = (center_y / tolerance as f32).floor() as i32;

        // 组合位置和文本作为去重键
        let text_key = &element.text;
        format!("y{}_t{}", y_bucket, text_key)
    }
}

/// 可提供UIElement的trait
pub trait HasElement {
    fn element(&self) -> &UIElement;
}

// 为UIElement自身实现trait
impl HasElement for UIElement {
    fn element(&self) -> &UIElement {
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deduplicate() {
        // 创建测试元素
        let elem1 = UIElement {
            bounds: Some("[0,100][100,200]".to_string()),
            text: Some("按钮".to_string()),
            ..Default::default()
        };
        
        let elem2 = UIElement {
            bounds: Some("[0,105][100,205]".to_string()), // Y坐标在10px容差内
            text: Some("按钮".to_string()),
            ..Default::default()
        };
        
        let elem3 = UIElement {
            bounds: Some("[0,300][100,400]".to_string()), // 不同位置
            text: Some("按钮".to_string()),
            ..Default::default()
        };

        let elements = vec![elem1, elem2, elem3];
        let result = ElementDeduplicator::deduplicate(elements, 10);
        
        // elem1和elem2应该被去重，只保留elem1和elem3
        assert_eq!(result.len(), 2);
    }
}
