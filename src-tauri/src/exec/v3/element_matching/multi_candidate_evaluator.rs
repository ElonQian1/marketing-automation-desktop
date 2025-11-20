// src-tauri/src/exec/v3/element_matching/multi_candidate_evaluator.rs
// module: v3-execution | layer: matching | role: 多候选评估器
// summary: 对多个XPath匹配结果进行综合评分，选择最佳候选

use crate::services::universal_ui_page_analyzer::UIElement;
use super::spatial_distance::calculate_distance;
use super::text_comparator::TextComparator;
use super::super::semantic_analyzer::{SemanticAnalyzer, TextMatchingMode};

/// 匹配候选
#[derive(Debug, Clone)]
pub struct MatchCandidate<'a> {
    pub element: &'a UIElement,
    pub xpath: String,
    pub score: f32,
    pub reasons: Vec<String>,
}

/// 父元素信息（用于安全模式检测）
#[derive(Debug, Clone)]
pub struct ParentInfo {
    /// 父元素的content-desc
    pub content_desc: String,
    /// 父元素的text
    pub text: String,
    /// 父元素的resource-id
    pub resource_id: String,
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
    /// 🔥 兄弟元素文本列表（用于安全模式检测）
    pub sibling_texts: Vec<String>,
    /// 🆕 父元素信息（用于安全模式检测）
    pub parent_info: Option<ParentInfo>,
    /// 🆕 匹配策略标记（如"middleLayerContainer"）
    pub matching_strategy: Option<String>,
    /// 是否优先选择最后一个候选（防止选错第一个）
    pub prefer_last: bool,
    /// 🆕 用户选择的绝对全局XPath（最重要的匹配依据）
    pub selected_xpath: Option<String>,
    /// 🆕 完整的XML内容（用于提取候选元素的子元素文本）
    pub xml_content: Option<String>,
    /// 🆕 语义分析器（可选，用于配置化的反义词检测）
    pub semantic_analyzer: Option<SemanticAnalyzer>,
}

/// 多候选评估器
pub struct MultiCandidateEvaluator;

impl MultiCandidateEvaluator {
    /// 使用语义分析器检查文本匹配
    fn analyze_semantic_match(
        target_text: &str,
        candidate_text: &str,
        semantic_analyzer: Option<&SemanticAnalyzer>,
    ) -> (bool, f32, String) {
        // 如果没有语义分析器，默认允许匹配
        let Some(analyzer) = semantic_analyzer else {
            return (true, 0.0, "无语义分析器，允许匹配".to_string());
        };

        let result = analyzer.analyze_text_match(target_text, candidate_text);
        
        if result.should_match {
            (true, result.score_adjustment, result.reason)
        } else {
            // 反义词或不匹配的情况
            (false, result.score_adjustment, result.reason)
        }
    }

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
        
        // 🔥🔥🔥🔥🔥 XPath安全模式检测：防止无文本锚点时乱点
        // 检查是否应该使用XPath安全模式（无子/兄弟/父元素文本时）
        use super::xpath_similarity_matcher::XPathSimilarityMatcher;
        let should_use_xpath_mode = XPathSimilarityMatcher::should_use_xpath_mode(
            &criteria.children_texts,
            &criteria.sibling_texts,
            &criteria.parent_info,
        );
        
