// src-tauri/src/domain/structure_runtime_match/auto_recommendation_service.rs  
// module: structure_runtime_match | layer: domain | role: 自动推荐服务
// summary: 统一入口服务，串联三路评分器→自动选型器→执行桥接器，提供完整的自动推荐流程

use super::auto_mode_selector::{AutoModeSelector, AutoPickConfig, AutoPickResult, RecommendationDetails};
use super::execution_bridge::{ExecutionBridge, ExecutionMapping, MappingSummary};
use super::scorers::types::{MatchMode, ScoreOutcome};
use super::execution_types::{ClickMode, ExecutionStrategy};
use crate::engine::xml_indexer::XmlIndexer;
use anyhow::{Result, anyhow};
use serde::{Serialize, Deserialize};
use tracing::{info, debug, warn, error};

/// 自动推荐完整结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoRecommendationResult {
    /// 点击信息
    pub click_info: ClickAnalysisInfo,
    /// 自动选型结果
    pub auto_pick_result: AutoPickResult,
    /// 执行映射
    pub execution_mapping: ExecutionMapping,
    /// 映射摘要（用于UI展示）
    pub mapping_summary: MappingSummary,
    /// 推荐详情
    pub recommendation_details: RecommendationDetails,
    /// 执行策略
    pub execution_strategy: ExecutionStrategy,
}

/// 点击分析信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClickAnalysisInfo {
    /// 被点击节点索引
    pub clicked_node_index: usize,
    /// 卡片根节点索引
    pub card_root_index: usize,
    /// 可点击父节点索引
    pub clickable_parent_index: usize,
    /// 分析时间戳
    pub analysis_timestamp: u64,
    /// 分析耗时（毫秒）
    pub analysis_duration_ms: u64,
}

/// 自动推荐服务配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoRecommendationConfig {
    /// 自动选型配置
    pub auto_pick_config: AutoPickConfig,
    /// 是否启用性能监控
    pub enable_performance_monitoring: bool,
    /// 是否启用详细日志
    pub enable_detailed_logging: bool,
    /// 超时设置（毫秒）
    pub timeout_ms: u32,
}

impl Default for AutoRecommendationConfig {
    fn default() -> Self {
        Self {
            auto_pick_config: AutoPickConfig::default(),
            enable_performance_monitoring: true,
            enable_detailed_logging: false,
            timeout_ms: 10000, // 10秒超时
        }
    }
}

/// 自动推荐服务主类
pub struct AutoRecommendationService<'a> {
    pub xml_indexer: &'a XmlIndexer,
    pub config: AutoRecommendationConfig,
}

impl<'a> AutoRecommendationService<'a> {
    /// 创建新的自动推荐服务实例
    pub fn new(xml_indexer: &'a XmlIndexer, config: AutoRecommendationConfig) -> Self {
        Self {
            xml_indexer,
            config,
        }
    }

    /// 使用默认配置创建服务实例
    pub fn with_default_config(xml_indexer: &'a XmlIndexer) -> Self {
        Self::new(xml_indexer, AutoRecommendationConfig::default())
    }

