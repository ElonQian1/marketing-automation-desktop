// src/components/feature-modules/page-analyzer/components/ElementTree.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useMemo } from 'react';
import { Tree, Input, Button, Space, Typography, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  ExpandOutlined, 
  CompressOutlined,
  EyeOutlined,
  EyeInvisibleOutlined 
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useElementTree } from '../hooks/useElementTree';
import type { UIElement, ElementTreeNode } from '../types';

const { Search } = Input;
const { Text } = Typography;

/**
 * 元素树组件Props
 */
export interface ElementTreeProps {
  /** UI元素列表 */
  elements: UIElement[];
  /** 当前选中的元素 */
  selectedElement: UIElement | null;
  /** 选中元素回调 */
  onElementSelect: (element: UIElement | null) => void;
  /** 搜索关键词 */
  searchKeyword?: string;
  /** 搜索回调 */
  onSearch?: (keyword: string) => void;
  /** 组件大小 */
  size?: 'small' | 'middle' | 'large';
  /** 自定义类名 */
  className?: string;
}

/**
 * 页面分析器 - 元素树组件
 * 显示页面元素的层级结构，支持搜索、展开/折叠、选择操作
 * 文件大小: ~200行
 */
export const ElementTree: React.FC<ElementTreeProps> = ({
  elements,
  selectedElement,
  onElementSelect,
  searchKeyword = '',
  onSearch,
  size = 'middle',
  className,
}) => {
  const {
    treeNodes,
    flattenedNodes,
    selectedNodeId,
    treeStatistics,
    toggleNodeExpansion,
    expandAll,
    collapseAll,
    selectNode,
    expandToNode,
    searchInTree,
  } = useElementTree(elements);

  // 将元素树转换为Ant Design Tree组件需要的数据格式
  const treeData = useMemo(() => {
    const convertToDataNode = (node: ElementTreeNode): DataNode => {
      const { element, children } = node;
      
      // 生成节点标题
      const getNodeTitle = () => {
        const displayText = element.text || element.resourceId || element.type || 'Unknown';
        const truncatedText = displayText.length > 30 
          ? `${displayText.substring(0, 30)}...` 
          : displayText;

        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            minHeight: 24 
          }}>
            <Text 
              style={{ 
                fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
                color: element.clickable ? '#1890ff' : undefined 
              }}
            >
              {truncatedText}
            </Text>
            {element.clickable && (
              <Tooltip title="可点击元素">
                <EyeOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
              </Tooltip>
            )}
            {element.editable && (
              <Tooltip title="可编辑元素">
                <EyeInvisibleOutlined style={{ color: '#fa8c16', fontSize: '12px' }} />
              </Tooltip>
            )}
          </div>
        );
      };

      return {
        key: element.id,
        title: getNodeTitle(),
        children: children.map(convertToDataNode),
        isLeaf: children.length === 0,
      };
    };

    return treeNodes.map(convertToDataNode);
  }, [treeNodes, size]);

  // 处理节点选择
  const handleSelect = (selectedKeys: React.Key[]) => {
    const selectedKey = selectedKeys[0] as string;
    const selectedElement = elements.find(e => e.id === selectedKey) || null;
    
    selectNode(selectedKey || null);
    onElementSelect(selectedElement);
  };

  // 处理节点展开
  const handleExpand = (expandedKeys: React.Key[]) => {
    // 这里可以根据需要实现自定义的展开逻辑
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    searchInTree(value);
    onSearch?.(value);
  };

  return (
    <div className={`element-tree ${className || ''}`}>
      {/* 工具栏 */}
      <div style={{ 
        padding: '8px 0', 
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 8 
      }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* 搜索框 */}
          <Search
            placeholder="搜索元素..."
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            size={size}
            allowClear
            prefix={<SearchOutlined />}
          />
          
          {/* 操作按钮 */}
          <Space wrap>
            <Button 
              size="small" 
              icon={<ExpandOutlined />}
              onClick={expandAll}
              type="text"
            >
              全部展开
            </Button>
            <Button 
              size="small" 
              icon={<CompressOutlined />}
              onClick={collapseAll}
              type="text"
            >
              全部折叠
            </Button>
          </Space>
          
          {/* 统计信息 */}
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Text type="secondary">
              共 {treeStatistics.totalNodes} 个元素，
              显示 {treeStatistics.visibleNodes} 个，
              深度 {treeStatistics.maxDepth} 层
            </Text>
          </div>
        </Space>
      </div>

      {/* 树组件 */}
      <div style={{ 
        maxHeight: 'calc(100vh - 200px)', 
        overflow: 'auto',
        padding: '0 4px'
      }}>
        {treeData.length > 0 ? (
          <Tree
            treeData={treeData}
            selectedKeys={selectedNodeId ? [selectedNodeId] : []}
            onSelect={handleSelect}
            onExpand={handleExpand}
            showLine={true}
            showIcon={false}
            blockNode={true}
            style={{ 
              fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px'
            }}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#999'
          }}>
            <EyeInvisibleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
            <div>暂无元素数据</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              请先进行页面捕获
            </div>
          </div>
        )}
      </div>
    </div>
  );
};