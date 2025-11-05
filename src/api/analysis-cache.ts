// src/api/analysis-cache.ts
// module: api | layer: services | role: api-client
// summary: 分析缓存相关的前端API调用

import { invoke } from "@tauri-apps/api/core";

export interface SubtreeMetricsDto {
  element_path: string;
  element_text?: string;
  element_type?: string;
  resource_id?: string;
  class_name?: string;
  content_desc?: string;
  bounds?: string;
  
  // 策略评分
  uniqueness_score: number;
  stability_score: number;
  confidence: number;
  suggested_strategy: string;
  
  // 结构匹配参数
  available_fields: string[];
  container_info?: ContainerInfoDto;
  
  // 元数据
  computed_at: number;
  version: string;
}

export interface ContainerInfoDto {
  container_xpath?: string;
  container_type: string;
  item_index?: number;
  total_items?: number;
}

export interface CacheStats {
  dom_cache_size: number;
  subtree_cache_size: number;
  total_memory_mb: number;
}

/**
 * 注册XML快照，返回SnapshotId
 */
export async function registerSnapshot(xmlContent: string): Promise<string> {
  try {
    const snapshotId = await invoke<string>("register_snapshot_cmd", {
      xmlContent
    });
    console.log(`✅ [AnalysisCache] 注册XML快照: ${snapshotId}`);
    return snapshotId;
  } catch (error) {
    console.error("❌ [AnalysisCache] 注册快照失败:", error);
    throw error;
  }
}

/**
 * 获取子树分析指标（触发计算）
 */
export async function getSubtreeMetrics(
  snapshotId: string,
  absXPath: string
): Promise<SubtreeMetricsDto> {
  try {
    const metrics = await invoke<SubtreeMetricsDto>("get_subtree_metrics_cmd", {
      snapshotId,
      absXpath: absXPath
    });
    console.log(`✅ [AnalysisCache] 获取指标: ${absXPath} -> ${metrics.suggested_strategy}`);
    return metrics;
  } catch (error) {
    console.error("❌ [AnalysisCache] 获取指标失败:", error);
    throw error;
  }
}

/**
 * 尝试从缓存获取子树指标（不触发计算）
 */
export async function tryGetSubtreeMetrics(
  snapshotId: string,
  absXPath: string
): Promise<SubtreeMetricsDto | null> {
  try {
    const metrics = await invoke<SubtreeMetricsDto | null>("try_get_subtree_metrics_cmd", {
      snapshotId,
      absXpath: absXPath
    });
    if (metrics) {
      console.log(`🎯 [AnalysisCache] 缓存命中: ${absXPath}`);
    } else {
      console.log(`⚪ [AnalysisCache] 缓存未命中: ${absXPath}`);
    }
    return metrics;
  } catch (error) {
    console.error("❌ [AnalysisCache] 缓存查询失败:", error);
    return null;
  }
}

/**
 * 批量获取多个元素的子树指标
 */
export async function batchGetSubtreeMetrics(
  snapshotId: string,
  xpathList: string[]
): Promise<SubtreeMetricsDto[]> {
  try {
    const metricsList = await invoke<SubtreeMetricsDto[]>("batch_get_subtree_metrics_cmd", {
      snapshotId,
      xpathList
    });
    console.log(`✅ [AnalysisCache] 批量获取完成: ${metricsList.length}个元素`);
    return metricsList;
  } catch (error) {
    console.error("❌ [AnalysisCache] 批量获取失败:", error);
    throw error;
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const stats = await invoke<CacheStats>("get_cache_stats_cmd");
    return stats;
  } catch (error) {
    console.error("❌ [AnalysisCache] 获取缓存统计失败:", error);
    throw error;
  }
}

/**
 * 清理过期缓存
 */
export async function cleanupCache(maxAgeHours: number = 24): Promise<number> {
  try {
    const cleanedCount = await invoke<number>("cleanup_cache_cmd", {
      maxAgeHours
    });
    console.log(`🧹 [AnalysisCache] 清理完成: ${cleanedCount}个条目`);
    return cleanedCount;
  } catch (error) {
    console.error("❌ [AnalysisCache] 缓存清理失败:", error);
    throw error;
  }
}