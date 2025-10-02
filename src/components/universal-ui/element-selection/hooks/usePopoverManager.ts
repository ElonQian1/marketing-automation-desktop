/**
 * 简单的气泡卡片管理 Hook
 * 解决外部点击、ESC键、模态框层级问题
 */
import { useEffect, useRef } from 'react';

interface UsePopoverManagerOptions {
  visible: boolean;
  onClose: () => void;
  hasModalOpen?: boolean; // 是否有模态框打开
}

export const usePopoverManager = ({
  visible,
  onClose,
  hasModalOpen = false
}: UsePopoverManagerOptions) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // 🎯 外部点击关闭（简化版）
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 检查点击是否在气泡外部
      const isOutsidePopover = popoverRef.current && 
        !popoverRef.current.contains(target);
      
      // 检查是否点击了模态框内部
      const isInsideModal = target.closest('.ant-modal');
      
      if (isOutsidePopover && !isInsideModal && !hasModalOpen) {
        console.log('🔔 [usePopoverManager] 外部点击，关闭气泡');
        onClose();
      }
    };

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose, hasModalOpen]);

  // 🎯 ESC键关闭
  useEffect(() => {
    if (!visible) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !hasModalOpen) {
        console.log('🔔 [usePopoverManager] ESC键关闭气泡');
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [visible, onClose, hasModalOpen]);

  return {
    popoverRef
  };
};