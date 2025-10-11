// src/modules/intelligent-strategy-system/optimization/RegionLimitedSearchOptimizer.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 区域限制搜索优化系统
 * 
 * 根据XPath文档要求实现区域化搜索优化，通过限制搜索范围
 * 提高匹配精度和执行效率，减少误匹配的可能性
 */

import type { 
  StrategyCandidate, 
  MatchStrategy 
} from '../types/StrategyTypes';

import type { 
  ElementAnalysisContext 
} from '../types/AnalysisTypes';

/**
 * 搜索区域定义
 */
export interface SearchRegion {
  /** 区域标识 */
  regionId: string;
  /** 区域名称 */
  name: string;
  /** 区域边界 */
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  /** 区域类型 */
  type: 'screen' | 'container' | 'component' | 'viewport' | 'custom';
  /** 区域权重（影响搜索优先级） */
  weight: number;
  /** 区域描述 */
  description?: string;
}

/**
 * 区域搜索配置
 */
export interface RegionSearchConfig {
  /** 启用自适应区域调整 */
  enableAdaptiveRegionAdjustment: boolean;
  /** 区域扩展系数 */
  regionExpansionFactor: number;
  /** 最小区域大小 (px) */
  minRegionSize: number;
  /** 最大区域大小 (px) */
  maxRegionSize: number;
  /** 启用区域重叠检测 */
  enableOverlapDetection: boolean;
  /** 启用性能优化 */
  enablePerformanceOptimization: boolean;
}

/**
 * 区域搜索结果
 */
export interface RegionSearchResult {
  /** 是否成功 */
  success: boolean;
  /** 匹配到的区域 */
  matchedRegions: SearchRegion[];
  /** 优化后的候选者 */
  optimizedCandidates: StrategyCandidate[];
  /** 搜索统计 */
  statistics: {
    /** 原始候选者数量 */
    originalCandidateCount: number;
    /** 优化后候选者数量 */
    optimizedCandidateCount: number;
    /** 搜索区域数量 */
    regionCount: number;
    /** 预估性能提升 */
    estimatedPerformanceGain: number;
    /** 搜索时间 (ms) */
    searchTime: number;
  };
  /** 优化建议 */
  optimizationSuggestions: string[];
}

/**
 * 区域限制搜索优化系统
 * 
 * 通过分析元素上下文和屏幕布局，智能限制搜索范围，
 * 提高匹配效率和准确性，减少跨区域的误匹配
 */
export class RegionLimitedSearchOptimizer {
  private readonly config: RegionSearchConfig;
  private regionCache = new Map<string, SearchRegion[]>();
  private performanceMetrics = new Map<string, number>();

  constructor(config?: Partial<RegionSearchConfig>) {
    this.config = {
      enableAdaptiveRegionAdjustment: true,
      regionExpansionFactor: 1.2,
      minRegionSize: 100,
      maxRegionSize: 2000,
      enableOverlapDetection: true,
      enablePerformanceOptimization: true,
      ...config
    };
  }

  /**
   * 执行区域限制搜索优化
   * @param context 元素分析上下文
   * @param candidates 原始策略候选者
   * @param screenSize 屏幕尺寸信息
   * @returns 区域搜索结果
   */
  async optimizeSearch(
    context: ElementAnalysisContext,
    candidates: StrategyCandidate[],
    screenSize: { width: number; height: number }
  ): Promise<RegionSearchResult> {
    const startTime = Date.now();
    
    try {
      // 1. 分析目标元素的区域特征
      const targetRegions = await this.analyzeTargetRegions(context, screenSize);
      
      // 2. 生成优化的搜索区域
      const optimizedRegions = await this.generateOptimizedRegions(
        targetRegions, 
        context, 
        screenSize
      );
      
      // 3. 根据区域限制优化候选者
      const optimizedCandidates = await this.applyCandidateOptimization(
        candidates, 
        optimizedRegions, 
        context
      );
      
      // 4. 计算性能提升预估
      const performanceGain = this.calculatePerformanceGain(
        candidates.length, 
        optimizedCandidates.length, 
        optimizedRegions
      );
      
      // 5. 生成优化建议
      const suggestions = this.generateOptimizationSuggestions(
        context, 
        optimizedRegions, 
        candidates, 
        optimizedCandidates
      );

      const searchTime = Date.now() - startTime;

      return {
        success: true,
        matchedRegions: optimizedRegions,
        optimizedCandidates,
        statistics: {
          originalCandidateCount: candidates.length,
          optimizedCandidateCount: optimizedCandidates.length,
          regionCount: optimizedRegions.length,
          estimatedPerformanceGain: performanceGain,
          searchTime
        },
        optimizationSuggestions: suggestions
      };

    } catch (error) {
      console.error('[RegionOptimizer] 区域搜索优化失败:', error);
      
      return {
        success: false,
        matchedRegions: [],
        optimizedCandidates: candidates, // 返回原始候选者
        statistics: {
          originalCandidateCount: candidates.length,
          optimizedCandidateCount: candidates.length,
          regionCount: 0,
          estimatedPerformanceGain: 0,
          searchTime: Date.now() - startTime
        },
        optimizationSuggestions: [`优化失败: ${error.message}`]
      };
    }
  }

