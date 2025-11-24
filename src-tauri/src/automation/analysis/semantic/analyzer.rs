// src/exec/v3/semantic_analyzer/analyzer.rs
// module: semantic-analyzer | layer: application | role: 语义分析主控制器
// summary: 统一的语义分析接口，整合配置管理和反义词检测

use super::{
    antonym_detector::{AntonymDetector, AntonymDetectionResult},
    config::{SemanticConfig, SemanticConfigManager, TextMatchingMode},
};

/// 语义分析结果
#[derive(Debug, Clone)]
pub struct SemanticAnalysisResult {
    /// 是否应该匹配
    pub should_match: bool,
    /// 匹配分数调整值
    pub score_adjustment: f32,
    /// 反义词检测结果
    pub antonym_result: Option<AntonymDetectionResult>,
    /// 匹配模式
    pub matching_mode: TextMatchingMode,
    /// 分析原因
    pub reason: String,
}

impl SemanticAnalysisResult {
    /// 创建允许匹配的结果
    pub fn allow_match(mode: TextMatchingMode, reason: &str) -> Self {
        Self {
            should_match: true,
            score_adjustment: 0.0,
            antonym_result: None,
            matching_mode: mode,
            reason: reason.to_string(),
        }
    }

    /// 创建拒绝匹配的结果（反义词）
    pub fn reject_antonym(
        antonym_result: AntonymDetectionResult,
        penalty_score: f32,
        mode: TextMatchingMode,
    ) -> Self {
        Self {
            should_match: false,
            score_adjustment: penalty_score,
            antonym_result: Some(antonym_result),
            matching_mode: mode,
            reason: "检测到反义词关系".to_string(),
        }
    }

    /// 创建拒绝匹配的结果（绝对匹配模式不匹配）
    pub fn reject_exact_mismatch(target: &str, candidate: &str) -> Self {
        Self {
            should_match: false,
            score_adjustment: -999.0, // 完全拒绝
            antonym_result: None,
            matching_mode: TextMatchingMode::Exact,
            reason: format!("绝对匹配模式：'{}' 与 '{}' 不完全匹配", target, candidate),
        }
    }
}

/// 语义分析器
#[derive(Debug, Clone)]
pub struct SemanticAnalyzer {
    config_manager: SemanticConfigManager,
    antonym_detector: Option<AntonymDetector>,
}

impl SemanticAnalyzer {
    /// 创建新的语义分析器
    pub fn new() -> Self {
        let mut analyzer = Self {
            config_manager: SemanticConfigManager::new(),
            antonym_detector: None,
        };
        analyzer.rebuild_detector();
        analyzer
    }

    /// 使用指定配置创建语义分析器
    pub fn with_config(config: SemanticConfig) -> Self {
        let mut analyzer = Self {
            config_manager: SemanticConfigManager::with_config(config),
            antonym_detector: None,
        };
        analyzer.rebuild_detector();
        analyzer
    }

    /// 获取当前配置
    pub fn get_config(&self) -> &SemanticConfig {
        self.config_manager.get_config()
    }

    /// 更新配置
    pub fn update_config(&mut self, config: SemanticConfig) {
        self.config_manager.update_config(config);
        self.rebuild_detector();
    }

    /// 切换文本匹配模式
    pub fn set_text_matching_mode(&mut self, mode: TextMatchingMode) {
        self.config_manager.set_text_matching_mode(mode);
        self.rebuild_detector();
    }

    /// 设置反义词检测开关
    pub fn set_antonym_detection(&mut self, enabled: bool) {
        self.config_manager.set_antonym_detection(enabled);
        self.rebuild_detector();
    }

    /// 分析文本匹配
    pub fn analyze_text_match(&self, target_text: &str, candidate_text: &str) -> SemanticAnalysisResult {
        let config = self.config_manager.get_config();

        match config.text_matching_mode {
            TextMatchingMode::Exact => self.analyze_exact_match(target_text, candidate_text),
            TextMatchingMode::Partial => self.analyze_partial_match(target_text, candidate_text),
        }
    }

