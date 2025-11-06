// src/services/cached-intelligent-analysis.ts
// module: services | layer: services | role: service
// summary: 基于缓存的智能分析服务，避免重复XML分析

import { getSubtreeMetrics, tryGetSubtreeMetrics } from '../api/analysis-cache';
import type { SubtreeMetricsDto } from '../api/analysis-cache';
import type { UIElement } from '../api/universalUIAPI';

export interface CachedAnalysisResult {
  confidence: number;
  recommendedStrategy: string;
  alternatives: string[];
  reasoning: string;
  metadata: {
    analysisTime: number;
    strategyCount: number;
    usedCache: boolean;
    version: string;
  };
  // 结构匹配参数
  availableFields: string[];
  uniquenessScore: number;
  stabilityScore: number;
}

/**
 * 基于缓存的智能分析服务
 * 优先使用缓存，避免重复XML分析
 */
export class CachedIntelligentAnalysisService {
  
  /**
   * 分析元素策略（优先使用缓存）
   */
  async analyzeElementStrategy(
    element: UIElement,
    snapshotId: string,
    absXPath: string
  ): Promise<CachedAnalysisResult> {
    const startTime = Date.now();
    let usedCache = false;
    
    try {
      // 1. 尝试从缓存获取
      let metrics = await tryGetSubtreeMetrics(snapshotId, absXPath);
      
      if (metrics) {
        usedCache = true;
        console.log(`🎯 [CachedAnalysis] 缓存命中: ${absXPath} -> ${metrics.suggested_strategy}`);
      } else {
        // 2. 缓存未命中，触发计算
        console.log(`🔄 [CachedAnalysis] 缓存未命中，开始计算: ${absXPath}`);
        metrics = await getSubtreeMetrics(snapshotId, absXPath);
      }
      
      const analysisTime = Date.now() - startTime;
      
      // 3. 转换为统一结果格式
      return this.convertMetricsToResult(metrics, analysisTime, usedCache);
      
    } catch (error) {
      console.error('❌ [CachedAnalysis] 分析失败:', error);
      
      // 自愈机制：尝试重建快照
      const rebuiltResult = await this.tryRebuildSnapshot(snapshotId, element, absXPath);
      if (rebuiltResult) {
        console.log('🔧 [CachedAnalysis] 快照自愈成功，重新分析');
        return rebuiltResult;
      }
      
      // 降级处理：返回基于元素信息的简单分析
      return this.fallbackAnalysis(element, Date.now() - startTime);
    }
  }
  
  /**
   * 批量分析多个元素
   */
  async batchAnalyzeElements(
    elements: Array<{ element: UIElement; absXPath: string }>,
    snapshotId: string
  ): Promise<Map<string, CachedAnalysisResult>> {
    const results = new Map<string, CachedAnalysisResult>();
    
    // 并行处理多个元素
    const promises = elements.map(async ({ element, absXPath }) => {
      try {
        const result = await this.analyzeElementStrategy(element, snapshotId, absXPath);
        results.set(absXPath, result);
      } catch (error) {
        console.warn(`⚠️ [CachedAnalysis] 批量分析失败: ${absXPath}`, error);
        // 继续处理其他元素，不中断整个批次
      }
    });
    
    await Promise.allSettled(promises);
    
    console.log(`✅ [CachedAnalysis] 批量分析完成: ${results.size}/${elements.length}个元素`);
    return results;
  }
  
  /**
   * 转换SubtreeMetricsDto为CachedAnalysisResult
   */
  private convertMetricsToResult(
    metrics: SubtreeMetricsDto,
    analysisTime: number,
    usedCache: boolean
  ): CachedAnalysisResult {
    // 根据策略生成备选方案
    const alternatives = this.generateAlternativeStrategies(metrics);
    
    return {
      confidence: metrics.confidence,
      recommendedStrategy: metrics.suggested_strategy,
      alternatives,
      reasoning: this.generateReasoning(metrics),
      metadata: {
        analysisTime,
        strategyCount: alternatives.length + 1,
        usedCache,
        version: metrics.version,
      },
      availableFields: metrics.available_fields,
      uniquenessScore: metrics.uniqueness_score,
      stabilityScore: metrics.stability_score,
    };
  }
  
  /**
   * 生成备选策略
   */
  private generateAlternativeStrategies(metrics: SubtreeMetricsDto): string[] {
    const alternatives: string[] = [];
    
    // 基于可用字段推荐备选策略
    if (metrics.available_fields.includes('resource_id') && 
        metrics.suggested_strategy !== 'self_anchor') {
      alternatives.push('self_anchor');
    }
    
    if (metrics.available_fields.includes('text') && 
        metrics.suggested_strategy !== 'child_driven') {
      alternatives.push('child_driven');
    }
    
    if (metrics.available_fields.includes('content_desc') && 
        metrics.suggested_strategy !== 'content_desc') {
      alternatives.push('content_desc');
    }
    
    // 结构匹配作为通用备选
    if (metrics.suggested_strategy !== 'structure_match') {
      alternatives.push('structure_match');
    }
    
    return alternatives;
  }
  
