// src-tauri/src/domain/structural_matching/models.rs
// module: structural_matching | layer: domain | role: 数据模型
// summary: 结构匹配的核心数据结构

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 字段类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FieldType {
    ResourceId,
    ContentDesc,
    Text,
    ClassName,
    ChildrenStructure,
    Bounds,
}

/// 细粒度匹配策略
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MatchStrategy {
    /// 值完全一样（高分），都非空（低分）
    ExactMatch,
    /// 都非空即可，用于笔记标题等场景
    BothNonEmpty,
    /// 保持空/非空一致，用于Text字段
    ConsistentEmptiness,
    /// 结构匹配，用于子元素
    StructureMatch,
    /// 值相似匹配
    ValueSimilarity,
    /// 禁用字段
    Disabled,
}

/// 匹配模式（保持向后兼容）
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MatchMode {
    /// 值完全相同
    Exact,
    /// 都非空即可
    NonEmpty,
    /// 都为空即可
    Empty,
    /// 结构匹配
    Structure,
    /// 禁用
    Disabled,
}

impl From<MatchStrategy> for MatchMode {
    fn from(strategy: MatchStrategy) -> Self {
        match strategy {
            MatchStrategy::ExactMatch => MatchMode::Exact,
            MatchStrategy::BothNonEmpty => MatchMode::NonEmpty,
            MatchStrategy::ConsistentEmptiness => MatchMode::NonEmpty,
            MatchStrategy::StructureMatch => MatchMode::Structure,
            MatchStrategy::ValueSimilarity => MatchMode::NonEmpty,
            MatchStrategy::Disabled => MatchMode::Disabled,
        }
    }
}

/// 评分规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringRules {
    /// 完全匹配得分
    pub exact_match: f64,
    /// 都非空得分
    pub both_non_empty: f64,
    /// 都为空得分
    pub both_empty: f64,
    /// 不匹配惩罚
    pub mismatch_penalty: f64,
}

/// 字段配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StructuralFieldConfig {
    pub field_type: FieldType,
    pub enabled: bool,
    pub match_mode: MatchMode,
    /// 新增：细粒度匹配策略
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strategy: Option<MatchStrategy>,
    pub weight: f64,
    pub scoring_rules: ScoringRules,
    pub display_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_value: Option<serde_json::Value>,
}

/// 结构匹配配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StructuralMatchingConfig {
    pub config_id: String,
    pub template_element_id: String,
    pub template_structure: serde_json::Value,
    pub fields: Vec<StructuralFieldConfig>,
    pub global_threshold: f64,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 字段匹配结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldMatchResult {
    pub field_type: FieldType,
    pub score: f64,
    pub max_score: f64,
    pub matched: bool,
    pub reason: String,
}

/// 结构匹配结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StructuralMatchResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub element: Option<serde_json::Value>,
    pub total_score: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_score: Option<f64>,
    pub field_results: Vec<FieldMatchResult>,
    pub passed: bool,
}

impl StructuralMatchingConfig {
    /// 获取启用的字段配置
    pub fn enabled_fields(&self) -> Vec<&StructuralFieldConfig> {
        self.fields.iter().filter(|f| f.enabled).collect()
    }
}
