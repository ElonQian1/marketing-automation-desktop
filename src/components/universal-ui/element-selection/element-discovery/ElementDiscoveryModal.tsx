/**
 * 元素发现模态框
 * 提供父容器、子元素、自己和智能推荐的四个分类展示
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Tabs, Empty, Spin, Alert } from 'antd';
import { 
  ContainerOutlined, 
  AppstoreOutlined, 
  UserOutlined, 
  BulbOutlined 
} from '@ant-design/icons';
import type { UIElement } from '../../../../api/universalUIAPI';
import type { 
  DiscoveredElement, 
  ElementDiscoveryResult, 
  DiscoveryOptions 
} from './types';
import { useElementDiscovery } from './useElementDiscovery';
import { ParentElementCard } from './ParentElementCard';
import { ChildElementCard } from './ChildElementCard';
import { SelfElementCard } from './SelfElementCard';

// 模态框属性接口
export interface ElementDiscoveryModalProps {
  open: boolean;
  onClose: () => void;
  targetElement: UIElement | null;
  onElementSelect: (element: UIElement) => void;
  allElements: UIElement[];
  discoveryOptions?: Partial<DiscoveryOptions>;
}

// 主组件
export const ElementDiscoveryModal: React.FC<ElementDiscoveryModalProps> = ({
  open,
  onClose,
  targetElement,
  onElementSelect,
  allElements,
  discoveryOptions = {}
}) => {
  const [activeTab, setActiveTab] = useState<string>('self');

  // 使用元素发现Hook
  const {
    discoveryResult,
    discoverElements, 
    isAnalyzing,
    error
  } = useElementDiscovery(allElements, discoveryOptions);

  // 执行发现分析 - 使用ref来避免无限循环
  const discoverElementsRef = React.useRef(discoverElements);
  discoverElementsRef.current = discoverElements;

  React.useEffect(() => {
    if (targetElement && open) {
      console.log('🔍 开始执行元素发现分析:', targetElement);
      discoverElementsRef.current(targetElement);
    }
  }, [targetElement, open]);

  // 处理元素选择
  const handleElementSelect = useCallback((discoveredElement: DiscoveredElement) => {
    onElementSelect(discoveredElement.element);
    onClose();
  }, [onElementSelect, onClose]);

  // 处理元素详情查看
  const handleShowDetails = useCallback((discoveredElement: DiscoveredElement) => {
    console.log('🔍 查看元素详情:', discoveredElement);
    // TODO: 实现元素详情展示功能
  }, []);

  // 渲染自己标签页
  const renderSelfTab = () => {
    if (!discoveryResult?.selfElement) {
      return <Empty description="无法显示当前元素信息" />;
    }

    return (
      <div style={{ padding: '16px' }}>
        <SelfElementCard
          key="self-element"
          element={discoveryResult.selfElement}
          onSelect={handleElementSelect}
          onShowDetails={handleShowDetails}
        />
      </div>
    );
  };

  // 渲染父容器标签页
  const renderParentsTab = () => {
    const parents = discoveryResult?.parentElements || [];
    
    if (parents.length === 0) {
      return <Empty description="未发现父容器元素" />;
    }

    return (
      <div style={{ padding: '16px' }}>
        {parents.map((parent, index) => (
          <ParentElementCard
            key={`parent-${parent.element.id}-${index}`}
            element={parent}
            onSelect={handleElementSelect}
            onShowDetails={handleShowDetails}
            style={{ marginBottom: '12px' }}
          />
        ))}
      </div>
    );
  };

  // 渲染子元素标签页
  const renderChildrenTab = () => {
    const children = discoveryResult?.childElements || [];
    
    if (children.length === 0) {
      return <Empty description="未发现子元素" />;
    }

    return (
      <div style={{ padding: '16px' }}>
        {children.map((child, index) => (
          <ChildElementCard
            key={`child-${child.element.id}-${index}`}
            element={child}
            onSelect={handleElementSelect}
            onShowDetails={handleShowDetails}
            style={{ marginBottom: '12px' }}
          />
        ))}
      </div>
    );
  };

  // 渲染智能推荐标签页
  const renderRecommendedTab = () => {
    const recommended = discoveryResult?.recommendedMatches || [];
    
    if (recommended.length === 0) {
      return <Empty description="暂无智能推荐" />;
    }

    return (
      <div style={{ padding: '16px' }}>
        {recommended.map((element, index) => {
          // 根据关系类型选择对应的卡片组件
          const CardComponent = element.relationship === 'parent' 
            ? ParentElementCard 
            : ChildElementCard;
            
          return (
            <CardComponent
              key={`recommended-${element.element.id}-${index}`}
              element={element}
              onSelect={handleElementSelect}
              onShowDetails={handleShowDetails}
              style={{ marginBottom: '12px' }}
            />
          );
        })}
      </div>
    );
  };

  // 计算标签页项目
  const tabItems = useMemo(() => {
    const selfCount = discoveryResult?.selfElement ? 1 : 0;
    const parentCount = discoveryResult?.parentElements?.length || 0;
    const childCount = discoveryResult?.childElements?.length || 0;
    const recommendedCount = discoveryResult?.recommendedMatches?.length || 0;

    return [
      {
        key: 'self',
        label: (
          <span>
            <UserOutlined />
            自己 ({selfCount})
          </span>
        ),
        children: renderSelfTab()
      },
      {
        key: 'parents',
        label: (
          <span>
            <ContainerOutlined />
            父容器 ({parentCount})
          </span>
        ),
        children: renderParentsTab()
      },
      {
        key: 'children',
        label: (
          <span>
            <AppstoreOutlined />
            子元素 ({childCount})
          </span>
        ),
        children: renderChildrenTab()
      },
      {
        key: 'recommended',
        label: (
          <span>
            <BulbOutlined />
            智能推荐 ({recommendedCount})
          </span>
        ),
        children: renderRecommendedTab()
      }
    ];
  }, [discoveryResult]);

  return (
    <Modal
      title={`元素发现 - ${targetElement?.id || '未知元素'}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="正在分析元素层次结构..." />
        </div>
      )}
      
      {error && (
        <Alert
          message="分析失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {!isAnalyzing && !error && discoveryResult && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
        />
      )}
    </Modal>
  );
};

export default ElementDiscoveryModal;
