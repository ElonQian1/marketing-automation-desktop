// src-tauri/src/engine/self_anchor/mod.rs
// module: engine/self_anchor | layer: engine | role: 自我锚定系统主模块
// summary: Step 1 自我可定位性检查的模块化实现，支持字段分析、组合评分、唯一性验证

pub mod field_analyzer;
pub mod combination_scorer;
pub mod uniqueness_validator;
pub mod strategy_generator;
pub mod match_modes;
pub mod relation_seed;

use serde::{Deserialize, Serialize};
use crate::services::ui_reader_service::UIElement;
use strategy_generator::GeneratedSelfAnchor;

// 重新导出关键类型供外部使用
pub use match_modes::{MatchMode, MatchModeProcessor, InstanceFingerprint, ElementBounds, generate_instance_fingerprint};
pub use relation_seed::{RelationSeed, RelationSeedGenerator};

/// 自我锚定系统的主入口
pub struct SelfAnchorEngine {
    field_analyzer: field_analyzer::FieldAnalyzer,
    combination_scorer: combination_scorer::CombinationScorer,
    uniqueness_validator: uniqueness_validator::UniquenessValidator,
    strategy_generator: strategy_generator::StrategyGenerator,
    match_processor: match_modes::MatchModeProcessor,
    relation_generator: relation_seed::RelationSeedGenerator,
}

/// 自我锚定分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelfAnchorAnalysis {
    /// 目标元素
    pub target_element: UIElement,
    /// 单字段评分结果
    pub field_scores: FieldScoreMap,
    /// 组合策略评分
    pub combination_strategies: Vec<CombinationStrategy>,
    /// 推荐的最优策略
    pub recommended_strategy: Option<CombinationStrategy>,
    /// 是否存在高唯一性字段
    pub has_unique_fields: bool,
    /// 分析元数据
    pub metadata: AnalysisMetadata,
}

/// 字段评分映射
pub type FieldScoreMap = std::collections::HashMap<String, FieldScore>;

/// 单字段评分详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldScore {
    /// 字段值
    pub value: String,
    /// 唯一性评分 (0.0-1.0)
    pub uniqueness_score: f64,
    /// 稳定性评分 (0.0-1.0)
    pub stability_score: f64,
    /// 重复计数（在页面中出现的次数）
    pub duplicate_count: usize,
    /// 字段权重
    pub field_weight: f64,
    /// 最终评分
    pub final_score: f64,
    /// 评分理由
    pub reasoning: String,
}

/// 组合策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CombinationStrategy {
    /// 策略ID
    pub strategy_id: String,
    /// 策略名称
    pub name: String,
    /// 使用的字段组合
    pub field_combination: Vec<String>,
    /// 字段数量
    pub field_count: usize,
    /// 组合评分
    pub combination_score: f64,
    /// 生成的选择器
    pub selector: String,
    /// 预估匹配数量
    pub estimated_matches: usize,
    /// 实际匹配数量（验证后）
    pub actual_matches: Option<usize>,
    /// 验证置信度
    pub validation_confidence: Option<f64>,
    /// 置信度
    pub confidence: f64,
    /// 策略解释
    pub explanation: String,
}

/// 分析元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisMetadata {
    /// 分析时间戳
    pub timestamp: u64,
    /// 页面总元素数量
    pub total_elements: usize,
    /// 分析耗时（毫秒）
    pub analysis_time_ms: u64,
    /// 使用的算法版本
    pub algorithm_version: String,
}

/// 自我锚定分析结果（新版本，支持三种模式）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelfAnchorResult {
    /// 分析状态
    pub status: SelfAnchorStatus,
    /// 匹配模式
    pub match_mode: MatchMode,
    /// 候选策略（按优先级排序）
    pub strategies: Vec<ValidatedStrategy>,
    /// 实例指纹（精准模式使用）
    pub fingerprint: Option<InstanceFingerprint>,
    /// 关系线索（空自身时提供）
    pub relation_seed: Option<RelationSeed>,
    /// 性能指标
    pub performance: PerformanceMetrics,
}

/// 自我锚定状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SelfAnchorStatus {
    /// 唯一：找到唯一可靠的定位策略
    Unique,
    /// 重复：存在多个匹配，需要按模式处理
    Duplicates,
    /// 空自身：自身字段稀薄，需要关系锚定
    EmptySelf,
}

