// src-tauri/src/domain/element_match/structural/subtree.rs
// module: element_match | layer: domain | role: 子孙骨架匹配器
// summary: 迁移自 SubtreeMatcher，实现 ElementMatcher 接口

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::{MatchMode, MatchResult};
use crate::domain::structure_runtime_match::adapters::xml_indexer_adapter::XmlIndexerAdapter;
use crate::domain::structure_runtime_match::field_refine::stable_text::get_stable_text_signature;
use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use std::collections::{HashSet, VecDeque};

// 临时定义 SubtreeFeatures，后续可移至 types
#[derive(Debug, Clone)]
struct SubtreeFeatures {
    pub has_desc_on_root: bool,
    pub has_clickable_parent: bool,
    pub has_media_area: bool,
    pub has_bottom_bar: bool,
    pub media_ratio: f32,
    pub bottom_bar_pos: f32,
}

pub struct SubtreeMatcher;

impl SubtreeMatcher {
    pub fn new() -> Self {
        Self
    }

    fn extract_features<V: SmXmlView>(
        &self,
        view: &V,
        card_root_id: u32,
        clickable_parent_id: u32,
    ) -> SubtreeFeatures {
        // 检查卡片根是否有content-desc
        let desc = view.content_desc(card_root_id);
        let has_desc_on_root = !get_stable_text_signature(desc).is_empty();

        // 检查是否有可点击父容器
        let has_clickable_parent = self.has_clickable_framelayout_child(view, card_root_id);

        // 分析媒体区和底栏
        let (mut media_ratio, mut bottom_bar_pos, mut has_media_area, mut has_bottom_bar) =
            (0.0, 0.0, false, false);

        let content_groups = self.find_all_content_groups_bfs(view, card_root_id);

        for group_id in content_groups {
            if !has_media_area {
                if let Some(media_bounds) = self.find_media_block(view, group_id) {
                    let parent_bounds = view.bounds(clickable_parent_id);
                    if parent_bounds.height() > 0 {
                        media_ratio = media_bounds.height() as f32 / parent_bounds.height() as f32;
                        has_media_area = true;
                    }
                }
            }

            if !has_bottom_bar {
                if let Some(bar_bounds) = self.find_bottom_bar(view, group_id) {
                    let parent_bounds = view.bounds(clickable_parent_id);
                    if parent_bounds.height() > 0 {
                        bottom_bar_pos = (bar_bounds.top - parent_bounds.top) as f32 / parent_bounds.height() as f32;
                        has_bottom_bar = true;
                    }
                }
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

    // ... 辅助方法 (从原文件迁移并适配 SmXmlView) ...
    fn has_clickable_framelayout_child<V: SmXmlView>(&self, view: &V, root_id: u32) -> bool {
        let mut queue = VecDeque::new();
        queue.push_back(root_id);
        let mut visited = HashSet::new();

        while let Some(curr) = queue.pop_front() {
            if !visited.insert(curr) { continue; }
            
            if view.is_clickable(curr) && view.class(curr).ends_with("FrameLayout") {
                return true;
            }

            for child in view.children(curr) {
                queue.push_back(child);
            }
        }
        false
    }

    fn find_all_content_groups_bfs<V: SmXmlView>(&self, view: &V, root_id: u32) -> Vec<u32> {
        let mut groups = Vec::new();
        let mut queue = VecDeque::new();
        queue.push_back(root_id);
        let mut visited = HashSet::new();

        while let Some(curr) = queue.pop_front() {
            if !visited.insert(curr) { continue; }

            let class = view.class(curr);
            if class.ends_with("RelativeLayout") || class.ends_with("ConstraintLayout") {
                groups.push(curr);
            }

            for child in view.children(curr) {
                queue.push_back(child);
            }
        }
        groups
    }

    fn find_media_block<V: SmXmlView>(&self, view: &V, group_id: u32) -> Option<crate::domain::structure_runtime_match::types::SmBounds> {
        for child in view.children(group_id) {
            let class = view.class(child);
            if class.ends_with("ImageView") || class.ends_with("View") {
                let bounds = view.bounds(child);
                let parent_bounds = view.bounds(group_id);
                if parent_bounds.height() > 0 {
                    let ratio = bounds.height() as f32 / parent_bounds.height() as f32;
                    if ratio > 0.4 && ratio < 0.9 {
                        return Some(bounds);
                    }
                }
            }
        }
        None
    }

    fn find_bottom_bar<V: SmXmlView>(&self, view: &V, group_id: u32) -> Option<crate::domain::structure_runtime_match::types::SmBounds> {
        for child in view.children(group_id) {
            let class = view.class(child);
            if class.ends_with("LinearLayout") || class.ends_with("RelativeLayout") {
                let bounds = view.bounds(child);
                let parent_bounds = view.bounds(group_id);
                if parent_bounds.height() > 0 {
                    let pos = (bounds.top - parent_bounds.top) as f32 / parent_bounds.height() as f32;
                    if pos > 0.75 {
                        return Some(bounds);
                    }
                }
            }
        }
        None
    }

    fn is_waterfall_container<V: SmXmlView>(&self, view: &V, node_id: u32) -> bool {
        // 向上查找父容器，判断是否为列表容器
        let mut current = node_id;
        // 向上查3层
        for _ in 0..3 {
            if let Some(parent_id) = view.parent(current) {
                let class = view.class(parent_id);
                if class.contains("RecyclerView") 
                    || class.contains("StaggeredGridLayoutManager")
                    || class.contains("ListView")
                    || class.contains("GridView")
                    || class.contains("WaterFall") // 某些自定义控件可能包含此关键字
                {
                    return true;
                }
                current = parent_id;
            } else {
                break;
            }
        }
        false 
    }
}

impl ElementMatcher for SubtreeMatcher {
    fn id(&self) -> &str {
        "structural.subtree"
    }

    fn is_applicable(&self, ctx: &MatchContext) -> bool {
        // 只有当存在卡片根时才适用
        ctx.get_card_root_index().is_some()
    }

    fn match_element(&self, ctx: &MatchContext) -> MatchResult {
        let card_root_idx = ctx.get_card_root_index().unwrap(); // is_applicable 保证了安全
        let clickable_parent_idx = ctx.get_clickable_parent_index();

        // 使用 Adapter 适配 XmlIndexer
        let adapter = XmlIndexerAdapter::new(ctx.xml_indexer, "adhoc".to_string());
        
        // 1) 提取特征
        let features = self.extract_features(&adapter, card_root_idx as u32, clickable_parent_idx as u32);

        // 2) 打分 (Tiered Scoring Implementation)
        // 目标：结构性卡片(Card)得分应落在 [0.60, 0.85] 区间
        // 语义性按钮(Button)得分应落在 [0.80, 0.95] 区间 (由 LeafMatcher 处理)
        // 唯一性定位(Unique)得分应落在 [0.95, 1.0] 区间
        
        let mut conf = 0.0;
        
        // 基础特征权重 (总和 0.60)
        // 降低单项特征权重，避免非卡片元素因部分特征吻合而得分过高
        if features.has_desc_on_root { conf += 0.10; }
        if features.has_clickable_parent { conf += 0.10; }
        if features.has_media_area { conf += 0.10; }
        if features.has_bottom_bar { conf += 0.10; }

        // 布局比例特征
        conf += (1.0 - (features.media_ratio - 0.65).abs()).clamp(0.0, 1.0) * 0.10;
        conf += (1.0 - (features.bottom_bar_pos - 0.85).abs()).clamp(0.0, 1.0) * 0.10;

        // 场景增强权重
        // 瀑布流容器是卡片的强信号，给予显著加分 (+0.25)
        // 这样 "完美卡片" = 0.60 + 0.25 = 0.85
        // "普通卡片" (无瀑布流) = 0.60
        if self.is_waterfall_container(&adapter, clickable_parent_idx as u32) { 
            conf += 0.25; 
        }

        conf = conf.clamp(0.0, 1.0);

        let explain = format!(
            "子孙骨架(Tier3): desc={} 可点父={} 媒体区={} 底栏={} ratio={:.2} pos={:.2} 瀑布流={}",
            features.has_desc_on_root,
            features.has_clickable_parent,
            features.has_media_area,
            features.has_bottom_bar,
            features.media_ratio,
            features.bottom_bar_pos,
            if conf >= 0.8 { "Yes" } else { "No" } // 简单示意
        );

        MatchResult {
            mode: MatchMode::CardSubtree,
            confidence: conf,
            passed_gate: conf >= 0.55, // 降低门槛以适应新的分数区间 (0.60起步)
            explain,
        }
    }
}
