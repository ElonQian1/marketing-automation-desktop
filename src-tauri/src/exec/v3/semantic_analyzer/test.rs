// src/exec/v3/semantic_analyzer/test.rs
// module: semantic_analyzer | layer: test | role: 测试模块
// summary: 测试语义分析器模块的反义词检测功能

#[cfg(test)]
mod tests {
    use super::*;
    use crate::exec::v3::semantic_analyzer::{
        SemanticAnalyzer, TextMatchingMode, AntonymPair
    };

    #[test]
    fn test_antonym_detection_absolute_mode() {
        // 测试绝对匹配模式：应禁用反义词检测
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Exact);
        
        // 即使添加反义词对，绝对匹配模式也不应检测反义词
        let result = analyzer.analyze_text_match("关注", "已关注");
        assert!(result.is_match);
        assert!(!result.has_antonym_conflict); // 绝对匹配模式不检测反义词
    }

    #[test]
    fn test_antonym_detection_partial_mode() {
        // 测试部分匹配模式：应启用反义词检测
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);

        // 添加自定义反义词对
        let follow_pair = AntonymPair::new("关注".to_string(), "已关注".to_string());
        analyzer.add_custom_antonym(follow_pair);

        // 测试反义词检测
        let result = analyzer.analyze_text_match("关注", "已关注");
        assert!(!result.is_match); // 应该检测到反义词冲突
        assert!(result.has_antonym_conflict);
    }

    #[test]
    fn test_custom_antonym_pairs() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);

        // 添加多个反义词对
        let pairs = vec![
            AntonymPair::new("关注".to_string(), "已关注".to_string()),
            AntonymPair::new("登录".to_string(), "退出".to_string()),
            AntonymPair::new("打开".to_string(), "关闭".to_string()),
        ];

        for pair in pairs {
            analyzer.add_custom_antonym(pair);
        }

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
            assert_eq!(result.has_antonym_conflict, should_conflict, 
                      "Failed for: {} vs {}", target, candidate);
        }
    }

    #[test]
    fn test_bidirectional_antonym_detection() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);

        // 添加双向反义词对
        let bidirectional_pair = AntonymPair::new("关注".to_string(), "已关注".to_string())
            .bidirectional(true);
        analyzer.add_custom_antonym(bidirectional_pair);

        // 测试双向检测
        let result1 = analyzer.analyze_text_match("关注", "已关注");
        let result2 = analyzer.analyze_text_match("已关注", "关注");

        assert!(result1.has_antonym_conflict);
        assert!(result2.has_antonym_conflict);
    }

    #[test]
    fn test_disabled_antonym_detection() {
        let mut analyzer = SemanticAnalyzer::new();
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(false); // 显式禁用

        // 添加反义词对
        let pair = AntonymPair::new("关注".to_string(), "已关注".to_string());
        analyzer.add_custom_antonym(pair);

        // 即使有反义词对，禁用检测时不应检测冲突
        let result = analyzer.analyze_text_match("关注", "已关注");
        assert!(!result.has_antonym_conflict);
    }

    #[test]
    fn test_mode_switching() {
        let mut analyzer = SemanticAnalyzer::new();
        
        // 添加反义词对
        let pair = AntonymPair::new("关注".to_string(), "已关注".to_string());
        analyzer.add_custom_antonym(pair);

        // 部分匹配模式 + 启用检测
        analyzer.set_text_matching_mode(TextMatchingMode::Partial);
        analyzer.set_antonym_detection(true);
        let result1 = analyzer.analyze_text_match("关注", "已关注");
        assert!(result1.has_antonym_conflict);

        // 切换到绝对匹配模式（自动禁用反义词检测）
        analyzer.set_text_matching_mode(TextMatchingMode::Exact);
        let result2 = analyzer.analyze_text_match("关注", "已关注");
        assert!(!result2.has_antonym_conflict); // 绝对匹配模式不检测反义词
    }
}