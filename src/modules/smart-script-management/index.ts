// src/modules/smart-script-management/index.ts
// module: script-builder | layer: public | role: barrel
// summary: 脚本构建模块对外公共出口（契约/用例/Hook）

/**
 * 智能脚本管理模块主导出文件
 * 
 * 仅导出对外稳定的API，不泄露内部实现细节
 */

// ==================== 公共Hooks ====================
export * from './hooks/useScriptManager';

// ==================== 主要UI组件 ====================
export { default as ScriptManager } from './components/ScriptManager';

// ==================== 核心工具 ====================
// 导出必要的序列化工具（内部组件需要使用）
export { ScriptSerializer } from './utils/serializer';

// ==================== 核心类型 ====================
export type {
  SmartScript,
  SmartScriptStep,
  ScriptListItem,
  ScriptExecutionResult,
  ScriptTemplate,
  ScriptConfig
} from './types';

// Note: 保持API稳定性，只导出必要的公共接口