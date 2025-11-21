// src-tauri/src/domain/analysis_cache/types.rs
// module: analysis_cache | layer: domain | role: types
// summary: 缓存系统的类型定义和数据传输对象

use serde::{Deserialize, Serialize};

/// 前端使用的SubtreeMetrics DTO
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SubtreeMetricsDto {
    pub element_path: String,
    pub element_text: Option<String>,
    pub element_type: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub content_desc: Option<String>,
    pub bounds: Option<String>,
    
    // 策略评分
    pub uniqueness_score: f32,
    pub stability_score: f32,
    pub confidence: f32,
    pub suggested_strategy: String,
    
    // 结构匹配参数
    pub available_fields: Vec<String>,
    pub container_info: Option<ContainerInfoDto>,
    
    // 元数据
    pub computed_at: i64,
    pub version: String,
}

/// 容器信息DTO
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ContainerInfoDto {
    pub container_xpath: Option<String>,
    pub container_type: String,
    pub item_index: Option<usize>,
    pub total_items: Option<usize>,
}

/// 步骤卡片DTO（用于缓存重建）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StepCardDto {
    pub abs_xpath: String,
    pub xml_snapshot: Option<String>,
    pub snapshot_id: Option<String>,
    pub allow_backend_fallback: bool,
    pub device_id: Option<String>,
}

impl From<super::SubtreeMetrics> for SubtreeMetricsDto {
    fn from(metrics: super::SubtreeMetrics) -> Self {
        Self {
            element_path: metrics.element_path,
            element_text: metrics.element_text,
            element_type: metrics.element_type,
            resource_id: metrics.resource_id,
            class_name: metrics.class_name,
            content_desc: metrics.content_desc,
            bounds: metrics.bounds,
            uniqueness_score: metrics.uniqueness_score,
            stability_score: metrics.stability_score,
            confidence: metrics.confidence,
            suggested_strategy: metrics.suggested_strategy,
            available_fields: metrics.available_fields,
            container_info: metrics.container_info.map(|ci| ContainerInfoDto {
                container_xpath: ci.container_xpath,
                container_type: ci.container_type,
                item_index: ci.item_index,
                total_items: ci.total_items,
            }),
            computed_at: metrics.computed_at,
            version: metrics.version,
        }
    }
}