/// 验证后的策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatedStrategy {
    /// 基础策略信息
    pub strategy: CombinationStrategy,
    /// 实际匹配数
    pub actual_matches: Option<usize>,
    /// 验证置信度
    pub validation_confidence: Option<f64>,
    /// 是否推荐使用
    pub recommended: bool,
}

/// 性能指标
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PerformanceMetrics {
    /// 总分析时间
    pub analysis_time_ms: u64,
    /// 分析的字段数量
    pub field_count: usize,
    /// 生成的策略数量
    pub strategy_count: usize,
    /// 关系线索质量（0.0-1.0）
    pub seed_quality: Option<f64>,
}

impl SelfAnchorEngine {
    /// 创建新的自我锚定引擎
    pub fn new() -> Self {
        Self {
            field_analyzer: field_analyzer::FieldAnalyzer::new(),
            combination_scorer: combination_scorer::CombinationScorer::new(),
            uniqueness_validator: uniqueness_validator::UniquenessValidator::new(),
            strategy_generator: strategy_generator::StrategyGenerator::new(),
            match_processor: match_modes::MatchModeProcessor,
            relation_generator: relation_seed::RelationSeedGenerator,
        }
    }

    /// 执行完整的自我锚定分析（支持三种匹配模式）
    pub async fn analyze_self_anchor_with_mode(
        &self,
        target_element: &UIElement,
        page_elements: &[UIElement],
        ui_xml: &str,
        match_mode: MatchMode,
        user_tap_bounds: Option<ElementBounds>,
    ) -> Result<SelfAnchorResult, String> {
        let start_time = std::time::Instant::now();

        // 1. 检查是否为"空自身"（字段稀薄）
        if self.relation_generator.is_empty_self(target_element) {
            let relation_seed = self.relation_generator.generate_relation_seed(target_element);
            let seed_quality = self.relation_generator.evaluate_seed_quality(&relation_seed);
            
            return Ok(SelfAnchorResult {
                status: SelfAnchorStatus::EmptySelf,
                match_mode: match_mode.clone(),
                strategies: vec![],
                fingerprint: None,
                relation_seed: Some(relation_seed),
                performance: PerformanceMetrics {
                    analysis_time_ms: start_time.elapsed().as_millis() as u64,
                    seed_quality: Some(seed_quality),
                    ..Default::default()
                },
            });
        }

        // 2. 单字段分析
        let field_scores = self.field_analyzer
            .analyze_all_fields(target_element, page_elements)
            .await?;

        // 3. 组合策略生成
        let strategies = self.combination_scorer
            .generate_strategies(target_element, page_elements, &field_scores)
            .await?;

        // 4. 唯一性验证
        let mut validated_strategies = Vec::new();
        for mut strategy in strategies {
            let validation_result = self.uniqueness_validator
                .validate_strategy(&strategy, ui_xml)
                .await?;
            
            strategy.actual_matches = Some(validation_result.actual_count);
            strategy.validation_confidence = Some(validation_result.confidence);
            validated_strategies.push(strategy);
        }

        // 5. 确定状态和处理重复
        let (status, final_strategies) = self.determine_status_and_strategies(
            &validated_strategies,
            &match_mode,
            target_element,
            page_elements,
        )?;

        // 6. 生成指纹（精准模式需要）
        let fingerprint = if matches!(match_mode, MatchMode::Precise) {
            Some(generate_instance_fingerprint(target_element, user_tap_bounds))
        } else {
            None
        };

        Ok(SelfAnchorResult {
            status,
            match_mode,
            strategies: final_strategies,
            fingerprint,
            relation_seed: None,
            performance: PerformanceMetrics {
                analysis_time_ms: start_time.elapsed().as_millis() as u64,
                field_count: field_scores.len(),
                strategy_count: validated_strategies.len(),
                ..Default::default()
            },
        })
    }
        let combination_strategies = self.combination_scorer
            .generate_combination_strategies(target_element, &field_scores, page_elements)
            .await?;

        // Step 3: 唯一性验证
        let validated_strategies = self.uniqueness_validator
            .validate_strategies(&combination_strategies, ui_xml)
            .await?;

