// src/api/universal-ui/index.ts
// module: api | layer: api | role: universal-ui-export-barrel
// summary: Universal UI API模块导出桶文件，统一导出所有UI相关接口

/**
 * Universal UI API 模块导出
 * 统一导出所有 Universal UI 相关的类型、类和工具函数
 */

// 导出类型定义
export * from './types';

// 导出核心API类
export { UniversalUIAPI } from './UniversalUIAPI';

// 导出服务类
export { UniversalUIService } from './UniversalUIService';

// 导出工具类
export { UniversalUIUtils } from './UniversalUIUtils';

// 默认导出主API类
export { UniversalUIAPI as default } from './UniversalUIAPI';