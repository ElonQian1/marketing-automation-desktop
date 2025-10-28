// src-tauri/src/exec/v3/element_matching/multi_candidate_evaluator.rs
// module: v3-execution | layer: matching | role: 多候选评估器
// summary: 对多个XPath匹配结果进行综合评分，选择最佳候选

use crate::services::ui_reader_service::UIElement;
use super::spatial_distance::calculate_distance;
use super::text_comparator::TextComparator;

/// 匹配候选
#[derive(Debug, Clone)]
pub struct MatchCandidate<'a> {
    pub element: &'a UIElement,
    pub xpath: String,
    pub score: f32,
    pub reasons: Vec<String>,
}

/// 评估标准
#[derive(Debug, Clone)]
pub struct EvaluationCriteria {
    /// 目标文本（用户选择的元素文本）
    pub target_text: Option<String>,
    /// 目标 content-desc
    pub target_content_desc: Option<String>,
    /// 原始bounds（静态分析时的位置）
    pub original_bounds: Option<String>,
    /// 原始resource-id
    pub original_resource_id: Option<String>,
    /// 子元素文本列表
    pub children_texts: Vec<String>,
    /// 是否优先选择最后一个候选（防止选错第一个）
    pub prefer_last: bool,
}

/// 多候选评估器
pub struct MultiCandidateEvaluator;

