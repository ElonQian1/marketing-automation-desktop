// src-tauri/src/engine/self_anchor/uniqueness_validator.rs
// module: engine/self_anchor | layer: uniqueness_validator | role: 唯一性验证器
// summary: 在真机XML上验证组合策略的实际唯一性，确保策略可靠性

use super::CombinationStrategy;
use crate::services::ui_reader_service::parse_ui_elements;

/// 唯一性验证器 - 负责在真机XML上验证策略的实际唯一性
pub struct UniquenessValidator {
    /// 验证配置
    validation_config: ValidationConfig,
}

/// 验证配置
#[derive(Debug, Clone)]
struct ValidationConfig {
    /// 是否启用严格验证
    strict_mode: bool,
    /// 允许的最大匹配数量
    max_allowed_matches: usize,
    /// 验证超时时间（毫秒）
    timeout_ms: u64,
}

/// 验证结果
#[derive(Debug, Clone)]
pub struct ValidationResult {
    /// 实际匹配数量
    pub actual_matches: usize,
    /// 是否通过验证
    pub is_valid: bool,
    /// 验证置信度
    pub validation_confidence: f64,
    /// 验证详情
    pub details: String,
    /// 失败原因（如果验证失败）
    pub failure_reason: Option<String>,
}

impl UniquenessValidator {
    pub fn new() -> Self {
        Self {
            validation_config: ValidationConfig {
                strict_mode: true,
                max_allowed_matches: 1,
                timeout_ms: 500,
            },
        }
    }

    /// 验证所有策略的唯一性
    pub async fn validate_strategies(
        &self,
        strategies: &[CombinationStrategy],
        ui_xml: &str,
    ) -> Result<Vec<CombinationStrategy>, String> {
        let mut validated_strategies = Vec::new();

        for strategy in strategies {
            match self.validate_single_strategy(strategy, ui_xml).await {
                Ok(validation_result) => {
                    let mut updated_strategy = strategy.clone();
                    
                    // 更新策略的验证信息
                    updated_strategy.estimated_matches = validation_result.actual_matches;
                    updated_strategy.confidence = self.calculate_updated_confidence(
                        strategy.confidence,
                        &validation_result,
                    );

                    // 更新策略说明
                    updated_strategy.explanation = format!(
                        "{} | 真机验证: {} | 置信度: {:.2}",
                        updated_strategy.explanation,
                        if validation_result.is_valid { "✅通过" } else { "❌失败" },
                        updated_strategy.confidence
                    );

                    // 只保留通过验证的策略
                    if validation_result.is_valid {
                        validated_strategies.push(updated_strategy);
                    } else {
                        tracing::warn!(
                            "策略 '{}' 验证失败: {}",
                            strategy.name,
                            validation_result.failure_reason.unwrap_or_default()
                        );
                    }
                }
                Err(e) => {
                    tracing::error!("验证策略 '{}' 时出错: {}", strategy.name, e);
                    // 验证出错时，降低置信度但仍保留策略
                    let mut degraded_strategy = strategy.clone();
                    degraded_strategy.confidence *= 0.5; // 大幅降低置信度
                    degraded_strategy.explanation = format!(
                        "{} | 验证出错: {}",
                        degraded_strategy.explanation,
                        e
                    );
                    validated_strategies.push(degraded_strategy);
                }
            }
        }

        // 按更新后的置信度重新排序
        validated_strategies.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

        Ok(validated_strategies)
    }

