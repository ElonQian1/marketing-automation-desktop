// src/components/feature-modules/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 特征模块统一导出
 */

// 页面分析器模块
export * from './page-analyzer';

// 模块注册表
export const FeatureModules = {
  pageAnalyzer: () => import('./page-analyzer'),
  // 为未来模块预留位置
  // scriptBuilder: () => import('./script-builder'),
  // deviceManager: () => import('./device-manager'),
  // contactImport: () => import('./contact-import'),
} as const;