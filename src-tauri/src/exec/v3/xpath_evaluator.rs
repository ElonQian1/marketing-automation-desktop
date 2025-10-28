// src-tauri/src/exec/v3/xpath_evaluator.rs
// module: exec | layer: v3 | role: XPath多候选评估器
// summary: 当XPath匹配多个元素时，使用文本/描述/空间距离进行二次评估

use crate::services::ui_reader_service::UIElement;
use serde_json::Value;

/// XPath评估结果
#[derive(Debug, Clone)]
pub struct XPathEvaluationResult<'a> {
    /// 最佳匹配元素
    pub best_match: &'a UIElement,
    /// 评估得分 (0.0-1.0)
    pub score: f32,
    /// 评估原因
    pub reason: String,
    /// 所有候选元素数量
    pub total_candidates: usize,
}

/// XPath评估上下文（来自原始XML的参考信息）
#[derive(Debug, Clone)]
pub struct EvaluationContext {
    /// 目标文本（来自用户选择或original_data）
    pub target_text: Option<String>,
    /// 目标content-desc
    pub target_content_desc: Option<String>,
    /// 原始bounds（用于空间距离计算）
    pub original_bounds: Option<String>,
    /// 原始resource-id
    pub original_resource_id: Option<String>,
    /// 原始class
    pub original_class: Option<String>,
}

