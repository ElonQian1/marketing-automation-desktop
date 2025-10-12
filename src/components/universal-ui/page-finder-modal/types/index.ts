// src/components/universal-ui/page-finder-modal/types/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Page Finder Modal 相关类型定义
 * 从 UniversalPageFinderModal.tsx 中提取的类型定义
 */

import { UIElement } from "../../../../api/universalUIAPI";

// 重新导出 UIElement 类型
export type { UIElement };

// XML 快照类型 - 与self-contained/xmlSnapshot.ts保持一致
export interface XmlSnapshot {
  id?: string;  // 可选，保持向后兼容
  xmlContent: string;
  xmlHash: string;  // 必需字段，与self-contained版本一致
  timestamp: number;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    appPackage: string;
    activityName: string;
  };
  pageInfo?: {
    pageTitle: string;
    pageType: string;
    elementCount: number;
    appVersion?: string;
  };
}

// 节点定位器类型
export interface NodeLocator {
  xpath?: string;
  bounds?: string;
  text?: string;
  resourceId?: string;
  className?: string;
  contentDesc?: string;
  package?: string;
}

// UI 匹配条件类型
export interface UIMatchCriteria {
  strategy: string;
  fields: string[];
  values: Record<string, string>;
  includes?: Record<string, string[]>;
  excludes?: Record<string, string[]>;
  matchMode?: Record<string, "equals" | "contains" | "regex">;
  regexIncludes?: Record<string, string[]>;
  regexExcludes?: Record<string, string[]>;
}

// 可视化 UI 元素类型
export type { VisualUIElement } from "../../types";

// 视图模式类型
export type ViewMode = "visual" | "tree" | "list" | "grid" | "mirror";

// Page Finder Modal 属性类型
export interface UniversalPageFinderModalProps {
  visible: boolean;
  onClose: () => void;
  onElementSelected?: (element: UIElement) => void;
  
  // 仅采集快照模式：打开后直接采集当前设备页面快照并通过回调返回，不进行元素选择
  snapshotOnlyMode?: boolean;
  onSnapshotCaptured?: (snapshot: XmlSnapshot) => void;
  onXmlContentUpdated?: (
    xmlContent: string,
    deviceInfo?: {
      deviceId: string;
      deviceName: string;
      appPackage: string;
      activityName: string;
    },
    pageInfo?: {
      pageTitle: string;
      pageType: string;
      elementCount: number;
      appVersion?: string;
    }
  ) => void;
  
  // 当任意来源加载XML后，统一回调已构建的 XmlSnapshot（保证父级随时可用）
  onSnapshotUpdated?: (snapshot: XmlSnapshot) => void;
  initialViewMode?: ViewMode;
  
  // 从步骤XML源加载
  loadFromStepXml?: {
    stepId: string;
    xmlCacheId?: string;
    xmlContent?: string; // 优先使用内嵌的XML数据（自包含脚本）
    deviceId?: string; // 设备信息（用于显示）
    deviceName?: string; // 设备名称
  };
  
  // 修改参数时预选元素定位器（基于步骤指纹构建）
  preselectLocator?: NodeLocator;
  
  // 当在"网格检查器/节点详情"里选择了匹配策略并点击"应用到步骤"时回调
  onApplyCriteria?: (criteria: UIMatchCriteria) => void;
  
  // 初始匹配预设（来自步骤参数.matching），用于覆盖"最近缓存"
  initialMatching?: UIMatchCriteria;
}

// 设备信息类型
export interface DeviceInfo {
  id: string;
  name: string;
  status: string;
  model?: string;
  androidVersion?: string;
}