// src/components/universal-ui/common-popover/ConfirmPopover.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Popconfirm } from 'antd';
import type { PopconfirmProps } from 'antd';
import type { ButtonProps } from 'antd';

export interface ConfirmPopoverBaseProps {
  open?: boolean; // allow uncontrolled usage
  placement?: PopconfirmProps['placement'];
  children?: React.ReactNode;
  overlayStyle?: React.CSSProperties;
  overlayClassName?: string;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
  /**
   * When user clicks outside and Popconfirm requests to close (open -> false),
   * call onCancel() automatically. Default: true.
   */
  autoCancelOnOutsideClick?: boolean;
}

// Default mode: keep antd's ok/cancel buttons
export interface ConfirmPopoverDefaultModeProps extends ConfirmPopoverBaseProps {
  mode?: 'default';
  title?: React.ReactNode;
  description?: React.ReactNode;
  onConfirm?: () => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  disabled?: boolean;
}

// Custom mode: hide antd buttons, render custom actions via title/content
export interface ConfirmPopoverCustomModeProps extends ConfirmPopoverBaseProps {
  mode?: 'custom'; // default
  title: React.ReactNode; // usually contains custom action buttons
}

export type ConfirmPopoverProps =
  | ConfirmPopoverDefaultModeProps
  | ConfirmPopoverCustomModeProps;

/**
 * AntD Popconfirm wrapper with sane defaults:
 * - mode="custom" (default): Hide default OK/Cancel buttons (render custom actions in title slot)
 * - mode="default": Keep antd default buttons for drop-in usage
 * - Overlay always enables pointer events to allow interactive content
 */
const ConfirmPopover: React.FC<ConfirmPopoverProps> = (props) => {
  const {
    open,
    placement = 'top',
    children,
    overlayStyle,
    overlayClassName,
    onCancel,
    onOpenChange,
    autoCancelOnOutsideClick = true,
  } = props as ConfirmPopoverBaseProps;

  const handleOpenChange = (nextOpen: boolean) => {
    try {
      if (onOpenChange) onOpenChange(nextOpen);
      // 用户点击空白或遮罩时，antd 会尝试关闭；此时我们触发 onCancel 以清理上层选择
      if (autoCancelOnOutsideClick && nextOpen === false) {
        onCancel?.();
      }
    } catch (err) {
      // no-op safeguard
      if (process.env.NODE_ENV === 'development') {
         
        console.error('[ConfirmPopover] onOpenChange error:', err);
      }
    }
  };

  const commonProps: PopconfirmProps = {
    open,
    placement,
    onCancel,
    // title is required in PopconfirmProps typings
    title: (props as any).title as React.ReactNode,
    overlayStyle: { pointerEvents: 'auto', ...(overlayStyle || {}) },
    overlayClassName: overlayClassName,
  };

  if ((props as ConfirmPopoverDefaultModeProps).mode === 'default') {
    const {
      title,
      description,
      onConfirm,
      okText,
      cancelText,
      okButtonProps,
      cancelButtonProps,
      disabled,
    } = props as ConfirmPopoverDefaultModeProps;

    return (
      <Popconfirm
        {...commonProps}
        destroyOnHidden
        onOpenChange={handleOpenChange}
        title={title}
        description={description}
        onConfirm={onConfirm}
        okText={okText}
        cancelText={cancelText}
        okButtonProps={okButtonProps}
        cancelButtonProps={cancelButtonProps}
        disabled={disabled}
      >
        {children || <div style={{ width: 1, height: 1, opacity: 0 }} />}
      </Popconfirm>
    );
  }

  // custom mode (default)
  const { title } = props as ConfirmPopoverCustomModeProps;
  return (
    <Popconfirm
      {...commonProps}
      destroyOnHidden
      onOpenChange={handleOpenChange}
      showCancel={false}
      okButtonProps={{ style: { display: 'none' } }}
      title={title}
    >
      {children || <div style={{ width: 1, height: 1, opacity: 0 }} />}
    </Popconfirm>
  );
};

export default ConfirmPopover;