impl MultiCandidateEvaluator {
    /// 从多个匹配元素中选择最佳候选
    /// 
    /// # 评分规则（总分 1.0）
    /// - 文本完全匹配：+0.4
    /// - Content-desc匹配：+0.3
    /// - Bounds位置接近：+0.2
    /// - 子元素文本匹配：+0.1
    /// 
    /// # 特殊处理
    /// - 如果有多个候选且评分相近（差距<0.1），优先选择最后一个（布局通常从上到下）
    pub fn evaluate_candidates<'a>(
        candidates: Vec<&'a UIElement>,
        criteria: &EvaluationCriteria,
    ) -> Option<MatchCandidate<'a>> {
        if candidates.is_empty() {
            return None;
        }
        
        // 单个候选直接返回
        if candidates.len() == 1 {
            tracing::info!("🎯 [候选评估] 只有1个候选，直接选择");
            return Some(MatchCandidate {
                element: candidates[0],
                xpath: "".to_string(),
                score: 1.0,
                reasons: vec!["唯一候选".to_string()],
            });
        }
        
        tracing::warn!(
            "⚠️ [候选评估] 发现 {} 个匹配候选，开始综合评分",
            candidates.len()
        );
        
        // 对每个候选进行评分
        let mut scored_candidates: Vec<MatchCandidate> = candidates.iter()
            .enumerate()
            .map(|(index, elem)| {
                let (score, reasons) = Self::score_candidate(elem, criteria, index, candidates.len());
                MatchCandidate {
                    element: elem,
                    xpath: "".to_string(),
                    score,
                    reasons,
                }
            })
            .collect();
        
        // 按评分降序排列
        scored_candidates.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        
        // 输出评分详情
        for (i, candidate) in scored_candidates.iter().enumerate() {
            tracing::info!(
                "  [{}] 评分: {:.3} | text={:?} | content-desc={:?} | bounds={:?}",
                i + 1,
                candidate.score,
                candidate.element.text,
                candidate.element.content_desc,
                candidate.element.bounds
            );
            for reason in &candidate.reasons {
                tracing::info!("      └─ {}", reason);
            }
        }
        
        // 🔥 特殊逻辑：如果前两名评分相近（差距<0.1），选择后者
        if scored_candidates.len() >= 2 {
            let score_diff = scored_candidates[0].score - scored_candidates[1].score;
            if score_diff < 0.1 && criteria.prefer_last {
                tracing::warn!(
                    "⚠️ [候选评估] 前两名评分相近（差距: {:.3}），根据prefer_last选择第二名",
                    score_diff
                );
                return scored_candidates.into_iter().nth(1);
            }
        }
        
        scored_candidates.into_iter().next()
    }
    
    /// 对单个候选元素进行评分
    fn score_candidate(
        elem: &UIElement,
        criteria: &EvaluationCriteria,
        index: usize,
        total: usize,
    ) -> (f32, Vec<String>) {
        let mut score = 0.0f32;
        let mut reasons = Vec::new();
        
        // 🎯 评分项1: 文本匹配（0-0.4分）
        if let Some(ref target_text) = criteria.target_text {
            if let Some(ref elem_text) = elem.text {
                let text_score = TextComparator::calculate_similarity(target_text, elem_text);
                
                if text_score >= 0.95 {
                    score += 0.4;
                    reasons.push(format!("✅ 文本完全匹配: '{}'", elem_text));
                } else if text_score >= 0.7 {
                    let partial_score = 0.4 * text_score;
                    score += partial_score;
                    reasons.push(format!("🟡 文本部分匹配: '{}' (相似度: {:.2})", elem_text, text_score));
                } else {
                    reasons.push(format!("❌ 文本不匹配: '{}' vs '{}'", elem_text, target_text));
                }
            } else {
                reasons.push("⚠️ 元素无text属性".to_string());
            }
        }
        
        // 🎯 评分项2: Content-desc匹配（0-0.3分）
        if let Some(ref target_desc) = criteria.target_content_desc {
            if let Some(ref elem_desc) = elem.content_desc {
                if elem_desc == target_desc {
                    score += 0.3;
                    reasons.push(format!("✅ Content-desc完全匹配: '{}'", elem_desc));
                } else if elem_desc.contains(target_desc) || target_desc.contains(elem_desc) {
                    score += 0.2;
                    reasons.push(format!("🟡 Content-desc部分匹配: '{}'", elem_desc));
                } else {
                    reasons.push(format!("❌ Content-desc不匹配: '{}' vs '{}'", elem_desc, target_desc));
                }
            }
        }
        
        // 🎯 评分项3: Bounds位置接近度（0-0.2分）
        if let (Some(ref orig_bounds), Some(ref elem_bounds)) = 
            (&criteria.original_bounds, &elem.bounds) {
            
            if let Ok(distance) = calculate_distance(orig_bounds, elem_bounds) {
                // 距离越小分数越高：distance=0 → 0.2分，distance=100 → 0.1分，distance>200 → 0分
                let spatial_score = if distance < 50.0 {
                    0.2
                } else if distance < 100.0 {
                    0.15
                } else if distance < 200.0 {
                    0.1
                } else {
                    0.0
                };
                
                score += spatial_score;
                reasons.push(format!(
                    "📍 空间距离: {:.0}px (得分: {:.2})",
                    distance, spatial_score
                ));
            }
        }
        
        // 🎯 评分项4: 子元素文本匹配（0-0.1分）
        if !criteria.children_texts.is_empty() {
            // TODO: 实现子元素文本匹配逻辑
            // 需要从elem中提取子元素并与 criteria.children_texts 对比
        }
        
        // 🎯 评分项5: 位置偏好（最后一个候选 +0.05）
        if criteria.prefer_last && index == total - 1 {
            score += 0.05;
            reasons.push("🎯 位置偏好: 最后一个候选 (+0.05)".to_string());
        }
        
        (score, reasons)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_single_candidate() {
        let elem = UIElement {
            text: Some("测试".to_string()),
            bounds: Some("[0,0][100,100]".to_string()),
            ..Default::default()
        };
        
        let candidates = vec![&elem];
        let criteria = EvaluationCriteria {
            target_text: Some("测试".to_string()),
            target_content_desc: None,
            original_bounds: None,
            original_resource_id: None,
            children_texts: vec![],
            prefer_last: false,
        };
        
        let result = MultiCandidateEvaluator::evaluate_candidates(candidates, &criteria);
        assert!(result.is_some());
        assert_eq!(result.unwrap().score, 1.0);
    }
    
    #[test]
    fn test_prefer_last_when_scores_close() {
        // TODO: 实现测试用例
    }
}
