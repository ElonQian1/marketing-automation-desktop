// src-tauri/src/services/execution/matching/candidate_evaluator.rs
// module: services/execution/matching | layer: services | role: 多候选元素评估器
// summary: 对XPath匹配的多个候选元素进行评分排序，选择最佳目标

use anyhow::Result;
use serde::{Deserialize, Serialize};

/// 候选元素评估器 - 负责从多个匹配结果中选择最佳目标
pub struct CandidateEvaluator {
    config: EvaluatorConfig,
}

/// 评估器配置
#[derive(Debug, Clone)]
pub struct EvaluatorConfig {
    /// 文本匹配权重 (0.0-1.0)
    pub text_weight: f32,
    /// Content-Desc 匹配权重
    pub content_desc_weight: f32,
    /// 空间距离权重
    pub spatial_weight: f32,
    /// Resource-ID 匹配权重
    pub resource_id_weight: f32,
    /// 可点击性权重
    pub clickable_weight: f32,
    /// 最小评分阈值（低于此分数的候选会被过滤）
    pub min_score_threshold: f32,
}

impl Default for EvaluatorConfig {
    fn default() -> Self {
        Self {
            text_weight: 0.30,           // 文本最重要
            content_desc_weight: 0.25,   // Content-Desc 次之
            spatial_weight: 0.20,        // 空间距离
            resource_id_weight: 0.15,    // Resource-ID
            clickable_weight: 0.10,      // 可点击性
            min_score_threshold: 0.3,    // 最低30分才考虑
        }
    }
}

/// 候选元素（从UI XML解析）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CandidateElement {
    /// 元素bounds（用于计算空间距离）
    pub bounds: Option<String>,  // "[left,top][right,bottom]"
    /// 元素text
    pub text: Option<String>,
    /// Content-Desc
    pub content_desc: Option<String>,
    /// Resource-ID
    pub resource_id: Option<String>,
    /// 是否可点击
    pub clickable: bool,
    /// Class名称
    pub class_name: Option<String>,
    /// 元素索引（在XML中的位置）
    pub index: Option<usize>,
}

/// 目标特征（用户期望的元素特征）
#[derive(Debug, Clone)]
pub struct TargetFeatures {
    /// 期望的文本
    pub expected_text: Option<String>,
    /// 期望的 Content-Desc
    pub expected_content_desc: Option<String>,
    /// 期望的 Resource-ID
    pub expected_resource_id: Option<String>,
    /// 期望的点击位置（用户静态分析时点击的位置）
    pub expected_position: Option<(i32, i32)>,  // (x, y)
}

/// 评估结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationResult {
    /// 候选元素索引
    pub candidate_index: usize,
    /// 总评分 (0.0-1.0)
    pub total_score: f32,
    /// 分项评分
    pub scores: DetailedScores,
    /// 推荐原因
    pub reasoning: Vec<String>,
}

/// 详细评分
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedScores {
    pub text_score: f32,
    pub content_desc_score: f32,
    pub spatial_score: f32,
    pub resource_id_score: f32,
    pub clickable_score: f32,
}

impl CandidateEvaluator {
    /// 创建默认评估器
    pub fn new() -> Self {
        Self {
            config: EvaluatorConfig::default(),
        }
    }

    /// 创建自定义配置的评估器
    pub fn with_config(config: EvaluatorConfig) -> Self {
        Self { config }
    }

