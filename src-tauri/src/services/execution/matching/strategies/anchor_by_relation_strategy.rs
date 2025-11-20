// src-tauri/src/services/execution/matching/strategies/anchor_by_relation_strategy.rs
// module: execution | layer: domain | role: 关系锚点匹配策略
// summary: 使用子元素/兄弟元素/父元素文本作为锚点进行元素定位

use super::strategy_processor::{StrategyProcessor, MatchingContext, StrategyResult, ProcessingError};
use super::candidate_scorer::{CandidateScorer, ScoringConfig};
use crate::services::universal_ui_page_analyzer::parse_ui_elements_simple as parse_ui_elements;
use crate::exec::v3::helpers::parse_bounds;
use async_trait::async_trait;
use serde_json::{json, Value};
use std::collections::HashMap;

/// 🎯 关系类型
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RelationType {
    /// 子元素文本锚点（向下找文本，向上找可点击父）
    Child,
    /// 兄弟元素文本锚点（同层找文本+容器）
    Sibling,
    /// 父元素文本锚点（向上找文本容器）
    Parent,
    /// 灵活锚点（自动决策：优先子，其次兄弟，最后父）
    Flexible,
}

impl RelationType {
    pub fn from_str(s: &str) -> Self {
        match s {
            "child" | "anchor_by_child_text" => Self::Child,
            "sibling" | "anchor_by_sibling_text" => Self::Sibling,
            "parent" | "anchor_by_parent_text" => Self::Parent,
            "flexible" | "anchor_by_child_or_parent_text" => Self::Flexible,
            _ => Self::Flexible,
        }
    }
}

/// 🎯 锚点配置
#[derive(Debug, Clone)]
pub struct AnchorConfig {
    /// 关系类型
    pub relation_type: RelationType,
    /// 目标文本列表（子/兄弟/父的文本）
    pub anchor_texts: Vec<String>,
    /// 用户选择的bounds（用于精确匹配）
    pub user_bounds: Option<String>,
    /// 🆕 用户选择的静态全局XPath（用于精确匹配）
    pub user_xpath: Option<String>,
    /// 是否要求可点击
    pub require_clickable: bool,
    /// Bounds容差（像素）
    pub bounds_tolerance: i32,
}

impl Default for AnchorConfig {
    fn default() -> Self {
        Self {
            relation_type: RelationType::Flexible,
            anchor_texts: Vec::new(),
            user_bounds: None,
            user_xpath: None,
            require_clickable: true,
            bounds_tolerance: 20, // 默认20像素容差
        }
    }
}

/// 🎯 关系锚点匹配策略处理器
pub struct AnchorByRelationStrategyProcessor;

impl AnchorByRelationStrategyProcessor {
    pub fn new() -> Self {
        Self
    }