    /// 验证单个策略的唯一性
    async fn validate_single_strategy(
        &self,
        strategy: &CombinationStrategy,
        ui_xml: &str,
    ) -> Result<ValidationResult, String> {
        let start_time = std::time::Instant::now();

        // 解析UI元素
        let ui_elements = parse_ui_elements(ui_xml)
            .map_err(|e| format!("解析UI XML失败: {}", e))?;

        // 执行XPath匹配（模拟）
        let actual_matches = self.simulate_xpath_matching(&strategy.selector, &ui_elements)?;

        // 检查验证超时
        if start_time.elapsed().as_millis() > self.validation_config.timeout_ms as u128 {
            return Err("验证超时".to_string());
        }

        // 判断验证结果
        let is_valid = self.is_validation_successful(actual_matches);
        let validation_confidence = self.calculate_validation_confidence(
            strategy.estimated_matches,
            actual_matches,
        );

        let details = format!(
            "预估匹配: {} | 实际匹配: {} | 耗时: {}ms",
            strategy.estimated_matches,
            actual_matches,
            start_time.elapsed().as_millis()
        );

        let failure_reason = if !is_valid {
            Some(self.analyze_validation_failure(strategy.estimated_matches, actual_matches))
        } else {
            None
        };

        Ok(ValidationResult {
            actual_matches,
            is_valid,
            validation_confidence,
            details,
            failure_reason,
        })
    }

    /// 模拟XPath匹配（简化实现）
    fn simulate_xpath_matching(
        &self,
        selector: &str,
        ui_elements: &[crate::services::ui_reader_service::UIElement],
    ) -> Result<usize, String> {
        // 解析选择器中的条件
        let conditions = self.parse_selector_conditions(selector)?;
        
        // 计算匹配的元素数量
        let matching_count = ui_elements.iter()
            .filter(|element| self.element_matches_conditions(element, &conditions))
            .count();

        Ok(matching_count)
    }

    /// 解析选择器条件
    fn parse_selector_conditions(&self, selector: &str) -> Result<Vec<(String, String)>, String> {
        let mut conditions = Vec::new();

        // 简化的条件解析（支持常见的XPath条件）
        if let Some(start) = selector.find('[') {
            if let Some(end) = selector.rfind(']') {
                let condition_str = &selector[start + 1..end];
                
                // 分割多个条件（用 " and " 分隔）
                for condition in condition_str.split(" and ") {
                    if let Some((attr, value)) = self.parse_single_condition(condition) {
                        conditions.push((attr, value));
                    }
                }
            }
        }

        Ok(conditions)
    }

    /// 解析单个条件
    fn parse_single_condition(&self, condition: &str) -> Option<(String, String)> {
        // 处理 @attribute='value' 格式
        if condition.starts_with('@') && condition.contains('=') {
            if let Some(eq_pos) = condition.find('=') {
                let attr = condition[1..eq_pos].to_string();
                let value_part = &condition[eq_pos + 1..];
                
                // 移除引号
                let value = value_part.trim_matches('\'').trim_matches('"').to_string();
                
                return Some((attr, value));
            }
        }

        None
    }

    /// 检查元素是否匹配条件
    fn element_matches_conditions(
        &self,
        element: &crate::services::ui_reader_service::UIElement,
        conditions: &[(String, String)],
    ) -> bool {
        for (attr, expected_value) in conditions {
            let element_value = match attr.as_str() {
                "resource-id" => element.resource_id.as_deref(),
                "content-desc" => element.content_desc.as_deref(),
                "text" => element.text.as_deref(),
                "class" => element.class.as_deref(),
                "package" => element.package.as_deref(),
                "clickable" => element.clickable.as_ref().map(|b| if *b { "true" } else { "false" }),
                "enabled" => element.enabled.as_ref().map(|b| if *b { "true" } else { "false" }),
                "bounds" => element.bounds.as_deref(),
                _ => continue,
            };

            match element_value {
                Some(actual_value) => {
                    // 对于布尔值字段，需要特殊处理
                    if attr == "clickable" || attr == "enabled" {
                        if actual_value != expected_value {
                            return false;
                        }
                    } else {
                        // 对于字符串字段
                        if actual_value != expected_value {
                            return false;
                        }
                    }
                }
                None => return false, // 元素没有该属性
            }
        }

        true
    }

    /// 判断验证是否成功
    fn is_validation_successful(&self, actual_matches: usize) -> bool {
        match self.validation_config.strict_mode {
            true => actual_matches == 1, // 严格模式：必须恰好1个匹配
            false => actual_matches > 0 && actual_matches <= self.validation_config.max_allowed_matches,
        }
    }

