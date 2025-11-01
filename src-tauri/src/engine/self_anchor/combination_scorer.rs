// src-tauri/src/engine/self_anchor/combination_scorer.rs
// module: engine/self_anchor | layer: combination_scorer | role: 多字段组合策略评分器
// summary: 当单个字段不足以唯一定位时，生成最优的字段组合策略并评分

use super::{FieldScoreMap, CombinationStrategy, FieldScore};
use crate::services::ui_reader_service::UIElement;
use std::collections::HashMap;

/// 组合策略评分器 - 负责生成和评分多字段组合策略
pub struct CombinationScorer {
    /// 组合策略模板
    combination_templates: Vec<CombinationTemplate>,
    /// 字段协同权重
    synergy_weights: HashMap<String, f64>,
}

/// 组合策略模板
#[derive(Debug, Clone)]
struct CombinationTemplate {
    /// 模板名称
    pub name: String,
    /// 字段组合
    pub fields: Vec<String>,
    /// 基础权重
    pub base_weight: f64,
    /// 最小字段数要求
    pub min_fields: usize,
    /// 优先级
    pub priority: u8,
}

impl CombinationScorer {
    pub fn new() -> Self {
        let combination_templates = vec![
            // 高优先级组合：强字段 + 辅助字段
            CombinationTemplate {
                name: "Resource ID + Text".to_string(),
                fields: vec!["resource_id".to_string(), "text".to_string()],
                base_weight: 0.95,
                min_fields: 2,
                priority: 1,
            },
            CombinationTemplate {
                name: "Resource ID + Content Desc".to_string(),
                fields: vec!["resource_id".to_string(), "content_desc".to_string()],
                base_weight: 0.92,
                min_fields: 2,
                priority: 2,
            },
            CombinationTemplate {
                name: "Content Desc + Text".to_string(),
                fields: vec!["content_desc".to_string(), "text".to_string()],
                base_weight: 0.88,
                min_fields: 2,
                priority: 3,
            },
            
            // 中优先级组合：三字段组合
            CombinationTemplate {
                name: "Resource ID + Text + Class".to_string(),
                fields: vec!["resource_id".to_string(), "text".to_string(), "class".to_string()],
                base_weight: 0.90,
                min_fields: 3,
                priority: 4,
            },
            CombinationTemplate {
                name: "Content Desc + Text + Clickable".to_string(),
                fields: vec!["content_desc".to_string(), "text".to_string(), "clickable".to_string()],
                base_weight: 0.85,
                min_fields: 3,
                priority: 5,
            },
            
            // 低优先级组合：包含弱字段
            CombinationTemplate {
                name: "Class + Text + Package".to_string(),
                fields: vec!["class".to_string(), "text".to_string(), "package".to_string()],
                base_weight: 0.75,
                min_fields: 3,
                priority: 6,
            },
            CombinationTemplate {
                name: "Text + Class + Clickable + Enabled".to_string(),
                fields: vec!["text".to_string(), "class".to_string(), "clickable".to_string(), "enabled".to_string()],
                base_weight: 0.70,
                min_fields: 4,
                priority: 7,
            },
        ];

        let mut synergy_weights = HashMap::new();
        // 强字段之间的协同加成
        synergy_weights.insert("resource_id+content_desc".to_string(), 1.15);
        synergy_weights.insert("resource_id+text".to_string(), 1.12);
        synergy_weights.insert("content_desc+text".to_string(), 1.10);
        
        // 强字段与中等字段的协同
        synergy_weights.insert("resource_id+class".to_string(), 1.08);
        synergy_weights.insert("content_desc+class".to_string(), 1.06);
        synergy_weights.insert("text+class".to_string(), 1.05);
        
        // 中等字段之间的协同
        synergy_weights.insert("class+package".to_string(), 1.03);
        synergy_weights.insert("clickable+enabled".to_string(), 1.02);

        Self {
            combination_templates,
            synergy_weights,
        }
    }

