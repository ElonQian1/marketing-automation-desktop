// src/modules/universal-ui/application/compat/LegacyManualAdapter.ts
// module: universal-ui | layer: application | role: adapter
// summary: 旧"Xpath直接"与新ManualStrategy的双向转换适配器

import type { 
  ManualStrategy, 
  ManualSelector,
  ManualStrategyType,
  StrategyConverter 
} from '../../domain/public/selector/StrategyContracts';

// TODO: 改为真实 import - 这里是旧手动策略的类型定义
interface LegacyManualData {
  strategy?: string;
  xpath?: string;
  css?: string;
  fields?: string[];
  values?: Record<string, string>;
  matchMode?: Record<string, 'equals' | 'contains' | 'regex'>;
  includes?: Record<string, string[]>;
  excludes?: Record<string, string[]>;
  name?: string;
  notes?: string;
}

/**
 * 旧手动策略适配器
 * 处理旧"Xpath直接"策略与新ManualStrategy格式的双向转换
 */
export class LegacyManualAdapter implements StrategyConverter {
  
  constructor() {
    console.log('🔧 LegacyManualAdapter 初始化');
  }

  /**
   * 将旧格式转换为新的ManualStrategy格式
   */
  fromLegacy(legacyData: LegacyManualData): ManualStrategy | null {
    try {
      console.log('🔄 转换旧手动策略格式:', legacyData);

      if (!legacyData || (!legacyData.xpath && !legacyData.css)) {
        console.warn('⚠️ 旧数据无效或缺少选择器');
        return null;
      }

      // 确定策略类型
      const strategyType = this.determineLegacyStrategyType(legacyData);
      
      // 构建新的选择器
      const selector = this.buildManualSelector(legacyData);
      
      return {
        kind: 'manual',
        name: legacyData.name || this.generateStrategyName(strategyType, legacyData),
        type: strategyType,
        selector,
        notes: legacyData.notes,
        createdAt: Date.now()
      };
    } catch (error) {
      console.error('❌ 转换旧手动策略失败:', error);
      return null;
    }
  }

  /**
   * 将新的ManualStrategy格式转换为旧格式
   */
  toLegacy(strategy: ManualStrategy): LegacyManualData {
    try {
      console.log('🔄 转换为旧手动策略格式:', strategy);

      const legacyData: LegacyManualData = {
        name: strategy.name,
        notes: strategy.notes,
        strategy: this.mapStrategyTypeToLegacy(strategy.type)
      };

      // 转换选择器
      if (strategy.selector.xpath) {
        legacyData.xpath = strategy.selector.xpath;
      }
      
      if (strategy.selector.css) {
        legacyData.css = strategy.selector.css;
      }

      // 转换属性匹配规则
      if (strategy.selector.attr && strategy.selector.attr.length > 0) {
        legacyData.fields = [];
        legacyData.values = {};
        legacyData.matchMode = {};

        strategy.selector.attr.forEach(attr => {
          legacyData.fields!.push(attr.key);
          legacyData.values![attr.key] = attr.value;
          legacyData.matchMode![attr.key] = attr.op === 'eq' ? 'equals' : 
                                             attr.op === 'contains' ? 'contains' : 'equals';
        });
      }

      // 转换位置信息
      if (strategy.selector.position?.nthChild) {
        // 旧格式中位置信息的处理方式
        // TODO: 根据实际旧格式调整
      }

      return legacyData;
    } catch (error) {
      console.error('❌ 转换为旧格式失败:', error);
      return {};
    }
  }

  /**
   * 确定旧策略的类型
   */
  private determineLegacyStrategyType(legacyData: LegacyManualData): ManualStrategyType {
    // 根据旧数据特征判断策略类型
    if (legacyData.strategy === 'xpath-direct' || (legacyData.xpath && !legacyData.css)) {
      return 'xpath-direct';
    }
    
    if (legacyData.strategy === 'strict' || this.hasMultipleConstraints(legacyData)) {
      return 'strict';
    }
    
    if (legacyData.strategy === 'relaxed' || this.hasLooseConstraints(legacyData)) {
      return 'relaxed';
    }
    
    return 'custom';
  }

