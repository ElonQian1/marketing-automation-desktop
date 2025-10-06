/**
 * 独立的元素过滤器模块
 * 
 * 设计原则：
 * 1. 完全独立于解析逻辑
 * 2. 提供多种过滤策略
 * 3. 特殊模块按需调用
 * 4. 可配置和可扩展
 */

import type { UIElement } from '../api/universalUIAPI';

// 过滤策略枚举
export enum FilterStrategy {
  /** 无过滤 - 返回所有元素 */
  NONE = 'none',
  /** 基础过滤 - 过滤太小的装饰性元素 */
  BASIC = 'basic',
  /** 交互过滤 - 只保留可交互的元素 */
  INTERACTIVE = 'interactive',
  /** 有价值过滤 - 页面分析用的有价值元素 */
  VALUABLE = 'valuable',
  /** 自定义过滤 - 使用自定义规则 */
  CUSTOM = 'custom'
}

// 过滤配置接口
export interface ElementFilterConfig {
  /** 过滤策略 */
  strategy: FilterStrategy;
  /** 最小尺寸过滤 */
  minSize?: {
    width: number;
    height: number;
  };
  /** 是否只保留可点击元素 */
  onlyClickable?: boolean;
  /** 是否只保留有文本的元素 */
  onlyWithText?: boolean;
  /** 类名包含规则 */
  includeClasses?: string[];
  /** 类名排除规则 */
  excludeClasses?: string[];
  /** 自定义过滤函数 */
  customFilter?: (element: UIElement) => boolean;
}

// 预定义配置
export const FILTER_PRESETS: Record<FilterStrategy, ElementFilterConfig> = {
  [FilterStrategy.NONE]: {
    strategy: FilterStrategy.NONE
  },
  
  [FilterStrategy.BASIC]: {
    strategy: FilterStrategy.BASIC,
    minSize: { width: 10, height: 10 }
  },
  
  [FilterStrategy.INTERACTIVE]: {
    strategy: FilterStrategy.INTERACTIVE,
    onlyClickable: true,
    minSize: { width: 20, height: 20 }
  },
  
  [FilterStrategy.VALUABLE]: {
    strategy: FilterStrategy.VALUABLE,
    minSize: { width: 20, height: 20 },
    excludeClasses: ['StatusBarBackground', 'NavigationBarBackground']
  },
  
  [FilterStrategy.CUSTOM]: {
    strategy: FilterStrategy.CUSTOM
  }
};

/**
 * 元素过滤器类
 */
export class ElementFilter {
  /**
   * 应用过滤器到元素列表
   * @param elements 原始元素列表
   * @param config 过滤配置
   * @returns 过滤后的元素列表
   */
  static apply(elements: UIElement[], config: ElementFilterConfig): UIElement[] {
    if (config.strategy === FilterStrategy.NONE) {
      return elements;
    }

    return elements.filter(element => this.shouldKeepElement(element, config));
  }

  /**
   * 快速过滤 - 使用预定义策略
   * @param elements 原始元素列表
   * @param strategy 过滤策略
   * @returns 过滤后的元素列表
   */
  static quickFilter(elements: UIElement[], strategy: FilterStrategy): UIElement[] {
    const config = FILTER_PRESETS[strategy];
    return this.apply(elements, config);
  }

  /**
   * 判断是否应该保留元素
   */
  private static shouldKeepElement(element: UIElement, config: ElementFilterConfig): boolean {
    // 尺寸过滤
    if (config.minSize) {
      const width = (element.bounds?.right ?? 0) - (element.bounds?.left ?? 0);
      const height = (element.bounds?.bottom ?? 0) - (element.bounds?.top ?? 0);
      
      if (width < config.minSize.width || height < config.minSize.height) {
        return false;
      }
    }

    // 可点击过滤
    if (config.onlyClickable && !this.isClickable(element)) {
      return false;
    }

    // 文本过滤
    if (config.onlyWithText && !this.hasText(element)) {
      return false;
    }

    // 类名包含过滤
    if (config.includeClasses?.length) {
      const className = element.class_name || '';
      if (!config.includeClasses.some(cls => className.includes(cls))) {
        return false;
      }
    }

    // 类名排除过滤
    if (config.excludeClasses?.length) {
      const className = element.class_name || '';
      if (config.excludeClasses.some(cls => className.includes(cls))) {
        return false;
      }
    }

    // 自定义过滤
    if (config.customFilter && !config.customFilter(element)) {
      return false;
    }

    return true;
  }