    /// 分析绝对匹配
    fn analyze_exact_match(&self, target_text: &str, candidate_text: &str) -> SemanticAnalysisResult {
        // 绝对匹配模式：必须完全匹配
        let target_normalized = self.normalize_text(target_text);
        let candidate_normalized = self.normalize_text(candidate_text);

        if target_normalized == candidate_normalized {
            SemanticAnalysisResult::allow_match(
                TextMatchingMode::Exact,
                "绝对匹配：文本完全一致",
            )
        } else {
            SemanticAnalysisResult::reject_exact_mismatch(target_text, candidate_text)
        }
    }

    /// 分析部分匹配
    fn analyze_partial_match(&self, target_text: &str, candidate_text: &str) -> SemanticAnalysisResult {
        let config = self.config_manager.get_config();

        // 如果启用了反义词检测，先进行反义词检测
        if config.should_detect_antonyms() {
            if let Some(detector) = &self.antonym_detector {
                let antonym_result = detector.detect_antonym(target_text, candidate_text);
                if antonym_result.is_antonym {
                    return SemanticAnalysisResult::reject_antonym(
                        antonym_result,
                        config.antonym_penalty_score,
                        TextMatchingMode::Partial,
                    );
                }
            }
        }

        // 没有检测到反义词，允许部分匹配
        SemanticAnalysisResult::allow_match(
            TextMatchingMode::Partial,
            "部分匹配：允许包含匹配",
        )
    }

    /// 重建反义词检测器
    fn rebuild_detector(&mut self) {
        let config = self.config_manager.get_config();
        
        if config.should_detect_antonyms() {
            let all_pairs = self.config_manager.get_all_antonym_pairs();
            self.antonym_detector = Some(AntonymDetector::from_config(config, all_pairs));
        } else {
            self.antonym_detector = None;
        }
    }

    /// 文本规范化
    fn normalize_text(&self, text: &str) -> String {
        text.trim()
            .to_lowercase()
            .chars()
            .filter(|c| !c.is_whitespace())
            .collect()
    }

    /// 添加自定义反义词对
    pub fn add_custom_antonym(&mut self, positive: &str, negative: &str, description: Option<&str>) {
        let mut pair = super::config::AntonymPair::new(positive, negative);
        if let Some(desc) = description {
            pair = pair.with_description(desc);
        }
        self.config_manager.add_custom_antonym(pair);
        self.rebuild_detector();
    }

    /// 移除自定义反义词对
    pub fn remove_custom_antonym(&mut self, positive: &str, negative: &str) {
        self.config_manager.remove_custom_antonym(positive, negative);
        self.rebuild_detector();
    }

    /// 获取所有可用的反义词对
    pub fn get_all_antonym_pairs(&self) -> Vec<&super::config::AntonymPair> {
        self.config_manager.get_all_antonym_pairs()
    }

    /// 验证文本是否符合最低有效分数要求
    pub fn meets_min_score_requirement(&self, score: f32) -> bool {
        let config = self.config_manager.get_config();
        score >= config.min_valid_score
    }

    /// 获取最低有效分数
    pub fn get_min_valid_score(&self) -> f32 {
        self.config_manager.get_config().min_valid_score
    }
}

impl Default for SemanticAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exact_matching_mode() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Exact);

        // 完全匹配应该成功
        let result = analyzer.analyze_text_match("关注", "关注");
        assert!(result.should_match);

        // 部分匹配应该失败
        let result = analyzer.analyze_text_match("关注", "已关注");
        assert!(!result.should_match);
    }

    #[test]
    fn test_partial_matching_with_antonym_detection() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);

        // 反义词应该被拒绝
        let result = analyzer.analyze_text_match("关注", "已关注");
        assert!(!result.should_match);
        assert!(result.antonym_result.is_some());

        // 正常部分匹配应该成功
        let result = analyzer.analyze_text_match("关注", "关注按钮");
        assert!(result.should_match);
    }

    #[test]
    fn test_custom_antonym_pairs() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.add_custom_antonym("购买", "已购买", Some("购买状态"));

        let result = analyzer.analyze_text_match("购买", "已购买商品");
        assert!(!result.should_match);
        assert!(result.antonym_result.is_some());
    }
}