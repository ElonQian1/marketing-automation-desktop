// src-tauri/src/domain/structure_runtime_match/execution_bridge.rs
// module: structure_runtime_match | layer: domain | role: 执行桥接器
// summary: 将自动选型结果转换为ClickMode执行参数，建立参数映射

use super::auto_mode_selector::{AutoPickResult, AutoModeSelector};
use super::scorers::types::{MatchMode, ScoreOutcome, ContextSig};
use super::execution_types::ClickMode;
use crate::engine::xml_indexer::XmlIndexer;
use anyhow::{Result, anyhow};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionMapping {
    /// 原始节点索引
    pub clicked_node_index: usize,
    /// 卡片根节点索引
    pub card_root_index: usize,
    /// 可点击父节点索引
    pub clickable_parent_index: usize,
    /// 推荐的ClickMode
    pub mapped_click_mode: ClickMode,
    /// 推荐理由
    pub mapping_reason: String,
    /// 原始自动选型结果
    pub auto_pick_result: AutoPickResult,
}

pub struct ExecutionBridge<'a> {
    pub xml_indexer: &'a XmlIndexer,
    pub selector: AutoModeSelector<'a>,
}

impl<'a> ExecutionBridge<'a> {
    pub fn new(xml_indexer: &'a XmlIndexer) -> Self {
        let selector = AutoModeSelector::with_default_config(xml_indexer);
        Self {
            xml_indexer,
            selector,
        }
    }

