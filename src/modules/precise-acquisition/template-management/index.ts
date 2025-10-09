/**
 * 话术模板管理模块导出
 * 
 * 统一导出模板管理相关的组件、服务和类型
 */

export { TemplateManager } from './components/TemplateManager';
export { 
  TemplateManagementService,
  type TemplateVariable,
  type TemplateCategory,
  type SensitiveWordCheckResult,
  type TemplateContext,
  type TemplateRenderResult
} from './services/TemplateManagementService';