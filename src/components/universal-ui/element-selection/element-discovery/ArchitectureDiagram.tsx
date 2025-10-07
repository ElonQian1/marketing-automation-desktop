/**
 * 重构后的架构图组件 - 纯UI展示层
 * 将所有业务逻辑迁移到服务层，专注于React组件渲染
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Card, Button, Tag, Space, Tooltip, Typography, Tree, message, Spin } from 'antd';
import { 
  NodeExpandOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  LinkOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  UserOutlined,
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
  GroupOutlined,
  ReloadOutlined,
  ExpandOutlined,
  CompressOutlined
} from '@ant-design/icons';

// 统一导入类型和服务
import type { UIElement } from '../../../../api/universalUIAPI';
import type { DiscoveredElement } from './types';
import type { HierarchyNode, TreeNodeData, HierarchyStatistics } from '../../../../types/hierarchy';

// 导入业务服务
import { useArchitectureTree } from './hooks/useArchitectureTree';
import { useElementVisualization } from './hooks/useElementVisualization';
import { HierarchyBuilder } from './services/hierarchyBuilder';
import { ElementAnalyzer } from './services/elementAnalyzer';

// 🆕 导入交互式组件
import { InteractiveTreeNode } from './components/InteractiveTreeNode';
import type { InteractiveTreeNodeProps } from './components/InteractiveTreeNode';

const { Text } = Typography;

// 组件Props接口
interface ArchitectureDiagramProps {
  targetElement: UIElement;
  allElements: UIElement[];
  xmlContent?: string; // 🆕 新增XML内容支持，用于纯XML结构分析
  onElementSelect?: (element: UIElement) => void;
  onRelationshipsUpdate?: (relationships: any[]) => void;
  showStatistics?: boolean;
  showVisualization?: boolean;
  interactiveMode?: boolean; // 🆕 新增交互模式开关
  className?: string;
}

/**
 * 重构后的架构图组件
 * 专注于UI渲染，所有业务逻辑通过hooks和服务层处理
 */
