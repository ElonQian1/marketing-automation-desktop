/**
 * Message 消息适配器 - Employee D 架构
 * 
 * 目的：为页面层提供统一的消息通知，避免直连AntD message
 * 原则：适配器统一、品牌化一致、零覆盖
 */

import { message } from 'antd';

/**
 * Message 消息适配器
 * 封装 AntD message 全局方法，提供统一的消息接口
 */
export const MessageAdapter = {
  success: message.success,
  error: message.error,
  info: message.info,
  warning: message.warning,
  loading: message.loading,
  open: message.open,
  destroy: message.destroy,
  config: message.config,
};

// 直接导出为 message，便于替换 antd message
export { message };

export default MessageAdapter;