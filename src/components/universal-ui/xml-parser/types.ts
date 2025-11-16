// src/components/universal-ui/xml-parser/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * XML解析模块类型定义
 */

// VisualUIElement接口（从主文件提取）
export interface VisualUIElement {
  id: string;
  text: string;
  description: string;
  type: string;
  category: string;
  position: { x: number; y: number; width: number; height: number };
  clickable: boolean;
  importance: 'high' | 'medium' | 'low';
  userFriendlyName: string;
  // 🔧 新增：resource-id等关键属性
  resourceId?: string;
  contentDesc?: string;
  className?: string;
  bounds?: string; // 原始bounds字符串，如"[45,1059][249,1263]"
  xmlIndex?: number; // 🔧 新增：原始 XML 节点索引（用于精确追踪）
  indexPath?: number[]; // 🎯 新增：绝对下标链（用于静态定位）
}

// 增强的UI元素接口
export interface EnhancedUIElement extends VisualUIElement {
  // 增强的属性
  resourceId?: string;
  className?: string;
  package?: string;
  contentDesc?: string;
  checkable?: boolean;
  checked?: boolean;
  enabled?: boolean;
  focusable?: boolean;
  focused?: boolean;
  scrollable?: boolean;
  selected?: boolean;
  bounds?: string;
  
  // 层次结构信息
  xpath?: string;
  depth?: number;
  childCount?: number;
  parentType?: string;
  
  // 上下文信息
  context?: {
    surroundingElements: VisualUIElement[];
    hierarchyPath: string[];
    actionHints: string[];
  };
}

// 元素分类定义
export interface VisualElementCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  elements: VisualUIElement[];
}

// XML节点原始数据
export interface RawXmlNode {
  getAttribute: (name: string) => string | null;
  [key: string]: any;
}

// 边界信息
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// XML解析结果
export interface XmlParseResult {
  elements: VisualUIElement[];
  categories: VisualElementCategory[];
  appInfo: {
    appName: string;
    pageName: string;
  };
}

// 元素分类器选项
export interface ElementCategorizerOptions {
  includeNonClickable?: boolean;
  strictFiltering?: boolean;
}

// 应用页面分析结果
export interface AppPageInfo {
  appName: string;
  pageName: string;
  packageName: string;
  navigationTexts: string[];
  selectedTabs: string[];
}