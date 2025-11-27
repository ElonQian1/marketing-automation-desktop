// src-tauri/src/domain/element_match/structural/leaf.rs
// module: element_match | layer: domain | role: 叶子上下文匹配器
// summary: 迁移自 LeafContextMatcher，实现 ElementMatcher 接口

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::{MatchMode, MatchResult};
use crate::engine::xml_indexer::XmlIndexer;

// 临时定义 ContextSig，后续可移至 types
#[derive(Debug, Clone)]
struct ContextSig {
    pub class: String,
    pub clickable: bool,
    pub ancestor_classes: Vec<String>,
    pub sibling_shape: Vec<(String, bool)>,
    pub sibling_index: usize,
    pub rel_xywh: (f32, f32, f32, f32),
    pub has_text: bool,
    pub has_desc: bool,
    pub has_res_id: bool,
    pub text_content: String,
}

pub struct LeafContextMatcher;

impl LeafContextMatcher {
    pub fn new() -> Self {
        Self
    }

    fn build_context_signature(&self, xml_indexer: &XmlIndexer, node_index: usize, clickable_parent_index: usize) -> ContextSig {
        let node = &xml_indexer.all_nodes[node_index];
        let clickable_parent = &xml_indexer.all_nodes[clickable_parent_index];
        
        let class = node.element.class_name.clone().unwrap_or_default();
        let clickable = node.element.clickable;
        
        // 识别按钮行容器
        let button_row_container = self.find_button_row_container(xml_indexer, node_index);
        
        // 构建祖先链
        let ancestor_classes = self.get_ancestor_classes(xml_indexer, node_index, 3);
        
        // 构建兄弟节点形态和位置
        let (sibling_shape, sibling_index) = if let Some(row) = button_row_container {
            self.get_sibling_info_in_container(xml_indexer, node_index, row)
        } else {
            self.get_sibling_info(xml_indexer, node_index)
        };
        
        // 计算相对几何位置
        let rel_xywh = if let Some(row) = button_row_container {
            let row_bounds = xml_indexer.all_nodes[row].bounds;
            self.calculate_relative_geometry(node.bounds, row_bounds)
        } else {
            self.calculate_relative_geometry(node.bounds, clickable_parent.bounds)
        };
        
        // 检查字段存在性
        let text_str = node.element.text.trim();
        let desc_str = node.element.content_desc.trim();
        let has_text = !text_str.is_empty();
        let has_desc = !desc_str.is_empty();
        let has_res_id = node.element.resource_id.as_ref().map(|s| !s.trim().is_empty()).unwrap_or(false);
        
        let text_content = if has_text { text_str.to_string() } else { desc_str.to_string() };

        ContextSig {
            class,
            clickable,
            ancestor_classes,
            sibling_shape,
            sibling_index,
            rel_xywh,
            has_text,
            has_desc,
            has_res_id,
            text_content,
        }
    }

    fn score_leaf_context(&self, sig: &ContextSig) -> (f32, String) {
        // Tiered Scoring:
        // Tier 2 (Button/Semantic): 0.80 - 0.95
        // Tier 3 (Card/Structural): 0.60 - 0.85
        
        let mut conf = 0.0;
        let mut text_score = 0.0;
        let mut text_exact = false;
        
        if sig.has_text || sig.has_desc {
            let (is_exact, score) = self.score_stable_text(sig);
            text_exact = is_exact;
            text_score = score;
            conf += text_score;
        }
        
        conf += self.score_sibling_pattern(&sig.sibling_shape, sig.sibling_index) * 0.30;
        conf += self.score_ancestor_pattern(&sig.ancestor_classes) * 0.15;
        conf += self.score_geometry_pattern(sig.rel_xywh) * 0.10;
        
        conf = conf.clamp(0.0, 1.0);

        let explain = format!(
            "叶子上下文: text_exact={} text_score={:.2} siblings={}/{} ancestors={} geom=({:.2},{:.2})",
            text_exact, text_score, sig.sibling_index, sig.sibling_shape.len(), 
            sig.ancestor_classes.len(), sig.rel_xywh.0, sig.rel_xywh.1
        );
        
        (conf, explain)
    }

    // ... 辅助方法 (从原文件迁移，增加 xml_indexer 参数) ...
    fn find_button_row_container(&self, xml_indexer: &XmlIndexer, node_index: usize) -> Option<usize> {
        let node_xpath = &xml_indexer.all_nodes[node_index].xpath;
        let node_level = node_xpath.matches('/').count();
        
        for level in 1..=3 {
            if node_level < level { break; }
            let target_level = node_level - level;
            if let Some(ancestor_node) = xml_indexer.all_nodes.iter()
                .find(|n| n.xpath.matches('/').count() == target_level && node_xpath.starts_with(&n.xpath)) {
                
                if let Some(class) = &ancestor_node.element.class_name {
                    let is_horizontal = class.ends_with("LinearLayout") || 
                                      class.ends_with("RelativeLayout") ||
                                      class.ends_with("ConstraintLayout");
                    
                    if is_horizontal {
                        let child_count = self.count_direct_children(xml_indexer, &ancestor_node.xpath);
                        if child_count >= 2 && child_count <= 5 {
                            return Some(xml_indexer.all_nodes.iter()
                                .position(|n| n.xpath == ancestor_node.xpath)
                                .unwrap());
                        }
                    }
                }
            }
        }
        None
    }

    fn count_direct_children(&self, xml_indexer: &XmlIndexer, parent_xpath: &str) -> usize {
        let parent_depth = parent_xpath.matches('/').count();
        xml_indexer.all_nodes.iter()
            .filter(|n| {
                n.xpath.starts_with(parent_xpath) && 
                n.xpath.matches('/').count() == parent_depth + 1
            })
            .count()
    }

