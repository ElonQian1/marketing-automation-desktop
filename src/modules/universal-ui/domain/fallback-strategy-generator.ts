// src/modules/universal-ui/domain/fallback-strategy-generator.ts
// module: universal-ui | layer: domain | role: service
// summary: 兜底策略生成服务，为元素选择提供可靠的默认策略

import type { 
  ElementSelectionContext, 
  StrategyCandidate 
} from '../types/intelligent-analysis-types';

/**
 * 兜底策略优先级枚举
 */
export enum FallbackPriority {
  RESOURCE_ID = 1,      // resource-id属性
  TEXT_CONTENT = 2,     // 文本内容
  CLASS_NAME = 3,       // 类名
  XPATH_ABSOLUTE = 4,   // 绝对XPath
  INDEX_BASED = 5,      // 索引定位
  COORDINATE_GRID = 6   // 坐标网格
}

/**
 * 兜底策略生成器
 * 
 * 职责：
 * 1. 🛡️ 为任何元素选择提供可靠的默认策略
 * 2. 📊 按优先级顺序生成多个兜底选项
 * 3. 🔄 支持策略降级和升级
 * 4. 🚀 确保"不等分析完成"时的立即可用性
 */
export class FallbackStrategyGenerator {
  
  /**
   * 生成主要兜底策略
   * 
   * @param context 元素选择上下文
   * @returns 最优兜底策略
   */
  static generatePrimaryFallback(context: ElementSelectionContext): StrategyCandidate {
    const strategies = this.generateAllFallbackStrategies(context);
    return strategies[0]; // 返回优先级最高的策略
  }

  /**
   * 生成所有可能的兜底策略
   * 
   * @param context 元素选择上下文
   * @returns 按优先级排序的兜底策略列表
   */
  static generateAllFallbackStrategies(context: ElementSelectionContext): StrategyCandidate[] {
    const strategies: StrategyCandidate[] = [];

    // 1. resource-id 策略（最可靠）
    if (context.keyAttributes?.['resource-id']) {
      strategies.push(this.createResourceIdStrategy(context));
    }

    // 2. 文本内容策略
    if (context.elementText && context.elementText.trim().length > 0) {
      strategies.push(this.createTextContentStrategy(context));
    }

    // 3. 类名策略
    if (context.keyAttributes?.class) {
      strategies.push(this.createClassNameStrategy(context));
    }

    // 4. 绝对XPath策略（通用兜底）
    strategies.push(this.createAbsoluteXPathStrategy(context));

    // 5. 索引定位策略
    strategies.push(this.createIndexBasedStrategy(context));

    // 6. 坐标网格策略（最后手段）
    if (context.elementBounds) {
      strategies.push(this.createCoordinateGridStrategy(context));
    }

    return strategies;
  }

  /**
   * 创建resource-id策略
   */
  private static createResourceIdStrategy(context: ElementSelectionContext): StrategyCandidate {
    const resourceId = context.keyAttributes!['resource-id'];
    
    return {
      key: `fallback_resource_id_${resourceId}`,
      name: `Resource ID定位`,
      confidence: 0.95, // 高置信度
      description: `通过resource-id="${resourceId}"定位元素`,
      variant: 'self_anchor',
      enabled: true,
      isRecommended: false,
      metadata: {
        strategy_type: 'fallback',
        priority: FallbackPriority.RESOURCE_ID,
        selector: `[resource-id="${resourceId}"]`,
        stability_score: 0.9
      }
    };
  }

  /**
   * 创建文本内容策略
   */
  private static createTextContentStrategy(context: ElementSelectionContext): StrategyCandidate {
    const text = context.elementText!.trim();
    const shortText = text.length > 20 ? text.substring(0, 20) + '...' : text;
    
    return {
      key: `fallback_text_${this.hashText(text)}`,
      name: `文本内容定位`,
      confidence: 0.85,
      description: `通过文本"${shortText}"定位元素`,
      variant: 'self_anchor',
      enabled: true,
      isRecommended: false,
      metadata: {
        strategy_type: 'fallback',
        priority: FallbackPriority.TEXT_CONTENT,
        selector: `[text="${text}"]`,
        stability_score: 0.7
      }
    };
  }

  /**
   * 创建类名策略
   */
  private static createClassNameStrategy(context: ElementSelectionContext): StrategyCandidate {
    const className = context.keyAttributes!.class;
    
    return {
      key: `fallback_class_${this.hashText(className)}`,
      name: `类名定位`,
      confidence: 0.75,
      description: `通过class="${className}"定位元素`,
      variant: 'self_anchor',
      enabled: true,
      isRecommended: false,
      metadata: {
        strategy_type: 'fallback',
        priority: FallbackPriority.CLASS_NAME,
        selector: `[class="${className}"]`,
        stability_score: 0.6
      }
    };
  }

