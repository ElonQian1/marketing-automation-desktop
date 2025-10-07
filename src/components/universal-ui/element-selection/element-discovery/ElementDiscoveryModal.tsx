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
  BulbOutlined,
  NodeExpandOutlined
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
import ArchitectureDiagram from './ArchitectureDiagram';

// 模态框属性接口
export interface ElementDiscoveryModalProps {
  open: boolean;
  onClose: () => void;
  targetElement: UIElement | null;
  onElementSelect: (element: UIElement) => void;
  allElements: UIElement[];
  discoveryOptions?: Partial<DiscoveryOptions>;
  xmlContent?: string; // 🆕 添加XML内容支持
}

// 主组件
export const ElementDiscoveryModal: React.FC<ElementDiscoveryModalProps> = ({
  open,
  onClose,
  targetElement,
  onElementSelect,
  allElements,
  discoveryOptions = {},
  xmlContent // 🆕 接收XML内容
}) => {
  const [activeTab, setActiveTab] = useState<string>('self');
  const [smartTabSelected, setSmartTabSelected] = useState<boolean>(false);

  // 使用元素发现Hook
  const {
    discoveryResult,
    discoverElements, 
    isAnalyzing,
    error
  } = useElementDiscovery(allElements, {
    ...discoveryOptions,
    xmlContent // 🆕 传递XML内容给Hook
  });

  // 执行发现分析 - 使用ref来避免无限循环
  const discoverElementsRef = React.useRef(discoverElements);
  discoverElementsRef.current = discoverElements;

  React.useEffect(() => {
    if (targetElement && open) {
      if (!xmlContent) {
        console.warn('⚠️ 元素发现需要XML内容支持');
        return;
      }
      
      console.log('🔍 开始执行元素发现分析:', targetElement);
      discoverElementsRef.current(targetElement);
      
      // 重置智能tab选择标记
      setSmartTabSelected(false);
      setActiveTab('self');
    }
  }, [targetElement, open, xmlContent]);

  // 🆕 智能tab选择：当发现结果准备好时，根据元素特性选择最佳tab
  React.useEffect(() => {
    if (discoveryResult && !smartTabSelected && targetElement) {
      const childCount = discoveryResult.childElements?.length || 0;
      const siblingCount = discoveryResult.siblingElements?.length || 0;
      const parentCount = discoveryResult.parentElements?.length || 0;
      
      console.log('🎯 智能tab选择分析:', {
        targetId: targetElement.id,
        targetType: targetElement.element_type,
        isClickable: targetElement.is_clickable,
        childCount,
        siblingCount,
        parentCount,
        isImageView: targetElement.element_type?.includes('ImageView'),
        isLeafNode: childCount === 0
      });
      
      let bestTab = 'self';
      let reason = '默认显示自己';
      
      // 🆕 特殊情况：联系人按钮(element_38)优先显示架构图
      if (targetElement.id === 'element_38' || 
          (targetElement.element_type?.includes('LinearLayout') && 
           targetElement.is_clickable && 
           targetElement.bounds && 
           targetElement.bounds.left === 256 && 
           targetElement.bounds.top === 1420 && 
           targetElement.bounds.right === 464 && 
           targetElement.bounds.bottom === 1484)) {
        bestTab = 'architecture';
        reason = '联系人导航按钮，显示DOM架构图';
      }
      // 🔍 如果是ImageView图标元素且没有子元素，优先显示兄弟元素
      else if (targetElement.element_type?.includes('ImageView') && childCount === 0) {
        if (siblingCount > 0) {
          bestTab = 'siblings';
          reason = 'ImageView图标元素，显示兄弟元素（如文本标签）';
        } else if (parentCount > 0) {
          bestTab = 'parents';
          reason = 'ImageView图标元素无兄弟，显示父容器';
        }
      }
      // 🔍 如果是叶子节点（无子元素）且有兄弟元素，也优先显示兄弟
      else if (childCount === 0 && siblingCount > 0) {
        bestTab = 'siblings';
        reason = '叶子节点，显示兄弟元素';
      }
      // 🔍 如果有子元素，显示子元素
      else if (childCount > 0) {
        bestTab = 'children';
        reason = '有子元素，显示子元素';
      }
      // 🔍 如果只有父元素，显示父元素
      else if (parentCount > 0) {
        bestTab = 'parents';
        reason = '只有父元素可用';
      }
      
      if (bestTab !== 'self') {
        console.log(`🎯 智能切换到 ${bestTab} tab: ${reason}`);
        setActiveTab(bestTab);
      }
      
      setSmartTabSelected(true);
    }
  }, [discoveryResult, smartTabSelected, targetElement]);

  // 处理元素选择
  const handleElementSelect = useCallback((discoveredElement: DiscoveredElement) => {
    onElementSelect(discoveredElement.element);
    onClose();
  }, [onElementSelect, onClose]);

  // 🆕 处理架构图元素选择
  const handleArchitectureElementSelect = useCallback((element: UIElement) => {
    onElementSelect(element);
    onClose();
  }, [onElementSelect, onClose]);

  // 处理元素详情查看
  const handleShowDetails = useCallback((discoveredElement: DiscoveredElement) => {
    console.log('🔍 查看元素详情:', discoveredElement);
    // TODO: 实现元素详情展示功能
  }, []);

  // 🆕 处理查找最近可点击元素
  const handleFindNearestClickable = useCallback((element: UIElement) => {
    console.log('🎯 查找最近可点击元素:', element);
    // 自动选择找到的可点击元素
    onElementSelect(element);
    // 可以选择关闭模态框或保持打开以继续操作
    // onClose();
  }, [onElementSelect]);

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

  // 🆕 渲染兄弟元素标签页
  const renderSiblingsTab = () => {
    const siblings = discoveryResult?.siblingElements || [];
    
    if (siblings.length === 0) {
      return <Empty description="未发现兄弟元素" />;
    }

    return (
      <div style={{ padding: '16px' }}>
        {siblings.map((sibling, index) => (
          <ChildElementCard
            key={`sibling-${sibling.element.id}-${index}`}
            element={sibling}
            onSelect={handleElementSelect}
            onShowDetails={handleShowDetails}
            style={{ marginBottom: '12px' }}
          />
        ))}
      </div>
    );
  };

  // 🆕 渲染架构图标签页
  const renderArchitectureTab = () => {
    if (!targetElement) {
      return <Empty description="无目标元素" />;
    }

    return (
      <ArchitectureDiagram
        targetElement={targetElement}
        allElements={allElements}
        xmlContent={xmlContent} // 🆕 传递XML内容给纯XML结构分析器
        onElementSelect={handleArchitectureElementSelect}
      />
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
    const siblingCount = discoveryResult?.siblingElements?.length || 0; // 🆕 添加兄弟元素计数
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
        key: 'architecture', // 🆕 添加架构图tab
        label: (
          <span>
            <NodeExpandOutlined />
            架构图
          </span>
        ),
        children: renderArchitectureTab()
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
        key: 'siblings', // 🆕 添加兄弟元素tab
        label: (
          <span>
            <AppstoreOutlined />
            兄弟元素 ({siblingCount})
          </span>
        ),
        children: renderSiblingsTab()
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