  /**
   * 生成分析推理说明
   */
  private generateReasoning(metrics: SubtreeMetricsDto): string {
    const reasons: string[] = [];
    
    // 基于置信度
    if (metrics.confidence >= 0.8) {
      reasons.push('高置信度匹配');
    } else if (metrics.confidence >= 0.6) {
      reasons.push('中等置信度匹配');
    } else {
      reasons.push('低置信度匹配，建议验证');
    }
    
    // 基于唯一性
    if (metrics.uniqueness_score >= 0.8) {
      reasons.push('元素具有高唯一性');
    } else if (metrics.uniqueness_score < 0.5) {
      reasons.push('元素唯一性较低，可能存在多个匹配');
    }
    
    // 基于稳定性
    if (metrics.stability_score >= 0.8) {
      reasons.push('策略稳定性高');
    } else if (metrics.stability_score < 0.5) {
      reasons.push('策略稳定性低，可能受页面变化影响');
    }
    
    // 基于推荐策略
    switch (metrics.suggested_strategy) {
      case 'self_anchor':
        reasons.push('基于resource-id直接定位，推荐优先使用');
        break;
      case 'child_driven':
        reasons.push('基于文本内容定位，适合按钮等文本元素');
        break;
      case 'content_desc':
        reasons.push('基于内容描述定位，适合无文本的功能元素');
        break;
      case 'structure_match':
        reasons.push('基于结构匹配，适合复杂布局场景');
        break;
    }
    
    return reasons.join('；');
  }
  
  /**
   * 尝试重建丢失的快照
   */
  private async tryRebuildSnapshot(
    snapshotId: string, 
    element: UIElement, 
    absXPath: string
  ): Promise<CachedAnalysisResult | null> {
    try {
      console.log('🔧 [CachedAnalysis] 尝试重建快照:', snapshotId);
      
      // 1. 检查是否可以从当前UI重新获取快照
      const { useAdb } = await import('../application/store/adbStore');
      const adbStore = useAdb.getState();
      const selectedDevice = adbStore.getSelectedDevice();
      
      if (!selectedDevice) {
        console.warn('⚠️ [CachedAnalysis] 无选中设备，无法重建快照');
        return null;
      }
      
      // 2. 重新获取当前页面的XML
      const { invoke } = await import('@tauri-apps/api/core');
      const xmlContent = await invoke<string>('get_ui_dump', {
        deviceId: selectedDevice.id
      });
      
      // 3. 重新注册快照
      const { registerSnapshot } = await import('../api/analysis-cache');
      const newSnapshotId = await registerSnapshot(xmlContent);
      
      console.log('✅ [CachedAnalysis] 快照重建成功:', {
        oldSnapshotId: snapshotId,
        newSnapshotId: newSnapshotId
      });
      
      // 4. 使用新快照重新分析
      const startTime = Date.now();
      const { getSubtreeMetrics } = await import('../api/analysis-cache');
      const metrics = await getSubtreeMetrics(newSnapshotId, absXPath);
      const analysisTime = Date.now() - startTime;
      
      return this.convertMetricsToResult(metrics, analysisTime, false);
      
    } catch (error) {
      console.warn('⚠️ [CachedAnalysis] 快照重建失败:', error);
      return null;
    }
  }
  
  /**
   * 降级分析（当缓存系统不可用时）
   */
  private fallbackAnalysis(
    element: UIElement,
    analysisTime: number
  ): CachedAnalysisResult {
    console.warn('⚠️ [CachedAnalysis] 使用降级分析');
    
    let strategy = 'structure_match';
    let confidence = 0.3;
    const availableFields: string[] = [];
    
    // 简单的策略推断
    if (element.resource_id) {
      strategy = 'self_anchor';
      confidence = 0.7;
      availableFields.push('resource_id');
    } else if (element.text) {
      strategy = 'child_driven';
      confidence = 0.6;
      availableFields.push('text');
    } else if (element.content_desc) {
      strategy = 'content_desc';
      confidence = 0.5;
      availableFields.push('content_desc');
    }
    
    if (element.class_name) availableFields.push('class_name');
    
    return {
      confidence,
      recommendedStrategy: strategy,
      alternatives: ['structure_match'],
      reasoning: '降级分析：缓存系统不可用，使用简化策略推断',
      metadata: {
        analysisTime,
        strategyCount: 2,
        usedCache: false,
        version: 'fallback-v1.0',
      },
      availableFields,
      uniquenessScore: confidence * 0.8,
      stabilityScore: confidence * 0.6,
    };
  }
}

// 导出单例实例
export const cachedIntelligentAnalysisService = new CachedIntelligentAnalysisService();