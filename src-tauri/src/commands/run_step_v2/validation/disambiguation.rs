// src-tauri/src/commands/run_step_v2/validation/disambiguation.rs
// module: step-execution | layer: validation | role: 解歧建议
// summary: 当匹配到多个元素时，生成精确化选择器的建议

use std::collections::HashSet;

/// 匹配候选信息（简化版，避免循环依赖）
pub struct MatchCandidateInfo {
    pub text: Option<String>,
    pub class_name: Option<String>,
    pub confidence: f64,
}

/// 生成解歧建议：分析多个匹配元素的差异，提出精确化建议
/// 
/// # 参数
/// - `candidates`: 匹配到的候选元素列表
/// 
/// # 返回
/// - 建议列表，例如 ["具体文本内容", "更具体的className", "leaf_index定位"]
pub fn generate_disambiguation_suggestions(candidates: &[MatchCandidateInfo]) -> Vec<String> {
    let mut suggestions = Vec::new();
    
    // 检查是否可以通过文本区分
    let unique_texts: HashSet<_> = candidates.iter()
        .filter_map(|c| c.text.as_ref())
        .collect();
    if unique_texts.len() > 1 {
        suggestions.push("具体文本内容".to_string());
    }
    
    // 检查是否可以通过类名区分
    let unique_classes: HashSet<_> = candidates.iter()
        .filter_map(|c| c.class_name.as_ref())
        .collect();
    if unique_classes.len() > 1 {
        suggestions.push("更具体的className".to_string());
    }
    
    // 建议使用位置索引
    if candidates.len() > 1 {
        suggestions.push("leaf_index定位".to_string());
    }
    
    // 建议使用XPath前缀
    suggestions.push("xpath_prefix祖先路径".to_string());
    
    // 建议使用邻近锚点
    suggestions.push("邻近文本锚点".to_string());
    
    // 如果所有候选都相似，建议使用坐标
    let similar_score_count = candidates.iter()
        .filter(|c| (c.confidence - candidates[0].confidence).abs() < 0.1)
        .count();
    if similar_score_count == candidates.len() {
        suggestions.push("坐标精确定位".to_string());
    }
    
    suggestions
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_disambiguation_suggestions_with_different_texts() {
        let candidates = vec![
            MatchCandidateInfo {
                text: Some("按钮1".to_string()),
                class_name: Some("Button".to_string()),
                confidence: 0.85,
            },
            MatchCandidateInfo {
                text: Some("按钮2".to_string()),
                class_name: Some("Button".to_string()),
                confidence: 0.83,
            },
        ];
        
        let suggestions = generate_disambiguation_suggestions(&candidates);
        assert!(suggestions.contains(&"具体文本内容".to_string()));
    }

    #[test]
    fn test_generate_disambiguation_suggestions_with_different_classes() {
        let candidates = vec![
            MatchCandidateInfo {
                text: Some("确定".to_string()),
                class_name: Some("Button".to_string()),
                confidence: 0.85,
            },
            MatchCandidateInfo {
                text: Some("确定".to_string()),
                class_name: Some("TextView".to_string()),
                confidence: 0.83,
            },
        ];
        
        let suggestions = generate_disambiguation_suggestions(&candidates);
        assert!(suggestions.contains(&"更具体的className".to_string()));
    }
}
