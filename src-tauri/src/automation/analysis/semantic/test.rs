// src/exec/v3/semantic_analyzer/test.rs
// module: semantic_analyzer | layer: test | role: 测试模块
// summary: 测试语义分析器模块的反义词检测功能

#[cfg(test)]
mod tests {
    use super::*;
    use crate::exec::semantic_analyzer::{
        SemanticAnalyzer, TextMatchingMode
    };

    #[test]
    fn test_antonym_detection_absolute_mode() {
        // 测试绝对匹配模式：应禁用反义词检测，但仍需文本匹配
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Exact);
        
        // 完全相同的文本在绝对匹配模式下应该匹配
        let result1 = analyzer.analyze_text_match("关注", "关注");
        assert!(result1.should_match);
        assert!(result1.antonym_result.is_none()); // 绝对匹配模式不检测反义词
        
        // 不同文本在绝对匹配模式下不应匹配，即使不是反义词
        let result2 = analyzer.analyze_text_match("关注", "已关注");
        assert!(!result2.should_match); // 绝对匹配模式下文本不同就不匹配
        assert!(result2.antonym_result.is_none()); // 绝对匹配模式不检测反义词
    }

    #[test]
    fn test_antonym_detection_partial_mode() {
        // 测试部分匹配模式：应启用反义词检测
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);

        // 添加自定义反义词对
        analyzer.add_custom_antonym("关注", "已关注", None);

        // 测试反义词检测
        let result = analyzer.analyze_text_match("关注", "已关注");
        assert!(!result.should_match); // 应该检测到反义词冲突
        assert!(result.antonym_result.is_some());
    }

    #[test]
    fn test_custom_antonym_pairs() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);

        // 添加多个反义词对
        analyzer.add_custom_antonym("关注", "已关注", None);
        analyzer.add_custom_antonym("登录", "退出", None);
        analyzer.add_custom_antonym("打开", "关闭", None);

        // 测试不同的反义词对
        let test_cases = vec![
            ("关注", "已关注", true), // 应检测到冲突
            ("登录", "退出", true),   // 应检测到冲突  
            ("打开", "关闭", true),   // 应检测到冲突
            ("关注", "关注", false),  // 相同文本不冲突
            ("登录", "登录", false),  // 相同文本不冲突
            ("随机", "文本", false),  // 无关文本不冲突
        ];

        for (target, candidate, should_conflict) in test_cases {
            let result = analyzer.analyze_text_match(target, candidate);
            let has_conflict = result.antonym_result.as_ref()
                .map(|r| r.is_antonym).unwrap_or(false);
            assert_eq!(has_conflict, should_conflict, 
                      "Failed for: {} vs {}", target, candidate);
        }
    }

    #[test]
    fn test_disabled_antonym_detection() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(false); // 显式禁用

        // 添加反义词对
        analyzer.add_custom_antonym("关注", "已关注", None);

        // 即使有反义词对，禁用检测时不应检测冲突
        let result = analyzer.analyze_text_match("关注", "已关注");
        assert!(result.antonym_result.is_none());
    }

    #[test]
    fn test_mode_switching() {
        let mut analyzer = SemanticAnalyzer::new();
        
        // 添加反义词对
        analyzer.add_custom_antonym("关注", "已关注", None);

        // 部分匹配模式 + 启用检测
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);
        let result1 = analyzer.analyze_text_match("关注", "已关注");
        let has_conflict1 = result1.antonym_result.as_ref()
            .map(|r| r.is_antonym).unwrap_or(false);
        assert!(has_conflict1);

        // 切换到绝对匹配模式（自动禁用反义词检测）
        analyzer.set_text_matching_mode(TextMatchingMode::Exact);
        let result2 = analyzer.analyze_text_match("关注", "已关注");
        assert!(result2.antonym_result.is_none()); // 绝对匹配模式不检测反义词
    }
}