        if should_use_xpath_mode {
            reasons.push("⚠️ [安全模式] 无文本锚点，启用Bounds严格匹配（防止乱点）".to_string());
            
            // 🔥 Bounds严格匹配（XPath安全模式下的主要策略）
            if let Some(ref original_bounds) = &criteria.original_bounds {
                let elem_bounds_str = elem.bounds.to_string();
                use super::bounds_matcher::BoundsMatcher;
                let bounds_match = BoundsMatcher::match_bounds(original_bounds, &elem_bounds_str);
                
                if bounds_match.is_exact {
                    // Bounds完全匹配，高分
                    score += 3.0;
                    reasons.push(format!("✅✅✅✅✅ Bounds完全匹配 (+3.0, 安全模式)"));
                } else if bounds_match.match_quality > 0.9 {
                    // Bounds高度相似（IOU > 0.9 或包含关系），中高分
                    let bounds_score = 2.5 * bounds_match.match_quality;
                    score += bounds_score;
                    reasons.push(format!(
                        "✅✅✅✅ Bounds高质量匹配: quality={:.2}, IOU={:.2} (+{:.2}, 安全模式)",
                        bounds_match.match_quality, bounds_match.iou, bounds_score
                    ));
                } else if bounds_match.match_quality > 0.8 {
                    // Bounds中高相似度
                    let bounds_score = 2.0 * bounds_match.match_quality;
                    score += bounds_score;
                    reasons.push(format!(
                        "✅✅✅ Bounds中高匹配: quality={:.2}, IOU={:.2} (+{:.2}, 安全模式)",
                        bounds_match.match_quality, bounds_match.iou, bounds_score
                    ));
                } else if bounds_match.match_quality > 0.7 {
                    // Bounds中等相似度
                    let bounds_score = 1.5 * bounds_match.match_quality;
                    score += bounds_score;
                    reasons.push(format!(
                        "🟡🟡 Bounds中等匹配: quality={:.2}, IOU={:.2} (+{:.2}, 安全模式)",
                        bounds_match.match_quality, bounds_match.iou, bounds_score
                    ));
                } else {
                    // Bounds相似度太低
                    let bounds_score = 0.5 * bounds_match.match_quality;
                    score += bounds_score;
                    reasons.push(format!(
                        "⚠️ Bounds低相似度: quality={:.2}, IOU={:.2} (+{:.2}, 可能不是目标元素)",
                        bounds_match.match_quality, bounds_match.iou, bounds_score
                    ));
                }
                
                // 🔥 安全检查：Resource-id辅助验证
                if let (Some(ref target_resource_id), Some(ref elem_resource_id)) = 
                    (&criteria.original_resource_id, &elem.resource_id) {
                    if !target_resource_id.is_empty() && target_resource_id == elem_resource_id {
                        score += 0.5;
                        reasons.push(format!("✅ Resource-id匹配 (+0.5, 安全模式加成)"));
                    } else if !target_resource_id.is_empty() && target_resource_id != elem_resource_id {
                        // Resource-id不匹配，严重扣分
                        score -= 0.5;
                        reasons.push(format!(
                            "⚠️ Resource-id不匹配: '{}' vs '{}' (-0.5, 安全模式惩罚)",
                            elem_resource_id,
                            target_resource_id
                        ));
                    }
                }
                
                // 安全模式总结
                reasons.push(format!("🔒 [安全模式总结] 基于Bounds严格匹配，总分: {:.2}", score));
                
            } else {
                // 没有Bounds信息，无法安全匹配
                reasons.push("❌ [安全模式失败] 缺少Bounds信息，无法安全匹配".to_string());
                return (0.0, reasons); // 返回0分，防止乱点
            }
            
            // 提前返回，不再评估其他项（防止乱点）
            return (score, reasons);
        }
        
        // 🔥🔥🔥🔥 评分项0: Bounds完全匹配（0-0.7分）用户精确选择，次高优先级
        if let Some(ref original_bounds) = &criteria.original_bounds {
            let elem_bounds_str = elem.bounds.to_string();
            // 解析bounds字符串：移除空格，比较
            let normalize = |s: &str| s.replace(" ", "");
            let orig_normalized = normalize(original_bounds);
            let elem_normalized = normalize(&elem_bounds_str);
            
            if orig_normalized == elem_normalized {
                score += 0.7;  // ✅ 提升到0.7 - 用户精确选择
                reasons.push(format!("✅✅✅✅ Bounds完全匹配: '{}' (用户精确选择!)", elem_bounds_str));
            }
        }
        
