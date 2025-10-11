/**
 * 邻居相对定位分析器
 * 
 * Step 5 辅助定位的核心组件
 * 专门处理动态兄弟元素和导航栏场景的相对定位
 */

import type { UiNode } from '../../../../components/universal-ui/views/grid-view/types';

export interface RelativePosition {
  /** 相对方向 */
  direction: 'before' | 'after' | 'above' | 'below' | 'adjacent';
  /** 参照元素 */
  referenceElement: UiNode;
  /** 距离度量 */
  distance: number;
  /** 相对定位的稳定性评分 */
  stability: number;
  /** XPath表达式 */
  xpath: string;
  /** 定位原因说明 */
  reason: string;
}

export interface NavigationContext {
  /** 导航容器 */
  container: UiNode;
  /** 导航项列表 */
  items: UiNode[];
  /** 当前激活项索引 */
  activeIndex?: number;
  /** 导航类型 */
  type: 'tab' | 'bottom_nav' | 'side_nav' | 'breadcrumb';
}

/**
 * 邻居相对定位分析器
 */
export class SiblingRelativeAnalyzer {

  /**
   * 分析目标元素的邻居相对定位机会
   */
  analyzeSiblingPositions(targetElement: UiNode): RelativePosition[] {
    const positions: RelativePosition[] = [];
    
    if (!targetElement.parent) return positions;
    
    const siblings = targetElement.parent.children;
    const targetIndex = siblings.indexOf(targetElement);
    
    if (targetIndex === -1) return positions;
    
    // 1. 分析前置兄弟元素
    for (let i = targetIndex - 1; i >= 0; i--) {
      const sibling = siblings[i];
      const position = this.analyzeSiblingRelation(targetElement, sibling, 'before', targetIndex - i);
      if (position) positions.push(position);
    }
    
    // 2. 分析后置兄弟元素  
    for (let i = targetIndex + 1; i < siblings.length; i++) {
      const sibling = siblings[i];
      const position = this.analyzeSiblingRelation(targetElement, sibling, 'after', i - targetIndex);
      if (position) positions.push(position);
    }
    
    // 3. 分析垂直相对位置（上下位置关系）
    const verticalPositions = this.analyzeVerticalPositions(targetElement, siblings);
    positions.push(...verticalPositions);
    
    // 按稳定性排序
    return positions.sort((a, b) => b.stability - a.stability);
  }

  /**
   * 分析兄弟元素关系
   */
  private analyzeSiblingRelation(
    target: UiNode, 
    sibling: UiNode, 
    direction: 'before' | 'after',
    distance: number
  ): RelativePosition | null {
    
    const siblingText = sibling.attrs?.text;
    const siblingResourceId = sibling.attrs?.['resource-id'];
    const siblingContentDesc = sibling.attrs?.['content-desc'];
    
    // 计算稳定性评分
    let stability = 0;
    let xpath = '';
    let reason = '';
    
    // 1. 基于文本的相对定位（最稳定）
    if (siblingText && siblingText.trim()) {
      stability += 40;
      const positionAxis = direction === 'before' ? 'preceding-sibling' : 'following-sibling';
      xpath = `//*[text()='${siblingText}']/${positionAxis}::*[@clickable='true']`;
      reason = `基于文本"${siblingText}"的${direction === 'before' ? '前' : '后'}置定位`;
    }
    
    // 2. 基于 resource-id 的相对定位
    else if (siblingResourceId) {
      stability += 35;
      const positionAxis = direction === 'before' ? 'preceding-sibling' : 'following-sibling';
      xpath = `//*[@resource-id='${siblingResourceId}']/${positionAxis}::*`;
      reason = `基于ID"${siblingResourceId}"的${direction === 'before' ? '前' : '后'}置定位`;
    }
    
    // 3. 基于 content-desc 的相对定位
    else if (siblingContentDesc) {
      stability += 30;
      const positionAxis = direction === 'before' ? 'preceding-sibling' : 'following-sibling';
      xpath = `//*[@content-desc='${siblingContentDesc}']/${positionAxis}::*`;
      reason = `基于描述"${siblingContentDesc}"的${direction === 'before' ? '前' : '后'}置定位`;
    }
    
    // 距离惩罚
    stability -= Math.min(distance * 2, 10);
    
    if (stability < 20) return null;
    
    return {
      direction,
      referenceElement: sibling,
      distance,
      stability,
      xpath,
      reason
    };
  }

