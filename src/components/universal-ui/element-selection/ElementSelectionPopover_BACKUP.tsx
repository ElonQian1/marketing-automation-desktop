import React, { useState, useEffect } from 'react';
import { Space, Button } from 'antd';
import ConfirmPopover from '../common-popover/ConfirmPopover';
import { CheckOutlined, EyeInvisibleOutlined, SearchOutlined } from '@ant-design/icons';
import type { UIElement } from '../../../api/universalUIAPI';
import { useSmartPopoverPosition } from './utils/popoverPositioning';
import { ElementDiscoveryModal } from './element-discovery';
import { 
  usePopoverLifecycleManager, 
  PopoverStateValidator, 
  PopoverStateMonitor 
} from './hooks/usePopoverLifecycleManager';
import { usePopoverInteractionManager } from './hooks/useGlobalInteractionManager';
import { usePopoverZIndex } from './utils/zIndexManager';
import { usePopoverUserExperience } from './utils/advancedUserExperience';
import { usePopoverPerformanceMonitor } from './utils/performanceMonitor';
// Legacy backup removed. Intentionally left blank to avoid compilation.
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
        <ConfirmPopover
          open={visible}
          title={
  onElementSelect
}) => {
  // 元素发现模态框状态
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  
  // 生成唯一ID
  const popoverId = `element-popover-${selection?.element.id || 'unknown'}`;
  
        >
    enableDebugLog: true
        </ConfirmPopover>

  // 🆕 状态监控
  const monitor = PopoverStateMonitor.getInstance();

  // 🆕 交互管理 - 点击空白和ESC键清理
  const interactionManager = usePopoverInteractionManager(
    () => {
      console.log('🎯 [ElementSelectionPopover] 检测到点击空白，执行清理');
      performanceMonitor.onClickOutside();
      onCancel();
    },
    () => {
      console.log('⌨️ [ElementSelectionPopover] 检测到ESC键，执行清理');
      onCancel();
    }
  );

  // 🆕 Z轴层级管理
  const { zIndex } = usePopoverZIndex(popoverId, 'universal-page-finder-modal');

  // 🆕 用户体验优化
  const userExperience = usePopoverUserExperience(visible);

  // 🆕 性能监控
  const performanceMonitor = usePopoverPerformanceMonitor(popoverId);

  // 使用智能定位计算气泡位置
  const positioning = useSmartPopoverPosition(
    selection?.position || null,
    {
      preferredPlacement: 'top',
      popoverSize: { width: 220, height: 100 },
      margin: 12
    }
  );

  // 🆕 状态验证和监控
  useEffect(() => {
    // 注册当前状态到监控器
    monitor.registerPopover(popoverId, selection);
    
    // 状态验证
    const issues = PopoverStateValidator.detectAbnormalState(
      selection, 
      true, // 假设模态框可见（由父组件控制）
      'ElementSelectionPopover'
    );
    
    if (issues.length > 0) {
      console.warn('⚠️ [ElementSelectionPopover] 检测到异常状态:', issues);
    }
    
    return () => {
      monitor.registerPopover(popoverId, null);
    };
  }, [selection, monitor, popoverId]);

  // 🆕 激活/停用交互监听
  useEffect(() => {
    if (visible && selection) {
      performanceMonitor.onShow();
      interactionManager.activatePopoverInteraction();
    } else {
      performanceMonitor.onHide();
      interactionManager.deactivatePopoverInteraction();
    }

    return () => {
      interactionManager.deactivatePopoverInteraction();
    };
  }, [visible, selection, interactionManager, performanceMonitor]);

  // 🆕 验证是否应该显示
  const shouldShow = PopoverStateValidator.shouldShowPopover(
    visible, 
    selection, 
    true // 模态框状态由父组件管理
  );

  if (!shouldShow || !positioning) {
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
        key={`selection-${selection.element.id}`}
        className="element-selection-popover"
        style={{
          position: 'fixed',
          left: positioning.position.x,
          top: positioning.position.y,
          zIndex, // 🔧 动态Z轴层级管理
          pointerEvents: 'none',
          ...userExperience.getPopoverStyle(), // 🎨 用户体验动画样式
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
                    performanceMonitor.onConfirm(); // 🔊 性能监控
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
                    performanceMonitor.onCancel(); // 🔊 性能监控
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