        // 🔥🔥🔥🔥🔥 评分项1: 子元素文本匹配（0-1.0分）Android核心UI模式 - 最高优先级！
        // 这是Android UI的核心模式：父容器可点击 + 子元素包含文本/描述
        if let Some(ref target_text) = criteria.target_text {
            if !target_text.is_empty() {
                // 检查候选元素的子孙节点中是否包含目标文本
                let child_text_match = Self::check_child_text_match(
                    elem, 
                    target_text, 
                    &criteria.xml_content,
                    criteria.semantic_analyzer.as_ref(),
                );
                
                // 🚨 特殊处理：如果检测到语义相反，严重降分
                if matches!(child_text_match.match_source, MatchSource::SemanticOpposite) {
                    score -= 2.0; // 严重降分，确保反义词不会被选中
                    reasons.push(format!(
                        "🚨🚨🚨 检测到语义相反状态: 目标='{}' vs 候选='{}' (-2.0, 反义词惩罚)",
                        target_text,
                        child_text_match.matched_text.unwrap_or_default()
                    ));
                } else if child_text_match.is_complete {
                    score += 1.0;  // ✅ 提升到1.0 - Android核心UI模式，最高优先级！
                    reasons.push(format!(
                        "✅✅✅✅✅✅ 子元素文本完全匹配: '{}' (父容器+子文本模式 - Android核心架构, 来源: {:?})",
                        target_text,
                        child_text_match.match_source
                    ));
                } else if child_text_match.is_partial {
                    score += 0.5;  // ✅ 提升到0.5
                    reasons.push(format!(
                        "🟡🟡🟡 子元素文本部分匹配: '{}' (来源: {:?})",
                        target_text,
                        child_text_match.match_source
                    ));
                } else {
                    reasons.push(format!("⚠️ 子元素中未找到目标文本: '{}'", target_text));
                }
            }
        }
        
        // 🔥🔥🔥 评分项2: 自身文本匹配（0-0.5分）
        let elem_text = &elem.text;
        let elem_desc = &elem.content_desc;

        if let Some(ref target_text) = criteria.target_text {

            if !elem_text.is_empty() {
                //  修复：如果content-desc与target完全匹配，则跳过text的严格检查
                // 这是Android常见模式：父容器的content-desc聚合了子元素信息
                let has_matching_content_desc = if let Some(ref target_desc) = criteria.target_content_desc {
                    if !elem_desc.is_empty() {
                        elem_desc == target_desc || target_desc == target_text
                    } else {
                        false
                    }
                } else {
                    false
                };

                if has_matching_content_desc {
                    // 有content-desc完全匹配，不因text不匹配而严重降分
                    let text_score = TextComparator::calculate_similarity(target_text, elem_text);
                    if text_score >= 0.95 {
                        score += 0.5;
                        reasons.push(format!("✅✅✅ 自身文本完全匹配: '{}'", elem_text));
                    } else if text_score >= 0.3 {
                        // 文本部分匹配，但有content-desc保底，给予少量加分
                        let partial_score = 0.2 * text_score;
                        score += partial_score;
                        reasons.push(format!("🟡 自身文本部分匹配: '{}' (相似度: {:.2}, 有content-desc保底)", elem_text, text_score));
                    } else {
                        // 文本不匹配，但content-desc匹配，这是正常情况（如"我" vs "我，按钮"）
                        reasons.push(format!("ℹ️ 自身text='{}' 不同于target='{}', 但content-desc已匹配（父容器+子文本模式）", elem_text, target_text));
                    }
                } else {
                    // 没有content-desc匹配，正常进行语义检查
                    let (should_match, score_adjustment, reason) = Self::analyze_semantic_match(
                        target_text,
                        elem_text,
                        criteria.semantic_analyzer.as_ref(),
                    );

                    if !should_match {
                        score += score_adjustment; // 通常是负分
                        reasons.push(format!(
                            "🚨🚨🚨 自身文本语义检查: 目标='{}' vs 元素='{}' ({:.1}分, {})",
                            target_text, elem_text, score_adjustment, reason
                        ));
                    } else {
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
                    }
                }
            } else {
                reasons.push("⚠️ 元素无text属性".to_string());
            }
        }
        
