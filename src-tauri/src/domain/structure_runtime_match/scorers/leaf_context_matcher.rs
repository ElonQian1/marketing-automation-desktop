// src-tauri/src/domain/structure_runtime_match/scorers/leaf_context_matcher.rs
// module: structure_runtime_match | layer: domain | role: 叶子上下文匹配评分器（重构版）
// summary: 适用于"关注按钮"等非卡片场景：稳定文本白名单+兄弟序列+祖先链+相对几何

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
        
        let class = node.element.class_name.clone().unwrap_or_default();
        let clickable = node.element.clickable;
        
        // 🎯 识别按钮行容器（横向布局，2-5个子项）
        let button_row_container = self.find_button_row_container(node_index);
        
        // 构建祖先链（取最近3层）
        let ancestor_classes = self.get_ancestor_classes(node_index, 3);
        
        // 构建兄弟节点形态和位置（基于按钮行容器）
        let (sibling_shape, sibling_index) = if let Some(row) = button_row_container {
            self.get_sibling_info_in_container(node_index, row)
        } else {
            self.get_sibling_info(node_index)
        };
        
        // 计算相对几何位置（相对于按钮行容器，不是 clickable_parent）
        let rel_xywh = if let Some(row) = button_row_container {
            let row_bounds = self.xml_indexer.all_nodes[row].bounds;
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
        
        // 优先取 text，其次取 content_desc
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

    pub fn score_leaf_context(&self, sig: &ContextSig) -> ScoreOutcome {
        // 🎯 新权重分配（适用于"关注按钮"等场景）：
        // TextExact(0.45) + Sibling(0.30) + Ancestors(0.15) + Geometry(0.10)
        // 或 TextNonEmpty(0.20) + Sibling(0.30) + Ancestors(0.15) + Geometry(0.10) + Clickable(0.25)
        
        let mut conf = 0.0;
        let mut text_score = 0.0;
        let mut text_exact = false;
        
        // 1️⃣ 稳定文本评分（最高权重）
        if sig.has_text || sig.has_desc {
            let (is_exact, score) = self.score_stable_text(sig);
            text_exact = is_exact;
            text_score = score;
            conf += text_score;
        }
        
        // 2️⃣ 兄弟序列评分（强特征）
        conf += self.score_sibling_pattern(&sig.sibling_shape, sig.sibling_index) * 0.30;
        
        // 3️⃣ 祖先链评分（按钮行识别）
        conf += self.score_ancestor_pattern(&sig.ancestor_classes) * 0.15;
        
        // 4️⃣ 相对几何评分（位置确认）
        conf += self.score_geometry_pattern(sig.rel_xywh) * 0.10;
        
        conf = conf.clamp(0.0, 1.0);

        let explain = format!(
            "叶子上下文: text_exact={} text_score={:.2} siblings={}/{} ancestors={} geom=({:.2},{:.2})",
            text_exact, text_score, sig.sibling_index, sig.sibling_shape.len(), 
            sig.ancestor_classes.len(), sig.rel_xywh.0, sig.rel_xywh.1
        );

        ScoreOutcome { 
            mode: MatchMode::LeafContext, 
            conf, 
            passed_gate: false, 
            explain 
        }
    }
    
    /// 🎯 稳定文本评分：白名单精确匹配 vs 非空文本
    fn score_stable_text(&self, sig: &ContextSig) -> (bool, f32) {
        // 稳定文本白名单（多语言支持）
        const STABLE_KEYWORDS: &[&str] = &[
            "关注", "已关注", "关注中", "取消关注",
            "Follow", "Following", "Unfollow",
            "私信", "Message", "聊天", "Chat",
            "更多", "More", "..."
        ];
        
        // 获取文本内容
        let text_content = &sig.text_content;
        
        // 检查是否命中白名单
        let is_exact = STABLE_KEYWORDS.iter().any(|kw| text_content.contains(kw));
        
        if is_exact {
            (true, 0.45) // 精确命中白名单，高分
        } else if sig.has_text || sig.has_desc {
            (false, 0.20) // 有文本但不稳定，低分
        } else {
            (false, 0.0) // 无文本
        }
    }
    
    /// 🎯 查找按钮行容器（横向布局 + 2-5个子项）
    fn find_button_row_container(&self, node_index: usize) -> Option<usize> {
        // 向上查找1-3层祖先
        let node_xpath = &self.xml_indexer.all_nodes[node_index].xpath;
        let node_level = node_xpath.matches('/').count();
        
        for level in 1..=3 {
            if node_level < level { break; }
            
            let target_level = node_level - level;
            if let Some(ancestor_node) = self.xml_indexer.all_nodes.iter()
                .find(|n| n.xpath.matches('/').count() == target_level && node_xpath.starts_with(&n.xpath)) {
                
                // 检查是否是横向布局容器
                if let Some(class) = &ancestor_node.element.class_name {
                    let is_horizontal = class.ends_with("LinearLayout") || 
                                      class.ends_with("RelativeLayout") ||
                                      class.ends_with("ConstraintLayout");
                    
                    if is_horizontal {
                        // 统计直接子节点数量
                        let child_count = self.count_direct_children(ancestor_node.xpath.as_str());
                        if child_count >= 2 && child_count <= 5 {
                            tracing::debug!("🔍 [LeafContext] 找到按钮行容器: class={}, child_count={}", 
                                class, child_count);
                            return Some(self.xml_indexer.all_nodes.iter()
                                .position(|n| n.xpath == ancestor_node.xpath)
                                .unwrap());
                        }
                    }
                }
            }
        }
        
        None
    }
    
    /// 统计直接子节点数量
    fn count_direct_children(&self, parent_xpath: &str) -> usize {
        let parent_depth = parent_xpath.matches('/').count();
        self.xml_indexer.all_nodes.iter()
            .filter(|n| {
                n.xpath.starts_with(parent_xpath) && 
                n.xpath.matches('/').count() == parent_depth + 1
            })
            .count()
    }
    
    /// 在指定容器内获取兄弟信息
    fn get_sibling_info_in_container(&self, node_index: usize, container_index: usize) -> (Vec<(String, bool)>, usize) {
        let container_xpath = &self.xml_indexer.all_nodes[container_index].xpath;
        let container_depth = container_xpath.matches('/').count();
        
        let siblings: Vec<(usize, String, bool)> = self.xml_indexer.all_nodes.iter()
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
        
        let sibling_shape: Vec<(String, bool)> = siblings.iter()
            .map(|(_, class, clickable)| (class.clone(), *clickable))
            .collect();
        
        let sibling_index = siblings.iter()
            .position(|(idx, _, _)| *idx == node_index)
            .unwrap_or(0);
        
        (sibling_shape, sibling_index)
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
                if let Some(class) = &ancestor_node.element.class_name {
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
                            let class = n.element.class_name.as_deref().unwrap_or("Unknown");
                            let clickable = n.element.clickable;
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

    /// 🎯 兄弟序列评分（关注按钮场景）
    fn score_sibling_pattern(&self, shape: &[(String, bool)], index: usize) -> f32 {
        let mut score = 0.0;
        let len = shape.len();
        
        // 1️⃣ 形状评分：2-4个兄弟，至少1个可点击
        if (2..=4).contains(&len) {
            let clickable_count = shape.iter().filter(|(_, c)| *c).count();
            if clickable_count >= 1 {
                score += 0.9; // 典型按钮行形态
            } else {
                score += 0.6; // 有兄弟但可点性弱
            }
        } else if len >= 2 {
            score += 0.4; // 有兄弟但数量不理想
        }
        
        // 2️⃣ 位置评分：关注通常偏左/中（0.3附近）
        if len > 1 {
            let pos = index as f32 / (len as f32 - 1.0);
            // 0.3 附近得分最高（偏左/中位置）
            let pos_score = 1.0 - (pos - 0.3).abs();
            score += pos_score.clamp(0.0, 1.0) * 0.1;
        }
        
        score.min(1.0)
    }

    /// 🎯 祖先链评分（按钮行识别）
    fn score_ancestor_pattern(&self, ancestors: &[String]) -> f32 {
        let mut score: f32 = 0.0;
        
        // 1️⃣ 横向布局容器（LinearLayout/RelativeLayout）
        if ancestors.iter().any(|c| c.ends_with("LinearLayout") || c.ends_with("RelativeLayout")) {
            score += 0.7;
        }
        
        // 2️⃣ 资料区/头部容器特征
        if ancestors.iter().any(|c| c.ends_with("ConstraintLayout") || c.ends_with("FrameLayout")) {
            score += 0.3;
        }
        
        score.min(1.0)
    }

    /// 🎯 几何评分（按钮行内相对位置）
    fn score_geometry_pattern(&self, rel_geom: (f32, f32, f32, f32)) -> f32 {
        // 计算中心点（相对于按钮行容器）
        let center_x = rel_geom.0 + rel_geom.2 / 2.0;
        let center_y = rel_geom.1 + rel_geom.3 / 2.0;
        
        // 1️⃣ 水平位置评分：关注按钮通常在左/中（0.2-0.5）
        let h_score = 1.0 - (center_x - 0.35).abs();
        
        // 2️⃣ 垂直位置评分：垂直居中（0.5附近）
        let v_score = 1.0 - (center_y - 0.50).abs();
        
        // 综合：水平位置权重更高
        (h_score.clamp(0.0, 1.0) * 0.7 + v_score.clamp(0.0, 1.0) * 0.3).clamp(0.0, 1.0)
    }
}
