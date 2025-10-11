// src/pages/SmartScriptBuilderPage/components/step-edit-modal/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Step Edit Modal 模块化导出
 * 提供简化的步骤编辑模态框和相关组件
 */

// 主组件导出
export { default as StepEditModalModular } from './StepEditModalModular';
export { default as StepEditModal } from './StepEditModalModular'; // 兼容别名

// 子组件导出
export { FormBasicSection } from './components/FormBasicSection';
export { ParametersRenderSection } from './components/ParametersRenderSection';
export { ActionButtonsSection } from './components/ActionButtonsSection';
export { ThemeControlSection } from './components/ThemeControlSection';

// 类型导出
export type {
  StepEditModalProps,
  FormBasicSectionProps,
  ParametersRenderSectionProps,
  ActionButtonsSectionProps,
  ThemeControlSectionProps,
} from './types';