  /**
   * 创建绝对XPath策略
   */
  private static createAbsoluteXPathStrategy(context: ElementSelectionContext): StrategyCandidate {
    const xpath = this.generateAbsoluteXPath(context);
    
    return {
      key: `fallback_xpath_${this.hashText(xpath)}`,
      name: `绝对路径定位`,
      confidence: 0.65,
      description: `通过绝对XPath定位元素`,
      variant: 'index_fallback',
      enabled: true,
      isRecommended: false,
      metadata: {
        strategy_type: 'fallback',
        priority: FallbackPriority.XPATH_ABSOLUTE,
        selector: xpath,
        stability_score: 0.5
      }
    };
  }

  /**
   * 创建索引定位策略
   */
  private static createIndexBasedStrategy(context: ElementSelectionContext): StrategyCandidate {
    return {
      key: `fallback_index_${context.elementPath}`,
      name: `索引定位`,
      confidence: 0.55,
      description: `通过元素在同级中的索引定位`,
      variant: 'index_fallback',
      enabled: true,
      isRecommended: false,
      metadata: {
        strategy_type: 'fallback',
        priority: FallbackPriority.INDEX_BASED,
        selector: `${context.elementType}[${this.extractIndexFromPath(context.elementPath)}]`,
        stability_score: 0.4
      }
    };
  }

  /**
   * 创建坐标网格策略
   */
  private static createCoordinateGridStrategy(context: ElementSelectionContext): StrategyCandidate {
    // 简化处理：假设bounds是"x,y,width,height"格式
    const boundsStr = context.elementBounds!;
    const [x, y, width, height] = boundsStr.split(',').map(Number);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    return {
      key: `fallback_coords_${centerX}_${centerY}`,
      name: `坐标定位`,
      confidence: 0.35,
      description: `通过坐标(${Math.round(centerX)}, ${Math.round(centerY)})定位`,
      variant: 'region_scoped',
      enabled: true,
      isRecommended: false,
      metadata: {
        strategy_type: 'fallback',
        priority: FallbackPriority.COORDINATE_GRID,
        selector: `coordinate(${centerX}, ${centerY})`,
        stability_score: 0.2
      }
    };
  }

  /**
   * 生成绝对XPath
   */
  private static generateAbsoluteXPath(context: ElementSelectionContext): string {
    // 简化的XPath生成逻辑
    const pathSegments = context.elementPath.split('/').filter(Boolean);
    return '/' + pathSegments.map((segment) => {
      const match = segment.match(/(\w+)\[(\d+)\]/);
      return match ? `${match[1]}[${match[2]}]` : segment;
    }).join('/');
  }

  /**
   * 从元素路径中提取索引
   */
  private static extractIndexFromPath(path: string): number {
    const match = path.match(/\[(\d+)\]$/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * 文本哈希函数（简单实现）
   */
  private static hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }

  /**
   * 验证兜底策略是否有效
   * 
   * @param strategy 待验证的策略
   * @param context 元素上下文
   * @returns 是否有效
   */
  static validateFallbackStrategy(
    strategy: StrategyCandidate, 
    context: ElementSelectionContext
  ): boolean {
    // 基本有效性检查
    if (!strategy.key || !strategy.name || strategy.confidence <= 0) {
      return false;
    }

    // 策略特定验证
    switch (strategy.metadata?.priority) {
      case FallbackPriority.RESOURCE_ID:
        return Boolean(context.keyAttributes?.['resource-id']);
      
      case FallbackPriority.TEXT_CONTENT:
        return Boolean(context.elementText?.trim());
      
      case FallbackPriority.CLASS_NAME:
        return Boolean(context.keyAttributes?.class);
      
      case FallbackPriority.COORDINATE_GRID:
        return Boolean(context.elementBounds);
      
      default:
        return true; // 其他策略默认有效
    }
  }

  /**
   * 获取策略降级建议
   * 
   * @param failedStrategy 失败的策略
   * @param context 元素上下文
   * @returns 降级后的策略，如果没有则返回null
   */
  static suggestDowngrade(
    failedStrategy: StrategyCandidate,
    context: ElementSelectionContext
  ): StrategyCandidate | null {
    const allStrategies = this.generateAllFallbackStrategies(context);
    const currentPriority = failedStrategy.metadata?.priority as FallbackPriority;
    
    // 找到下一个可用的策略
    const nextStrategy = allStrategies.find(strategy => 
      (strategy.metadata?.priority as FallbackPriority) > currentPriority
    );
    
    return nextStrategy || null;
  }
}

/**
 * 扩展策略候选接口，添加metadata支持
 */
declare module '../types/intelligent-analysis-types' {
  interface StrategyCandidate {
    metadata?: {
      strategy_type?: 'fallback' | 'smart' | 'user';
      priority?: FallbackPriority;
      selector?: string;
      stability_score?: number;
      [key: string]: unknown;
    };
  }
}