    /// 生成所有可能的组合策略
    pub async fn generate_combination_strategies(
        &self,
        target_element: &UIElement,
        field_scores: &FieldScoreMap,
        page_elements: &[UIElement],
    ) -> Result<Vec<CombinationStrategy>, String> {
        let mut strategies = Vec::new();

        // 首先检查是否有单字段高分策略
        let single_field_strategies = self.generate_single_field_strategies(field_scores)?;
        strategies.extend(single_field_strategies);

        // 然后生成组合策略
        let combination_strategies = self.generate_multi_field_strategies(
            target_element,
            field_scores,
            page_elements,
        ).await?;
        strategies.extend(combination_strategies);

        // 按评分降序排序
        strategies.sort_by(|a, b| b.combination_score.partial_cmp(&a.combination_score).unwrap());

        Ok(strategies)
    }

    /// 生成单字段策略（当单字段评分已经很高时）
    fn generate_single_field_strategies(
        &self,
        field_scores: &FieldScoreMap,
    ) -> Result<Vec<CombinationStrategy>, String> {
        let mut strategies = Vec::new();
        let high_score_threshold = 0.8; // 高分阈值

        // 检查 resource_id
        if let Some(score) = field_scores.get("resource_id") {
            if score.final_score >= high_score_threshold {
                strategies.push(CombinationStrategy {
                    strategy_id: "single_resource_id".to_string(),
                    name: "纯 Resource ID 策略".to_string(),
                    field_combination: vec!["resource_id".to_string()],
                    field_count: 1,
                    combination_score: score.final_score,
                    selector: format!("//*[@resource-id='{}']", score.value),
                    estimated_matches: score.duplicate_count,
                    actual_matches: None,
                    validation_confidence: None,
                    confidence: score.final_score,
                    explanation: format!("Resource ID '{}' 具有高唯一性评分 {:.2}，可单独使用", 
                                       score.value, score.final_score),
                });
            }
        }

        // 检查 content_desc
        if let Some(score) = field_scores.get("content_desc") {
            if score.final_score >= high_score_threshold {
                strategies.push(CombinationStrategy {
                    strategy_id: "single_content_desc".to_string(),
                    name: "纯 Content Desc 策略".to_string(),
                    field_combination: vec!["content_desc".to_string()],
                    field_count: 1,
                    combination_score: score.final_score,
                    selector: format!("//*[@content-desc='{}']", score.value),
                    estimated_matches: score.duplicate_count,
                    actual_matches: None,
                    validation_confidence: None,
                    confidence: score.final_score,
                    explanation: format!("Content Desc '{}' 具有高唯一性评分 {:.2}，可单独使用", 
                                       score.value, score.final_score),
                });
            }
        }

        // 检查 text
        if let Some(score) = field_scores.get("text") {
            if score.final_score >= high_score_threshold {
                strategies.push(CombinationStrategy {
                    strategy_id: "single_text".to_string(),
                    name: "纯文本策略".to_string(),
                    field_combination: vec!["text".to_string()],
                    field_count: 1,
                    combination_score: score.final_score,
                    selector: format!("//*[@text='{}']", score.value),
                    estimated_matches: score.duplicate_count,
                    actual_matches: None,
                    validation_confidence: None,
                    confidence: score.final_score,
                    explanation: format!("文本 '{}' 具有高唯一性评分 {:.2}，可单独使用", 
                                       score.value, score.final_score),
                });
            }
        }

        Ok(strategies)
    }

    /// 生成多字段组合策略
    async fn generate_multi_field_strategies(
        &self,
        target_element: &UIElement,
        field_scores: &FieldScoreMap,
        page_elements: &[UIElement],
    ) -> Result<Vec<CombinationStrategy>, String> {
        let mut strategies = Vec::new();

        for template in &self.combination_templates {
            if let Some(strategy) = self.try_generate_strategy_from_template(
                template,
                target_element,
                field_scores,
                page_elements,
            ).await? {
                strategies.push(strategy);
            }
        }

        Ok(strategies)
    }