        // Step 4: 生成最终策略
        let analysis = SelfAnchorAnalysis {
            target_element: target_element.clone(),
            field_scores: field_scores.clone(),
            combination_strategies: combination_strategies.clone(),
            recommended_strategy: None, // 将由strategy_generator处理
            has_unique_fields: field_scores.values().any(|s| s.uniqueness_score > 0.9),
            metadata: AnalysisMetadata {
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                total_elements: page_elements.len(),
                analysis_time_ms: start_time.elapsed().as_millis() as u64,
                algorithm_version: "v1.0.0".to_string(),
            },
        };

        let generated_anchor = self.strategy_generator
            .generate_final_strategy(validated_strategies, &field_scores, &analysis)?;

        Ok(generated_anchor)
    }

    /// 快速评估单个字段的唯一性
    pub fn quick_field_assessment(
        &self,
        field_name: &str,
        field_value: &str,
        page_elements: &[UIElement],
    ) -> Result<FieldScore, String> {
        self.field_analyzer.analyze_single_field(
            field_name,
            field_value,
            page_elements,
        )
    }

    /// 确定分析状态和最终策略
    fn determine_status_and_strategies(
        &self,
        validated_strategies: &[CombinationStrategy],
        _match_mode: &MatchMode,
        _target_element: &UIElement,
        _page_elements: &[UIElement],
    ) -> Result<(SelfAnchorStatus, Vec<ValidatedStrategy>), String> {
        // 找到唯一匹配的策略
        let unique_strategies: Vec<_> = validated_strategies.iter()
            .filter(|s| s.actual_matches.unwrap_or(0) == 1)
            .collect();

        if !unique_strategies.is_empty() {
            // 有唯一策略，直接使用
            let status = SelfAnchorStatus::Unique;
            let strategies = unique_strategies.into_iter()
                .map(|s| ValidatedStrategy {
                    strategy: s.clone(),
                    actual_matches: s.actual_matches,
                    validation_confidence: s.validation_confidence,
                    recommended: true,
                })
                .collect();
            return Ok((status, strategies));
        }

        // 检查是否有多重匹配
        let duplicate_strategies: Vec<_> = validated_strategies.iter()
            .filter(|s| s.actual_matches.unwrap_or(0) > 1)
            .collect();

        if !duplicate_strategies.is_empty() {
            let status = SelfAnchorStatus::Duplicates;
            let strategies = duplicate_strategies.into_iter()
                .enumerate()
                .map(|(i, s)| ValidatedStrategy {
                    strategy: s.clone(),
                    actual_matches: s.actual_matches,
                    validation_confidence: s.validation_confidence,
                    recommended: i == 0, // 第一个最推荐
                })
                .collect();
            return Ok((status, strategies));
        }

        // 所有策略都失败，但不是空自身（在上层已检查）
        Err("所有策略验证失败，且不属于空自身情况".to_string())
    }

    /// 根据匹配模式解析目标元素索引
    pub fn resolve_target_indices(
        &self,
        result: &SelfAnchorResult,
        page_elements: &[UIElement],
    ) -> Result<Vec<usize>, String> {
        match result.status {
            SelfAnchorStatus::Unique => {
                // 唯一匹配，返回单个索引
                if let Some(strategy) = result.strategies.first() {
                    if strategy.recommended {
                        return Ok(vec![0]); // TODO: 实际应该查找真实索引
                    }
                }
                Err("未找到推荐的唯一策略".to_string())
            }
            SelfAnchorStatus::Duplicates => {
                // 重复匹配，根据模式处理
                if let Some(strategy) = result.strategies.first() {
                    let element_count = strategy.actual_matches.unwrap_or(0);
                    if element_count == 0 {
                        return Err("重复策略实际匹配数为0".to_string());
                    }

                    // 创建模拟元素列表进行排序
                    let mock_elements: Vec<UIElement> = (0..element_count)
                        .map(|_| page_elements[0].clone()) // 简化处理
                        .collect();

                    self.match_processor.process_duplicates(
                        &mock_elements,
                        &result.match_mode,
                        result.fingerprint.as_ref(),
                    )
                } else {
                    Err("未找到重复匹配策略".to_string())
                }
            }
            SelfAnchorStatus::EmptySelf => {
                Err("空自身状态需要关系锚定模块处理".to_string())
            }
        }
    }
}

impl Default for SelfAnchorEngine {
    fn default() -> Self {
        Self::new()
    }
}