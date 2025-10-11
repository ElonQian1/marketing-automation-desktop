// src/examples/ElementFilterUsageExamples.ts
// module: shared | layer: examples | role: 示例代码
// summary: 功能演示和使用示例

/**
 * ElementFilter 模块使用示例
 * 展示如何在不同的功能模块中使用独立的元素过滤器
 */

import { ElementFilter, ModuleFilterFactory, FilterStrategy } from '../services/ElementFilter';
import type { UIElement } from '../api/universalUIAPI';

// ========================
// 示例1: 页面查找器模块
// ========================
export class PageFinderExample {
  static async loadElements(xmlContent: string) {
    // 🎯 关键：先获取完整的元素列表
    const allElements = await this.parseXmlContent(xmlContent);
    
    // 根据不同视图需求进行过滤
    return {
      // 树视图 - 显示所有元素供用户选择
      treeView: ModuleFilterFactory.forElementDiscovery(allElements),
      
      // 网格视图 - 显示所有元素供用户选择  
      gridView: ModuleFilterFactory.forElementDiscovery(allElements),
      
      // 列表视图 - 可以选择性过滤小的装饰性元素
      listView: ElementFilter.quickFilter(allElements, FilterStrategy.BASIC)
    };
  }

  private static async parseXmlContent(xmlContent: string): Promise<UIElement[]> {
    // 调用纯解析函数，不进行任何过滤
    // 这里模拟调用，实际应该调用 XmlPageCacheService.parseXmlToAllElements
    return [];
  }
}

// ========================
// 示例2: 智能脚本构建器模块  
// ========================
export class ScriptBuilderExample {
  static async getInteractiveElements(xmlContent: string): Promise<UIElement[]> {
    // 获取所有元素
    const allElements = await this.parseXmlContent(xmlContent);
    
    // 🎯 只需要可交互的元素用于脚本构建
    return ModuleFilterFactory.forScriptBuilder(allElements);
  }

  static async getInputElements(xmlContent: string): Promise<UIElement[]> {
    // 获取所有元素
    const allElements = await this.parseXmlContent(xmlContent);
    
    // 🎯 专门提取输入框元素
    return ModuleFilterFactory.forInputElements(allElements);
  }

  private static async parseXmlContent(xmlContent: string): Promise<UIElement[]> {
    return [];
  }
}

// ========================
// 示例3: 页面分析模块
// ========================
export class PageAnalysisExample {
  static async analyzePageStructure(xmlContent: string) {
    // 获取所有元素
    const allElements = await this.parseXmlContent(xmlContent);
    
    return {
      // 总元素统计
      totalElements: allElements.length,
      
      // 有价值的元素用于分析
      valuableElements: ModuleFilterFactory.forPageAnalysis(allElements),
      
      // 导航元素
      navigationElements: ModuleFilterFactory.forNavigation(allElements),
      
      // 输入元素  
      inputElements: ModuleFilterFactory.forInputElements(allElements),
      
      // 可点击元素统计
      clickableElements: ElementFilter.apply(allElements, {
        strategy: FilterStrategy.CUSTOM,
        customFilter: (el) => el.is_clickable || false
      })
    };
  }

  private static async parseXmlContent(xmlContent: string): Promise<UIElement[]> {
    return [];
  }
}

// ========================
// 示例4: 自定义过滤需求
// ========================
export class CustomFilterExample {
  /**
   * 自定义过滤：查找特定类型的按钮
   */
  static findSpecificButtons(elements: UIElement[], buttonTexts: string[]): UIElement[] {
    return ElementFilter.apply(elements, {
      strategy: FilterStrategy.CUSTOM,
      onlyClickable: true,
      customFilter: (element) => {
        const text = (element.text || '').toLowerCase();
        return buttonTexts.some(btnText => text.includes(btnText.toLowerCase()));
      }
    });
  }

  /**
   * 自定义过滤：查找大尺寸的可视元素
   */
  static findLargeVisualElements(elements: UIElement[]): UIElement[] {
    return ElementFilter.apply(elements, {
      strategy: FilterStrategy.CUSTOM,
      minSize: { width: 100, height: 50 },
      customFilter: (element) => {
        // 有文本或描述的大元素
        return !!(element.text?.trim() || element.content_desc?.trim());
      }
    });
  }

  /**
   * 自定义过滤：排除系统UI元素
   */
  static excludeSystemElements(elements: UIElement[]): UIElement[] {
    return ElementFilter.apply(elements, {
      strategy: FilterStrategy.CUSTOM,
      excludeClasses: [
        'StatusBarBackground',
        'NavigationBarBackground', 
        'SystemUI'
      ]
    });
  }
}

// ========================
// 示例5: 统一调用模式
// ========================
export class UnifiedFilterUsage {
  /**
   * 标准模式：不同模块的统一调用方式
   */
  static async processElementsForModule(
    xmlContent: string, 
    moduleType: 'discovery' | 'analysis' | 'script' | 'navigation'
  ): Promise<UIElement[]> {
    
    // 第一步：始终获取完整的元素列表
    const allElements = await this.getCompleteElementList(xmlContent);
    
    // 第二步：根据模块类型应用相应的过滤器
    switch (moduleType) {
      case 'discovery':
        return ModuleFilterFactory.forElementDiscovery(allElements);
        
      case 'analysis':
        return ModuleFilterFactory.forPageAnalysis(allElements);
        
      case 'script':
        return ModuleFilterFactory.forScriptBuilder(allElements);
        
      case 'navigation':
        return ModuleFilterFactory.forNavigation(allElements);
        
      default:
        return allElements;
    }
  }

  private static async getCompleteElementList(xmlContent: string): Promise<UIElement[]> {
    // 这里应该调用 XmlPageCacheService.parseXmlToAllElements
    // 或者直接调用后端的纯解析接口
    return [];
  }
}

// ========================
// 最佳实践总结
// ========================
export const BestPractices = {
  
  // ✅ 正确的使用方式
  correct: {
    // 1. 先获取完整元素列表
    getAllElements: async (xmlContent: string) => {
      return await XmlPageCacheService.parseXmlToAllElements(xmlContent);
    },
    
    // 2. 根据需要应用过滤
    applyModuleFilter: (elements: UIElement[], moduleType: string) => {
      switch (moduleType) {
        case 'pageAnalysis':
          return ModuleFilterFactory.forPageAnalysis(elements);
        case 'scriptBuilder':
          return ModuleFilterFactory.forScriptBuilder(elements);
        default:
          return ModuleFilterFactory.forElementDiscovery(elements);
      }
    }
  },

  // ❌ 错误的使用方式
  incorrect: {
    // 不要在解析时就开始过滤
    dontMixParsingAndFiltering: () => {
      // ❌ 错误：在解析时就指定过滤
      // parseXmlToElements(xmlContent, true); 
    },
    
    // 不要硬编码过滤逻辑
    dontHardcodeFilters: () => {
      // ❌ 错误：在业务逻辑中硬编码过滤条件
      // elements.filter(el => el.bounds.width > 20 && el.is_clickable)
    }
  }
};

// 导入声明（用于示例）
declare const XmlPageCacheService: any;