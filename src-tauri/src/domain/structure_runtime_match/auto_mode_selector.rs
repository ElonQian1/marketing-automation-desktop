// src-tauri/src/domain/structure_runtime_match/auto_mode_selector.rs
// module: structure_runtime_match | layer: domain | role: 自动选型器
// summary: 并行调用三路评分器，统一闸门，择优推荐，输出解释

use super::scorers::types::{ScoreOutcome, MatchMode};
use super::scorers::{SubtreeMatcher, LeafContextMatcher, TextExactMatcher};
use crate::domain::structure_runtime_match::adapters::xml_indexer_adapter::XmlIndexerAdapter;
use crate::engine::xml_indexer::XmlIndexer;
use anyhow::Result;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoPickConfig {
    /// 最低置信度门槛
    pub min_conf: f32,
    /// 最高分与次高分的最小差距
    pub top_gap: f32,
    /// 子树匹配触发阈值
    pub trigger_subtree: f32,
    /// 叶子上下文触发阈值
    pub trigger_leaf: f32,
    /// 文本精确匹配触发阈值
    pub trigger_text: f32,
}

impl Default for AutoPickConfig {
    fn default() -> Self {
        Self {
            min_conf: 0.70,
            top_gap: 0.15,
            trigger_subtree: 0.78,
            trigger_leaf: 0.72,
            trigger_text: 0.80,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoPickResult {
    /// 推荐的匹配模式
    pub recommended: MatchMode,
    /// 三路评分详细结果
    pub outcomes: Vec<ScoreOutcome>,
    /// 推荐理由
    pub recommendation_reason: String,
}

pub struct AutoModeSelector<'a> {
    pub config: AutoPickConfig,
    pub xml_indexer: &'a XmlIndexer,
}

impl<'a> AutoModeSelector<'a> {
    pub fn new(xml_indexer: &'a XmlIndexer, config: AutoPickConfig) -> Self {
        Self {
            config,
            xml_indexer,
        }
    }

    pub fn with_default_config(xml_indexer: &'a XmlIndexer) -> Self {
        Self::new(xml_indexer, AutoPickConfig::default())
    }

    /// 核心自动选型方法
    pub fn auto_pick(
        &self,
        clicked_node_index: usize,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> Result<AutoPickResult> {
        // 1. 创建三路评分器
        let adapter = XmlIndexerAdapter::new(self.xml_indexer, "adhoc".to_string());
        let subtree_matcher = SubtreeMatcher::new(&adapter);
        let leaf_matcher = LeafContextMatcher::new(self.xml_indexer);
        let text_matcher = TextExactMatcher::new(self.xml_indexer);

        // 2. 构建叶子上下文签名
        let leaf_sig = leaf_matcher.build_context_signature(clicked_node_index, clickable_parent_index);

        // 3. 并行调用三路评分
        let mut subtree_outcome = subtree_matcher.score_subtree(card_root_index as u32, clickable_parent_index as u32);
        let mut leaf_outcome = leaf_matcher.score_leaf_context(&leaf_sig);
        let mut text_outcome = text_matcher.score_text_exact(clicked_node_index);

        // 4. 应用闸门逻辑
        subtree_outcome.passed_gate = self.check_subtree_gate(&subtree_outcome);
        leaf_outcome.passed_gate = self.check_leaf_gate(&leaf_outcome);
        text_outcome.passed_gate = self.check_text_gate(&text_outcome);

        let outcomes = vec![subtree_outcome.clone(), leaf_outcome.clone(), text_outcome.clone()];

        // 5. 择优推荐
        let (recommended, reason) = self.select_best_mode(&subtree_outcome, &leaf_outcome, &text_outcome);

        Ok(AutoPickResult {
            recommended,
            outcomes,
            recommendation_reason: reason,
        })
    }

    fn check_subtree_gate(&self, outcome: &ScoreOutcome) -> bool {
        outcome.conf >= self.config.min_conf && outcome.conf >= self.config.trigger_subtree
    }

    fn check_leaf_gate(&self, outcome: &ScoreOutcome) -> bool {
        outcome.conf >= self.config.min_conf && outcome.conf >= self.config.trigger_leaf
    }

    fn check_text_gate(&self, outcome: &ScoreOutcome) -> bool {
        outcome.conf >= self.config.min_conf && outcome.conf >= self.config.trigger_text
    }

    fn select_best_mode(
        &self,
        subtree: &ScoreOutcome,
        leaf: &ScoreOutcome,
        text: &ScoreOutcome,
    ) -> (MatchMode, String) {
        // 收集通过闸门的结果
        let mut passed_outcomes: Vec<&ScoreOutcome> = vec![];
        if subtree.passed_gate { passed_outcomes.push(subtree); }
        if leaf.passed_gate { passed_outcomes.push(leaf); }
        if text.passed_gate { passed_outcomes.push(text); }

        // 如果没有通过闸门的，使用兜底策略
        if passed_outcomes.is_empty() {
            return self.fallback_selection(subtree, leaf, text);
        }

        // 按置信度排序
        passed_outcomes.sort_by(|a, b| b.conf.partial_cmp(&a.conf).unwrap_or(std::cmp::Ordering::Equal));

        let top = passed_outcomes[0];
        let second = if passed_outcomes.len() > 1 { Some(passed_outcomes[1]) } else { None };

        // 🎯 智能仲裁逻辑：
        // 1. 如果 TextExact 分数极高 (>0.9)，且 LeafContext 也不差 (>0.6)，优先选 TextExact (最稳)
        if text.passed_gate && text.conf > 0.9 && leaf.conf > 0.6 {
             return (
                MatchMode::TextExact,
                format!("文本极高置信度({:.3})，优先文本匹配", text.conf)
            );
        }

        // 2. 如果 Subtree 分数高，说明是复杂卡片，优先 Subtree
        if subtree.passed_gate && subtree.conf > 0.85 {
             return (
                MatchMode::CardSubtree,
                format!("卡片结构特征明显({:.3})，优先子树匹配", subtree.conf)
            );
        }

        // 3. 如果最高分与次高分差距不够，且次高分是LeafContext，偏向LeafContext
        if let Some(sec) = second {
            if (top.conf - sec.conf) < self.config.top_gap && sec.mode == MatchMode::LeafContext {
                return (
                    MatchMode::LeafContext,
                    format!("分差不足({:.3})，偏向叶子上下文模式", top.conf - sec.conf)
                );
            }
        }

        (
            top.mode,
            format!("最高置信度({:.3})，通过闸门", top.conf)
        )
    }

    fn fallback_selection(
        &self,
        subtree: &ScoreOutcome,
        leaf: &ScoreOutcome,
        text: &ScoreOutcome,
    ) -> (MatchMode, String) {
        // 兜底策略：Text (最稳) -> Leaf (次稳) -> Card (最难)
        
        // 1. 如果有文本分，哪怕没过闸门，只要大于0.5，也优先用文本
        if text.conf > 0.5 {
             return (MatchMode::TextExact, "兜底策略：文本置信度尚可".to_string());
        }

        // 2. 其次看 LeafContext
        if leaf.conf > 0.4 {
            return (MatchMode::LeafContext, "兜底策略：叶子上下文尚可".to_string());
        }
        
        // 3. 最后看 Subtree
        if subtree.conf > 0.4 {
            return (MatchMode::CardSubtree, "兜底策略：卡片子树尚可".to_string());
        }
        
        // 4. 实在不行，谁分高选谁
        let all_outcomes = [leaf, subtree, text];
        let highest = all_outcomes.iter()
            .max_by(|a, b| a.conf.partial_cmp(&b.conf).unwrap_or(std::cmp::Ordering::Equal))
            .unwrap();
            
        (highest.mode, "兜底策略：选择最高分".to_string())
    }

    /// 生成推荐详情用于UI展示
    pub fn generate_recommendation_details(&self, result: &AutoPickResult) -> RecommendationDetails {
        let mut details = RecommendationDetails {
            recommended_mode: result.recommended,
            recommended_display: result.recommended.display_name().to_string(),
            confidence_summary: String::new(),
            gate_status: Vec::new(),
            optimization_suggestions: Vec::new(),
        };

        // 生成置信度摘要
        let passed_count = result.outcomes.iter().filter(|o| o.passed_gate).count();
        details.confidence_summary = format!(
            "三路评分完成，{}个模式通过闸门，推荐使用{}",
            passed_count,
            result.recommended.display_name()
        );

        // 生成闸门状态
        for outcome in &result.outcomes {
            details.gate_status.push(GateStatus {
                mode: outcome.mode,
                confidence: outcome.conf,
                passed: outcome.passed_gate,
                explanation: outcome.explain.clone(),
            });
        }

        // 生成优化建议
        if passed_count == 0 {
            details.optimization_suggestions.push("所有模式均未通过闸门，建议调整配置参数".to_string());
        }

        if result.outcomes.iter().all(|o| o.conf < 0.5) {
            details.optimization_suggestions.push("整体置信度偏低，可能需要更多上下文信息".to_string());
        }

        details
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendationDetails {
    pub recommended_mode: MatchMode,
    pub recommended_display: String,
    pub confidence_summary: String,
    pub gate_status: Vec<GateStatus>,
    pub optimization_suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GateStatus {
    pub mode: MatchMode,
    pub confidence: f32,
    pub passed: bool,
    pub explanation: String,
}