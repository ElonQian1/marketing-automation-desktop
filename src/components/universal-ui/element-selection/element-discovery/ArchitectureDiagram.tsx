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
  UserOutlined
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

// 架构图属性接口
interface ArchitectureDiagramProps {
  targetElement: UIElement;
  allElements: UIElement[];
  onElementSelect: (element: UIElement) => void;
  onFindNearestClickable?: (element: UIElement) => void;
}

// 构建层级树的函数
const buildHierarchyTree = (elements: UIElement[], targetElement: UIElement): HierarchyNode[] => {
  console.log('🏗️ 开始构建层级树，目标元素:', targetElement.id);
  
  // 创建节点映射
  const nodeMap = new Map<string, HierarchyNode>();
  
  // 首先创建所有节点
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

  // 构建父子关系（基于包含关系）
  elements.forEach(element => {
    const node = nodeMap.get(element.id);
    if (!node) return;

    // 查找所有被此元素包含的子元素
    const children = elements.filter(child => 
      child.id !== element.id && isElementContainedIn(child, element)
    );
    
    // 过滤出直接子元素（不被其他子元素包含）
    const directChildren = children.filter(child => {
      return !children.some(otherChild => 
        otherChild.id !== child.id && isElementContainedIn(child, otherChild)
      );
    });

    directChildren.forEach(child => {
      const childNode = nodeMap.get(child.id);
      if (childNode) {
        node.children.push(childNode);
        childNode.parent = node;
      }
    });
  });

  // 查找根节点（没有父节点的节点）
  const rootNodes = Array.from(nodeMap.values()).filter(node => !node.parent);
  
  // 计算关系和层级
  const targetNode = nodeMap.get(targetElement.id);
  if (targetNode) {
    calculateRelationships(rootNodes, targetNode);
  }

  // 计算路径
  const calculatePaths = (node: HierarchyNode, path = '') => {
    node.path = path || node.id;
    node.children.forEach((child, index) => {
      calculatePaths(child, `${node.path} > ${child.id}`);
    });
  };
  
  rootNodes.forEach(rootNode => calculatePaths(rootNode));
  
  console.log('🏗️ 层级树构建完成，根节点数量:', rootNodes.length);
  return rootNodes;
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
  
  return (
    childBounds.left >= parentBounds.left &&
    childBounds.top >= parentBounds.top &&
    childBounds.right <= parentBounds.right &&
    childBounds.bottom <= parentBounds.bottom
  );
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
export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
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

  // 获取节点图标
  const getNodeIcon = (node: HierarchyNode) => {
    switch (node.relationship) {
      case 'self': return <UserOutlined style={{ color: getRelationshipColor('self') }} />;
      case 'ancestor': return <ContainerOutlined style={{ color: getRelationshipColor('ancestor') }} />;
      case 'descendant': return <AppstoreOutlined style={{ color: getRelationshipColor('descendant') }} />;
      case 'sibling': return <NodeExpandOutlined style={{ color: getRelationshipColor('sibling') }} />;
      default: return <FileTextOutlined />;
    }
  };

  // 转换为Ant Design Tree数据格式
  const convertToTreeData = useCallback((nodes: HierarchyNode[]) => {
    return nodes.map(node => ({
      key: node.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: node.relationship === 'self' ? 'bold' : 'normal' }}>
            {getElementLabel(node.element)}
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {node.isClickable && <Tag color="green">可点击</Tag>}
            {node.hasText && <Tag color="blue">有文本</Tag>}
            {node.isHidden && <Tag color="red">隐藏</Tag>}
            <Tag color={getRelationshipColor(node.relationship)}>
              {node.relationship === 'self' ? '当前' : 
               node.relationship === 'ancestor' ? '祖先' :
               node.relationship === 'descendant' ? '后代' : '兄弟'}
            </Tag>
          </div>
        </div>
      ),
      icon: getNodeIcon(node),
      children: node.children.length > 0 ? convertToTreeData(node.children) : undefined,
      data: node
    }));
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
            onClick={() => selectedNode && handleElementSelect(hierarchyTree.find(n => n.id === selectedNode || findNodeById(n, selectedNode))!)}
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
          onExpand={(expandedKeys) => setExpandedKeys(expandedKeys as string[])}
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

// 辅助函数：在树中查找节点
const findNodeById = (node: HierarchyNode, id: string): HierarchyNode | null => {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
};

export default ArchitectureDiagram;