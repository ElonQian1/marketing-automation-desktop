// 元素选择气泡组件（稳定版）
// 说明：提供默认导出与具名导出 ElementSelectionPopover，避免导入歧义

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ConfirmPopover from '../common-popover/ConfirmPopover';
// icons are handled inside PopoverActionButtons
import { PopoverActionButtons } from './components/PopoverActionButtons';
import type { PopoverActionTokens } from './components/tokens';
import type { UIElement } from '../../../api/universalUIAPI';
import { useSmartPopoverPosition } from './utils/popoverPositioning';
import { ElementDiscoveryModal } from './element-discovery';
import { isDevDebugEnabled } from '../../../utils/debug';

export interface ElementSelectionState {
  element: UIElement;
  position: { x: number; y: number };
  confirmed: boolean;
}

export interface ElementSelectionPopoverProps {
  visible: boolean;
  selection: ElementSelectionState | null;
  onConfirm: () => void;
  onCancel: () => void; // 取消选择并关闭
  onHide?: () => void;  // 隐藏元素（与业务 hide 行为绑定）
  allElements?: UIElement[];
  onElementSelect?: (element: UIElement) => void;
  actionTokens?: Partial<PopoverActionTokens>; // 注入尺寸/间距令牌
  // 定位增强配置（可选）
  autoPlacement?: boolean;
  autoPlacementMode?: 'area' | 'linear';
  snapToAnchor?: boolean;
  clampRatio?: number; // 0-1, 默认 0.9
  // 点击外部自动取消（默认 true），特殊页面可关闭
  autoCancelOnOutsideClick?: boolean;
}

const ElementSelectionPopoverComponent: React.FC<ElementSelectionPopoverProps> = ({
  visible,
  selection,
  onConfirm,
  onCancel,
  onHide,
  allElements = [],
  onElementSelect,
  actionTokens,
  autoPlacement = true,
  autoPlacementMode = 'area',
  snapToAnchor = true,
  clampRatio = 0.9,
  autoCancelOnOutsideClick = true
}) => {
  const __DEV__ = process.env.NODE_ENV === 'development';
  const __DEBUG_VISUAL__ = isDevDebugEnabled('debug:visual');
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  
  // 🔧 修复：使用 useMemo 稳定 ID 引用
  const popoverId = useMemo(() => {
    return `element-popover-${selection?.element.id || 'unknown'}`;
  }, [selection?.element.id]);

  // 🔧 修复：使用 useCallback 稳定函数引用
  const handleConfirm = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 [ElementSelectionPopover] 确认选择');
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__ && __DEBUG_VISUAL__) {
      console.debug('🎯 [ElementSelectionPopover] 取消选择 - 开始执行');
      console.debug('🎯 [ElementSelectionPopover] onCancel函数:', typeof onCancel, onCancel);
    }
    onCancel();
    if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 [ElementSelectionPopover] 取消选择 - 执行完成');
  }, [onCancel]);

  const handleDiscovery = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 [ElementSelectionPopover] 打开发现模态框');
    setDiscoveryModalOpen(true);
  }, []);

  // 🔧 修复：简化的智能定位，减少重复计算
  const positioning = useSmartPopoverPosition(
    selection?.position || null,
    {
      preferredPlacement: 'top',
      popoverSize: { width: 220, height: 100 },
      margin: 12,
      autoPlacement,
      autoPlacementMode,
      snapToAnchor,
      clampRatio,
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
        if (__DEV__ && __DEBUG_VISUAL__) console.debug('⌨️ [ElementSelectionPopover] ESC键取消');
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shouldShow, handleCancel]);

  // 🔧 修复：性能监控（简化版，仅在开发环境）
  useEffect(() => {
    if (__DEV__ && __DEBUG_VISUAL__ && shouldShow) {
      console.debug('🎯 [ElementSelectionPopover] 显示气泡', {
        elementId: selection?.element.id?.substring(0, 20),
        position: selection?.position
      });
    }
  }, [__DEV__, shouldShow, selection?.element?.id, selection?.position]);

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
        <ConfirmPopover
          open={visible}
          onCancel={() => handleCancel()}
          // 关键修复：当发现模态框打开时，禁用“外部点击自动取消”
          autoCancelOnOutsideClick={!discoveryModalOpen && autoCancelOnOutsideClick}
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
              
              <PopoverActionButtons
                onConfirm={handleConfirm}
                onDiscovery={allElements.length > 0 && onElementSelect ? handleDiscovery : undefined}
                onHide={(e) => {
                  e?.stopPropagation?.();
                  if (__DEV__ && __DEBUG_VISUAL__) console.debug('🫥 [ElementSelectionPopover] 隐藏按钮被点击');
                  if (onHide) onHide(); else onCancel();
                }}
                onCancel={(e) => {
                  if (__DEV__ && __DEBUG_VISUAL__) console.debug('🖱️ [ElementSelectionPopover] 取消按钮被点击');
                  handleCancel(e);
                }}
                tokens={actionTokens}
                autoCompact
              />
            </div>
          }
          overlayStyle={{
            pointerEvents: 'auto',
            maxWidth: positioning?.suggestedMaxSize?.width,
            maxHeight: positioning?.suggestedMaxSize?.height,
            overflow: positioning?.clamped ? 'auto' : undefined,
          }}
          placement={positioning!.placement as any}
        >
          {/* 隐藏的触发元素 */}
          <div style={{ width: 1, height: 1, opacity: 0 }} />
  </ConfirmPopover>
      </div>

      {/* 元素发现模态框 */}
      {discoveryModalOpen && (
        <ElementDiscoveryModal
          open={discoveryModalOpen}
          onClose={() => setDiscoveryModalOpen(false)}
          targetElement={selection.element}
          allElements={allElements}
          onElementSelect={(element) => {
            if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 ElementSelectionPopover: 选择新发现的元素', element.id);
            onElementSelect?.(element);
            setDiscoveryModalOpen(false);
          }}
          // 防止点击冒泡到 Popconfirm 的 outside 区域
          // @ts-ignore - 组件内部容器需支持 onClick
          onClick={(e: any) => { e.stopPropagation?.(); }}
        />
      )}
    </>
  );
};

// 🔧 修复 React.memo 比较逻辑，确保事件处理器更新
const ElementSelectionPopover = React.memo(ElementSelectionPopoverComponent, (prevProps, nextProps) => {
  // 🎯 完整比较所有关键属性，包括事件处理器
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.selection?.element.id === nextProps.selection?.element.id &&
    prevProps.selection?.position.x === nextProps.selection?.position.x &&
    prevProps.selection?.position.y === nextProps.selection?.position.y &&
    prevProps.allElements.length === nextProps.allElements.length &&
    // 🔧 修复：确保事件处理器变化时组件会重新渲染
    prevProps.onConfirm === nextProps.onConfirm &&
    prevProps.onCancel === nextProps.onCancel &&
    prevProps.onHide === nextProps.onHide &&
    prevProps.onElementSelect === nextProps.onElementSelect
  );
});

ElementSelectionPopover.displayName = 'ElementSelectionPopover';

// 同时提供具名导出与默认导出，兼容两种导入方式
export { ElementSelectionPopover };
export default ElementSelectionPopover;