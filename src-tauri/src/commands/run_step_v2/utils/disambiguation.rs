// src-tauri/src/commands/run_step_v2/utils/disambiguation.rs
// module: run_step_v2 | layer: utils | role: 消歧建议生成器
// summary: 根据候选匹配列表生成消歧建议，帮助用户选择更精确的选择器

use crate::commands::run_step_v2::{MatchCandidate, RunStepRequestV2};

/// 根据多候选匹配情况生成消歧建议
/// 
/// # 参数
/// - `candidates`: 候选匹配列表
/// - `_req`: 原始请求（预留用于未来优化）
/// 
/// # 返回
/// 建议的消歧策略列表
pub fn generate_disambiguation_suggestions(
    candidates: &[MatchCandidate], 
    _req: &RunStepRequestV2
) -> Vec<String> {
    let mut suggestions = Vec::new();
    
    // 检查是否可以通过文本区分
    let unique_texts: std::collections::HashSet<_> = candidates.iter()
        .filter_map(|c| c.text.as_ref())
        .collect();
    if unique_texts.len() > 1 {
        suggestions.push("具体文本内容".to_string());
    }
    
    // 检查是否可以通过类名区分
    let unique_classes: std::collections::HashSet<_> = candidates.iter()
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
    use crate::commands::run_step_v2::{MatchCandidate, RunStepRequestV2, Bounds, StepRunMode, StrategyKind};

    fn create_test_candidate(text: Option<&str>, class_name: Option<&str>, confidence: f64) -> MatchCandidate {
        MatchCandidate {
            id: "".to_string(),
            score: 0.0,
            confidence,
            bounds: Bounds { left: 0, top: 0, right: 0, bottom: 0 },
            text: text.map(|s| s.to_string()),
            class_name: class_name.map(|s| s.to_string()),
            package_name: None,
        }
    }

    fn create_test_request() -> RunStepRequestV2 {
        RunStepRequestV2 {
            device_id: "".to_string(),
            mode: StepRunMode::ExecuteStep,
            strategy: StrategyKind::Standard,
            step: serde_json::Value::Null,
        }
    }

    #[test]
    fn test_disambiguation_with_unique_text() {
        let candidates = vec![
            create_test_candidate(Some("按钮A"), Some("Button"), 0.9),
            create_test_candidate(Some("按钮B"), Some("Button"), 0.85),
        ];

        let req = create_test_request();
        let suggestions = generate_disambiguation_suggestions(&candidates, &req);
        
        assert!(suggestions.contains(&"具体文本内容".to_string()));
        assert!(suggestions.contains(&"leaf_index定位".to_string()));
    }

    #[test]
    fn test_disambiguation_with_similar_scores() {
        let candidates = vec![
            create_test_candidate(None, None, 0.90),
            create_test_candidate(None, None, 0.91),
        ];

        let req = create_test_request();
        let suggestions = generate_disambiguation_suggestions(&candidates, &req);
        
        // 分数相似应建议坐标定位
        assert!(suggestions.contains(&"坐标精确定位".to_string()));
    }
}
