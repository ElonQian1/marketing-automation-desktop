// src-tauri/src/domain/structure_runtime_match/scorers/subtree_matcher.rs
// module: structure_runtime_match | layer: domain | role: 子孙骨架匹配评分器
// summary: 只看结构不做文本等值，适合卡片根/可点父/标题区等有层级元素

use super::types::{MatchMode, ScoreOutcome, SubtreeFeatures};
use crate::domain::structure_runtime_match::field_refine::stable_text::get_stable_text_signature;
use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use std::collections::{HashSet, VecDeque};

pub struct SubtreeMatcher<'a, V: SmXmlView> {
    pub view: &'a V,
}

impl<'a, V: SmXmlView> SubtreeMatcher<'a, V> {
    pub fn new(view: &'a V) -> Self {
        Self { view }
    }

    /// 对"被点元素所属卡片"做子孙骨架评分
    pub fn score_subtree(
        &self,
        card_root_id: u32,
        clickable_parent_id: u32,
    ) -> ScoreOutcome {
        // 1) 提取特征
        let features = self.extract_features(card_root_id, clickable_parent_id);

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

        // �� 瀑布流额外加分
        let is_waterfall = self.is_waterfall_container(clickable_parent_id);
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
        card_root_id: u32,
        clickable_parent_id: u32,
    ) -> SubtreeFeatures {
        // 检查卡片根是否有content-desc (使用稳定文本签名)
        let desc = self.view.content_desc(card_root_id);
        let has_desc_on_root = !get_stable_text_signature(desc).is_empty();

        // 检查是否有可点击父容器
        let has_clickable_parent = self.has_clickable_framelayout_child(card_root_id);

        // 🎯 分析媒体区和底栏（增强容错性）
        let (mut media_ratio, mut bottom_bar_pos, mut has_media_area, mut has_bottom_bar) =
            (0.0, 0.0, false, false);

        // 使用 BFS 查找所有可能的内容组（从卡片根开始找，以支持"透明层与内容层并列"的结构）
        let content_groups = self.find_all_content_groups_bfs(card_root_id);

        // 只要任何一个内容组包含特征，就算命中
        for group_id in content_groups {
            // 查找媒体区块
            if !has_media_area {
                if let Some(media_bounds) = self.find_media_block(group_id) {
                    let parent_bounds = self.view.bounds(clickable_parent_id);
                    let parent_height = (parent_bounds.bottom - parent_bounds.top).max(1);
                    media_ratio = (media_bounds.bottom - media_bounds.top) as f32 / parent_height as f32;
                    has_media_area = true;
                }
            }

            // 查找底栏区块
            if !has_bottom_bar {
                if let Some(bottom_bounds) = self.find_bottom_bar(group_id) {
                    let parent_bounds = self.view.bounds(clickable_parent_id);
                    let parent_height = (parent_bounds.bottom - parent_bounds.top).max(1);
                    bottom_bar_pos =
                        (bottom_bounds.top - parent_bounds.top) as f32 / parent_height as f32;
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

    fn has_clickable_framelayout_child(&self, parent_id: u32) -> bool {
        for child_id in self.view.children(parent_id) {
            let class = self.view.class(child_id);
            if class.ends_with("FrameLayout") && self.view.is_clickable(child_id) {
                return true;
            }
        }
        false
    }

    /// 使用 BFS 查找所有内容组（穿透同边界透明层）
    fn find_all_content_groups_bfs(&self, start_id: u32) -> Vec<u32> {
        let mut results = Vec::new();
        let mut queue = VecDeque::new();
        queue.push_back(start_id);

        let _start_bounds = self.view.bounds(start_id);
        let mut visited = HashSet::new();
        visited.insert(start_id);

        while let Some(curr_id) = queue.pop_front() {
            // 如果当前节点是 ViewGroup/FrameLayout，视为内容组
            if curr_id != start_id {
                let class = self.view.class(curr_id);
                if class.ends_with("ViewGroup") || class.ends_with("FrameLayout") {
                    results.push(curr_id);
                }
            }

            // 继续遍历子节点
            for child_id in self.view.children(curr_id) {
                if !visited.contains(&child_id) {
                    visited.insert(child_id);
                    queue.push_back(child_id);
                }
            }
        }

        // 如果没找到任何子内容组，就把自己作为内容组（Fallback）
        if results.is_empty() {
            results.push(start_id);
        }

        results
    }

    /// 检测是否为瀑布流容器 (ViewPager / RecyclerView)
    fn is_waterfall_container(&self, node_id: u32) -> bool {
        let class = self.view.class(node_id);
        if class.contains("ViewPager") || class.contains("RecyclerView") {
            return true;
        }
        
        // 也可以检查父级
        if let Some(parent_id) = self.view.parent(node_id) {
            let parent_class = self.view.class(parent_id);
            if parent_class.contains("ViewPager") || parent_class.contains("RecyclerView") {
                return true;
            }
        }
        false
    }

    fn find_media_block(&self, content_group_id: u32) -> Option<crate::domain::structure_runtime_match::types::SmBounds> {
        // 递归查找ImageView或包含ImageView的容器，限制深度
        self.find_media_block_recursive(content_group_id, 3)
    }

    fn find_media_block_recursive(
        &self,
        node_id: u32,
        max_depth: usize,
    ) -> Option<crate::domain::structure_runtime_match::types::SmBounds> {
        if max_depth == 0 {
            return None;
        }

        // 如果当前节点就是ImageView，返回其bounds
        let class = self.view.class(node_id);
        if class.ends_with("ImageView") {
            return Some(self.view.bounds(node_id));
        }

        // 递归查找子节点
        for child_id in self.view.children(node_id) {
            if let Some(bounds) = self.find_media_block_recursive(child_id, max_depth - 1) {
                return Some(bounds);
            }
        }

        None
    }

    fn find_bottom_bar(&self, content_group_id: u32) -> Option<crate::domain::structure_runtime_match::types::SmBounds> {
        // 查找符合底栏模式的ViewGroup
        self.find_bottom_bar_recursive(content_group_id, 3)
    }

    fn find_bottom_bar_recursive(
        &self,
        node_id: u32,
        max_depth: usize,
    ) -> Option<crate::domain::structure_runtime_match::types::SmBounds> {
        if max_depth == 0 {
            return None;
        }

        // 检查当前节点是否是ViewGroup且符合底栏模式
        let class = self.view.class(node_id);
        if class.ends_with("ViewGroup") {
            let children = self.view.children(node_id);
            let child_classes: Vec<String> = children
                .iter()
                .map(|&id| self.view.class(id).to_string())
                .collect();

            if self.score_bottom_shape(&child_classes) >= 0.6 {
                return Some(self.view.bounds(node_id));
            }
        }

        // 递归查找子节点
        for child_id in self.view.children(node_id) {
            if let Some(bounds) = self.find_bottom_bar_recursive(child_id, max_depth - 1) {
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
}

