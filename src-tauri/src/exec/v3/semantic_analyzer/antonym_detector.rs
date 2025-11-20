// src/exec/v3/semantic_analyzer/antonym_detector.rs
// module: semantic-analyzer | layer: domain | role: 反义词检测器
// summary: 专门负责检测文本中的反义词关系

use super::config::{AntonymPair, SemanticConfig};

/// 反义词检测结果
#[derive(Debug, Clone)]
pub struct AntonymDetectionResult {
    /// 是否检测到反义词
    pub is_antonym: bool,
    /// 匹配的反义词对
    pub matched_pair: Option<AntonymPair>,
    /// 匹配的目标词
    pub target_word: Option<String>,
    /// 匹配的反义词
    pub antonym_word: Option<String>,
    /// 检测置信度
    pub confidence: f32,
}

impl AntonymDetectionResult {
    pub fn no_match() -> Self {
        Self {
            is_antonym: false,
            matched_pair: None,
            target_word: None,
            antonym_word: None,
            confidence: 0.0,
        }
    }

    pub fn matched(
        pair: AntonymPair,
        target: String,
        antonym: String,
        confidence: f32,
    ) -> Self {
        Self {
            is_antonym: true,
            matched_pair: Some(pair),
            target_word: Some(target),
            antonym_word: Some(antonym),
            confidence,
        }
    }
}

/// 反义词检测器
#[derive(Debug, Clone)]
pub struct AntonymDetector {
    antonym_pairs: Vec<AntonymPair>,
}

impl AntonymDetector {
    pub fn new(pairs: Vec<AntonymPair>) -> Self {
        Self {
            antonym_pairs: pairs,
        }
    }

    /// 从配置创建检测器
    pub fn from_config(config: &SemanticConfig, all_pairs: Vec<&AntonymPair>) -> Self {
        let pairs = all_pairs.into_iter().cloned().collect();
        Self::new(pairs)
    }

    /// 检测目标文本和候选文本是否存在反义词关系
    pub fn detect_antonym(&self, target_text: &str, candidate_text: &str) -> AntonymDetectionResult {
        // 如果没有配置反义词对，直接返回无匹配
        if self.antonym_pairs.is_empty() {
            return AntonymDetectionResult::no_match();
        }

        // 清理和规范化文本
        let target_clean = self.normalize_text(target_text);
        let candidate_clean = self.normalize_text(candidate_text);

        // 遍历所有反义词对进行检测
        for pair in &self.antonym_pairs {
            if !pair.enabled {
                continue;
            }

            // 检查正向匹配：target是positive，candidate包含negative
            if let Some(result) = self.check_direction_match(
                &target_clean,
                &candidate_clean,
                &pair.positive,
                &pair.negative,
                pair.clone(),
            ) {
                return result;
            }

            // 如果启用双向检测，检查反向匹配
            if pair.bidirectional {
                if let Some(result) = self.check_direction_match(
                    &target_clean,
                    &candidate_clean,
                    &pair.negative,
                    &pair.positive,
                    pair.clone(),
                ) {
                    return result;
                }
            }
        }

        // 检查通用模式
        self.check_generic_patterns(&target_clean, &candidate_clean)
    }

    /// 检查单向匹配
    fn check_direction_match(
        &self,
        target: &str,
        candidate: &str,
        positive_word: &str,
        negative_word: &str,
        pair: AntonymPair,
    ) -> Option<AntonymDetectionResult> {
        // 目标必须匹配正面词汇
        if !self.text_contains_word(target, positive_word) {
            return None;
        }

        // 候选必须包含负面词汇
        if !self.text_contains_word(candidate, negative_word) {
            return None;
        }

        // 计算置信度
        let confidence = self.calculate_confidence(target, candidate, positive_word, negative_word);

        Some(AntonymDetectionResult::matched(
            pair,
            positive_word.to_string(),
            negative_word.to_string(),
            confidence,
        ))
    }

