// src-tauri/src/commands/run_step_v2/matching/tristate_scorer.rs
// module: step-execution | layer: matching | role: 三态评分引擎
// summary: 同构决策链核心 - 统一评分逻辑（前后端复用）

use crate::services::universal_ui_page_analyzer::UIElement;
use super::super::types::StaticEvidence;  // 从 types 模块引用
use super::super::MatchCandidate;  // 从 mod.rs 引用运行时类型

/// 三态评分引擎（同构评分逻辑）
pub struct UnifiedScoringCore;

impl UnifiedScoringCore {
    /// 三态对比评分：同构的评分逻辑，前后端复用
    pub fn calculate_tristate_score(
        static_evidence: &StaticEvidence,
        runtime_node: &UIElement
    ) -> f32 {
        let mut score = 0.0f32;
        
        // P1: 最强证据 - ResourceId + XPath (权重0.85)
        score += Self::score_resource_id(&static_evidence.resource_id, &runtime_node.resource_id);
        score += Self::score_xpath(&static_evidence.xpath, &runtime_node.class_name);
        
        // P2: 中等证据 - Text + ContentDesc (权重0.60-0.70)
        score += Self::score_text(&static_evidence.text, &runtime_node.text);
        score += Self::score_content_desc(&static_evidence.content_desc, &runtime_node.content_desc);
        
        // P3: 弱证据 - ClassName (权重0.30)
        score += Self::score_class_name(&static_evidence.class_name, &runtime_node.class_name);
        
        // 结构性奖励
        if static_evidence.container_scoped {
            score += 0.30; // 容器限定奖励
        }
        if static_evidence.parent_clickable {
            score += 0.20; // 父可点击奖励
        }
        
        // 惩罚项
        if let Some(_index) = static_evidence.local_index {
            score -= 0.15; // 索引依赖惩罚
            if static_evidence.has_light_checks {
                score += 0.10; // 轻校验回补
            }
        }
        if static_evidence.global_index.is_some() {
            score -= 0.60; // 全局索引重度惩罚
        }
        
        score.max(0.0)
    }
    
    /// 评分单项：ResourceId 匹配/缺失/不一致
    fn score_resource_id(static_val: &Option<String>, runtime_val: &Option<String>) -> f32 {
        match (static_val, runtime_val) {
            (Some(s), Some(r)) if s == r => 0.85,      // 完全匹配
            (Some(_), Some(_)) => -0.50,               // 不一致（严重）
            (Some(_), None) => -0.35,                  // 退化（失去强锚点）
            (None, Some(_)) => -0.08,                  // 意外出现（轻微）
            (None, None) => 0.02,                      // 缺失一致
        }
    }
    
    /// 评分单项：XPath 包含匹配
    fn score_xpath(static_xpath: &Option<String>, runtime_class: &Option<String>) -> f32 {
        match (static_xpath, runtime_class) {
            (Some(xpath), Some(class)) if xpath.contains(class) => 0.85,
            (Some(_), Some(_)) => -0.45,               // XPath路径失效
            (Some(_), None) => -0.30,                  // 路径退化
            (None, Some(_)) => -0.05,                  // 意外出现
            (None, None) => 0.01,                      // 路径缺失一致
        }
    }
    
    /// 评分单项：Text 匹配（支持I18N别名）
    fn score_text(static_text: &Option<Vec<String>>, runtime_text: &String) -> f32 {
        let rt_opt = if runtime_text.is_empty() { None } else { Some(runtime_text) };
        match (static_text, rt_opt) {
            (Some(aliases), Some(rt)) => {
                if aliases.iter().any(|alias| rt.contains(alias) || alias.contains(rt)) {
                    0.70 // 文本匹配（含I18N）
                } else {
                    -0.25 // 文本不匹配
                }
            },
            (Some(_), None) => -0.20,                  // 文本丢失
            (None, Some(_)) => -0.03,                  // 意外出现文本
            (None, None) => 0.02,                      // 文本缺失一致
        }
    }
    
    /// 评分单项：ContentDesc 匹配
    fn score_content_desc(static_desc: &Option<String>, runtime_desc: &String) -> f32 {
        let rd_opt = if runtime_desc.is_empty() { None } else { Some(runtime_desc) };
        match (static_desc, rd_opt) {
            (Some(s), Some(r)) if r.contains(s) || s.contains(r) => 0.60,
            (Some(_), Some(_)) => -0.20,               // ContentDesc不匹配
            (Some(_), None) => -0.15,                  // ContentDesc丢失
            (None, Some(_)) => -0.02,                  // 意外出现
            (None, None) => 0.01,                      // 缺失一致
        }
    }
    
    /// 评分单项：ClassName 匹配
    fn score_class_name(static_class: &Option<String>, runtime_class: &Option<String>) -> f32 {
        match (static_class, runtime_class) {
            (Some(s), Some(r)) if r.contains(s) || s.contains(r) => 0.30,
            (Some(_), Some(_)) => -0.15,               // 类名不匹配
            (Some(_), None) => -0.10,                  // 类名丢失
            (None, Some(_)) => -0.02,                  // 意外出现
            (None, None) => 0.01,                      // 缺失一致
        }
    }
    
    /// 双重唯一性验证：阈值唯一 + 间隔唯一
    pub fn validate_uniqueness(
        candidates: &[MatchCandidate], 
        min_confidence: f32
    ) -> bool {
        if candidates.is_empty() {
            return false;
        }
        
        let top1 = &candidates[0];
        
        // 阈值唯一性：Top1 >= min_confidence 且只有1个
        let threshold_unique = top1.confidence >= min_confidence as f64 && 
            candidates.iter().filter(|c| c.confidence >= min_confidence as f64).count() == 1;
        
        // 间隔唯一性：Top1 - Top2 >= 0.15
        let gap_unique = if candidates.len() >= 2 {
            let top2 = &candidates[1];
            (top1.confidence - top2.confidence) >= 0.15
        } else {
            true // 只有一个候选时自动通过间隔检查
        };
        
        threshold_unique || gap_unique
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::run_step_v2::Bounds;
    
    #[test]
    fn test_resource_id_exact_match() {
        let static_val = Some("com.app:id/button".to_string());
        let runtime_val = Some("com.app:id/button".to_string());
        let score = UnifiedScoringCore::score_resource_id(&static_val, &runtime_val);
        assert_eq!(score, 0.85);
    }
    
    #[test]
    fn test_validate_uniqueness_single_candidate() {
        let candidates = vec![
            MatchCandidate {
                id: "1".to_string(),
                score: 0.9,
                confidence: 0.9,
                bounds: Bounds { left: 0, top: 0, right: 100, bottom: 100 },
                text: None,
                class_name: None,
                package_name: None,
            }
        ];
        assert!(UnifiedScoringCore::validate_uniqueness(&candidates, 0.7));
    }
}



