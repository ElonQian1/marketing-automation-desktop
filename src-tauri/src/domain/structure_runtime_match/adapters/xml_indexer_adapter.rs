// src-tauri/src/domain/structure_runtime_match/adapters/xml_indexer_adapter.rs
// module: structure_runtime_match | layer: domain | role: XmlIndexer适配器
// summary: 实现SmXmlView trait，连接现有XmlIndexer到结构匹配算法

use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::{SmBounds, SmNodeId};
use crate::domain::structure_runtime_match::container_gate::types::{UiTree, NodeId, Bounds};
use crate::engine::xml_indexer::{XmlIndexer, IndexedNode};
use std::collections::HashMap;

/// XmlIndexer适配器
/// 
/// 将现有的 XmlIndexer 适配为 SmXmlView trait，供结构匹配算法使用
pub struct XmlIndexerAdapter<'a> {
    indexer: &'a XmlIndexer,
    /// 节点ID映射：SmNodeId -> IndexedNode的索引位置
    node_map: HashMap<SmNodeId, usize>,
    /// XML内容哈希（用于缓存）
    xml_hash: String,
}

impl<'a> XmlIndexerAdapter<'a> {
    /// 从 XmlIndexer 创建适配器
    pub fn new(indexer: &'a XmlIndexer, xml_hash: String) -> Self {
        // 构建节点ID映射
        let node_map: HashMap<SmNodeId, usize> = indexer
            .all_nodes
            .iter()
            .enumerate()
            .map(|(idx, _node)| {
                // 使用节点索引作为 SmNodeId
                (idx as SmNodeId, idx)
            })
            .collect();

        Self {
            indexer,
            node_map,
            xml_hash,
        }
    }

    /// 获取节点引用（公开以供诊断工具使用）
    pub fn get_node(&self, node_id: SmNodeId) -> Option<&IndexedNode> {
        self.node_map
            .get(&node_id)
            .and_then(|&idx| self.indexer.all_nodes.get(idx))
    }
    
    /// 获取节点总数
    pub fn node_count(&self) -> usize {
        self.indexer.all_nodes.len()
    }
    
    /// 获取根节点ID（树的第一个节点，通常是索引0）
    pub fn root_id(&self) -> SmNodeId {
        0  // XML树的根节点通常是第一个解析到的节点
    }

    /// 解析bounds字符串为SmBounds
    fn parse_bounds_to_sm(&self, bounds: crate::types::page_analysis::ElementBounds) -> SmBounds {
        SmBounds {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
        }
    }

    /// 解析bounds字符串
    fn parse_bounds_string(&self, bounds: &str) -> Option<(i32, i32, i32, i32)> {
        // 格式: "[left,top][right,bottom]"
        let bounds = bounds.replace(['[', ']'], "");
        let parts: Vec<&str> = bounds.split(',').collect();
        
        if parts.len() == 4 {
            let left = parts[0].parse::<i32>().ok()?;
            let top = parts[1].parse::<i32>().ok()?;
            let right = parts[2].parse::<i32>().ok()?;
            let bottom = parts[3].parse::<i32>().ok()?;
            Some((left, top, right, bottom))
        } else {
            None
        }
    }

    /// 查找可能的容器候选节点
    /// 
    /// 容器特征：
    /// - 可滚动（scrollable="true"）
    /// - 面积较大（> 屏幕20%）
    /// - 类名包含 RecyclerView/ListView/ScrollView 等
    fn find_container_candidates(&self) -> Vec<SmNodeId> {
        let mut candidates = Vec::new();

        for (idx, node) in self.indexer.all_nodes.iter().enumerate() {
            let is_container = self.is_likely_container(node);
            
            if is_container {
                candidates.push(idx as SmNodeId);
            }
        }

        // 按面积降序排序
        candidates.sort_by(|a, b| {
            let area_a = self.get_node_area(*a);
            let area_b = self.get_node_area(*b);
            area_b.cmp(&area_a)
        });

        candidates
    }

    /// 判断节点是否可能是容器
    fn is_likely_container(&self, node: &IndexedNode) -> bool {
        // 检查类名
        if let Some(class) = &node.element.class_name {
            let class_lower = class.to_lowercase();
            if class_lower.contains("recyclerview")
                || class_lower.contains("listview")
                || class_lower.contains("scrollview")
                || class_lower.contains("viewpager")
                || class_lower.contains("gridview")
            {
                return true;
            }
        }

        // 检查面积（假设屏幕 1080x1920）
        let (left, top, right, bottom) = node.bounds;
        let area = ((right - left) as i64) * ((bottom - top) as i64);
        let screen_area = 1080i64 * 1920i64;
        
        // 面积 > 屏幕20%
        if area > screen_area / 5 {
            return true;
        }

        false
    }