    /// 尝试从模板生成策略
    async fn try_generate_strategy_from_template(
        &self,
        template: &CombinationTemplate,
        target_element: &UIElement,
        field_scores: &FieldScoreMap,
        page_elements: &[UIElement],
    ) -> Result<Option<CombinationStrategy>, String> {
        // 收集可用字段及其评分
        let mut available_fields = Vec::new();
        let mut total_score = 0.0;
        let mut field_values = HashMap::new();

        for field_name in &template.fields {
            if let Some(score) = self.get_field_score(field_name, field_scores) {
                // 只考虑有值且评分大于0的字段
                if score.final_score > 0.0 {
                    available_fields.push(field_name.clone());
                    total_score += score.final_score;
                    field_values.insert(field_name.clone(), score.value.clone());
                }
            }
        }

        // 检查是否满足最小字段数要求
        if available_fields.len() < template.min_fields {
            return Ok(None);
        }

        // 计算协同加成
        let synergy_bonus = self.calculate_synergy_bonus(&available_fields);

        // 计算组合评分
        let average_score = total_score / available_fields.len() as f64;
        let combination_score = average_score * template.base_weight * synergy_bonus;

        // 生成选择器
        let selector = self.generate_combination_selector(&available_fields, &field_values);

        // 估算匹配数量（通过启发式方法）
        let estimated_matches = self.estimate_combination_matches(
            &available_fields,
            &field_values,
            field_scores,
        );

        // 计算置信度（基于组合评分和字段数量）
        let field_count_factor = (available_fields.len() as f64).sqrt() * 0.1;
        let confidence = (combination_score + field_count_factor).min(1.0);

        let strategy = CombinationStrategy {
            strategy_id: format!("combo_{}_{}", template.priority, available_fields.join("_")),
            name: template.name.clone(),
            field_combination: available_fields.clone(),
            field_count: available_fields.len(),
            combination_score,
            selector,
            estimated_matches,
            actual_matches: None,
            validation_confidence: None,
            confidence,
            explanation: format!(
                "组合 {} 个字段: {} | 平均评分: {:.2} | 协同加成: {:.2} | 最终评分: {:.2}",
                available_fields.len(),
                available_fields.join(", "),
                average_score,
                synergy_bonus,
                combination_score
            ),
        };

        Ok(Some(strategy))
    }

