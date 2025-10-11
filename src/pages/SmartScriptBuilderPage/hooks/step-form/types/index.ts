// src/pages/SmartScriptBuilderPage/hooks/step-form/types/index.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * Step Form Hook 类型定义
 * 从 useStepForm.tsx 中提取的类型定义
 */

import { FormInstance } from "antd";
import type { ExtendedSmartScriptStep } from "../../../../../types/loopScript";
import type { XmlSnapshot } from "../../../../../types/selfContainedScript";

// 快照修复模式
export interface SnapshotFixMode {
  enabled: boolean;
  forStepId?: string;
}

// 设备信息简化类型
export interface DeviceInfo {
  id: string;
  name?: string;
}

// Hook依赖项
export interface UseStepFormDeps {
  form?: FormInstance;
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  // 设备/上下文
  devices: DeviceInfo[];
  currentDeviceId: string;
  currentXmlContent: string;
  currentDeviceInfo: Partial<XmlSnapshot['deviceInfo']>;
  currentPageInfo: Partial<XmlSnapshot['pageInfo']>;
  // 工作流/页面分析相关联动
  setShowContactWorkflowSelector: (v: boolean) => void;
  setSnapshotFixMode: React.Dispatch<React.SetStateAction<SnapshotFixMode>>;
  setPendingAutoResave: (v: boolean) => void;
  setIsQuickAnalyzer: (v: boolean) => void;
  setEditingStepForParams: (step: ExtendedSmartScriptStep | null) => void;
  setShowPageAnalyzer: (v: boolean) => void;
  // 放行一次无XML保存
  allowSaveWithoutXmlOnce: boolean;
  setAllowSaveWithoutXmlOnce: (v: boolean) => void;
}

// Hook返回值
export interface UseStepFormReturn {
  // 状态
  isModalVisible: boolean;
  editingStep: ExtendedSmartScriptStep | null;
  form: FormInstance;
  
  // 操作方法
  showAddModal: (options?: { resetFields?: boolean }) => void;
  showEditModal: (step: ExtendedSmartScriptStep) => void;
  hideModal: () => void;
  handleSaveStep: () => Promise<void>;
  handleDeleteStep: (stepId: string) => void;
  duplicateStep: (step: ExtendedSmartScriptStep) => void;
  
  // 工具方法
  getStepById: (stepId: string) => ExtendedSmartScriptStep | undefined;
  validateCurrentStep: () => Promise<boolean>;
}

// 表单处理器配置
export interface FormHandlerConfig {
  form: FormInstance;
  editingStep: ExtendedSmartScriptStep | null;
  setEditingStep: (step: ExtendedSmartScriptStep | null) => void;
  setIsModalVisible: (visible: boolean) => void;
}

// 步骤保存处理器配置
export interface StepSaveHandlerConfig {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  currentDeviceId: string;
  currentXmlContent: string;
  currentDeviceInfo: Partial<XmlSnapshot['deviceInfo']>;
  currentPageInfo: Partial<XmlSnapshot['pageInfo']>;
  allowSaveWithoutXmlOnce: boolean;
  setAllowSaveWithoutXmlOnce: (v: boolean) => void;
}

// XML验证处理器配置
export interface XmlValidationHandlerConfig {
  currentXmlContent: string;
  currentDeviceInfo: Partial<XmlSnapshot['deviceInfo']>;
  currentPageInfo: Partial<XmlSnapshot['pageInfo']>;
}