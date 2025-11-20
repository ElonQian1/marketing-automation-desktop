// src-tauri/src/utils/element_exclusion.rs
// module: utils | layer: infrastructure | role: 元素排除过滤器
// summary: 智能排除不需要的UI元素（负面积、已处理状态等）

use crate::services::universal_ui_page_analyzer::UIElement;
use crate::types::smart_selection::SmartSelectionProtocol;
// ✅ 改用V3的BoundsRect
use crate::exec::v3::element_matching::bounds_matcher::BoundsRect;
use tracing::{debug, info};

/// 元素排除过滤器
pub struct ElementExclusionFilter;

impl ElementExclusionFilter {
    /// 内置自动排除别名库（已处理状态按钮）
    const AUTO_EXCLUDE_ALIASES: &'static [&'static str] = &[
        "已关注",
        "Following",
        "Followed",
        "互相关注",
        "Mutual",
        "Follow Back",
        "已互关",
        "已赞",
        "Liked",
        "已收藏",
        "Favorited",
        "已分享",
        "Shared",
        "已完成",
        "Completed",
        "已处理",
        "Processed",
    ];

    /// 判断元素是否应该被排除
    /// 
    /// 排除规则：
    /// 1. 负面积元素（width≤0 或 height≤0）
    /// 2. 自动排除：内置别名库（如"已关注"）
    /// 3. 手动排除：用户自定义的排除规则
    /// 
    /// 智能保护：
    /// - 如果目标文本就是"已关注"，则不会排除"已关注"按钮
    pub fn should_exclude(element: &UIElement, protocol: &SmartSelectionProtocol) -> bool {
        // 规则1: 排除负面积元素
        if Self::has_invalid_bounds(element) {
            return true;
        }

        // 获取目标文本（用户选择的按钮文本）
        let target_text = protocol
            .anchor
            .fingerprint
            .text_content
            .as_deref()
            .unwrap_or("");

        // 规则2: 自动排除（可配置开关）
        let auto_exclude_enabled = protocol
            .matching_context
            .as_ref()
            .and_then(|ctx| ctx.light_assertions.as_ref())
            .and_then(|assertions| assertions.auto_exclude_enabled)
            .unwrap_or(true); // 默认开启

        if auto_exclude_enabled && Self::matches_auto_exclude_aliases(element, target_text) {
            return true;
        }

        // 规则3: 手动排除
        let exclude_patterns = protocol
            .matching_context
            .as_ref()
            .and_then(|ctx| ctx.light_assertions.as_ref())
            .and_then(|assertions| assertions.exclude_text.as_ref());

        if let Some(patterns) = exclude_patterns {
            if Self::matches_manual_exclude_patterns(element, patterns) {
                return true;
            }
        }

        false
    }

    /// 检查元素是否有无效边界（负面积）
    fn has_invalid_bounds(element: &UIElement) -> bool {
        let bounds = &element.bounds;
        let width = bounds.width();
        let height = bounds.height();
        if width <= 0 || height <= 0 {
            info!(
                "🚨 [异常边界排除] 负面积元素: bounds='{}', parsed=[{},{},{},{}], width={}, height={}, class='{}', text='{}'",
                bounds,
                bounds.left,
                bounds.top,
                bounds.right,
                bounds.bottom,
                width,
                height,
                element.class_name.as_deref().unwrap_or("N/A"),
                &element.text
            );
            return true;
        }
        false
    }

    /// 检查是否匹配自动排除别名
    fn matches_auto_exclude_aliases(element: &UIElement, target_text: &str) -> bool {
        // 检查text
        let element_text = &element.text; if !element_text.is_empty() {
            for alias in Self::AUTO_EXCLUDE_ALIASES {
                if element_text.contains(alias) {
                    // 智能保护：如果目标文本包含该别名，说明用户就是要找这类按钮
                    if target_text.contains(alias) {
                        debug!(
                            "🎯 保留目标按钮：文本 '{}' 匹配目标 '{}' 的别名 '{}'",
                            element_text, target_text, alias
                        );
                        continue;
                    }

                    debug!(
                        "🤖 自动排除：文本 '{}' 匹配内置别名 '{}' (目标: '{}')",
                        element_text, alias, target_text
                    );
                    return true;
                }
            }
        }

        // 检查content_desc
        let desc = &element.content_desc; if !desc.is_empty() {
            for alias in Self::AUTO_EXCLUDE_ALIASES {
                if desc.contains(alias) {
                    if target_text.contains(alias) {
                        debug!(
                            "🎯 保留目标按钮：描述 '{}' 匹配目标 '{}' 的别名 '{}'",
                            desc, target_text, alias
                        );
                        continue;
                    }

                    debug!(
                        "🤖 自动排除：描述 '{}' 匹配内置别名 '{}' (目标: '{}')",
                        desc, alias, target_text
                    );
                    return true;
                }
            }
        }

        false
    }

    /// 检查是否匹配手动排除规则
    fn matches_manual_exclude_patterns(element: &UIElement, patterns: &[String]) -> bool {
        // 检查text
        let element_text = &element.text; if !element_text.is_empty() {
            for pattern in patterns {
                if element_text.contains(pattern) {
                    debug!(
                        "🚫 手动排除：文本 '{}' 匹配规则 '{}'",
                        element_text, pattern
                    );
                    return true;
                }
            }
        }

        // 检查content_desc
        let desc = &element.content_desc; if !desc.is_empty() {
            for pattern in patterns {
                if desc.contains(pattern) {
                    debug!("🚫 手动排除：描述 '{}' 匹配规则 '{}'", desc, pattern);
                    return true;
                }
            }
        }

        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::smart_selection::*;
    use crate::services::universal_ui_page_analyzer::{UIElement, UIElementType};
    use crate::types::page_analysis::ElementBounds;

    fn create_test_element(bounds_str: Option<&str>, text: Option<&str>) -> UIElement {
        let bounds = if let Some(s) = bounds_str {
            let parts: Vec<&str> = s.split("][").collect();
            let left_top = parts[0].trim_start_matches('[');
            let right_bottom = parts[1].trim_end_matches(']');
            let lt_parts: Vec<i32> = left_top.split(',').map(|s| s.parse().unwrap()).collect();
            let rb_parts: Vec<i32> = right_bottom.split(',').map(|s| s.parse().unwrap()).collect();
            ElementBounds {
                left: lt_parts[0],
                top: lt_parts[1],
                right: rb_parts[0],
                bottom: rb_parts[1],
            }
        } else {
            ElementBounds { left: 0, top: 0, right: 0, bottom: 0 }
        };

        UIElement {
            id: "".to_string(),
            element_type: UIElementType::Other,
            text: text.unwrap_or("").to_string(),
            bounds,
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
    fn test_invalid_bounds() {
        let element = create_test_element(Some("[100,200][50,100]"), None); // 负面积

        assert!(ElementExclusionFilter::has_invalid_bounds(&element));
    }

    #[test]
    fn test_auto_exclude() {
        let element = create_test_element(None, Some("已关注"));

        // 目标不是"已关注"，应该排除
        assert!(ElementExclusionFilter::matches_auto_exclude_aliases(
            &element,
            "关注"
        ));

        // 目标就是"已关注"，不应该排除
        assert!(!ElementExclusionFilter::matches_auto_exclude_aliases(
            &element,
            "已关注"
        ));
    }
}

