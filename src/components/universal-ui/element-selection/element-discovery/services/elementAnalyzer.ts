import type { UIElement, ElementBounds } from '../../../../../api/universal-ui';
import { BoundaryDetector } from '../utils/boundaryDetector';

// 重新导入层级节点类型
export interface HierarchyNode {
  id: string;
  element: UIElement;
  level: number;
  children: HierarchyNode[];
  parent: HierarchyNode | null;
  isClickable: boolean;
  hasText: boolean;
  isHidden: boolean;
  relationship: 'self' | 'parent' | 'child' | 'sibling' | 'ancestor' | 'descendant';
  path: string;
}

/**
 * 元素信息分析器
 * 专门负责元素特征分析、关系计算、标签生成等功能
 */
export class ElementAnalyzer {
  
  /**
   * 生成元素显示标签
   * 组合元素的文本、resource_id 和类型信息
   */
  static getElementLabel(element: UIElement): string {
    const parts = [];
    
    if (element.text && element.text.trim()) {
      parts.push(element.text.trim());
    }
    
    if (element.resource_id) {
      parts.push(`@${element.resource_id}`);
    }
    
    if (element.element_type) {
      parts.push(`(${element.element_type})`);
    }
    
    return parts.length > 0 ? parts.join(' ') : element.id;
  }
  
  /**
   * 检查元素是否为隐藏元素
   * 基于边界、可见性等特征判断
   */
  static checkIsHiddenElement(element: UIElement): boolean {
    const bounds = BoundaryDetector.normalizeBounds(element.bounds);
    if (!bounds) return true;
    
    return BoundaryDetector.isZeroBounds(bounds);
  }
  
