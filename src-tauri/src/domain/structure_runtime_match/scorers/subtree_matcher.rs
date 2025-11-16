// src-tauri/src/domain/structure_runtime_match/scorers/subtree_matcher.rs
// module: structure_runtime_match | layer: domain | role: 子孙骨架匹配评分器
// summary: 只看结构不做文本等值，适合卡片根/可点父/标题区等有层级元素

use super::types::{ScoreOutcome, SubtreeFeatures, MatchMode};
use crate::engine::xml_indexer::XmlIndexer;
use crate::services::ui_reader_service::UIElement;

pub struct SubtreeMatcher<'a> {
    pub xml_indexer: &'a XmlIndexer,
}

impl<'a> SubtreeMatcher<'a> {
    pub fn new(xml_indexer: &'a XmlIndexer) -> Self {
        Self { xml_indexer }
    }

    /// 对"被点元素所属卡片"做子孙骨架评分
    pub fn score_subtree(&self, card_root_index: usize, clickable_parent_index: usize) -> ScoreOutcome {
        // 1) 提取特征
        let features = self.extract_features(card_root_index, clickable_parent_index);

        // 2) 打分（示例权重，可后续微调）
        let mut conf = 0.0;
        if features.has_desc_on_root { conf += 0.18; }
        if features.has_clickable_parent { conf += 0.18; }
        if features.has_media_area { conf += 0.18; }
        if features.has_bottom_bar { conf += 0.18; }
        
        // 媒体区高度占比接近0.65时加分
        conf += (1.0 - (features.media_ratio - 0.65).abs()).clamp(0.0, 1.0) * 0.14;
        
        // 底栏位置接近0.85时加分  
        conf += (1.0 - (features.bottom_bar_pos - 0.85).abs()).clamp(0.0, 1.0) * 0.14;
        
        conf = conf.clamp(0.0, 1.0);

        let explain = format!(
            "子孙骨架: desc={} 可点父={} 媒体区={} 底栏={} ratio={:.2} pos={:.2}",
            features.has_desc_on_root, features.has_clickable_parent, 
            features.has_media_area, features.has_bottom_bar, 
            features.media_ratio, features.bottom_bar_pos
        );

        ScoreOutcome { 
            mode: MatchMode::CardSubtree, 
            conf, 
            passed_gate: false, 
            explain 
        }
    }

    fn extract_features(&self, card_root_index: usize, clickable_parent_index: usize) -> SubtreeFeatures {
        // 检查卡片根是否有content-desc
        let card_root = &self.xml_indexer.all_nodes[card_root_index];
        let has_desc_on_root = card_root.element.content_desc.as_ref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);

        // 检查是否有可点击父容器
        let has_clickable_parent = self.has_clickable_framelayout_child(card_root_index);

        // 分析媒体区和底栏
        let (mut media_ratio, mut bottom_bar_pos, mut has_media_area, mut has_bottom_bar) = 
            (0.0, 0.0, false, false);

        if let Some(content_group_index) = self.find_content_group(clickable_parent_index) {
            // 查找媒体区块
            if let Some(media_bounds) = self.find_media_block(content_group_index) {
                let parent_bounds = self.xml_indexer.all_nodes[clickable_parent_index].bounds;
                let parent_height = (parent_bounds.3 - parent_bounds.1).max(1);
                media_ratio = (media_bounds.3 - media_bounds.1) as f32 / parent_height as f32;
                has_media_area = true;
            }

            // 查找底栏区块
            if let Some(bottom_bounds) = self.find_bottom_bar(content_group_index) {
                let parent_bounds = self.xml_indexer.all_nodes[clickable_parent_index].bounds;
                let parent_height = (parent_bounds.3 - parent_bounds.1).max(1);
                bottom_bar_pos = (bottom_bounds.1 - parent_bounds.1) as f32 / parent_height as f32;
                has_bottom_bar = true;
            }
        }

