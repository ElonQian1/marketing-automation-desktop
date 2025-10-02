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
  } = props as ConfirmPopoverBaseProps;

  const commonProps: PopconfirmProps = {
    open,
    placement,
    onCancel,
    // title is required in PopconfirmProps typings
    title: (props as any).title as React.ReactNode,
    overlayStyle: { pointerEvents: 'auto', ...(overlayStyle || {}) },
    overlayClassName: overlayClassName ?? 'light-theme-force',
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
      showCancel={false}
      okButtonProps={{ style: { display: 'none' } }}
      title={title}
    >
      {children || <div style={{ width: 1, height: 1, opacity: 0 }} />}
    </Popconfirm>
  );
};

export default ConfirmPopover;