    /// 检查通用反义词模式
    fn check_generic_patterns(&self, target: &str, candidate: &str) -> AntonymDetectionResult {
        // 通用"已X"模式检测
        if let Some(base_word) = self.extract_base_word_from_target(target) {
            let already_pattern = format!("已{}", base_word);
            if self.text_contains_word(candidate, &already_pattern) {
                let dummy_pair = AntonymPair {
                    positive: base_word.clone(),
                    negative: already_pattern.clone(),
                    bidirectional: false,
                    enabled: true,
                    description: Some("通用已X模式".to_string()),
                };
                return AntonymDetectionResult::matched(
                    dummy_pair,
                    base_word,
                    already_pattern,
                    0.8,
                );
            }
        }

        // 通用"取消X"模式检测
        if let Some(base_word) = self.extract_base_word_from_target(target) {
            let cancel_pattern = format!("取消{}", base_word);
            if self.text_contains_word(candidate, &cancel_pattern) {
                let dummy_pair = AntonymPair {
                    positive: base_word.clone(),
                    negative: cancel_pattern.clone(),
                    bidirectional: false,
                    enabled: true,
                    description: Some("通用取消X模式".to_string()),
                };
                return AntonymDetectionResult::matched(
                    dummy_pair,
                    base_word,
                    cancel_pattern,
                    0.8,
                );
            }
        }

        AntonymDetectionResult::no_match()
    }

    /// 文本规范化
    fn normalize_text(&self, text: &str) -> String {
        text.to_lowercase()
            .chars()
            .filter(|c| !c.is_whitespace())
            .collect()
    }

    /// 检查文本是否包含特定词汇
    fn text_contains_word(&self, text: &str, word: &str) -> bool {
        let normalized_word = self.normalize_text(word);
        text.contains(&normalized_word)
    }

    /// 从目标文本提取基础词汇
    fn extract_base_word_from_target(&self, target: &str) -> Option<String> {
        // 移除常见的动作前缀
        let prefixes = ["点击", "选择", "按", "tap", "click"];
        let mut clean_target = target.to_string();
        
        for prefix in &prefixes {
            if clean_target.starts_with(prefix) {
                clean_target = clean_target[prefix.len()..].to_string();
                break;
            }
        }

        let clean_target = clean_target.trim();
        if clean_target.is_empty() {
            return None;
        }

        Some(clean_target.to_string())
    }

    /// 计算匹配置信度
    fn calculate_confidence(
        &self,
        target: &str,
        candidate: &str,
        positive: &str,
        negative: &str,
    ) -> f32 {
        let mut confidence: f32 = 0.9; // 基础置信度

        // 如果是精确匹配，提高置信度
        if target == positive && candidate.contains(negative) {
            confidence = 0.95;
        }

        // 如果负面词汇在候选文本的显著位置，提高置信度
        if candidate.starts_with(negative) || candidate.ends_with(negative) {
            confidence += 0.05;
        }

        confidence.min(1.0_f32)
    }

    /// 添加反义词对
    pub fn add_antonym_pair(&mut self, pair: AntonymPair) {
        self.antonym_pairs.push(pair);
    }

    /// 移除反义词对
    pub fn remove_antonym_pair(&mut self, positive: &str, negative: &str) {
        self.antonym_pairs.retain(|pair| {
            !(pair.positive == positive && pair.negative == negative)
        });
    }

    /// 获取所有反义词对
    pub fn get_antonym_pairs(&self) -> &[AntonymPair] {
        &self.antonym_pairs
    }

    /// 清空所有反义词对
    pub fn clear_antonym_pairs(&mut self) {
        self.antonym_pairs.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_antonym_detection() {
        let pairs = vec![
            AntonymPair::new("关注", "已关注"),
            AntonymPair::new("登录", "退出登录"),
        ];
        let detector = AntonymDetector::new(pairs);

        // 测试基本反义词检测
        let result = detector.detect_antonym("关注", "已关注");
        assert!(result.is_antonym);
        assert_eq!(result.target_word.unwrap(), "关注");
        assert_eq!(result.antonym_word.unwrap(), "已关注");

        // 测试非反义词
        let result = detector.detect_antonym("关注", "关注按钮");
        assert!(!result.is_antonym);
    }

    #[test]
    fn test_generic_patterns() {
        let detector = AntonymDetector::new(vec![]);

        // 测试通用"已X"模式
        let result = detector.detect_antonym("关注", "已关注用户");
        assert!(result.is_antonym);

        // 测试通用"取消X"模式
        let result = detector.detect_antonym("关注", "取消关注");
        assert!(result.is_antonym);
    }

    #[test]
    fn test_bidirectional_detection() {
        let pairs = vec![
            AntonymPair::new("开启", "关闭"),
        ];
        let detector = AntonymDetector::new(pairs);

        // 测试双向检测
        let result = detector.detect_antonym("开启", "关闭功能");
        assert!(result.is_antonym);

        let result = detector.detect_antonym("关闭", "开启设置");
        assert!(result.is_antonym);
    }
}
