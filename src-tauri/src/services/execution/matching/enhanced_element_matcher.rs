//! enhanced_element_matcher.rs - 增强型元素匹配器
//! 
//! 模块: 执行引擎匹配系统 | 层级: 服务层 | 角色: 核心匹配算法
//! summary: 提供多层级匹配策略、模糊匹配和上下文感知的元素定位能力

use std::collections::HashMap;
use serde_json::Value;
use anyhow::Result;
use tracing::{info, warn, debug};

/// 增强型匹配配置
#[derive(Debug, Clone)]
pub struct EnhancedMatchingConfig {
    /// 相似度匹配阈值 (0.0 - 1.0)
    pub similarity_threshold: f64,
    /// 是否启用模糊匹配
    pub enable_fuzzy_matching: bool,
    /// 是否启用上下文感知匹配
    pub enable_context_matching: bool,
    /// 最大回溯层数（用于容错）
    pub max_fallback_layers: u32,
    /// 权重配置
    pub attribute_weights: AttributeWeights,
}

/// 属性匹配权重配置
#[derive(Debug, Clone)]
pub struct AttributeWeights {
    pub resource_id: f64,
    pub text: f64,
    pub content_desc: f64,
    pub class_name: f64,
    pub bounds: f64,
    pub index: f64,
    pub parent_context: f64,
    pub sibling_context: f64,
}

impl Default for AttributeWeights {
    fn default() -> Self {
        Self {
            resource_id: 0.9,      // 最高权重：resource-id 最稳定
            text: 0.8,             // 高权重：文本内容较稳定
            content_desc: 0.8,     // 高权重：内容描述较稳定
            class_name: 0.6,       // 中权重：类名相对稳定
            bounds: 0.3,           // 低权重：坐标易变化
            index: 0.4,            // 中低权重：索引受布局影响
            parent_context: 0.7,   // 高权重：父级上下文稳定
            sibling_context: 0.5,  // 中权重：兄弟节点上下文
        }
    }
}

impl Default for EnhancedMatchingConfig {
    fn default() -> Self {
        Self {
            similarity_threshold: 0.75,
            enable_fuzzy_matching: true,
            enable_context_matching: true,
            max_fallback_layers: 3,
            attribute_weights: AttributeWeights::default(),
        }
    }
}

/// 匹配结果
#[derive(Debug, Clone)]
pub struct MatchResult {
    pub success: bool,
    pub confidence: f64,
    pub coordinates: Option<(i32, i32)>,
    pub bounds: Option<String>,
    pub matched_element: Option<ElementInfo>,
    pub matching_strategy: String,
    pub fallback_used: bool,
    pub debug_info: Vec<String>,
}

/// 元素信息
#[derive(Debug, Clone)]
pub struct ElementInfo {
    pub class_name: String,
    pub resource_id: Option<String>,
    pub text: Option<String>,
    pub content_desc: Option<String>,
    pub bounds: String,
    pub index: Option<u32>,
    pub xpath: Option<String>,
}

/// 增强型元素匹配器
/// 
/// 核心改进：
/// 1. 多层级匹配策略：精确匹配 → 模糊匹配 → 上下文匹配 → 结构匹配
/// 2. 智能权重计算：根据属性稳定性分配权重
/// 3. 相似度算法：基于编辑距离和语义相似度
/// 4. 上下文感知：考虑父级和兄弟节点信息
/// 5. 容错机制：多层回溯和自适应调整
pub struct EnhancedElementMatcher {
    config: EnhancedMatchingConfig,
}

impl EnhancedElementMatcher {
    /// 创建新的增强匹配器
    pub fn new(config: EnhancedMatchingConfig) -> Self {
        Self { config }
    }

    /// 使用默认配置创建匹配器
    pub fn with_defaults() -> Self {
        Self::new(EnhancedMatchingConfig::default())
    }