    /// 获取字段评分
    fn get_field_score<'a>(&self, field_name: &str, field_scores: &'a FieldScoreMap) -> Option<&'a FieldScore> {
        field_scores.get(field_name)
    }

    /// 计算字段协同加成
    fn calculate_synergy_bonus(&self, fields: &[String]) -> f64 {
        let mut max_synergy: f64 = 1.0;

        // 检查两两组合的协同效果
        for i in 0..fields.len() {
            for j in i + 1..fields.len() {
                let field_pair = format!("{}+{}", fields[i], fields[j]);
                if let Some(&synergy) = self.synergy_weights.get(&field_pair) {
                    max_synergy = max_synergy.max(synergy);
                }
            }
        }

        // 多字段组合额外加成
        let multi_field_bonus = match fields.len() {
            1 => 1.0,
            2 => 1.05,
            3 => 1.08,
            4 => 1.10,
            _ => 1.12,
        };

        max_synergy * multi_field_bonus
    }

    /// 生成组合选择器
    fn generate_combination_selector(
        &self,
        fields: &[String],
        field_values: &HashMap<String, String>,
    ) -> String {
        let mut conditions = Vec::new();

        for field in fields {
            if let Some(value) = field_values.get(field) {
                let condition = match field.as_str() {
                    "resource_id" => format!("@resource-id='{}'", value),
                    "content_desc" => format!("@content-desc='{}'", value),
                    "text" => format!("@text='{}'", value),
                    "class" => format!("@class='{}'", value),
                    "package" => format!("@package='{}'", value),
                    "clickable" => format!("@clickable='{}'", value),
                    "enabled" => format!("@enabled='{}'", value),
                    "bounds" => format!("@bounds='{}'", value),
                    _ => continue,
                };
                conditions.push(condition);
            }
        }

        if conditions.is_empty() {
            "//*".to_string()
        } else {
            format!("//*[{}]", conditions.join(" and "))
        }
    }

    /// 估算组合策略的匹配数量
    fn estimate_combination_matches(
        &self,
        fields: &[String],
        field_values: &HashMap<String, String>,
        field_scores: &FieldScoreMap,
    ) -> usize {
        // 使用最严格字段的重复计数作为估算基础
        let mut min_matches = usize::MAX;

        for field in fields {
            if let Some(score) = self.get_field_score(field, field_scores) {
                min_matches = min_matches.min(score.duplicate_count);
            }
        }

        // 多字段组合通常会进一步减少匹配数量
        let reduction_factor = match fields.len() {
            1 => 1.0,
            2 => 0.7,  // 两字段组合约减少30%
            3 => 0.5,  // 三字段组合约减少50%
            4 => 0.3,  // 四字段组合约减少70%
            _ => 0.2,  // 更多字段组合约减少80%
        };

        let estimated = (min_matches as f64 * reduction_factor).ceil() as usize;
        estimated.max(1) // 至少保证1个匹配
    }

    /// 评估组合策略的有效性
    pub fn evaluate_combination_effectiveness(
        &self,
        strategy: &CombinationStrategy,
    ) -> f64 {
        // 基于多个因素评估策略有效性
        let uniqueness_factor = if strategy.estimated_matches == 1 {
            1.0
        } else if strategy.estimated_matches <= 3 {
            0.8
        } else if strategy.estimated_matches <= 10 {
            0.5
        } else {
            0.2
        };

        let field_count_factor = match strategy.field_combination.len() {
            1 => 1.0,
            2 => 0.95, // 两字段组合略微降低
            3 => 0.90, // 三字段组合适中
            4 => 0.85, // 四字段组合较复杂
            _ => 0.80, // 更多字段过于复杂
        };

        let base_score = strategy.combination_score;

        base_score * uniqueness_factor * field_count_factor
    }

    /// 判定是否为弱自身（WeakSelf）
    /// 朋友建议的判定规则：最佳候选分 < 0.78 或 expectedCount > 3 且 top-gap < 0.10 或 稳定性 < 0.6
    pub fn is_weak_self(
        &self,
        strategies: &[CombinationStrategy],
        field_scores: &FieldScoreMap,
    ) -> bool {
        if strategies.is_empty() {
            return true;
        }

        let best_strategy = &strategies[0]; // 策略已按分数排序

        // 规则1: 最佳候选分 < 0.78
        if best_strategy.combination_score < 0.78 {
            return true;
        }

        // 规则2: expectedCount > 3 且 top-gap < 0.10
        if best_strategy.estimated_matches > 3 && strategies.len() >= 2 {
            let top_gap = best_strategy.combination_score - strategies[1].combination_score;
            if top_gap < 0.10 {
                return true;
            }
        }

        // 规则3: 稳定性 < 0.6（检查主要字段的稳定性）
        let avg_stability = self.calculate_average_stability(field_scores);
        if avg_stability < 0.6 {
            return true;
        }

        false
    }

    /// 计算平均稳定性
    fn calculate_average_stability(&self, field_scores: &FieldScoreMap) -> f64 {
        if field_scores.is_empty() {
            return 0.0;
        }

        let total_stability: f64 = field_scores.values()
            .map(|score| score.stability_score)
            .sum();
        
        total_stability / field_scores.len() as f64
    }
}

impl Default for CombinationScorer {
    fn default() -> Self {
        Self::new()
    }
}