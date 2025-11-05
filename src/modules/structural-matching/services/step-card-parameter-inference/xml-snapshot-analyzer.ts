// src/modules/structural-matching/services/step-card-parameter-inference/xml-snapshot-analyzer.ts
// module: structural-matching | layer: services | role: XML快照分析器
// summary: 解析XML快照，构建UI元素树，支持XPath查询和结构分析

import { DOMParser } from '@xmldom/xmldom';
import type { 
  ParsedUIElement, 
  XmlAnalysisOptions, 
  ElementStructuralFeatures,
  ParameterInferenceOptions
} from './types';

/**
 * XML快照分析器
 * 负责解析XML内容，构建元素树，提供结构化查询能力
 */
export class XmlSnapshotAnalyzer {
  private xmlDoc: Document | null = null;
  private elementTree: ParsedUIElement[] = [];
  private elementMap: Map<string, ParsedUIElement> = new Map();

  /**
   * 解析XML快照内容
   */
  async parseXmlSnapshot(xmlContent: string, options: XmlAnalysisOptions = {}): Promise<ParsedUIElement[]> {
    try {
      console.log('📄 [XmlAnalyzer] 开始解析XML快照', {
        contentLength: xmlContent.length,
        options
      });

      // 解析XML文档
      const parser = new DOMParser();
      this.xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

      if (!this.xmlDoc) {
        throw new Error('XML解析失败');
      }

      // 构建元素树
      const rootNodes = Array.from(this.xmlDoc.childNodes).filter(node => node.nodeType === 1) as Element[];
      this.elementTree = [];
      this.elementMap.clear();

      for (const rootElement of rootNodes) {
        const parsedElement = this.parseElement(rootElement, null, 0, options);
        if (parsedElement) {
          this.elementTree.push(parsedElement);
        }
      }

      console.log('✅ [XmlAnalyzer] XML解析完成', {
        rootElements: this.elementTree.length,
        totalElements: this.elementMap.size
      });

      return this.elementTree;
    } catch (error) {
      console.error('❌ [XmlAnalyzer] XML解析失败:', error);
      throw new Error(`XML快照解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 通过XPath查找元素
   */
  findElementByXPath(xpath: string): ParsedUIElement | null {
    try {
      console.log('🔍 [XmlAnalyzer] 查找元素', { xpath });

      // 简化的XPath解析（支持常见格式）
      const element = this.findElementByXPathInternal(xpath, this.elementTree);
      
      if (element) {
        console.log('✅ [XmlAnalyzer] 找到目标元素', {
          tag: element.tag,
          text: element.text,
          bounds: element.bounds
        });
      } else {
        console.warn('⚠️ [XmlAnalyzer] 未找到目标元素', { xpath });
      }

      return element;
    } catch (error) {
      console.error('❌ [XmlAnalyzer] XPath查找失败:', error);
      return null;
    }
  }

  /**
   * 分析元素结构特征
   */
  analyzeElementStructure(
    targetElement: ParsedUIElement, 
    options: ParameterInferenceOptions
  ): ElementStructuralFeatures {
    console.log('🏗️ [XmlAnalyzer] 分析元素结构特征', {
      target: targetElement.tag,
      mode: options.mode
    });

    // 1. 查找容器元素
    const containerElement = this.findContainerElement(targetElement, options.containerStrategy);

    // 2. 构建祖先链
    const ancestorChain = this.buildAncestorChain(targetElement);

    // 3. 获取兄弟元素
    const siblings = targetElement.parent?.children || [];

    // 4. 生成结构签名
    const structuralSignature = this.generateStructuralSignature(targetElement);

    // 5. 计算几何特征
    const geometricFeatures = this.calculateGeometricFeatures(targetElement, containerElement);

    const features: ElementStructuralFeatures = {
      targetElement,
      containerElement,
      ancestorChain,
      siblings,
      structuralSignature,
      geometricFeatures
    };

    console.log('✅ [XmlAnalyzer] 结构特征分析完成', {
      hasContainer: !!containerElement,
      ancestorCount: ancestorChain.length,
      siblingCount: siblings.length,
      structureType: structuralSignature.repeatPattern
    });

    return features;
  }

  /**
   * 解析单个元素
   */
  private parseElement(
    element: Element, 
    parent: ParsedUIElement | null, 
    depth: number,
    options: XmlAnalysisOptions
  ): ParsedUIElement | null {
    const maxDepth = options.maxDepth || 50;
    if (depth > maxDepth) return null;

    // 提取属性
    const attributes: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i);
      if (attr) {
        attributes[attr.name] = attr.value;
      }
    }

    // 解析bounds
    const bounds = this.parseBounds(attributes.bounds || '[0,0][0,0]');

    // 检查可见性
    if (!options.includeInvisible && !this.isElementVisible(bounds, attributes)) {
      return null;
    }

    // 提取文本内容
    const text = attributes.text || '';

    // 创建解析后的元素
    const parsedElement: ParsedUIElement = {
      tag: element.tagName || element.nodeName,
      attributes,
      text,
      bounds,
      children: [],
      parent,
      index: parent ? parent.children.length : 0,
      xpath: '', // 稍后计算
      depth
    };

    // 递归解析子元素
    const childElements = Array.from(element.childNodes).filter(node => node.nodeType === 1) as Element[];
    for (const childElement of childElements) {
      const parsedChild = this.parseElement(childElement, parsedElement, depth + 1, options);
      if (parsedChild) {
        parsedElement.children.push(parsedChild);
      }
    }

    // 计算XPath（如果需要）
    if (options.calculateXPath !== false) {
      parsedElement.xpath = this.calculateElementXPath(parsedElement);
    }

    // 添加到映射表
    this.elementMap.set(parsedElement.xpath, parsedElement);

    return parsedElement;
  }

  /**
   * 解析bounds字符串
   */
  private parseBounds(boundsStr: string): { x: number; y: number; width: number; height: number } {
    try {
      // 格式：[x1,y1][x2,y2]
      const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (!match) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      const [, x1, y1, x2, y2] = match.map(Number);
      return {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1
      };
    } catch {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
  }

  /**
   * 检查元素是否可见
   */
  private isElementVisible(bounds: { width: number; height: number }, attributes: Record<string, string>): boolean {
    // 检查尺寸
    if (bounds.width <= 0 || bounds.height <= 0) return false;

    // 检查属性
    if (attributes.visible === 'false') return false;

    return true;
  }

  /**
   * 计算元素XPath
   */
  private calculateElementXPath(element: ParsedUIElement): string {
    const parts: string[] = [];
    let current: ParsedUIElement | null = element;

    while (current) {
      if (current.parent) {
        // 计算同类型兄弟中的索引
        const sameTagSiblings = current.parent.children.filter(child => child.tag === current!.tag);
        const index = sameTagSiblings.indexOf(current) + 1;
        
        if (sameTagSiblings.length > 1) {
          parts.unshift(`${current.tag}[${index}]`);
        } else {
          parts.unshift(current.tag);
        }
      } else {
        // 根元素
        parts.unshift(current.tag);
      }
      
      current = current.parent;
    }

    return '//' + parts.join('/');
  }

  /**
   * 内部XPath查找实现
   */
  private findElementByXPathInternal(xpath: string, elements: ParsedUIElement[]): ParsedUIElement | null {
    // 简化的XPath匹配（支持基本格式）
    for (const element of elements) {
      if (this.matchesXPath(element, xpath)) {
        return element;
      }
      
      // 递归查找子元素
      const found = this.findElementByXPathInternal(xpath, element.children);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * XPath匹配检查
   */
  private matchesXPath(element: ParsedUIElement, xpath: string): boolean {
    // 简单的匹配逻辑
    if (element.xpath === xpath) return true;
    
    // 尝试属性匹配
    if (xpath.includes('@')) {
      // 解析属性条件，如 //*[@text='Login']
      const attrMatch = xpath.match(/@(\w+)=['"]([^'"]*)['"]/);
      if (attrMatch) {
        const [, attrName, attrValue] = attrMatch;
        return element.attributes[attrName] === attrValue;
      }
    }
    
    return false;
  }

  /**
   * 查找容器元素
   */
  private findContainerElement(
    element: ParsedUIElement, 
    strategy: "auto" | "nearest_scrollable" | "semantic_parent"
  ): ParsedUIElement | null {
    let current = element.parent;
    
    while (current) {
      switch (strategy) {
        case "nearest_scrollable":
          if (current.attributes.scrollable === 'true') {
            return current;
          }
          break;
          
        case "semantic_parent":
          if (this.isSemanticContainer(current)) {
            return current;
          }
          break;
          
        case "auto":
        default:
          if (current.attributes.scrollable === 'true' || this.isSemanticContainer(current)) {
            return current;
          }
          break;
      }
      
      current = current.parent;
    }
    
    return null;
  }

  /**
   * 检查是否为语义容器
   */
  private isSemanticContainer(element: ParsedUIElement): boolean {
    const containerClasses = [
      'RecyclerView', 'ListView', 'ScrollView', 'ViewPager', 
      'FrameLayout', 'LinearLayout', 'RelativeLayout'
    ];
    
    return containerClasses.some(cls => element.tag.includes(cls));
  }

  /**
   * 构建祖先链
   */
  private buildAncestorChain(element: ParsedUIElement): ParsedUIElement[] {
    const ancestors: ParsedUIElement[] = [];
    let current = element.parent;
    
    while (current) {
      ancestors.unshift(current);
      current = current.parent;
    }
    
    return ancestors;
  }

  /**
   * 生成结构签名
   */
  private generateStructuralSignature(element: ParsedUIElement) {
    // 计算形状哈希
    const shapeHash = this.calculateShapeHash(element);
    
    // 分析子元素布局
    const childLayout = this.analyzeChildLayout(element);
    
    // 检测重复模式
    const repeatPattern = this.detectRepeatPattern(element);
    
    return {
      shapeHash,
      childLayout,
      repeatPattern
    };
  }

  /**
   * 计算形状哈希
   */
  private calculateShapeHash(element: ParsedUIElement): string {
    const signature = [
      element.tag,
      element.children.length,
      element.attributes.class || '',
      element.text ? 'hasText' : 'noText'
    ].join('|');
    
    return btoa(signature).substring(0, 8);
  }

  /**
   * 分析子元素布局
   */
  private analyzeChildLayout(element: ParsedUIElement): string {
    if (element.children.length === 0) return 'leaf';
    if (element.children.length === 1) return 'single';
    
    // 检查布局方向
    const childBounds = element.children.map(child => child.bounds);
    const isHorizontal = this.isHorizontalLayout(childBounds);
    const isVertical = this.isVerticalLayout(childBounds);
    
    if (isHorizontal) return 'horizontal';
    if (isVertical) return 'vertical';
    return 'mixed';
  }

  /**
   * 检测重复模式
   */
  private detectRepeatPattern(element: ParsedUIElement): "list-like" | "grid-like" | "single" {
    const parent = element.parent;
    if (!parent) return 'single';
    
    const siblings = parent.children;
    const sameClassSiblings = siblings.filter(sibling => 
      sibling.tag === element.tag && 
      JSON.stringify(sibling.attributes.class) === JSON.stringify(element.attributes.class)
    );
    
    if (sameClassSiblings.length >= 3) {
      // 检查是否为网格布局
      if (this.isGridPattern(sameClassSiblings)) {
        return 'grid-like';
      }
      return 'list-like';
    }
    
    return 'single';
  }

  /**
   * 检查是否为水平布局
   */
  private isHorizontalLayout(bounds: { x: number; y: number; width: number; height: number }[]): boolean {
    if (bounds.length < 2) return false;
    
    // 检查Y坐标是否基本一致
    const yPositions = bounds.map(b => b.y);
    const yVariance = Math.max(...yPositions) - Math.min(...yPositions);
    
    return yVariance < 20; // 允许20px的偏差
  }

  /**
   * 检查是否为垂直布局
   */
  private isVerticalLayout(bounds: { x: number; y: number; width: number; height: number }[]): boolean {
    if (bounds.length < 2) return false;
    
    // 检查X坐标是否基本一致
    const xPositions = bounds.map(b => b.x);
    const xVariance = Math.max(...xPositions) - Math.min(...xPositions);
    
    return xVariance < 20; // 允许20px的偏差
  }

  /**
   * 检查是否为网格模式
   */
  private isGridPattern(elements: ParsedUIElement[]): boolean {
    if (elements.length < 6) return false; // 至少2行3列
    
    // 简单的网格检测：检查是否有多行多列的规律排列
    const bounds = elements.map(el => el.bounds);
    const yPositions = [...new Set(bounds.map(b => Math.round(b.y / 10) * 10))]; // 量化Y坐标
    const xPositions = [...new Set(bounds.map(b => Math.round(b.x / 10) * 10))]; // 量化X坐标
    
    return yPositions.length >= 2 && xPositions.length >= 2;
  }

  /**
   * 计算几何特征
   */
  private calculateGeometricFeatures(
    element: ParsedUIElement, 
    container: ParsedUIElement | null
  ) {
    const absoluteBounds = element.bounds;
    
    let relativeBounds = absoluteBounds;
    let containerBounds = { x: 0, y: 0, width: 1080, height: 1920 }; // 默认屏幕尺寸
    
    if (container) {
      containerBounds = container.bounds;
      relativeBounds = {
        x: (absoluteBounds.x - containerBounds.x) / containerBounds.width,
        y: (absoluteBounds.y - containerBounds.y) / containerBounds.height,
        width: absoluteBounds.width / containerBounds.width,
        height: absoluteBounds.height / containerBounds.height
      };
    }
    
    return {
      absoluteBounds,
      relativeBounds,
      containerBounds
    };
  }
}