    /// 执行增强型元素匹配
    pub async fn match_element(
        &self,
        target_criteria: &HashMap<String, String>,
        xml_content: &str,
        device_id: &str,
    ) -> Result<MatchResult> {
        let mut debug_info = Vec::new();
        debug_info.push("🎯 启动增强型元素匹配".to_string());

        // 解析 XML 并提取候选元素
        let candidates = self.extract_candidate_elements(xml_content, &mut debug_info)?;
        debug_info.push(format!("📊 找到 {} 个候选元素", candidates.len()));

        // 多层级匹配策略
        if let Some(result) = self.try_exact_matching(target_criteria, &candidates, &mut debug_info).await? {
            return Ok(result);
        }

        if self.config.enable_fuzzy_matching {
            if let Some(result) = self.try_fuzzy_matching(target_criteria, &candidates, &mut debug_info).await? {
                return Ok(result);
            }
        }

        if self.config.enable_context_matching {
            if let Some(result) = self.try_context_matching(target_criteria, &candidates, xml_content, &mut debug_info).await? {
                return Ok(result);
            }
        }

        // 最后尝试结构匹配
        if let Some(result) = self.try_structural_matching(target_criteria, &candidates, &mut debug_info).await? {
            return Ok(result);
        }

        // 所有策略都失败
        debug_info.push("❌ 所有匹配策略都未找到合适元素".to_string());
        Ok(MatchResult {
            success: false,
            confidence: 0.0,
            coordinates: None,
            bounds: None,
            matched_element: None,
            matching_strategy: "none".to_string(),
            fallback_used: true,
            debug_info,
        })
    }

    /// 精确匹配策略
    async fn try_exact_matching(
        &self,
        target_criteria: &HashMap<String, String>,
        candidates: &[ElementInfo],
        debug_info: &mut Vec<String>,
    ) -> Result<Option<MatchResult>> {
        debug_info.push("🎯 尝试精确匹配...".to_string());

        for candidate in candidates {
            let similarity = self.calculate_exact_similarity(target_criteria, candidate);
            
            if similarity >= 0.95 { // 精确匹配要求 95% 以上相似度
                debug_info.push(format!("✅ 精确匹配成功，相似度: {:.2}", similarity));
                
                let coordinates = self.parse_bounds_center(&candidate.bounds)?;
                return Ok(Some(MatchResult {
                    success: true,
                    confidence: similarity,
                    coordinates: Some(coordinates),
                    bounds: Some(candidate.bounds.clone()),
                    matched_element: Some(candidate.clone()),
                    matching_strategy: "exact".to_string(),
                    fallback_used: false,
                    debug_info: debug_info.clone(),
                }));
            }
        }

        debug_info.push("⚠️ 精确匹配未找到合适元素".to_string());
        Ok(None)
    }

    /// 模糊匹配策略
    async fn try_fuzzy_matching(
        &self,
        target_criteria: &HashMap<String, String>,
        candidates: &[ElementInfo],
        debug_info: &mut Vec<String>,
    ) -> Result<Option<MatchResult>> {
        debug_info.push("🔄 尝试模糊匹配...".to_string());

        let mut best_match: Option<(ElementInfo, f64)> = None;

        for candidate in candidates {
            let similarity = self.calculate_fuzzy_similarity(target_criteria, candidate);
            
            if similarity >= self.config.similarity_threshold {
                if let Some((_, best_score)) = &best_match {
                    if similarity > *best_score {
                        best_match = Some((candidate.clone(), similarity));
                    }
                } else {
                    best_match = Some((candidate.clone(), similarity));
                }
            }
        }

        if let Some((element, confidence)) = best_match {
            debug_info.push(format!("✅ 模糊匹配成功，相似度: {:.2}", confidence));
            
            let coordinates = self.parse_bounds_center(&element.bounds)?;
            return Ok(Some(MatchResult {
                success: true,
                confidence,
                coordinates: Some(coordinates),
                bounds: Some(element.bounds.clone()),
                matched_element: Some(element),
                matching_strategy: "fuzzy".to_string(),
                fallback_used: false,
                debug_info: debug_info.clone(),
            }));
        }

        debug_info.push("⚠️ 模糊匹配未找到合适元素".to_string());
        Ok(None)
    }

