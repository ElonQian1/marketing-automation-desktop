import React, { useState } from 'react';
import { Popconfirm, Space, Button } from 'antd';
import { CheckOutlined, EyeInvisibleOutlined, SearchOutlined } from '@ant-design/icons';
import type { UIElement } from '../../../api/universalUIAPI';
import { useSmartPopoverPosition } from './utils/popoverPositioning';
import { ElementDiscoveryModal } from './element-discovery';
import { usePopoverManager } from './hooks/usePopoverManager';
import { SmartPopoverContainer } from './components/SmartPopoverContainer';

export interface ElementSelectionState {
  element: UIElement;
  position: { x: number; y: number };
  confirmed: boolean;
}

export interface ElementSelectionPopoverProps {
  visible: boolean;
  selection: ElementSelectionState | null;
  onConfirm: () => void;
  onCancel: () => void;
  // 新增：元素发现功能支持
  allElements?: UIElement[]; // 所有可用元素，用于发现分析
  onElementSelect?: (element: UIElement) => void; // 当从发现结果中选择新元素时回调
}

export const ElementSelectionPopover: React.FC<ElementSelectionPopoverProps> = ({
  visible,
  selection,
  onConfirm,
  onCancel,
  allElements = [],
  onElementSelect
}) => {
  // 元素发现模态框状态
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  
  // 🎯 使用简化的气泡管理hook
  const { popoverRef } = usePopoverManager({
    visible,
    onClose: onCancel,
    hasModalOpen: discoveryModalOpen
  });
  // 使用智能定位计算气泡位置
  const positioning = useSmartPopoverPosition(
    selection?.position || null,
    {
      preferredPlacement: 'top',
      popoverSize: { width: 220, height: 100 },
      margin: 12
    }
  );

  if (!visible || !selection || !positioning) {
    return null;
  }

  console.log('🎯 气泡定位计算:', {
    原始点击位置: selection.position,
    计算后位置: positioning.position,
    placement: positioning.placement
  });

  return (
    <>
      <SmartPopoverContainer
        visible={visible}
        hasModalOpen={discoveryModalOpen}
        position={positioning.position}
        containerRef={popoverRef}
      >
        <Popconfirm
          open={visible}
          title={
            <div style={{ maxWidth: '220px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                选择此元素？
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                {selection.element.text || 
                 selection.element.resource_id || 
                 selection.element.class_name || '未知元素'}
              </div>
              
              {/* 自定义按钮组 */}
              <Space size={4} wrap>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={(e) => {
                    if (e) e.stopPropagation();
                    console.log('🎯 ElementSelectionPopover: onConfirm called');
                    onConfirm();
                  }}
                  style={{ fontSize: '11px' }}
                >
                  确定
                </Button>
                
                {/* 发现元素按钮 - 仅在有完整数据时显示 */}
                {allElements.length > 0 && onElementSelect && (
                  <Button
                    size="small"
                    icon={<SearchOutlined />}
                    onClick={(e) => {
                      if (e) e.stopPropagation();
                      console.log('🎯 ElementSelectionPopover: 打开发现元素模态框');
                      setDiscoveryModalOpen(true);
                    }}
                    style={{ fontSize: '11px' }}
                  >
                    发现元素
                  </Button>
                )}
                
                <Button
                  size="small"
                  icon={<EyeInvisibleOutlined />}
                  onClick={(e) => {
                    if (e) e.stopPropagation();
                    console.log('🎯 ElementSelectionPopover: onCancel called');
                    onCancel();
                  }}
                  style={{ fontSize: '11px' }}
                >
                  隐藏
                </Button>
              </Space>
            </div>
          }
          description=""
          showCancel={false} // 禁用默认的取消/确认按钮
          showArrow={true}
          placement={positioning.placement}
          arrow={{ pointAtCenter: true }}
          getPopupContainer={() => document.body}
        >
          {/* 不可见的触发器 */}
          <div style={{ 
            width: 1, 
            height: 1, 
            opacity: 0,
            pointerEvents: 'auto'
          }} />
        </Popconfirm>
      </SmartPopoverContainer>
      
      {/* 元素发现模态框 */}
      <ElementDiscoveryModal
        open={discoveryModalOpen}
        onClose={() => {
          console.log('🔔 [ElementSelectionPopover] 发现模态框关闭');
          setDiscoveryModalOpen(false);
        }}
        targetElement={selection?.element || null}
        onElementSelect={(element: UIElement) => {
          console.log('🎯 从发现模态框选择新元素:', element);
          // 选择新元素并关闭所有弹窗
          onElementSelect?.(element);
          setDiscoveryModalOpen(false);
          onCancel(); // 关闭原始气泡
        }}
        allElements={allElements}
      />
    </>
  );
};