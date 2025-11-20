// src-tauri/src/matchers/business_filter.rs
// module: matchers | layer: application | role: 业务规则过滤器
// summary: 针对小红书等业务场景的智能过滤（如过滤"已关注"按钮）

use crate::services::universal_ui_page_analyzer::UIElement;
use tracing::debug;

/// 业务规则过滤器
pub struct BusinessFilter;

impl BusinessFilter {
    /// 内置业务规则别名
    const FOLLOWED_ALIASES: &'static [&'static str] = &[
        "已关注",
        "Following",
        "Followed",
        "互相关注",
        "Mutual",
        "Follow Back",
        "已互关",
    ];

    const LIKED_ALIASES: &'static [&'static str] = &[
        "已赞",
        "Liked",
        "已收藏",
        "Favorited",
    ];

    /// 过滤批量操作中已处理的元素
    /// 
    /// 使用场景：批量关注时，过滤掉"已关注"按钮
    /// 
    /// # Arguments
    /// * `elements` - 待过滤的元素列表
    /// * `target_text` - 目标文本（用户选择的按钮文本）
    /// 
    /// # Returns
    /// 过滤后的元素列表
    pub fn filter_processed_elements<T>(elements: Vec<T>, target_text: &str) -> Vec<T>
    where
        T: HasElement + Clone,
    {
        let original_count = elements.len();
        
        // 判断是什么类型的批量操作
        let is_follow_operation = Self::is_follow_operation(target_text);
        let is_like_operation = Self::is_like_operation(target_text);

        let filtered: Vec<T> = elements
            .into_iter()
            .filter(|elem| {
                let element = elem.element();

                // 关注操作：过滤"已关注"
                if is_follow_operation {
                    if Self::is_followed_button(element) {
                        debug!("  跳过已关注按钮: text={:?}, desc={:?}", 
                            element.text, element.content_desc);
                        return false;
                    }
                }

                // 点赞操作：过滤"已赞"
                if is_like_operation {
                    if Self::is_liked_button(element) {
                        debug!("  跳过已赞按钮: text={:?}, desc={:?}", 
                            element.text, element.content_desc);
                        return false;
                    }
                }

                true
            })
            .collect();

        debug!(
            "✅ 业务过滤完成：{} → {} 个有效候选",
            original_count,
            filtered.len()
        );

        filtered
    }

    /// 判断是否为关注类操作
    fn is_follow_operation(target_text: &str) -> bool {
        target_text.contains("关注") && !target_text.contains("已关注")
            || target_text.eq_ignore_ascii_case("follow")
    }

    /// 判断是否为点赞类操作
    fn is_like_operation(target_text: &str) -> bool {
        target_text.contains("赞") && !target_text.contains("已赞")
            || target_text.eq_ignore_ascii_case("like")
    }

    /// 检查是否为"已关注"按钮
    fn is_followed_button(element: &UIElement) -> bool {
        // 检查text
        let text = &element.text; if !text.is_empty() {
            for alias in Self::FOLLOWED_ALIASES {
                if text.contains(alias) {
                    return true;
                }
            }
        }

        // 检查content-desc
        let desc = &element.content_desc; if !desc.is_empty() {
            for alias in Self::FOLLOWED_ALIASES {
                if desc.contains(alias) {
                    return true;
                }
            }
        }

        false
    }

    /// 检查是否为"已赞"按钮
    fn is_liked_button(element: &UIElement) -> bool {
        // 检查text
        let text = &element.text; if !text.is_empty() {
            for alias in Self::LIKED_ALIASES {
                if text.contains(alias) {
                    return true;
                }
            }
        }

        // 检查content-desc
        let desc = &element.content_desc; if !desc.is_empty() {
            for alias in Self::LIKED_ALIASES {
                if desc.contains(alias) {
                    return true;
                }
            }
        }

        false
    }
}

/// 可提供UIElement的trait
pub trait HasElement {
    fn element(&self) -> &UIElement;
}

impl HasElement for UIElement {
    fn element(&self) -> &UIElement {
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::universal_ui_page_analyzer::{UIElement, UIElementType};
    use crate::types::page_analysis::ElementBounds;

    fn create_test_element(text: &str) -> UIElement {
        UIElement {
            id: "".to_string(),
            element_type: UIElementType::Other,
            text: text.to_string(),
            bounds: ElementBounds { left: 0, top: 0, right: 0, bottom: 0 },
            xpath: "".to_string(),
            resource_id: None,
            package_name: None,
            class_name: None,
            clickable: false,
            scrollable: false,
            enabled: true,
            focused: false,
            checkable: false,
            checked: false,
            selected: false,
            password: false,
            content_desc: "".to_string(),
            index_path: None,
            region: None,
            children: vec![],
            parent: None,
            depth: 0,
        }
    }

    #[test]
    fn test_filter_followed_buttons() {
        let elements = vec![
            create_test_element("关注"),
            create_test_element("已关注"),
            create_test_element("关注"),
        ];

        let filtered = BusinessFilter::filter_processed_elements(elements, "关注");
        
        // 应该过滤掉1个"已关注"，保留2个"关注"
        assert_eq!(filtered.len(), 2);
        assert_eq!(filtered[0].text, "关注");
        assert_eq!(filtered[1].text, "关注");
    }
}

