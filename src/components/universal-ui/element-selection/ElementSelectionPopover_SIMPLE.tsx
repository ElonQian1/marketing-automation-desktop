// 🚨 临时紧急修复版本 - 修复无限渲染循环
// 📁 文件位置: ElementSelectionPopover_FIXED.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Popconfirm, Space, Button } from 'antd';
import { CheckOutlined, EyeInvisibleOutlined, SearchOutlined } from '@ant-design/icons';
import type { UIElement } from '../../../api/universalUIAPI';
import { useSmartPopoverPosition } from './utils/popoverPositioning';
import { ElementDiscoveryModal } from './element-discovery';

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
  allElements?: UIElement[];
  onElementSelect?: (element: UIElement) => void;
}

const ElementSelectionPopoverComponent: React.FC<ElementSelectionPopoverProps> = ({
  visible,
  selection,
  onConfirm,
  onCancel,
  allElements = [],
  onElementSelect
}) => {
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  
  // 🔧 修复：使用 useMemo 稳定 ID 引用
  const popoverId = useMemo(() => {
    return `element-popover-${selection?.element.id || 'unknown'}`;
  }, [selection?.element.id]);

  // 🔧 修复：使用 useCallback 稳定函数引用
  const handleConfirm = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log('🎯 [ElementSelectionPopover] 确认选择');
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log('🎯 [ElementSelectionPopover] 取消选择');
    onCancel();
  }, [onCancel]);

  const handleDiscovery = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log('🎯 [ElementSelectionPopover] 打开发现模态框');
    setDiscoveryModalOpen(true);
  }, []);

  // 🔧 修复：简化的智能定位，减少重复计算
  const positioning = useSmartPopoverPosition(
    selection?.position || null,
    {
      preferredPlacement: 'top',
      popoverSize: { width: 220, height: 100 },
      margin: 12
    }
  );

  // 🔧 修复：简化的显示条件判断
  const shouldShow = useMemo(() => {
    return visible && selection && positioning;
  }, [visible, selection, positioning]);

  // 🔧 修复：ESC 键监听（简化版）
  useEffect(() => {
    if (!shouldShow) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⌨️ [ElementSelectionPopover] ESC键取消');
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shouldShow, handleCancel]);

  // 🔧 修复：性能监控（简化版，仅在开发环境）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && shouldShow) {
      console.log('🎯 [ElementSelectionPopover] 显示气泡', {
        elementId: selection?.element.id?.substring(0, 20),
        position: selection?.position
      });
    }
  }, [shouldShow, selection?.element.id, selection?.position]);

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <div
        key={popoverId}
        className="element-selection-popover"
        style={{
          position: 'fixed',
          left: positioning!.position.x,
          top: positioning!.position.y,
          zIndex: 10000, // 🔧 固定 Z-index，避免复杂计算
          pointerEvents: 'none',
        }}
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
              
              <Space size={4} wrap>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleConfirm}
                  style={{ fontSize: '11px' }}
                >
                  确定
                </Button>
                
                {allElements.length > 0 && onElementSelect && (
                  <Button
                    size="small"
                    icon={<SearchOutlined />}
                    onClick={handleDiscovery}
                    style={{ fontSize: '11px' }}
                  >
                    发现元素
                  </Button>
                )}
                
                <Button
                  size="small"
                  icon={<EyeInvisibleOutlined />}
                  onClick={handleCancel}
                  style={{ fontSize: '11px' }}
                >
                  取消
                </Button>
              </Space>
            </div>
          }
          overlayStyle={{ pointerEvents: 'auto' }}
          placement={positioning!.placement as any}
        >
          {/* 隐藏的触发元素 */}
          <div style={{ width: 1, height: 1, opacity: 0 }} />
        </Popconfirm>
      </div>

      {/* 元素发现模态框 */}
      {discoveryModalOpen && (
        <ElementDiscoveryModal
          open={discoveryModalOpen}
          onClose={() => setDiscoveryModalOpen(false)}
          targetElement={selection.element}
          allElements={allElements}
          onElementSelect={(element) => {
            console.log('🎯 ElementSelectionPopover: 选择新发现的元素', element.id);
            onElementSelect?.(element);
            setDiscoveryModalOpen(false);
          }}
        />
      )}
    </>
  );
};

// 🔧 使用 React.memo 优化渲染性能
const ElementSelectionPopover = React.memo(ElementSelectionPopoverComponent, (prevProps, nextProps) => {
  // 只有关键属性变化时才重新渲染
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.selection?.element.id === nextProps.selection?.element.id &&
    prevProps.selection?.position.x === nextProps.selection?.position.x &&
    prevProps.selection?.position.y === nextProps.selection?.position.y &&
    prevProps.allElements.length === nextProps.allElements.length
  );
});

ElementSelectionPopover.displayName = 'ElementSelectionPopover';

export { ElementSelectionPopover };
export default ElementSelectionPopover;