// src-tauri/src/automation/pipeline/execution_gate.rs
// module: pipeline | layer: application | role: 执行前验证网关
// summary: 在真机执行前验证策略的可信度，防止误操作

use crate::engine::XmlIndexer;
use crate::domain::element_match::heuristic::id_stability::IdStabilityAnalyzer;

/// 执行网关配置
#[derive(Debug, Clone)]
pub struct GateConfig {
    /// 最低置信度阈值（低于此值拒绝执行）
    pub min_confidence: f64,
    /// 最大允许匹配数（超过此数视为选择器太宽泛）
    pub max_allowed_matches: usize,
    /// 是否启用严格模式（要求精确唯一匹配）
    pub strict_mode: bool,
    /// 是否启用ID稳定性检查
    pub check_id_stability: bool,
}

impl Default for GateConfig {
    fn default() -> Self {
        Self {
            min_confidence: 0.5,
            max_allowed_matches: 3,
            strict_mode: false,
            check_id_stability: true,
        }
    }
}

/// 验证结果
#[derive(Debug, Clone)]
pub struct GateVerification {
    /// 是否通过验证
    pub passed: bool,
    /// 实际匹配数量
    pub actual_matches: usize,
    /// 调整后的置信度
    pub adjusted_confidence: f64,
    /// 验证原因/警告
    pub reason: String,
    /// 建议操作
    pub recommendation: GateRecommendation,
}

/// 网关建议
#[derive(Debug, Clone, PartialEq)]
pub enum GateRecommendation {
    /// 继续执行
    Proceed,
    /// 使用备选策略
    UseFallback,
    /// 使用 bounds 直接点击
    UseBoundsDirectly,
    /// 拒绝执行
    Abort,
}

/// 执行前验证网关
/// 
/// 设计理念：
/// - 信任但验证：静态分析的结果需要在真机上验证
/// - 早期失败：在点击前发现问题，而不是点错了再后悔
/// - 智能降级：验证失败时提供备选方案
pub struct ExecutionGate {
    config: GateConfig,
    id_stability_analyzer: IdStabilityAnalyzer,
}

impl ExecutionGate {
    pub fn new(config: GateConfig) -> Self {
        Self {
            config,
            id_stability_analyzer: IdStabilityAnalyzer::new(),
        }
    }

    /// 验证 XPath 策略在真机 XML 上的有效性
    /// 
    /// # 参数
    /// - `xpath`: 要验证的 XPath 表达式
    /// - `live_xml`: 真机实时 dump 的 XML
    /// - `static_confidence`: 静态分析时的置信度
    /// 
    /// # 返回
    /// - `GateVerification`: 验证结果和建议
    pub fn verify_xpath_strategy(
        &self,
        xpath: &str,
        live_xml: &str,
        static_confidence: f64,
    ) -> Result<GateVerification, String> {
        tracing::info!("🔒 [执行网关] 开始验证策略: xpath=\"{}\"", xpath);

        // 1. 解析真机 XML
        let indexer = XmlIndexer::build_from_xml(live_xml)
            .map_err(|e| format!("解析真机XML失败: {}", e))?;

        // 2. 在真机上查找匹配
        let matches = self.find_xpath_matches(xpath, &indexer);
        let actual_matches = matches.len();

        tracing::info!("🔍 [执行网关] 真机匹配结果: 找到 {} 个匹配", actual_matches);

        // 3. 评估匹配结果
        let verification = self.evaluate_matches(
            xpath,
            actual_matches,
            static_confidence,
            &matches,
        );

        // 4. 记录验证日志
        if verification.passed {
            tracing::info!(
                "✅ [执行网关] 验证通过: confidence={:.2}, matches={}, recommendation={:?}",
                verification.adjusted_confidence,
                actual_matches,
                verification.recommendation
            );
        } else {
            tracing::warn!(
                "⚠️ [执行网关] 验证失败: {} - recommendation={:?}",
                verification.reason,
                verification.recommendation
            );
        }

        Ok(verification)
    }

