// src/modules/universal-ui/infrastructure/adapters/LegacySmartProvider.ts
// module: universal-ui | layer: infrastructure | role: adapter
// summary: 旧智能策略提供方适配器，将旧实现转换为统一格式

import type { 
  ElementDescriptor, 
  SmartStrategy, 
  SmartMatchVariant,
  SmartVariantParams 
} from '../../domain/public/selector/StrategyContracts';
import type { StrategyProvider } from '../../application/ports/StrategyProvider';

// TODO: 改为真实 import - 这里是旧智能策略系统的类型定义
interface LegacySmartResult {
  strategy: string;
  css?: string;
  xpath?: string;
  confidence?: number;
  metadata?: any;
  reasoning?: string;
}

/**
 * 旧智能策略提供方适配器
 * 将现有的 intelligent-strategy-system 模块的输出转换为统一的 SmartStrategy 格式
 */
export class LegacySmartProvider implements StrategyProvider {
  readonly name = 'legacy-smart';
  readonly priority = 100; // 最高优先级

  constructor() {
    console.log('🔧 LegacySmartProvider 初始化');
  }

  /**
   * 检查旧智能策略系统是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      // TODO: 改为真实的可用性检查
      // 这里应该检查 intelligent-strategy-system 模块是否正常工作
      return true;
    } catch (error) {
      console.warn('🚫 LegacySmartProvider 不可用:', error);
      return false;
    }
  }

  /**
   * 生成智能策略
   */
  async generate(input: { element: ElementDescriptor }): Promise<SmartStrategy | null> {
    const { element } = input;
    
    try {
      console.log('🧠 LegacySmartProvider 开始生成策略，元素:', element.nodeId);

      // TODO: 调用真实的旧智能策略生成逻辑
      // 这里应该调用现有的 intelligent-strategy-system 模块
      const legacyResult = await this.callLegacySmartSystem(element);
      
      if (!legacyResult) {
        console.log('❌ 旧智能系统未返回结果');
        return null;
      }

      // 将旧格式转换为新的统一格式
      const strategy = this.convertLegacyToUnified(legacyResult);
      
      if (strategy) {
        console.log('✅ 成功转换旧智能策略:', strategy.selector.variant);
      }
      
      return strategy;
    } catch (error) {
      console.error('❌ LegacySmartProvider 生成策略失败:', error);
      return null;
    }
  }

  /**
   * 调用旧智能策略系统
   * TODO: 替换为真实的调用逻辑
   */
  private async callLegacySmartSystem(element: ElementDescriptor): Promise<LegacySmartResult | null> {
    // TODO: 这里应该调用现有的 intelligent-strategy-system 模块
    // 例如：
    // import { StrategyDecisionEngine } from '../../../intelligent-strategy-system/core/StrategyDecisionEngine';
    // const engine = new StrategyDecisionEngine();
    // return await engine.generateStrategy(element);

    // 暂时返回模拟数据，确保今日功能闭环
    console.log('🔄 模拟调用旧智能系统...');
    
    // 根据元素特征模拟返回不同的策略类型
    if (element.text && element.text.length > 0) {
      return {
        strategy: 'self-anchor',
        css: `[text*="${element.text}"]`,
        xpath: `//*[contains(text(), "${element.text}")]`,
        confidence: 0.85,
        reasoning: `基于文本 "${element.text}" 的自我锚点匹配`
      };
    } else if (element.resourceId) {
      return {
        strategy: 'child-anchor',
        css: `#${element.resourceId}`,
        xpath: `//*[@resource-id="${element.resourceId}"]`,
        confidence: 0.78,
        reasoning: `基于资源ID "${element.resourceId}" 的子锚点匹配`
      };
    } else if (element.clickable) {
      return {
        strategy: 'parent-clickable',
        css: element.cssPath || 'button',
        xpath: element.xpath || '//button',
        confidence: 0.72,
        reasoning: '基于可点击性的父节点匹配'
      };
    } else {
      return {
        strategy: 'index-fallback',
        css: `${element.tagName || 'div'}:nth-child(${element.nthChild || 1})`,
        xpath: element.xpath || `//${element.tagName || 'div'}[${element.nthChild || 1}]`,
        confidence: 0.65,
        reasoning: '基于位置索引的兜底匹配'
      };
    }
  }

  /**
   * 将旧格式转换为统一的 SmartStrategy 格式
   */
  private convertLegacyToUnified(legacy: LegacySmartResult): SmartStrategy | null {
    try {
      // 映射旧策略名称到新的变体类型
      const variant = this.mapLegacyStrategyToVariant(legacy.strategy);
      if (!variant) {
        console.warn('⚠️ 无法映射旧策略类型:', legacy.strategy);
        return null;
      }

      // 生成变体参数
      const params = this.generateVariantParams(variant, legacy);

      return {
        kind: 'smart',
        provider: 'legacy-smart',
        version: '1.0.0',
        selector: {
          css: legacy.css,
          xpath: legacy.xpath,
          score: legacy.confidence || 0.5,
          rationale: legacy.reasoning || '旧智能系统生成',
          variant,
          params
        },
        confidence: legacy.confidence || 0.5,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('❌ 转换旧策略格式失败:', error);
      return null;
    }
  }

  /**
   * 映射旧策略名称到新的变体类型
   */
  private mapLegacyStrategyToVariant(legacyStrategy: string): SmartMatchVariant | null {
    const mapping: Record<string, SmartMatchVariant> = {
      'self-anchor': 'self-anchor',
      'child-anchor': 'child-anchor',
      'parent-clickable': 'parent-clickable',
      'region-scoped': 'region-scoped',
      'neighbor-relative': 'neighbor-relative',
      'index-fallback': 'index-fallback',
      
      // 兼容其他可能的旧名称
      'absolute': 'index-fallback',
      'strict': 'self-anchor',
      'relaxed': 'child-anchor',
      'positionless': 'region-scoped',
      'standard': 'self-anchor'
    };

    return mapping[legacyStrategy] || null;
  }

  /**
   * 根据变体类型和旧数据生成参数
   */
  private generateVariantParams(
    variant: SmartMatchVariant, 
    legacy: LegacySmartResult
  ): SmartVariantParams {
    switch (variant) {
      case 'self-anchor':
        return {
          variant: 'self-anchor',
          similarity: legacy.confidence || 0.8
        };
      
      case 'child-anchor':
        return {
          variant: 'child-anchor',
          distance: 1
        };
      
      case 'parent-clickable':
        return {
          variant: 'parent-clickable',
          role: 'button'
        };
      
      case 'region-scoped':
        return {
          variant: 'region-scoped',
          regionCss: legacy.css
        };
      
      case 'neighbor-relative':
        return {
          variant: 'neighbor-relative',
          relation: 'right',
          distance: 1
        };
      
      case 'index-fallback':
        return {
          variant: 'index-fallback',
          index: 1,
          of: 'element'
        };
      
      default:
        return {
          variant: 'index-fallback',
          index: 1
        };
    }
  }
}