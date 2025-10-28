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
    /// 🔥 子元素文本列表（从原始XML提取的所有子孙文本）
    pub children_texts: Vec<String>,
    /// 是否优先选择最后一个候选（防止选错第一个）
    pub prefer_last: bool,
    /// 🆕 用户选择的绝对全局XPath（最重要的匹配依据）
    pub selected_xpath: Option<String>,
    /// 🆕 完整的XML内容（用于提取候选元素的子元素文本）
    pub xml_content: Option<String>,
}

/// 多候选评估器
pub struct MultiCandidateEvaluator;

impl MultiCandidateEvaluator {
    /// 从多个匹配元素中选择最佳候选
    /// 
    /// # 评分规则（总分 > 2.0 - 完善版v3 - 强化"父容器+子文本"模式）
    /// - 🔥🔥🔥🔥🔥 子元素文本完全匹配：+1.0（Android核心UI模式，最高优先级！）
    /// - 🔥🔥🔥🔥   Bounds完全匹配：+0.7（用户精确选择，次高优先级）
    /// - 🔥🔥🔥     自身文本完全匹配：+0.5（直接文本匹配）
    /// - 🔥🔥       Content-desc匹配：+0.3（辅助识别）
    /// - 🔥         可点击性：+0.15（必须是可交互元素）
    /// - ☑️        Resource-id匹配：+0.1（资源ID辅助）
    /// -            位置偏好（最后）：+0.05（仅作为参考）
    /// 
    /// # 特殊处理
    /// - 如果有多个候选且评分相近（差距<0.05），优先选择最后一个（布局通常从上到下）
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
        
