// src-tauri/src/domain/structure_runtime_match/adapters/xml_indexer_adapter.rs
// module: structure_runtime_match | layer: domain | role: XmlIndexer适配器
// summary: 实现SmXmlView trait，连接现有XmlIndexer到结构匹配算法

use crate::domain::structure_runtime_match::ports::xml_view::SmXmlView;
use crate::domain::structure_runtime_match::types::{SmBounds, SmNodeId};
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
            .map(|(idx, node)| {
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

    /// 获取节点引用
    fn get_node(&self, node_id: SmNodeId) -> Option<&IndexedNode> {
        self.node_map
            .get(&node_id)
            .and_then(|&idx| self.indexer.all_nodes.get(idx))
    }

    /// 解析bounds字符串为SmBounds
    fn parse_bounds_to_sm(&self, bounds_str: Option<&String>) -> SmBounds {
        if let Some(bounds) = bounds_str {
            // bounds格式: "[left,top][right,bottom]"
            if let Some((left, top, right, bottom)) = self.parse_bounds_string(bounds) {
                return SmBounds {
                    left,
                    top,
                    right,
                    bottom,
                };
            }
        }

        // 默认返回空bounds
        SmBounds {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
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
        if let Some(class) = &node.element.class {
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
    /// TODO: 当前 XmlIndexer 没有维护父子关系，需要通过其他方式推断
    /// 临时实现：返回 None
    fn find_parent(&self, _node_id: SmNodeId) -> Option<SmNodeId> {
        // TODO: 实现父子关系查找
        None
    }

    /// 查找节点的子节点ID列表
    /// 
    /// TODO: 当前 XmlIndexer 没有维护父子关系，需要通过其他方式推断
    /// 临时实现：返回空列表
    fn find_children(&self, _node_id: SmNodeId) -> Vec<SmNodeId> {
        // TODO: 实现父子关系查找
        Vec::new()
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
            self.parse_bounds_to_sm(node.element.bounds.as_ref())
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
            .and_then(|node| node.element.class.as_deref())
            .unwrap_or("")
    }

    fn text(&self, node_id: SmNodeId) -> &str {
        self.get_node(node_id)
            .and_then(|node| node.element.text.as_deref())
            .unwrap_or("")
    }

    fn attr(&self, node_id: SmNodeId, key: &str) -> Option<&str> {
        let node = self.get_node(node_id)?;
        
        match key {
            "resource-id" | "resource_id" => node.element.resource_id.as_deref(),
            "content-desc" | "content_desc" => node.element.content_desc.as_deref(),
            "package" => node.element.package.as_deref(),
            "clickable" => node.element.clickable.as_ref().map(|b| if *b { "true" } else { "false" }),
            "enabled" => node.element.enabled.as_ref().map(|b| if *b { "true" } else { "false" }),
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
            },
            node_map: HashMap::new(),
            xml_hash: "test_hash".to_string(),
        };

        let bounds_str = "[100,200][300,400]";
        let result = adapter.parse_bounds_string(bounds_str);
        assert_eq!(result, Some((100, 200, 300, 400)));
    }
}