    /// 获取节点面积
    fn get_node_area(&self, node_id: SmNodeId) -> i64 {
        if let Some(node) = self.get_node(node_id) {
            let (left, top, right, bottom) = node.bounds;
            ((right - left) as i64) * ((bottom - top) as i64)
        } else {
            0
        }
    }

    /// 查找节点的父节点ID
    /// 
    /// 通过bounds包含关系推断父子关系：
    /// 父节点的bounds完全包含子节点的bounds
    fn find_parent(&self, node_id: SmNodeId) -> Option<SmNodeId> {
        let child_node = self.get_node(node_id)?;
        let (c_left, c_top, c_right, c_bottom) = child_node.bounds;
        
        tracing::debug!(
            "🔍 [find_parent] 查找node[{}]的父节点, bounds=({},{},{},{})",
            node_id, c_left, c_top, c_right, c_bottom
        );
        
        // 查找所有包含当前节点的节点
        let mut candidates: Vec<(SmNodeId, i64)> = Vec::new();
        let mut checked_count = 0;
        let mut contained_count = 0;
        
        for (idx, node) in self.indexer.all_nodes.iter().enumerate() {
            let idx_id = idx as SmNodeId;
            if idx_id == node_id {
                continue; // 跳过自己
            }
            
            checked_count += 1;
            let (p_left, p_top, p_right, p_bottom) = node.bounds;
            
            // 检查是否完全包含
            if p_left <= c_left && p_top <= c_top && 
               p_right >= c_right && p_bottom >= c_bottom {
                // 计算面积（用于找最近的父节点）
                let area = ((p_right - p_left) as i64) * ((p_bottom - p_top) as i64);
                contained_count += 1;
                tracing::trace!(
                    "  ✓ 候选父节点 node[{}]: bounds=({},{},{},{}), area={}",
                    idx_id, p_left, p_top, p_right, p_bottom, area
                );
                candidates.push((idx_id, area));
            }
        }
        
        tracing::debug!(
            "🔍 [find_parent] 检查了{}个节点,找到{}个包含候选",
            checked_count, contained_count
        );
        
        // 返回面积最小的那个（最近的父节点）
        candidates.sort_by_key(|(_, area)| *area);
        let result = candidates.first().map(|(id, _)| *id);
        
        if let Some(parent_id) = result {
            tracing::info!(
                "✅ [find_parent] node[{}]的父节点是node[{}]",
                node_id, parent_id
            );
        } else {
            tracing::warn!(
                "⚠️ [find_parent] node[{}]没有找到父节点！",
                node_id
            );
        }
        
        result
    }

    /// 查找节点的子节点ID列表
    /// 
    /// 通过bounds包含关系推断父子关系：
    /// 子节点的bounds被父节点的bounds完全包含
    fn find_children(&self, node_id: SmNodeId) -> Vec<SmNodeId> {
        let parent_node = match self.get_node(node_id) {
            Some(node) => node,
            None => return Vec::new(),
        };
        
        let (p_left, p_top, p_right, p_bottom) = parent_node.bounds;
        let mut children = Vec::new();
        
        for (idx, node) in self.indexer.all_nodes.iter().enumerate() {
            let idx_id = idx as SmNodeId;
            if idx_id == node_id {
                continue; // 跳过自己
            }
            
            let (c_left, c_top, c_right, c_bottom) = node.bounds;
            
            // 检查是否被完全包含
            if c_left >= p_left && c_top >= p_top && 
               c_right <= p_right && c_bottom <= p_bottom {
                // 验证是否是直接子节点（不是孙子节点）
                // 通过检查是否有中间层节点来判断
                let is_direct_child = self.is_direct_child(node_id, idx_id);
                if is_direct_child {
                    children.push(idx_id);
                }
            }
        }
        
        children
    }
    