impl EvaluationContext {
    /// 从 inline.params 构建评估上下文
    pub fn from_params(params: &Value) -> Self {
        // 优先从 original_data 提取
        let original_data = params.get("original_data");
        
        let target_text = original_data
            .and_then(|od| od.get("element_text"))
            .and_then(|v| v.as_str())
            .or_else(|| {
                params.get("smartSelection")
                    .and_then(|v| v.get("targetText"))
                    .and_then(|v| v.as_str())
            })
            .or_else(|| params.get("targetText").and_then(|v| v.as_str()))
            .map(|s| s.to_string());
        
        let target_content_desc = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("content-desc"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let original_bounds = original_data
            .and_then(|od| od.get("element_bounds"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let original_resource_id = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("resource-id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        let original_class = original_data
            .and_then(|od| od.get("key_attributes"))
            .and_then(|ka| ka.get("class"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        Self {
            target_text,
            target_content_desc,
            original_bounds,
            original_resource_id,
            original_class,
        }
    }
}

/// 🎯 核心功能：从多个XPath匹配的元素中选择最佳候选
/// 
/// 评估维度（优先级从高到低）：
/// 1. 文本精确匹配 (0.0-0.4)
/// 2. Content-desc匹配 (0.0-0.3)
/// 3. 空间距离（与原始bounds的距离） (0.0-0.2)
/// 4. 属性相似度 (0.0-0.1)
/// 
/// 总分范围：0.0-1.0
pub fn evaluate_xpath_candidates<'a>(
    candidates: Vec<&'a UIElement>,
    context: &EvaluationContext,
) -> Result<XPathEvaluationResult<'a>, String> {
    
    if candidates.is_empty() {
        return Err("候选列表为空".to_string());
    }
    
    if candidates.len() == 1 {
        tracing::info!("🎯 [XPath评估] 只有1个候选，直接返回");
        return Ok(XPathEvaluationResult {
            best_match: candidates[0],
            score: 1.0,
            reason: "唯一候选".to_string(),
            total_candidates: 1,
        });
    }
    
    tracing::warn!(
        "⚠️ [XPath评估] 发现 {} 个匹配元素，开始多候选评估",
        candidates.len()
    );
    
    // 对每个候选元素进行评分
    let mut scored_candidates: Vec<(f32, &UIElement, String)> = candidates.iter()
        .map(|elem| {
            let (score, reason) = score_candidate(elem, context);
            (score, *elem, reason)
        })
        .collect();
    
    // 按分数降序排列
    scored_candidates.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
    
    // 打印评分详情（调试用）
    tracing::warn!("📊 [XPath评估] 候选元素评分详情:");
    for (i, (score, elem, reason)) in scored_candidates.iter().enumerate() {
        tracing::warn!(
            "  [{}] 得分:{:.3} - text={:?}, content-desc={:?}, bounds={:?} | 原因: {}",
            i + 1, score, elem.text, elem.content_desc, elem.bounds, reason
        );
    }
    
    // 返回最高分候选
    let (best_score, best_elem, best_reason) = scored_candidates.first()
        .ok_or_else(|| "评分后没有候选元素".to_string())?;
    
    tracing::info!(
        "✅ [XPath评估] 选择最佳候选: text={:?}, score={:.3}, reason={}",
        best_elem.text, best_score, best_reason
    );
    
    Ok(XPathEvaluationResult {
        best_match: best_elem,
        score: *best_score,
        reason: best_reason.clone(),
        total_candidates: candidates.len(),
    })
}

/// 对单个候选元素进行评分
fn score_candidate(elem: &UIElement, context: &EvaluationContext) -> (f32, String) {
    let mut score = 0.0f32;
    let mut reasons = Vec::new();
    
    // 🎯 维度1: 文本精确匹配 (0.0-0.4)
    if let Some(ref target_text) = context.target_text {
        if !target_text.is_empty() {
            if let Some(ref elem_text) = elem.text {
                if elem_text == target_text {
                    score += 0.4;
                    reasons.push(format!("文本精确匹配'{}'", target_text));
                } else if elem_text.contains(target_text) {
                    score += 0.3;
                    reasons.push(format!("文本包含'{}'", target_text));
                } else if target_text.contains(elem_text.as_str()) {
                    score += 0.2;
                    reasons.push(format!("目标包含元素文本'{}'", elem_text));
                } else {
                    // 计算相似度
                    let similarity = calculate_similarity(target_text, elem_text);
                    if similarity > 0.3 {
                        score += similarity * 0.15;
                        reasons.push(format!("文本相似度{:.2}", similarity));
                    }
                }
            }
        }
    }
    
    // 🎯 维度2: Content-desc匹配 (0.0-0.3)
    if let Some(ref target_desc) = context.target_content_desc {
        if !target_desc.is_empty() {
            if let Some(ref elem_desc) = elem.content_desc {
                if elem_desc == target_desc {
                    score += 0.3;
                    reasons.push(format!("content-desc精确匹配'{}'", target_desc));
                } else if elem_desc.contains(target_desc) {
                    score += 0.25;
                    reasons.push(format!("content-desc包含'{}'", target_desc));
                } else {
                    let similarity = calculate_similarity(target_desc, elem_desc);
                    if similarity > 0.3 {
                        score += similarity * 0.2;
                        reasons.push(format!("content-desc相似度{:.2}", similarity));
                    }
                }
            }
        }
    }
    
    // 🎯 维度3: 空间距离 (0.0-0.2) - 与原始bounds的距离越近越好
    if let (Some(ref orig_bounds), Some(ref elem_bounds)) = 
        (&context.original_bounds, &elem.bounds) {
        if let (Some(orig_center), Some(elem_center)) = 
            (parse_bounds_center(orig_bounds), parse_bounds_center(elem_bounds)) {
            let distance = calculate_distance(orig_center, elem_center);
            // 距离 < 100px: 0.2分，距离每增加100px减少0.05分
            let distance_score = (0.2 - (distance / 100.0) * 0.05).max(0.0);
            if distance_score > 0.0 {
                score += distance_score;
                reasons.push(format!("空间距离{:.0}px", distance));
            }
        }
    }
    
    // 🎯 维度4: 属性相似度 (0.0-0.1)
    if let (Some(ref orig_rid), Some(ref elem_rid)) = 
        (&context.original_resource_id, &elem.resource_id) {
        if orig_rid == elem_rid {
            score += 0.05;
            reasons.push("resource-id匹配".to_string());
        }
    }
    
    if let (Some(ref orig_class), Some(ref elem_class)) = 
        (&context.original_class, &elem.class) {  // 修复：使用class而不是class_name
        if orig_class == elem_class {
            score += 0.05;
            reasons.push("class匹配".to_string());
        }
    }
    
    // 汇总原因
    let reason = if reasons.is_empty() {
        "无匹配特征".to_string()
    } else {
        reasons.join(", ")
    };
    
    (score, reason)
}

/// 计算两个字符串的相似度 (0.0-1.0)
fn calculate_similarity(s1: &str, s2: &str) -> f32 {
    if s1.is_empty() || s2.is_empty() {
        return 0.0;
    }
    
    if s1 == s2 {
        return 1.0;
    }
    
    let s1_lower = s1.to_lowercase();
    let s2_lower = s2.to_lowercase();
    
    // 简单的公共字符计数相似度
    let common_chars: usize = s1_lower.chars()
        .filter(|c| s2_lower.contains(*c))
        .count();
    
    let max_len = s1.chars().count().max(s2.chars().count()) as f32;
    common_chars as f32 / max_len
}

/// 解析bounds字符串 "[x1,y1][x2,y2]" 返回中心点坐标
fn parse_bounds_center(bounds: &str) -> Option<(f32, f32)> {
    // 格式: "[x1,y1][x2,y2]"
    let parts: Vec<&str> = bounds
        .trim_matches(|c| c == '[' || c == ']')
        .split("][")
        .collect();
    
    if parts.len() != 2 {
        return None;
    }
    
    let p1: Vec<&str> = parts[0].split(',').collect();
    let p2: Vec<&str> = parts[1].split(',').collect();
    
    if p1.len() != 2 || p2.len() != 2 {
        return None;
    }
    
    let x1 = p1[0].parse::<f32>().ok()?;
    let y1 = p1[1].parse::<f32>().ok()?;
    let x2 = p2[0].parse::<f32>().ok()?;
    let y2 = p2[1].parse::<f32>().ok()?;
    
    Some(((x1 + x2) / 2.0, (y1 + y2) / 2.0))
}

/// 计算两点间的欧几里得距离
fn calculate_distance(p1: (f32, f32), p2: (f32, f32)) -> f32 {
    let dx = p1.0 - p2.0;
    let dy = p1.1 - p2.1;
    (dx * dx + dy * dy).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_calculate_similarity() {
        assert_eq!(calculate_similarity("添加朋友", "添加朋友"), 1.0);
        assert!(calculate_similarity("添加朋友", "添加好友") > 0.5);
        assert!(calculate_similarity("添加朋友", "删除好友") > 0.0);
        assert_eq!(calculate_similarity("", "test"), 0.0);
    }
    
    #[test]
    fn test_parse_bounds_center() {
        let center = parse_bounds_center("[0,100][200,300]").unwrap();
        assert_eq!(center, (100.0, 200.0));
        
        let center2 = parse_bounds_center("[50,50][150,150]").unwrap();
        assert_eq!(center2, (100.0, 100.0));
    }
    
    #[test]
    fn test_calculate_distance() {
        assert_eq!(calculate_distance((0.0, 0.0), (3.0, 4.0)), 5.0);
        assert_eq!(calculate_distance((100.0, 100.0), (100.0, 100.0)), 0.0);
    }
}
