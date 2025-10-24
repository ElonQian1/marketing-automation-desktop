//! contextual_selector_strategy.rs - 上下文感知选择器策略
//! 
//! 模块: 执行引擎匹配系统 | 层级: 策略层 | 角色: 智能多元素选择
//! summary: 解决"多个相同按钮"问题的智能上下文选择器

use crate::services::execution::matching::strategies::{
    StrategyProcessor, MatchingContext, StrategyResult, ProcessingError
};
use async_trait::async_trait;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, warn, debug};

/// 上下文候选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextCandidate {
    pub element_bounds: String,
    pub element_text: String,
    pub context_text: String,      // 关联的用户名/内容
    pub position_index: usize,     // 在列表中的位置
    pub proximity_score: f32,      // 上下文邻近性评分
    pub confidence: f32,           // 综合置信度
}

/// 选择策略配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextualSelectorConfig {
    /// 目标按钮文本 (如："关注")
    pub target_text: String,
    /// 上下文关键词 (如：用户名、内容描述)
    pub context_keywords: Vec<String>,
    /// 选择模式
    pub selection_mode: SelectionMode,
    /// 上下文搜索范围（像素）
    pub context_search_radius: i32,
    /// 最低置信度阈值
    pub min_confidence_threshold: f32,
}

/// 选择模式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SelectionMode {
    /// 基于关键词匹配最佳上下文
    BestContextMatch,
    /// 选择第N个（0-based）
    IndexBased(usize),
    /// 选择位置（第一个/最后一个/中间）
    PositionBased(Position),
    /// 智能推荐（综合评分最高）
    SmartRecommended,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Position {
    First,
    Last,
    Middle,
    Random,
}

/// 上下文感知选择器策略处理器
pub struct ContextualSelectorStrategy {
    config: ContextualSelectorConfig,
}

impl ContextualSelectorStrategy {
    pub fn new(config: ContextualSelectorConfig) -> Self {
        Self { config }
    }

    /// 创建默认配置的选择器
    pub fn default_for_follow_buttons() -> Self {
        Self::new(ContextualSelectorConfig {
            target_text: "关注".to_string(),
            context_keywords: vec![],
            selection_mode: SelectionMode::SmartRecommended,
            context_search_radius: 300,
            min_confidence_threshold: 0.6,
        })
    }

    /// 从XML中提取所有匹配的按钮元素
    fn extract_target_buttons(&self, xml_content: &str, logs: &mut Vec<String>) -> Vec<(String, String, (i32, i32))> {
        let mut buttons = Vec::new();
        
        // 简单的XML解析 - 查找包含目标文本的可点击元素
        for line in xml_content.lines() {
            if line.contains(&format!("text=\"{}\"", self.config.target_text)) && 
               line.contains("clickable=\"true\"") {
                
                // 提取bounds
                if let Some(bounds) = self.extract_bounds_from_line(line) {
                    if let Ok(center) = self.calculate_center_position(&bounds) {
                        buttons.push((bounds, line.to_string(), center));
                    }
                }
            }
        }

        logs.push(format!("🎯 找到 {} 个匹配的 '{}' 按钮", buttons.len(), self.config.target_text));
        buttons
    }

    /// 为每个按钮分析上下文并评分
    fn analyze_button_contexts(&self, buttons: &[(String, String, (i32, i32))], xml_content: &str, logs: &mut Vec<String>) -> Vec<ContextCandidate> {
        let mut candidates = Vec::new();

        for (index, (bounds, _line, center)) in buttons.iter().enumerate() {
            let context_text = self.find_nearby_context(center, xml_content);
            let proximity_score = self.calculate_proximity_score(&context_text);
            let confidence = self.calculate_candidate_confidence(index, &context_text, buttons.len());

            candidates.push(ContextCandidate {
                element_bounds: bounds.clone(),
                element_text: self.config.target_text.clone(),
                context_text: context_text.clone(),
                position_index: index,
                proximity_score,
                confidence,
            });

            logs.push(format!("📍 按钮 #{}: bounds={}, context='{}', score={:.2}, confidence={:.2}", 
                index + 1, bounds, context_text.trim(), proximity_score, confidence));
        }

        candidates
    }

