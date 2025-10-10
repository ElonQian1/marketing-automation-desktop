/**
 * 稳定容器识别器
 * 
 * Step 0 规范化输入和 Step 4 区域限定的核心组件
 * 用于识别UI中的稳定容器祖先，提供可靠的定位锚点
 */

import type { UiNode } from '../../../components/universal-ui/views/grid-view/types';

export interface StableContainer {
  /** 容器节点 */
  node: UiNode;
  /** 稳定性评分 (0-100) */
  stability: number;
  /** 容器类型 */
  type: ContainerType;
  /** 识别原因 */
  reasons: string[];
  /** 容器边界信息 */
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

export type ContainerType = 
  | 'navigation'     // 导航栏容器
  | 'toolbar'        // 工具栏容器  
  | 'content'        // 内容区域容器
  | 'list'           // 列表容器
  | 'grid'           // 网格容器
  | 'modal'          // 模态框容器
  | 'tab'            // 标签页容器
  | 'menu'           // 菜单容器;

/**
 * 稳定容器识别规则
 */
const CONTAINER_RECOGNITION_RULES = {
  // 导航栏识别规则
  navigation: {
    resourceIdPatterns: [
      /bottom_nav/i,
      /navigation/i,
      /tab_bar/i,
      /action_bar/i,
      /app_bar/i
    ],
    classPatterns: [
      /TabLayout/i,
      /BottomNavigationView/i,
      /ActionBar/i,
      /Toolbar/i
    ],
    contentDescPatterns: [
      /导航/i,
      /navigation/i,
      /tab/i
    ],
    positionHints: ['bottom', 'top'],
    minStability: 85
  },

  // 列表容器识别规则
  list: {
    resourceIdPatterns: [
      /list/i,
      /recycler/i,
      /listview/i
    ],
    classPatterns: [
      /RecyclerView/i,
      /ListView/i,
      /ScrollView/i
    ],
    minStability: 80
  },

  // 工具栏识别规则
  toolbar: {
    resourceIdPatterns: [
      /toolbar/i,
      /action_bar/i,
      /title_bar/i
    ],
    classPatterns: [
      /Toolbar/i,
      /ActionBar/i
    ],
    positionHints: ['top'],
    minStability: 85
  }
};

/**
 * 主要的稳定容器识别器
 */
export class StableContainerRecognizer {
  
  /**
   * 识别给定元素的稳定容器祖先
   */
  identifyStableContainers(targetElement: UiNode, rootNode: UiNode): StableContainer[] {
    const containers: StableContainer[] = [];
    
    // 1. 检查目标元素的所有祖先
    const ancestors = this.getAncestorsChain(targetElement);
    
    for (const ancestor of ancestors) {
      const containerInfo = this.evaluateAsContainer(ancestor);
      if (containerInfo && containerInfo.stability >= 70) {
        containers.push(containerInfo);
      }
    }
    
    // 2. 检查兄弟容器（同级稳定元素）
    if (targetElement.parent) {
      const siblings = targetElement.parent.children;
      for (const sibling of siblings) {
        if (sibling !== targetElement) {
          const containerInfo = this.evaluateAsContainer(sibling);
          if (containerInfo && containerInfo.stability >= 75) {
            containers.push(containerInfo);
          }
        }
      }
    }
    
    // 3. 按稳定性排序
    return containers.sort((a, b) => b.stability - a.stability);
  }

  /**
   * 评估节点作为稳定容器的适合程度
   */
  private evaluateAsContainer(node: UiNode): StableContainer | null {
    if (!node || !node.attrs) return null;
    
    let stability = 0;
    let type: ContainerType = 'content';
    const reasons: string[] = [];
    
    const attrs = node.attrs;
    const resourceId = attrs['resource-id'] || '';
    const className = attrs['class'] || '';
    const contentDesc = attrs['content-desc'] || '';
    
    // 评估各种指标
    
    // 1. Resource ID 稳定性评估
    const idStability = this.evaluateResourceIdStability(resourceId);
    stability += idStability.score;
    if (idStability.reason) reasons.push(idStability.reason);
    if (idStability.type) type = idStability.type;
    
    // 2. 类名稳定性评估  
    const classStability = this.evaluateClassStability(className);
    stability += classStability.score;
    if (classStability.reason) reasons.push(classStability.reason);
    if (classStability.type && stability < 50) type = classStability.type;
    
    // 3. 位置稳定性评估
    const positionStability = this.evaluatePositionStability(node);
    stability += positionStability.score;
    if (positionStability.reason) reasons.push(positionStability.reason);
    
    // 4. 子元素数量稳定性
    const childrenStability = this.evaluateChildrenStability(node);
    stability += childrenStability.score;
    if (childrenStability.reason) reasons.push(childrenStability.reason);
    
    if (stability < 70) return null;
    
    return {
      node,
      stability: Math.min(stability, 100),
      type,
      reasons,
      bounds: this.extractBounds(node)
    };
  }

