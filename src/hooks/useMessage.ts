// src/hooks/useMessage.ts
// module: shared | layer: application | role: 状态钩子
// summary: React状态管理和业务逻辑封装

// 消息 API Hook - 统一管理消息通知
import { App } from 'antd';

/**
 * 统一的消息 API Hook
 * 用于替代静态的 message API
 */
export const useMessage = () => {
  const { message } = App.useApp();
  return message;
};

/**
 * 统一的通知 API Hook  
 * 用于替代静态的 notification API
 */
export const useNotification = () => {
  const { notification } = App.useApp();
  return notification;
};

/**
 * 统一的模态框 API Hook
 * 用于替代静态的 Modal API
 */
export const useModal = () => {
  const { modal } = App.useApp();
  return modal;
};