    /// 📦 从参数中提取锚点配置
    fn extract_anchor_config(&self, params: &HashMap<String, Value>) -> AnchorConfig {
        let mut config = AnchorConfig::default();

        // 提取匹配策略类型
        if let Some(strategy_str) = params.get("matching_strategy")
            .or_else(|| params.get("matchingStrategy"))
            .and_then(|v| v.as_str())
        {
            config.relation_type = RelationType::from_str(strategy_str);
            tracing::info!("🎯 [关系锚点] 策略类型: {:?}", config.relation_type);
        }

        // 提取原始数据包
        let original_data = params.get("original_data");

        // 提取子元素文本
        let children_texts = original_data
            .and_then(|od| od.get("children_texts"))
            .or_else(|| params.get("children_texts"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .filter(|s| !s.trim().is_empty())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        // 提取兄弟元素文本
        let sibling_texts = original_data
            .and_then(|od| od.get("sibling_texts"))
            .or_else(|| params.get("sibling_texts"))
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .filter(|s| !s.trim().is_empty())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        // 提取父元素文本
        let parent_text = original_data
            .and_then(|od| od.get("parent_info"))
            .or_else(|| params.get("parent_info"))
            .and_then(|pi| {
                pi.get("text")
                    .or_else(|| pi.get("contentDesc"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            });

        // 根据关系类型选择锚点文本
        config.anchor_texts = match config.relation_type {
            RelationType::Child => children_texts,
            RelationType::Sibling => sibling_texts,
            RelationType::Parent => parent_text.into_iter().collect(),
            RelationType::Flexible => {
                // 灵活模式：优先子，其次兄弟，最后父
                let mut texts = children_texts;
                if texts.is_empty() {
                    texts = sibling_texts;
                }
                if texts.is_empty() && parent_text.is_some() {
                    texts.push(parent_text.unwrap());
                }
                texts
            }
        };

        // 提取用户选择的bounds
        config.user_bounds = original_data
            .and_then(|od| od.get("element_bounds"))
            .or_else(|| params.get("element_bounds"))
            .or_else(|| params.get("bounds"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // 🆕 提取用户选择的静态XPath
        config.user_xpath = original_data
            .and_then(|od| od.get("selected_xpath"))
            .or_else(|| params.get("selected_xpath"))
            .or_else(|| params.get("xpath"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // 提取容差配置
        config.bounds_tolerance = params
            .get("bounds_tolerance")
            .and_then(|v| v.as_i64())
            .unwrap_or(20) as i32;

        tracing::info!(
            "📦 [关系锚点] 配置提取完成:\n  - 关系类型: {:?}\n  - 锚点文本: {:?}\n  - 用户bounds: {:?}\n  - 用户xpath: {:?}\n  - 容差: {}px",
            config.relation_type,
            config.anchor_texts,
            config.user_bounds,
            config.user_xpath,
            config.bounds_tolerance
        );

        config
    }

    /// 🔍 在XML中查找包含锚点文本的所有元素
    fn find_elements_with_anchor_text(
        &self,
        xml_content: &str,
        anchor_texts: &[String],
    ) -> Result<Vec<HashMap<String, String>>, ProcessingError> {
        // 解析XML
        let ui_elements = parse_ui_elements(xml_content)
            .map_err(|e| {
                ProcessingError::XmlParsingFailed(format!("XML解析失败: {:?}", e))
            })?;

        let mut candidates = Vec::new();

        // 遍历所有元素，查找包含锚点文本的元素
        for ui_elem in ui_elements.iter() {
            let element_text = ui_elem.text.as_deref().unwrap_or("");
            let content_desc = ui_elem.content_desc.as_deref().unwrap_or("");

            // 检查是否包含任一锚点文本
            let has_anchor = anchor_texts.iter().any(|anchor_text| {
                element_text.contains(anchor_text) || content_desc.contains(anchor_text)
            });

            if has_anchor {
                // 转换为 HashMap
                let mut map = HashMap::new();
                
                if let Some(ref text) = ui_elem.text {
                    map.insert("text".to_string(), text.clone());
                }
                if let Some(ref desc) = ui_elem.content_desc {
                    map.insert("content-desc".to_string(), desc.clone());
                }
                if let Some(ref rid) = ui_elem.resource_id {
                    map.insert("resource-id".to_string(), rid.clone());
                }
                if let Some(ref bounds) = ui_elem.bounds {
                    map.insert("bounds".to_string(), bounds.clone());
                }
                if let Some(clickable) = ui_elem.clickable {
                    map.insert("clickable".to_string(), clickable.to_string());
                }
                if let Some(ref class) = ui_elem.class {
                    map.insert("class".to_string(), class.clone());
                }
                
                candidates.push(map);
                
                tracing::debug!(
                    "🔍 [锚点匹配] 找到候选元素: text='{}', desc='{}', bounds='{}'",
                    element_text,
                    content_desc,
                    ui_elem.bounds.as_deref().unwrap_or("")
                );
            }
        }

        tracing::info!(
            "🔍 [锚点匹配] 找到 {} 个包含锚点文本的候选元素",
            candidates.len()
        );

        Ok(candidates)
    }

    /// 🎯 从候选元素中选择最佳匹配（使用完善的评分系统）
    fn select_best_candidate(
        &self,
        candidates: Vec<HashMap<String, String>>,
        config: &AnchorConfig,
    ) -> Result<HashMap<String, String>, ProcessingError> {
        if candidates.is_empty() {
            return Err(ProcessingError::MatchingFailed(
                "未找到包含锚点文本的元素".to_string(),
            ));
        }

        tracing::info!("🎯 [候选评分] 开始对 {} 个候选元素进行评分", candidates.len());

        // 🏆 使用评分系统对候选元素进行评分和排序
        let scoring_config = ScoringConfig::with_xpath(
            config.anchor_texts.clone(),
            config.user_bounds.clone(),
            config.user_xpath.clone(),
        );

        let scored_candidates = CandidateScorer::score_and_rank_candidates(
            candidates,
            &scoring_config,
        );

        // 📊 打印评分结果（前5名）
        tracing::info!("📊 [评分结果] 候选元素得分排名：");
        for (i, (candidate, score)) in scored_candidates.iter().take(5).enumerate() {
            let bounds = candidate.get("bounds").map(|s| s.as_str()).unwrap_or("N/A");
            let text = candidate.get("text").map(|s| s.as_str()).unwrap_or("");
            let desc = candidate.get("content-desc").map(|s| s.as_str()).unwrap_or("");
            
            tracing::info!(
                "[排名 {}] 总分: {:.1} | Bounds: {} | Text: '{}' | Desc: '{}'\n  详情: {}",
                i + 1,
                score.total_score,
                bounds,
                text,
                desc,
                score.explanation
            );
        }

        // ✅ 选择得分最高的候选
        let (best_candidate, best_score) = scored_candidates
            .into_iter()
            .next()
            .ok_or_else(|| {
                ProcessingError::MatchingFailed("评分后无可用候选".to_string())
            })?;

        tracing::info!(
            "✅ [最佳候选] 总分: {:.1} | 文本: {:.1} | 位置: {:.1} | 可点击: {:.1} | 尺寸: {:.1}",
            best_score.total_score,
            best_score.text_match_score,
            best_score.bounds_score,
            best_score.clickable_score,
            best_score.size_reasonableness_score
        );

        Ok(best_candidate)
    }
}

#[async_trait]
impl StrategyProcessor for AnchorByRelationStrategyProcessor {
    async fn process(
        &self,
        context: &mut MatchingContext,
        logs: &mut Vec<String>,
    ) -> Result<StrategyResult, ProcessingError> {
        tracing::info!("🎯 [关系锚点策略] 开始处理");
        logs.push("🎯 [关系锚点策略] 开始处理".to_string());

        // 从上下文中提取参数
        let params = &context.values;
        let mut params_map = HashMap::new();
        for (k, v) in params.iter() {
            params_map.insert(k.clone(), json!(v));
        }

        // 提取锚点配置
        let config = self.extract_anchor_config(&params_map);

        // 获取XML内容
        let xml_content = context
            .original_xml
            .as_ref()
            .ok_or_else(|| {
                ProcessingError::InvalidParameters("缺少原始XML快照".to_string())
            })?;

        // 🎯 判断使用哪种匹配模式
        let candidates = if config.anchor_texts.is_empty() {
            // 🆕 场景2: 无子/父元素文本 → 使用静态XPath + Bounds精确匹配
            let log_msg = "⚠️ [关系锚点策略] 未提供锚点文本，切换到XPath+Bounds精确匹配模式";
            tracing::warn!("{}", log_msg);
            logs.push(log_msg.to_string());
            
            if config.user_xpath.is_none() && config.user_bounds.is_none() {
                return Err(ProcessingError::InvalidParameters(
                    "无锚点文本且无XPath/Bounds，无法进行匹配".to_string(),
                ));
            }
            
            // 解析XML获取所有元素
            let ui_elements = parse_ui_elements(xml_content)
                .map_err(|e| {
                    ProcessingError::XmlParsingFailed(format!("XML解析失败: {:?}", e))
                })?;
            
            // 将所有元素转换为候选列表
            ui_elements.iter().map(|ui_elem| {
                let mut map = HashMap::new();
                if let Some(ref text) = ui_elem.text {
                    map.insert("text".to_string(), text.clone());
                }
                if let Some(ref desc) = ui_elem.content_desc {
                    map.insert("content-desc".to_string(), desc.clone());
                }
                if let Some(ref rid) = ui_elem.resource_id {
                    map.insert("resource-id".to_string(), rid.clone());
                }
                if let Some(ref bounds) = ui_elem.bounds {
                    map.insert("bounds".to_string(), bounds.clone());
                    // 🆕 根据bounds构造xpath
                    map.insert("xpath".to_string(), format!("//*[@bounds='{}']", bounds));
                }
                if let Some(clickable) = ui_elem.clickable {
                    map.insert("clickable".to_string(), clickable.to_string());
                }
                if let Some(ref class) = ui_elem.class {
                    map.insert("class".to_string(), class.clone());
                }
                map
            }).collect()
        } else {
            // 场景1: 有子/父元素文本 → 使用关系锚点匹配
            let log_msg = format!("🎯 [关系锚点策略] 使用锚点文本匹配: {:?}", config.anchor_texts);
            tracing::info!("{}", log_msg);
            logs.push(log_msg);
            self.find_elements_with_anchor_text(xml_content, &config.anchor_texts)?
        };

        // 选择最佳候选
        let best_match = self.select_best_candidate(candidates, &config)?;

        // 提取坐标
        let bounds_str = best_match
            .get("bounds")
            .ok_or_else(|| {
                ProcessingError::MatchingFailed("匹配元素缺少bounds属性".to_string())
            })?;

        // 解析bounds并计算中心点
        let bounds = parse_bounds(bounds_str)
            .ok_or_else(|| {
                ProcessingError::CoordinateCalculationFailed(format!("Bounds解析失败: {}", bounds_str))
            })?;

        let x = (bounds.0 + bounds.2) / 2;
        let y = (bounds.1 + bounds.3) / 2;

        let success_msg = format!(
            "✅ [关系锚点策略] 匹配成功:\n  - 策略: {:?}\n  - 锚点文本: {:?}\n  - 匹配bounds: {}\n  - 点击坐标: ({}, {})",
            config.relation_type,
            config.anchor_texts,
            bounds_str,
            x,
            y
        );
        tracing::info!("{}", success_msg);
        logs.push(success_msg);

        Ok(StrategyResult {
            success: true,
            message: format!("关系锚点匹配成功: {:?}", config.relation_type),
            coordinates: Some((x, y)),
            bounds: Some(bounds_str.clone()),
            matched_element: Some(format!("{:?}", best_match)),
            fallback_used: false,
        })
    }
    
    fn validate_parameters(&self, _context: &MatchingContext) -> Result<(), ProcessingError> {
        // 关系锚点策略参数验证逻辑
        // 注意：锚点文本为空时不返回错误，因为可以使用XPath+Bounds模式
        Ok(())
    }
    
    fn strategy_name(&self) -> &'static str {
        "anchor_by_relation"
    }
    
    fn should_ignore_fallback_bounds(&self) -> bool {
        true // 关系锚点策略不使用固化坐标
    }
}

impl Default for AnchorByRelationStrategyProcessor {
    fn default() -> Self {
        Self::new()
    }
}