    /// 🎯 主要入口：完整的自动推荐流程
    pub fn generate_auto_recommendation(
        &self,
        clicked_node_index: usize,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> Result<AutoRecommendationResult> {
        let start_time = std::time::Instant::now();
        
        info!("🚀 [自动推荐] 开始生成推荐，节点索引: {} → {} → {}", 
            clicked_node_index, card_root_index, clickable_parent_index);

        // 1. 创建自动选型器并执行三路评分
        let selector = AutoModeSelector::new(self.xml_indexer, self.config.auto_pick_config.clone());
        let auto_pick_result = selector.auto_pick(
            clicked_node_index, 
            card_root_index, 
            clickable_parent_index
        )?;

        if self.config.enable_detailed_logging {
            debug!("📊 [自动选型] 推荐模式: {:?}, 评分结果: {:?}", 
                auto_pick_result.recommended, auto_pick_result.outcomes);
        }

        // 2. 创建执行桥接器并生成执行映射
        let bridge = ExecutionBridge::new(self.xml_indexer);
        let execution_mapping = bridge.create_execution_mapping(
            clicked_node_index, 
            card_root_index, 
            clickable_parent_index
        )?;

        // 3. 生成UI展示信息
        let mapping_summary = bridge.generate_mapping_summary(&execution_mapping);
        let recommendation_details = selector.generate_recommendation_details(&auto_pick_result);

        // 4. 创建执行策略
        let execution_strategy = self.create_execution_strategy(&execution_mapping)?;

        let duration = start_time.elapsed();
        info!("✅ [自动推荐] 推荐生成完成，耗时: {:?}ms, 推荐模式: {}", 
            duration.as_millis(), auto_pick_result.recommended.display_name());

        // 5. 构建完整结果
        Ok(AutoRecommendationResult {
            click_info: ClickAnalysisInfo {
                clicked_node_index,
                card_root_index,
                clickable_parent_index,
                analysis_timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
                analysis_duration_ms: duration.as_millis() as u64,
            },
            auto_pick_result,
            execution_mapping,
            mapping_summary,
            recommendation_details,
            execution_strategy,
        })
    }

    /// 🔧 快速推荐（仅返回推荐模式，用于实时预览）
    pub fn quick_recommend(
        &self,
        clicked_node_index: usize,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> Result<(MatchMode, f32)> {
        let selector = AutoModeSelector::new(self.xml_indexer, self.config.auto_pick_config.clone());
        let result = selector.auto_pick(clicked_node_index, card_root_index, clickable_parent_index)?;
        
        let confidence = result.outcomes.iter()
            .find(|o| o.mode == result.recommended)
            .map(|o| o.conf)
            .unwrap_or(0.0);
            
        Ok((result.recommended, confidence))
    }

    /// 🎨 为UI生成推荐摘要（轻量级，用于快速展示）
    pub fn generate_recommendation_summary(
        &self,
        clicked_node_index: usize,
        card_root_index: usize,
        clickable_parent_index: usize,
    ) -> Result<RecommendationSummary> {
        let (recommended_mode, confidence) = self.quick_recommend(
            clicked_node_index, 
            card_root_index, 
            clickable_parent_index
        )?;

        Ok(RecommendationSummary {
            recommended_mode,
            recommended_display: recommended_mode.display_name().to_string(),
            confidence_score: confidence,
            confidence_label: self.confidence_to_label(confidence),
            quick_description: self.generate_quick_description(&recommended_mode, confidence),
        })
    }

    /// 验证推荐结果的有效性
    pub fn validate_recommendation(&self, result: &AutoRecommendationResult) -> ValidationResult {
        let mut issues = Vec::new();
        let mut warnings = Vec::new();

        // 检查置信度
        let confidence = result.mapping_summary.confidence_score;
        if confidence < 0.5 {
            issues.push("整体置信度过低，可能导致匹配失败".to_string());
        } else if confidence < 0.7 {
            warnings.push("置信度偏低，建议人工确认".to_string());
        }

        // 检查执行策略可靠性
        let reliability = result.execution_strategy.primary_mode.reliability_score();
        if reliability < 0.6 {
            issues.push("执行策略可靠性不足".to_string());
        }

        // 检查是否有备用方案
        if result.execution_strategy.fallback_modes.is_empty() && confidence < 0.8 {
            warnings.push("建议添加备用执行方案".to_string());
        }

        let is_valid = issues.is_empty();
        let recommendation = if is_valid { "推荐使用" } else { "谨慎使用" }.to_string();
        
        ValidationResult {
            is_valid,
            confidence_level: if confidence >= 0.8 { "高" } else if confidence >= 0.6 { "中" } else { "低" }.to_string(),
            issues,
            warnings,
            recommendation,
        }
    }

    // 私有辅助方法
    fn create_execution_strategy(&self, mapping: &ExecutionMapping) -> Result<ExecutionStrategy> {
        let primary_mode = mapping.mapped_click_mode.clone();
        let mut fallback_modes = Vec::new();

        // 根据主要模式添加备用策略
        match &primary_mode {
            ClickMode::StructuralHierarchy { .. } => {
                // 结构匹配失败时，回退到相对位置
                fallback_modes.push(ClickMode::RelativePosition {
                    reference_bounds: self.get_node_bounds(mapping.card_root_index)?,
                    target_bounds: self.get_node_bounds(mapping.clickable_parent_index)?,
                    position_type: "fallback-position".to_string(),
                });
            },
            ClickMode::ExactTextMatch { fallback_bounds, .. } => {
                // 文本匹配失败时，回退到坐标点击
                if let Ok((x, y)) = self.parse_bounds_center(fallback_bounds) {
                    fallback_modes.push(ClickMode::DirectCoordinate {
                        x,
                        y,
                        source_description: "文本匹配失败备用坐标".to_string(),
                    });
                }
            },
            _ => {
                // 其他模式的通用备用策略
                if let Ok((x, y)) = self.get_node_center(mapping.clicked_node_index) {
                    fallback_modes.push(ClickMode::DirectCoordinate {
                        x,
                        y,
                        source_description: "通用备用坐标".to_string(),
                    });
                }
            }
        }

        Ok(ExecutionStrategy {
            primary_mode,
            fallback_modes,
            timeout_ms: self.config.timeout_ms,
            retry_count: 3,
        })
    }

    fn confidence_to_label(&self, confidence: f32) -> String {
        match confidence {
            c if c >= 0.9 => "极高".to_string(),
            c if c >= 0.8 => "高".to_string(),
            c if c >= 0.7 => "中等".to_string(),
            c if c >= 0.5 => "偏低".to_string(),
            _ => "低".to_string(),
        }
    }

    fn generate_quick_description(&self, mode: &MatchMode, confidence: f32) -> String {
        let base_desc = match mode {
            MatchMode::CardSubtree => "基于卡片整体结构特征匹配",
            MatchMode::LeafContext => "基于元素上下文位置关系匹配", 
            MatchMode::TextExact => "基于稳定文本内容精确匹配",
        };
        
        format!("{}（置信度: {:.1}%）", base_desc, confidence * 100.0)
    }

    fn get_node_bounds(&self, node_index: usize) -> Result<String> {
        if let Some(node) = self.xml_indexer.all_nodes.get(node_index) {
            Ok(format!("{:?}", node.bounds))
        } else {
            Err(anyhow!("节点索引{}无效", node_index))
        }
    }

    fn get_node_center(&self, node_index: usize) -> Result<(i32, i32)> {
        let bounds = self.get_node_bounds(node_index)?;
        self.parse_bounds_center(&bounds)
    }

    fn parse_bounds_center(&self, bounds: &str) -> Result<(i32, i32)> {
        // 解析 "[x1,y1][x2,y2]" 格式
        if let Some(captures) = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")?.captures(bounds) {
            let x1: i32 = captures[1].parse()?;
            let y1: i32 = captures[2].parse()?;
            let x2: i32 = captures[3].parse()?;
            let y2: i32 = captures[4].parse()?;
            Ok(((x1 + x2) / 2, (y1 + y2) / 2))
        } else {
            Err(anyhow!("无法解析边界字符串: {}", bounds))
        }
    }
}

/// 推荐摘要（轻量级UI展示）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendationSummary {
    pub recommended_mode: MatchMode,
    pub recommended_display: String,
    pub confidence_score: f32,
    pub confidence_label: String,
    pub quick_description: String,
}

/// 验证结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub confidence_level: String,
    pub issues: Vec<String>,
    pub warnings: Vec<String>,
    pub recommendation: String,
}
