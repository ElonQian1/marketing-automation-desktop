// src-tauri/src/domain/structural_matching/field_scorer.rs
// module: structural_matching | layer: domain | role: 字段评分器
// summary: 各字段的评分逻辑实现

use super::models::{FieldMatchResult, FieldType, ScoringRules, StructuralFieldConfig};
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

/// Resource-ID 评分器
pub struct ResourceIdScorer;

impl FieldScorer for ResourceIdScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult {
        let template_str = template_value.as_str().unwrap_or("");
        let target_str = target_value.as_str().unwrap_or("");
        
        let (score, matched, reason) = match (template_str.is_empty(), target_str.is_empty()) {
            (false, false) if template_str == target_str => {
                (config.scoring_rules.exact_match, true, "Resource-ID完全匹配".to_string())
            }
            (false, false) => {
                (config.scoring_rules.both_non_empty, true, "Resource-ID都非空".to_string())
            }
            (true, true) => {
                (config.scoring_rules.both_empty, true, "Resource-ID都为空".to_string())
            }
            _ => {
                (config.scoring_rules.mismatch_penalty, false, "Resource-ID不匹配".to_string())
            }
        };
        
        FieldMatchResult {
            field_type: FieldType::ResourceId,
            score: score * config.weight,
            max_score: config.scoring_rules.exact_match * config.weight,
            matched,
            reason,
        }
    }
}

/// Content-Desc 评分器
pub struct ContentDescScorer;

impl FieldScorer for ContentDescScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult {
        let template_str = template_value.as_str().unwrap_or("");
        let target_str = target_value.as_str().unwrap_or("");
        
        let (score, matched, reason) = match (template_str.is_empty(), target_str.is_empty()) {
            (false, false) if template_str == target_str => {
                (config.scoring_rules.exact_match, true, "Content-Desc完全匹配".to_string())
            }
            (false, false) => {
                (config.scoring_rules.both_non_empty, true, "Content-Desc都非空".to_string())
            }
            (true, true) => {
                (config.scoring_rules.both_empty, true, "Content-Desc都为空".to_string())
            }
            _ => {
                (config.scoring_rules.mismatch_penalty, false, "Content-Desc不匹配".to_string())
            }
        };
        
        FieldMatchResult {
            field_type: FieldType::ContentDesc,
            score: score * config.weight,
            max_score: config.scoring_rules.exact_match * config.weight,
            matched,
            reason,
        }
    }
}

/// Text 评分器
pub struct TextScorer;

impl FieldScorer for TextScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult {
        let template_str = template_value.as_str().unwrap_or("");
        let target_str = target_value.as_str().unwrap_or("");
        
        let (score, matched, reason) = match (template_str.is_empty(), target_str.is_empty()) {
            (false, false) => {
                (config.scoring_rules.both_non_empty, true, "Text都非空".to_string())
            }
            (true, true) => {
                (config.scoring_rules.both_empty, true, "Text都为空".to_string())
            }
            _ => {
                (config.scoring_rules.mismatch_penalty, false, "Text不匹配".to_string())
            }
        };
        
        FieldMatchResult {
            field_type: FieldType::Text,
            score: score * config.weight,
            max_score: config.scoring_rules.both_non_empty.max(config.scoring_rules.both_empty) * config.weight,
            matched,
            reason,
        }
    }
}

/// ClassName 评分器
pub struct ClassNameScorer;

impl FieldScorer for ClassNameScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult {
        let template_str = template_value.as_str().unwrap_or("");
        let target_str = target_value.as_str().unwrap_or("");
        
        let (score, matched, reason) = if template_str == target_str && !template_str.is_empty() {
            (config.scoring_rules.exact_match, true, format!("ClassName匹配: {}", template_str))
        } else if !template_str.is_empty() && !target_str.is_empty() {
            (config.scoring_rules.both_non_empty, false, "ClassName不同".to_string())
        } else {
            (config.scoring_rules.mismatch_penalty, false, "ClassName不匹配".to_string())
        };
        
        FieldMatchResult {
            field_type: FieldType::ClassName,
            score: score * config.weight,
            max_score: config.scoring_rules.exact_match * config.weight,
            matched,
            reason,
        }
    }
}

/// 子元素结构评分器
pub struct ChildrenStructureScorer;

impl FieldScorer for ChildrenStructureScorer {
    fn score(
        &self,
        template_value: &Value,
        target_value: &Value,
        config: &StructuralFieldConfig,
    ) -> FieldMatchResult {
        // 简化版：比较子元素数量和类名序列
        let empty_vec = vec![];
        let template_children = template_value.as_array().unwrap_or(&empty_vec);
        let target_children = target_value.as_array().unwrap_or(&empty_vec);
        
        let (score, matched, reason) = if template_children.len() == target_children.len() {
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
                (config.scoring_rules.exact_match, true, "子元素结构完全匹配".to_string())
            } else {
                (config.scoring_rules.mismatch_penalty, false, "子元素类型不同".to_string())
            }
        } else {
            (config.scoring_rules.mismatch_penalty, false, format!("子元素数量不同: {} vs {}", template_children.len(), target_children.len()))
        };
        
        FieldMatchResult {
            field_type: FieldType::ChildrenStructure,
            score: score * config.weight,
            max_score: config.scoring_rules.exact_match * config.weight,
            matched,
            reason,
        }
    }
}

/// 获取字段评分器
pub fn get_field_scorer(field_type: FieldType) -> Box<dyn FieldScorer> {
    match field_type {
        FieldType::ResourceId => Box::new(ResourceIdScorer),
        FieldType::ContentDesc => Box::new(ContentDescScorer),
        FieldType::Text => Box::new(TextScorer),
        FieldType::ClassName => Box::new(ClassNameScorer),
        FieldType::ChildrenStructure => Box::new(ChildrenStructureScorer),
        FieldType::Bounds => Box::new(ResourceIdScorer), // 占位符
    }
}
