// src-tauri/src/domain/element_match/heuristic/id.rs
// module: element_match | layer: domain | role: ResourceId匹配器
// summary: 基于 resource-id 的启发式匹配，集成稳定性评估

use crate::domain::element_match::core::context::MatchContext;
use crate::domain::element_match::core::traits::ElementMatcher;
use crate::domain::element_match::core::types::{MatchMode, MatchResult};
use super::id_stability::{IdStabilityAnalyzer, IdStabilityAssessment};

/// Resource-ID 匹配器
/// 
/// 设计理念（长期主义）：
/// - 不盲目信任ID：混淆ID、动态ID即使当前能匹配，也会在应用更新后失效
/// - 稳定性优先：只有稳定的ID才给高置信度
/// - 防御式降权：可疑ID降权，让系统优先使用更可靠的策略（如text匹配）
pub struct ResourceIdMatcher {
    stability_analyzer: IdStabilityAnalyzer,
}

impl ResourceIdMatcher {
    pub fn new() -> Self {
        Self {
            stability_analyzer: IdStabilityAnalyzer::new(),
        }
    }

    /// 判断ID是否基本有效（非空、非占位符）
    fn is_valid_id(&self, id: &str) -> bool {
        !id.is_empty() && id != "NO_ID"
    }

    /// 计算基于稳定性的置信度
    /// 
    /// 置信度计算公式：
    /// - 基础分 0.95（ID匹配的理论最高分）
    /// - × 稳定性系数（0.0 - 1.0）
    /// - 最低保底 0.1（即使是混淆ID，也提供微弱信号）
    fn calculate_confidence(&self, assessment: &IdStabilityAssessment) -> f64 {
        const BASE_CONFIDENCE: f64 = 0.95;
        const MIN_CONFIDENCE: f64 = 0.1;

        let adjusted = BASE_CONFIDENCE * assessment.stability_score;
        adjusted.max(MIN_CONFIDENCE)
    }

    /// 生成详细的评估说明
    fn generate_explanation(&self, resource_id: &str, assessment: &IdStabilityAssessment) -> String {
        let stability_label = if assessment.stability_score >= 0.8 {
            "✅ 稳定"
        } else if assessment.stability_score >= 0.5 {
            "⚠️ 一般"
        } else {
            "❌ 不稳定"
        };

        format!(
            "Resource ID: {} [{}] - {}",
            resource_id,
            stability_label,
            assessment.reason
        )
    }
}

impl Default for ResourceIdMatcher {
    fn default() -> Self {
        Self::new()
    }
}

impl ElementMatcher for ResourceIdMatcher {
    fn id(&self) -> &str {
        "heuristic.resource_id"
    }

    fn match_element(&self, ctx: &MatchContext) -> MatchResult {
        let node = &ctx.xml_indexer.all_nodes[ctx.clicked_node_index];
        let resource_id = node.element.resource_id.as_deref().unwrap_or("");

        // 第一步：基本有效性检查
        if !self.is_valid_id(resource_id) {
            return MatchResult {
                mode: MatchMode::HeuristicId,
                confidence: 0.0,
                passed_gate: false,
                explain: "无有效Resource ID".to_string(),
            };
        }

        // 第二步：稳定性评估
        let assessment = self.stability_analyzer.assess(resource_id);
        let confidence = self.calculate_confidence(&assessment) as f32;  // 转换为 f32
        let explanation = self.generate_explanation(resource_id, &assessment);

        // 第三步：决定是否通过门禁
        // 只有稳定性足够且置信度达标才通过
        let passed_gate = assessment.should_trust && confidence >= 0.5;

        // 记录日志（帮助调试）
        if !assessment.should_trust {
            tracing::warn!(
                "⚠️ [ID稳定性] 不信任的ID: {} - 原因: {} - 置信度降至: {:.2}",
                resource_id,
                assessment.reason,
                confidence
            );
        }

        MatchResult {
            mode: MatchMode::HeuristicId,
            confidence,
            passed_gate,
            explain: explanation,
        }
    }
}