    /// 查找按钮周围的上下文文本
    fn find_nearby_context(&self, button_center: &(i32, i32), xml_content: &str) -> String {
        let mut context_parts = Vec::new();
        let radius = self.config.context_search_radius;

        for line in xml_content.lines() {
            if let Some(bounds) = self.extract_bounds_from_line(line) {
                if let Ok(element_center) = self.calculate_center_position(&bounds) {
                    let distance = self.calculate_distance(button_center, &element_center);
                    
                    if distance <= radius as f32 {
                        // 提取这个元素的文本内容
                        if let Some(text) = self.extract_text_from_line(line) {
                            if !text.is_empty() && text != self.config.target_text {
                                context_parts.push((distance, text));
                            }
                        }
                        
                        // 提取content-desc
                        if let Some(desc) = self.extract_content_desc_from_line(line) {
                            if !desc.is_empty() && desc != self.config.target_text {
                                context_parts.push((distance, desc));
                            }
                        }
                    }
                }
            }
        }

        // 按距离排序，取最近的上下文
        context_parts.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
        context_parts.iter()
            .take(3) // 最多取3个最近的文本
            .map(|(_, text)| text.clone())
            .collect::<Vec<_>>()
            .join(" | ")
    }

    /// 计算上下文匹配评分
    fn calculate_proximity_score(&self, context_text: &str) -> f32 {
        if self.config.context_keywords.is_empty() {
            return 0.5; // 没有关键词时返回中性分数
        }

        let context_lower = context_text.to_lowercase();
        let mut total_score = 0.0;
        let mut matches = 0;

        for keyword in &self.config.context_keywords {
            let keyword_lower = keyword.to_lowercase();
            if context_lower.contains(&keyword_lower) {
                matches += 1;
                
                // 精确匹配得更高分
                if context_lower == keyword_lower {
                    total_score += 1.0;
                } else {
                    // 部分匹配计算相似度
                    let similarity = self.calculate_string_similarity(&context_lower, &keyword_lower);
                    total_score += similarity;
                }
            }
        }

        if matches > 0 {
            total_score / matches as f32
        } else {
            0.0
        }
    }

    /// 计算候选项的综合置信度
    fn calculate_candidate_confidence(&self, index: usize, context_text: &str, total_count: usize) -> f32 {
        let mut confidence = 0.5; // 基础置信度

        // 根据选择模式调整
        match &self.config.selection_mode {
            SelectionMode::BestContextMatch => {
                confidence = self.calculate_proximity_score(context_text);
            }
            SelectionMode::IndexBased(target_index) => {
                confidence = if index == *target_index { 0.95 } else { 0.1 };
            }
            SelectionMode::PositionBased(position) => {
                confidence = match position {
                    Position::First => if index == 0 { 0.9 } else { 0.2 },
                    Position::Last => if index == total_count - 1 { 0.9 } else { 0.2 },
                    Position::Middle => {
                        let mid = total_count / 2;
                        if index == mid { 0.9 } else { 0.2 }
                    }
                    Position::Random => 0.5,
                };
            }
            SelectionMode::SmartRecommended => {
                // 综合评分：位置权重 + 上下文权重 + 稳定性权重
                let position_weight = match index {
                    0 => 0.7,      // 第一个通常是默认选择
                    i if i == total_count - 1 => 0.3,  // 最后一个
                    _ => 0.5,      // 中间的
                };
                
                let context_weight = self.calculate_proximity_score(context_text);
                let stability_weight = if !context_text.is_empty() { 0.2 } else { 0.0 };
                
                confidence = (position_weight * 0.4) + (context_weight * 0.5) + (stability_weight * 0.1);
            }
        }

        // 确保在有效范围内
        confidence.max(0.0).min(1.0)
    }

