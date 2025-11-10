// src-tauri/src/domain/structure_runtime_match/click_normalizer.rs
// module: structure_runtime_match | layer: domain | role: 点击回收与容器限域
// summary: 把任意点击层回收到卡片根/可点父，并限定在RecyclerView容器内

use anyhow::{Result, anyhow};
use crate::engine::xml_indexer::XmlIndexer;
use crate::services::ui_reader_service::UIElement;

#[derive(Debug, Clone)]
pub struct ClickNormalizeResult {
    /// 最近的可滚动容器（RecyclerView等）
    pub container: NormalizedNode,
    /// 卡片项根（FrameLayout，clickable=false，content-desc非空）
    pub card_root: NormalizedNode,
    /// 可点父（FrameLayout，clickable=true）
    pub clickable_parent: NormalizedNode,
    /// 用户原始点击的节点
    pub original_clicked: NormalizedNode,
    /// 瀑布流列信息
    pub column_info: ColumnInfo,
}

#[derive(Debug, Clone)]
pub struct NormalizedNode {
    pub node_index: usize,
    pub element: UIElement,
    pub bounds: (i32, i32, i32, i32),
    pub xpath: String,
}

#[derive(Debug, Clone)]
pub struct ColumnInfo {
    /// 左列/右列标识
    pub column: WaterfallColumn,
    /// 在列内的相对位置（按top排序）
    pub position_in_column: usize,
    /// 同列的其他卡片数量
    pub column_card_count: usize,
}

#[derive(Debug, Clone, PartialEq)]
pub enum WaterfallColumn {
    Left,   // 左列，通常left ≈ 13
    Right,  // 右列，通常left ≈ 546
    Unknown,
}

pub struct ClickNormalizer<'a> {
    pub xml_indexer: &'a XmlIndexer,
}

impl<'a> ClickNormalizer<'a> {
    pub fn new(xml_indexer: &'a XmlIndexer) -> Self {
        Self { xml_indexer }
    }

    /// 🎯 主入口：点击规范化
    pub fn normalize_click(&self, clicked_bounds: (i32, i32, i32, i32)) -> Result<ClickNormalizeResult> {
        tracing::info!("🔄 [ClickNormalizer] 开始点击规范化: bounds={:?}", clicked_bounds);

        // 1. 找到被点击的节点
        let clicked_node = self.find_clicked_node(clicked_bounds)?;
        tracing::info!("✅ [ClickNormalizer] 找到点击节点: index={}, class={:?}", 
                      clicked_node.node_index, clicked_node.element.class);

        // 2. 向上找最近的滚动容器
        let container = self.find_nearest_container(clicked_node.node_index)?;
        tracing::info!("✅ [ClickNormalizer] 找到容器: index={}, class={:?}", 
                      container.node_index, container.element.class);

        // 3. 在容器内回收到卡片根
        let card_root = self.find_card_root_within_container(container.node_index, clicked_node.node_index)?;
        tracing::info!("✅ [ClickNormalizer] 回收到卡片根: index={}, content_desc={:?}", 
                      card_root.node_index, card_root.element.content_desc);

        // 4. 找到卡片的可点父
        let clickable_parent = self.find_clickable_parent(card_root.node_index)
            .unwrap_or_else(|| {
                tracing::warn!("⚠️ [ClickNormalizer] 未找到可点父，回退到卡片根");
                card_root.clone()
            });

        // 5. 分析瀑布流列信息
        let column_info = self.analyze_waterfall_column(&container, &card_root)?;
        tracing::info!("✅ [ClickNormalizer] 列分析完成: {:?}", column_info);

        Ok(ClickNormalizeResult {
            container,
            card_root,
            clickable_parent,
            original_clicked: clicked_node,
            column_info,
        })
    }

    /// 根据bounds找到被点击的节点
    fn find_clicked_node(&self, bounds: (i32, i32, i32, i32)) -> Result<NormalizedNode> {
        // 首先尝试精确匹配
        for (index, node) in self.xml_indexer.all_nodes.iter().enumerate() {
            if node.bounds == bounds {
                return Ok(NormalizedNode {
                    node_index: index,
                    element: node.element.clone(),
                    bounds: node.bounds,
                    xpath: node.xpath.clone(),
                });
            }
        }

        // 如果精确匹配失败，尝试包含关系匹配（点击在节点内部）
        let (left, top, right, bottom) = bounds;
        for (index, node) in self.xml_indexer.all_nodes.iter().enumerate() {
            let (n_left, n_top, n_right, n_bottom) = node.bounds;
            if left >= n_left && top >= n_top && right <= n_right && bottom <= n_bottom {
                tracing::info!("📍 [ClickNormalizer] 使用包含匹配: 点击{:?} 在节点{:?}内", bounds, node.bounds);
                return Ok(NormalizedNode {
                    node_index: index,
                    element: node.element.clone(),
                    bounds: node.bounds,
                    xpath: node.xpath.clone(),
                });
            }
        }

        Err(anyhow!("未找到匹配的点击节点: bounds={:?}", bounds))
    }

