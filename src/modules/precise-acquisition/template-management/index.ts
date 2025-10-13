// src/modules/precise-acquisition/template-management/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 话术模板管理模块导出
 * 
 * 统一导出模板管理相关的组件、服务和类型
 */

export { TemplateManager } from './components/TemplateManager';
export { 
  ProspectingTemplateManagementService,
  type TemplateVariable,
  type TemplateCategory,
  type SensitiveWordCheckResult,
  type TemplateContext,
  type TemplateRenderResult
} from './services/prospecting-template-service';