  /**
   * 评估 Resource ID 的稳定性
   */
  private evaluateResourceIdStability(resourceId: string): {
    score: number;
    reason?: string;
    type?: ContainerType;
  } {
    if (!resourceId) return { score: 0 };
    
    // 检查导航相关
    for (const pattern of CONTAINER_RECOGNITION_RULES.navigation.resourceIdPatterns) {
      if (pattern.test(resourceId)) {
        return {
          score: 40,
          reason: `导航容器ID: ${resourceId}`,
          type: 'navigation'
        };
      }
    }
    
    // 检查列表相关
    for (const pattern of CONTAINER_RECOGNITION_RULES.list.resourceIdPatterns) {
      if (pattern.test(resourceId)) {
        return {
          score: 35,
          reason: `列表容器ID: ${resourceId}`,
          type: 'list'
        };
      }
    }
    
    // 检查工具栏相关
    for (const pattern of CONTAINER_RECOGNITION_RULES.toolbar.resourceIdPatterns) {
      if (pattern.test(resourceId)) {
        return {
          score: 35,
          reason: `工具栏容器ID: ${resourceId}`,
          type: 'toolbar'
        };
      }
    }
    
    // 通用稳定ID模式
    if (resourceId.includes('container') || resourceId.includes('layout')) {
      return {
        score: 20,
        reason: `通用容器ID: ${resourceId}`
      };
    }
    
    return { score: 10, reason: `有效ID: ${resourceId}` };
  }

  /**
   * 评估类名的稳定性
   */
  private evaluateClassStability(className: string): {
    score: number;
    reason?: string;
    type?: ContainerType;
  } {
    if (!className) return { score: 0 };
    
    // 检查导航相关类
    for (const pattern of CONTAINER_RECOGNITION_RULES.navigation.classPatterns) {
      if (pattern.test(className)) {
        return {
          score: 30,
          reason: `导航类: ${className}`,
          type: 'navigation'
        };
      }
    }
    
    // 检查列表相关类
    for (const pattern of CONTAINER_RECOGNITION_RULES.list.classPatterns) {
      if (pattern.test(className)) {
        return {
          score: 25,
          reason: `列表类: ${className}`,
          type: 'list'
        };
      }
    }
    
    // 通用稳定类
    if (className.includes('Layout') || className.includes('Container')) {
      return {
        score: 15,
        reason: `布局类: ${className}`
      };
    }
    
    return { score: 5 };
  }

  /**
   * 评估位置的稳定性
   */
  private evaluatePositionStability(node: UiNode): {
    score: number;
    reason?: string;
  } {
    const bounds = this.extractBounds(node);
    if (!bounds) return { score: 0 };
    
    const { top, bottom } = bounds;
    const screenHeight = 2000; // 假设屏幕高度，实际应该动态获取
    
    // 底部导航栏
    if (bottom >= screenHeight * 0.9) {
      return {
        score: 25,
        reason: '位于屏幕底部（导航区域）'
      };
    }
    
    // 顶部工具栏
    if (top <= screenHeight * 0.1) {
      return {
        score: 20,
        reason: '位于屏幕顶部（标题栏区域）'
      };
    }
    
    // 中间区域
    return {
      score: 10,
      reason: '位于屏幕中间区域'
    };
  }

  /**
   * 评估子元素数量的稳定性
   */
  private evaluateChildrenStability(node: UiNode): {
    score: number;
    reason?: string;
  } {
    const childCount = node.children?.length || 0;
    
    if (childCount >= 3 && childCount <= 5) {
      return {
        score: 15,
        reason: `理想子元素数量: ${childCount}`
      };
    }
    
    if (childCount >= 2) {
      return {
        score: 10,
        reason: `合理子元素数量: ${childCount}`
      };
    }
    
    return { score: 0 };
  }

  /**
   * 获取祖先链
   */
  private getAncestorsChain(node: UiNode): UiNode[] {
    const ancestors: UiNode[] = [];
    let current = node.parent;
    
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }
    
    return ancestors;
  }

  /**
   * 提取边界信息
   */
  private extractBounds(node: UiNode): StableContainer['bounds'] | undefined {
    const boundsStr = node.attrs?.bounds;
    if (!boundsStr) return undefined;
    
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return undefined;
    
    return {
      left: parseInt(match[1]),
      top: parseInt(match[2]),
      right: parseInt(match[3]),
      bottom: parseInt(match[4])
    };
  }

  /**
   * 获取最佳容器（稳定性最高的）
   */
  getBestContainer(targetElement: UiNode, rootNode: UiNode): StableContainer | null {
    const containers = this.identifyStableContainers(targetElement, rootNode);
    return containers.length > 0 ? containers[0] : null;
  }

  /**
   * 生成基于容器的区域限定XPath
   */
  generateRegionScopedXPath(
    targetElement: UiNode, 
    container: StableContainer,
    textToMatch?: string
  ): string {
    const containerResourceId = container.node.attrs?.['resource-id'];
    
    if (containerResourceId) {
      // 使用容器 resource-id 限定范围
      if (textToMatch) {
        return `//*[@resource-id='${containerResourceId}']//*[@text='${textToMatch}']`;
      } else {
        // 查找在容器内的可点击父元素
        return `//*[@resource-id='${containerResourceId}']//*[@clickable='true']`;
      }
    }
    
    // 如果容器没有resource-id，使用类名
    const containerClass = container.node.attrs?.['class'];
    if (containerClass) {
      if (textToMatch) {
        return `//*[@class='${containerClass}']//*[@text='${textToMatch}']`;
      } else {
        return `//*[@class='${containerClass}']//*[@clickable='true']`;
      }
    }
    
    // 兜底方案：使用容器的层级路径
    return '//unknown-container//target-element';
  }
}