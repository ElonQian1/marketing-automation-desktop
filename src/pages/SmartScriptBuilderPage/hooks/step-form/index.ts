// src/pages/SmartScriptBuilderPage/hooks/step-form/index.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * Step Form 模块化导出
 * 提供简化的步骤表单Hook和相关类型
 */

// 主Hook导出
export { useStepFormModular as useStepForm } from './useStepFormModular';

// 处理器类导出
export { FormHandler } from './handlers/FormHandler';
export { StepSaveHandler } from './handlers/StepSaveHandler';

// 类型导出
export type {
  UseStepFormDeps,
  UseStepFormReturn,
  SnapshotFixMode,
  DeviceInfo,
  FormHandlerConfig,
  StepSaveHandlerConfig,
  XmlValidationHandlerConfig,
} from './types/index';

// 便利导出
export { useStepFormModular } from './useStepFormModular';