    /// 评估所有候选元素，返回排序后的结果（最佳在前）
    pub fn evaluate_candidates(
        &self,
        candidates: &[CandidateElement],
        target: &TargetFeatures,
    ) -> Result<Vec<EvaluationResult>> {
        if candidates.is_empty() {
            anyhow::bail!("❌ 候选元素列表为空");
        }

        tracing::info!(
            "🎯 [多候选评估] 开始评估 {} 个候选元素",
            candidates.len()
        );

        let mut results: Vec<EvaluationResult> = candidates
            .iter()
            .enumerate()
            .map(|(index, candidate)| {
                self.evaluate_single_candidate(index, candidate, target)
            })
            .collect();

        // 按总分降序排序
        results.sort_by(|a, b| {
            b.total_score
                .partial_cmp(&a.total_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        // 过滤低分候选
        let filtered_results: Vec<EvaluationResult> = results
            .iter()
            .filter(|r| r.total_score >= self.config.min_score_threshold)
            .cloned()
            .collect();

        if filtered_results.is_empty() {
            tracing::warn!(
                "⚠️ [多候选评估] 所有候选评分过低（< {}），返回原始最高分",
                self.config.min_score_threshold
            );
            // 返回原始最高分的一个
            Ok(vec![results.into_iter().next().unwrap()])
        } else {
            tracing::info!(
                "✅ [多候选评估] 完成评估，{} 个候选通过筛选（最高分: {:.2}）",
                filtered_results.len(),
                filtered_results.first().map(|r| r.total_score).unwrap_or(0.0)
            );
            Ok(filtered_results)
        }
    }

    /// 评估单个候选元素
    fn evaluate_single_candidate(
        &self,
        index: usize,
        candidate: &CandidateElement,
        target: &TargetFeatures,
    ) -> EvaluationResult {
        let text_score = self.calculate_text_score(candidate, target);
        let content_desc_score = self.calculate_content_desc_score(candidate, target);
        let spatial_score = self.calculate_spatial_score(candidate, target);
        let resource_id_score = self.calculate_resource_id_score(candidate, target);
        let clickable_score = if candidate.clickable { 1.0 } else { 0.0 };

        let total_score = text_score * self.config.text_weight
            + content_desc_score * self.config.content_desc_weight
            + spatial_score * self.config.spatial_weight
            + resource_id_score * self.config.resource_id_weight
            + clickable_score * self.config.clickable_weight;

        let reasoning = self.generate_reasoning(
            text_score,
            content_desc_score,
            spatial_score,
            resource_id_score,
            clickable_score,
        );

        EvaluationResult {
            candidate_index: index,
            total_score,
            scores: DetailedScores {
                text_score,
                content_desc_score,
                spatial_score,
                resource_id_score,
                clickable_score,
            },
            reasoning,
        }
    }

    /// 计算文本匹配分数
    fn calculate_text_score(&self, candidate: &CandidateElement, target: &TargetFeatures) -> f32 {
        match (&candidate.text, &target.expected_text) {
            (Some(cand_text), Some(exp_text)) => {
                if cand_text == exp_text {
                    1.0 // 完全匹配
                } else if cand_text.contains(exp_text) || exp_text.contains(cand_text) {
                    0.7 // 包含关系
                } else {
                    // 使用编辑距离计算相似度
                    let similarity = calculate_string_similarity(cand_text, exp_text);
                    similarity * 0.5 // 部分相似
                }
            }
            (Some(_), None) => 0.5, // 候选有文本，但目标没指定
            (None, Some(_)) => 0.0, // 候选没文本，但目标期望有
            (None, None) => 0.5,    // 都没有文本
        }
    }

    /// 计算 Content-Desc 匹配分数
    fn calculate_content_desc_score(
        &self,
        candidate: &CandidateElement,
        target: &TargetFeatures,
    ) -> f32 {
        match (&candidate.content_desc, &target.expected_content_desc) {
            (Some(cand_desc), Some(exp_desc)) => {
                if cand_desc == exp_desc {
                    1.0 // 完全匹配
                } else if cand_desc.contains(exp_desc) || exp_desc.contains(cand_desc) {
                    0.8 // 包含关系
                } else {
                    let similarity = calculate_string_similarity(cand_desc, exp_desc);
                    similarity * 0.6
                }
            }
            (Some(_), None) => 0.5,
            (None, Some(_)) => 0.0,
            (None, None) => 0.5,
        }
    }

    /// 计算空间距离分数（越近分数越高）
    fn calculate_spatial_score(
        &self,
        candidate: &CandidateElement,
        target: &TargetFeatures,
    ) -> f32 {
        if let (Some(ref bounds_str), Some((exp_x, exp_y))) =
            (&candidate.bounds, target.expected_position)
        {
            if let Some((cand_x, cand_y)) = parse_bounds_center(bounds_str) {
                let distance = calculate_euclidean_distance(cand_x, cand_y, exp_x, exp_y);

                // 距离转换为分数：
                // 0-50像素 → 1.0分
                // 50-200像素 → 0.8-0.5分
                // 200-500像素 → 0.5-0.2分
                // 500+像素 → 0.1分
                if distance < 50.0 {
                    1.0
                } else if distance < 200.0 {
                    1.0 - (distance - 50.0) / 150.0 * 0.3
                } else if distance < 500.0 {
                    0.7 - (distance - 200.0) / 300.0 * 0.5
                } else {
                    0.1
                }
            } else {
                0.5 // bounds解析失败
            }
        } else {
            0.5 // 缺少位置信息
        }
    }

    /// 计算 Resource-ID 匹配分数
    fn calculate_resource_id_score(
        &self,
        candidate: &CandidateElement,
        target: &TargetFeatures,
    ) -> f32 {
        match (&candidate.resource_id, &target.expected_resource_id) {
            (Some(cand_rid), Some(exp_rid)) => {
                if cand_rid == exp_rid {
                    1.0
                } else {
                    0.0
                }
            }
            (Some(_), None) => 0.3, // 有ID总比没有好
            (None, Some(_)) => 0.0,
            (None, None) => 0.5,
        }
    }

    /// 生成推荐原因
    fn generate_reasoning(
        &self,
        text_score: f32,
        content_desc_score: f32,
        spatial_score: f32,
        resource_id_score: f32,
        clickable_score: f32,
    ) -> Vec<String> {
        let mut reasons = Vec::new();

        if text_score > 0.8 {
            reasons.push(format!("✅ 文本匹配度高 ({:.0}%)", text_score * 100.0));
        } else if text_score > 0.5 {
            reasons.push(format!("⚠️ 文本部分匹配 ({:.0}%)", text_score * 100.0));
        }

        if content_desc_score > 0.8 {
            reasons.push(format!(
                "✅ Content-Desc匹配度高 ({:.0}%)",
                content_desc_score * 100.0
            ));
        }

        if spatial_score > 0.8 {
            reasons.push("✅ 位置接近期望位置".to_string());
        } else if spatial_score < 0.3 {
            reasons.push("⚠️ 位置较远".to_string());
        }

        if resource_id_score > 0.9 {
            reasons.push("✅ Resource-ID 完全匹配".to_string());
        }

        if clickable_score > 0.9 {
            reasons.push("✅ 可点击元素".to_string());
        } else {
            reasons.push("⚠️ 元素不可直接点击".to_string());
        }

        if reasons.is_empty() {
            reasons.push("⚠️ 匹配度一般".to_string());
        }

        reasons
    }
}

impl Default for CandidateEvaluator {
    fn default() -> Self {
        Self::new()
    }
}

/// 解析 bounds 字符串，返回中心点坐标
/// 例如: "[42,110][293,247]" -> (167, 178)
fn parse_bounds_center(bounds: &str) -> Option<(i32, i32)> {
    // 格式: "[left,top][right,bottom]"
    let bounds = bounds.trim();
    if !bounds.starts_with('[') || !bounds.ends_with(']') {
        return None;
    }

    // 分割两个坐标对
    let parts: Vec<&str> = bounds.split("][").collect();
    if parts.len() != 2 {
        return None;
    }

    // 解析第一个坐标对 (left, top)
    let first = parts[0].trim_start_matches('[');
    let first_coords: Vec<i32> = first
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    // 解析第二个坐标对 (right, bottom)
    let second = parts[1].trim_end_matches(']');
    let second_coords: Vec<i32> = second
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    if first_coords.len() == 2 && second_coords.len() == 2 {
        let left = first_coords[0];
        let top = first_coords[1];
        let right = second_coords[0];
        let bottom = second_coords[1];

        let center_x = (left + right) / 2;
        let center_y = (top + bottom) / 2;

        Some((center_x, center_y))
    } else {
        None
    }
}

/// 计算欧几里得距离
fn calculate_euclidean_distance(x1: i32, y1: i32, x2: i32, y2: i32) -> f32 {
    let dx = (x2 - x1) as f32;
    let dy = (y2 - y1) as f32;
    (dx * dx + dy * dy).sqrt()
}

/// 计算字符串相似度（简化的 Levenshtein 距离）
fn calculate_string_similarity(s1: &str, s2: &str) -> f32 {
    if s1 == s2 {
        return 1.0;
    }

    let len1 = s1.chars().count();
    let len2 = s2.chars().count();

    if len1 == 0 || len2 == 0 {
        return 0.0;
    }

    // 简化版：计算公共子串比例
    let common_chars = s1
        .chars()
        .filter(|c| s2.contains(*c))
        .count();

    common_chars as f32 / len1.max(len2) as f32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_bounds_center() {
        let bounds = "[42,110][293,247]";
        let center = parse_bounds_center(bounds);
        assert_eq!(center, Some((167, 178)));
    }

    #[test]
    fn test_euclidean_distance() {
        let distance = calculate_euclidean_distance(0, 0, 3, 4);
        assert!((distance - 5.0).abs() < 0.01);
    }

    #[test]
    fn test_string_similarity() {
        let sim1 = calculate_string_similarity("添加朋友", "添加朋友");
        assert_eq!(sim1, 1.0);

        let sim2 = calculate_string_similarity("添加朋友", "添加好友");
        assert!(sim2 > 0.5);

        let sim3 = calculate_string_similarity("", "test");
        assert_eq!(sim3, 0.0);
    }

    #[test]
    fn test_evaluate_candidates() {
        let evaluator = CandidateEvaluator::new();

        let candidates = vec![
            CandidateElement {
                bounds: Some("[42,110][293,247]".to_string()),
                text: None,
                content_desc: Some("添加朋友".to_string()),
                resource_id: None,
                clickable: true,
                class_name: Some("android.view.ViewGroup".to_string()),
                index: Some(0),
            },
            CandidateElement {
                bounds: Some("[500,500][600,600]".to_string()),
                text: Some("其他按钮".to_string()),
                content_desc: None,
                resource_id: None,
                clickable: true,
                class_name: Some("android.widget.Button".to_string()),
                index: Some(1),
            },
        ];

        let target = TargetFeatures {
            expected_text: None,
            expected_content_desc: Some("添加朋友".to_string()),
            expected_resource_id: None,
            expected_position: Some((167, 178)), // 接近第一个候选的中心
        };

        let results = evaluator.evaluate_candidates(&candidates, &target).unwrap();

        assert!(!results.is_empty());
        // 第一个候选应该得分更高
        assert_eq!(results[0].candidate_index, 0);
        assert!(results[0].total_score > 0.6);
    }
}
