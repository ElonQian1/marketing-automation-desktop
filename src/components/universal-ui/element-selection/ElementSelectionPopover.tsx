import React, { useState, useEffect, useRef } from 'react';
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
  // 气泡容器引用
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // 🔧 生命周期管理：监听外部点击
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果点击的不是气泡内部且不是模态框，则关闭气泡
      if (
        visible && 
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        !discoveryModalOpen && // 发现模态框打开时不关闭气泡
        !(event.target as HTMLElement)?.closest('.ant-modal') // 点击模态框内部时不关闭
      ) {
        console.log('🔔 [ElementSelectionPopover] 外部点击，关闭气泡');
        onCancel();
      }
    };

    if (visible) {
      // 延迟添加监听器，避免立即触发
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [visible, onCancel, discoveryModalOpen]);

  // 🔧 生命周期管理：组件卸载时清理状态
  useEffect(() => {
    return () => {
      if (discoveryModalOpen) {
        setDiscoveryModalOpen(false);
      }
    };
  }, []);

  // 🔧 监听模态框状态变化，模态框关闭时也关闭气泡
  useEffect(() => {
    if (!discoveryModalOpen && visible) {
      // 模态框关闭后延迟一点再允许外部点击关闭气泡
      const timer = setTimeout(() => {
        console.log('🔔 [ElementSelectionPopover] 发现模态框已关闭');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [discoveryModalOpen, visible]);

  // 🔧 监听ESC键关闭气泡
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible && !discoveryModalOpen) {
        console.log('🔔 [ElementSelectionPopover] ESC键关闭气泡');
        onCancel();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [visible, onCancel, discoveryModalOpen]);
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
      <div
        ref={popoverRef}
        key={`selection-${selection.element.id}`}
        style={{
          position: 'fixed',
          left: positioning.position.x,
          top: positioning.position.y,
          zIndex: discoveryModalOpen ? 1050 : 10000, // 模态框打开时降低气泡层级
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
      </div>
      
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