// src-tauri/src/domain/element_match/heuristic/xpath.rs
// module: element_match | layer: domain | role: XPath启发式匹配器
// summary: 迁移自 XPathDirectStrategyProcessor，实现 ElementMatcher 接口

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::{MatchMode, MatchResult};
use crate::services::execution::matching::smart_xpath_generator::{SmartXPathGenerator, ElementAttributes};
use std::collections::HashMap;

pub struct XPathMatcher {
    generator: SmartXPathGenerator,
}

impl XPathMatcher {
    pub fn new() -> Self {
        Self {
            generator: SmartXPathGenerator::new(),
        }
    }

    fn extract_attributes(&self, ctx: &MatchContext) -> ElementAttributes {
        let node = &ctx.xml_indexer.all_nodes[ctx.clicked_node_index];
        let element = &node.element;
        
        // Force recompile
        let mut attrs = HashMap::new();
        
        if let Some(id) = &element.resource_id {
            if !id.is_empty() {
                attrs.insert("resource-id".to_string(), id.clone());
            }
        }
        if !element.text.is_empty() {
            attrs.insert("text".to_string(), element.text.clone());
        }
        if !element.content_desc.is_empty() {
            attrs.insert("content-desc".to_string(), element.content_desc.clone());
        }
        if let Some(cls) = &element.class_name {
            if !cls.is_empty() {
                attrs.insert("class".to_string(), cls.clone());
            }
        }
        
        // 添加 bounds 信息
        attrs.insert("bounds".to_string(), format!("[{},{}][{},{}]", 
            element.bounds.left, element.bounds.top, 
            element.bounds.right, element.bounds.bottom));
            
        attrs
    }
}

impl ElementMatcher for XPathMatcher {
    fn id(&self) -> &str {
        "heuristic.xpath"
    }

    fn match_element(&self, ctx: &MatchContext) -> MatchResult {
        let attributes = self.extract_attributes(ctx);
        
        // 生成 XPath 候选项
        let candidates = self.generator.generate_candidates(&attributes);
        
        if let Some(best) = candidates.first() {
            MatchResult {
                mode: MatchMode::HeuristicXPath,
                confidence: best.confidence as f32,
                passed_gate: best.confidence > 0.6,
                explain: format!("生成XPath: {} (策略: {:?})", best.xpath, best.strategy),
            }
        } else {
            MatchResult {
                mode: MatchMode::HeuristicXPath,
                confidence: 0.0,
                passed_gate: false,
                explain: "无法生成有效XPath".to_string(),
            }
        }
    }
}
