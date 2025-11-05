// src/modules/structural-matching/anchors/structural-matching-ancestor-analyzer.ts
// module: structural-matching | layer: anchors | role: 祖先链分析器
// summary: 生成从容器到目标的完整祖先链，提供层级导航路径

import { AncestorChain, ElementInfo, XmlContext, AnchorPoint, AncestorNode, RelationshipType } from '../core/structural-matching-types';

/**
 * 🧬 祖先链分析器
 * 
 * 职责：
 * 1. 构建从容器到目标元素的祖先链
 * 2. 识别关键中间节点
 * 3. 生成层级跳跃策略
 * 4. 提供路径容错机制
 */
export class AncestorAnalyzer {
  
  /**
   * 🔍 分析祖先链
   */
  static analyze(
    targetElement: ElementInfo, 
    containerElement: ElementInfo, 
    xmlContext: XmlContext
  ): AncestorChain {
    console.log('🧬 [AncestorAnalyzer] 开始分析祖先链');
    
    // 1️⃣ 构建完整路径
    const fullPath = this.buildFullPath(targetElement, containerElement);
    
    // 2️⃣ 识别关键节点
    const keyNodes = this.identifyKeyNodes(fullPath, xmlContext);
    
    // 3️⃣ 生成锚点
    const anchorPoints = this.generateAnchorPoints(keyNodes, xmlContext);
    
    // 4️⃣ 分析跳跃策略
    const jumpStrategy = this.analyzeJumpStrategy(fullPath, keyNodes);
    
    const ancestorChain: AncestorChain = {
      depth: fullPath.length - 1,
      anchorPoints,
      jumpStrategy,
      fallbackDepth: Math.max(2, Math.floor(fullPath.length / 2)) // 兜底深度
    };
    
    console.log('✅ [AncestorAnalyzer] 祖先链分析完成:', {
      depth: ancestorChain.depth,
      anchorCount: ancestorChain.anchorPoints.length,
      jumpStrategy: ancestorChain.jumpStrategy,
      fallbackDepth: ancestorChain.fallbackDepth
    });
    
    return ancestorChain;
  }
  
  /**
   * 🛤️ 构建完整路径
   */
  private static buildFullPath(target: ElementInfo, container: ElementInfo): ElementInfo[] {
    const path: ElementInfo[] = [];
    let current: ElementInfo | null = target;
    
    // 从目标向上遍历到容器
    while (current && current.id !== container.id) {
      path.push(current);
      current = current.parent;
    }
    
    // 添加容器本身
    if (current && current.id === container.id) {
      path.push(current);
    }
    
    // 反转路径（从容器到目标）
    return path.reverse();
  }
  
  /**
   * 🎯 识别关键节点
   */
  private static identifyKeyNodes(fullPath: ElementInfo[], xmlContext: XmlContext): AncestorNode[] {
    const keyNodes: AncestorNode[] = [];
    
    fullPath.forEach((element, index) => {
      const significance = this.calculateSignificance(element, index, fullPath, xmlContext);
      
      if (significance > 0) {
        keyNodes.push({
          element,
          pathIndex: index,
          significance,
          nodeType: this.determineNodeType(element, index, fullPath)
        });
      }
    });
    
    // 按重要性排序
    keyNodes.sort((a, b) => b.significance - a.significance);
    
    console.log('🎯 [AncestorAnalyzer] 关键节点识别结果:', keyNodes.map(node => ({
      index: node.pathIndex,
      id: node.element.id,
      className: node.element.className,
      nodeType: node.nodeType,
      significance: node.significance
    })));
    
    return keyNodes;
  }
  
  /**
   * 📊 计算节点重要性
   */
  private static calculateSignificance(
    element: ElementInfo, 
    index: number, 
    fullPath: ElementInfo[], 
    xmlContext: XmlContext
  ): number {
    let significance = 0;
    
    // 基础分：位置重要性
    if (index === 0) significance += 30; // 容器节点
    if (index === fullPath.length - 1) significance += 50; // 目标节点
    
    // 类型重要性
    const className = element.className.toLowerCase();
    if (className.includes('recyclerview') || className.includes('listview')) {
      significance += 25; // 列表容器
    } else if (className.includes('viewgroup') || className.includes('layout')) {
      significance += 15; // 布局容器
    } else if (className.includes('cardview') || className.includes('card')) {
      significance += 20; // 卡片容器
    }
    
    // 属性重要性
    if (element.scrollable) significance += 15;
    if (element.clickable) significance += 10;
    if (element.resourceId && element.resourceId !== '') significance += 20;
    if (element.contentDesc && element.contentDesc !== '') significance += 15;
    
    // 文本重要性
    if (element.text && element.text.trim() !== '') {
      significance += 10;
      // 特殊文本模式
      if (this.isImportantText(element.text)) significance += 10;
    }
    
    // 唯一性重要性
    const uniqueness = this.calculateUniqueness(element, xmlContext);
    significance += uniqueness * 10;
    
    // 结构重要性（是否有很多子元素）
    const childCount = this.countDirectChildren(element, xmlContext);
    if (childCount > 3 && childCount < 10) significance += 10;
    else if (childCount >= 10) significance += 5;
    
    return significance;
  }
  