export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  targetElement,
  allElements,
  xmlContent, // 🆕 接收XML内容
  onElementSelect,
  onRelationshipsUpdate,
  showStatistics = true,
  showVisualization = false,
  interactiveMode = false, // 🆕 交互模式默认关闭
  className
}) => {
  // 🔍 调试：输出传入的数据统计
  console.log('🏗️ ArchitectureDiagram: 接收到的数据统计:');
  console.log(`  - 目标元素: ${targetElement.id} (${targetElement.element_type})`);
  console.log(`  - 总元素数量: ${allElements.length}`);
  
  // 统计不同类型的元素
  const elementStats = allElements.reduce((stats, el) => {
    const type = el.element_type || 'unknown';
    stats[type] = (stats[type] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);
  
  console.log('  - 元素类型分布:', elementStats);
  
  // 统计有文本内容的元素
  const textElements = allElements.filter(el => 
    el.text && el.text.trim().length > 0 || 
    el.content_desc && el.content_desc.trim().length > 0
  );
  console.log(`  - 包含文本/描述的元素: ${textElements.length}`);
  
  if (textElements.length > 0) {
    console.log('  - 文本元素示例:');
    textElements.slice(0, 5).forEach((el, index) => {
      console.log(`    ${index + 1}. ${el.id} (${el.element_type}): "${el.text || el.content_desc}"`);
    });
  }

  // 使用自定义hooks管理状态和业务逻辑
  const {
    hierarchyTree,
    treeData,
    selectedNode,
    selectedNodeInfo,
    expandedKeys,
    handleNodeSelect,
    handleNodeExpand,
    resetSelection,
    expandToTarget,
    expandAll,
    collapseAll,
    setInteractiveCallbacks, // 🆕 新增交互回调设置
    treeStatistics,
    treeValidation,
    isTreeValid,
    hasSelection,
    isEmpty
  } = useArchitectureTree(targetElement, allElements, xmlContent, interactiveMode); // 🆕 传递交互模式

  const {
    highlightedElements,
    visualizationMode,
    overlappingElements,
    nearbyElements,
    elementsByDirection,
    highlightOverlappingElements,
    highlightNearbyElements,
    highlightElementsByDirection,
    clearHighlight,
    setVisualizationMode,
    visualizationStats,
    layoutIssues,
    hasOverlaps,
    hasLayoutIssues
  } = useElementVisualization(targetElement, allElements);

  // 本地UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [autoExpandEnabled, setAutoExpandEnabled] = useState(true);

  // 处理元素选择
  const handleElementClick = useCallback((elementId: string) => {
    const element = allElements.find(el => el.id === elementId);
    if (element && onElementSelect) {
      onElementSelect(element);
    }
  }, [allElements, onElementSelect]);

  // 🆕 交互式节点回调函数
  const handleSwitchToElement = useCallback((element: UIElement) => {
    console.log('🔄 切换到元素:', element.id);
    if (onElementSelect) {
      onElementSelect(element);
    }
    message.success(`已切换到元素: ${element.id}`);
  }, [onElementSelect]);

  const handleViewDetails = useCallback((element: UIElement) => {
    console.log('👁️ 查看元素详情:', element.id);
    // 这里可以触发详情模态框或侧边栏
    message.info(`查看元素详情: ${element.id}`);
  }, []);

  const handleHighlightElement = useCallback((element: UIElement) => {
    console.log('🎯 高亮元素:', element.id);
    // 触发元素高亮
    message.info(`高亮元素: ${element.id}`);
  }, []);

  const handleCopyElementInfo = useCallback((element: UIElement) => {
    const info = `元素ID: ${element.id}\n类型: ${element.element_type}\n文本: ${element.text || 'N/A'}`;
    navigator.clipboard.writeText(info).then(() => {
      message.success('元素信息已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  }, []);

  const handleShowBounds = useCallback((element: UIElement) => {
    console.log('📐 显示元素边界:', element.id);
    message.info(`显示边界: ${element.id}`);
  }, []);

  // 🆕 设置交互式回调函数
  useEffect(() => {
    if (interactiveMode) {
      setInteractiveCallbacks({
        onSwitchToElement: handleSwitchToElement,
        onViewDetails: handleViewDetails,
        onHighlightElement: handleHighlightElement,
        onCopyElementInfo: handleCopyElementInfo,
        onShowBounds: handleShowBounds
      });
    }
  }, [
    interactiveMode,
    setInteractiveCallbacks,
    handleSwitchToElement,
    handleViewDetails,
    handleHighlightElement,
    handleCopyElementInfo,
    handleShowBounds
  ]);

  // 🆕 自定义节点渲染函数
  const renderTreeNode = useCallback((nodeData: any) => {
    if (!interactiveMode || !nodeData.nodeData) {
      // 传统模式，直接返回标题字符串
      return nodeData.title;
    }

    const { 
      node, 
      element, 
      title, 
      relationship, 
      level, 
      isTarget 
    } = nodeData.nodeData;

    return (
      <InteractiveTreeNode
        node={node}
        element={element}
        title={title}
        relationship={relationship}
        level={level}
        isTarget={isTarget}
        isSelected={selectedNode === element.id}
        onSwitchToElement={handleSwitchToElement}
        onViewDetails={handleViewDetails}
        onHighlightElement={handleHighlightElement}
        onCopyElementInfo={handleCopyElementInfo}
        onShowBounds={handleShowBounds}
      />
    );
  }, [
    interactiveMode,
    selectedNode,
    handleSwitchToElement,
    handleViewDetails,
    handleHighlightElement,
    handleCopyElementInfo,
    handleShowBounds
  ]);

  // 自动展开到目标元素
  useEffect(() => {
    if (autoExpandEnabled && !isEmpty) {
      expandToTarget();
    }
  }, [targetElement.id, autoExpandEnabled, isEmpty, expandToTarget]);

  // 更新关系数据
  useEffect(() => {
    if (onRelationshipsUpdate && hierarchyTree.length > 0) {
      const relationships = ElementAnalyzer.extractRelationships(hierarchyTree);
      onRelationshipsUpdate(relationships);
    }
  }, [hierarchyTree, onRelationshipsUpdate]);

  // 渲染统计信息卡片
  const renderStatisticsCard = useCallback(() => {
    if (!showStatistics) return null;

    return (
      <Card size="small" title="层级统计" className="mb-4">
        <Space wrap>
          <Tag icon={<GroupOutlined />} color="blue">
            总节点: {treeStatistics.totalNodes}
          </Tag>
          <Tag icon={<StockOutlined />} color="green">
            最大深度: {treeStatistics.maxDepth}
          </Tag>
          <Tag icon={<FileTextOutlined />} color="orange">
            叶子节点: {treeStatistics.leafNodes}
          </Tag>
          <Tag icon={<ContainerOutlined />} color="purple">
            容器: {treeStatistics.containerNodes}
          </Tag>
          <Tag icon={<LinkOutlined />} color="cyan">
            可点击: {treeStatistics.clickableNodes}
          </Tag>
          <Tag icon={<FontSizeOutlined />} color="magenta">
            隐藏节点: {treeStatistics.hiddenNodes}
          </Tag>
        </Space>
        
        {!isTreeValid && (
          <div className="mt-2">
            <Text type="warning">层级结构验证失败</Text>
            {treeValidation.errors.map((error, index) => (
              <div key={index}>
                <Text type="danger" className="text-xs">{error}</Text>
              </div>
            ))}
          </div>
        )}
        
        {hasLayoutIssues && (
          <div className="mt-2">
            <Text type="warning">布局问题检测</Text>
            {layoutIssues.map((issue, index) => (
              <div key={index}>
                <Text type="warning" className="text-xs">{issue}</Text>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }, [showStatistics, treeStatistics, isTreeValid, treeValidation, hasLayoutIssues, layoutIssues]);

  // 渲染可视化控制卡片
  const renderVisualizationCard = useCallback(() => {
    if (!showVisualization) return null;

    return (
      <Card size="small" title="可视化控制" className="mb-4">
        <Space wrap>
          <Button 
            size="small" 
            onClick={highlightOverlappingElements}
            disabled={!hasOverlaps}
          >
            高亮重叠元素 ({overlappingElements.length})
          </Button>
          <Button 
            size="small" 
            onClick={() => highlightNearbyElements(5)}
          >
            高亮邻近元素 ({nearbyElements.length})
          </Button>
          <Button 
            size="small" 
            onClick={() => highlightElementsByDirection('left')}
          >
            左侧元素 ({elementsByDirection.left?.length || 0})
          </Button>
          <Button 
            size="small" 
            onClick={() => highlightElementsByDirection('right')}
          >
            右侧元素 ({elementsByDirection.right?.length || 0})
          </Button>
          <Button 
            size="small" 
            onClick={clearHighlight}
          >
            清除高亮
          </Button>
        </Space>
        
        <div className="mt-2">
          <Space wrap>
            <Tag color={visualizationMode === 'normal' ? 'blue' : 'default'}>
              普通视图
            </Tag>
            <Tag color={visualizationMode === 'boundaries' ? 'blue' : 'default'}>
              边界视图
            </Tag>
            <Tag color={visualizationMode === 'overlaps' ? 'blue' : 'default'}>
              重叠视图
            </Tag>
            <Tag color={visualizationMode === 'relationships' ? 'blue' : 'default'}>
              关系视图
            </Tag>
          </Space>
        </div>
      </Card>
    );
  }, [
    showVisualization, 
    highlightOverlappingElements, 
    hasOverlaps, 
    overlappingElements.length,
    highlightNearbyElements,
    nearbyElements.length,
    highlightElementsByDirection,
    elementsByDirection,
    clearHighlight,
    visualizationMode
  ]);

  // 渲染工具栏
  const renderToolbar = useCallback(() => (
    <Space className="mb-4">
      <Button 
        icon={<ReloadOutlined />} 
        onClick={resetSelection}
        size="small"
      >
        重置选择
      </Button>
      <Button 
        icon={<ExpandOutlined />} 
        onClick={expandAll}
        size="small"
      >
        全部展开
      </Button>
      <Button 
        icon={<CompressOutlined />} 
        onClick={collapseAll}
        size="small"
      >
        全部收起
      </Button>
      <Button 
        icon={<StarOutlined />} 
        size="small"
        type={autoExpandEnabled ? "primary" : "default"}
        onClick={() => {
          setAutoExpandEnabled(!autoExpandEnabled);
          if (!autoExpandEnabled) {
            expandToTarget();
          }
        }}
      >
        {autoExpandEnabled ? '自动展开已启用' : '启用自动展开'}
      </Button>
    </Space>
  ), [resetSelection, expandAll, collapseAll, expandToTarget, autoExpandEnabled]);

  // 渲染选中节点详情
  const renderSelectedNodeInfo = useCallback(() => {
    if (!hasSelection || !selectedNodeInfo) return null;

    const { node, element, report, nearestClickable } = selectedNodeInfo;

    return (
      <Card size="small" title="选中节点详情" className="mb-4">
        <Space direction="vertical" size="small" className="w-full">
          <div>
            <Text strong>节点ID: </Text>
            <Text code>{node.id}</Text>
          </div>
          <div>
            <Text strong>元素类型: </Text>
            <Text>{element.element_type}</Text>
          </div>
          <div>
            <Text strong>层级深度: </Text>
            <Tag color="blue">{node.level}</Tag>
          </div>
          <div>
            <Text strong>关系: </Text>
            <Tag color="green">{node.relationship}</Tag>
          </div>
          {element.text && (
            <div>
              <Text strong>文本: </Text>
              <Text>{element.text}</Text>
            </div>
          )}
          {element.resource_id && (
            <div>
              <Text strong>资源ID: </Text>
              <Text code>{element.resource_id}</Text>
            </div>
          )}
          {nearestClickable && (
            <div>
              <Text strong>最近可点击祖先: </Text>
              <Button 
                size="small" 
                type="link" 
                onClick={() => handleElementClick(nearestClickable.id)}
              >
                {nearestClickable.id}
              </Button>
            </div>
          )}
          <div>
            <Text strong>特征: </Text>
            <Space wrap>
              {node.isClickable && <Tag color="green">可点击</Tag>}
              {node.hasText && <Tag color="blue">有文本</Tag>}
              {node.isHidden && <Tag color="red">隐藏</Tag>}
            </Space>
          </div>
          <div>
            <Text strong>分析报告: </Text>
            <Text className="text-xs">{report.description}</Text>
          </div>
        </Space>
      </Card>
    );
  }, [hasSelection, selectedNodeInfo, handleElementClick]);

  // 主渲染
  if (isEmpty) {
    return (
      <Card className={className}>
        <div className="text-center py-8">
          <Text type="secondary">无法构建层级树结构</Text>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {renderStatisticsCard()}
      {renderVisualizationCard()}
      {renderToolbar()}
      {renderSelectedNodeInfo()}
      
      <Card 
        title={
          <Space>
            <NodeExpandOutlined />
            <span>架构层级树</span>
            <Tag color="blue">{targetElement.id}</Tag>
          </Space>
        }
        size="small"
      >
        {isLoading ? (
          <div className="text-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Tree
            treeData={treeData}
            selectedKeys={selectedNode ? [selectedNode] : []}
            expandedKeys={expandedKeys}
            onSelect={handleNodeSelect}
            onExpand={handleNodeExpand}
            showLine={{ showLeafIcon: false }}
            className="architecture-tree"
            titleRender={interactiveMode ? renderTreeNode : undefined}
          />
        )}
      </Card>
    </div>
  );
};

export default ArchitectureDiagram;