    /// 根据配置选择最佳候选项
    fn select_best_candidate(&self, candidates: &[ContextCandidate], logs: &mut Vec<String>) -> Option<&ContextCandidate> {
        if candidates.is_empty() {
            return None;
        }

        // 过滤低置信度候选项
        let qualified_candidates: Vec<&ContextCandidate> = candidates
            .iter()
            .filter(|c| c.confidence >= self.config.min_confidence_threshold)
            .collect();

        if qualified_candidates.is_empty() {
            logs.push("⚠️ 没有候选项达到最低置信度阈值，使用第一个候选项".to_string());
            return candidates.first();
        }

        // 根据选择模式决定
        match &self.config.selection_mode {
            SelectionMode::IndexBased(target_index) => {
                candidates.get(*target_index).or_else(|| {
                    logs.push(format!("⚠️ 指定索引 {} 超出范围，使用第一个", target_index));
                    candidates.first()
                })
            }
            SelectionMode::PositionBased(Position::Random) => {
                use rand::seq::SliceRandom;
                use rand::thread_rng;
                qualified_candidates.choose(&mut thread_rng()).copied()
            }
            _ => {
                // 其他模式都选择置信度最高的
                qualified_candidates
                    .iter()
                    .max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap())
                    .copied()
            }
        }
    }

    /// 辅助函数：从XML行中提取bounds属性
    fn extract_bounds_from_line(&self, line: &str) -> Option<String> {
        if let Some(start) = line.find("bounds=\"") {
            let start = start + 8;
            if let Some(end) = line[start..].find("\"") {
                return Some(line[start..start + end].to_string());
            }
        }
        None
    }

    /// 辅助函数：从XML行中提取text属性
    fn extract_text_from_line(&self, line: &str) -> Option<String> {
        if let Some(start) = line.find("text=\"") {
            let start = start + 6;
            if let Some(end) = line[start..].find("\"") {
                let text = line[start..start + end].to_string();
                return if text.is_empty() { None } else { Some(text) };
            }
        }
        None
    }

    /// 辅助函数：从XML行中提取content-desc属性
    fn extract_content_desc_from_line(&self, line: &str) -> Option<String> {
        if let Some(start) = line.find("content-desc=\"") {
            let start = start + 14;
            if let Some(end) = line[start..].find("\"") {
                let desc = line[start..start + end].to_string();
                return if desc.is_empty() { None } else { Some(desc) };
            }
        }
        None
    }

    /// 辅助函数：计算bounds的中心位置
    fn calculate_center_position(&self, bounds: &str) -> Result<(i32, i32), String> {
        // 解析 "[x1,y1][x2,y2]" 格式
        let clean_bounds = bounds.trim_matches(|c| c == '[' || c == ']');
        let parts: Vec<&str> = clean_bounds.split("][").collect();
        
        if parts.len() != 2 {
            return Err(format!("Invalid bounds format: {}", bounds));
        }

        let parse_coords = |coord_str: &str| -> Result<(i32, i32), String> {
            let coords: Vec<&str> = coord_str.split(',').collect();
            if coords.len() != 2 {
                return Err("Invalid coordinate format".to_string());
            }
            let x: i32 = coords[0].parse().map_err(|_| "Invalid x coordinate")?;
            let y: i32 = coords[1].parse().map_err(|_| "Invalid y coordinate")?;
            Ok((x, y))
        };

        let (x1, y1) = parse_coords(parts[0])?;
        let (x2, y2) = parse_coords(parts[1])?;
        
        Ok(((x1 + x2) / 2, (y1 + y2) / 2))
    }

    /// 辅助函数：计算两点间距离
    fn calculate_distance(&self, point1: &(i32, i32), point2: &(i32, i32)) -> f32 {
        let dx = (point1.0 - point2.0) as f32;
        let dy = (point1.1 - point2.1) as f32;
        (dx * dx + dy * dy).sqrt()
    }

    /// 辅助函数：计算字符串相似度（简单版本）
    fn calculate_string_similarity(&self, s1: &str, s2: &str) -> f32 {
        if s1 == s2 {
            return 1.0;
        }
        
        if s1.is_empty() || s2.is_empty() {
            return 0.0;
        }

        // 简单的包含匹配
        if s1.contains(s2) || s2.contains(s1) {
            let longer_len = s1.len().max(s2.len());
            let shorter_len = s1.len().min(s2.len());
            return shorter_len as f32 / longer_len as f32;
        }

        // 更复杂的相似度算法可以在这里实现
        // 这里返回一个基本的相似度
        0.0
    }
}