        SubtreeFeatures {
            has_desc_on_root,
            has_clickable_parent,
            has_media_area,
            has_bottom_bar,
            media_ratio,
            bottom_bar_pos,
        }
    }

    fn has_clickable_framelayout_child(&self, parent_index: usize) -> bool {
        for child_index in self.get_children_indices(parent_index) {
            let child = &self.xml_indexer.all_nodes[child_index];
            if let Some(class) = &child.element.class {
                if class.ends_with("FrameLayout") && child.element.clickable.unwrap_or(false) {
                    return true;
                }
            }
        }
        false
    }

    fn find_content_group(&self, clickable_parent_index: usize) -> Option<usize> {
        // 在可点父下找一个ViewGroup作为内容容器
        for child_index in self.get_children_indices(clickable_parent_index) {
            let child = &self.xml_indexer.all_nodes[child_index];
            if let Some(class) = &child.element.class {
                if class.ends_with("ViewGroup") {
                    return Some(child_index);
                }
            }
        }
        None
    }

    fn find_media_block(&self, content_group_index: usize) -> Option<(i32, i32, i32, i32)> {
        // 递归查找ImageView或包含ImageView的容器，限制深度
        self.find_media_block_recursive(content_group_index, 2)
    }

    fn find_media_block_recursive(&self, node_index: usize, max_depth: usize) -> Option<(i32, i32, i32, i32)> {
        if max_depth == 0 { return None; }

        let node = &self.xml_indexer.all_nodes[node_index];
        
        // 如果当前节点就是ImageView，返回其bounds
        if let Some(class) = &node.element.class {
            if class.ends_with("ImageView") {
                return Some(node.bounds);
            }
        }

        // 递归查找子节点
        for child_index in self.get_children_indices(node_index) {
            if let Some(bounds) = self.find_media_block_recursive(child_index, max_depth - 1) {
                return Some(bounds);
            }
        }

        None
    }

    fn find_bottom_bar(&self, content_group_index: usize) -> Option<(i32, i32, i32, i32)> {
        // 查找符合底栏模式的ViewGroup
        self.find_bottom_bar_recursive(content_group_index, 2)
    }

    fn find_bottom_bar_recursive(&self, node_index: usize, max_depth: usize) -> Option<(i32, i32, i32, i32)> {
        if max_depth == 0 { return None; }

        let node = &self.xml_indexer.all_nodes[node_index];
        
        // 检查当前节点是否是ViewGroup且符合底栏模式
        if let Some(class) = &node.element.class {
            if class.ends_with("ViewGroup") {
                let children_indices = self.get_children_indices(node_index);
                let child_classes: Vec<String> = children_indices.iter()
                    .map(|&idx| {
                        self.xml_indexer.all_nodes[idx].element.class
                            .as_ref()
                            .map(|s| s.clone())
                            .unwrap_or_default()
                    })
                    .collect();
                
                if self.score_bottom_shape(&child_classes) >= 0.6 {
                    return Some(node.bounds);
                }
            }
        }

        // 递归查找子节点
        for child_index in self.get_children_indices(node_index) {
            if let Some(bounds) = self.find_bottom_bar_recursive(child_index, max_depth - 1) {
                return Some(bounds);
            }
        }

        None
    }

    fn score_bottom_shape(&self, child_classes: &[String]) -> f32 {
        let ideal = ["View", "TextView", "ImageView", "TextView"];
        let mut score: f32 = 0.0;
        
        for (i, class) in child_classes.iter().enumerate() {
            if i < ideal.len() && class.ends_with(ideal[i]) {
                score += 0.25;
            }
        }
        
        // 长度接近理想值时加分
        if (child_classes.len() as i32 - 4).abs() <= 1 {
            score += 0.1;
        }
        
        score.min(1.0)
    }

    fn get_children_indices(&self, parent_index: usize) -> Vec<usize> {
        // 🎯 性能优化：直接使用预构建的children_indices，避免O(N)遍历
        if parent_index < self.xml_indexer.all_nodes.len() {
            self.xml_indexer.all_nodes[parent_index].children_indices.clone()
        } else {
            Vec::new()
        }
    }
}