  /**
   * 构建手动选择器
   */
  private buildManualSelector(legacyData: LegacyManualData): ManualSelector {
    const selector: ManualSelector = {};

    // CSS选择器
    if (legacyData.css) {
      selector.css = legacyData.css;
    }

    // XPath选择器
    if (legacyData.xpath) {
      selector.xpath = legacyData.xpath;
    }

    // 属性匹配规则
    if (legacyData.fields && legacyData.values) {
      selector.attr = legacyData.fields.map(field => ({
        key: field,
        op: this.getMatchOperation(field, legacyData.matchMode),
        value: legacyData.values![field] || ''
      }));
    }

    return selector;
  }

  /**
   * 获取匹配操作类型
   */
  private getMatchOperation(
    field: string, 
    matchMode?: Record<string, 'equals' | 'contains' | 'regex'>
  ): 'eq' | 'contains' | 'startsWith' {
    const mode = matchMode?.[field] || 'equals';
    
    switch (mode) {
      case 'contains':
        return 'contains';
      case 'regex':
        return 'contains'; // 简化处理，将regex映射为contains
      default:
        return 'eq';
    }
  }

  /**
   * 检查是否有多个约束条件（严格策略）
   */
  private hasMultipleConstraints(legacyData: LegacyManualData): boolean {
    let constraintCount = 0;
    
    if (legacyData.xpath) constraintCount++;
    if (legacyData.css) constraintCount++;
    if (legacyData.fields && legacyData.fields.length > 0) constraintCount++;
    if (legacyData.includes && Object.keys(legacyData.includes).length > 0) constraintCount++;
    
    return constraintCount >= 2;
  }

  /**
   * 检查是否有松散约束条件（宽松策略）
   */
  private hasLooseConstraints(legacyData: LegacyManualData): boolean {
    // 检查是否使用了模糊匹配
    if (legacyData.matchMode) {
      const modes = Object.values(legacyData.matchMode);
      return modes.includes('contains') || modes.includes('regex');
    }
    
    return false;
  }

  /**
   * 生成策略名称
   */
  private generateStrategyName(type: ManualStrategyType, legacyData: LegacyManualData): string {
    switch (type) {
      case 'xpath-direct':
        return `XPath直接匹配`;
      case 'strict':
        return `严格匹配策略`;
      case 'relaxed':
        return `宽松匹配策略`;
      default:
        return `自定义匹配策略`;
    }
  }

  /**
   * 将新策略类型映射为旧格式
   */
  private mapStrategyTypeToLegacy(type: ManualStrategyType): string {
    const mapping: Record<ManualStrategyType, string> = {
      'xpath-direct': 'xpath-direct',
      'strict': 'strict',
      'relaxed': 'relaxed',
      'custom': 'custom'
    };
    
    return mapping[type] || 'custom';
  }

  /**
   * 创建"XPath直接"策略的便捷方法
   */
  static createXPathDirectStrategy(xpath: string, name?: string): ManualStrategy {
    return {
      kind: 'manual',
      name: name || 'XPath直接匹配',
      type: 'xpath-direct',
      selector: {
        xpath
      },
      notes: '基于XPath的直接元素匹配',
      createdAt: Date.now()
    };
  }

  /**
   * 检查是否为XPath直接策略
   */
  static isXPathDirectStrategy(strategy: ManualStrategy): boolean {
    return strategy.type === 'xpath-direct' && !!strategy.selector.xpath;
  }

  /**
   * 从元素描述符快速创建XPath直接策略
   */
  static fromElementDescriptor(element: { xpath?: string; nodeId: string }): ManualStrategy | null {
    if (!element.xpath) {
      return null;
    }

    return this.createXPathDirectStrategy(
      element.xpath,
      `XPath直接 - ${element.nodeId}`
    );
  }
}