  /**
   * 判断元素是否可点击
   */
  private static isClickable(element: UIElement): boolean {
    // 直接可点击
    if (element.is_clickable) {
      return true;
    }

    // 启发式判断：按钮类型通常是可点击的
    const className = element.class_name || '';
    if (/Button|TextView/i.test(className) && element.text?.trim()) {
      return true;
    }

    return false;
  }

  /**
   * 判断元素是否有文本
   */
  private static hasText(element: UIElement): boolean {
    return !!(element.text?.trim() || element.content_desc?.trim());
  }
}

/**
 * 特殊模块过滤器工厂
 * 为不同的功能模块提供专门的过滤器
 */
export class ModuleFilterFactory {
  /**
   * 页面分析模块过滤器
   * 用于页面结构分析，需要有价值的元素
   */
  static forPageAnalysis(elements: UIElement[]): UIElement[] {
    return ElementFilter.apply(elements, {
      strategy: FilterStrategy.VALUABLE,
      minSize: { width: 20, height: 20 },
      excludeClasses: [
        'StatusBarBackground', 
        'NavigationBarBackground',
        'View' // 过滤掉纯装饰性View
      ]
    });
  }

  /**
   * 智能脚本构建器过滤器
   * 只需要可交互的元素
   */
  static forScriptBuilder(elements: UIElement[]): UIElement[] {
    return ElementFilter.apply(elements, {
      strategy: FilterStrategy.INTERACTIVE,
      onlyClickable: true,
      minSize: { width: 20, height: 20 }
    });
  }

  /**
   * 元素发现器过滤器
   * 返回所有元素，不进行过滤
   */
  static forElementDiscovery(elements: UIElement[]): UIElement[] {
    return ElementFilter.quickFilter(elements, FilterStrategy.NONE);
  }

  /**
   * 导航元素提取器
   * 提取可能的导航元素
   */
  static forNavigation(elements: UIElement[]): UIElement[] {
    return ElementFilter.apply(elements, {
      strategy: FilterStrategy.CUSTOM,
      customFilter: (element) => {
        // 在底部区域的可点击元素
        const isBottomArea = (element.bounds?.top ?? 0) > 1400;
        // 或者包含导航相关文本
        const hasNavText = /首页|发现|消息|我|电话|联系人|收藏|tab|nav/i.test(
          element.text + ' ' + element.content_desc
        );
        return element.is_clickable && (isBottomArea || hasNavText);
      }
    });
  }

  /**
   * 输入框提取器
   * 提取所有输入相关元素
   */
  static forInputElements(elements: UIElement[]): UIElement[] {
    return ElementFilter.apply(elements, {
      strategy: FilterStrategy.CUSTOM,
      customFilter: (element) => {
        const className = element.class_name || '';
        return /EditText|Input|TextField/i.test(className) || element.element_type === 'edit_text';
      }
    });
  }
}

/**
 * 使用示例和最佳实践
 */
export const FilterUsageExamples = {
  // 元素发现 - 获取所有元素
  elementDiscovery: (elements: UIElement[]) => 
    ModuleFilterFactory.forElementDiscovery(elements),

  // 页面分析 - 获取有价值的元素
  pageAnalysis: (elements: UIElement[]) => 
    ModuleFilterFactory.forPageAnalysis(elements),

  // 脚本构建 - 获取可交互元素
  scriptBuilder: (elements: UIElement[]) => 
    ModuleFilterFactory.forScriptBuilder(elements),

  // 自定义过滤 - 特殊需求
  customUsage: (elements: UIElement[]) => 
    ElementFilter.apply(elements, {
      strategy: FilterStrategy.CUSTOM,
      minSize: { width: 50, height: 30 },
      onlyClickable: true,
      customFilter: (el) => el.text?.includes('按钮') || false
    })
};

export default ElementFilter;