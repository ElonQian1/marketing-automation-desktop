// src/components/LoopCards/index.ts
// module: ui | layer: ui | role: export
// summary: 循环卡片相关组件和工具统一导出

/**
 * 循环卡片组件和同步工具统一导出
 * 提供完整的循环卡片数据同步解决方案
 */

// 核心同步Hook
export { default as useLoopSync } from './useLoopSync';

// 演示和测试组件
export { default as LoopSyncDemo } from './LoopSyncDemo';
export { default as LoopSyncTest } from './LoopSyncTest';

// 重新导出类型（便于使用）
export type { LoopConfig, ExtendedSmartScriptStep } from '../../types/loopScript';