        // 🔥🔥 评分项3: Content-desc匹配（0-0.3分）
        if let Some(ref target_desc) = criteria.target_content_desc {
            if !elem.content_desc.is_empty() {
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
        let is_clickable = elem.clickable; {
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
    
    /// 🔥 检查子元素文本匹配（核心架构特征 - 增强版）
    /// 
    /// Android UI常见模式：父容器可点击 + 子元素包含文本/描述
    /// 例如：
    /// ```xml
    /// <node resource-id="com.ss.android.ugc.aweme:id/iwk" clickable="true" content-desc="通讯录，">
    ///   <node resource-id="icon" class="ImageView" />
    ///   <node text="通讯录" class="TextView" clickable="false" />
    /// </node>
    /// ```
    fn check_child_text_match(
        elem: &UIElement,
        target_text: &str,
        xml_content: &Option<String>,
        semantic_analyzer: Option<&SemanticAnalyzer>,
    ) -> ChildTextMatchResult {
        // 策略0（新增）: 检查父元素的content-desc
        {
            let elem_desc = &elem.content_desc;
            if !elem_desc.is_empty() {
                // 🚨【语义分析】首先检查是否是语义相反的状态
                let (should_match, _score_adjustment, reason) = Self::analyze_semantic_match(
                    target_text,
                    elem_desc,
                    semantic_analyzer,
                );

                if !should_match {
                    tracing::warn!("🚨 [语义分析] 检测到不匹配状态: 目标='{}', 候选='{}', 原因: {}", 
                                  target_text, elem_desc, reason);
                    return ChildTextMatchResult {
                        is_complete: false,
                        is_partial: false,
                        matched_text: Some(elem_desc.clone()),
                        match_source: MatchSource::SemanticOpposite,
                    };
                }
                
                // 完全匹配
                if elem_desc == target_text {
                    // 🔕 临时禁用：测试时噪音过大
                    // tracing::debug!("✅ [子元素匹配] 策略0成功: 父元素content-desc完全匹配 '{}'", target_text);
                    return ChildTextMatchResult {
                        is_complete: true,
                        is_partial: false,
                        matched_text: Some(elem_desc.clone()),
                        match_source: MatchSource::ParentContentDesc,
                    };
                }
                
                // 🔥 关键逻辑：检查是否以目标文本开头（可能后面跟着标点符号）
                // "通讯录，" 以 "通讯录" 开头
                if elem_desc.starts_with(target_text) {
                    // 检查后面是否是标点符号或空白
                    let after_text = &elem_desc[target_text.len()..];
                    if after_text.is_empty() || after_text.chars().next().map_or(false, |c| {
                        c.is_whitespace() || "，。、；：！？,. ;:!?".contains(c)
                    }) {
                        // 🔕 临时禁用：测试时噪音过大
                        // tracing::debug!("✅ [子元素匹配] 策略0成功: 父元素content-desc以目标文本开头 '{}'", elem_desc);
                        return ChildTextMatchResult {
                            is_complete: true,
                            is_partial: false,
                            matched_text: Some(elem_desc.clone()),
                            match_source: MatchSource::ParentContentDesc,
                        };
                    }
                }
                
                // 部分包含（但要排除反义词情况）
                if elem_desc.contains(target_text) {
                    // 🔕 临时禁用：测试时噪音过大
                    // tracing::debug!("🟡 [子元素匹配] 策略0部分成功: 父元素content-desc包含目标文本 '{}'", target_text);
                    return ChildTextMatchResult {
                        is_complete: false,
                        is_partial: true,
                        matched_text: Some(elem_desc.clone()),
                        match_source: MatchSource::ParentContentDesc,
                    };
                }
            }
        }
        
        // 策略1: 检查元素自身的text属性
        {
            let elem_text = &elem.text;
            if !elem_text.is_empty() {
                // 🚨【语义分析】首先检查是否是语义相反的状态
                let (should_match, _score_adjustment, reason) = Self::analyze_semantic_match(
                    target_text,
                    elem_text,
                    semantic_analyzer,
                );

                if !should_match {
                    tracing::warn!("🚨 [语义分析] 检测到不匹配状态: 目标='{}', 候选='{}', 原因: {}", 
                                  target_text, elem_text, reason);
                    return ChildTextMatchResult {
                        is_complete: false,
                        is_partial: false,
                        matched_text: Some(elem_text.clone()),
                        match_source: MatchSource::SemanticOpposite,
                    };
                }
                
                if elem_text == target_text {
                    // 🔕 临时禁用：测试时噪音过大
                    // tracing::debug!("✅ [子元素匹配] 策略1成功: 元素自身text完全匹配 '{}'", target_text);
                    return ChildTextMatchResult {
                        is_complete: true,
                        is_partial: false,
                        matched_text: Some(elem_text.clone()),
                        match_source: MatchSource::SelfText,
                    };
                } else if elem_text.contains(target_text) {
                    // 🔕 临时禁用：测试时噪音过大
                    // tracing::debug!("🟡 [子元素匹配] 策略1部分成功: 元素自身text包含目标文本 '{}'", target_text);
                    return ChildTextMatchResult {
                        is_complete: false,
                        is_partial: true,
                        matched_text: Some(elem_text.clone()),
                        match_source: MatchSource::SelfText,
                    };
                }
            }
        }
        
        // 策略2: 检查元素自身的content-desc属性（注意：这里是检查精确匹配，与策略0不同）
        {
            let elem_desc = &elem.content_desc;
            if !elem_desc.is_empty() {
                if elem_desc == target_text {
                    // 🔕 临时禁用：测试时噪音过大
                    // tracing::debug!("✅ [子元素匹配] 策略2成功: 元素自身content-desc完全匹配 '{}'", target_text);
                    return ChildTextMatchResult {
                        is_complete: true,
                        is_partial: false,
                        matched_text: Some(elem_desc.clone()),
                        match_source: MatchSource::SelfContentDesc,
                    };
                } else if elem_desc.contains(target_text) {
                    // 🔕 临时禁用：测试时噪音过大
                    // tracing::debug!("🟡 [子元素匹配] 策略2部分成功: 元素自身content-desc包含目标文本 '{}'", target_text);
                    return ChildTextMatchResult {
                        is_complete: false,
                        is_partial: true,
                        matched_text: Some(elem_desc.clone()),
                        match_source: MatchSource::SelfContentDesc,
                    };
                }
            }
        }
        
        // 策略3: 从XML中提取子元素文本（🔥 完整实现）
        if let Some(xml) = xml_content {
            let elem_bounds = &elem.bounds;
            // 🔕 临时禁用：测试时噪音过大
            // tracing::debug!("🔍 [子元素匹配] 策略3: 从XML提取子元素文本, bounds={}", elem_bounds);
            
            // 1. 在XML中定位该元素（通过bounds精确匹配）
            let elem_bounds_str = elem_bounds.to_string();
            if let Some(element_fragment) = Self::extract_element_fragment_by_bounds(xml, &elem_bounds_str) {
                // 2. 提取该元素的所有子孙节点文本
                let child_texts = Self::extract_all_child_texts(&element_fragment);
                
                // 🔕 临时禁用：测试时噪音过大
                // tracing::debug!("  找到 {} 个子元素文本: {:?}", child_texts.len(), child_texts);
                
                // 3. 检查是否包含目标文本
                for child_text in child_texts {
                    if child_text == target_text {
                        // ✅ 保留：这是成功匹配的关键日志
                        tracing::info!("✅✅ [子元素匹配] 策略3成功: XML子元素文本完全匹配 '{}'", target_text);
                        return ChildTextMatchResult {
                            is_complete: true,
                            is_partial: false,
                            matched_text: Some(child_text),
                            match_source: MatchSource::ChildXmlText,
                        };
                    } else if child_text.contains(target_text) {
                        // 🔕 临时禁用：测试时噪音过大
                        // tracing::debug!("🟡 [子元素匹配] 策略3部分成功: XML子元素文本包含目标文本 '{}'", target_text);
                        return ChildTextMatchResult {
                            is_complete: false,
                            is_partial: true,
                            matched_text: Some(child_text),
                            match_source: MatchSource::ChildXmlText,
                        };
                    }
                }
            } else {
                tracing::warn!("⚠️ [子元素匹配] 策略3失败: 无法在XML中找到bounds={} 的元素", elem_bounds);
            }
        } else {
            if xml_content.is_none() {
                tracing::warn!("⚠️ [子元素匹配] 策略3跳过: xml_content为None，无法提取子元素文本");
            }
        }
        
        // 策略4（新增）：如果没有XML，尝试通过resource-id和content-desc推断
        if xml_content.is_none() {
            // 检查是否是常见的容器resource-id模式
            let container_patterns = ["iwk", "container", "wrapper", "item", "layout", "holder"];
            if let Some(ref rid) = elem.resource_id {
                if container_patterns.iter().any(|p| rid.to_lowercase().contains(p)) {
                    tracing::warn!("⚠️ [子元素匹配] 策略4: 疑似父容器元素(resource-id={}), 但缺少XML无法验证子元素文本", rid);
                    
                    // 如果父元素的content-desc包含目标文本的一部分，给予部分分数
                    if !elem.content_desc.is_empty() {
                        if elem.content_desc.contains(target_text) {
                            return ChildTextMatchResult {
                                is_complete: false,
                                is_partial: true,
                                matched_text: Some(elem.content_desc.clone()),
                                match_source: MatchSource::Heuristic,
                            };
                        }
                    }
                }
            }
        }
        
        // 🔕 临时禁用：测试时噪音过大
        // tracing::debug!("❌ [子元素匹配] 所有策略失败: 未找到目标文本 '{}'", target_text);
        ChildTextMatchResult {
            is_complete: false,
            is_partial: false,
            matched_text: None,
            match_source: MatchSource::None,
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

/// 子元素文本匹配结果（增强版）
#[derive(Debug, Clone)]
struct ChildTextMatchResult {
    /// 完全匹配（文本完全相同）
    is_complete: bool,
    /// 部分匹配（包含目标文本）
    is_partial: bool,
    /// 匹配到的文本内容
    matched_text: Option<String>,
    /// 🆕 匹配来源（用于调试和日志）
    match_source: MatchSource,
}

impl Default for ChildTextMatchResult {
    fn default() -> Self {
        Self {
            is_complete: false,
            is_partial: false,
            matched_text: None,
            match_source: MatchSource::None,
        }
    }
}

/// 匹配来源类型
#[derive(Debug, Clone)]
enum MatchSource {
    /// 元素自身text属性
    SelfText,
    /// 元素自身content-desc属性
    SelfContentDesc,
    /// 父元素的content-desc（可能包含子元素文本聚合）
    ParentContentDesc,
    /// 从XML提取的子元素text
    ChildXmlText,
    /// 从XML提取的子元素content-desc
    ChildXmlDesc,
    /// 启发式推断
    Heuristic,
    /// 🚨 语义相反（反义词）
    SemanticOpposite,
    /// 未匹配
    None,
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
            sibling_texts: vec![],
            parent_info: None,
            matching_strategy: None,
            prefer_last: false,
            selected_xpath: None,
            xml_content: None,
            semantic_analyzer: None,
        };
        
        let result = MultiCandidateEvaluator::evaluate_candidates(candidates, &criteria);
        assert!(result.is_some());
        assert_eq!(result.unwrap().score, 1.0);
    }
    
    #[test]
    fn test_parent_clickable_child_text_pattern() {
        // 测试"父可点击+子文本"的Android核心模式
        let parent_elem = UIElement {
            text: None,
            content_desc: Some("通讯录，".to_string()),  // 父元素content-desc包含子元素文本的聚合
            resource_id: Some("com.ss.android.ugc.aweme:id/iwk".to_string()),
            bounds: Some("[45,1059][249,1263]".to_string()),
            clickable: Some(true),
            ..Default::default()
        };
        
        let xml_content = Some(r#"
<node resource-id="com.ss.android.ugc.aweme:id/iwk" clickable="true" bounds="[45,1059][249,1263]">
  <node resource-id="icon" class="ImageView" bounds="[110,1093][184,1167]" />
  <node text="通讯录" resource-id="title" class="TextView" bounds="[99,1196][195,1240]" />
</node>
        "#.to_string());
        
        let candidates = vec![&parent_elem];
        let criteria = EvaluationCriteria {
            target_text: Some("通讯录".to_string()),
            target_content_desc: None,
            original_bounds: Some("[45,1059][249,1263]".to_string()),
            original_resource_id: Some("com.ss.android.ugc.aweme:id/iwk".to_string()),
            children_texts: vec![],
            sibling_texts: vec![],
            parent_info: None,
            matching_strategy: None,
            prefer_last: false,
            selected_xpath: None,
            xml_content,
            semantic_analyzer: None,
        };
        
        let result = MultiCandidateEvaluator::evaluate_candidates(candidates, &criteria);
        assert!(result.is_some());
        
        let match_result = result.unwrap();
        // 期望评分：子元素文本完全匹配(1.0) + Bounds完全匹配(0.7) + 可点击(0.15) + Resource-id匹配(0.1) = 1.95
        assert!(match_result.score >= 1.9, "评分应该至少1.9分, 实际: {}", match_result.score);
        
        // 验证原因中包含子元素文本匹配的说明
        let reasons_str = match_result.reasons.join(" ");
        assert!(reasons_str.contains("子元素文本") || reasons_str.contains("content-desc"), 
                "评分原因应该包含子元素文本匹配的说明, 实际: {:?}", match_result.reasons);
    }
    
    #[test]
    fn test_prefer_last_when_scores_close() {
        // TODO: 实现测试用例
    }
}