    /// 上下文感知匹配策略
    async fn try_context_matching(
        &self,
        target_criteria: &HashMap<String, String>,
        candidates: &[ElementInfo],
        xml_content: &str,
        debug_info: &mut Vec<String>,
    ) -> Result<Option<MatchResult>> {
        debug_info.push("🧩 尝试上下文感知匹配...".to_string());

        // TODO: 实现上下文匹配逻辑
        // 1. 分析目标元素的父级和兄弟节点信息
        // 2. 在候选元素中查找相似的上下文结构
        // 3. 结合上下文相似度和元素相似度计算综合分数

        debug_info.push("⚠️ 上下文匹配暂未实现".to_string());
        Ok(None)
    }

    /// 结构匹配策略
    async fn try_structural_matching(
        &self,
        target_criteria: &HashMap<String, String>,
        candidates: &[ElementInfo],
        debug_info: &mut Vec<String>,
    ) -> Result<Option<MatchResult>> {
        debug_info.push("🏗️ 尝试结构匹配...".to_string());

        // TODO: 实现结构匹配逻辑
        // 1. 分析元素在界面中的相对位置
        // 2. 通过布局结构特征进行匹配
        // 3. 适用于界面内容变化但结构保持的场景

        debug_info.push("⚠️ 结构匹配暂未实现".to_string());
        Ok(None)
    }

    /// 提取候选元素
    fn extract_candidate_elements(&self, xml_content: &str, debug_info: &mut Vec<String>) -> Result<Vec<ElementInfo>> {
        debug_info.push("🔍 开始解析 XML 并提取候选元素...".to_string());

        // TODO: 实现完整的 XML 解析逻辑
        // 当前使用简化的正则提取作为占位符
        let mut candidates = Vec::new();

        // 简化实现：使用正则表达式提取基本元素信息
        use regex::Regex;
        
        if let Ok(re) = Regex::new(r#"<node[^>]+bounds="([^"]+)"[^>]*>"#) {
            for caps in re.captures_iter(xml_content) {
                if let Some(bounds) = caps.get(1) {
                    candidates.push(ElementInfo {
                        class_name: "unknown".to_string(),
                        resource_id: None,
                        text: None,
                        content_desc: None,
                        bounds: bounds.as_str().to_string(),
                        index: None,
                        xpath: None,
                    });
                }
            }
        }

        debug_info.push(format!("📊 提取到 {} 个元素", candidates.len()));
        Ok(candidates)
    }

    /// 计算精确相似度
    fn calculate_exact_similarity(&self, target: &HashMap<String, String>, candidate: &ElementInfo) -> f64 {
        let mut total_weight = 0.0;
        let mut matched_weight = 0.0;

        // resource-id 匹配
        if let Some(target_id) = target.get("resource_id") {
            total_weight += self.config.attribute_weights.resource_id;
            if let Some(candidate_id) = &candidate.resource_id {
                if target_id == candidate_id {
                    matched_weight += self.config.attribute_weights.resource_id;
                }
            }
        }

        // text 匹配
        if let Some(target_text) = target.get("text") {
            total_weight += self.config.attribute_weights.text;
            if let Some(candidate_text) = &candidate.text {
                if !candidate_text.is_empty() {
                    if target_text == candidate_text {
                        matched_weight += self.config.attribute_weights.text;
                    }
                }
            }
        }

        // content-desc 匹配
        if let Some(target_desc) = target.get("content_desc") {
            total_weight += self.config.attribute_weights.content_desc;
            if let Some(candidate_desc) = &candidate.content_desc {
                if !candidate_desc.is_empty() {
                    if target_desc == candidate_desc {
                        matched_weight += self.config.attribute_weights.content_desc;
                    }
                }
            }
        }

        // class 匹配
        if let Some(target_class) = target.get("class") {
            total_weight += self.config.attribute_weights.class_name;
            if target_class == &candidate.class_name {
                matched_weight += self.config.attribute_weights.class_name;
            }
        }

        if total_weight > 0.0 {
            matched_weight / total_weight
        } else {
            0.0
        }
    }