    /// 向上找最近的滚动容器
    fn find_nearest_container(&self, start_index: usize) -> Result<NormalizedNode> {
        let mut current_index = start_index;

        // 向上遍历寻找容器
        loop {
            let current_node = &self.xml_indexer.all_nodes[current_index];
            
            // 检查是否是容器
            if self.is_scroll_container(&current_node.element) {
                return Ok(NormalizedNode {
                    node_index: current_index,
                    element: current_node.element.clone(),
                    bounds: current_node.bounds,
                    xpath: current_node.xpath.clone(),
                });
            }

            // 找父节点（通过bounds包含关系）
            match self.find_parent_by_bounds(current_index) {
                Some(parent_index) => current_index = parent_index,
                None => break,
            }
        }

        Err(anyhow!("未找到滚动容器"))
    }

    /// 判断是否是滚动容器
    pub fn is_scroll_container(&self, element: &UIElement) -> bool {
        if let Some(class) = &element.class {
            let class_lower = class.to_lowercase();
            return class_lower.contains("recyclerview")
                || class_lower.contains("listview")
                || class_lower.contains("scrollview")
                || class_lower.contains("viewpager")
                || class_lower.contains("gridview");
        }
        false
    }

    /// 通过bounds包含关系找父节点
    fn find_parent_by_bounds(&self, child_index: usize) -> Option<usize> {
        let child_bounds = self.xml_indexer.all_nodes[child_index].bounds;
        let (c_left, c_top, c_right, c_bottom) = child_bounds;

        let mut best_parent: Option<(usize, i64)> = None;

        for (index, node) in self.xml_indexer.all_nodes.iter().enumerate() {
            if index == child_index {
                continue;
            }

            let (p_left, p_top, p_right, p_bottom) = node.bounds;
            
            // 检查是否包含子节点
            if p_left <= c_left && p_top <= c_top && p_right >= c_right && p_bottom >= c_bottom {
                let area = ((p_right - p_left) as i64) * ((p_bottom - p_top) as i64);
                
                // 选择面积最小的父节点（最近的父节点）
                match best_parent {
                    None => best_parent = Some((index, area)),
                    Some((_, current_area)) if area < current_area => {
                        best_parent = Some((index, area));
                    }
                    _ => {}
                }
            }
        }

        best_parent.map(|(index, _)| index)
    }

    /// 在容器内回收到卡片根
    fn find_card_root_within_container(&self, container_index: usize, clicked_index: usize) -> Result<NormalizedNode> {
        let container_bounds = self.xml_indexer.all_nodes[container_index].bounds;
        let mut current_index = clicked_index;

        // 向上遍历，寻找卡片根
        loop {
            let current_node = &self.xml_indexer.all_nodes[current_index];
            
            // 检查是否是卡片根候选
            if self.is_card_root_candidate(&current_node.element) {
                // 验证是否在容器内
                if self.is_node_within_bounds(current_node.bounds, container_bounds) {
                    return Ok(NormalizedNode {
                        node_index: current_index,
                        element: current_node.element.clone(),
                        bounds: current_node.bounds,
                        xpath: current_node.xpath.clone(),
                    });
                }
            }

            // 继续向上
            match self.find_parent_by_bounds(current_index) {
                Some(parent_index) if parent_index != container_index => {
                    current_index = parent_index;
                }
                _ => break,
            }
        }

        Err(anyhow!("在容器内未找到卡片根"))
    }

    /// 判断是否是卡片根候选
    pub fn is_card_root_candidate(&self, element: &UIElement) -> bool {
        // 必须是FrameLayout
        if let Some(class) = &element.class {
            if !class.ends_with("FrameLayout") {
                return false;
            }
        } else {
            return false;
        }

        // 必须不可点击（项根通常不可点击）
        if element.clickable.unwrap_or(false) {
            return false;
        }

        // 必须有content_desc
        if let Some(desc) = &element.content_desc {
            !desc.trim().is_empty()
        } else {
            false
        }
    }