  /**
   * 🏷️ 确定节点类型
   */
  private static determineNodeType(element: ElementInfo, index: number, fullPath: ElementInfo[]): string {
    if (index === 0) return 'container';
    if (index === fullPath.length - 1) return 'target';
    
    const className = element.className.toLowerCase();
    if (className.includes('recyclerview') || className.includes('listview')) {
      return 'list';
    } else if (className.includes('cardview') || className.includes('card')) {
      return 'card';
    } else if (className.includes('layout')) {
      return 'layout';
    } else if (element.clickable) {
      return 'interactive';
    } else {
      return 'structural';
    }
  }
  
  /**
   * ⚓ 生成锚点
   */
  private static generateAnchorPoints(keyNodes: AncestorNode[], xmlContext: XmlContext): AnchorPoint[] {
    return keyNodes.slice(0, 5).map(node => ({
      xpath: this.generateNodeXPath(node.element),
      fingerprint: this.generateNodeFingerprint(node.element),
      relationship: this.determineRelationship(node),
      weight: Math.max(0.1, node.significance / 100)
    }));
  }
  
  /**
   * 🛤️ 生成节点XPath
   */
  private static generateNodeXPath(element: ElementInfo): string {
    const className = element.className.split('.').pop() || 'View';
    let xpath = `//${className}`;
    
    const constraints: string[] = [];
    
    // 优先使用resource-id
    if (element.resourceId && element.resourceId !== '' && 
        !element.resourceId.includes('0_resource_name_obfuscated')) {
      constraints.push(`@resource-id='${element.resourceId}'`);
    }
    
    // 使用content-desc
    if (element.contentDesc && element.contentDesc !== '') {
      constraints.push(`@content-desc='${element.contentDesc}'`);
    }
    
    // 使用文本（短文本优先）
    if (element.text && element.text.trim() !== '' && element.text.length < 20) {
      constraints.push(`@text='${element.text.trim()}'`);
    }
    
    // 使用布尔属性
    if (element.scrollable) constraints.push("@scrollable='true'");
    if (element.clickable) constraints.push("@clickable='true'");
    
    if (constraints.length > 0) {
      xpath += `[${constraints.join(' and ')}]`;
    }
    
    return xpath;
  }
  
  /**
   * 🆔 生成节点指纹
   */
  private static generateNodeFingerprint(element: ElementInfo): Record<string, any> {
    const fingerprint: Record<string, any> = {
      role: element.className.split('.').pop() || 'View'
    };
    
    if (element.scrollable) fingerprint.scrollable = true;
    if (element.clickable) fingerprint.clickable = true;
    if (element.resourceId && element.resourceId !== '') {
      fingerprint.resourceId = element.resourceId;
    }
    if (element.contentDesc && element.contentDesc !== '') {
      fingerprint.contentDesc = element.contentDesc;
    }
    if (element.text && element.text.trim() !== '') {
      fingerprint.text = element.text.trim();
    }
    
    return fingerprint;
  }
  
  /**
   * 🔗 确定关系类型
   */
  private static determineRelationship(node: AncestorNode): RelationshipType {
    switch (node.nodeType) {
      case 'container': return 'ancestor';
      case 'list': return 'parent';
      case 'card': return 'sibling';
      case 'target': return 'self';
      default: return 'ancestor';
    }
  }
  
  /**
   * 🦘 分析跳跃策略
   */
  private static analyzeJumpStrategy(fullPath: ElementInfo[], keyNodes: AncestorNode[]): 'sequential' | 'skip' | 'adaptive' {
    const pathLength = fullPath.length;
    const keyNodeCount = keyNodes.length;
    
    // 路径很短：逐步导航
    if (pathLength <= 3) return 'sequential';
    
    // 关键节点很多：跳跃导航
    if (keyNodeCount >= pathLength * 0.7) return 'skip';
    
    // 默认：自适应
    return 'adaptive';
  }
  
  // 🛠️ 工具方法
  
  private static calculateUniqueness(element: ElementInfo, xmlContext: XmlContext): number {
    let uniqueness = 0;
    
    // resource-id唯一性
    if (element.resourceId && element.resourceId !== '') {
      const sameResourceIdCount = xmlContext.allElements.filter(el => 
        el.resourceId === element.resourceId
      ).length;
      uniqueness += sameResourceIdCount === 1 ? 1 : 0.5;
    }
    
    // content-desc唯一性
    if (element.contentDesc && element.contentDesc !== '') {
      const sameContentDescCount = xmlContext.allElements.filter(el => 
        el.contentDesc === element.contentDesc
      ).length;
      uniqueness += sameContentDescCount === 1 ? 0.8 : 0.3;
    }
    
    // 文本唯一性
    if (element.text && element.text.trim() !== '') {
      const sameTextCount = xmlContext.allElements.filter(el => 
        el.text === element.text
      ).length;
      uniqueness += sameTextCount === 1 ? 0.6 : 0.2;
    }
    
    return Math.min(1, uniqueness);
  }
  
  private static isImportantText(text: string): boolean {
    const importantPatterns = [
      /^\d+$/, // 纯数字
      /^[A-Z][a-z]+$/, // 首字母大写单词
      /^\w+@\w+\.\w+$/, // 邮箱格式
      /^[\u4e00-\u9fa5]{2,4}$/ // 2-4个中文字符
    ];
    
    return importantPatterns.some(pattern => pattern.test(text.trim()));
  }
  
  private static countDirectChildren(element: ElementInfo, xmlContext: XmlContext): number {
    return xmlContext.allElements.filter(el => el.parent?.id === element.id).length;
  }
}