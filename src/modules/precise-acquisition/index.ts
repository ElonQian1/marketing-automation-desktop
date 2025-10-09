/**
 * 精准获客模块统一导出
 * 
 * 提供所有模块的统一访问入口
 */

// ==================== 核心类型 ====================
export * from './shared/types/core';

// ==================== 常量配置 ====================
export * from './shared/constants';

// ==================== 工具函数 ====================
export * from './shared/utils';

// ==================== 模块组件 ====================
// 候选池管理
export * from './candidate-pool';

// 评论采集
export * from './comment-collection';

// 任务引擎
export * from './task-engine';

// 查重频控
export * from './rate-limit';

// 话术管理
export * from './template-management';

// 日报导出
export * from './daily-reports';

// 审计系统
export * from './audit-system';