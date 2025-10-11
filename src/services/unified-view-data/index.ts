// src/services/unified-view-data/index.ts
// module: shared | layer: unknown | role: component
// summary: index.ts 文件

/**
 * 统一视图数据管理器 - 模块化导出
 */

// 主管理器类
export { UnifiedViewDataManager } from './UnifiedViewDataManager';

// 类型定义
export * from './types';

// 工具类
export { CacheManager } from './utils/CacheManager';
export { ElementEnhancer } from './utils/ElementEnhancer';

// 数据生成器
export { TreeViewDataGenerator } from './generators/TreeViewDataGenerator';
export { VisualViewDataGenerator } from './generators/VisualViewDataGenerator';
export { ListViewDataGenerator } from './generators/ListViewDataGenerator';