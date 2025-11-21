// src-tauri/src/domain/element_match/heuristic/id.rs
// module: element_match | layer: domain | role: ResourceId匹配器
// summary: 基于 resource-id 的启发式匹配

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::{MatchMode, MatchResult};

pub struct ResourceIdMatcher;

impl ResourceIdMatcher {
    pub fn new() -> Self {
        Self
    }

    fn is_valid_id(&self, id: &str) -> bool {
        if id.is_empty() || id == "NO_ID" {
            return false;
        }
        // 过滤掉常见的无效ID模式
        if id.contains("container") || id.contains("wrapper") {
            // 这些通常是通用容器，特异性不够，但仍然是有效ID
            // 这里可以根据业务需求调整
        }
        true
    }
}

impl ElementMatcher for ResourceIdMatcher {
    fn id(&self) -> &str {
        "heuristic.resource_id"
    }

    fn match_element(&self, ctx: &MatchContext) -> MatchResult {
        let node = &ctx.xml_indexer.all_nodes[ctx.clicked_node_index];
        let resource_id = node.element.resource_id.as_deref().unwrap_or("");

        if self.is_valid_id(resource_id) {
            MatchResult {
                mode: MatchMode::HeuristicId,
                confidence: 0.95, // ID通常具有很高的置信度
                passed_gate: true,
                explain: format!("发现有效Resource ID: {}", resource_id),
            }
        } else {
            MatchResult {
                mode: MatchMode::HeuristicId,
                confidence: 0.0,
                passed_gate: false,
                explain: "无有效Resource ID".to_string(),
            }
        }
    }
}
