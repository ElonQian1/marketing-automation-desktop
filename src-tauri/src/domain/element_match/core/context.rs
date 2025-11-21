// src-tauri/src/domain/element_match/core/context.rs
// module: element_match | layer: domain | role: 匹配上下文
// summary: 包含所有匹配所需的线索：XML索引、点击位置、归一化结果等

use crate::engine::xml_indexer::XmlIndexer;
use crate::domain::structure_runtime_match::click_normalizer::ClickNormalizeResult;

pub struct MatchContext<'a> {
    pub xml_indexer: &'a XmlIndexer,
    pub clicked_node_index: usize,
    
    // 可选的归一化结果（如果点击在容器内）
    pub normalize_result: Option<&'a ClickNormalizeResult>,
    
    // 手动指定的父节点（用于兜底模式）
    pub fallback_clickable_parent_index: Option<usize>,
}

impl<'a> MatchContext<'a> {
    pub fn new(
        xml_indexer: &'a XmlIndexer, 
        clicked_node_index: usize,
        normalize_result: Option<&'a ClickNormalizeResult>
    ) -> Self {
        Self {
            xml_indexer,
            clicked_node_index,
            normalize_result,
            fallback_clickable_parent_index: None,
        }
    }

    pub fn with_fallback_parent(mut self, parent_index: usize) -> Self {
        self.fallback_clickable_parent_index = Some(parent_index);
        self
    }

    /// 获取有效的 clickable_parent 索引
    /// 优先使用 normalize_result 中的，其次使用 fallback，最后回退到 clicked_node
    pub fn get_clickable_parent_index(&self) -> usize {
        if let Some(norm) = self.normalize_result {
            norm.clickable_parent.node_index
        } else if let Some(idx) = self.fallback_clickable_parent_index {
            idx
        } else {
            self.clicked_node_index
        }
    }

    /// 获取有效的 card_root 索引
    /// 仅当 normalize_result 存在时有效
    pub fn get_card_root_index(&self) -> Option<usize> {
        self.normalize_result.map(|n| n.card_root.node_index)
    }
}
