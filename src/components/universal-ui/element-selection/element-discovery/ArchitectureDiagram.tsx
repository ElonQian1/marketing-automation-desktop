import React from 'react';
import { Tree, Button, Space, Card, Typography, Tag, message } from 'antd';
import { 
  ExpandOutlined, 
  CompressOutlined, 
  AimOutlined, 
  ReloadOutlined,
  EyeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { UIElement } from '../../../../api/universal-ui';
import { useArchitectureTree } from './hooks/useArchitectureTree';
import { useElementVisualization } from './hooks/useElementVisualization';
import { ElementAnalyzer } from './services/elementAnalyzer';

const { Title, Text } = Typography;

// 组件属性接口
export interface ArchitectureDiagramProps {
  targetElement: UIElement;
  allElements: UIElement[];
  onElementSelect: (element: UIElement) => void;
  onFindNearestClickable?: () => void;
}

/**
 * 架构图组件 - 重构版本
 * 
 * 职责：
 * - UI 渲染和用户交互
 * - 状态展示和操作界面
 * - 将复杂逻辑委托给专门的 Hook 和服务
 * 
 * 架构特点：
 * - 使用 useArchitectureTree Hook 管理层级树逻辑
 * - 使用 useElementVisualization Hook 管理可视化分析
 * - 组件本身仅负责 UI 展现，不包含业务逻辑
 * - 严格分离 XML 构建与边界检测职责
 */
const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  targetElement,
  allElements,
  onElementSelect,
  onFindNearestClickable
}) => {
  // 使用架构树 Hook
  const {
    treeData,
    selectedNode,
    selectedNodeInfo,
    expandedKeys,
    handleNodeSelect,
    handleNodeExpand,
    findNearestClickableAncestor,
    resetSelection,
    expandToTarget,
    expandAll,
    collapseAll,
    treeStatistics,
    treeValidation,
    isTreeValid,
    hasSelection,
    isEmpty
  } = useArchitectureTree(targetElement, allElements);

  // 使用元素可视化 Hook
  const {
    visualizationStats,
    layoutIssues,
    hasOverlaps,
    hasLayoutIssues
  } = useElementVisualization(targetElement, allElements);

  // 处理节点双击（选择元素）
  const handleNodeDoubleClick = (nodeKey: string) => {
    const nodeInfo = selectedNodeInfo;
    if (nodeInfo && nodeInfo.node.id === nodeKey) {
      onElementSelect(nodeInfo.element);
      message.success(`已选择元素：${ElementAnalyzer.getElementLabel(nodeInfo.element)}`);
    }
  };

  // 查找最近可点击祖先
  const handleFindClickableAncestor = () => {
    if (!selectedNode) {
      message.warning('请先选择一个节点');
      return;
    }

    const nearestClickable = findNearestClickableAncestor(selectedNode);
    if (nearestClickable) {
      message.success(`找到最近的可点击祖先：${ElementAnalyzer.getElementLabel(nearestClickable)}`);
      onElementSelect(nearestClickable);
      if (onFindNearestClickable) {
        onFindNearestClickable();
      }
    } else {
      message.info('未找到可点击的祖先元素');
    }
  };

  // 如果树为空
  if (isEmpty) {
    return (
      <Card className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <InfoCircleOutlined style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }} />
          <Title level={4} style={{ color: 'var(--text-muted)' }}>暂无架构数据</Title>
          <Text style={{ color: 'var(--text-muted)' }}>请检查元素数据是否正确加载</Text>
        </div>
      </Card>
    );
  }

  // 如果树结构无效
  if (!isTreeValid) {
    return (
      <Card className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4} style={{ color: 'var(--error)' }}>架构树验证失败</Title>
          <Text style={{ color: 'var(--text-muted)' }}>检测到以下问题：</Text>
          <ul style={{ textAlign: 'left', marginTop: '16px' }}>
            {treeValidation.errors.map((error, index) => (
              <li key={index} style={{ color: 'var(--error)' }}>{error}</li>
            ))}
          </ul>
        </div>
      </Card>
    );
  }

  return (
    <div className="architecture-diagram light-theme-force">
      {/* 顶部工具栏 */}
      <Card 
        size="small" 
        className="light-theme-force"
        style={{ marginBottom: '16px', background: 'var(--bg-light-base)' }}
      >
        <Space split={<span style={{ color: 'var(--border-muted)' }}>|</span>}>
          <Space>
            <Button 
              icon={<AimOutlined />} 
              onClick={expandToTarget}
              size="small"
            >
              定位目标
            </Button>
            <Button 
              icon={<ExpandOutlined />} 
              onClick={expandAll}
              size="small"
            >
              展开全部
            </Button>
            <Button 
              icon={<CompressOutlined />} 
              onClick={collapseAll}
              size="small"
            >
              收起全部
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={resetSelection}
              size="small"
            >
              重置
            </Button>
          </Space>
          
          {hasSelection && (
            <Button 
              icon={<EyeOutlined />} 
              onClick={handleFindClickableAncestor}
              type="primary"
              size="small"
            >
              查找可点击祖先
            </Button>
          )}
        </Space>
      </Card>

      {/* 统计信息 */}
      <Card 
        size="small" 
        className="light-theme-force"
        style={{ marginBottom: '16px', background: 'var(--bg-light-base)' }}
      >
        <Space wrap>
          <Tag color="blue">总节点: {treeStatistics.totalNodes}</Tag>
          <Tag color="green">最大深度: {treeStatistics.maxDepth}</Tag>
          <Tag color="orange">可点击: {treeStatistics.clickableNodes}</Tag>
          <Tag color="purple">有文本: {treeStatistics.textNodes}</Tag>
          {hasOverlaps && <Tag color="red">重叠: {visualizationStats.overlappingCount}</Tag>}
          {hasLayoutIssues && <Tag color="warning">布局问题: {layoutIssues.length}</Tag>}
        </Space>
      </Card>

      {/* 主要内容区 */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* 左侧：层级树 */}
        <Card 
          title="架构层级" 
          className="light-theme-force"
          style={{ 
            flex: 1, 
            background: 'var(--bg-light-base)',
            minHeight: '400px'
          }}
          bodyStyle={{ padding: '12px' }}
        >
          <Tree
            treeData={treeData}
            selectedKeys={selectedNode ? [selectedNode] : []}
            expandedKeys={expandedKeys}
            onSelect={handleNodeSelect}
            onExpand={handleNodeExpand}
            showIcon
            blockNode
            className="architecture-tree light-theme-force"
          />
        </Card>

        {/* 右侧：节点详情 */}
        {hasSelection && selectedNodeInfo && (
          <Card 
            title="节点详情" 
            className="light-theme-force"
            style={{ 
              width: '320px', 
              background: 'var(--bg-light-base)' 
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 基本信息 */}
              <div>
                <Text strong style={{ color: 'var(--text-inverse)' }}>
                  {selectedNodeInfo.report.icon} {selectedNodeInfo.report.label}
                </Text>
              </div>

              {/* 元素类型和特征 */}
              <div>
                <Text type="secondary" style={{ color: 'var(--text-muted)' }}>
                  {selectedNodeInfo.report.description}
                </Text>
              </div>

              {/* 特征标签 */}
              <div>
                <Space wrap>
                  {selectedNodeInfo.report.features.map((feature, index) => (
                    <Tag key={index}>{feature}</Tag>
                  ))}
                </Space>
              </div>

              {/* 层级信息 */}
              <div>
                <Text style={{ color: 'var(--text-inverse)' }}>
                  <strong>层级:</strong> {selectedNodeInfo.node.level}
                </Text>
                <br />
                <Text style={{ color: 'var(--text-inverse)' }}>
                  <strong>关系:</strong> {selectedNodeInfo.node.relationship}
                </Text>
              </div>

              {/* 最近可点击祖先 */}
              {selectedNodeInfo.nearestClickable && (
                <div>
                  <Text style={{ color: 'var(--text-inverse)' }}>
                    <strong>可点击祖先:</strong>
                  </Text>
                  <br />
                  <Text 
                    style={{ 
                      color: 'var(--brand)', 
                      cursor: 'pointer' 
                    }}
                    onClick={() => onElementSelect(selectedNodeInfo.nearestClickable!)}
                  >
                    {ElementAnalyzer.getElementLabel(selectedNodeInfo.nearestClickable)}
                  </Text>
                </div>
              )}

              {/* 操作按钮 */}
              <div style={{ marginTop: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    block 
                    onClick={() => handleNodeDoubleClick(selectedNodeInfo.node.id)}
                  >
                    选择此元素
                  </Button>
                  
                  {selectedNodeInfo.nearestClickable && (
                    <Button 
                      block 
                      type="dashed"
                      onClick={() => onElementSelect(selectedNodeInfo.nearestClickable!)}
                    >
                      选择可点击祖先
                    </Button>
                  )}
                </Space>
              </div>
            </Space>
          </Card>
        )}
      </div>

      {/* 底部：布局问题警告 */}
      {hasLayoutIssues && (
        <Card 
          size="small" 
          className="light-theme-force"
          style={{ 
            marginTop: '16px', 
            background: 'var(--bg-light-base)',
            borderColor: 'var(--warning)'
          }}
        >
          <Title level={5} style={{ color: 'var(--warning)', margin: 0 }}>
            布局分析警告
          </Title>
          <ul style={{ margin: '8px 0 0 0', color: 'var(--text-inverse)' }}>
            {layoutIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default ArchitectureDiagram;