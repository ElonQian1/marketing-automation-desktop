import React, { useState, useEffect, useRef } from 'react';
import { Space, Button } from 'antd';
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
  // 新增：模态框状态检测
  isModalOpen?: boolean; // 是否有模态框打开
  onOutsideClick?: () => void; // 外部点击回调
  // 新增：外部关闭触发器
  shouldClose?: boolean; // 外部控制的关闭信号
}

export const ElementSelectionPopover: React.FC<ElementSelectionPopoverProps> = ({
  visible,
  selection,
  onConfirm,
  onCancel,
  allElements = [],
  onElementSelect,
  isModalOpen = false,
  onOutsideClick,
  shouldClose = false
}) => {
  // 元素发现模态框状态
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // 使用智能定位计算气泡位置
  const positioning = useSmartPopoverPosition(
    selection?.position || null,
    {
      preferredPlacement: 'top',
      popoverSize: { width: 220, height: 100 },
      margin: 12
    }
  );

  // 智能z-index计算：模态框打开时自动隐藏气泡或使用更低层级
  const getZIndex = () => {
    if (isModalOpen && !discoveryModalOpen) {
      return -1; // 模态框打开且不是发现模态框时，隐藏气泡
    }
    return discoveryModalOpen ? 1100 : 999; // 发现模态框时使用更高层级，否则低于模态框
  };

  // ESC键监听
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) {
        console.log('🎯 ESC键触发关闭气泡');
        onCancel();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [visible, onCancel]);

  // 外部点击监听 - 简化版本
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      console.log('🎯 [外部点击监听] 检测到点击事件:', {
        visible,
        target: event.target,
        tagName: (event.target as Element)?.tagName,
        className: (event.target as Element)?.className
      });
      
      if (!visible) {
        console.log('🎯 [外部点击监听] 气泡不可见，忽略点击');
        return;
      }
      
      const target = event.target as Element;
      
      // 检查是否点击在气泡内部
      if (popoverRef.current && popoverRef.current.contains(target)) {
        console.log('🎯 [外部点击监听] 点击在气泡内部，不关闭');
        return;
      }
      
      console.log('🎯 [外部点击监听] 确认外部点击，关闭气泡');
      onCancel();
    };

    if (visible) {
      console.log('🎯 [外部点击监听] 添加简化版事件监听器');
      // 立即添加监听器，但使用 setTimeout 延迟到下一个事件循环
      setTimeout(() => {
        document.addEventListener('click', handleOutsideClick, true);
        console.log('🎯 [外部点击监听] 事件监听器已添加');
      }, 50);
      
      return () => {
        console.log('🎯 [外部点击监听] 清理事件监听器');
        document.removeEventListener('click', handleOutsideClick, true);
      };
    }
  }, [visible, onCancel]);

  // 发现模态框状态变化时的处理
  useEffect(() => {
    if (discoveryModalOpen) {
      console.log('🎯 发现模态框打开，气泡调整层级');
    }
  }, [discoveryModalOpen]);

  // 外部关闭信号监听
  useEffect(() => {
    if (shouldClose && visible) {
      console.log('🎯 收到外部关闭信号，关闭气泡');
      onCancel();
    }
  }, [shouldClose, visible, onCancel]);

  // 智能显示控制
  const shouldShow = visible && selection && positioning && getZIndex() > 0;
  
  if (!shouldShow) {
    return null;
  }

  console.log('🎯 气泡定位计算:', {
    原始点击位置: selection.position,
    计算后位置: positioning.position,
    placement: positioning.placement,
    zIndex: getZIndex(),
    isModalOpen
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
          zIndex: getZIndex(),
          pointerEvents: 'auto', // 🔥 修复：允许点击事件
        }}
        onClick={(e) => {
          console.log('🎯 气泡容器点击，阻止冒泡到外部');
          e.stopPropagation();
        }}
      >
        {/* 自定义气泡实现，避免Ant Design事件干扰 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '8px 12px',
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            maxWidth: '220px',
            fontSize: '12px'
          }}
          onClick={(e) => {
            console.log('🎯 气泡内部点击，阻止冒泡');
            e.stopPropagation();
          }}
        >
          <div style={{ color: '#666', marginBottom: '4px' }}>
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
                console.log('🎯 ElementSelectionPopover: onConfirm called');
                e.stopPropagation();
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
                  console.log('🎯 ElementSelectionPopover: 打开发现元素模态框');
                  e.stopPropagation();
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
                console.log('🎯 ElementSelectionPopover: onCancel called');
                e.stopPropagation();
                // 关闭所有相关模态框
                if (discoveryModalOpen) {
                  setDiscoveryModalOpen(false);
                }
                onCancel();
              }}
              style={{ fontSize: '11px' }}
            >
              隐藏
            </Button>
          </Space>
        </div>
      </div>
      
      {/* 元素发现模态框 */}
      <ElementDiscoveryModal
        open={discoveryModalOpen}
        onClose={() => setDiscoveryModalOpen(false)}
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