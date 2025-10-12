// src/services/unified-view-data-manager.ts
// module: unified-view | layer: service | role: manager
// summary: unified-view-data-manager.ts 文件

/**
 * 统一视图数据管理器 - 向后兼容导出
 * 
 * ⚠️  注意: 此文件已重构为模块化结构
 * 新代码请使用: import { UnifiedViewDataManager } from '@/services/unified-view-data'
 */

// 重新导出所有内容以保持向后兼容
export * from './unified-view-data';
export { UnifiedViewDataManager as default } from './unified-view-data';