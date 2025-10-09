/**
 * ElementContextAnalyzer.ts
 * 元素上下文分析器
 * 
 * @description 负责分析元素的完整上下文信息，包括层级关系、属性特征等
 */

import type { 
  ElementAnalysisContext,
  ElementNode,
  NodeHierarchyInfo,
  DocumentStructure,
  AnalysisOptions,
  ElementAnalysisResult,
  AnchorPoint,
  DeviceInfo,
  AppInfo
} from '../types/AnalysisTypes';

/**
 * 元素上下文分析器
 * 
 * 职责：
 * 1. 分析元素的层级关系
 * 2. 提取元素特征和属性
 * 3. 构建完整的分析上下文
 */
export class ElementContextAnalyzer {
  private cache: Map<string, ElementAnalysisContext> = new Map();

  /**
   * 分析元素并构建分析上下文
   * @param element 目标元素
   * @param xmlContent XML内容
   * @param options 分析选项
   * @returns 元素分析上下文
   */
  async analyzeElement(
    element: any,
    xmlContent: string,
    options: AnalysisOptions
  ): Promise<ElementAnalysisContext> {
    const startTime = Date.now();
    
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(element, xmlContent);
      if (options.enableCaching && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        if (Date.now() - cached.cache!.createdAt < cached.cache!.ttl) {
          return cached;
        }
      }

      // 1. 解析XML并构建文档结构
      const document = await this.parseXmlDocument(xmlContent);
      
      // 2. 定位目标元素节点
      const targetElement = this.locateTargetElement(element, document);
      
      // 3. 分析层级关系
      const hierarchy = this.analyzeHierarchy(targetElement, document);
      
      // 4. 构建分析上下文
      const context: ElementAnalysisContext = {
        targetElement,
        hierarchy,
        document,
        options,
        cache: options.enableCaching ? {
          createdAt: Date.now(),
          ttl: 60000 // 1分钟缓存
        } : undefined
      };

      // 5. 缓存结果
      if (options.enableCaching) {
        this.cache.set(cacheKey, context);
      }

      console.log(`元素上下文分析完成，耗时: ${Date.now() - startTime}ms`);
      return context;

    } catch (error) {
      console.error('元素上下文分析失败:', error);
      throw new Error(`上下文分析失败: ${error}`);
    }
  }

  /**
   * 解析XML文档并构建文档结构
   */
  private async parseXmlDocument(xmlContent: string): Promise<DocumentStructure> {
    try {
      // 这里使用简化的XML解析逻辑
      // 在实际项目中，应该使用专门的XML解析库
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'text/xml');
      
      if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('XML解析失败');
      }

      // 构建节点列表
      const allNodes = this.extractAllNodes(doc);
      const clickableNodes = allNodes.filter(node => node.clickable);
      const textNodes = allNodes.filter(node => node.text && node.text.trim().length > 0);
      const idNodes = allNodes.filter(node => node.attributes['resource-id']);

      // 统计信息
      const statistics = this.calculateStatistics(allNodes);
      
      // 应用信息
      const appInfo = this.extractAppInfo(xmlContent);

      return {
        root: allNodes[0] || this.createEmptyNode(),
        allNodes,
        clickableNodes,
        textNodes,
        idNodes,
        statistics,
        appInfo
      };

    } catch (error) {
      console.error('XML文档解析失败:', error);
      throw error;
    }
  }

  /**
   * 从DOM中提取所有节点
   */
  private extractAllNodes(doc: Document): ElementNode[] {
    const nodes: ElementNode[] = [];
    
    const traverse = (element: Element, index: number = 0): ElementNode => {
      const bounds = this.parseBounds(element.getAttribute('bounds') || '');
      
      const node: ElementNode = {
        tag: element.tagName,
        attributes: this.extractAttributes(element),
        text: element.getAttribute('text') || '',
        bounds,
        xpath: this.generateXPath(element),
        index,
        clickable: element.getAttribute('clickable') === 'true',
        visible: bounds ? bounds.width > 0 && bounds.height > 0 : false,
        focusable: element.getAttribute('focusable') === 'true',
        uiState: {
          enabled: element.getAttribute('enabled') !== 'false',
          selected: element.getAttribute('selected') === 'true',
          checked: element.getAttribute('checked') === 'true',
          password: element.getAttribute('password') === 'true'
        }
      };

      nodes.push(node);
      
      // 递归处理子元素
      Array.from(element.children).forEach((child, childIndex) => {
        traverse(child as Element, childIndex);
      });

      return node;
    };

    if (doc.documentElement) {
      traverse(doc.documentElement);
    }

    return nodes;
  }

  /**
   * 定位目标元素
   */
  private locateTargetElement(element: any, document: DocumentStructure): ElementNode {
    // 尝试通过多种方式定位元素
    
    // 1. 通过XPath定位
    if (element.xpath) {
      const found = document.allNodes.find(node => node.xpath === element.xpath);
      if (found) return found;
    }

    // 2. 通过resource-id定位
    if (element.resource_id || element['resource-id']) {
      const resourceId = element.resource_id || element['resource-id'];
      const found = document.allNodes.find(node => 
        node.attributes['resource-id'] === resourceId
      );
      if (found) return found;
    }

    // 3. 通过文本定位
    if (element.text) {
      const found = document.allNodes.find(node => node.text === element.text);
      if (found) return found;
    }

    // 4. 通过bounds定位
    if (element.bounds) {
      const targetBounds = typeof element.bounds === 'string' 
        ? this.parseBounds(element.bounds)
        : element.bounds;
        
      if (targetBounds) {
        const found = document.allNodes.find(node => 
          node.bounds && this.boundsEqual(node.bounds, targetBounds)
        );
        if (found) return found;
      }
    }

    // 5. 如果都没找到，返回第一个节点或创建空节点
    console.warn('未能精确定位目标元素，使用第一个节点');
    return document.allNodes[0] || this.createEmptyNode();
  }

  /**
   * 分析层级关系
   */
  private analyzeHierarchy(
    targetElement: ElementNode, 
    document: DocumentStructure
  ): NodeHierarchyInfo {
    
    // 查找父节点和祖先链
    const ancestors = this.findAncestors(targetElement, document);
    const parent = ancestors[0];
    
    // 查找子节点和后代节点
    const children = this.findChildren(targetElement, document);
    const descendants = this.findDescendants(targetElement, document);
    
    // 查找兄弟节点
    const siblings = this.findSiblings(targetElement, document);
    const siblingIndex = siblings.indexOf(targetElement);
    
    // 计算深度
    const depth = ancestors.length;
    
    // 查找最近的可点击父节点
    const nearestClickableParent = ancestors.find(node => node.clickable);
    
    // 查找稳定容器祖先
    const stableContainerAncestor = this.findStableContainer(ancestors);

    return {
      parent,
      ancestors,
      children,
      descendants,
      siblings,
      siblingIndex,
      depth,
      nearestClickableParent,
      stableContainerAncestor
    };
  }

  // === 辅助方法 ===

  private generateCacheKey(element: any, xmlContent: string): string {
    const elementKey = element.xpath || element.resource_id || element.text || 'unknown';
    const contentHash = this.simpleHash(xmlContent);
    return `${elementKey}_${contentHash}`;
  }

  private parseBounds(boundsStr: string): any {
    if (!boundsStr || boundsStr.trim() === '') return null;
    
    try {
      // 解析格式如 "[0,0][100,50]"
      const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (match) {
        const left = parseInt(match[1]);
        const top = parseInt(match[2]);
        const right = parseInt(match[3]);
        const bottom = parseInt(match[4]);
        
        return {
          left,
          top,
          right,
          bottom,
          width: right - left,
          height: bottom - top,
          centerX: (left + right) / 2,
          centerY: (top + bottom) / 2
        };
      }
    } catch (error) {
      console.warn('bounds解析失败:', boundsStr, error);
    }
    
    return null;
  }

  private extractAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    
    return attrs;
  }

  private generateXPath(element: Element): string {
    const parts: string[] = [];
    let current: Element | null = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let part = current.tagName.toLowerCase();
      
      // 添加索引
      const siblings = Array.from(current.parentElement?.children || [])
        .filter(e => e.tagName === current!.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `[${index}]`;
      }
      
      parts.unshift(part);
      current = current.parentElement;
    }
    
    return '/' + parts.join('/');
  }

  private calculateStatistics(nodes: ElementNode[]): any {
    const duplicateIds: Record<string, number> = {};
    const duplicateTexts: Record<string, number> = {};
    let maxDepth = 0;
    let totalDepth = 0;

    nodes.forEach(node => {
      // 统计重复ID
      const resourceId = node.attributes['resource-id'];
      if (resourceId) {
        duplicateIds[resourceId] = (duplicateIds[resourceId] || 0) + 1;
      }

      // 统计重复文本
      if (node.text && node.text.trim()) {
        duplicateTexts[node.text] = (duplicateTexts[node.text] || 0) + 1;
      }

      // 计算深度
      const depth = node.xpath.split('/').length - 1;
      maxDepth = Math.max(maxDepth, depth);
      totalDepth += depth;
    });

    return {
      totalNodes: nodes.length,
      clickableNodesCount: nodes.filter(n => n.clickable).length,
      textNodesCount: nodes.filter(n => n.text && n.text.trim()).length,
      idNodesCount: nodes.filter(n => n.attributes['resource-id']).length,
      maxDepth,
      averageDepth: nodes.length > 0 ? totalDepth / nodes.length : 0,
      duplicateIds: Object.fromEntries(
        Object.entries(duplicateIds).filter(([_, count]) => count > 1)
      ),
      duplicateTexts: Object.fromEntries(
        Object.entries(duplicateTexts).filter(([_, count]) => count > 1)
      )
    };
  }

  private extractAppInfo(xmlContent: string): AppInfo {
    // 从XML中提取应用信息
    const packageMatch = xmlContent.match(/package="([^"]+)"/);
    const activityMatch = xmlContent.match(/class="([^"]+)"/);
    
    return {
      packageName: packageMatch ? packageMatch[1] : 'unknown',
      activityName: activityMatch ? activityMatch[1] : 'unknown',
      deviceInfo: {
        deviceId: 'unknown',
        screenSize: { width: 1080, height: 1920 },
        density: 2.0
      }
    };
  }

  private findAncestors(target: ElementNode, document: DocumentStructure): ElementNode[] {
    // 简化实现：通过XPath层级查找祖先
    const ancestors: ElementNode[] = [];
    const targetPathParts = target.xpath.split('/').filter(p => p);
    
    for (let i = targetPathParts.length - 1; i > 0; i--) {
      const ancestorPath = '/' + targetPathParts.slice(0, i).join('/');
      const ancestor = document.allNodes.find(node => node.xpath === ancestorPath);
      if (ancestor) {
        ancestors.push(ancestor);
      }
    }
    
    return ancestors;
  }

  private findChildren(target: ElementNode, document: DocumentStructure): ElementNode[] {
    const targetPath = target.xpath;
    return document.allNodes.filter(node => {
      const nodePath = node.xpath;
      return nodePath.startsWith(targetPath + '/') && 
             nodePath.split('/').length === targetPath.split('/').length + 1;
    });
  }

  private findDescendants(target: ElementNode, document: DocumentStructure): ElementNode[] {
    const targetPath = target.xpath;
    return document.allNodes.filter(node => 
      node.xpath.startsWith(targetPath + '/') && node.xpath !== targetPath
    );
  }

  private findSiblings(target: ElementNode, document: DocumentStructure): ElementNode[] {
    const targetPathParts = target.xpath.split('/');
    const parentPath = targetPathParts.slice(0, -1).join('/');
    
    return document.allNodes.filter(node => {
      const nodePathParts = node.xpath.split('/');
      const nodeParentPath = nodePathParts.slice(0, -1).join('/');
      return nodeParentPath === parentPath && 
             nodePathParts.length === targetPathParts.length;
    });
  }

  private findStableContainer(ancestors: ElementNode[]): ElementNode | undefined {
    // 查找有稳定ID或语义的容器
    return ancestors.find(node => {
      const resourceId = node.attributes['resource-id'];
      if (resourceId && (
        resourceId.includes('navigation') ||
        resourceId.includes('toolbar') ||
        resourceId.includes('header') ||
        resourceId.includes('container')
      )) {
        return true;
      }
      return false;
    });
  }

  private boundsEqual(bounds1: any, bounds2: any): boolean {
    if (!bounds1 || !bounds2) return false;
    return bounds1.left === bounds2.left &&
           bounds1.top === bounds2.top &&
           bounds1.right === bounds2.right &&
           bounds1.bottom === bounds2.bottom;
  }

  private createEmptyNode(): ElementNode {
    return {
      tag: 'unknown',
      attributes: {},
      text: '',
      bounds: null,
      xpath: '/unknown',
      index: 0,
      clickable: false,
      visible: false,
      focusable: false,
      uiState: {
        enabled: false,
        selected: false
      }
    };
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // === 公共API ===

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}