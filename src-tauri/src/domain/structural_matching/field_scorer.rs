// src-tauri/src/domain/structural_matching/field_scorer.rs
// module: structural_matching | layer: domain | role: 字段评分器
// summary: 支持细粒度匹配策略的字段评分逻辑实现

use super::models::{FieldMatchResult, FieldType, MatchStrategy, ScoringRules, StructuralFieldConfig};
use serde_json::Value;

/// 字段评分器特质
pub trait FieldScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult;
}

/// 通用字段评分器 - 支持所有匹配策略
pub struct UniversalFieldScorer;

impl UniversalFieldScorer {
    /// 根据策略计算得分
    fn calculate_score_by_strategy(
        &self,
        template_str: &str,
        target_str: &str,
        strategy: MatchStrategy,
        scoring_rules: &ScoringRules,
        field_type: FieldType,
    ) -> (f64, bool, String) {
        match strategy {
            MatchStrategy::ExactMatch => self.exact_match_strategy(template_str, target_str, scoring_rules),
            MatchStrategy::BothNonEmpty => self.both_non_empty_strategy(template_str, target_str, scoring_rules),
            MatchStrategy::ConsistentEmptiness => self.consistent_emptiness_strategy(template_str, target_str, scoring_rules),
            MatchStrategy::StructureMatch => self.structure_match_strategy(template_str, target_str, scoring_rules),
            MatchStrategy::ValueSimilarity => self.value_similarity_strategy(template_str, target_str, scoring_rules),
            MatchStrategy::Disabled => (0.0, false, format!("{:?}字段已禁用", field_type)),
        }
    }

    /// 值完全匹配策略：值完全一样（高分），都非空（低分）
    fn exact_match_strategy(&self, template: &str, target: &str, rules: &ScoringRules) -> (f64, bool, String) {
        match (template.is_empty(), target.is_empty()) {
            (false, false) if template == target => {
                (rules.exact_match, true, "值完全匹配".to_string())
            }
            (false, false) => {
                (rules.both_non_empty, true, "都非空但值不同".to_string())
            }
            (true, true) => {
                (rules.both_empty, true, "都为空".to_string())
            }
            _ => {
                (rules.mismatch_penalty, false, "空值状态不一致".to_string())
            }
        }
    }

    /// 都非空即可策略：重点是确保都有值，不在意具体内容
    fn both_non_empty_strategy(&self, template: &str, target: &str, rules: &ScoringRules) -> (f64, bool, String) {
        match (template.is_empty(), target.is_empty()) {
            (false, false) => {
                (rules.both_non_empty, true, "都非空通过".to_string())
            }
            (true, true) => {
                (rules.both_empty * 0.5, false, "都为空，不符合非空要求".to_string())
            }
            _ => {
                (rules.mismatch_penalty, false, "只有一个非空".to_string())
            }
        }
    }

    /// 保持空/非空一致策略：要么都空，要么都非空
    fn consistent_emptiness_strategy(&self, template: &str, target: &str, rules: &ScoringRules) -> (f64, bool, String) {
        match (template.is_empty(), target.is_empty()) {
            (false, false) => {
                (rules.both_non_empty, true, "都非空保持一致".to_string())
            }
            (true, true) => {
                (rules.both_empty, true, "都为空保持一致".to_string())
            }
            _ => {
                (rules.mismatch_penalty, false, "空值状态不一致".to_string())
            }
        }
    }

    /// 结构匹配策略：用于子元素等结构性数据
    fn structure_match_strategy(&self, template: &str, target: &str, rules: &ScoringRules) -> (f64, bool, String) {
        // 对于非结构性字段，降级为精确匹配
        if template == target {
            (rules.exact_match, true, "结构数据完全匹配".to_string())
        } else if !template.is_empty() && !target.is_empty() {
            (rules.both_non_empty * 0.8, true, "结构数据都存在".to_string())
        } else {
            (rules.mismatch_penalty, false, "结构数据不匹配".to_string())
        }
    }

    /// 值相似匹配策略：允许一定程度的差异
    fn value_similarity_strategy(&self, template: &str, target: &str, rules: &ScoringRules) -> (f64, bool, String) {
        if template == target {
            (rules.exact_match, true, "值完全相同".to_string())
        } else if template.is_empty() || target.is_empty() {
            (rules.mismatch_penalty, false, "有空值，无法比较相似性".to_string())
        } else {
            // 简单的相似性检查 - 可以扩展为更复杂的算法
            let similarity = self.calculate_similarity(template, target);
            if similarity > 0.7 {
                (rules.both_non_empty * similarity, true, format!("相似度{:.1}%", similarity * 100.0))
            } else {
                (rules.mismatch_penalty, false, format!("相似度过低{:.1}%", similarity * 100.0))
            }
        }
    }

