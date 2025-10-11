// src/modules/intelligent-strategy-system/shared/element-utils/XPathGenerator.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * XPathGenerator.ts
 * 统一的XPath生成工具
 * 
 * @description 统一项目中所有XPath生成逻辑，支持多种策略
 */

import { ElementLike } from './ElementValidator';
import { BoundsRect } from '../bounds/BoundsCalculator';

/**
 * XPath生成策略
 */
export type XPathStrategy = 
  | 'resource-id'           // 基于resource-id
  | 'text'                 // 基于文本
  | 'content-desc'         // 基于content-desc
  | 'class-index'          // 基于class和index
  | 'neighbor-relative'    // 基于相邻元素相对位置
  | 'container-scoped'     // 基于容器内定位
  | 'absolute-path';       // 绝对路径

/**
 * XPath生成配置
 */
export interface XPathGeneratorConfig {
  strategy: XPathStrategy;
  useIndex?: boolean;           // 是否使用索引
  containerXPath?: string;      // 容器XPath（用于scoped策略）
  neighborElement?: ElementLike; // 相邻元素（用于relative策略）
  direction?: 'following' | 'preceding' | 'parent' | 'child';
  multiLanguage?: string[];     // 多语言文本支持
}

/**
 * 统一的XPath生成器
 */
export class XPathGenerator {

  /**
   * 根据策略生成XPath
   */
  static generate(element: ElementLike, config: XPathGeneratorConfig): string {
    switch (config.strategy) {
      case 'resource-id':
        return this.generateByResourceId(element, config);
      
      case 'text':
        return this.generateByText(element, config);
      
      case 'content-desc':
        return this.generateByContentDesc(element, config);
      
      case 'class-index':
        return this.generateByClassIndex(element, config);
      
      case 'neighbor-relative':
        return this.generateByNeighborRelative(element, config);
      
      case 'container-scoped':
        return this.generateByContainerScoped(element, config);
      
      case 'absolute-path':
        return this.generateAbsoluteXPath(element);
      
      default:
        throw new Error(`Unsupported XPath strategy: ${config.strategy}`);
    }
  }

  /**
   * 基于resource-id生成XPath
   */
  private static generateByResourceId(element: ElementLike, config: XPathGeneratorConfig): string {
    const resourceId = element.attributes?.['resource-id'];
    if (!resourceId) {
      throw new Error('Element does not have resource-id');
    }
    
    const baseXPath = `//*[@resource-id='${resourceId}']`;
    
    if (config.useIndex) {
      return `(${baseXPath})[1]`;
    }
    
    return baseXPath;
  }

  /**
   * 基于文本生成XPath
   */
  private static generateByText(element: ElementLike, config: XPathGeneratorConfig): string {
    const text = element.text?.trim();
    if (!text) {
      throw new Error('Element does not have meaningful text');
    }
    
    // 支持多语言匹配
    if (config.multiLanguage && config.multiLanguage.length > 0) {
      const textConditions = config.multiLanguage
        .map(t => `normalize-space(@text)='${t}' or normalize-space(text())='${t}'`)
        .join(' or ');
      return `//*[${textConditions}]`;
    }
    
    const baseXPath = `//*[normalize-space(@text)='${text}' or normalize-space(text())='${text}']`;
    
    if (config.useIndex) {
      return `(${baseXPath})[1]`;
    }
    
    return baseXPath;
  }

  /**
   * 基于content-desc生成XPath
   */
  private static generateByContentDesc(element: ElementLike, config: XPathGeneratorConfig): string {
    const contentDesc = element.attributes?.['content-desc'];
    if (!contentDesc) {
      throw new Error('Element does not have content-desc');
    }
    
    const baseXPath = `//*[@content-desc='${contentDesc}']`;
    
    if (config.useIndex) {
      return `(${baseXPath})[1]`;
    }
    
    return baseXPath;
  }

  /**
   * 基于class和index生成XPath
   */
  private static generateByClassIndex(element: ElementLike, config: XPathGeneratorConfig): string {
    const className = element.tag || element.attributes?.['class'];
    if (!className) {
      throw new Error('Element does not have class information');
    }
    
    // 提取索引（如果有）
    const indexMatch = element.xpath?.match(/\[(\d+)\]$/);
    const index = indexMatch ? indexMatch[1] : '1';
    
    return `//${className}[${index}]`;
  }

