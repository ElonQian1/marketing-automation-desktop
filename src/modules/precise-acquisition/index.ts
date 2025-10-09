/**
 * 精准获客系统主导出文件
 * 
 * 整合所有子模块的导出，提供统一的模块接口
 */

// 主服务门面
export { PreciseAcquisitionService } from './PreciseAcquisitionService';

// ==================== 核心类型 ====================
export * from './shared/types/core';

// ==================== 常量配置 ====================
export * from './shared/constants';

// ==================== 工具函数 ====================
export * from './shared/utils';

// ==================== 新模块组件 ====================
// 模板管理
export * from './template-management';

// 评论收集
export * from './comment-collection';

// 任务引擎
export * from './task-engine';

// 频控和去重
export * from './rate-control';

// 审计系统
export * from './audit-system';

// 报告系统
export * from './reporting';

// 日报导出
export * from './daily-reports';

// 审计系统
export * from './audit-system';