    fn get_ancestor_classes(&self, xml_indexer: &XmlIndexer, node_index: usize, depth: usize) -> Vec<String> {
        let mut classes = Vec::new();
        let mut current_idx = node_index;
        
        for _ in 0..depth {
            if let Some(parent_idx) = xml_indexer.all_nodes[current_idx].parent_index {
                let parent = &xml_indexer.all_nodes[parent_idx];
                classes.push(parent.element.class_name.clone().unwrap_or_default());
                current_idx = parent_idx;
            } else {
                break;
            }
        }
        classes
    }

    fn get_sibling_info(&self, xml_indexer: &XmlIndexer, node_index: usize) -> (Vec<(String, bool)>, usize) {
        if let Some(parent_idx) = xml_indexer.all_nodes[node_index].parent_index {
            self.get_sibling_info_in_container(xml_indexer, node_index, parent_idx)
        } else {
            (vec![], 0)
        }
    }

    fn get_sibling_info_in_container(&self, xml_indexer: &XmlIndexer, node_index: usize, container_index: usize) -> (Vec<(String, bool)>, usize) {
        let container_xpath = &xml_indexer.all_nodes[container_index].xpath;
        let container_depth = container_xpath.matches('/').count();
        
        let siblings: Vec<(usize, String, bool)> = xml_indexer.all_nodes.iter()
            .enumerate()
            .filter_map(|(idx, n)| {
                if n.xpath.starts_with(container_xpath) && 
                   n.xpath.matches('/').count() == container_depth + 1 {
                    let class = n.element.class_name.as_deref().unwrap_or("Unknown").to_string();
                    let clickable = n.element.clickable;
                    Some((idx, class, clickable))
                } else {
                    None
                }
            })
            .collect();
            
        let my_pos = siblings.iter().position(|(idx, _, _)| *idx == node_index).unwrap_or(0);
        let shape = siblings.into_iter().map(|(_, c, k)| (c, k)).collect();
        
        (shape, my_pos)
    }

    fn calculate_relative_geometry(&self, node_bounds: (i32, i32, i32, i32), parent_bounds: (i32, i32, i32, i32)) -> (f32, f32, f32, f32) {
        let p_w = (parent_bounds.2 - parent_bounds.0) as f32;
        let p_h = (parent_bounds.3 - parent_bounds.1) as f32;
        
        if p_w <= 0.0 || p_h <= 0.0 {
            return (0.0, 0.0, 0.0, 0.0);
        }
        
        let x = (node_bounds.0 - parent_bounds.0) as f32 / p_w;
        let y = (node_bounds.1 - parent_bounds.1) as f32 / p_h;
        let w = (node_bounds.2 - node_bounds.0) as f32 / p_w;
        let h = (node_bounds.3 - node_bounds.1) as f32 / p_h;
        
        (x, y, w, h)
    }

    fn score_stable_text(&self, sig: &ContextSig) -> (bool, f32) {
        const STABLE_KEYWORDS: &[&str] = &[
            "关注", "已关注", "关注中", "取消关注",
            "Follow", "Following", "Unfollow",
            "私信", "Message", "聊天", "Chat",
            "更多", "More", "..."
        ];
        
        let text_content = &sig.text_content;
        let is_exact = STABLE_KEYWORDS.iter().any(|kw| text_content.contains(kw));
        
        if is_exact {
            // 强语义文本给予高分，确保进入 Tier 2 (0.80-0.95)
            (true, 0.55)
        } else if sig.has_text || sig.has_desc {
            (false, 0.20)
        } else {
            (false, 0.0)
        }
    }

    fn score_sibling_pattern(&self, siblings: &[(String, bool)], _my_index: usize) -> f32 {
        if siblings.len() < 2 { 
            // 即使只有一个子节点（可能是Wrapper），也给予一定基础分，避免直接0分
            return 0.5; 
        }
        // 简单评分：如果在两端或中间有特定模式，给予加分
        // 这里简化实现，只要有兄弟节点就给分
        0.8
    }

    fn score_ancestor_pattern(&self, ancestors: &[String]) -> f32 {
        if ancestors.is_empty() { return 0.0; }
        // 检查是否有常见的布局容器
        let has_layout = ancestors.iter().any(|c| 
            c.ends_with("LinearLayout") || 
            c.ends_with("RelativeLayout") || 
            c.ends_with("ConstraintLayout") ||
            c.ends_with("FrameLayout") ||
            c.ends_with("CardView") ||
            c.ends_with("ViewGroup") ||
            c.ends_with("View")
        );
        if has_layout { 0.8 } else { 0.2 }
    }

    fn score_geometry_pattern(&self, rel_xywh: (f32, f32, f32, f32)) -> f32 {
        // 检查是否在合理范围内
        if rel_xywh.0 >= 0.0 && rel_xywh.0 <= 1.0 && 
           rel_xywh.1 >= 0.0 && rel_xywh.1 <= 1.0 {
            0.8
        } else {
            0.0
        }
    }
}

impl ElementMatcher for LeafContextMatcher {
    fn id(&self) -> &str {
        "structural.leaf"
    }

    fn match_element(&self, ctx: &MatchContext) -> MatchResult {
        let clickable_parent_idx = ctx.get_clickable_parent_index();
        
        let sig = self.build_context_signature(ctx.xml_indexer, ctx.clicked_node_index, clickable_parent_idx);
        let (conf, explain) = self.score_leaf_context(&sig);

        MatchResult {
            mode: MatchMode::LeafContext,
            confidence: conf,
            passed_gate: conf >= 0.72, // 默认阈值
            explain,
        }
    }
}