    /// 在真机 XML 中查找 XPath 匹配
    fn find_xpath_matches(&self, xpath: &str, indexer: &XmlIndexer) -> Vec<usize> {
        let mut matches = Vec::new();

        // 解析 XPath 中的条件
        if xpath.contains("@content-desc=") {
            let re = regex::Regex::new(r#"@content-desc=['"](.*?)['"]"#).unwrap();
            if let Some(caps) = re.captures(xpath) {
                let desc = &caps[1];
                for (i, node) in indexer.all_nodes.iter().enumerate() {
                    if node.element.content_desc == desc {
                        matches.push(i);
                    }
                }
            }
        } else if xpath.contains("@resource-id=") {
            let re = regex::Regex::new(r#"@resource-id=['"](.*?)['"]"#).unwrap();
            if let Some(caps) = re.captures(xpath) {
                let rid = &caps[1];
                for (i, node) in indexer.all_nodes.iter().enumerate() {
                    if node.element.resource_id.as_deref() == Some(rid) {
                        matches.push(i);
                    }
                }
            }
        } else if xpath.contains("@text=") {
            let re = regex::Regex::new(r#"@text=['"](.*?)['"]"#).unwrap();
            if let Some(caps) = re.captures(xpath) {
                let text = &caps[1];
                for (i, node) in indexer.all_nodes.iter().enumerate() {
                    if node.element.text == text {
                        matches.push(i);
                    }
                }
            }
        }

        matches
    }

    /// 评估匹配结果
    fn evaluate_matches(
        &self,
        xpath: &str,
        actual_matches: usize,
        static_confidence: f64,
        match_indices: &[usize],
    ) -> GateVerification {
        // 情况1：找不到匹配
        if actual_matches == 0 {
            return GateVerification {
                passed: false,
                actual_matches: 0,
                adjusted_confidence: 0.0,
                reason: "在真机页面上未找到匹配元素，可能页面已变化".to_string(),
                recommendation: GateRecommendation::UseBoundsDirectly,
            };
        }

        // 情况2：唯一匹配（理想情况）
        if actual_matches == 1 {
            // 检查ID稳定性（如果是ID匹配）
            let id_penalty = if self.config.check_id_stability && xpath.contains("@resource-id=") {
                self.check_resource_id_stability(xpath)
            } else {
                1.0 // 无惩罚
            };

            let adjusted = static_confidence * id_penalty;
            
            if adjusted >= self.config.min_confidence {
                return GateVerification {
                    passed: true,
                    actual_matches: 1,
                    adjusted_confidence: adjusted,
                    reason: "唯一匹配，验证通过".to_string(),
                    recommendation: GateRecommendation::Proceed,
                };
            } else {
                return GateVerification {
                    passed: false,
                    actual_matches: 1,
                    adjusted_confidence: adjusted,
                    reason: format!("置信度不足: {:.2} < {:.2}", adjusted, self.config.min_confidence),
                    recommendation: GateRecommendation::UseFallback,
                };
            }
        }

        // 情况3：多匹配
        if actual_matches <= self.config.max_allowed_matches {
            // 可接受的多匹配范围
            let penalty = 1.0 - (actual_matches as f64 * 0.15); // 每多一个匹配减少15%置信度
            let adjusted = (static_confidence * penalty).max(0.1);

            if self.config.strict_mode {
                return GateVerification {
                    passed: false,
                    actual_matches,
                    adjusted_confidence: adjusted,
                    reason: format!("严格模式：发现{}个匹配，需要唯一匹配", actual_matches),
                    recommendation: GateRecommendation::UseBoundsDirectly,
                };
            }

            // 尝试选择最佳匹配（第一个可点击的）
            return GateVerification {
                passed: true,
                actual_matches,
                adjusted_confidence: adjusted,
                reason: format!("发现{}个匹配，使用第一个匹配", actual_matches),
                recommendation: GateRecommendation::Proceed,
            };
        }

        // 情况4：太多匹配
        GateVerification {
            passed: false,
            actual_matches,
            adjusted_confidence: 0.1,
            reason: format!(
                "匹配数过多: {} > {}，选择器过于宽泛",
                actual_matches, self.config.max_allowed_matches
            ),
            recommendation: GateRecommendation::UseBoundsDirectly,
        }
    }

    /// 检查 resource-id 的稳定性，返回惩罚系数
    fn check_resource_id_stability(&self, xpath: &str) -> f64 {
        let re = regex::Regex::new(r#"@resource-id=['"](.*?)['"]"#).unwrap();
        if let Some(caps) = re.captures(xpath) {
            let rid = &caps[1];
            let assessment = self.id_stability_analyzer.assess(rid);
            
            if !assessment.should_trust {
                tracing::warn!(
                    "⚠️ [执行网关] ID稳定性警告: {} - {}",
                    rid,
                    assessment.reason
                );
            }
            
            assessment.stability_score
        } else {
            1.0 // 无法提取ID，不惩罚
        }
    }

    /// 快速验证（不解析完整XML，仅做基本检查）
    pub fn quick_check(&self, xpath: &str, confidence: f64) -> bool {
        // 检查置信度
        if confidence < self.config.min_confidence {
            return false;
        }

        // 检查XPath格式
        if xpath.is_empty() || !xpath.starts_with("/") {
            return false;
        }

        // 检查ID稳定性
        if self.config.check_id_stability && xpath.contains("@resource-id=") {
            let stability = self.check_resource_id_stability(xpath);
            if stability < 0.5 {
                return false;
            }
        }

        true
    }
}

impl Default for ExecutionGate {
    fn default() -> Self {
        Self::new(GateConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gate_rejects_low_confidence() {
        let gate = ExecutionGate::default();
        assert!(!gate.quick_check("//*[@text='test']", 0.3));
    }

    #[test]
    fn test_gate_accepts_high_confidence() {
        let gate = ExecutionGate::default();
        assert!(gate.quick_check("//*[@text='test']", 0.8));
    }

    #[test]
    fn test_gate_rejects_invalid_xpath() {
        let gate = ExecutionGate::default();
        assert!(!gate.quick_check("", 0.9));
        assert!(!gate.quick_check("invalid", 0.9));
    }
}
