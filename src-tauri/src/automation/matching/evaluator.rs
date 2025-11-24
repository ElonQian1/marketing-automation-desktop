// src-tauri/src/automation/matching/evaluator.rs
// module: automation | layer: matching | role: XPath多候选评估器
// summary: 当XPath匹配多个元素时，使用文本/描述/空间距离进行二次评估

use crate::services::universal_ui_page_analyzer::UIElement;
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
        return Err("No candidates provided".to_string());
    }

    let mut best_score = -1.0;
    let mut best_candidate_idx = 0;
    let mut best_reason = String::new();

    for (idx, candidate) in candidates.iter().enumerate() {
        let mut current_score = 0.0;
        let mut reasons = Vec::new();

        // 1. 文本匹配 (40%)
        if let Some(target) = &context.target_text {
            let text = &candidate.text;
            if !text.is_empty() {
                if text == target {
                    current_score += 0.4;
                    reasons.push("Text exact match".to_string());
                } else if text.contains(target) || target.contains(text) {
                    current_score += 0.2;
                    reasons.push("Text partial match".to_string());
                }
            }
        }

        // 2. Content-desc匹配 (30%)
        if let Some(target) = &context.target_content_desc {
            let desc = &candidate.content_desc;
            if !desc.is_empty() {
                if desc == target {
                    current_score += 0.3;
                    reasons.push("Desc exact match".to_string());
                } else if desc.contains(target) || target.contains(desc) {
                    current_score += 0.15;
                    reasons.push("Desc partial match".to_string());
                }
            }
        }

        // 3. 空间距离 (20%)
        if let Some(target_bounds_str) = &context.original_bounds {
            if let Ok(target_bounds) = parse_bounds(target_bounds_str) {
                let candidate_bounds = &candidate.bounds;
                
                // 计算中心点距离
                let target_center_x = (target_bounds.0 + target_bounds.2) as f32 / 2.0;
                let target_center_y = (target_bounds.1 + target_bounds.3) as f32 / 2.0;
                
                let candidate_center_x = (candidate_bounds.left + candidate_bounds.right) as f32 / 2.0;
                let candidate_center_y = (candidate_bounds.top + candidate_bounds.bottom) as f32 / 2.0;
                
                let distance = ((target_center_x - candidate_center_x).powi(2) + 
                              (target_center_y - candidate_center_y).powi(2)).sqrt();
                
                // 假设屏幕对角线约 3000 像素
                let max_distance = 3000.0;
                let distance_score = 0.2 * (1.0 - (distance / max_distance).min(1.0));
                
                if distance_score > 0.1 {
                    current_score += distance_score;
                    reasons.push(format!("Spatial match ({:.2})", distance_score));
                }
            }
        }

        // 4. 属性相似度 (10%)
        if let Some(target_id) = &context.original_resource_id {
            if let Some(id) = &candidate.resource_id {
                if id == target_id {
                    current_score += 0.05;
                    reasons.push("Resource ID match".to_string());
                }
            }
        }
        
        if let Some(target_class) = &context.original_class {
            if let Some(class) = &candidate.class_name {
                if class == target_class {
                    current_score += 0.05;
                    reasons.push("Class match".to_string());
                }
            }
        }

        // 更新最佳匹配
        if current_score > best_score {
            best_score = current_score;
            best_candidate_idx = idx;
            best_reason = reasons.join(", ");
        }
    }

    Ok(XPathEvaluationResult {
        best_match: candidates[best_candidate_idx],
        score: best_score,
        reason: best_reason,
        total_candidates: candidates.len(),
    })
}

// 辅助函数：解析bounds字符串 "[0,0][100,100]" -> (0, 0, 100, 100)
fn parse_bounds(bounds_str: &str) -> Result<(i32, i32, i32, i32), String> {
    let re = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]").map_err(|e| e.to_string())?;
    if let Some(caps) = re.captures(bounds_str) {
        let left = caps[1].parse().unwrap_or(0);
        let top = caps[2].parse().unwrap_or(0);
        let right = caps[3].parse().unwrap_or(0);
        let bottom = caps[4].parse().unwrap_or(0);
        Ok((left, top, right, bottom))
    } else {
        Err("Invalid bounds format".to_string())
    }
}
