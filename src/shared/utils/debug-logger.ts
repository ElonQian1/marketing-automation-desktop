// src/shared/utils/debug-logger.ts
// module: shared | layer: utils | role: debug-logger
// summary: 调试日志控制工具

declare global {
  interface Window {
    DEBUG_VISUAL_LOGS?: boolean;
    enableVisualLogs?: () => void;
    disableVisualLogs?: () => void;
  }
}

/**
 * 启用可视化组件调试日志
 * 在浏览器控制台执行: window.enableVisualLogs()
 */
export function enableVisualLogs() {
  window.DEBUG_VISUAL_LOGS = true;
  console.log("✅ 已启用可视化组件调试日志");
}

/**
 * 禁用可视化组件调试日志
 * 在浏览器控制台执行: window.disableVisualLogs()
 */
export function disableVisualLogs() {
  window.DEBUG_VISUAL_LOGS = false;
  console.log("❌ 已禁用可视化组件调试日志");
}

/**
 * 检查是否应该输出调试日志
 */
export function shouldLogDebug(): boolean {
  return process.env.NODE_ENV === 'development' && Boolean(window.DEBUG_VISUAL_LOGS);
}

/**
 * 条件性调试日志输出
 */
export function debugLog(tag: string, message: string, data?: unknown): void {
  if (shouldLogDebug()) {
    if (data) {
      console.log(`${tag} ${message}`, data);
    } else {
      console.log(`${tag} ${message}`);
    }
  }
}

// 在开发模式下将控制函数绑定到全局对象
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.enableVisualLogs = enableVisualLogs;
  window.disableVisualLogs = disableVisualLogs;
  
  // 默认禁用调试日志
  window.DEBUG_VISUAL_LOGS = false;
  
  console.log(`
🔧 可视化调试日志控制:
- 启用: window.enableVisualLogs()
- 禁用: window.disableVisualLogs()
- 当前状态: ${window.DEBUG_VISUAL_LOGS ? '启用' : '禁用'}
  `);
}