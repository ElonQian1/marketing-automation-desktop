// src-tauri/src/domain/structure_runtime_match/scorers/leaf_context_matcher.rs
// module: structure_runtime_match | layer: domain | role: 叶子上下文匹配评分器
// summary: 祖先链+兄弟序列+相对几何+字段位图，适合点赞图标/头像等无子孙元素

use super::types::{ScoreOutcome, ContextSig, MatchMode};
use crate::engine::xml_indexer::XmlIndexer;

pub struct LeafContextMatcher<'a> {
    pub xml_indexer: &'a XmlIndexer,
}

impl<'a> LeafContextMatcher<'a> {
    pub fn new(xml_indexer: &'a XmlIndexer) -> Self {
        Self { xml_indexer }
    }

    pub fn build_context_signature(&self, node_index: usize, clickable_parent_index: usize) -> ContextSig {
        let node = &self.xml_indexer.all_nodes[node_index];
        let clickable_parent = &self.xml_indexer.all_nodes[clickable_parent_index];
        
        let class = node.element.class.clone().unwrap_or_default();
        let clickable = node.element.clickable.unwrap_or(false);
        
        // 构建祖先链（取最近3层）
        let ancestor_classes = self.get_ancestor_classes(node_index, 3);
        
        // 构建兄弟节点形态和位置
        let (sibling_shape, sibling_index) = self.get_sibling_info(node_index);
        
        // 计算相对几何位置
        let rel_xywh = self.calculate_relative_geometry(node.bounds, clickable_parent.bounds);
        
        // 检查字段存在性
        let has_text = node.element.text.as_ref().map(|s| !s.trim().is_empty()).unwrap_or(false);
        let has_desc = node.element.content_desc.as_ref().map(|s| !s.trim().is_empty()).unwrap_or(false);
        let has_res_id = node.element.resource_id.as_ref().map(|s| !s.trim().is_empty()).unwrap_or(false);

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
        }
    }

    pub fn score_leaf_context(&self, sig: &ContextSig) -> ScoreOutcome {
        // 经验权重：偏重"可点性""兄弟序列""右侧/左侧几何"和"祖先模式"
        let mut conf = 0.0;
        
        if sig.clickable { 
            conf += 0.20; 
        }
        
        conf += self.score_sibling_pattern(&sig.sibling_shape, sig.sibling_index) * 0.35;
        conf += self.score_ancestor_pattern(&sig.ancestor_classes) * 0.20;
        conf += self.score_geometry_pattern(sig.rel_xywh) * 0.25;
        
        conf = conf.clamp(0.0, 1.0);

        let explain = format!(
            "叶子上下文: clickable={} siblings@{}/{} ancestors={} geom=({:.2},{:.2},{:.2},{:.2})",
            sig.clickable, sig.sibling_index, sig.sibling_shape.len(), 
            sig.ancestor_classes.len(), sig.rel_xywh.0, sig.rel_xywh.1, 
            sig.rel_xywh.2, sig.rel_xywh.3
        );

        ScoreOutcome { 
            mode: MatchMode::LeafContext, 
            conf, 
            passed_gate: false, 
            explain 
        }
    }

    fn get_ancestor_classes(&self, node_index: usize, max_levels: usize) -> Vec<String> {
        let node_xpath = &self.xml_indexer.all_nodes[node_index].xpath;
        let node_level = node_xpath.matches('/').count();
        
        let mut ancestors = Vec::new();
        for level in 1..=max_levels {
            if node_level < level { break; }
            
            let target_level = node_level - level;
            if let Some(ancestor_node) = self.xml_indexer.all_nodes.iter()
                .find(|n| n.xpath.matches('/').count() == target_level && node_xpath.starts_with(&n.xpath)) {
                if let Some(class) = &ancestor_node.element.class {
                    ancestors.push(class.clone());
                }
            }
        }
        
        ancestors
    }

    fn get_sibling_info(&self, node_index: usize) -> (Vec<(String, bool)>, usize) {
        let node_xpath = &self.xml_indexer.all_nodes[node_index].xpath;
        
        // 找到父节点
        if let Some(parent_xpath) = self.get_parent_xpath(node_xpath) {
            let siblings: Vec<(usize, &str, bool)> = self.xml_indexer.all_nodes.iter()
                .enumerate()
                .filter_map(|(idx, n)| {
                    if let Some(parent) = self.get_parent_xpath(&n.xpath) {
                        if parent == parent_xpath {
                            let class = n.element.class.as_deref().unwrap_or("Unknown");
                            let clickable = n.element.clickable.unwrap_or(false);
                            Some((idx, class, clickable))
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                })
                .collect();
            
            let sibling_shape: Vec<(String, bool)> = siblings.iter()
                .map(|(_, class, clickable)| (class.to_string(), *clickable))
                .collect();
            
            let sibling_index = siblings.iter()
                .position(|(idx, _, _)| *idx == node_index)
                .unwrap_or(0);
            
            (sibling_shape, sibling_index)
        } else {
            (vec![], 0)
        }
    }

    fn get_parent_xpath(&self, xpath: &str) -> Option<String> {
        xpath.rfind('/').map(|pos| xpath[..pos].to_string())
    }

    fn calculate_relative_geometry(&self, node_bounds: (i32, i32, i32, i32), parent_bounds: (i32, i32, i32, i32)) -> (f32, f32, f32, f32) {
        let parent_width = (parent_bounds.2 - parent_bounds.0).max(1) as f32;
        let parent_height = (parent_bounds.3 - parent_bounds.1).max(1) as f32;
        
        let rel_x = (node_bounds.0 - parent_bounds.0) as f32 / parent_width;
        let rel_y = (node_bounds.1 - parent_bounds.1) as f32 / parent_height;
        let rel_w = (node_bounds.2 - node_bounds.0) as f32 / parent_width;
        let rel_h = (node_bounds.3 - node_bounds.1) as f32 / parent_height;
        
        (rel_x, rel_y, rel_w, rel_h)
    }

    fn score_sibling_pattern(&self, shape: &[(String, bool)], index: usize) -> f32 {
        // 与"底栏四件套/头部用户行"相似即高分；位置靠右（点赞）或靠左（头像）也加分
        let ideal_bottom_bar = ["View", "TextView", "ImageView", "TextView"];
        let mut score = 0.0;
        
        // 检查与理想模式的匹配度
        for (i, (class, _)) in shape.iter().enumerate() {
            if i < ideal_bottom_bar.len() && class.ends_with(ideal_bottom_bar[i]) {
                score += 0.20;
            }
        }
        
        // 位置加分：靠右（点赞）或靠左（头像）
        if shape.len() > 0 {
            let pos_ratio = index as f32 / (shape.len() - 1).max(1) as f32;
            // 靠右（0.85附近）或靠左（0.10附近）都给分
            let right_score = 1.0 - (pos_ratio - 0.85).abs();
            let left_score = 1.0 - (pos_ratio - 0.10).abs();
            score += right_score.max(left_score) * 0.20;
        }
        
        score.min(1.0)
    }

    fn score_ancestor_pattern(&self, ancestors: &[String]) -> f32 {
        // 位于ViewGroup → FrameLayout（可点父）下方，且上方有Recycler容器时更稳
        let mut score = 0.0;
        
        if ancestors.iter().any(|c| c.ends_with("ViewGroup")) {
            score += 0.5;
        }
        
        if ancestors.iter().any(|c| c.ends_with("FrameLayout")) {
            score += 0.3;
        }
        
        // 如果有RecyclerView祖先，说明在列表容器内
        if ancestors.iter().any(|c| c.contains("RecyclerView")) {
            score += 0.2;
        }
        
        score.min(1.0)
    }

    fn score_geometry_pattern(&self, rel_geom: (f32, f32, f32, f32)) -> f32 {
        // 右半区靠中（点赞）/左半区靠中（头像）都算好
        let center_x = rel_geom.0 + rel_geom.2 / 2.0;
        let center_y = rel_geom.1 + rel_geom.3 / 2.0;
        
        // 右侧位置评分（适合点赞）
        let right_score = (1.0 - (center_x - 0.85).abs()).clamp(0.0, 1.0);
        
        // 左侧位置评分（适合头像）  
        let left_score = (1.0 - (center_x - 0.15).abs()).clamp(0.0, 1.0);
        
        // 底部区域评分
        let bottom_score = (1.0 - (center_y - 0.85).abs()).clamp(0.0, 1.0);
        
        // 综合评分：位置好 + 在底部区域
        (right_score.max(left_score) * 0.7 + bottom_score * 0.3).clamp(0.0, 1.0)
    }
}