  /**
   * 计算元素关系
   * 根据层级结构确定元素间的父子、兄弟、祖先关系
   */
  static calculateRelationships(rootNodes: HierarchyNode[], targetNode: HierarchyNode): void {
    const isAncestor = (node: HierarchyNode, target: HierarchyNode): boolean => {
      if (node === target) return false;
      for (const child of node.children) {
        if (child === target || isAncestor(child, target)) return true;
      }
      return false;
    };

    const isDescendant = (node: HierarchyNode, target: HierarchyNode): boolean => {
      return isAncestor(target, node);
    };

    const areSiblings = (node: HierarchyNode, target: HierarchyNode): boolean => {
      return node.parent === target.parent && node !== target;
    };

    // 遍历所有节点设置关系
    const setRelationships = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        if (node === targetNode) {
          node.relationship = 'self';
        } else if (isAncestor(node, targetNode)) {
          node.relationship = 'ancestor';
        } else if (isDescendant(node, targetNode)) {
          node.relationship = 'descendant';
        } else if (areSiblings(node, targetNode)) {
          node.relationship = 'sibling';
        } else {
          node.relationship = 'sibling'; // 默认为兄弟关系
        }
        
        setRelationships(node.children);
      });
    };

    setRelationships(rootNodes);
  }
  
  /**
   * 查找最近的可点击祖先元素
   * 用于查找用户可以交互的最近父元素
   */
  static findNearestClickableAncestor(node: HierarchyNode, targetId: string): UIElement | null {
    if (node.id === targetId) {
      // 从目标元素开始向上查找
      let current = node.parent;
      while (current) {
        if (current.isClickable) {
          return current.element;
        }
        current = current.parent;
      }
    } else {
      // 递归查找子节点
      for (const child of node.children) {
        const result = this.findNearestClickableAncestor(child, targetId);
        if (result) return result;
      }
    }
    return null;
  }
  
  /**
   * 计算元素层级深度
   * 基于父子关系计算元素在层级树中的深度
   */
  static calculateElementDepth(node: HierarchyNode): number {
    let depth = 0;
    let current = node.parent;
    
    while (current) {
      depth++;
      current = current.parent;
    }
    
    return depth;
  }
  
  /**
   * 计算路径字符串
   * 为层级节点生成从根到当前节点的路径描述
   */
  static calculatePaths(node: HierarchyNode, path = '', depth = 0): void {
    if (depth > 20) { // 防止递归过深
      console.warn('🚨 路径计算深度过大，停止递归');
      return;
    }
    
    node.path = path || node.id;
    node.children.slice(0, 50).forEach((child, index) => { // 限制子节点处理数量
      this.calculatePaths(child, `${node.path} > ${child.id}`, depth + 1);
    });
  }
  
  /**
   * 获取元素的图标类型
   * 根据元素类型和特征返回相应的图标
   */
  static getElementIcon(element: UIElement): string {
    // 基于元素类型返回图标
    switch (element.element_type) {
      case 'android.widget.Button':
      case 'android.widget.ImageButton':
        return '🔘';
      case 'android.widget.TextView':
        return '📝';
      case 'android.widget.EditText':
        return '✏️';
      case 'android.widget.ImageView':
        return '🖼️';
      case 'android.widget.LinearLayout':
      case 'android.widget.RelativeLayout':
      case 'android.widget.FrameLayout':
        return '📦';
      case 'android.widget.ListView':
      case 'android.widget.RecyclerView':
        return '📋';
      case 'android.widget.ScrollView':
        return '📜';
      case 'android.widget.CheckBox':
        return '☑️';
      case 'android.widget.Switch':
        return '🔀';
      default:
        return element.is_clickable ? '👆' : '🔹';
    }
  }
  
  /**
   * 分析元素特征
   * 返回元素的关键特征摘要
   */
  static analyzeElementFeatures(element: UIElement): {
    hasText: boolean;
    isClickable: boolean;
    isHidden: boolean;
    hasChildren: boolean;
    area: number;
    type: string;
    features: string[];
  } {
    const bounds = BoundaryDetector.normalizeBounds(element.bounds);
    const area = BoundaryDetector.getElementArea(element);
    
    const features: string[] = [];
    
    if (element.text && element.text.trim()) {
      features.push('有文本');
    }
    
    if (element.is_clickable) {
      features.push('可点击');
    }
    
    if (element.is_scrollable) {
      features.push('可滚动');
    }
    
    if (element.resource_id) {
      features.push('有资源ID');
    }
    
    if (element.children && element.children.length > 0) {
      features.push(`${element.children.length}个子元素`);
    }
    
    if (this.checkIsHiddenElement(element)) {
      features.push('隐藏');
    }
    
    return {
      hasText: !!(element.text && element.text.trim()),
      isClickable: element.is_clickable,
      isHidden: this.checkIsHiddenElement(element),
      hasChildren: !!(element.children && element.children.length > 0),
      area,
      type: element.element_type,
      features
    };
  }
  
  /**
   * 生成元素分析报告
   * 综合分析元素特征并生成可读的描述
   */
  static generateElementReport(element: UIElement): {
    label: string;
    icon: string;
    features: string[];
    description: string;
    score: number; // 元素重要性评分
  } {
    const features = this.analyzeElementFeatures(element);
    const icon = this.getElementIcon(element);
    const label = this.getElementLabel(element);
    
    // 计算重要性评分
    let score = 0;
    if (features.isClickable) score += 3;
    if (features.hasText) score += 2;
    if (features.hasChildren) score += 1;
    if (element.resource_id) score += 1;
    if (features.isHidden) score -= 2;
    
    // 生成描述
    const description = `${features.type}${features.features.length > 0 ? ` (${features.features.join(', ')})` : ''}`;
    
    return {
      label,
      icon,
      features: features.features,
      description,
      score: Math.max(0, score)
    };
  }
  
  /**
   * 比较两个元素的相似度
   * 用于查找相似元素或重复元素
   */
  static calculateSimilarity(elementA: UIElement, elementB: UIElement): number {
    let similarity = 0;
    let total = 0;
    
    // 比较元素类型
    total++;
    if (elementA.element_type === elementB.element_type) {
      similarity++;
    }
    
    // 比较可点击性
    total++;
    if (elementA.is_clickable === elementB.is_clickable) {
      similarity++;
    }
    
    // 比较resource_id
    if (elementA.resource_id || elementB.resource_id) {
      total++;
      if (elementA.resource_id === elementB.resource_id) {
        similarity++;
      }
    }
    
    // 比较文本内容
    if (elementA.text || elementB.text) {
      total++;
      if (elementA.text === elementB.text) {
        similarity++;
      }
    }
    
    // 比较class_name
    if (elementA.class_name || elementB.class_name) {
      total++;
      if (elementA.class_name === elementB.class_name) {
        similarity++;
      }
    }
    
    return total > 0 ? similarity / total : 0;
  }
}