#[async_trait]
impl StrategyProcessor for ContextualSelectorStrategy {
    async fn process(&self, context: &mut MatchingContext, logs: &mut Vec<String>) -> Result<StrategyResult, ProcessingError> {
        logs.push("🎯 启动上下文感知选择器策略".to_string());
        logs.push(format!("📋 目标文本: '{}', 选择模式: {:?}", 
            self.config.target_text, self.config.selection_mode));

        // 获取XML内容
        let xml_content = if let Some(xml) = &context.original_xml {
            xml.clone()
        } else {
            return Err(ProcessingError::InvalidParameters(
                "上下文感知选择器需要XML内容".to_string()
            ));
        };

        // 1. 提取所有匹配的按钮
        let buttons = self.extract_target_buttons(&xml_content, logs);
        
        if buttons.is_empty() {
            return Err(ProcessingError::MatchingFailed(
                format!("未找到任何包含文本 '{}' 的可点击按钮", self.config.target_text)
            ));
        }

        // 2. 分析每个按钮的上下文并评分
        let candidates = self.analyze_button_contexts(&buttons, &xml_content, logs);

        // 3. 选择最佳候选项
        if let Some(best_candidate) = self.select_best_candidate(&candidates, logs) {
            logs.push(format!("✅ 选择最佳候选项: 位置#{}, 置信度={:.2}, 上下文='{}'", 
                best_candidate.position_index + 1, 
                best_candidate.confidence,
                best_candidate.context_text.trim()));

            // 计算点击坐标
            let center = self.calculate_center_position(&best_candidate.element_bounds)
                .map_err(|e| ProcessingError::XmlParsingFailed(e))?;

            Ok(StrategyResult {
                success: true,
                message: format!("上下文选择成功 (选择第{}个按钮)", best_candidate.position_index + 1),
                coordinates: Some(center),
                bounds: Some(best_candidate.element_bounds.clone()),
                matched_element: Some(format!("text='{}' context='{}'", 
                    best_candidate.element_text, 
                    best_candidate.context_text.trim())),
                fallback_used: false,
            })
        } else {
            Err(ProcessingError::MatchingFailed(
                "所有候选项的置信度都低于阈值".to_string()
            ))
        }
    }

    fn validate_parameters(&self, context: &MatchingContext) -> Result<(), ProcessingError> {
        if self.config.target_text.is_empty() {
            return Err(ProcessingError::InvalidParameters(
                "目标文本不能为空".to_string()
            ));
        }

        if context.original_xml.is_none() {
            return Err(ProcessingError::InvalidParameters(
                "上下文感知选择器需要XML内容".to_string()
            ));
        }

        Ok(())
    }

    fn strategy_name(&self) -> &'static str {
        "contextual_selector"
    }

    fn should_ignore_fallback_bounds(&self) -> bool {
        true // 我们有自己的选择逻辑
    }
}

/// 便捷构造函数
impl ContextualSelectorStrategy {
    /// 创建基于用户名关键词的关注按钮选择器
    pub fn for_follow_user(username: &str) -> Self {
        Self::new(ContextualSelectorConfig {
            target_text: "关注".to_string(),
            context_keywords: vec![username.to_string()],
            selection_mode: SelectionMode::BestContextMatch,
            context_search_radius: 300,
            min_confidence_threshold: 0.7,
        })
    }

    /// 创建基于位置的选择器 
    pub fn for_position_based(target_text: &str, position: Position) -> Self {
        Self::new(ContextualSelectorConfig {
            target_text: target_text.to_string(),
            context_keywords: vec![],
            selection_mode: SelectionMode::PositionBased(position),
            context_search_radius: 200,
            min_confidence_threshold: 0.5,
        })
    }

    /// 创建基于索引的选择器
    pub fn for_index_based(target_text: &str, index: usize) -> Self {
        Self::new(ContextualSelectorConfig {
            target_text: target_text.to_string(),
            context_keywords: vec![],
            selection_mode: SelectionMode::IndexBased(index),
            context_search_radius: 200,
            min_confidence_threshold: 0.5,
        })
    }
}