  /**
   * 分析目标元素的区域特征
   */
  private async analyzeTargetRegions(
    context: ElementAnalysisContext,
    screenSize: { width: number; height: number }
  ): Promise<SearchRegion[]> {
    const element = context.targetElement;
    const regions: SearchRegion[] = [];

    // 1. 解析元素bounds
    const bounds = this.parseBounds(element.bounds?.toString() || '');
    if (!bounds) {
      // 如果没有bounds信息，创建全屏区域
      regions.push(this.createFullScreenRegion(screenSize));
      return regions;
    }

    // 2. 创建元素自身区域
    const elementRegion: SearchRegion = {
      regionId: 'element-self',
      name: '目标元素区域',
      bounds,
      type: 'component',
      weight: 1.0,
      description: '目标元素的精确位置区域'
    };
    regions.push(elementRegion);

    // 3. 创建扩展区域（考虑相邻元素）
    const expandedBounds = this.expandBounds(bounds, this.config.regionExpansionFactor);
    const expandedRegion: SearchRegion = {
      regionId: 'element-expanded',
      name: '扩展搜索区域',
      bounds: expandedBounds,
      type: 'container',
      weight: 0.8,
      description: '目标元素的扩展搜索区域，包含相邻元素'
    };
    regions.push(expandedRegion);

    // 4. 分析父容器区域
    if (context.hierarchy && context.hierarchy.ancestors.length > 0) {
      const parentRegions = context.hierarchy.ancestors.map(ancestorElement =>
        this.createRegionFromElement(ancestorElement, 'container', 0.6)
      ).filter(Boolean) as SearchRegion[];
      
      regions.push(...parentRegions);
    }

    // 5. 创建屏幕区域（用于全局搜索）
    const screenRegion = this.createScreenRegions(screenSize, bounds);
    regions.push(...screenRegion);

    return regions;
  }

  /**
   * 生成优化的搜索区域
   */
  private async generateOptimizedRegions(
    targetRegions: SearchRegion[],
    context: ElementAnalysisContext,
    screenSize: { width: number; height: number }
  ): Promise<SearchRegion[]> {
    let optimizedRegions = [...targetRegions];

    // 1. 移除重叠区域（如果启用）
    if (this.config.enableOverlapDetection) {
      optimizedRegions = this.removeOverlappingRegions(optimizedRegions);
    }

    // 2. 自适应区域调整（如果启用）
    if (this.config.enableAdaptiveRegionAdjustment) {
      optimizedRegions = await this.adjustRegionsAdaptively(
        optimizedRegions, 
        context, 
        screenSize
      );
    }

    // 3. 区域大小限制
    optimizedRegions = this.applyRegionSizeLimits(optimizedRegions);

    // 4. 按权重排序
    optimizedRegions.sort((a, b) => b.weight - a.weight);

    return optimizedRegions.slice(0, 5); // 限制最多5个区域
  }

