// src/pages/SmartScriptBuilderPage/hooks/page-finder/types/index.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * Page Finder Hook 类型定义 - 模块化版本
 * 简化的类型定义，去除复杂依赖
 */

import { FormInstance } from "antd";

// 快照修复模式
export type SnapshotFixMode = 'none' | 'reload' | 'clear' | 'retry';

// 页面分析器选项
export interface PageAnalyzerOptions {
  enableChildNodeExtraction?: boolean;
  enableParentNodeExtraction?: boolean;
  enableAdvancedMatching?: boolean;
  maxDepth?: number;
}

// Hook依赖项
export interface UsePageFinderDeps {
  onSnapshotUpdate?: (xmlContent: string) => void;
  onElementSelected?: (element: any) => void;
  onStepGenerated?: (step: any) => void;
}

// 设备信息
export interface DeviceInfo {
  id: string;
  name: string;
  isOnline: boolean;
}

// Hook返回值
export interface UsePageFinderReturn {
  // 状态
  isVisible: boolean;
  isLoading: boolean;
  currentXmlContent: string;
  selectedElement: any;
  fixMode: SnapshotFixMode;
  analyzerOptions: PageAnalyzerOptions;
  deviceInfo: DeviceInfo | null;
  
  // 操作方法
  openModal: () => Promise<void>;
  closeModal: () => void;
  refreshSnapshot: () => Promise<void>;
  handleElementSelect: (element: any) => Promise<void>;
  applySnapshotFix: (mode: SnapshotFixMode) => Promise<void>;
  updateAnalyzerOptions: (options: Partial<PageAnalyzerOptions>) => void;
  
  // 处理器访问（调试用）
  snapshotHandler: any;
  elementSelectionHandler: any;
}

// Handler配置接口
export interface SnapshotHandlerConfig {
  form: FormInstance;
  currentXmlContent: string;
  setCurrentXmlContent: (content: string) => void;
  setIsLoading: (loading: boolean) => void;
  onSnapshotUpdate?: (xmlContent: string) => void;
}

export interface ElementSelectionHandlerConfig {
  currentXmlContent: string;
  selectedDevice: string;
  analyzerOptions: PageAnalyzerOptions;
  onElementSelected?: (element: any) => void;
  onStepGenerated?: (step: any) => void;
}