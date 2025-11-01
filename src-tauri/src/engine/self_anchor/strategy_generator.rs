// src-tauri/src/engine/self_anchor/strategy_generator.rs
// module: engine/self_anchor | layer: strategy_generator | role: 策略生成器
// summary: 从验证后的组合策略中选择最优策略，生成最终的Self-Anchor结果

use super::{CombinationStrategy, SelfAnchorAnalysis, FieldScoreMap};

/// 策略生成器 - 负责从验证后的策略中选择最优方案
pub struct StrategyGenerator {
    /// 生成配置
    generation_config: GenerationConfig,
}

/// 生成配置
#[derive(Debug, Clone)]
struct GenerationConfig {
    /// 最小置信度阈值
    min_confidence_threshold: f64,
    /// 最大保留策略数量
    max_strategies_count: usize,
    /// 是否启用智能权重调整
    enable_smart_weighting: bool,
    /// 性能权重系数
    performance_weight: f64,
    /// 稳定性权重系数
    stability_weight: f64,
}

/// 最终生成的Self-Anchor结果
#[derive(Debug, Clone)]
pub struct GeneratedSelfAnchor {
    /// 主策略
    pub primary_strategy: CombinationStrategy,
    /// 备用策略（按优先级排序）
    pub fallback_strategies: Vec<CombinationStrategy>,
    /// 整体置信度
    pub overall_confidence: f64,
    /// 生成摘要
    pub generation_summary: String,
    /// 推荐使用场景
    pub recommended_usage: String,
    /// 潜在风险警告
    pub risk_warnings: Vec<String>,
}

impl StrategyGenerator {
    pub fn new() -> Self {
        Self {
            generation_config: GenerationConfig {
                min_confidence_threshold: 0.7,
                max_strategies_count: 3,
                enable_smart_weighting: true,
                performance_weight: 0.3,
                stability_weight: 0.7,
            },
        }
    }

    /// 生成最终的Self-Anchor策略
    pub fn generate_final_strategy(
        &self,
        validated_strategies: Vec<CombinationStrategy>,
        field_scores: &FieldScoreMap,
        original_analysis: &SelfAnchorAnalysis,
    ) -> Result<GeneratedSelfAnchor, String> {
        if validated_strategies.is_empty() {
            return Err("没有可用的验证策略".to_string());
        }

        // 1. 过滤低置信度策略
        let filtered_strategies = self.filter_by_confidence(&validated_strategies)?;

        // 2. 应用智能权重调整
        let weighted_strategies = if self.generation_config.enable_smart_weighting {
            self.apply_smart_weighting(&filtered_strategies, field_scores)?
        } else {
            filtered_strategies
        };

        // 3. 选择主策略和备用策略
        let (primary, fallbacks) = self.select_primary_and_fallbacks(&weighted_strategies)?;

        // 4. 计算整体置信度
        let overall_confidence = self.calculate_overall_confidence(&primary, &fallbacks);

        // 5. 生成使用建议和风险警告
        let generation_summary = self.generate_summary(&primary, &fallbacks, original_analysis);
        let recommended_usage = self.generate_usage_recommendation(&primary, field_scores);
        let risk_warnings = self.analyze_potential_risks(&primary, &fallbacks, original_analysis);

        Ok(GeneratedSelfAnchor {
            primary_strategy: primary,
            fallback_strategies: fallbacks,
            overall_confidence,
            generation_summary,
            recommended_usage,
            risk_warnings,
        })
    }

    /// 过滤低置信度策略
    fn filter_by_confidence(
        &self,
        strategies: &[CombinationStrategy],
    ) -> Result<Vec<CombinationStrategy>, String> {
        let filtered: Vec<_> = strategies
            .iter()
            .filter(|s| s.confidence >= self.generation_config.min_confidence_threshold)
            .cloned()
            .collect();

        if filtered.is_empty() {
            return Err(format!(
                "所有策略的置信度都低于阈值 {:.2}",
                self.generation_config.min_confidence_threshold
            ));
        }

        Ok(filtered)
    }

    /// 应用智能权重调整
    fn apply_smart_weighting(
        &self,
        strategies: &[CombinationStrategy],
        field_scores: &FieldScoreMap,
    ) -> Result<Vec<CombinationStrategy>, String> {
        let mut weighted_strategies = Vec::new();

        for strategy in strategies {
            let mut adjusted_strategy = strategy.clone();
            
            // 计算性能加权
            let performance_bonus = self.calculate_performance_bonus(strategy);
            
            // 计算稳定性加权
            let stability_bonus = self.calculate_stability_bonus(strategy, field_scores);
            
            // 应用加权调整
            let total_bonus = 
                performance_bonus * self.generation_config.performance_weight +
                stability_bonus * self.generation_config.stability_weight;
            
            adjusted_strategy.confidence = (strategy.confidence + total_bonus).min(1.0);
            
            // 更新策略说明
            adjusted_strategy.explanation = format!(
                "{} | 智能加权: +{:.3} (性能: +{:.3}, 稳定性: +{:.3})",
                strategy.explanation,
                total_bonus,
                performance_bonus,
                stability_bonus
            );

            weighted_strategies.push(adjusted_strategy);
        }

        // 重新排序
        weighted_strategies.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

        Ok(weighted_strategies)
    }

