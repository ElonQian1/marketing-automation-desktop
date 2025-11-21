// src-tauri/src/services/unified_match_service.rs
// module: services | layer: services | role: 统一元素匹配服务
// summary: 使用新的 domain/element_match 架构进行元素匹配分析

use std::sync::Arc;
use anyhow::Result;
use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::types::MatchResult;
use crate::domain::element_match::pipeline::processor::MatchPipeline;
use crate::domain::element_match::structural::subtree::SubtreeMatcher;
use crate::domain::element_match::structural::leaf::LeafContextMatcher;
use crate::domain::element_match::textual::exact::TextExactMatcher;
use crate::domain::element_match::heuristic::xpath::XPathMatcher;
use crate::domain::element_match::heuristic::id::ResourceIdMatcher;
use crate::engine::xml_indexer::XmlIndexer;
use crate::domain::structure_runtime_match::click_normalizer::ClickNormalizeResult;

pub struct UnifiedMatchService {
    pipeline: MatchPipeline,
}

impl UnifiedMatchService {
    pub fn new() -> Self {
        let pipeline = MatchPipeline::new()
            .add_matcher(SubtreeMatcher::new())
            .add_matcher(LeafContextMatcher::new())
            .add_matcher(TextExactMatcher::new())
            .add_matcher(XPathMatcher::new())
            .add_matcher(ResourceIdMatcher::new());
            
        Self { pipeline }
    }

    pub fn analyze_element(
        &self,
        xml_indexer: Arc<XmlIndexer>,
        clicked_node_index: usize,
        normalize_result: Option<&ClickNormalizeResult>,
    ) -> Result<Vec<MatchResult>> {
        
        // 计算 fallback_clickable_parent_index (如果 normalize_result 为空)
        let fallback_clickable_parent_index = if normalize_result.is_none() {
             let mut current_idx = clicked_node_index;
             let mut found_clickable = false;
             
             // 向上寻找最近的 clickable=true 祖先
             while let Some(node) = xml_indexer.all_nodes.get(current_idx) {
                 if node.element.clickable {
                     found_clickable = true;
                     break;
                 }
                 if let Some(parent_idx) = node.parent_index {
                     current_idx = parent_idx;
                 } else {
                     break;
                 }
             }
             
             if found_clickable { Some(current_idx) } else { None }
        } else {
            None
        };

        // 1. 构建匹配上下文
        let context = MatchContext {
            xml_indexer: &xml_indexer,
            clicked_node_index,
            normalize_result,
            fallback_clickable_parent_index,
        };

        // 2. 执行流水线
        let results = self.pipeline.execute(&context);
        
        Ok(results)
    }
    
    pub fn analyze_element_with_context(
        &self,
        context: &MatchContext
    ) -> Vec<MatchResult> {
        self.pipeline.execute(context)
    }
}
