// src/components/precise-acquisition/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 精准获客增强组件统一导出
 * 
 * 本文件导出所有新创建的增强组件，包括：
 * - 增强的任务管理仪表盘
 * - 风控机制管理面板
 * - 模板管理系统
 */

// 核心管理组件
export { default as EnhancedTaskManagementDashboard } from './EnhancedTaskManagementDashboard';
export { default as RiskControlManagementPanel } from './RiskControlManagementPanel';
export { default as TemplateManagementSystem } from './TemplateManagementSystem';

/**
 * 使用指南：
 * 
 * 1. 任务管理：
 *    ```tsx
 *    import { EnhancedTaskManagementDashboard } from '@/components/precise-acquisition';
 *    <EnhancedTaskManagementDashboard />
 *    ```
 * 
 * 2. 风控管理：
 *    ```tsx
 *    import { RiskControlManagementPanel } from '@/components/precise-acquisition';
 *    <RiskControlManagementPanel />
 *    ```
 * 
 * 3. 模板管理：
 *    ```tsx
 *    import { TemplateManagementSystem } from '@/components/precise-acquisition';
 *    <TemplateManagementSystem />
 *    ```
 */