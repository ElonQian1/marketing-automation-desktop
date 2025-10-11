// src/pages/SmartScriptBuilderPage/components/step-edit-modal/types/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Step Edit Modal 类型定义
 */

import type { FormInstance } from 'antd/es/form';
import type { ExtendedSmartScriptStep } from '../../../../../types/loopScript';

// 主模态框属性
export interface StepEditModalProps {
  open: boolean;
  editingStep?: ExtendedSmartScriptStep | null;
  form: FormInstance;
  currentDeviceId?: string;
  onOk: () => void;
  onCancel: () => void;
  onShowNavigationModal: () => void;
  onShowPageAnalyzer: () => void;
}

// 表单基础部分属性
export interface FormBasicSectionProps {
  form: FormInstance;
}

// 参数渲染部分属性
export interface ParametersRenderSectionProps {
  form: FormInstance;
  editingStep?: ExtendedSmartScriptStep | null;
  currentDeviceId?: string;
}

// 操作按钮部分属性
export interface ActionButtonsSectionProps {
  onShowNavigationModal: () => void;
  onShowPageAnalyzer: () => void;
}

// 主题控制属性
export interface ThemeControlSectionProps {
  theme: any;
  setTheme: (theme: any) => void;
}