  /**
   * 分析垂直位置关系
   */
  private analyzeVerticalPositions(target: UiNode, siblings: UiNode[]): RelativePosition[] {
    const positions: RelativePosition[] = [];
    const targetBounds = this.extractBounds(target);
    
    if (!targetBounds) return positions;
    
    for (const sibling of siblings) {
      if (sibling === target) continue;
      
      const siblingBounds = this.extractBounds(sibling);
      if (!siblingBounds) continue;
      
      // 检查垂直位置关系
      const isAbove = siblingBounds.bottom <= targetBounds.top;
      const isBelow = siblingBounds.top >= targetBounds.bottom;
      
      if (!isAbove && !isBelow) continue;
      
      const direction = isAbove ? 'above' : 'below';
      const distance = isAbove 
        ? targetBounds.top - siblingBounds.bottom
        : siblingBounds.top - targetBounds.bottom;
      
      const position = this.createVerticalPosition(target, sibling, direction, distance);
      if (position) positions.push(position);
    }
    
    return positions;
  }

  /**
   * 创建垂直位置定位
   */
  private createVerticalPosition(
    target: UiNode,
    reference: UiNode,
    direction: 'above' | 'below',
    distance: number
  ): RelativePosition | null {
    
    const refText = reference.attrs?.text;
    const refResourceId = reference.attrs?.['resource-id'];
    
    let stability = 25;
    let xpath = '';
    let reason = '';
    
    if (refText && refText.trim()) {
      stability += 20;
      xpath = `//*[text()='${refText}']/following::*[@clickable='true'][1]`;
      reason = `位于文本"${refText}"${direction === 'above' ? '上方' : '下方'}`;
    } else if (refResourceId) {
      stability += 15;
      xpath = `//*[@resource-id='${refResourceId}']/following::*[@clickable='true'][1]`;
      reason = `位于ID"${refResourceId}"${direction === 'above' ? '上方' : '下方'}`;
    } else {
      return null;
    }
    
    // 距离惩罚 - 垂直距离过大降低稳定性
    if (distance > 100) stability -= 10;
    
    return {
      direction,
      referenceElement: reference,
      distance,
      stability,
      xpath,
      reason
    };
  }

  /**
   * 专门的导航栏场景分析
   */
  analyzeNavigationScenario(targetElement: UiNode): NavigationContext | null {
    // 1. 查找导航容器
    const navContainer = this.findNavigationContainer(targetElement);
    if (!navContainer) return null;
    
    // 2. 识别导航类型
    const navType = this.identifyNavigationType(navContainer);
    
    // 3. 收集导航项
    const navItems = this.collectNavigationItems(navContainer);
    
    // 4. 确定当前激活项
    const activeIndex = this.findActiveNavigationItem(navItems, targetElement);
    
    return {
      container: navContainer,
      items: navItems,
      activeIndex,
      type: navType
    };
  }

  /**
   * 查找导航容器
   */
  private findNavigationContainer(element: UiNode): UiNode | null {
    let current = element.parent;
    
    while (current) {
      const resourceId = current.attrs?.['resource-id'] || '';
      const className = current.attrs?.['class'] || '';
      
      // 检查导航相关的ID和类名
      if (
        /nav|tab|bottom|menu/i.test(resourceId) ||
        /TabLayout|BottomNavigationView|NavigationView/i.test(className)
      ) {
        return current;
      }
      
      current = current.parent;
    }
    
    return null;
  }

