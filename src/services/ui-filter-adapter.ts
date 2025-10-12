// src/services/ui-filter-adapter.ts
// module: ui | layer: service | role: adapter
// summary: ui-filter-adapter.ts 文件

/**
 * 过滤器系统适配器
 * 
 * 提供新旧过滤器系统之间的适配层，确保平滑迁移
 * 旧系统: visualFilter.ts + clickableHeuristics.ts + VisualFilterConfig
 * 新系统: ElementFilter.ts + ModuleFilterFactory + ElementFilterConfig
 */

import { ElementFilter, ModuleFilterFactory, FilterStrategy, ElementFilterConfig } from './ui-element-filter';
import type { UIElement } from '../api/universalUIAPI';

// 导入旧系统类型（用于兼容）
export interface LegacyVisualFilterConfig {
  onlyClickable: boolean;
  treatButtonAsClickable: boolean;
  requireTextOrDesc: boolean;
  minWidth: number;
  minHeight: number;
  includeClasses: string[];
  excludeClasses: string[];
}

/**
 * 旧系统默认配置（兼容性）
 */
export const legacyDefaultVisualFilterConfig: LegacyVisualFilterConfig = {
  onlyClickable: false,
  treatButtonAsClickable: true,
  requireTextOrDesc: false,
  minWidth: 1,
  minHeight: 1,
  includeClasses: [],
  excludeClasses: [],
};

/**
 * 过滤器适配器类
 * 在迁移期间提供新旧系统的桥接
 */
export class FilterAdapter {
  /**
   * 将旧的VisualFilterConfig转换为新的ElementFilterConfig
   */
  static convertLegacyConfig(legacyConfig: LegacyVisualFilterConfig): ElementFilterConfig {
    return {
      strategy: FilterStrategy.CUSTOM,
      minSize: {
        width: legacyConfig.minWidth,
        height: legacyConfig.minHeight
      },
      onlyClickable: legacyConfig.onlyClickable,
      onlyWithText: legacyConfig.requireTextOrDesc,
      includeClasses: legacyConfig.includeClasses,
      excludeClasses: legacyConfig.excludeClasses,
      customFilter: legacyConfig.treatButtonAsClickable ? 
        (element) => this.treatButtonAsClickableHeuristic(element) : undefined
    };
  }

  /**
   * 使用旧配置格式过滤元素（兼容接口）
   */
  static filterUIElementsByLegacyConfig(
    elements: UIElement[], 
    legacyConfig?: LegacyVisualFilterConfig
  ): UIElement[] {
    if (!legacyConfig) {
      return ModuleFilterFactory.forElementDiscovery(elements);
    }

    const newConfig = this.convertLegacyConfig(legacyConfig);
    return ElementFilter.apply(elements, newConfig);
  }

  /**
   * 按钮可点击启发式规则（兼容旧逻辑）
   */
  private static treatButtonAsClickableHeuristic(element: UIElement): boolean {
    if (element.is_clickable) {
      return true;
    }

    const className = element.class_name || '';
    return /Button|TextView/i.test(className) && !!element.text?.trim();
  }

  /**
   * 智能迁移：根据使用场景自动选择过滤策略
   */
  static smartFilter(elements: UIElement[], context: 'discovery' | 'analysis' | 'script' | 'legacy'): UIElement[] {
    switch (context) {
      case 'discovery':
        return ModuleFilterFactory.forElementDiscovery(elements);
      
      case 'analysis': 
        return ModuleFilterFactory.forPageAnalysis(elements);
        
      case 'script':
        return ModuleFilterFactory.forScriptBuilder(elements);
        
      case 'legacy':
      default:
        // 使用旧系统的默认行为
        return this.filterUIElementsByLegacyConfig(elements, legacyDefaultVisualFilterConfig);
    }
  }
}

/**
 * 兼容性导出（用于逐步替换旧导入）
 */
export const filterUIElementsByConfig = FilterAdapter.filterUIElementsByLegacyConfig;
export const defaultVisualFilterConfig = legacyDefaultVisualFilterConfig;
export type VisualFilterConfig = LegacyVisualFilterConfig;

/**
 * 迁移助手函数
 */
export class MigrationHelper {
  /**
   * 检查组件是否可以安全迁移到新系统
   */
  static canMigrateComponent(componentName: string): boolean {
    const safeMigrationList = [
      'ElementList',
      'VisualElementView', 
      'useFilteredVisualElements'
    ];
    
    return safeMigrationList.includes(componentName);
  }

  /**
   * 为组件推荐合适的新过滤策略
   */
  static recommendStrategy(componentName: string): FilterStrategy {
    const strategyMap: Record<string, FilterStrategy> = {
      'UniversalPageFinderModal': FilterStrategy.NONE,    // 元素发现
      'ElementList': FilterStrategy.NONE,                 // 元素发现
      'VisualElementView': FilterStrategy.BASIC,          // 基础过滤
      'PageAnalyzer': FilterStrategy.VALUABLE,            // 页面分析
      'ScriptBuilder': FilterStrategy.INTERACTIVE         // 脚本构建
    };

    return strategyMap[componentName] || FilterStrategy.NONE;
  }
}

export default FilterAdapter;