    /// 核心方法：从点击信息自动生成执行映射
    pub fn create_execution_mapping(
        &self,
        clicked_node_index: usize,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> Result<ExecutionMapping> {
        // 1. 获取自动选型结果
        let auto_pick_result = self.selector.auto_pick(
            clicked_node_index,
            card_root_index,
            clickable_parent_index,
        )?;

        // 2. 转换为ClickMode
        let (mapped_click_mode, mapping_reason) = self.convert_to_click_mode(
            &auto_pick_result,
            clicked_node_index,
            card_root_index,
            clickable_parent_index,
        )?;

        Ok(ExecutionMapping {
            clicked_node_index,
            card_root_index,
            clickable_parent_index,
            mapped_click_mode,
            mapping_reason,
            auto_pick_result,
        })
    }

    fn convert_to_click_mode(
        &self,
        auto_result: &AutoPickResult,
        clicked_node_index: usize,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> Result<(ClickMode, String)> {
        match auto_result.recommended {
            MatchMode::CardSubtree => {
                let (click_mode, reason) = self.build_card_subtree_mode(
                    card_root_index,
                    clickable_parent_index,
                    &auto_result.outcomes,
                )?;
                Ok((click_mode, format!("卡片子树模式: {}", reason)))
            }
            MatchMode::LeafContext => {
                let (click_mode, reason) = self.build_leaf_context_mode(
                    clicked_node_index,
                    clickable_parent_index,
                    &auto_result.outcomes,
                )?;
                Ok((click_mode, format!("叶子上下文模式: {}", reason)))
            }
            MatchMode::TextExact => {
                let (click_mode, reason) = self.build_text_exact_mode(
                    clicked_node_index,
                    &auto_result.outcomes,
                )?;
                Ok((click_mode, format!("文本精确模式: {}", reason)))
            }
        }
    }

    fn build_card_subtree_mode(
        &self,
        card_root_index: usize,
        clickable_parent_index: usize,
        outcomes: &[ScoreOutcome],
    ) -> Result<(ClickMode, String)> {
        let subtree_outcome = outcomes.iter()
            .find(|o| o.mode == MatchMode::CardSubtree)
            .ok_or_else(|| anyhow!("未找到卡片子树评分结果"))?;

        // 从评分结果中提取特征信息
        let has_strong_hierarchy = subtree_outcome.conf > 0.8;
        let has_multiple_children = true; // 从特征中获取

        let click_mode = if has_strong_hierarchy && has_multiple_children {
            // 使用强结构匹配，包含层级信息
            ClickMode::StructuralHierarchy {
                root_bounds: self.get_node_bounds(card_root_index)?,
                clickable_bounds: self.get_node_bounds(clickable_parent_index)?,
                hierarchy_depth: self.calculate_hierarchy_depth(card_root_index, clickable_parent_index)?,
            }
        } else {
            // 使用简单的相对位置匹配
            ClickMode::RelativePosition {
                reference_bounds: self.get_node_bounds(card_root_index)?,
                target_bounds: self.get_node_bounds(clickable_parent_index)?,
                position_type: "bottom-action".to_string(),
            }
        };

        Ok((click_mode, "基于卡片整体结构特征".to_string()))
    }

    fn build_leaf_context_mode(
        &self,
        clicked_node_index: usize,
        clickable_parent_index: usize,
        outcomes: &[ScoreOutcome],
    ) -> Result<(ClickMode, String)> {
        let leaf_outcome = outcomes.iter()
            .find(|o| o.mode == MatchMode::LeafContext)
            .ok_or_else(|| anyhow!("未找到叶子上下文评分结果"))?;

        // 检查是否有明显的文本特征
        let clicked_node = self.xml_indexer.all_nodes.get(clicked_node_index);
        let node_text = clicked_node
            .and_then(|n| n.element.text.as_ref())
            .map(|s| s.as_str())
            .unwrap_or("");
        let has_stable_text = !node_text.is_empty() && 
                              !node_text.chars().any(|c| c.is_numeric());

        let click_mode = if has_stable_text && node_text.len() >= 2 {
            // 使用文本辅助的相对位置匹配
            ClickMode::TextAugmentedPosition {
                text_hint: node_text.to_string(),
                fallback_bounds: self.get_node_bounds(clickable_parent_index)?,
                context_description: leaf_outcome.explain.clone(),
            }
        } else {
            // 纯相对位置匹配
            ClickMode::RelativePosition {
                reference_bounds: self.get_node_bounds(clickable_parent_index)?,
                target_bounds: self.get_node_bounds(clicked_node_index)?,
                position_type: "sibling-context".to_string(),
            }
        };

        Ok((click_mode, "基于兄弟节点上下文".to_string()))
    }

    fn build_text_exact_mode(
        &self,
        clicked_node_index: usize,
        outcomes: &[ScoreOutcome],
    ) -> Result<(ClickMode, String)> {
        let text_outcome = outcomes.iter()
            .find(|o| o.mode == MatchMode::TextExact)
            .ok_or_else(|| anyhow!("未找到文本精确评分结果"))?;

        let clicked_node = self.xml_indexer.all_nodes.get(clicked_node_index);
        let node_text = clicked_node
            .and_then(|n| n.element.text.as_ref())
            .map(|s| s.as_str())
            .unwrap_or("");
        let content_desc = clicked_node
            .and_then(|n| n.element.content_desc.as_ref())
            .map(|s| s.as_str())
            .unwrap_or("");

        // 选择最稳定的文本特征
        let (primary_text, text_type) = if !node_text.is_empty() && text_outcome.conf > 0.75 {
            (node_text, "text")
        } else if !content_desc.is_empty() {
            (content_desc, "content-desc")
        } else {
            return Err(anyhow!("文本精确模式但无稳定文本特征"));
        };

        let click_mode = ClickMode::ExactTextMatch {
            target_text: primary_text.to_string(),
            text_source: text_type.to_string(),
            confidence_level: text_outcome.conf,
            fallback_bounds: self.get_node_bounds(clicked_node_index)?,
        };

        Ok((click_mode, format!("基于稳定{}文本", text_type)))
    }

    // 辅助方法
    fn get_node_bounds(&self, node_index: usize) -> Result<String> {
        if let Some(node) = self.xml_indexer.all_nodes.get(node_index) {
            Ok(format!("{:?}", node.bounds))
        } else {
            Err(anyhow!("节点索引{}无效", node_index))
        }
    }

    fn calculate_hierarchy_depth(&self, root_index: usize, target_index: usize) -> Result<usize> {
        // 简单计算层级深度
        let mut depth = 0;
        let mut current_index = target_index;
        
        while current_index != root_index && depth < 10 {
            if let Some(current_node) = self.xml_indexer.all_nodes.get(current_index) {
                // TODO: 实现parent查找逻辑
                if let Some(_parent_xpath) = current_node.parent_xpath.as_ref() {
                    // 暂时跳出循环，需要实现parent索引查找
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
            depth += 1;
        }
        
        Ok(depth)
    }

    /// 为UI展示生成映射摘要
    pub fn generate_mapping_summary(&self, mapping: &ExecutionMapping) -> MappingSummary {
        let click_mode_name = match &mapping.mapped_click_mode {
            ClickMode::StructuralHierarchy { .. } => "结构层级匹配",
            ClickMode::RelativePosition { .. } => "相对位置匹配",
            ClickMode::TextAugmentedPosition { .. } => "文本增强位置匹配",
            ClickMode::ExactTextMatch { .. } => "精确文本匹配",
            _ => "未知模式",
        };

        MappingSummary {
            selected_mode: mapping.auto_pick_result.recommended,
            selected_mode_display: mapping.auto_pick_result.recommended.display_name().to_string(),
            click_mode_name: click_mode_name.to_string(),
            confidence_score: mapping.auto_pick_result.outcomes.iter()
                .find(|o| o.mode == mapping.auto_pick_result.recommended)
                .map(|o| o.conf)
                .unwrap_or(0.0),
            execution_ready: true,
            parameter_summary: self.summarize_click_mode_parameters(&mapping.mapped_click_mode),
        }
    }

    fn summarize_click_mode_parameters(&self, click_mode: &ClickMode) -> String {
        match click_mode {
            ClickMode::StructuralHierarchy { hierarchy_depth, .. } => {
                format!("层级深度: {}层", hierarchy_depth)
            }
            ClickMode::RelativePosition { position_type, .. } => {
                format!("位置类型: {}", position_type)
            }
            ClickMode::TextAugmentedPosition { text_hint, .. } => {
                format!("文本提示: \"{}\"", text_hint)
            }
            ClickMode::ExactTextMatch { target_text, confidence_level, .. } => {
                format!("目标文本: \"{}\" (置信度: {:.3})", target_text, confidence_level)
            }
            _ => "基础参数配置".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MappingSummary {
    pub selected_mode: MatchMode,
    pub selected_mode_display: String,
    pub click_mode_name: String,
    pub confidence_score: f32,
    pub execution_ready: bool,
    pub parameter_summary: String,
}

// 扩展ClickMode以支持新的匹配类型
impl ClickMode {
    // 注意：这些是新增的ClickMode变体，需要在step_executor中定义
}

// display_name方法已在types.rs中定义，此处删除重复定义