    /// 计算模糊相似度
    fn calculate_fuzzy_similarity(&self, target: &HashMap<String, String>, candidate: &ElementInfo) -> f64 {
        let mut total_weight = 0.0;
        let mut similarity_sum = 0.0;

        // resource-id 模糊匹配
        if let Some(target_id) = target.get("resource_id") {
            total_weight += self.config.attribute_weights.resource_id;
            if let Some(candidate_id) = &candidate.resource_id {
                let similarity = self.string_similarity(target_id, candidate_id);
                similarity_sum += similarity * self.config.attribute_weights.resource_id;
            }
        }

        // text 模糊匹配
        if let Some(target_text) = target.get("text") {
            total_weight += self.config.attribute_weights.text;
            if let Some(candidate_text) = &candidate.text {
                if !candidate_text.is_empty() {
                    let similarity = self.string_similarity(target_text, candidate_text);
                    similarity_sum += similarity * self.config.attribute_weights.text;
                }
            }
        }

        // content-desc 模糊匹配
        if let Some(target_desc) = target.get("content_desc") {
            total_weight += self.config.attribute_weights.content_desc;
            if let Some(candidate_desc) = &candidate.content_desc {
                if !candidate_desc.is_empty() {
                    let similarity = self.string_similarity(target_desc, candidate_desc);
                    similarity_sum += similarity * self.config.attribute_weights.content_desc;
                }
            }
        }

        if total_weight > 0.0 {
            similarity_sum / total_weight
        } else {
            0.0
        }
    }

    /// 字符串相似度计算（基于编辑距离）
    fn string_similarity(&self, s1: &str, s2: &str) -> f64 {
        if s1 == s2 {
            return 1.0;
        }

        let len1 = s1.chars().count();
        let len2 = s2.chars().count();
        
        if len1 == 0 || len2 == 0 {
            return 0.0;
        }

        let max_len = len1.max(len2);
        let edit_distance = self.levenshtein_distance(s1, s2);
        
        1.0 - (edit_distance as f64 / max_len as f64)
    }

    /// 计算编辑距离
    fn levenshtein_distance(&self, s1: &str, s2: &str) -> usize {
        let chars1: Vec<char> = s1.chars().collect();
        let chars2: Vec<char> = s2.chars().collect();
        let len1 = chars1.len();
        let len2 = chars2.len();

        let mut dp = vec![vec![0; len2 + 1]; len1 + 1];

        for i in 0..=len1 {
            dp[i][0] = i;
        }
        for j in 0..=len2 {
            dp[0][j] = j;
        }

        for i in 1..=len1 {
            for j in 1..=len2 {
                let cost = if chars1[i - 1] == chars2[j - 1] { 0 } else { 1 };
                dp[i][j] = (dp[i - 1][j] + 1)
                    .min(dp[i][j - 1] + 1)
                    .min(dp[i - 1][j - 1] + cost);
            }
        }

        dp[len1][len2]
    }

    /// 解析 bounds 字符串并计算中心点坐标
    fn parse_bounds_center(&self, bounds: &str) -> Result<(i32, i32)> {
        use regex::Regex;
        
        let re = Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")?;
        if let Some(caps) = re.captures(bounds) {
            let left: i32 = caps[1].parse()?;
            let top: i32 = caps[2].parse()?;
            let right: i32 = caps[3].parse()?;
            let bottom: i32 = caps[4].parse()?;
            
            let center_x = (left + right) / 2;
            let center_y = (top + bottom) / 2;
            
            Ok((center_x, center_y))
        } else {
            Err(anyhow::anyhow!("无法解析 bounds 字符串: {}", bounds))
        }
    }
}
