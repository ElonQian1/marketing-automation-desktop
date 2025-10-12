// src/modules/universal-ui/infrastructure/adapters/HeuristicProvider.ts
// module: universal-ui | layer: infrastructure | role: adapter
// summary: 启发式策略提供方，作为兜底方案确保总能生成策略

import type { 
  ElementDescriptor, 
  SmartStrategy,
  SmartMatchVariant 
} from '../../domain/public/selector/StrategyContracts';
import type { StrategyProvider } from '../../application/ports/StrategyProvider';

/**
 * 启发式策略提供方
 * 基于简单规则生成兜底策略，确保系统总能返回可用的策略
 */
export class HeuristicProvider implements StrategyProvider {
  readonly name = 'heuristic';
  readonly priority = 1; // 最低优先级，作为兜底

  /**
   * 启发式提供方始终可用
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * 生成启发式策略
   * 基于元素特征使用简单规则生成策略
   */
  async generate(input: { element: ElementDescriptor }): Promise<SmartStrategy | null> {
    const { element } = input;
    
    console.log('🎯 HeuristicProvider 开始生成兜底策略，元素:', element.nodeId);

    try {
      // 根据元素特征选择最合适的启发式策略
      const strategy = this.selectBestHeuristicStrategy(element);
      
      console.log('✅ 成功生成启发式策略:', strategy.selector.variant);
      return strategy;
    } catch (error) {
      console.error('❌ HeuristicProvider 生成策略失败:', error);
      
      // 即使出错也要返回基本的兜底策略
      return this.generateBasicFallback(element);
    }
  }

  /**
   * 选择最佳的启发式策略
   * 基于元素特征智能选择合适的策略类型
   */
  private selectBestHeuristicStrategy(element: ElementDescriptor): SmartStrategy {
    // 策略优先级判断规则
    
    // 1. 如果有明确的文本内容，使用自我锚点策略
    if (element.text && element.text.trim().length > 0 && element.text.length < 50) {
      return this.generateSelfAnchorStrategy(element);
    }

    // 2. 如果有资源ID，使用子锚点策略
    if (element.resourceId && element.resourceId.length > 0) {
      return this.generateChildAnchorStrategy(element);
    }

    // 3. 如果是可点击元素，使用父可点击策略
    if (element.clickable && element.tagName) {
      return this.generateParentClickableStrategy(element);
    }

    // 4. 如果有内容描述，使用区域限定策略
    if (element.contentDesc && element.contentDesc.length > 0) {
      return this.generateRegionScopedStrategy(element);
    }

    // 5. 如果有CSS路径，使用邻居相对策略
    if (element.cssPath && element.cssPath.length > 0) {
      return this.generateNeighborRelativeStrategy(element);
    }

    // 6. 最后兜底：使用索引策略
    return this.generateIndexFallbackStrategy(element);
  }

  /**
   * 生成自我锚点策略
   */
  private generateSelfAnchorStrategy(element: ElementDescriptor): SmartStrategy {
    const text = element.text!.trim();
    const css = `[text*="${text}"]`;
    const xpath = `//*[contains(text(), "${text}")]`;

    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css,
        xpath,
        score: 0.75,
        rationale: `基于文本内容 "${text}" 的自我锚点匹配`,
        variant: 'self-anchor',
        params: {
          variant: 'self-anchor',
          anchorText: text,
          similarity: 0.8
        }
      },
      confidence: 0.75,
      generatedAt: Date.now()
    };
  }

  /**
   * 生成子锚点策略
   */
  private generateChildAnchorStrategy(element: ElementDescriptor): SmartStrategy {
    const resourceId = element.resourceId!;
    const css = `#${resourceId.replace(/[:.]/g, '\\$&')}`;
    const xpath = `//*[@resource-id="${resourceId}"]`;

    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css,
        xpath,
        score: 0.78,
        rationale: `基于资源ID "${resourceId}" 的子锚点匹配`,
        variant: 'child-anchor',
        params: {
          variant: 'child-anchor',
          childText: resourceId,
          distance: 1
        }
      },
      confidence: 0.78,
      generatedAt: Date.now()
    };
  }

  /**
   * 生成父可点击策略
   */
  private generateParentClickableStrategy(element: ElementDescriptor): SmartStrategy {
    const tagName = element.tagName!.toLowerCase();
    const css = element.cssPath || tagName;
    const xpath = element.xpath || `//${tagName}`;

    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css,
        xpath,
        score: 0.72,
        rationale: `基于可点击 ${tagName} 元素的父节点匹配`,
        variant: 'parent-clickable',
        params: {
          variant: 'parent-clickable',
          role: tagName,
          clickableSelector: css
        }
      },
      confidence: 0.72,
      generatedAt: Date.now()
    };
  }

  /**
   * 生成区域限定策略
   */
  private generateRegionScopedStrategy(element: ElementDescriptor): SmartStrategy {
    const contentDesc = element.contentDesc!;
    const css = `[content-desc*="${contentDesc}"]`;
    const xpath = `//*[contains(@content-desc, "${contentDesc}")]`;

    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css,
        xpath,
        score: 0.68,
        rationale: `基于内容描述 "${contentDesc}" 的区域限定匹配`,
        variant: 'region-scoped',
        params: {
          variant: 'region-scoped',
          regionCss: css
        }
      },
      confidence: 0.68,
      generatedAt: Date.now()
    };
  }

  /**
   * 生成邻居相对策略
   */
  private generateNeighborRelativeStrategy(element: ElementDescriptor): SmartStrategy {
    const css = element.cssPath!;
    const xpath = element.xpath || css;

    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css,
        xpath,
        score: 0.65,
        rationale: '基于CSS路径的邻居相对匹配',
        variant: 'neighbor-relative',
        params: {
          variant: 'neighbor-relative',
          relation: 'right',
          distance: 1
        }
      },
      confidence: 0.65,
      generatedAt: Date.now()
    };
  }

  /**
   * 生成索引兜底策略
   */
  private generateIndexFallbackStrategy(element: ElementDescriptor): SmartStrategy {
    const tagName = element.tagName?.toLowerCase() || 'div';
    const nthChild = element.nthChild || 1;
    const css = `${tagName}:nth-child(${nthChild})`;
    const xpath = element.xpath || `//${tagName}[${nthChild}]`;

    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css,
        xpath,
        score: 0.6,
        rationale: `基于元素标签 ${tagName} 和位置索引 ${nthChild} 的兜底匹配`,
        variant: 'index-fallback',
        params: {
          variant: 'index-fallback',
          index: nthChild,
          of: tagName
        }
      },
      confidence: 0.6,
      generatedAt: Date.now()
    };
  }

  /**
   * 生成基本兜底策略（用于异常情况）
   */
  private generateBasicFallback(element: ElementDescriptor): SmartStrategy {
    console.log('🛡️ 生成基本兜底策略');
    
    return {
      kind: 'smart',
      provider: 'heuristic',
      version: '1.0.0',
      selector: {
        css: 'div',
        xpath: '//div',
        score: 0.3,
        rationale: '基本兜底策略：通用div选择器',
        variant: 'index-fallback',
        params: {
          variant: 'index-fallback',
          index: 1,
          of: 'div'
        }
      },
      confidence: 0.3,
      generatedAt: Date.now()
    };
  }
}