    /// 计算字符串相似度
    fn calculate_similarity(&self, a: &str, b: &str) -> f64 {
        if a == b {
            return 1.0;
        }
        
        // 简化的相似度算法：基于公共字符
        let a_chars: std::collections::HashSet<char> = a.chars().collect();
        let b_chars: std::collections::HashSet<char> = b.chars().collect();
        
        let intersection = a_chars.intersection(&b_chars).count();
        let union = a_chars.union(&b_chars).count();
        
        if union == 0 {
            0.0
        } else {
            intersection as f64 / union as f64
        }
    }
}

impl FieldScorer for UniversalFieldScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult {
        let template_str = template_value.as_str().unwrap_or("");
        let target_str = target_value.as_str().unwrap_or("");
        
        // 优先使用细粒度策略，否则使用传统匹配模式
        let strategy = config.strategy.unwrap_or_else(|| {
            // 从传统MatchMode转换为MatchStrategy
            match config.match_mode {
                super::models::MatchMode::Exact => MatchStrategy::ExactMatch,
                super::models::MatchMode::NonEmpty => MatchStrategy::BothNonEmpty,
                super::models::MatchMode::Empty => MatchStrategy::ConsistentEmptiness,
                super::models::MatchMode::Structure => MatchStrategy::StructureMatch,
                super::models::MatchMode::Disabled => MatchStrategy::Disabled,
            }
        });
        
        let (score, matched, reason) = self.calculate_score_by_strategy(
            template_str,
            target_str,
            strategy,
            &config.scoring_rules,
            config.field_type,
        );
        
        // 计算最大可能得分
        let max_score = match strategy {
            MatchStrategy::Disabled => 0.0,
            _ => config.scoring_rules.exact_match.max(config.scoring_rules.both_non_empty).max(config.scoring_rules.both_empty),
        };
        
        FieldMatchResult {
            field_type: config.field_type,
            score: score * config.weight,
            max_score: max_score * config.weight,
            matched,
            reason: format!("[{:?}] {}", strategy, reason),
        }
    }
}

/// 子元素结构评分器 - 专门处理结构性数据
pub struct ChildrenStructureScorer;

impl ChildrenStructureScorer {
    fn score_structure_strategy(&self, template_value: &Value, target_value: &Value, rules: &ScoringRules) -> (f64, bool, String) {
        let empty_vec = vec![];
        let template_children = template_value.as_array().unwrap_or(&empty_vec);
        let target_children = target_value.as_array().unwrap_or(&empty_vec);
        
        if template_children.len() == target_children.len() {
            // 比较每个子元素的类名
            let template_classes: Vec<&str> = template_children
                .iter()
                .filter_map(|c| c.get("class").and_then(|v| v.as_str()))
                .collect();
            let target_classes: Vec<&str> = target_children
                .iter()
                .filter_map(|c| c.get("class").and_then(|v| v.as_str()))
                .collect();
            
            if template_classes == target_classes {
                (rules.exact_match, true, "子元素结构完全匹配".to_string())
            } else {
                (rules.both_non_empty * 0.7, true, "子元素数量一致但类型不同".to_string())
            }
        } else {
            (rules.mismatch_penalty, false, format!("子元素数量不同: {} vs {}", template_children.len(), target_children.len()))
        }
    }
}

impl FieldScorer for ChildrenStructureScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult {
        let strategy = config.strategy.unwrap_or(MatchStrategy::StructureMatch);
        
        let (score, matched, reason) = match strategy {
            MatchStrategy::StructureMatch => self.score_structure_strategy(template_value, target_value, &config.scoring_rules),
            MatchStrategy::Disabled => (0.0, false, "子元素结构字段已禁用".to_string()),
            _ => {
                // 对于非结构策略，降级为通用评分器
                let scorer = UniversalFieldScorer;
                let result = scorer.score(template_value, target_value, config);
                return result;
            }
        };
        
        FieldMatchResult {
            field_type: FieldType::ChildrenStructure,
            score: score * config.weight,
            max_score: config.scoring_rules.exact_match * config.weight,
            matched,
            reason: format!("[{:?}] {}", strategy, reason),
        }
    }
}

/// 获取字段评分器
pub fn get_field_scorer(field_type: FieldType) -> Box<dyn FieldScorer> {
    match field_type {
        FieldType::ChildrenStructure => Box::new(ChildrenStructureScorer),
        _ => Box::new(UniversalFieldScorer),
    }
}