    /// 判断是否是直接子节点（非孙子节点）
    fn is_direct_child(&self, parent_id: SmNodeId, child_id: SmNodeId) -> bool {
        let parent_node = match self.get_node(parent_id) {
            Some(node) => node,
            None => return false,
        };
        let child_node = match self.get_node(child_id) {
            Some(node) => node,
            None => return false,
        };
        
        let (p_left, p_top, p_right, p_bottom) = parent_node.bounds;
        let (c_left, c_top, c_right, c_bottom) = child_node.bounds;
        
        // 检查是否有中间节点
        for (idx, node) in self.indexer.all_nodes.iter().enumerate() {
            let idx_id = idx as SmNodeId;
            if idx_id == parent_id || idx_id == child_id {
                continue;
            }
            
            let (m_left, m_top, m_right, m_bottom) = node.bounds;
            
            // 如果存在节点M，满足：parent包含M，M包含child
            // 则child不是parent的直接子节点
            if m_left >= p_left && m_top >= p_top && m_right <= p_right && m_bottom <= p_bottom &&
               c_left >= m_left && c_top >= m_top && c_right <= m_right && c_bottom <= m_bottom {
                return false;
            }
        }
        
        true
    }
    
    /// 通过bounds查找节点ID
    pub fn find_node_by_bounds(&self, bounds: (i32, i32, i32, i32)) -> Option<SmNodeId> {
        tracing::debug!("🔍 [XmlIndexer] 开始查找bounds: {:?}, 共{}个节点", bounds, self.indexer.all_nodes.len());
        
        // 查找完全匹配的节点
        for (idx, node) in self.indexer.all_nodes.iter().enumerate() {
            if node.bounds == bounds {
                tracing::info!("✅ [XmlIndexer] 找到匹配节点: idx={}, id={}, bounds={:?}", idx, node.id, node.bounds);
                return Some(idx as SmNodeId);
            }
        }
        
        // 如果找不到，打印目标区域附近的节点（index 30-40）
        tracing::warn!("⚠️ [XmlIndexer] 未找到完全匹配的bounds，打印index 30-40的节点:");
        for idx in 30..=40 {
            if let Some(node) = self.indexer.all_nodes.get(idx) {
                tracing::warn!("   节点{}: id={}, bounds={:?}, class={:?}", 
                    idx, 
                    node.id, 
                    node.bounds,
                    node.element.class_name
                );
            }
        }
        
        None
    }
}

impl<'a> SmXmlView for XmlIndexerAdapter<'a> {
    fn xml_hash(&self) -> &str {
        &self.xml_hash
    }

    fn container_candidates(&self) -> Vec<SmNodeId> {
        self.find_container_candidates()
    }

    fn bounds(&self, node_id: SmNodeId) -> SmBounds {
        if let Some(node) = self.get_node(node_id) {
            self.parse_bounds_to_sm(node.element.bounds.clone())
        } else {
            SmBounds {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            }
        }
    }

    fn parent(&self, node_id: SmNodeId) -> Option<SmNodeId> {
        self.find_parent(node_id)
    }

    fn children(&self, node_id: SmNodeId) -> Vec<SmNodeId> {
        self.find_children(node_id)
    }

    fn class(&self, node_id: SmNodeId) -> &str {
        self.get_node(node_id)
            .and_then(|node| node.element.class_name.as_deref())
            .unwrap_or("")
    }

    fn text(&self, node_id: SmNodeId) -> &str {
        self.get_node(node_id)
            .map(|node| node.element.text.as_str())
            .unwrap_or("")
    }

    fn attr(&self, node_id: SmNodeId, key: &str) -> Option<&str> {
        let node = self.get_node(node_id)?;
        
        match key {
            "resource-id" | "resource_id" => node.element.resource_id.as_deref(),
            "content-desc" | "content_desc" => Some(node.element.content_desc.as_str()),
            "package" => node.element.package_name.as_deref(),
            "clickable" => Some(if node.element.clickable { "true" } else { "false" }),
            "enabled" => Some(if node.element.enabled { "true" } else { "false" }),
            _ => None,
        }
    }

    fn pre(&self, node_id: SmNodeId) -> u32 {
        // 使用节点ID作为前序遍历序号
        node_id
    }

    fn post(&self, node_id: SmNodeId) -> u32 {
        // 使用节点ID+总数作为后序遍历序号（简化实现）
        node_id + self.indexer.all_nodes.len() as u32
    }
}

