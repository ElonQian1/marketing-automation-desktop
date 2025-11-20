// src-tauri/src/matchers/three_tier_matcher.rs
// module: matchers | layer: application | role: 三层精确匹配器
// summary: 实现text → content-desc → resource-id三层精确匹配，防止误匹配

use crate::services::universal_ui_page_analyzer::UIElement;
use crate::types::smart_selection::ElementFingerprint;
use tracing::debug;

/// 三层精确匹配结果
#[derive(Debug, Clone)]
pub struct MatchResult<T> {
    pub element: T,
    pub match_type: MatchType,
    pub confidence: f32,
}

/// 匹配类型
#[derive(Debug, Clone, PartialEq)]
pub enum MatchType {
    /// 精确文本匹配
    ExactText,
    /// 精确描述匹配
    ExactContentDesc,
    /// 精确resource-id匹配
    ExactResourceId,
    /// 模糊相似度匹配
    FuzzySimilarity,
    /// 无匹配
    None,
}

/// 三层精确匹配器
pub struct ThreeTierMatcher;

impl ThreeTierMatcher {
    /// 在候选元素中查找最佳匹配
    /// 
    /// 匹配优先级：
    /// 1. 精确text匹配 (confidence=1.0)
    /// 2. 精确content-desc匹配 (confidence=0.95)
    /// 3. 精确resource-id匹配 (confidence=0.90)
    /// 4. 模糊相似度匹配 (confidence=计算值)
    /// 
    /// # Arguments
    /// * `candidates` - 候选元素列表
    /// * `target_fingerprint` - 目标元素指纹
    /// * `min_confidence` - 最低置信度阈值
    /// * `similarity_fn` - 相似度计算函数
    pub fn find_best_match<T, F>(
        candidates: &[T],
        target_fingerprint: &ElementFingerprint,
        min_confidence: f32,
        similarity_fn: F,
    ) -> Option<MatchResult<T>>
    where
        T: HasElement + Clone,
        F: Fn(&UIElement, &ElementFingerprint) -> f32,
    {
        // 第一层：精确文本匹配
        if let Some(target_text) = &target_fingerprint.text_content {
            for candidate in candidates {
                let candidate_text = &candidate.element().text; if !candidate_text.is_empty() {
                    if candidate_text.trim() == target_text.trim() {
                        debug!(
                            "🎯 精确文本匹配成功: \"{}\" (跳过所有模糊匹配)",
                            target_text
                        );
                        return Some(MatchResult {
                            element: candidate.clone(),
                            match_type: MatchType::ExactText,
                            confidence: 1.0,
                        });
                    }
                }
            }
        }

        // 第二层：精确content-desc匹配
        if let Some(target_desc) = &target_fingerprint.content_desc {
            for candidate in candidates {
                // 2. 描述匹配
                let candidate_desc = &candidate.element().content_desc;
                if !candidate_desc.is_empty() {
                    if candidate_desc.trim() == target_desc.trim() {
                        debug!(
                            "🎯 精确content-desc匹配成功: \"{}\" (跳过所有模糊匹配)",
                            target_desc
                        );
                        return Some(MatchResult {
                            element: candidate.clone(),
                            match_type: MatchType::ExactContentDesc,
                            confidence: 0.95,
                        });
                    }
                }
            }
        }

        // 第三层：精确resource-id匹配
        if let Some(target_resource_id) = &target_fingerprint.resource_id {
            for candidate in candidates {
                if let Some(candidate_resource_id) = &candidate.element().resource_id {
                    if candidate_resource_id == target_resource_id {
                        debug!(
                            "🎯 精确resource-id匹配成功: \"{}\" (跳过所有模糊匹配)",
                            target_resource_id
                        );
                        return Some(MatchResult {
                            element: candidate.clone(),
                            match_type: MatchType::ExactResourceId,
                            confidence: 0.90,
                        });
                    }
                }
            }
        }

        debug!(
            "⚠️ 未找到任何精确匹配，继续模糊匹配 (text: {:?}, desc: {:?}, resource_id: {:?})",
            target_fingerprint.text_content,
            target_fingerprint.content_desc,
            target_fingerprint.resource_id
        );

        // 第四层：模糊相似度匹配
        let mut best_match: Option<MatchResult<T>> = None;
        let mut best_similarity = 0.0f32;

        for candidate in candidates {
            let similarity = similarity_fn(candidate.element(), target_fingerprint);

            debug!(
                "  候选相似度: {:.2}, 文本: {:?}",
                similarity,
                candidate.element().text
            );

            if similarity > best_similarity {
                best_similarity = similarity;
                best_match = Some(MatchResult {
                    element: candidate.clone(),
                    match_type: MatchType::FuzzySimilarity,
                    confidence: similarity,
                });
            }
        }

        if best_similarity >= min_confidence {
            debug!(
                "✅ 找到高置信度匹配: {:.2} ≥ {:.2}",
                best_similarity, min_confidence
            );
            best_match
        } else {
            debug!(
                "⚠️ 最佳相似度 {:.2} < 最小要求 {:.2}",
                best_similarity, min_confidence
            );
            None
        }
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
    use crate::types::page_analysis::ElementBounds;
    use crate::services::universal_ui_page_analyzer::{UIElement, UIElementType};

    fn create_test_element(text: Option<&str>) -> UIElement {
        UIElement {
            id: uuid::Uuid::new_v4().to_string(),
            element_type: UIElementType::TextView,
            text: text.map(|s| s.to_string()).unwrap_or_default(),
            resource_id: None,
            content_desc: String::new(),
            class_name: Some("android.widget.TextView".to_string()),
            package_name: Some("com.example".to_string()),
            bounds: ElementBounds {
                left: 0,
                top: 0,
                right: 100,
                bottom: 100,
            },
            xpath: "//node".to_string(),
            clickable: false,
            checked: false,
            enabled: true,
            focused: false,
            checkable: false,
            scrollable: false,
            password: false,
            selected: false,
            index_path: None,
            region: None,
            children: vec![],
            parent: None,
            depth: 0,
        }
    }

    fn create_test_fingerprint(text: Option<&str>) -> ElementFingerprint {
        ElementFingerprint {
            text_content: text.map(|s| s.to_string()),
            text_hash: None,
            class_chain: None,
            resource_id: None,
            resource_id_suffix: None,
            bounds_signature: None,
            parent_class: None,
            sibling_count: None,
            child_count: None,
            depth_level: None,
            relative_index: None,
            clickable: None,
            enabled: None,
            selected: None,
            content_desc: None,
            package_name: None,
        }
    }

    #[test]
    fn test_exact_text_match() {
        let candidates = vec![
            create_test_element(Some("关注")),
            create_test_element(Some("已关注")),
        ];

        let fingerprint = create_test_fingerprint(Some("关注"));

        let result = ThreeTierMatcher::find_best_match(
            &candidates,
            &fingerprint,
            0.7,
            |_, _| 0.5, // 模糊匹配函数（不会被调用）
        )
        .unwrap();

        assert_eq!(result.match_type, MatchType::ExactText);
        assert_eq!(result.confidence, 1.0);
        assert_eq!(result.element.text, "关注");
    }
}

