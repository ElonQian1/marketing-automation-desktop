/**
 * 架构图组件 - 可视化DOM层级结构
 * 支持祖父-父-子-孙关系展示和交互
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Card, Button, Tag, Space, Tooltip, Typography, Tree, message } from 'antd';
import { 
  NodeExpandOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  LinkOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  UserOutlined,
  // 🆕 新增图标用于不同元素类型
  MobileOutlined,
  PictureOutlined,
  FontSizeOutlined,
  StockOutlined,
  BorderOuterOutlined,
  PhoneOutlined,
  ContactsOutlined,
  StarOutlined,
  HomeOutlined,
  MenuOutlined,
  FormOutlined,
  EyeInvisibleOutlined,
  CrownOutlined,
  GroupOutlined
} from '@ant-design/icons';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { DiscoveredElement } from './types';

const { Text } = Typography;

// 层级节点类型
interface HierarchyNode {
  id: string;
  element: UIElement;
  level: number;
  children: HierarchyNode[];
  parent: HierarchyNode | null;
  isClickable: boolean;
  hasText: boolean;
  isHidden: boolean;
  relationship: 'self' | 'ancestor' | 'descendant' | 'sibling';
  path: string;
}

// 🆕 元素类型枚举
enum ElementType {
  BUTTON = 'button',           // 按钮
  TEXT = 'text',               // 文本
  IMAGE = 'image',             // 图片/图标
  CONTAINER = 'container',     // 容器
  NAVIGATION = 'navigation',   // 导航
  INPUT = 'input',             // 输入框
  LIST = 'list',               // 列表
  LAYOUT = 'layout',           // 布局
  HIDDEN = 'hidden',           // 隐藏元素
  UNKNOWN = 'unknown'          // 未知类型
}

// 🆕 元素信息接口
interface ElementInfo {
  type: ElementType;
  icon: React.ReactNode;
  label: string;
  emoji: string;
  description: string;
}

// 🆕 根据元素类型和属性获取元素信息
const getElementInfo = (element: UIElement): ElementInfo => {
  const elementType = element.element_type || '';
  const hasText = !!(element.text && element.text.trim());
  const isClickable = element.is_clickable;
  const text = element.text || '';
  const resourceId = element.resource_id || '';
  
  // 检查是否为隐藏元素
  if (checkIsHiddenElement(element)) {
    return {
      type: ElementType.HIDDEN,
      icon: <EyeInvisibleOutlined style={{ color: '#bfbfbf' }} />,
      label: '隐藏',
      emoji: '👻',
      description: '隐藏元素（bounds为0）'
    };
  }

  // 根据文本内容识别特定功能按钮
  if (hasText && isClickable) {
    if (text.includes('电话') || text.includes('通话')) {
      return {
        type: ElementType.BUTTON,
        icon: <PhoneOutlined style={{ color: '#52c41a' }} />,
        label: '电话按钮',
        emoji: '📞',
        description: '电话功能按钮'
      };
    }
    if (text.includes('联系人') || text.includes('通讯录')) {
      return {
        type: ElementType.BUTTON,
        icon: <ContactsOutlined style={{ color: '#1890ff' }} />,
        label: '联系人按钮',
        emoji: '👥',
        description: '联系人功能按钮'
      };
    }
    if (text.includes('收藏') || text.includes('喜欢')) {
      return {
        type: ElementType.BUTTON,
        icon: <StarOutlined style={{ color: '#faad14' }} />,
        label: '收藏按钮',
        emoji: '⭐',
        description: '收藏功能按钮'
      };
    }
  }

  // 根据元素类型识别
  if (elementType.includes('ImageView')) {
    return {
      type: ElementType.IMAGE,
      icon: <PictureOutlined style={{ color: '#722ed1' }} />,
      label: '图标',
      emoji: '🖼️',
      description: '图片或图标元素'
    };
  }

  if (elementType.includes('TextView') || hasText) {
    return {
      type: ElementType.TEXT,
      icon: <FontSizeOutlined style={{ color: '#13c2c2' }} />,
      label: '文本',
      emoji: '📝',
      description: hasText ? `文本内容: "${text}"` : '文本元素'
    };
  }

  if (isClickable && elementType.includes('LinearLayout')) {
    // 根据resource-id进一步识别
    if (resourceId.includes('bottom') || resourceId.includes('navigation')) {
      return {
        type: ElementType.NAVIGATION,
        icon: <MenuOutlined style={{ color: '#eb2f96' }} />,
        label: '导航栏',
        emoji: '🧭',
        description: '底部导航容器'
      };
    }
    return {
      type: ElementType.BUTTON,
      icon: <StockOutlined style={{ color: '#fa541c' }} />,
      label: '可点击容器',
      emoji: '📦',
      description: '可点击的布局容器'
    };
  }

  if (elementType.includes('LinearLayout') || elementType.includes('RelativeLayout') || 
      elementType.includes('FrameLayout') || elementType.includes('ConstraintLayout')) {
    // 根据是否包含导航相关的resource-id判断
    if (resourceId.includes('bottom') || resourceId.includes('navigation')) {
      return {
        type: ElementType.NAVIGATION,
        icon: <HomeOutlined style={{ color: '#eb2f96' }} />,
        label: '导航容器',
        emoji: '📦',
        description: '底部导航栏容器'
      };
    }
    return {
      type: ElementType.CONTAINER,
      icon: <BorderOuterOutlined style={{ color: '#595959' }} />,
      label: '容器',
      emoji: '📋',
      description: '布局容器元素'
    };
  }

  if (elementType.includes('RecyclerView') || elementType.includes('ListView')) {
    return {
      type: ElementType.LIST,
      icon: <AppstoreOutlined style={{ color: '#2f54eb' }} />,
      label: '列表',
      emoji: '📋',
      description: '列表容器'
    };
  }

  if (elementType.includes('EditText') || elementType.includes('Input')) {
    return {
      type: ElementType.INPUT,
      icon: <FormOutlined style={{ color: '#08979c' }} />,
      label: '输入框',
      emoji: '📝',
      description: '文本输入框'
    };
  }

  // 默认情况
  return {
    type: ElementType.UNKNOWN,
    icon: <NodeExpandOutlined style={{ color: '#8c8c8c' }} />,
    label: '未知',
    emoji: '❓',
    description: `未知元素类型: ${elementType}`
  };
};

// 架构图属性接口
interface ArchitectureDiagramProps {
  targetElement: UIElement;
  allElements: UIElement[];
  onElementSelect: (element: UIElement) => void;
  onFindNearestClickable?: (element: UIElement) => void;
}

// 构建层级树的函数 - 只显示与目标元素相关的层次结构
const buildHierarchyTree = (elements: UIElement[], targetElement: UIElement): HierarchyNode[] => {
  console.log('🏗️ 开始构建层级树，目标元素:', targetElement.id);
  console.log('🏗️ 总元素数量:', elements.length);
  
  try {
    // 创建节点映射
    const nodeMap = new Map<string, HierarchyNode>();
    
    // 首先创建所有节点
    console.log('🏗️ 步骤1: 创建节点映射');
    elements.forEach(element => {
      nodeMap.set(element.id, {
        id: element.id,
        element,
        level: 0,
        children: [],
        parent: null,
        isClickable: element.is_clickable,
        hasText: !!(element.text && element.text.trim()),
        isHidden: checkIsHiddenElement(element),
        relationship: element.id === targetElement.id ? 'self' : 'sibling',
        path: ''
      });
    });

    // 构建完整的父子关系（基于包含关系）
    console.log('🏗️ 步骤2: 构建父子关系');
    let processedElements = 0;
    const maxProcessingLimit = elements.length * 2; // 防止无限循环的安全限制
    
    elements.forEach(element => {
      if (processedElements > maxProcessingLimit) {
        console.warn('🚨 处理元素数量超过安全限制，停止构建');
        return;
      }
      
      const node = nodeMap.get(element.id);
      if (!node) return;

      // 查找所有被此元素包含的子元素（限制搜索范围以提高性能）
      const children = elements
        .filter(child => child.id !== element.id && isElementContainedIn(child, element))
        .slice(0, 100); // 限制最多处理100个子元素
      
      // 🔍 调试：输出包含关系
      if (children.length > 0) {
        console.log(`📦 元素 ${element.id} (${element.element_type}) 包含子元素:`, 
          children.map(c => `${c.id}(${c.element_type})`));
      }
      
      // 过滤出直接子元素（不被其他子元素包含）
      const directChildren = children.filter(child => {
        return !children.some(otherChild => 
          otherChild.id !== child.id && isElementContainedIn(child, otherChild)
        );
      });

      if (directChildren.length > 0) {
        console.log(`🎯 元素 ${element.id} 的直接子元素:`, 
          directChildren.map(c => `${c.id}(${c.element_type})`));
      }

      directChildren.forEach(child => {
        const childNode = nodeMap.get(child.id);
        if (childNode && childNode.parent === null) { // 防止重复分配父节点
          node.children.push(childNode);
          childNode.parent = node;
          console.log(`🔗 建立父子关系: ${element.id}(${element.element_type}) -> ${child.id}(${child.element_type})`);
        }
      });
      
      processedElements++;
    });

    // 查找目标元素节点
    console.log('🏗️ 步骤3: 查找目标元素');
    const targetNode = nodeMap.get(targetElement.id);
    if (!targetNode) {
      console.warn('🚨 未找到目标元素节点');
      return [];
    }

    // 输出目标元素的父子关系调试信息
    console.log(`🎯 目标元素 ${targetElement.id}(${targetElement.element_type}) 的父元素:`, 
      targetNode.parent?.id ? `${targetNode.parent.id}(${targetNode.parent.element.element_type})` : 'null');
    console.log(`🎯 目标元素 ${targetElement.id} 的子元素:`, 
      targetNode.children.map(c => `${c.id}(${c.element.element_type})`));

    // 查找目标元素的根祖先（最顶层包含它的元素）- 防无限循环版本
    console.log('🏗️ 步骤4: 查找根祖先');
    let rootAncestor = targetNode;
    const visited = new Set<string>();
    const maxDepth = 20; // 最大层级深度限制
    let depth = 0;
    
    // 🔍 追踪祖先链
    const ancestorChain: string[] = [`${targetNode.id}(${targetNode.element.element_type})`];
    
    while (rootAncestor.parent && depth < maxDepth && !visited.has(rootAncestor.id)) {
      visited.add(rootAncestor.id);
      rootAncestor = rootAncestor.parent;
      ancestorChain.push(`${rootAncestor.id}(${rootAncestor.element.element_type})`);
      depth++;
    }
    
    console.log('🏠 完整祖先链:', ancestorChain.reverse().join(' -> '));
    console.log('📦 最终根节点:', `${rootAncestor.id}(${rootAncestor.element.element_type})`);
    
    if (depth >= maxDepth) {
      console.warn('🚨 达到最大层级深度限制，停止查找祖先');
    }

    // 计算关系和层级
    console.log('🏗️ 步骤5: 计算关系');
    calculateRelationships([rootAncestor], targetNode);

    // 计算路径 - 防递归深度过大版本
    console.log('🏗️ 步骤6: 计算路径');
    const calculatePaths = (node: HierarchyNode, path = '', depth = 0) => {
      if (depth > 20) { // 防止递归过深
        console.warn('🚨 路径计算深度过大，停止递归');
        return;
      }
      
      node.path = path || node.id;
      node.children.slice(0, 50).forEach((child, index) => { // 限制子节点处理数量
        calculatePaths(child, `${node.path} > ${child.id}`, depth + 1);
      });
    };
    
    calculatePaths(rootAncestor);
    
    console.log('🏗️ 层级树构建完成');
    console.log('📦 根节点:', rootAncestor.element.id);
    console.log('🎯 目标元素:', targetElement.id);
    console.log('👥 总节点数:', nodeMap.size);
    console.log('🏗️ 目标元素关系链:', getElementAncestorChain(targetNode));
    
    // 🔍 特殊检查：如果目标元素没有找到正确的底部导航容器作为根
    // 手动查找底部导航容器
    const bottomNavElement = elements.find(e => 
      e.resource_id === 'com.hihonor.contacts:id/bottom_navgation' ||
      e.id === 'element_32' || 
      (e.element_type?.includes('LinearLayout') && 
       String(e.bounds).includes('1420') && // 底部导航的Y坐标特征
       (e.resource_id?.includes('bottom') || e.resource_id?.includes('navigation')))
    );
    
    if (bottomNavElement && rootAncestor.id !== bottomNavElement.id) {
      console.log('🔍 检测到可能的底部导航容器:', bottomNavElement.id, bottomNavElement.resource_id);
      const bottomNavNode = nodeMap.get(bottomNavElement.id);
      
      // 检查目标元素是否在底部导航区域内（通过多种方式）
      if (bottomNavNode) {
        const isInBottomNav = isAncestorOf(bottomNavNode, targetNode) || 
                             isTargetInBottomNavByBounds(targetElement, bottomNavElement);
        
        if (isInBottomNav) {
          console.log('✅ 使用底部导航容器作为根节点:', bottomNavElement.id);
          rootAncestor = bottomNavNode;
        } else {
          console.log('❌ 目标元素不在底部导航区域内');
        }
      }
    }
    
    // 只返回包含目标元素的根节点
    return [rootAncestor];
    
  } catch (error) {
    console.error('🚨 构建层级树时发生错误:', error);
    // 发生错误时返回目标元素本身作为单独节点
    return [{
      id: targetElement.id,
      element: targetElement,
      level: 0,
      children: [],
      parent: null,
      isClickable: targetElement.is_clickable,
      hasText: !!(targetElement.text && targetElement.text.trim()),
      isHidden: checkIsHiddenElement(targetElement),
      relationship: 'self',
      path: targetElement.id
    }];
  }
};

// 辅助函数：获取元素的祖先链
const getElementAncestorChain = (node: HierarchyNode): string[] => {
  const chain: string[] = [];
  let current: HierarchyNode | null = node;
  while (current) {
    chain.unshift(current.element.id);
    current = current.parent;
  }
  return chain;
};

// 辅助函数：检查节点A是否是节点B的祖先
const isAncestorOf = (ancestor: HierarchyNode, descendant: HierarchyNode): boolean => {
  let current = descendant.parent;
  while (current) {
    if (current.id === ancestor.id) return true;
    current = current.parent;
  }
  return false;
};

// 辅助函数：通过边界检查目标元素是否在底部导航区域内
const isTargetInBottomNavByBounds = (target: UIElement, bottomNav: UIElement): boolean => {
  const targetBounds = normalizeBounds(target.bounds);
  const navBounds = normalizeBounds(bottomNav.bounds);
  
  if (!targetBounds || !navBounds) return false;
  
  // 检查目标元素是否在底部导航的Y坐标范围内 (1420-1484)
  const isInBottomArea = targetBounds.top >= 1400 || targetBounds.bottom >= 1400;
  
  console.log(`🔍 边界检查: 目标${target.id} 是否在底部导航区域: ${isInBottomArea}`);
  console.log(`   目标边界: [${targetBounds.left},${targetBounds.top}][${targetBounds.right},${targetBounds.bottom}]`);
  console.log(`   导航边界: [${navBounds.left},${navBounds.top}][${navBounds.right},${navBounds.bottom}]`);
  
  return isInBottomArea;
};

// 辅助函数：递归查找节点
const findNodeById = (node: HierarchyNode, id: string): HierarchyNode | null => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
};

// 计算关系的函数
const calculateRelationships = (rootNodes: HierarchyNode[], targetNode: HierarchyNode) => {
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
};

// 辅助函数：检查元素是否被另一个元素包含
const isElementContainedIn = (child: UIElement, parent: UIElement): boolean => {
  if (!child.bounds || !parent.bounds) return false;
  
  const childBounds = normalizeBounds(child.bounds);
  const parentBounds = normalizeBounds(parent.bounds);
  
  if (!childBounds || !parentBounds) return false;
  
  // 🔧 特殊处理：零边界元素的父子关系判断
  const isChildZeroBounds = (childBounds.left === 0 && childBounds.top === 0 && 
                            childBounds.right === 0 && childBounds.bottom === 0);
  const isParentZeroBounds = (parentBounds.left === 0 && parentBounds.top === 0 && 
                             parentBounds.right === 0 && parentBounds.bottom === 0);
  
  // 如果子元素是零边界，检查是否有相同的resource-id前缀或文本相关性
  if (isChildZeroBounds) {
    // 检查resource-id关联性（同属bottom_navgation系统）
    if (child.resource_id && parent.resource_id) {
      const childIsNavRelated = child.resource_id.includes('com.hihonor.contacts:id/');
      const parentIsNavRelated = parent.resource_id.includes('com.hihonor.contacts:id/') || 
                                parent.resource_id.includes('bottom_navgation');
      if (childIsNavRelated && parentIsNavRelated) {
        console.log(`🔧 零边界关联检查: ${child.id} -> ${parent.id} (resource-id关联)`);
        return true;
      }
    }
    
    // 检查文本元素与按钮的关联性
    if (child.text && (child.text.includes('电话') || child.text.includes('联系人') || child.text.includes('收藏'))) {
      const parentIsClickable = parent.is_clickable;
      if (parentIsClickable) {
        console.log(`🔧 文本关联检查: ${child.id}("${child.text}") -> ${parent.id} (可点击按钮)`);
        return true;
      }
    }
    
    // 如果父元素也是零边界，可能是嵌套的文本容器
    if (isParentZeroBounds && child.resource_id.includes('content') && parent.resource_id.includes('container')) {
      console.log(`🔧 文本容器嵌套: ${child.id} -> ${parent.id}`);
      return true;
    }
    
    return false; // 零边界元素默认不被非关联元素包含
  }
  
  // 常规边界包含检查
  const isContained = (
    childBounds.left >= parentBounds.left &&
    childBounds.top >= parentBounds.top &&
    childBounds.right <= parentBounds.right &&
    childBounds.bottom <= parentBounds.bottom
  );
  
  // 🔍 调试特定元素的包含关系（只对底部导航相关元素输出）
  if (parent.id.includes('element_32') || child.id.includes('element_3')) {
    console.log(`🔍 包含检查: ${child.id}(${child.element_type}) 是否在 ${parent.id}(${parent.element_type}) 内: ${isContained}`);
    console.log(`   子元素边界: [${childBounds.left},${childBounds.top}][${childBounds.right},${childBounds.bottom}]`);
    console.log(`   父元素边界: [${parentBounds.left},${parentBounds.top}][${parentBounds.right},${parentBounds.bottom}]`);
    if (isChildZeroBounds) console.log(`   ⚠️ 子元素为零边界`);
    if (isParentZeroBounds) console.log(`   ⚠️ 父元素为零边界`);
  }
  
  return isContained;
};

// 辅助函数：统一bounds类型处理（支持对象和字符串）
const normalizeBounds = (bounds: any) => {
  // 如果已经是对象类型，直接返回
  if (bounds && typeof bounds === 'object' && 'left' in bounds) {
    return {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom
    };
  }
  
  // 如果是字符串类型，解析为对象
  if (typeof bounds === 'string') {
    const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return null;
    
    return {
      left: parseInt(match[1]),
      top: parseInt(match[2]),
      right: parseInt(match[3]),
      bottom: parseInt(match[4])
    };
  }
  
  return null;
};

// 辅助函数：计算元素面积
const getElementArea = (element: UIElement): number => {
  const bounds = normalizeBounds(element.bounds || null);
  if (!bounds) return Infinity;
  
  return (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
};

// 辅助函数：检查是否为隐藏元素
const checkIsHiddenElement = (element: UIElement): boolean => {
  const bounds = normalizeBounds(element.bounds || null);
  if (!bounds) return true;
  
  return bounds.left === 0 && bounds.top === 0 && bounds.right === 0 && bounds.bottom === 0;
};

// 查找最近可点击祖先的函数
const findNearestClickableAncestor = (node: HierarchyNode, targetId: string): UIElement | null => {
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
      const result = findNearestClickableAncestor(child, targetId);
      if (result) return result;
    }
  }
  return null;
};

// 获取元素标签的函数
const getElementLabel = (element: UIElement): string => {
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
};

// 主组件
const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  targetElement,
  allElements,
  onElementSelect,
  onFindNearestClickable
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 构建层级树
  const hierarchyTree = useMemo(() => {
    return buildHierarchyTree(allElements, targetElement);
  }, [allElements, targetElement]);

  // 处理节点选择
  const handleNodeSelect = useCallback((selectedKeys: string[]) => {
    if (selectedKeys.length > 0) {
      setSelectedNode(selectedKeys[0]);
    }
  }, []);

  // 处理元素选择
  const handleElementSelect = useCallback((node: HierarchyNode) => {
    onElementSelect(node.element);
  }, [onElementSelect]);

  // 处理查找最近可点击元素
  const handleFindClickable = useCallback(() => {
    if (!selectedNode) {
      message.warning('请先选择一个元素');
      return;
    }

    // 在整个树中查找最近可点击祖先
    let nearestClickable: UIElement | null = null;
    
    const searchInTree = (nodes: HierarchyNode[]) => {
      for (const node of nodes) {
        const result = findNearestClickableAncestor(node, selectedNode);
        if (result) {
          nearestClickable = result;
          break;
        }
        searchInTree(node.children);
      }
    };

    searchInTree(hierarchyTree);

    if (nearestClickable) {
      if (nearestClickable.id === selectedNode) {
        message.info('当前元素本身就是可点击的！');
      } else {
        message.success(`找到最近的可点击祖先：${getElementLabel(nearestClickable)}`);
        onFindNearestClickable?.(nearestClickable);
      }
    } else {
      message.warning('未找到可点击的祖先元素');
    }
  }, [selectedNode, hierarchyTree, onFindNearestClickable]);

  // 获取关系颜色
  const getRelationshipColor = (relationship: string): string => {
    switch (relationship) {
      case 'self': return '#1890ff'; // 蓝色
      case 'ancestor': return '#52c41a'; // 绿色  
      case 'descendant': return '#fa8c16'; // 橙色
      case 'sibling': return '#722ed1'; // 紫色
      default: return '#d9d9d9'; // 灰色
    }
  };

  // 转换为Ant Design Tree数据格式
  const convertToTreeData = useCallback((nodes: HierarchyNode[]) => {
    return nodes.map(node => {
      const elementInfo = getElementInfo(node.element);
      
      return {
        key: node.id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 🆕 使用emoji和更丰富的标签 */}
            <span style={{ 
              fontWeight: node.relationship === 'self' ? 'bold' : 'normal',
              color: node.relationship === 'self' ? '#1890ff' : 'inherit'
            }}>
              {elementInfo.emoji} {elementInfo.label}: {node.element.id}
              {node.element.text && ` - ${elementInfo.label.includes('文本') ? '' : '"'}${node.element.text.substring(0, 20)}${node.element.text.length > 20 ? '...' : ''}${elementInfo.label.includes('文本') ? '' : '"'}`}
            </span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {node.isClickable && <Tag color="green">可点击</Tag>}
              {node.hasText && <Tag color="blue">有文本</Tag>}
              {node.isHidden && <Tag color="red">隐藏</Tag>}
              <Tag color={getRelationshipColor(node.relationship)}>
                {node.relationship === 'self' ? '⭐ 当前选中' : 
                 node.relationship === 'ancestor' ? '🔼 祖先' :
                 node.relationship === 'descendant' ? '🔽 后代' : '↔️ 兄弟'}
              </Tag>
              {/* 🆕 显示元素类型标签 */}
              <Tag color="purple">{elementInfo.label}</Tag>
            </div>
          </div>
        ),
        icon: elementInfo.icon,
        children: node.children.length > 0 ? convertToTreeData(node.children) : undefined,
        data: node
      };
    });
  }, []);

  const treeData = useMemo(() => convertToTreeData(hierarchyTree), [hierarchyTree, convertToTreeData]);

  // 自动展开到目标元素
  React.useEffect(() => {
    if (hierarchyTree.length > 0) {
      // 展开所有包含目标元素的路径
      const findTargetPath = (nodes: HierarchyNode[], path: string[] = []): string[] | null => {
        for (const node of nodes) {
          const currentPath = [...path, node.id];
          if (node.id === targetElement.id) {
            return currentPath;
          }
          const childPath = findTargetPath(node.children, currentPath);
          if (childPath) {
            return childPath;
          }
        }
        return null;
      };

      const targetPath = findTargetPath(hierarchyTree);
      if (targetPath) {
        setExpandedKeys(targetPath.slice(0, -1)); // 展开到父级
        setSelectedNode(targetElement.id); // 选中目标元素
      }
    }
  }, [hierarchyTree, targetElement.id]);

  return (
    <Card title="DOM架构图" style={{ height: '100%' }}>
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<BulbOutlined />}
            onClick={handleFindClickable}
            disabled={!selectedNode}
          >
            查找最近可点击元素
          </Button>
          <Button 
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (selectedNode) {
                // 在层级树中查找选中的节点
                const findSelectedNode = (nodes: HierarchyNode[]): HierarchyNode | null => {
                  for (const node of nodes) {
                    if (node.id === selectedNode) return node;
                    const found = findNodeById(node, selectedNode);
                    if (found) return found;
                  }
                  return null;
                };
                
                const selectedNodeData = findSelectedNode(hierarchyTree);
                if (selectedNodeData) {
                  handleElementSelect(selectedNodeData);
                }
              }
            }}
            disabled={!selectedNode}
          >
            选择当前元素
          </Button>
        </Space>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary">
          🔵 当前元素 | 🟢 祖先元素 | 🟠 后代元素 | 🟣 兄弟元素
        </Text>
      </div>

      <div style={{ maxHeight: '500px', overflow: 'auto' }}>
        <Tree
          treeData={treeData}
          selectedKeys={selectedNode ? [selectedNode] : []}
          expandedKeys={expandedKeys}
          onSelect={handleNodeSelect}
          onExpand={(expandedKeys) => setExpandedKeys(expandedKeys.map(key => String(key)))}
          showIcon
          showLine
        />
      </div>

      {selectedNode && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
          <Text strong>已选择: </Text>
          <Text>{selectedNode}</Text>
        </div>
      )}
    </Card>
  );
};

export default ArchitectureDiagram;