import React from 'react';
import { Popconfirm } from 'antd';
import { CheckOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { UIElement } from '../../../api/universalUIAPI';
import { useSmartPopoverPosition } from './utils/popoverPositioning';

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
}

export const ElementSelectionPopover: React.FC<ElementSelectionPopoverProps> = ({
  visible,
  selection,
  onConfirm,
  onCancel
}) => {
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
    <div
      key={`selection-${selection.element.id}`}
      style={{
        position: 'fixed',
        left: positioning.position.x,
        top: positioning.position.y,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      <Popconfirm
        open={visible}
        title={
          <div style={{ maxWidth: '200px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              选择此元素？
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
              {selection.element.text || 
               selection.element.resource_id || 
               selection.element.class_name || '未知元素'}
            </div>
          </div>
        }
        description=""
        okText={
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckOutlined />
            确定
          </span>
        }
        cancelText={
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <EyeInvisibleOutlined />
            隐藏
          </span>
        }
        onConfirm={(e) => {
          if (e) e.stopPropagation();
          console.log('🎯 ElementSelectionPopover: onConfirm called');
          onConfirm();
        }}
        onCancel={(e) => {
          if (e) e.stopPropagation();
          console.log('🎯 ElementSelectionPopover: onCancel called');
          onCancel();
        }}
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
    </div>
  );
};