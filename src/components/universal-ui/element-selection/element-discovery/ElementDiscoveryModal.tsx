// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Tabs, Space, Button, Alert, Typography, Spin, Empty } from 'antd';
import { 
  SearchOutlined, 
  NodeIndexOutlined, 
  BranchesOutlined,
  UserOutlined,
  TeamOutlined,
  AimOutlined
} from '@ant-design/icons';
import { useElementDiscovery } from './useElementDiscovery';
import { ParentElementCard } from './ParentElementCard';
import { ChildElementCard } from './ChildElementCard';
import { SelfElementCard } from './SelfElementCard';
import { DiscoveredElement, DiscoveryOptions } from './types';
import type { UIElement } from '../../../../api/universal-ui';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ElementDiscoveryModalProps {
  open: boolean;
  onClose: () => void;
  targetElement: UIElement | null;
  onElementSelect: (element: UIElement) => void;
  allElements: UIElement[];
}

/**
 * 元素发现模态框 - 显示父子元素分析结果
 * 帮助用户找到更好的匹配策略和元素选择
 */
export const ElementDiscoveryModal: React.FC<ElementDiscoveryModalProps> = ({
  open,
  onClose,
  targetElement,
  onElementSelect,
  allElements,
}) => {
  // 状态管理
  const [selectedTab, setSelectedTab] = useState<string>('self');
  const [previewElement, setPreviewElement] = useState<DiscoveredElement | null>(null);
  
  // 发现选项配置
  const discoveryOptions: DiscoveryOptions = useMemo(() => ({
    includeParents: true,
    includeChildren: true,
    includeSiblings: false, // 先不包含兄弟元素
    maxDepth: 3,
    minConfidence: 0.3,
    prioritizeText: true,
    prioritizeClickable: true,
    prioritizeTextElements: true, // 向后兼容
    prioritizeClickableElements: true, // 向后兼容
  }), []);

  // 使用元素发现钩子
  const { 
    discoveryResult,
    discoverElements, 
    isAnalyzing,
    error
  } = useElementDiscovery(allElements, discoveryOptions);

  // 执行发现分析
  React.useEffect(() => {
    if (targetElement && open) {
      console.log('🔍 开始执行元素发现分析:', targetElement);
      discoverElements(targetElement);
    }
  }, [targetElement, open, discoverElements]);

  // 处理元素选择
  const handleElementSelect = useCallback((discoveredElement: DiscoveredElement) => {
    onElementSelect(discoveredElement.element);
    onClose();
  }, [onElementSelect, onClose]);

  // 处理元素详情查看
  const handleShowDetails = useCallback((discoveredElement: DiscoveredElement) => {
    setPreviewElement(discoveredElement);
  }, []);

  // 处理预览元素关闭
  const handleClosePreview = useCallback(() => {
    setPreviewElement(null);
  }, []);

  // 渲染自己标签页
  const renderSelfTab = () => {
    if (!discoveryResult?.selfElement) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" align="center">
              <Text type="secondary">当前元素信息不可用</Text>
            </Space>
          }
        />
      );
    }

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="当前选中元素"
          description="这是您当前选中的元素，您可以直接使用它，或选择其他发现的元素"
          style={{ marginBottom: 8 }}
        />
        
        <SelfElementCard
          element={discoveryResult.selfElement}
          onSelect={handleElementSelect}
          onShowDetails={handleShowDetails}
        />
      </Space>
    );
  };

  // 渲染父元素标签页
  const renderParentsTab = () => {
    if (!discoveryResult?.parentElements.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" align="center">
              <Text type="secondary">未找到合适的父容器元素</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                当前元素可能已经是顶层容器
              </Text>
            </Space>
          }
        />
      );
    }

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="父容器分析"
          description="以下是包含目标元素的父容器，通常具有更稳定的定位特征"
          style={{ marginBottom: 8 }}
        />
        
        {discoveryResult.parentElements.map((parent, index) => (
          <ParentElementCard
            key={`parent-${parent.element.id}-${index}`}
            element={parent}
            onSelect={handleElementSelect}
            onPreview={handleShowDetails}
            compact={false}
          />
        ))}
      </Space>
    );
  };

  // 渲染子元素标签页
  const renderChildrenTab = () => {
    if (!discoveryResult?.childElements.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" align="center">
              <Text type="secondary">未找到包含文本的子元素</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                当前元素可能已经是最小粒度的元素
              </Text>
            </Space>
          }
        />
      );
    }

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert
          type="success"
          showIcon
          message="子元素分析"
          description="以下是包含文本或可交互的子元素，可能提供更精确的定位"
          style={{ marginBottom: 8 }}
        />
        
        {discoveryResult.childElements.map((child, index) => (
          <ChildElementCard
            key={`child-${child.element.id}-${index}`}
            element={child as any}
            onSelect={handleElementSelect as any}
            onShowDetails={handleShowDetails as any}
          />
        ))}
      </Space>
    );
  };

  // 渲染推荐标签页
  const renderRecommendedTab = () => {
    if (!discoveryResult?.recommendedMatches.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" align="center">
              <Text type="secondary">暂无推荐元素</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                请查看父容器或子元素标签页
              </Text>
            </Space>
          }
        />
      );
    }

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert
          type="warning"
          showIcon
          message="智能推荐"
          description="基于元素特征和用户习惯推荐的最佳匹配候选"
          style={{ marginBottom: 8 }}
        />
        
        {discoveryResult.recommendedMatches
          .sort((a, b) => b.confidence - a.confidence) // 按置信度排序
          .map((recommended, index) => {
            if (recommended.relationship === 'parent') {
              return (
                <ParentElementCard
                  key={`recommended-parent-${recommended.element.id}-${index}`}
                  element={recommended as any}
                  onSelect={handleElementSelect as any}
                  onPreview={handleShowDetails as any}
                  compact={true}
                />
              );
            } else if (recommended.relationship === 'self') {
              return (
                <SelfElementCard
                  key={`recommended-self-${recommended.element.id}-${index}`}
                  element={recommended as any}
                  onSelect={handleElementSelect as any}
                  onShowDetails={handleShowDetails as any}
                />
              );
            } else {
              return (
                <ChildElementCard
                  key={`recommended-child-${recommended.element.id}-${index}`}
                  element={recommended as any}
                  onSelect={handleElementSelect as any}
                  onShowDetails={handleShowDetails as any}
                />
              );
            }
          })}
      </Space>
    );
  };

  if (!targetElement) return null;

  return (
    <>
      {/* 主发现模态框 */}
      <Modal
        title={
          <Space>
            <SearchOutlined />
            <span>元素发现分析</span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {targetElement.text ? `"${targetElement.text}"` : targetElement.element_type}
            </Text>
          </Space>
        }
        open={open}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>
        ]}
        styles={{
          body: { maxHeight: '70vh', overflow: 'auto' }
        }}
      >
        <Spin spinning={isAnalyzing} tip="正在分析元素层次结构...">
          {error && (
            <Alert
              type="error"
              message="分析失败"
              description={error}
              style={{ marginBottom: 16 }}
              closable
            />
          )}

          {discoveryResult && (
            <Tabs
              activeKey={selectedTab}
              onChange={setSelectedTab}
              items={[
                {
                  key: 'self',
                  label: (
                    <Space>
                      <AimOutlined />
                      <span>自己</span>
                      <Text type="secondary">(当前选中)</Text>
                    </Space>
                  ),
                  children: renderSelfTab(),
                },
                {
                  key: 'parents',
                  label: (
                    <Space>
                      <NodeIndexOutlined />
                      <span>父容器</span>
                      <Text type="secondary">({discoveryResult.parentElements.length})</Text>
                    </Space>
                  ),
                  children: renderParentsTab(),
                },
                {
                  key: 'children',
                  label: (
                    <Space>
                      <BranchesOutlined />
                      <span>子元素</span>
                      <Text type="secondary">({discoveryResult.childElements.length})</Text>
                    </Space>
                  ),
                  children: renderChildrenTab(),
                },
                {
                  key: 'recommended',
                  label: (
                    <Space>
                      <UserOutlined />
                      <span>智能推荐</span>
                      <Text type="secondary">({discoveryResult.recommendedMatches.length})</Text>
                    </Space>
                  ),
                  children: renderRecommendedTab(),
                },
              ]}
            />
          )}
        </Spin>
      </Modal>

      {/* 元素详情预览模态框 */}
      {previewElement && (
        <Modal
          title={
            <Space>
              <TeamOutlined />
              <span>元素详情</span>
            </Space>
          }
          open={!!previewElement}
          onCancel={handleClosePreview}
          width={600}
          footer={[
            <Button key="select" type="primary" onClick={() => handleElementSelect(previewElement)}>
              选择此元素
            </Button>,
            <Button key="close" onClick={handleClosePreview}>
              关闭
            </Button>
          ]}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {/* 基本信息 */}
            <div>
              <Title level={5}>基本信息</Title>
              <Space direction="vertical" size={4}>
                <Text><strong>元素类型:</strong> {previewElement.element.element_type}</Text>
                <Text><strong>文本内容:</strong> {previewElement.element.text || '无'}</Text>
                <Text><strong>资源ID:</strong> {previewElement.element.resource_id || '无'}</Text>
                <Text><strong>类名:</strong> {previewElement.element.class_name || '无'}</Text>
                <Text><strong>可点击:</strong> {previewElement.element.is_clickable ? '是' : '否'}</Text>
              </Space>
            </div>

            {/* 位置信息 */}
            <div>
              <Title level={5}>位置信息</Title>
              <Text>
                边界: [{previewElement.element.bounds.left}, {previewElement.element.bounds.top}, {previewElement.element.bounds.right}, {previewElement.element.bounds.bottom}]
              </Text>
            </div>

            {/* XPath */}
            <div>
              <Title level={5}>XPath</Title>
              <Text code copyable style={{ wordBreak: 'break-all' }}>
                {previewElement.element.xpath}
              </Text>
            </div>

            {/* 发现信息 */}
            <div>
              <Title level={5}>发现信息</Title>
              <Space direction="vertical" size={4}>
                <Text><strong>关系:</strong> {
                  previewElement.relationship === 'parent' ? '父元素' :
                  previewElement.relationship === 'self' ? '当前选中元素' : '子元素'
                }</Text>
                <Text><strong>置信度:</strong> {(previewElement.confidence * 100).toFixed(1)}%</Text>
                <Text><strong>推荐原因:</strong> {previewElement.reason}</Text>
              </Space>
            </div>
          </Space>
        </Modal>
      )}
    </>
  );
};

export default ElementDiscoveryModal;