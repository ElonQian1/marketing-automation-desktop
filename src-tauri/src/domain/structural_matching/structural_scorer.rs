// src-tauri/src/domain/structural_matching/structural_scorer.rs
// module: structural_matching | layer: domain | role: 结构评分器
// summary: 整体结构匹配评分逻辑

use super::field_scorer::get_field_scorer;
use super::models::{StructuralMatchResult, StructuralMatchingConfig, FieldMatchResult};
use serde_json::Value;

/// 结构评分器
pub struct StructuralScorer;

impl StructuralScorer {
    /// 评估元素是否匹配模板
    pub fn evaluate(
        config: &StructuralMatchingConfig,
        template_element: &Value,
        target_element: &Value,
    ) -> StructuralMatchResult {
        let mut field_results = Vec::new();
        let mut total_score = 0.0;
        let mut max_score = 0.0;
        
        // 遍历启用的字段
        for field_config in config.enabled_fields() {
            let template_value = Self::extract_field_value(template_element, field_config.field_type);
            let target_value = Self::extract_field_value(target_element, field_config.field_type);
            
            let scorer = get_field_scorer(field_config.field_type);
            let result = scorer.score(&template_value, &target_value, field_config);
            
            total_score += result.score;
            max_score += result.max_score;
            field_results.push(result);
        }
        
        let passed = total_score >= config.global_threshold;
        
        StructuralMatchResult {
            element: Some(target_element.clone()),
            total_score,
            max_score: Some(max_score),
            field_results,
            passed,
        }
    }
    
    /// 从元素中提取字段值
    fn extract_field_value(element: &Value, field_type: super::models::FieldType) -> Value {
        use super::models::FieldType;
        
        match field_type {
            FieldType::ResourceId => element.get("resource-id")
                .unwrap_or(&Value::String(String::new()))
                .clone(),
            FieldType::ContentDesc => element.get("content-desc")
                .unwrap_or(&Value::String(String::new()))
                .clone(),
            FieldType::Text => element.get("text")
                .unwrap_or(&Value::String(String::new()))
                .clone(),
            FieldType::ClassName => element.get("class")
                .unwrap_or(&Value::String(String::new()))
                .clone(),
            FieldType::ChildrenStructure => element.get("children")
                .unwrap_or(&Value::Array(vec![]))
                .clone(),
            FieldType::Bounds => element.get("bounds")
                .unwrap_or(&Value::String(String::new()))
                .clone(),
        }
    }
}