        // 🔥 特殊逻辑：如果前N名评分相近（差距<0.05），优先选择最后一个
        if scored_candidates.len() >= 2 && criteria.prefer_last {
            let top_score = scored_candidates[0].score;
            
            // 找出所有评分接近的候选（差距<0.05）
            let close_candidates: Vec<_> = scored_candidates.iter()
                .filter(|c| (top_score - c.score) < 0.05)
                .collect();
            
            if close_candidates.len() > 1 {
                // 找到原始candidates列表中最后一个接近候选
                let last_close_index = close_candidates.iter()
                    .map(|c| {
                        candidates.iter().position(|e| std::ptr::eq(*e, c.element)).unwrap_or(0)
                    })
                    .max()
                    .unwrap_or(0);
                
                tracing::warn!(
                    "⚠️ [候选评估] 前{}名评分接近（差距<0.05），根据prefer_last选择原列表第{}个",
                    close_candidates.len(),
                    last_close_index + 1
                );
                
                // 返回这个候选
                if let Some(pos) = scored_candidates.iter().position(|c| {
                    candidates.iter().position(|e| std::ptr::eq(*e, c.element)).unwrap_or(0) == last_close_index
                }) {
                    return scored_candidates.into_iter().nth(pos);
                }
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
        
        // 🔥🔥🔥🔥 评分项0: Bounds完全匹配（0-0.7分）用户精确选择，次高优先级
        if let (Some(ref original_bounds), Some(ref elem_bounds)) = 
            (&criteria.original_bounds, &elem.bounds) {
            // 解析bounds字符串：移除空格，比较
            let normalize = |s: &str| s.replace(" ", "");
            let orig_normalized = normalize(original_bounds);
            let elem_normalized = normalize(elem_bounds);
            
            if orig_normalized == elem_normalized {
                score += 0.7;  // ✅ 提升到0.7 - 用户精确选择
                reasons.push(format!("✅✅✅✅ Bounds完全匹配: '{}' (用户精确选择!)", elem_bounds));
            }
        }
        
        // 🔥🔥🔥🔥🔥 评分项1: 子元素文本匹配（0-1.0分）Android核心UI模式 - 最高优先级！
        // 这是Android UI的核心模式：父容器可点击 + 子元素包含文本/描述
        if let Some(ref target_text) = criteria.target_text {
            if !target_text.is_empty() {
                // 检查候选元素的子孙节点中是否包含目标文本
                let child_text_match = Self::check_child_text_match(elem, target_text, &criteria.xml_content);
                
                if child_text_match.is_complete {
                    score += 1.0;  // ✅✅✅ 提升到1.0 - Android核心UI模式，最高优先级！
                    reasons.push(format!("✅✅✅✅✅✅ 子元素文本完全匹配: '{}' (父容器+子文本模式 - Android核心架构)", target_text));
                } else if child_text_match.is_partial {
                    score += 0.5;  // ✅ 提升到0.5
                    reasons.push(format!("🟡🟡🟡 子元素文本部分匹配: '{}'", target_text));
                } else {
                    reasons.push(format!("⚠️ 子元素中未找到目标文本: '{}'", target_text));
                }
            }
        }
        
        // 🔥🔥🔥 评分项2: 自身文本匹配（0-0.5分）
        if let Some(ref target_text) = criteria.target_text {
            if let Some(ref elem_text) = elem.text {
                let text_score = TextComparator::calculate_similarity(target_text, elem_text);
                
                if text_score >= 0.95 {
                    score += 0.5;  // ✅ 提升到0.5
                    reasons.push(format!("✅✅✅ 自身文本完全匹配: '{}'", elem_text));
                } else if text_score >= 0.7 {
                    let partial_score = 0.5 * text_score;  // ✅ 基于0.5计算
                    score += partial_score;
                    reasons.push(format!("🟡🟡 自身文本部分匹配: '{}' (相似度: {:.2})", elem_text, text_score));
                } else {
                    reasons.push(format!("❌ 自身文本不匹配: '{}' vs '{}'", elem_text, target_text));
                }
            } else {
                reasons.push("⚠️ 元素无text属性".to_string());
            }
        }
        
        // 🔥🔥 评分项3: Content-desc匹配（0-0.3分）
        if let Some(ref target_desc) = criteria.target_content_desc {
            if let Some(ref elem_desc) = elem.content_desc {
                if elem_desc == target_desc {
                    score += 0.3;  // ✅ 提升到0.3
                    reasons.push(format!("✅✅ Content-desc完全匹配: '{}'", elem_desc));
                } else if elem_desc.contains(target_desc) || target_desc.contains(elem_desc) {
                    score += 0.15;  // ✅ 提升到0.15
                    reasons.push(format!("🟡 Content-desc部分匹配: '{}'", elem_desc));
                } else {
                    reasons.push(format!("❌ Content-desc不匹配: '{}' vs '{}'", elem_desc, target_desc));
                }
            }
        }
        
        // 🔥 评分项4: 可点击属性（0-0.15分）- 必须是可交互元素
        if let Some(is_clickable) = elem.clickable {
            if is_clickable {
                score += 0.15;  // ✅ 提升到0.15 - 可点击性非常重要
                reasons.push("✅ 元素可点击 (+0.15)".to_string());
            } else {
                reasons.push("⚠️ 元素不可点击 (0.0)".to_string());
            }
        }
        
        // ☑️ 评分项5: Resource-id匹配（0-0.1分）
        if let Some(ref target_resource_id) = criteria.original_resource_id {
            if !target_resource_id.is_empty() {
                if let Some(ref elem_resource_id) = elem.resource_id {
                    if elem_resource_id == target_resource_id {
                        score += 0.1;  // ✅ 提升到0.1
                        reasons.push(format!("✅ Resource-id完全匹配: '{}'", elem_resource_id));
                    } else {
                        reasons.push(format!("❌ Resource-id不匹配: '{}' vs '{}'", elem_resource_id, target_resource_id));
                    }
                }
            }
        }
        
        
        // 📍 评分项6: 位置偏好（最后一个候选 +0.05，仅作为决胜因素）
        if criteria.prefer_last && index == total - 1 {
            score += 0.05;
            reasons.push("🎯 位置偏好: 最后一个候选 (+0.05)".to_string());
        }
        
        (score, reasons)
    }
    
    /// 🔥 检查子元素文本匹配（核心架构特征）
    /// 
    /// Android UI常见模式：父容器可点击 + 子元素包含文本/描述
    /// 例如：
    /// ```xml
    /// <node resource-id="com.ss.android.ugc.aweme:id/iwk" clickable="true">
    ///   <node resource-id="icon" class="ImageView" />
    ///   <node text="通讯录" class="TextView" clickable="false" />
    /// </node>
    /// ```
    fn check_child_text_match(
        elem: &UIElement,
        target_text: &str,
        xml_content: &Option<String>,
    ) -> ChildTextMatchResult {
        // 策略1: 检查元素自身的text属性
        if let Some(ref elem_text) = elem.text {
            if elem_text == target_text {
                return ChildTextMatchResult {
                    is_complete: true,
                    is_partial: false,
                    matched_text: Some(elem_text.clone()),
                };
            } else if elem_text.contains(target_text) {
                return ChildTextMatchResult {
                    is_complete: false,
                    is_partial: true,
                    matched_text: Some(elem_text.clone()),
                };
            }
        }
        
        // 策略2: 检查元素的content-desc属性（也可能包含目标文本）
        if let Some(ref elem_desc) = elem.content_desc {
            if elem_desc == target_text {
                return ChildTextMatchResult {
                    is_complete: true,
                    is_partial: false,
                    matched_text: Some(elem_desc.clone()),
                };
            } else if elem_desc.contains(target_text) {
                return ChildTextMatchResult {
                    is_complete: false,
                    is_partial: true,
                    matched_text: Some(elem_desc.clone()),
                };
            }
        }
        
        // 策略3: 从XML中提取子元素文本（🔥 完整实现）
        if let (Some(xml), Some(elem_bounds)) = (xml_content, &elem.bounds) {
            // 1. 在XML中定位该元素（通过bounds精确匹配）
            if let Some(element_fragment) = Self::extract_element_fragment_by_bounds(xml, elem_bounds) {
                // 2. 提取该元素的所有子孙节点文本
                let child_texts = Self::extract_all_child_texts(&element_fragment);
                
                // 3. 检查是否包含目标文本
                for child_text in child_texts {
                    if child_text == target_text {
                        return ChildTextMatchResult {
                            is_complete: true,
                            is_partial: false,
                            matched_text: Some(child_text),
                        };
                    } else if child_text.contains(target_text) {
                        return ChildTextMatchResult {
                            is_complete: false,
                            is_partial: true,
                            matched_text: Some(child_text),
                        };
                    }
                }
            }
        }
        
        ChildTextMatchResult {
            is_complete: false,
            is_partial: false,
            matched_text: None,
        }
    }
    
    /// 通过bounds在XML中定位元素并提取其片段
    /// 返回从该元素开始到其结束标签（或下一个同级元素）的XML片段
    fn extract_element_fragment_by_bounds(xml: &str, target_bounds: &str) -> Option<String> {
        // 标准化bounds格式（移除空格）
        let normalized_target = target_bounds.replace(" ", "");
        
        // 构建搜索模式：bounds="[x,y][x,y]"
        let search_pattern = format!("bounds=\"{}\"", normalized_target);
        
        // 查找包含该bounds的元素起始位置
        if let Some(bounds_pos) = xml.find(&search_pattern) {
            // 向前查找该node的开始标签 <node
            if let Some(node_start) = xml[..bounds_pos].rfind("<node") {
                // 向后查找该node的结束（可能是 /> 或 </node>）
                let after_bounds = &xml[bounds_pos..];
                
                // 查找最近的 /> 或 >
                if let Some(tag_close) = after_bounds.find('>') {
                    let tag_close_abs = bounds_pos + tag_close;
                    
                    // 检查是自闭合标签还是有子元素
                    if xml[bounds_pos..tag_close_abs].contains("/>") {
                        // 自闭合标签，只返回这一行
                        return Some(xml[node_start..tag_close_abs + 1].to_string());
                    } else {
                        // 有子元素，需要找到对应的 </node>
                        // 使用嵌套深度追踪来找到正确的结束标签
                        let mut depth = 1;
                        let mut pos = tag_close_abs + 1;
                        let xml_bytes = xml.as_bytes();
                        
                        while pos < xml_bytes.len() && depth > 0 {
                            if let Some(next_tag) = xml[pos..].find('<') {
                                pos += next_tag;
                                
                                if xml[pos..].starts_with("</node>") {
                                    depth -= 1;
                                    if depth == 0 {
                                        // 找到匹配的结束标签
                                        return Some(xml[node_start..pos + 7].to_string());
                                    }
                                    pos += 7;
                                } else if xml[pos..].starts_with("<node") {
                                    depth += 1;
                                    pos += 5;
                                } else {
                                    pos += 1;
                                }
                            } else {
                                break;
                            }
                        }
                        
                        // 如果没找到结束标签，返回从开始到XML结尾（兜底）
                        return Some(xml[node_start..].chars().take(5000).collect());
                    }
                }
            }
        }
        
        None
    }
    
    /// 从XML片段中提取所有子孙节点的text和content-desc属性
    fn extract_all_child_texts(xml_fragment: &str) -> Vec<String> {
        let mut texts = Vec::new();
        
        // 限制搜索范围（防止超大XML导致性能问题）
        let search_fragment: String = xml_fragment.chars().take(5000).collect();
        
        // 提取所有 text="..." 属性
        let mut pos = 0;
        while let Some(text_start) = search_fragment[pos..].find("text=\"") {
            let absolute_start = pos + text_start + 6; // 跳过 'text="'
            if let Some(text_end) = search_fragment[absolute_start..].find('"') {
                let text_value = &search_fragment[absolute_start..absolute_start + text_end];
                // 收集非空且有意义的文本（长度2-50）
                if !text_value.trim().is_empty() && text_value.len() >= 2 && text_value.len() <= 50 {
                    texts.push(text_value.trim().to_string());
                }
                pos = absolute_start + text_end + 1;
            } else {
                break;
            }
        }
        
        // 提取所有 content-desc="..." 属性
        pos = 0;
        while let Some(desc_start) = search_fragment[pos..].find("content-desc=\"") {
            let absolute_start = pos + desc_start + 14; // 跳过 'content-desc="'
            if let Some(desc_end) = search_fragment[absolute_start..].find('"') {
                let desc_value = &search_fragment[absolute_start..absolute_start + desc_end];
                // 收集非空且有意义的描述（长度2-100）
                if !desc_value.trim().is_empty() && desc_value.len() >= 2 && desc_value.len() <= 100 {
                    let trimmed = desc_value.trim().to_string();
                    // 避免重复
                    if !texts.contains(&trimmed) {
                        texts.push(trimmed);
                    }
                }
                pos = absolute_start + desc_end + 1;
            } else {
                break;
            }
        }
        
        texts
    }
    
    /// 计算XPath相似度
    /// 比较两个XPath的结构相似程度（基于路径段匹配）
    fn calculate_xpath_similarity(xpath1: &str, xpath2: &str) -> f32 {
        // 分割XPath为段
        let segments1: Vec<&str> = xpath1.split('/').filter(|s| !s.is_empty()).collect();
        let segments2: Vec<&str> = xpath2.split('/').filter(|s| !s.is_empty()).collect();
        
        if segments1.is_empty() || segments2.is_empty() {
            return 0.0;
        }
        
        let min_len = segments1.len().min(segments2.len());
        let max_len = segments1.len().max(segments2.len());
        
        let mut matches = 0;
        for i in 0..min_len {
            // 简化对比：移除属性谓词后对比节点名
            let seg1_clean = segments1[i].split('[').next().unwrap_or("");
            let seg2_clean = segments2[i].split('[').next().unwrap_or("");
            
            if seg1_clean == seg2_clean {
                matches += 1;
            }
        }
        
        (matches as f32) / (max_len as f32)
    }
    
    /// 解析bounds字符串为矩形坐标
    /// 格式: "[x1,y1][x2,y2]" → (x1, y1, x2, y2)
    fn parse_bounds(bounds: &str) -> Result<(f32, f32, f32, f32), String> {
        // 移除空格并解析
        let cleaned = bounds.replace(" ", "");
        
        // 提取两个坐标点
        let parts: Vec<&str> = cleaned.trim_matches(|c| c == '[' || c == ']')
            .split("][")
            .collect();
        
        if parts.len() != 2 {
            return Err(format!("Invalid bounds format: {}", bounds));
        }
        
        // 解析第一个点 (x1, y1)
        let p1: Vec<&str> = parts[0].split(',').collect();
        if p1.len() != 2 {
            return Err(format!("Invalid first point: {}", parts[0]));
        }
        let x1 = p1[0].parse::<f32>().map_err(|e| e.to_string())?;
        let y1 = p1[1].parse::<f32>().map_err(|e| e.to_string())?;
        
        // 解析第二个点 (x2, y2)
        let p2: Vec<&str> = parts[1].split(',').collect();
        if p2.len() != 2 {
            return Err(format!("Invalid second point: {}", parts[1]));
        }
        let x2 = p2[0].parse::<f32>().map_err(|e| e.to_string())?;
        let y2 = p2[1].parse::<f32>().map_err(|e| e.to_string())?;
        
        Ok((x1, y1, x2, y2))
    }
    
    /// 计算两个矩形的中心点距离
    fn bounds_distance(rect1: &(f32, f32, f32, f32), rect2: &(f32, f32, f32, f32)) -> f32 {
        // 计算中心点
        let center1_x = (rect1.0 + rect1.2) / 2.0;
        let center1_y = (rect1.1 + rect1.3) / 2.0;
        let center2_x = (rect2.0 + rect2.2) / 2.0;
        let center2_y = (rect2.1 + rect2.3) / 2.0;
        
        // 欧几里得距离
        let dx = center1_x - center2_x;
        let dy = center1_y - center2_y;
        (dx * dx + dy * dy).sqrt()
    }
}

/// 子元素文本匹配结果
#[derive(Debug, Clone)]
struct ChildTextMatchResult {
    /// 完全匹配（文本完全相同）
    is_complete: bool,
    /// 部分匹配（包含目标文本）
    is_partial: bool,
    /// 匹配到的文本内容
    matched_text: Option<String>,
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
            selected_xpath: None,
            xml_content: None,
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