  /**
   * 识别导航类型
   */
  private identifyNavigationType(container: UiNode): NavigationContext['type'] {
    const resourceId = container.attrs?.['resource-id'] || '';
    const className = container.attrs?.['class'] || '';
    const bounds = this.extractBounds(container);
    
    // 基于位置判断
    if (bounds) {
      const screenHeight = 2000; // 应该动态获取
      if (bounds.bottom >= screenHeight * 0.9) {
        return 'bottom_nav';
      }
      if (bounds.top <= screenHeight * 0.1) {
        return 'tab';
      }
    }
    
    // 基于ID和类名判断
    if (/bottom/i.test(resourceId) || /BottomNavigation/i.test(className)) {
      return 'bottom_nav';
    }
    if (/tab/i.test(resourceId) || /TabLayout/i.test(className)) {
      return 'tab';
    }
    if (/side|drawer/i.test(resourceId)) {
      return 'side_nav';
    }
    
    return 'tab'; // 默认
  }

  /**
   * 收集导航项
   */
  private collectNavigationItems(container: UiNode): UiNode[] {
    const items: UiNode[] = [];
    
    // 递归查找可点击的导航项
    const findItems = (node: UiNode) => {
      if (node.attrs?.clickable === 'true' && this.isNavigationItem(node)) {
        items.push(node);
      }
      
      for (const child of node.children || []) {
        findItems(child);
      }
    };
    
    findItems(container);
    return items;
  }

  /**
   * 判断是否为导航项
   */
  private isNavigationItem(node: UiNode): boolean {
    const text = node.attrs?.text;
    const contentDesc = node.attrs?.['content-desc'];
    const className = node.attrs?.['class'];
    
    // 有文本或描述
    if ((text && text.trim()) || (contentDesc && contentDesc.trim())) {
      return true;
    }
    
    // 特定的导航项类名
    if (className && /Tab|Item|Button/i.test(className)) {
      return true;
    }
    
    return false;
  }

  /**
   * 查找当前激活的导航项
   */
  private findActiveNavigationItem(items: UiNode[], targetElement: UiNode): number | undefined {
    for (let i = 0; i < items.length; i++) {
      if (this.isElementInSubtree(targetElement, items[i])) {
        return i;
      }
    }
    return undefined;
  }

  /**
   * 检查元素是否在子树中
   */
  private isElementInSubtree(element: UiNode, root: UiNode): boolean {
    if (element === root) return true;
    
    for (const child of root.children || []) {
      if (this.isElementInSubtree(element, child)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 生成导航场景的相对定位XPath
   */
  generateNavigationRelativeXPath(
    context: NavigationContext,
    targetElement: UiNode,
    targetItemIndex?: number
  ): string {
    const items = context.items;
    
    if (targetItemIndex !== undefined && targetItemIndex < items.length) {
      const targetItem = items[targetItemIndex];
      const itemText = targetItem.attrs?.text;
      
      if (itemText) {
        return `//*[text()='${itemText}']`;
      }
    }
    
    // 基于激活状态的定位
    if (context.activeIndex !== undefined) {
      const activeItem = items[context.activeIndex];
      const activeText = activeItem.attrs?.text;
      
      if (activeText) {
        return `//*[text()='${activeText}']`;
      }
    }
    
    // 兜底：使用索引定位
    const containerResourceId = context.container.attrs?.['resource-id'];
    if (containerResourceId && targetItemIndex !== undefined) {
      return `//*[@resource-id='${containerResourceId}']//*[@clickable='true'][${targetItemIndex + 1}]`;
    }
    
    return '//unknown-navigation-item';
  }
  
  /**
   * 提取边界信息
   */
  private extractBounds(node: UiNode): { left: number; top: number; right: number; bottom: number } | null {
    const boundsStr = node.attrs?.bounds;
    if (!boundsStr) return null;
    
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return null;
    
    return {
      left: parseInt(match[1]),
      top: parseInt(match[2]),
      right: parseInt(match[3]),
      bottom: parseInt(match[4])
    };
  }

  /**
   * 获取最佳相对定位方案
   */
  getBestRelativePosition(targetElement: UiNode): RelativePosition | null {
    const positions = this.analyzeSiblingPositions(targetElement);
    return positions.length > 0 ? positions[0] : null;
  }
}