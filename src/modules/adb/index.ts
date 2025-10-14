// src/modules/adb/index.ts
// module: adb | layer: public | role: barrel
// summary: ADB模块对外公共出口（契约/用例/Hook）

/**
 * ADB设备管理模块主导出文件
 * 
 * 仅导出对外稳定的API，不泄露内部实现细节
 */

// ==================== UI组件 ====================
export { AdbStepCard } from './components/adb-step-card';
export type { AdbStepCardProps } from './components/adb-step-card';

// ==================== 公共Hooks ====================
export * from './hooks';

// ==================== 应用层用例 ====================
export * from './application';

// ==================== 领域层公共契约 ====================
// 只导出公共类型和接口，不导出内部实现
export type {
  Device,
  AdbConnection,
  DiagnosticResult
} from './domain/entities';

// ==================== 状态管理 ====================
export * from './stores';

// Note: 不导出内部实现细节（如 services、api 等）