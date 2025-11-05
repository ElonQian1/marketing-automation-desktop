// src-tauri/src/commands/analysis_cache.rs
// module: analysis_cache | layer: commands | role: tauri-command
// summary: 分析缓存相关的Tauri命令

use crate::domain::analysis_cache::api::{register_snapshot, get_or_compute_subtree, try_get_subtree};
use crate::domain::analysis_cache::types::{SubtreeMetricsDto, StepCardDto};
use anyhow::Result;

/// 注册XML快照，返回SnapshotId
#[tauri::command]
pub fn register_snapshot_cmd(xml_content: String) -> String {
    let snapshot_id = register_snapshot(&xml_content);
    tracing::info!("前端注册XML快照: snapshot_id={}", snapshot_id);
    snapshot_id
}

/// 获取子树分析指标
#[tauri::command]
pub fn get_subtree_metrics_cmd(
    snapshot_id: String,
    abs_xpath: String,
) -> Result<SubtreeMetricsDto, String> {
    match get_or_compute_subtree(&snapshot_id, &abs_xpath) {
        Ok(metrics) => {
            tracing::debug!("前端获取子树指标: xpath={}, 策略={}", 
                          abs_xpath, metrics.suggested_strategy);
            Ok(metrics.into())
        }
        Err(e) => {
            tracing::error!("获取子树指标失败: {}", e);
            Err(e.to_string())
        }
    }
}

/// 尝试从缓存获取子树指标（不触发计算）
#[tauri::command]
pub fn try_get_subtree_metrics_cmd(
    snapshot_id: String,
    abs_xpath: String,
) -> Option<SubtreeMetricsDto> {
    try_get_subtree(&snapshot_id, &abs_xpath).map(|m| m.into())
}

/// 批量获取多个元素的子树指标
#[tauri::command]
pub fn batch_get_subtree_metrics_cmd(
    snapshot_id: String,
    xpath_list: Vec<String>,
) -> Result<Vec<SubtreeMetricsDto>, String> {
    let mut results = Vec::new();
    
    for abs_xpath in xpath_list {
        match get_or_compute_subtree(&snapshot_id, &abs_xpath) {
            Ok(metrics) => results.push(metrics.into()),
            Err(e) => {
                tracing::warn!("批量获取指标失败: xpath={}, error={}", abs_xpath, e);
                return Err(format!("获取{}指标失败: {}", abs_xpath, e));
            }
        }
    }
    
    tracing::info!("批量获取完成: 处理{}个元素", results.len());
    Ok(results)
}

/// 清理过期缓存
#[tauri::command]
pub fn cleanup_cache_cmd(max_age_hours: u32) -> Result<usize, String> {
    // TODO: 实现基于时间的缓存清理
    tracing::info!("缓存清理: 最大年龄{}小时", max_age_hours);
    Ok(0)
}

/// 获取缓存统计信息
#[tauri::command]
pub fn get_cache_stats_cmd() -> CacheStats {
    use crate::domain::analysis_cache::{DOM_CACHE, SUBTREE_CACHE};
    
    let stats = CacheStats {
        dom_cache_size: DOM_CACHE.len(),
        subtree_cache_size: SUBTREE_CACHE.len(),
        total_memory_mb: 0, // TODO: 实际计算内存使用
    };
    
    tracing::debug!("缓存统计: DOM={}, 子树={}", 
                   stats.dom_cache_size, stats.subtree_cache_size);
    
    stats
}

#[derive(serde::Serialize)]
pub struct CacheStats {
    pub dom_cache_size: usize,
    pub subtree_cache_size: usize,
    pub total_memory_mb: usize,
}