  /**
   * 基于相邻元素的相对定位生成XPath
   */
  private static generateByNeighborRelative(element: ElementLike, config: XPathGeneratorConfig): string {
    if (!config.neighborElement) {
      throw new Error('Neighbor element is required for relative positioning');
    }
    
    const neighborResourceId = config.neighborElement.attributes?.['resource-id'];
    const neighborText = config.neighborElement.text?.trim();
    
    let neighborXPath = '';
    if (neighborResourceId) {
      neighborXPath = `//*[@resource-id='${neighborResourceId}']`;
    } else if (neighborText) {
      neighborXPath = `//*[normalize-space(@text)='${neighborText}']`;
    } else {
      throw new Error('Neighbor element must have resource-id or meaningful text');
    }
    
    const direction = config.direction || 'following';
    const targetClass = element.tag || '*';
    
    switch (direction) {
      case 'following':
        return `${neighborXPath}/following::${targetClass}[1]`;
      case 'preceding':
        return `${neighborXPath}/preceding::${targetClass}[1]`;
      case 'parent':
        return `${neighborXPath}/parent::*[1]`;
      case 'child':
        return `${neighborXPath}/child::${targetClass}[1]`;
      default:
        return `${neighborXPath}/following-sibling::${targetClass}[1]`;
    }
  }

  /**
   * 基于容器限定生成XPath
   */
  private static generateByContainerScoped(element: ElementLike, config: XPathGeneratorConfig): string {
    if (!config.containerXPath) {
      throw new Error('Container XPath is required for scoped positioning');
    }
    
    const elementResourceId = element.attributes?.['resource-id'];
    const elementText = element.text?.trim();
    const elementClass = element.tag || '*';
    
    let elementSelector = '';
    if (elementResourceId) {
      elementSelector = `*[@resource-id='${elementResourceId}']`;
    } else if (elementText) {
      elementSelector = `*[normalize-space(@text)='${elementText}']`;
    } else {
      elementSelector = elementClass;
    }
    
    if (config.useIndex) {
      return `(${config.containerXPath}//${elementSelector})[1]`;
    }
    
    return `${config.containerXPath}//${elementSelector}`;
  }

  /**
   * 生成绝对XPath路径
   */
  private static generateAbsoluteXPath(element: ElementLike): string {
    if (element.xpath) {
      return element.xpath;
    }
    
    throw new Error('Element does not have absolute XPath information');
  }

  /**
   * 生成多种策略的候选XPath列表
   */
  static generateCandidates(element: ElementLike): Array<{ strategy: XPathStrategy; xpath: string; score: number }> {
    const candidates: Array<{ strategy: XPathStrategy; xpath: string; score: number }> = [];
    
    // Resource ID 策略
    if (element.attributes?.['resource-id']) {
      try {
        const xpath = this.generate(element, { strategy: 'resource-id' });
        candidates.push({ strategy: 'resource-id', xpath, score: 90 });
        
        // 带索引的版本
        const xpathWithIndex = this.generate(element, { strategy: 'resource-id', useIndex: true });
        candidates.push({ strategy: 'resource-id', xpath: xpathWithIndex, score: 85 });
      } catch (error) {
        // 忽略错误，继续尝试其他策略
      }
    }
    
    // Content-desc 策略
    if (element.attributes?.['content-desc']) {
      try {
        const xpath = this.generate(element, { strategy: 'content-desc' });
        candidates.push({ strategy: 'content-desc', xpath, score: 80 });
      } catch (error) {
        // 忽略错误
      }
    }
    
    // 文本策略
    if (element.text?.trim()) {
      try {
        const xpath = this.generate(element, { strategy: 'text' });
        candidates.push({ strategy: 'text', xpath, score: 75 });
      } catch (error) {
        // 忽略错误
      }
    }
    
    // Class+Index 策略
    if (element.tag) {
      try {
        const xpath = this.generate(element, { strategy: 'class-index' });
        candidates.push({ strategy: 'class-index', xpath, score: 60 });
      } catch (error) {
        // 忽略错误
      }
    }
    
    // 绝对路径策略（兜底）
    if (element.xpath) {
      candidates.push({ strategy: 'absolute-path', xpath: element.xpath, score: 40 });
    }
    
    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * 验证XPath格式是否正确
   */
  static isValidXPath(xpath: string): boolean {
    if (!xpath || typeof xpath !== 'string') {
      return false;
    }
    
    // 基本格式检查
    if (!xpath.startsWith('/') && !xpath.startsWith('(')) {
      return false;
    }
    
    // 检查是否包含基本的XPath元素
    const hasValidElements = /\/\/?\w+|\[@\w+|text\(\)|normalize-space/.test(xpath);
    
    return hasValidElements;
  }
}