    /// 检查节点是否在指定bounds内
    fn is_node_within_bounds(&self, node_bounds: (i32, i32, i32, i32), container_bounds: (i32, i32, i32, i32)) -> bool {
        let (n_left, n_top, n_right, n_bottom) = node_bounds;
        let (c_left, c_top, c_right, c_bottom) = container_bounds;
        
        n_left >= c_left && n_top >= c_top && n_right <= c_right && n_bottom <= c_bottom
    }

    /// 找到卡片的可点父
    fn find_clickable_parent(&self, card_root_index: usize) -> Option<NormalizedNode> {
        let root_bounds = self.xml_indexer.all_nodes[card_root_index].bounds;
        
        // 查找卡片根的直接子节点
        for (index, node) in self.xml_indexer.all_nodes.iter().enumerate() {
            if index == card_root_index {
                continue;
            }

            // 检查是否是直接子节点
            if self.is_direct_child(card_root_index, index) {
                // 检查是否是可点击的FrameLayout
                if let Some(class) = &node.element.class {
                    if class.ends_with("FrameLayout") && node.element.clickable.unwrap_or(false) {
                        // 检查bounds重叠度
                        if self.calculate_iou(root_bounds, node.bounds) > 0.8 {
                            return Some(NormalizedNode {
                                node_index: index,
                                element: node.element.clone(),
                                bounds: node.bounds,
                                xpath: node.xpath.clone(),
                            });
                        }
                    }
                }
            }
        }

        None
    }

    /// 检查是否是直接子节点
    fn is_direct_child(&self, parent_index: usize, child_index: usize) -> bool {
        let parent_bounds = self.xml_indexer.all_nodes[parent_index].bounds;
        let child_bounds = self.xml_indexer.all_nodes[child_index].bounds;

        // 子节点必须被父节点包含
        if !self.is_node_within_bounds(child_bounds, parent_bounds) {
            return false;
        }

        // 检查是否有中间节点
        for (index, node) in self.xml_indexer.all_nodes.iter().enumerate() {
            if index == parent_index || index == child_index {
                continue;
            }

            // 如果存在节点M：parent包含M，M包含child，则child不是parent的直接子节点
            if self.is_node_within_bounds(node.bounds, parent_bounds) && 
               self.is_node_within_bounds(child_bounds, node.bounds) {
                return false;
            }
        }

        true
    }

    /// 计算IoU（Intersection over Union）
    fn calculate_iou(&self, bounds1: (i32, i32, i32, i32), bounds2: (i32, i32, i32, i32)) -> f32 {
        let (a_left, a_top, a_right, a_bottom) = bounds1;
        let (b_left, b_top, b_right, b_bottom) = bounds2;

        let inter_left = a_left.max(b_left);
        let inter_top = a_top.max(b_top);
        let inter_right = a_right.min(b_right);
        let inter_bottom = a_bottom.min(b_bottom);

        if inter_left >= inter_right || inter_top >= inter_bottom {
            return 0.0;
        }

        let inter_area = ((inter_right - inter_left) * (inter_bottom - inter_top)) as f32;
        let area1 = ((a_right - a_left) * (a_bottom - a_top)) as f32;
        let area2 = ((b_right - b_left) * (b_bottom - b_top)) as f32;
        let union_area = area1 + area2 - inter_area;

        if union_area <= 0.0 {
            0.0
        } else {
            inter_area / union_area
        }
    }

