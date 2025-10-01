import React from "react";
import { Modal } from "antd";

type ModalProps = React.ComponentProps<typeof Modal>;

export interface ModalAdapterProps extends ModalProps {
  /** 统一尺寸配置 */
  size?: "small" | "medium" | "large" | "fullscreen";
  /** 是否可通过点击遮罩关闭，默认 true */
  maskClosable?: boolean;
  /** 是否显示关闭按钮，默认 true */
  closable?: boolean;
  /** 关闭时销毁子元素，默认 true */
  destroyOnClose?: boolean;
}

const getSizeConfig = (size: ModalAdapterProps['size']) => {
  switch (size) {
    case 'small':
      return { width: 480 };
    case 'medium':
      return { width: 720 };
    case 'large':
      return { width: 1000 };
    case 'fullscreen':
      return { width: '100vw', style: { top: 0, maxWidth: 'none' } };
    default:
      return { width: 520 }; // default
  }
};

/**
 * Modal 对话框适配器
 */
export const ModalAdapter: React.FC<ModalAdapterProps> = ({ 
  size = "medium",
  maskClosable = true,
  closable = true,
  destroyOnClose = true,
  ...rest 
}) => {
  const sizeConfig = getSizeConfig(size);
  
  return (
    <Modal
      maskClosable={maskClosable}
      closable={closable}
      destroyOnClose={destroyOnClose}
      {...sizeConfig}
      {...rest}
    />
  );
};

/**
 * Modal confirm 确认对话框适配器
 */
export const ConfirmAdapter = Modal.confirm;

/**
 * Modal info 信息对话框适配器
 */
export const InfoAdapter = Modal.info;

/**
 * Modal success 成功对话框适配器
 */
export const SuccessAdapter = Modal.success;

/**
 * Modal error 错误对话框适配器
 */
export const ErrorAdapter = Modal.error;

/**
 * Modal warning 警告对话框适配器
 */
export const WarningAdapter = Modal.warning;

export default ModalAdapter;