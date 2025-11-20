// src-tauri/src/utils/element_utils/exclusion_filter.rs
// module: utils | layer: utilities | role: 元素排除过滤器
// summary: 检测并排除无效元素（负面积、排除层等）

use crate::services::universal_ui_page_analyzer::UIElement;
use crate::types::smart_selection::SmartSelectionProtocol;
use crate::utils::element_utils::ElementBounds;
use tracing::debug;

/// 自动排除别名列表（通用业务规则）
const AUTO_EXCLUDE_ALIASES: &[&str] = &[
    "已关注",
    "Following",
    "已赞",
    "Liked",
];

/// 检查元素是否应该被排除
/// 
/// 排除条件：
/// 1. 负面积元素（width ≤ 0 or height ≤ 0）
/// 2. 自动排除别名匹配（但保留用户明确选择的目标）
/// 3. 手动排除规则匹配
/// 
/// # Arguments
/// * `element` - 待检查的UI元素
/// * `protocol` - 选择协议（可选，用于排除规则）
/// 
/// # Returns
/// `true` - 应该排除，`false` - 应该保留
pub fn should_exclude_element(
    element: &UIElement,
    protocol: Option<&SmartSelectionProtocol>,
) -> bool {
    // 1. 检查负面积（无效边界）
    if let Some(bounds_str) = &element.bounds {
        if let Some(bounds) = ElementBounds::from_bounds_string(bounds_str) {
            if !bounds.is_valid() {
                debug!(
                    "🚫 排除负面积元素: bounds='{}', width={}, height={}",
                    bounds_str,
                    bounds.width(),
                    bounds.height()
                );
                return true;
            }
        }
    }

    // 如果没有协议，只检查负面积
    let Some(protocol) = protocol else {
        return false;
    };

    // 2. 检查自动排除别名（但保留用户明确选择的目标）
    let target_text = protocol
        .anchor
        .fingerprint
        .text_content
        .as_deref()
        .unwrap_or("");

    // 检查文本
    if let Some(element_text) = &element.text {
        for alias in AUTO_EXCLUDE_ALIASES {
            if element_text.contains(alias) {
                // 关键修复：如果目标文本包含这个别名，说明用户就是要找这类按钮
                if target_text.contains(alias) {
                    debug!(
                        "🎯 保留目标按钮：文本 '{}' 匹配目标 '{}' 的别名 '{}'",
                        element_text, target_text, alias
                    );
                    continue; // 不排除
                }

                debug!(
                    "🤖 自动排除：文本 '{}' 匹配内置别名 '{}' (目标: '{}')",
                    element_text, alias, target_text
                );
                return true;
            }
        }
    }

    // 检查content-desc
    if let Some(desc) = &element.content_desc {
        for alias in AUTO_EXCLUDE_ALIASES {
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

    // 3. 检查手动排除规则
    let exclude_patterns = protocol
        .matching_context
        .as_ref()
        .and_then(|ctx| ctx.light_assertions.as_ref())
        .and_then(|assertions| assertions.exclude_text.as_ref());

    if let Some(patterns) = exclude_patterns {
        // 检查text属性
        if let Some(element_text) = &element.text {
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

        // 检查content-desc
        if let Some(desc) = &element.content_desc {
            for pattern in patterns {
                if desc.contains(pattern) {
                    debug!("🚫 手动排除：描述 '{}' 匹配规则 '{}'", desc, pattern);
                    return true;
                }
            }
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_negative_area_exclusion() {
        let mut elem = UIElement::default();
        elem.bounds = Some("[100,200][50,400]".to_string()); // 负宽度

        assert!(should_exclude_element(&elem, None));
    }

    #[test]
    fn test_auto_exclude_followed() {
        let mut elem = UIElement::default();
        elem.text = Some("已关注".to_string());

        // 没有目标文本时应该排除
        assert!(should_exclude_element(&elem, None));
    }

    #[test]
    fn test_preserve_target_button() {
        let mut elem = UIElement::default();
        elem.text = Some("已关注".to_string());

        // 模拟用户明确选择"已关注"按钮
        let mut protocol = SmartSelectionProtocol::default();
        protocol.anchor.fingerprint.text_content = Some("已关注".to_string());

        // 应该保留（用户明确要找这个）
        assert!(!should_exclude_element(&elem, Some(&protocol)));
    }
}