    /// 分析瀑布流列信息
    fn analyze_waterfall_column(&self, container: &NormalizedNode, card_root: &NormalizedNode) -> Result<ColumnInfo> {
        let (card_left, card_top, card_right, _) = card_root.bounds;
        
        // 判断左右列
        let column = if card_left <= 100 {
            // 左列，通常left ≈ 13
            WaterfallColumn::Left
        } else if card_left >= 500 {
            // 右列，通常left ≈ 546
            WaterfallColumn::Right
        } else {
            WaterfallColumn::Unknown
        };

        // 统计同列的卡片
        let mut same_column_cards = Vec::new();
        
        for (index, node) in self.xml_indexer.all_nodes.iter().enumerate() {
            // 跳过非卡片根节点
            if !self.is_card_root_candidate(&node.element) {
                continue;
            }

            // 检查是否在同一容器内
            if !self.is_node_within_bounds(node.bounds, container.bounds) {
                continue;
            }

            // 检查是否在同一列
            let (node_left, node_top, _, _) = node.bounds;
            let node_column = if node_left <= 100 {
                WaterfallColumn::Left
            } else if node_left >= 500 {
                WaterfallColumn::Right
            } else {
                WaterfallColumn::Unknown
            };

            if node_column == column {
                same_column_cards.push((index, node_top));
            }
        }

        // 按top位置排序
        same_column_cards.sort_by_key(|(_, top)| *top);

        // 找到当前卡片在列中的位置
        let position_in_column = same_column_cards
            .iter()
            .position(|(index, _)| *index == card_root.node_index)
            .unwrap_or(0);

        Ok(ColumnInfo {
            column,
            position_in_column,
            column_card_count: same_column_cards.len(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::ui_reader_service::UIElement;
    use crate::engine::xml_indexer::{XmlIndexer, IndexedNode};

    fn create_test_element(class: &str, clickable: bool, content_desc: Option<&str>) -> UIElement {
        UIElement {
            class: Some(class.to_string()),
            clickable: Some(clickable),
            content_desc: content_desc.map(|s| s.to_string()),
            resource_id: None,
            text: None,
            bounds: None,
            enabled: Some(true),
            package: None,
        }
    }

    #[test]
    fn test_is_card_root_candidate() {
        let indexer = XmlIndexer {
            resource_id_index: Default::default(),
            class_name_index: Default::default(),
            text_index: Default::default(),
            content_desc_index: Default::default(),
            container_index: Default::default(),
            all_nodes: vec![],
        };
        
        let normalizer = ClickNormalizer::new(&indexer);

        // 正确的卡片根
        let card_root = create_test_element(
            "android.widget.FrameLayout", 
            false, 
            Some("笔记 来海边吃吃玩玩 来自知恩 147赞")
        );
        assert!(normalizer.is_card_root_candidate(&card_root));

        // 可点击的FrameLayout（不是卡片根）
        let clickable_frame = create_test_element(
            "android.widget.FrameLayout", 
            true, 
            Some("some content")
        );
        assert!(!normalizer.is_card_root_candidate(&clickable_frame));

        // 没有content_desc的FrameLayout
        let no_desc_frame = create_test_element(
            "android.widget.FrameLayout", 
            false, 
            None
        );
        assert!(!normalizer.is_card_root_candidate(&no_desc_frame));

        // 不是FrameLayout
        let view_group = create_test_element(
            "android.view.ViewGroup", 
            false, 
            Some("some content")
        );
        assert!(!normalizer.is_card_root_candidate(&view_group));
    }

    #[test]
    fn test_is_scroll_container() {
        let indexer = XmlIndexer {
            resource_id_index: Default::default(),
            class_name_index: Default::default(),
            text_index: Default::default(),
            content_desc_index: Default::default(),
            container_index: Default::default(),
            all_nodes: vec![],
        };
        
        let normalizer = ClickNormalizer::new(&indexer);

        // RecyclerView
        let recycler_view = create_test_element(
            "androidx.recyclerview.widget.RecyclerView", 
            false, 
            None
        );
        assert!(normalizer.is_scroll_container(&recycler_view));

        // ListView
        let list_view = create_test_element(
            "android.widget.ListView", 
            false, 
            None
        );
        assert!(normalizer.is_scroll_container(&list_view));

        // 普通FrameLayout
        let frame_layout = create_test_element(
            "android.widget.FrameLayout", 
            false, 
            None
        );
        assert!(!normalizer.is_scroll_container(&frame_layout));
    }

    #[test]
    fn test_calculate_iou() {
        let indexer = XmlIndexer {
            resource_id_index: Default::default(),
            class_name_index: Default::default(),
            text_index: Default::default(),
            content_desc_index: Default::default(),
            container_index: Default::default(),
            all_nodes: vec![],
        };
        
        let normalizer = ClickNormalizer::new(&indexer);

        // 完全相同的bounds
        let iou = normalizer.calculate_iou((0, 0, 100, 100), (0, 0, 100, 100));
        assert_eq!(iou, 1.0);

        // 完全不重叠
        let iou = normalizer.calculate_iou((0, 0, 50, 50), (100, 100, 150, 150));
        assert_eq!(iou, 0.0);

        // 部分重叠
        let iou = normalizer.calculate_iou((0, 0, 100, 100), (50, 50, 150, 150));
        assert!(iou > 0.0 && iou < 1.0);
    }
}