    /// 计算性能加权
    fn calculate_performance_bonus(&self, strategy: &CombinationStrategy) -> f64 {
        let mut bonus: f64 = 0.0;

        // 单字段策略通常更快
        if strategy.field_count <= 1 {
            bonus += 0.05;
        } else if strategy.field_count >= 4 {
            bonus -= 0.03; // 复杂策略性能惩罚
        }

        // resource-id 性能最好
        if strategy.selector.contains("@resource-id") {
            bonus += 0.08;
        }

        // 避免text匹配（可能有空格/特殊字符问题）
        if strategy.selector.contains("@text") {
            bonus -= 0.02;
        }

        // bounds匹配通常较慢
        if strategy.selector.contains("@bounds") {
            bonus -= 0.05;
        }

        bonus.max(-0.1).min(0.1) // 限制在合理范围内
    }

    /// 计算稳定性加权
    fn calculate_stability_bonus(&self, strategy: &CombinationStrategy, field_scores: &FieldScoreMap) -> f64 {
        let mut bonus = 0.0;

        // 基于字段稳定性评分
        for field in ["resource_id", "content_desc", "class", "package"] {
            if strategy.selector.contains(&format!("@{}", field)) {
                if let Some(score) = field_scores.get(field) {
                    // 高独特性的字段获得稳定性加分
                    if score.uniqueness_score > 0.8 {
                        bonus += 0.04;
                    } else if score.uniqueness_score < 0.3 {
                        bonus -= 0.03;
                    }
                }
            }
        }

        // 多字段组合增加稳定性
        if strategy.field_count >= 2 {
            bonus += 0.03 * (strategy.field_count - 1) as f64;
        }

        // 实际验证匹配数为1的策略最稳定
        if strategy.estimated_matches == 1 {
            bonus += 0.06;
        } else if strategy.estimated_matches > 5 {
            bonus -= 0.04;
        }

        bonus.max(-0.15).min(0.15)
    }

    /// 选择主策略和备用策略
    fn select_primary_and_fallbacks(
        &self,
        strategies: &[CombinationStrategy],
    ) -> Result<(CombinationStrategy, Vec<CombinationStrategy>), String> {
        if strategies.is_empty() {
            return Err("没有可选择的策略".to_string());
        }

        let primary = strategies[0].clone();
        
        let fallback_count = (self.generation_config.max_strategies_count - 1).min(strategies.len() - 1);
        let fallbacks = strategies[1..=fallback_count].to_vec();

        Ok((primary, fallbacks))
    }

    /// 计算整体置信度
    fn calculate_overall_confidence(
        &self,
        primary: &CombinationStrategy,
        fallbacks: &[CombinationStrategy],
    ) -> f64 {
        let primary_weight = 0.7;
        let fallback_weight = 0.3;

        let fallback_confidence = if fallbacks.is_empty() {
            0.0
        } else {
            fallbacks.iter().map(|s| s.confidence).sum::<f64>() / fallbacks.len() as f64
        };

        primary.confidence * primary_weight + fallback_confidence * fallback_weight
    }

    /// 生成策略摘要
    fn generate_summary(
        &self,
        primary: &CombinationStrategy,
        fallbacks: &[CombinationStrategy],
        original_analysis: &SelfAnchorAnalysis,
    ) -> String {
        let strategy_count = 1 + fallbacks.len();
        let avg_confidence = (primary.confidence + 
            fallbacks.iter().map(|s| s.confidence).sum::<f64>()) / strategy_count as f64;

        format!(
            "生成了{}个策略方案 | 主策略: {} (置信度: {:.2}) | 平均置信度: {:.2} | 原始分析: {} ",
            strategy_count,
            primary.name,
            primary.confidence,
            avg_confidence,
            match original_analysis.has_unique_fields {
                true => "存在唯一字段",
                false => "无唯一字段",
            }
        )
    }

