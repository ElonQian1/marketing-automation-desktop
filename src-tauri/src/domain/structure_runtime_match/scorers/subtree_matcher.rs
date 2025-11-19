// src-tauri/src/domain/structure_runtime_match/scorers/subtree_matcher.rs
// module: structure_runtime_match | layer: domain | role: 子孙骨架匹配评分器
// summary: 只看结构不做文本等值，适合卡片根/可点父/标题区等有层级元素

use super::types::{MatchMode, ScoreOutcome, SubtreeFeatures};
use crate::domain::structure_runtime_match::field_refine::stable_text::get_stable_text_signature;
use crate::engine::xml_indexer::XmlIndexer;
use std::collections::VecDeque;

pub struct SubtreeMatcher<'a> {
    pub xml_indexer: &'a XmlIndexer,
}

impl<'a> SubtreeMatcher<'a> {
    pub fn new(xml_indexer: &'a XmlIndexer) -> Self {
        Self { xml_indexer }
    }

    /// 对"被点元素所属卡片"做子孙骨架评分
    pub fn score_subtree(
        &self,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> ScoreOutcome {
        // 1) 提取特征
        let features = self.extract_features(card_root_index, clickable_parent_index);

        // 2) 打分
        let mut conf = 0.0;
        if features.has_desc_on_root {
            conf += 0.18;
        }
        if features.has_clickable_parent {
            conf += 0.18;
        }
        if features.has_media_area {
            conf += 0.18;
        }
        if features.has_bottom_bar {
            conf += 0.18;
        }

        // 媒体区高度占比接近0.65时加分
        conf += (1.0 - (features.media_ratio - 0.65).abs()).clamp(0.0, 1.0) * 0.14;

        // 底栏位置接近0.85时加分
        conf += (1.0 - (features.bottom_bar_pos - 0.85).abs()).clamp(0.0, 1.0) * 0.14;

        // 🌊 瀑布流额外加分
        let is_waterfall = self.is_waterfall_container(clickable_parent_index);
        if is_waterfall {
            conf += 0.15; // 瀑布流结构通常更可信
        }

        conf = conf.clamp(0.0, 1.0);

        let explain = format!(
            "子孙骨架: desc={} 可点父={} 媒体区={} 底栏={} 瀑布流={} ratio={:.2} pos={:.2}",
            features.has_desc_on_root,
            features.has_clickable_parent,
            features.has_media_area,
            features.has_bottom_bar,
            is_waterfall,
            features.media_ratio,
            features.bottom_bar_pos
        );

        ScoreOutcome {
            mode: MatchMode::CardSubtree,
            conf,
            passed_gate: false,
            explain,
        }
    }

    fn extract_features(
        &self,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> SubtreeFeatures {
        // 检查卡片根是否有content-desc (使用稳定文本签名)
        let card_root = &self.xml_indexer.all_nodes[card_root_index];
        let has_desc_on_root = card_root
            .element
            .content_desc
            .as_ref()
            .map(|s| !get_stable_text_signature(s).is_empty())
            .unwrap_or(false);

        // 检查是否有可点击父容器
        let has_clickable_parent = self.has_clickable_framelayout_child(card_root_index);

        // 🎯 分析媒体区和底栏（增强容错性）
        let (mut media_ratio, mut bottom_bar_pos, mut has_media_area, mut has_bottom_bar) =
            (0.0, 0.0, false, false);

        // 使用 BFS 查找所有可能的内容组
        let content_groups = self.find_all_content_groups_bfs(clickable_parent_index);

        // 只要任何一个内容组包含特征，就算命中
        for group_index in content_groups {
            // 查找媒体区块
            if !has_media_area {
                if let Some(media_bounds) = self.find_media_block(group_index) {
                    let parent_bounds = self.xml_indexer.all_nodes[clickable_parent_index].bounds;
                    let parent_height = (parent_bounds.3 - parent_bounds.1).max(1);
                    media_ratio = (media_bounds.3 - media_bounds.1) as f32 / parent_height as f32;
                    has_media_area = true;
                }
            }

            // 查找底栏区块
            if !has_bottom_bar {
                if let Some(bottom_bounds) = self.find_bottom_bar(group_index) {
                    let parent_bounds = self.xml_indexer.all_nodes[clickable_parent_index].bounds;
                    let parent_height = (parent_bounds.3 - parent_bounds.1).max(1);
                    bottom_bar_pos =
                        (bottom_bounds.1 - parent_bounds.1) as f32 / parent_height as f32;
                    has_bottom_bar = true;
                }
            }

            if has_media_area && has_bottom_bar {
                break;
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

    /// 使用 BFS 查找所有内容组（穿透同边界透明层）
    fn find_all_content_groups_bfs(&self, start_index: usize) -> Vec<usize> {
        let mut results = Vec::new();
        let mut queue = VecDeque::new();
        queue.push_back(start_index);

        let start_bounds = self.xml_indexer.all_nodes[start_index].bounds;
        let mut visited = std::collections::HashSet::new();
        visited.insert(start_index);

        while let Some(curr_idx) = queue.pop_front() {
            let curr_node = &self.xml_indexer.all_nodes[curr_idx];
            let curr_bounds = curr_node.bounds;

            // 如果当前节点是 ViewGroup/FrameLayout 且边界不同于起始节点，视为内容组
            if curr_idx != start_index {
                if let Some(class) = &curr_node.element.class {
                    if (class.ends_with("ViewGroup") || class.ends_with("FrameLayout"))
                        && curr_bounds != start_bounds
                    {
                        results.push(curr_idx);
                        // 找到内容组后，通常不需要继续深入该分支，除非内容组内部还有嵌套结构
                        // 这里我们选择继续深入，以防漏掉嵌套结构
                    }
                }
            }

            // 继续遍历子节点
            for child_idx in self.get_children_indices(curr_idx) {
                if !visited.contains(&child_idx) {
                    visited.insert(child_idx);
                    queue.push_back(child_idx);
                }
            }
        }

        // 如果没找到任何子内容组，就把自己作为内容组（Fallback）
        if results.is_empty() {
            results.push(start_index);
        }

        results
    }

    /// 检测是否为瀑布流容器 (ViewPager / RecyclerView)
    fn is_waterfall_container(&self, node_index: usize) -> bool {
        let node = &self.xml_indexer.all_nodes[node_index];
        if let Some(class) = &node.element.class {
            if class.contains("ViewPager") || class.contains("RecyclerView") {
                return true;
            }
        }
        // 也可以检查父级
        if let Some(parent_idx) = node.parent_index {
            let parent = &self.xml_indexer.all_nodes[parent_idx];
            if let Some(class) = &parent.element.class {
                if class.contains("ViewPager") || class.contains("RecyclerView") {
                    return true;
                }
            }
        }
        false
    }

    fn find_media_block(&self, content_group_index: usize) -> Option<(i32, i32, i32, i32)> {
        // 递归查找ImageView或包含ImageView的容器，限制深度
        self.find_media_block_recursive(content_group_index, 3) // 增加深度到3
    }

    fn find_media_block_recursive(
        &self,
        node_index: usize,
        max_depth: usize,
    ) -> Option<(i32, i32, i32, i32)> {
        if max_depth == 0 {
            return None;
        }

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
        self.find_bottom_bar_recursive(content_group_index, 3) // 增加深度到3
    }

    fn find_bottom_bar_recursive(
        &self,
        node_index: usize,
        max_depth: usize,
    ) -> Option<(i32, i32, i32, i32)> {
        if max_depth == 0 {
            return None;
        }

        let node = &self.xml_indexer.all_nodes[node_index];

        // 检查当前节点是否是ViewGroup且符合底栏模式
        if let Some(class) = &node.element.class {
            if class.ends_with("ViewGroup") {
                let children_indices = self.get_children_indices(node_index);
                let child_classes: Vec<String> = children_indices
                    .iter()
                    .map(|&idx| {
                        self.xml_indexer.all_nodes[idx]
                            .element
                            .class
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
            self.xml_indexer.all_nodes[parent_index]
                .children_indices
                .clone()
        } else {
            Vec::new()
        }
    }
}