  /**
   * 应用候选者优化
   */
  private async applyCandidateOptimization(
    candidates: StrategyCandidate[],
    regions: SearchRegion[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    const optimizedCandidates: StrategyCandidate[] = [];

    for (const candidate of candidates) {
      // 为每个候选者分配最适合的搜索区域
      const suitableRegions = this.findSuitableRegions(candidate, regions, context);
      
      if (suitableRegions.length > 0) {
        // 创建区域限制的候选者副本
        const optimizedCandidate: StrategyCandidate = {
          ...candidate,
          criteria: {
            ...candidate.criteria,
            // 添加区域限制
            searchRegions: suitableRegions.map(r => r.regionId),
            regionBounds: suitableRegions.map(r => r.bounds)
          }
        };
        
        optimizedCandidates.push(optimizedCandidate);
      }
    }

    return optimizedCandidates;
  }

  /**
   * 寻找适合候选者的搜索区域
   */
  private findSuitableRegions(
    candidate: StrategyCandidate,
    regions: SearchRegion[],
    context: ElementAnalysisContext
  ): SearchRegion[] {
    const strategy = candidate.strategy;
    
    // 根据策略类型选择合适的区域
    switch (strategy) {
      case 'absolute':
        // 绝对定位策略优先使用精确区域
        return regions.filter(r => r.type === 'component' || r.type === 'container').slice(0, 2);
      
      case 'strict':
        // 严格匹配策略使用中等范围区域
        return regions.filter(r => r.weight >= 0.6).slice(0, 3);
      
      case 'standard':
        // 标准匹配策略使用平衡的区域组合
        return regions.slice(0, 3);
      
      case 'relaxed':
      case 'positionless':
        // 宽松匹配策略使用更大的搜索范围
        return regions.slice(0, 4);
      
      case 'xpath-direct':
        // XPath直接匹配使用精确区域
        return regions.filter(r => r.type === 'component').slice(0, 1);
      
      case 'xpath-first-index':
      case 'xpath-all-elements':
        // XPath索引/批量匹配使用扩展区域
        return regions.filter(r => r.weight >= 0.5);
      
      default:
        // 默认使用前3个区域
        return regions.slice(0, 3);
    }
  }

  // === 辅助方法 ===

  private parseBounds(boundsStr: string): SearchRegion['bounds'] | null {
    if (!boundsStr) return null;
    
    try {
      // 解析bounds格式: "[left,top][right,bottom]"
      const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (match) {
        return {
          left: parseInt(match[1]),
          top: parseInt(match[2]),
          right: parseInt(match[3]),
          bottom: parseInt(match[4])
        };
      }
    } catch (error) {
      console.warn('[RegionOptimizer] bounds解析失败:', boundsStr);
    }
    
    return null;
  }

  private expandBounds(
    bounds: SearchRegion['bounds'], 
    factor: number
  ): SearchRegion['bounds'] {
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    
    const expandX = Math.floor(width * (factor - 1) / 2);
    const expandY = Math.floor(height * (factor - 1) / 2);
    
    return {
      left: Math.max(0, bounds.left - expandX),
      top: Math.max(0, bounds.top - expandY),
      right: bounds.right + expandX,
      bottom: bounds.bottom + expandY
    };
  }

  private createFullScreenRegion(screenSize: { width: number; height: number }): SearchRegion {
    return {
      regionId: 'fullscreen',
      name: '全屏区域',
      bounds: {
        left: 0,
        top: 0,
        right: screenSize.width,
        bottom: screenSize.height
      },
      type: 'screen',
      weight: 0.3,
      description: '全屏搜索区域'
    };
  }

  private createRegionFromElement(
    element: any, 
    type: SearchRegion['type'], 
    weight: number
  ): SearchRegion | null {
    const bounds = this.parseBounds(element.bounds);
    if (!bounds) return null;
    
    return {
      regionId: `parent-${element.attributes?.['resource-id'] || 'unknown'}`,
      name: `父容器区域`,
      bounds,
      type,
      weight,
      description: `父容器元素区域: ${element.attributes?.class || 'unknown'}`
    };
  }

  private createScreenRegions(
    screenSize: { width: number; height: number },
    elementBounds: SearchRegion['bounds']
  ): SearchRegion[] {
    const regions: SearchRegion[] = [];
    
    // 创建屏幕四象限区域
    const midX = screenSize.width / 2;
    const midY = screenSize.height / 2;
    
    const quadrants = [
      { name: '左上象限', bounds: { left: 0, top: 0, right: midX, bottom: midY } },
      { name: '右上象限', bounds: { left: midX, top: 0, right: screenSize.width, bottom: midY } },
      { name: '左下象限', bounds: { left: 0, top: midY, right: midX, bottom: screenSize.height } },
      { name: '右下象限', bounds: { left: midX, top: midY, right: screenSize.width, bottom: screenSize.height } }
    ];
    
    // 找出元素所在的象限，给予更高权重
    quadrants.forEach((quad, index) => {
      const isElementInQuad = this.isPointInBounds(
        { x: (elementBounds.left + elementBounds.right) / 2, y: (elementBounds.top + elementBounds.bottom) / 2 },
        quad.bounds
      );
      
      regions.push({
        regionId: `quadrant-${index}`,
        name: quad.name,
        bounds: quad.bounds,
        type: 'viewport',
        weight: isElementInQuad ? 0.7 : 0.4,
        description: `屏幕${quad.name}区域`
      });
    });
    
    return regions;
  }

  private removeOverlappingRegions(regions: SearchRegion[]): SearchRegion[] {
    const result: SearchRegion[] = [];
    
    for (const region of regions) {
      let hasSignificantOverlap = false;
      
      for (const existing of result) {
        const overlapArea = this.calculateOverlapArea(region.bounds, existing.bounds);
        const regionArea = this.calculateArea(region.bounds);
        const overlapRatio = overlapArea / regionArea;
        
        // 如果重叠超过80%，跳过这个区域
        if (overlapRatio > 0.8) {
          hasSignificantOverlap = true;
          break;
        }
      }
      
      if (!hasSignificantOverlap) {
        result.push(region);
      }
    }
    
    return result;
  }

  private async adjustRegionsAdaptively(
    regions: SearchRegion[],
    context: ElementAnalysisContext,
    screenSize: { width: number; height: number }
  ): Promise<SearchRegion[]> {
    // 自适应调整逻辑（简化实现）
    return regions.map(region => {
      // 根据元素类型调整区域大小
      const element = context.targetElement;
      
      if (element.attributes?.class?.includes('Button') && region.type === 'component') {
        // 按钮元素通常需要更精确的区域
        region.bounds = this.constrainBounds(region.bounds, 0.8);
      } else if (element.attributes?.class?.includes('TextView') && region.type === 'container') {
        // 文本元素可能需要更大的搜索区域
        region.bounds = this.expandBounds(region.bounds, 1.3);
      }
      
      return region;
    });
  }

  private applyRegionSizeLimits(regions: SearchRegion[]): SearchRegion[] {
    return regions.map(region => {
      const area = this.calculateArea(region.bounds);
      const maxArea = this.config.maxRegionSize * this.config.maxRegionSize;
      const minArea = this.config.minRegionSize * this.config.minRegionSize;
      
      if (area > maxArea) {
        // 区域太大，需要收缩
        const scale = Math.sqrt(maxArea / area);
        region.bounds = this.scaleBounds(region.bounds, scale);
      } else if (area < minArea) {
        // 区域太小，需要扩展
        const scale = Math.sqrt(minArea / area);
        region.bounds = this.scaleBounds(region.bounds, scale);
      }
      
      return region;
    });
  }

  private calculatePerformanceGain(
    originalCount: number,
    optimizedCount: number,
    regions: SearchRegion[]
  ): number {
    if (originalCount === 0) return 0;
    
    // 简化的性能提升计算
    const candidateReduction = (originalCount - optimizedCount) / originalCount;
    const regionEfficiency = regions.reduce((sum, r) => sum + r.weight, 0) / regions.length;
    
    return Math.min(0.8, candidateReduction * 0.6 + regionEfficiency * 0.4);
  }

  private generateOptimizationSuggestions(
    context: ElementAnalysisContext,
    regions: SearchRegion[],
    originalCandidates: StrategyCandidate[],
    optimizedCandidates: StrategyCandidate[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (optimizedCandidates.length < originalCandidates.length) {
      suggestions.push(`通过区域限制减少了${originalCandidates.length - optimizedCandidates.length}个候选者`);
    }
    
    if (regions.length > 3) {
      suggestions.push('建议进一步优化搜索区域数量以提高性能');
    }
    
    const highWeightRegions = regions.filter(r => r.weight > 0.8);
    if (highWeightRegions.length > 0) {
      suggestions.push(`发现${highWeightRegions.length}个高权重区域，建议优先使用`);
    }
    
    return suggestions;
  }

  // 数学计算辅助方法
  private isPointInBounds(point: { x: number; y: number }, bounds: SearchRegion['bounds']): boolean {
    return point.x >= bounds.left && point.x <= bounds.right &&
           point.y >= bounds.top && point.y <= bounds.bottom;
  }

  private calculateOverlapArea(bounds1: SearchRegion['bounds'], bounds2: SearchRegion['bounds']): number {
    const left = Math.max(bounds1.left, bounds2.left);
    const top = Math.max(bounds1.top, bounds2.top);
    const right = Math.min(bounds1.right, bounds2.right);
    const bottom = Math.min(bounds1.bottom, bounds2.bottom);
    
    if (left < right && top < bottom) {
      return (right - left) * (bottom - top);
    }
    
    return 0;
  }

  private calculateArea(bounds: SearchRegion['bounds']): number {
    return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  }

  private constrainBounds(bounds: SearchRegion['bounds'], factor: number): SearchRegion['bounds'] {
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    const width = (bounds.right - bounds.left) * factor;
    const height = (bounds.bottom - bounds.top) * factor;
    
    return {
      left: Math.floor(centerX - width / 2),
      top: Math.floor(centerY - height / 2),
      right: Math.floor(centerX + width / 2),
      bottom: Math.floor(centerY + height / 2)
    };
  }

  private scaleBounds(bounds: SearchRegion['bounds'], scale: number): SearchRegion['bounds'] {
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    const width = (bounds.right - bounds.left) * scale;
    const height = (bounds.bottom - bounds.top) * scale;
    
    return {
      left: Math.floor(centerX - width / 2),
      top: Math.floor(centerY - height / 2),
      right: Math.floor(centerX + width / 2),
      bottom: Math.floor(centerY + height / 2)
    };
  }

  /**
   * 清理区域缓存
   */
  clearCache(): void {
    this.regionCache.clear();
    this.performanceMetrics.clear();
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }
}