    /// 生成使用建议
    fn generate_usage_recommendation(
        &self,
        primary: &CombinationStrategy,
        field_scores: &FieldScoreMap,
    ) -> String {
        let mut recommendations = Vec::new();

        // 基于主策略特点给出建议
        if primary.confidence > 0.9 {
            recommendations.push("高置信度策略，推荐直接使用".to_string());
        } else if primary.confidence > 0.7 {
            recommendations.push("中等置信度策略，建议结合备用方案".to_string());
        } else {
            recommendations.push("低置信度策略，建议谨慎使用并监控成功率".to_string());
        }

        // 基于字段类型给出建议
        if primary.selector.contains("@resource-id") {
            recommendations.push("包含resource-id，性能较好但需注意应用更新".to_string());
        }

        if primary.selector.contains("@content-desc") {
            recommendations.push("包含content-desc，可访问性好但可能因本地化变化".to_string());
        }

        if primary.field_count >= 3 {
            recommendations.push("多字段组合策略，稳定性高但性能略低".to_string());
        }

        // 检查字段稳定性
        let mut unstable_fields = Vec::new();
        for (field, score) in field_scores {
            if score.uniqueness_score < 0.5 && primary.selector.contains(&format!("@{}", field)) {
                unstable_fields.push(field.clone());
            }
        }

        if !unstable_fields.is_empty() {
            recommendations.push(format!(
                "注意字段 {} 稳定性较低，建议监控",
                unstable_fields.join(", ")
            ));
        }

        recommendations.join(" | ")
    }

    /// 分析潜在风险
    fn analyze_potential_risks(
        &self,
        primary: &CombinationStrategy,
        fallbacks: &[CombinationStrategy],
        original_analysis: &SelfAnchorAnalysis,
    ) -> Vec<String> {
        let mut risks = Vec::new();

        // 主策略风险分析
        if primary.confidence < 0.8 {
            risks.push("主策略置信度偏低，存在匹配失败风险".to_string());
        }

        if primary.estimated_matches == 0 {
            risks.push("主策略预估匹配数为0，可能完全无法定位".to_string());
        } else if primary.estimated_matches > 10 {
            risks.push("主策略预估匹配过多，存在误选风险".to_string());
        }

        // 备用策略风险
        if fallbacks.is_empty() {
            risks.push("无备用策略，主策略失败时缺乏应急方案".to_string());
        } else if fallbacks.iter().all(|s| s.confidence < 0.6) {
            risks.push("备用策略整体置信度偏低".to_string());
        }

        // 字段依赖风险
        if primary.selector.contains("@text") && !primary.selector.contains("@resource-id") {
            risks.push("依赖文本匹配且无resource-id，存在多语言兼容性风险".to_string());
        }

        if primary.field_count == 1 && primary.confidence < 0.9 {
            risks.push("单字段策略但置信度不高，建议考虑组合策略".to_string());
        }

        // 原始分析风险
        if !original_analysis.has_unique_fields {
            risks.push("原始分析未发现唯一字段，整体策略可能不稳定".to_string());
        }

        // 性能风险
        if primary.selector.len() > 200 {
            risks.push("选择器过于复杂，可能影响执行性能".to_string());
        }

        risks
    }

    /// 设置最小置信度阈值
    pub fn set_min_confidence(&mut self, threshold: f64) {
        self.generation_config.min_confidence_threshold = threshold.max(0.0).min(1.0);
    }

    /// 设置最大策略数量
    pub fn set_max_strategies(&mut self, count: usize) {
        self.generation_config.max_strategies_count = count.max(1);
    }

    /// 启用/禁用智能权重
    pub fn set_smart_weighting(&mut self, enabled: bool) {
        self.generation_config.enable_smart_weighting = enabled;
    }

    /// 调整性能与稳定性权重
    pub fn set_performance_stability_weights(&mut self, performance: f64, stability: f64) {
        let total = performance + stability;
        if total > 0.0 {
            self.generation_config.performance_weight = performance / total;
            self.generation_config.stability_weight = stability / total;
        }
    }

    /// 生成策略对比报告
    pub fn generate_comparison_report(&self, generated: &GeneratedSelfAnchor) -> String {
        let mut report = Vec::new();

        report.push("=== Self-Anchor 策略生成报告 ===".to_string());
        report.push(format!("主策略: {}", generated.primary_strategy.name));
        report.push(format!("选择器: {}", generated.primary_strategy.selector));
        report.push(format!("置信度: {:.3}", generated.primary_strategy.confidence));
        report.push(format!("预估匹配数: {}", generated.primary_strategy.estimated_matches));
        
        if !generated.fallback_strategies.is_empty() {
            report.push("\n--- 备用策略 ---".to_string());
            for (i, fallback) in generated.fallback_strategies.iter().enumerate() {
                report.push(format!(
                    "备用{}: {} (置信度: {:.3})",
                    i + 1,
                    fallback.name,
                    fallback.confidence
                ));
            }
        }

        report.push(format!("\n整体置信度: {:.3}", generated.overall_confidence));
        report.push(format!("使用建议: {}", generated.recommended_usage));

        if !generated.risk_warnings.is_empty() {
            report.push("\n⚠️  风险提醒:".to_string());
            for (i, warning) in generated.risk_warnings.iter().enumerate() {
                report.push(format!("  {}. {}", i + 1, warning));
            }
        }

        report.join("\n")
    }
}

impl Default for StrategyGenerator {
    fn default() -> Self {
        Self::new()
    }
}