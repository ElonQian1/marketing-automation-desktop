/**
 * Message 消息适配器 - Employee D 架构
 * 
 * 目的：为页面层提供统一的消息通知，避免直连AntD message
 * 原则：适配器统一、品牌化一致、零覆盖
 * 
 * 使用方式：
 * 1. 【推荐】在 Hook 或组件中：import { useMessage } from '@/components/adapters';
 * 2. 调用：const message = useMessage();
 * 3. 使用：message.success('操作成功');
 * 
 * 4. 【兼容】静态导入：import { message } from '@/components/adapters';
 *    使用：message.success('操作成功'); // ⚠️ 会有主题警告
 * 
 * ⚠️ 注意：新代码请使用 useMessage() Hook 以支持动态主题
 */

import { App, message as antdMessage } from 'antd';

/**
 * 使用上下文化的 Message API Hook
 * 推荐：所有新代码都应使用此 Hook
 * 
 * @returns 上下文化的 message 实例，支持动态主题
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const message = useMessage();
 *   
 *   const handleClick = () => {
 *     message.success('操作成功');
 *   };
 *   
 *   return <button onClick={handleClick}>点击</button>;
 * }
 * ```
 */
export const useMessage = () => {
  const { message } = App.useApp();
  return message;
};

/**
 * Message 消息适配器（静态版本）
 * ⚠️ 推荐使用 useMessage() Hook 以支持动态主题
 * 
 * @deprecated 请优先使用 useMessage() Hook
 */
export const MessageAdapter = {
  success: antdMessage.success,
  error: antdMessage.error,
  info: antdMessage.info,
  warning: antdMessage.warning,
  loading: antdMessage.loading,
  open: antdMessage.open,
  destroy: antdMessage.destroy,
  config: antdMessage.config,
};

/**
 * 静态 message API（向后兼容）
 * ⚠️ 会触发主题上下文警告，建议使用 useMessage() Hook
 * 
 * @deprecated 请优先使用 useMessage() Hook 以支持动态主题
 */
export const message = antdMessage;

export default useMessage;