    /// 计算验证置信度
    fn calculate_validation_confidence(&self, estimated: usize, actual: usize) -> f64 {
        if estimated == actual {
            return 1.0; // 完全匹配
        }

        if actual == 0 {
            return 0.0; // 找不到匹配
        }

        if actual == 1 && estimated > 1 {
            return 0.9; // 实际比预估更好（唯一匹配）
        }

        if estimated == 1 && actual > 1 {
            return 0.3; // 实际比预估更差（多个匹配）
        }

        // 基于差异计算置信度
        let diff = (estimated as i32 - actual as i32).abs() as f64;
        let max_val = estimated.max(actual) as f64;
        let similarity = 1.0 - (diff / max_val);
        
        (similarity * 0.8).max(0.1) // 最低0.1，最高0.8
    }

    /// 计算更新后的策略置信度
    fn calculate_updated_confidence(
        &self,
        original_confidence: f64,
        validation_result: &ValidationResult,
    ) -> f64 {
        if validation_result.is_valid {
            // 验证成功：适当提升置信度
            let boost = validation_result.validation_confidence * 0.1;
            (original_confidence + boost).min(1.0)
        } else {
            // 验证失败：大幅降低置信度
            let penalty = match validation_result.actual_matches {
                0 => 0.8,        // 找不到匹配：重大惩罚
                2..=5 => 0.5,    // 少量多匹配：中等惩罚
                6..=20 => 0.7,   // 中等多匹配：较大惩罚
                _ => 0.9,        // 大量多匹配：最大惩罚
            };
            original_confidence * (1.0 - penalty)
        }
    }

    /// 分析验证失败的原因
    fn analyze_validation_failure(&self, estimated: usize, actual: usize) -> String {
        match (estimated, actual) {
            (_, 0) => "在真机XML中找不到匹配的元素，可能因为页面结构变化或元素不存在".to_string(),
            (1, n) if n > 1 => format!("预期唯一匹配但实际找到{}个元素，存在重复性问题", n),
            (e, a) if a > e * 2 => format!("实际匹配数({})远超预估({}), 选择器过于宽泛", a, e),
            (e, a) if a < e / 2 => format!("实际匹配数({})远低于预估({}), 选择器过于严格", a, e),
            (e, a) => format!("匹配数量不一致: 预估{}, 实际{}", e, a),
        }
    }

    /// 设置验证模式
    pub fn set_strict_mode(&mut self, strict: bool) {
        self.validation_config.strict_mode = strict;
    }

    /// 设置最大允许匹配数
    pub fn set_max_allowed_matches(&mut self, max_matches: usize) {
        self.validation_config.max_allowed_matches = max_matches;
    }

    /// 设置验证超时
    pub fn set_timeout(&mut self, timeout_ms: u64) {
        self.validation_config.timeout_ms = timeout_ms;
    }

    /// 快速验证策略（不解析完整XML）
    pub fn quick_validate_selector(&self, selector: &str) -> Result<bool, String> {
        // 基本的选择器语法检查
        if selector.is_empty() {
            return Err("选择器为空".to_string());
        }

        if !selector.starts_with("//*") && !selector.starts_with("//") {
            return Err("选择器格式不正确".to_string());
        }

        // 检查括号匹配
        let open_brackets = selector.matches('[').count();
        let close_brackets = selector.matches(']').count();
        if open_brackets != close_brackets {
            return Err("选择器括号不匹配".to_string());
        }

        // 检查引号匹配
        let single_quotes = selector.matches('\'').count();
        let double_quotes = selector.matches('"').count();
        if single_quotes % 2 != 0 || double_quotes % 2 != 0 {
            return Err("选择器引号不匹配".to_string());
        }

        Ok(true)
    }
}

impl Default for UniquenessValidator {
    fn default() -> Self {
        Self::new()
    }
}