// 🔥 新增：实现 UiTree trait，供容器限域模块使用
impl<'a> UiTree for XmlIndexerAdapter<'a> {
    fn root_id(&self) -> NodeId {
        0 // 假设根节点ID为0
    }

    fn parent(&self, id: NodeId) -> Option<NodeId> {
        self.find_parent(id)
    }

    fn children(&self, id: NodeId) -> Vec<NodeId> {
        self.find_children(id)
    }

    fn class(&self, id: NodeId) -> &str {
        self.get_node(id)
            .and_then(|node| node.element.class_name.as_deref())
            .unwrap_or("")
    }

    fn element_id(&self, id: NodeId) -> Option<&str> {
        // ✅ 新增: 返回元素的id属性(如"element_32")
        // XmlIndexer中每个节点有唯一的id字符串
        self.get_node(id)
            .map(|node| node.id.as_str())
    }

    fn resource_id(&self, id: NodeId) -> Option<&str> {
        self.get_node(id)
            .and_then(|node| node.element.resource_id.as_deref())
    }

    fn content_desc(&self, id: NodeId) -> Option<&str> {
        self.get_node(id)
            .map(|node| node.element.content_desc.as_str())
    }

    fn text(&self, id: NodeId) -> Option<&str> {
        self.get_node(id)
            .map(|node| node.element.text.as_str())
    }

    fn bounds(&self, id: NodeId) -> Bounds {
        if let Some(node) = self.get_node(id) {
            let (l, t, r, b) = node.bounds;
            Bounds { l, t, r, b }
        } else {
            Bounds { l: 0, t: 0, r: 0, b: 0 }
        }
    }

    fn is_clickable(&self, id: NodeId) -> bool {
        self.get_node(id)
            .and_then(|node| Some(node.element.clickable))
            .unwrap_or(false)
    }

    fn is_scrollable(&self, id: NodeId) -> bool {
        self.get_node(id)
            .map(|node| node.element.scrollable)
            .unwrap_or(false)
    }

    fn is_dialog_like(&self, id: NodeId) -> bool {
        let class_name = UiTree::class(self, id).to_lowercase();
        class_name.contains("dialog")
            || class_name.contains("bottomsheet")
            || class_name.contains("sheet")
            || class_name.contains("popup")
    }

    fn node_by_xpath(&self, xpath: &str) -> Option<NodeId> {
        // 简化实现：通过类名匹配
        // 例如：//RecyclerView[@scrollable='true']
        
        // 提取类名
        let class_name = if let Some(start) = xpath.find("//") {
            let rest = &xpath[start + 2..];
            if let Some(end) = rest.find('[').or_else(|| Some(rest.len())) {
                &rest[..end]
            } else {
                rest
            }
        } else {
            return None;
        };

        // 查找匹配的节点
        for (idx, node) in self.indexer.all_nodes.iter().enumerate() {
            if let Some(node_class) = &node.element.class_name {
                if node_class.ends_with(class_name) {
                    // 检查额外的属性约束（如 @scrollable='true'）
                    if xpath.contains("@scrollable='true'") {
                        // 通过类名判断是否可滚动
                        let class_lower = node_class.to_lowercase();
                        if class_lower.contains("recyclerview")
                            || class_lower.contains("listview")
                            || class_lower.contains("scrollview")
                        {
                            return Some(idx as NodeId);
                        }
                    } else {
                        return Some(idx as NodeId);
                    }
                }
            }
        }

        None
    }

    fn node_count(&self) -> usize {
        // ✅ 新增: 返回XmlIndexer中的节点总数
        self.indexer.all_nodes.len()
    }

    fn screen_size(&self) -> (i32, i32) {
        // 默认屏幕尺寸（1080x1920）
        // TODO: 从XML或设备信息获取实际屏幕尺寸
        (1080, 1920)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bounds_parsing() {
        let adapter = XmlIndexerAdapter {
            indexer: &XmlIndexer {
                resource_id_index: HashMap::new(),
                class_name_index: HashMap::new(),
                text_index: HashMap::new(),
                content_desc_index: HashMap::new(),
                container_index: HashMap::new(),
                all_nodes: Vec::new(),
                raw_xml: String::new(),
            },
            node_map: HashMap::new(),
            xml_hash: "test_hash".to_string(),
        };

        let bounds_str = "[100,200][300,400]";
        let result = adapter.parse_bounds_string(bounds_str);
        assert_eq!(result, Some((100, 200, 300, 400)));
    }
}

