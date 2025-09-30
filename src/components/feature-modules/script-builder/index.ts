/**
 * 脚本构建器模块主导出文件
 * 统一导出所有脚本构建器功能
 */

// 导出类型定义
export type * from './types';

// 导出 Hooks
export * from './hooks';

// 导出组件
export * from './components';

// 主要组件的便捷导出
export { ScriptBuilderContainer as ScriptBuilder } from './components/ScriptBuilderContainer';

// 默认导出主容器组件
export { ScriptBuilderContainer as default } from './components/ScriptBuilderContainer';