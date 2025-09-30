/**
 * 页面分析器模块类型定义
 * 保持文件大小 < 500行，模块化管理类型
 */

/**
 * UI元素基础信息
 */
export interface UIElement {
  /** 元素唯一标识 */
  id: string;
  /** 元素类型 */
  type: string;
  /** 元素文本内容 */
  text: string;
  /** 资源ID */
  resourceId: string;
  /** 内容描述 */
  contentDesc: string;
  /** 包名 */
  package: string;
  /** 类名 */
  className: string;
  /** 是否可点击 */
  clickable: boolean;
  /** 是否可勾选 */
  checkable: boolean;
  /** 是否可编辑 */
  editable: boolean;
  /** 元素边界位置 */
  bounds: ElementBounds;
  /** 元素索引 */
  index: number;
  /** 父元素ID */
  parentId?: string;
  /** 子元素ID列表 */
  childrenIds: string[];
}

/**
 * 元素边界位置信息
 */
export interface ElementBounds {
  /** 左上角X坐标 */
  left: number;
  /** 左上角Y坐标 */
  top: number;
  /** 右下角X坐标 */
  right: number;
  /** 右下角Y坐标 */
  bottom: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 中心点X坐标 */
  centerX: number;
  /** 中心点Y坐标 */
  centerY: number;
}

/**
 * 匹配策略类型
 */
export type MatchStrategy = 
  | 'absolute'    // 绝对匹配，包含位置信息
  | 'strict'      // 严格匹配，语义字段组合
  | 'relaxed'     // 宽松匹配，部分字段匹配
  | 'positionless'// 无位置匹配，忽略坐标
  | 'standard'    // 标准匹配，跨设备稳定
  | 'custom';     // 自定义策略

/**
 * 匹配条件
 */
export interface MatchCriteria {
  /** 匹配策略 */
  strategy: MatchStrategy;
  /** 要匹配的字段列表 */
  fields: string[];
  /** 字段对应的值 */
  values: Record<string, string>;
  /** 包含条件 (per-field) */
  includes?: Record<string, string[]>;
  /** 排除条件 (per-field) */
  excludes?: Record<string, string[]>;
}

/**
 * 页面分析器状态
 */
export interface PageAnalyzerState {
  /** 当前XML内容 */
  xmlContent: string | null;
  /** 解析的UI元素列表 */
  elements: UIElement[];
  /** 当前选中的元素 */
  selectedElement: UIElement | null;
  /** 搜索关键词 */
  searchKeyword: string;
  /** 过滤后的元素列表 */
  filteredElements: UIElement[];
  /** 当前匹配条件 */
  matchCriteria: MatchCriteria | null;
  /** 是否显示网格 */
  showGrid: boolean;
  /** 是否显示元素边界 */
  showBounds: boolean;
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 元素树节点
 */
export interface ElementTreeNode {
  /** 元素信息 */
  element: UIElement;
  /** 子节点 */
  children: ElementTreeNode[];
  /** 是否展开 */
  expanded: boolean;
  /** 节点深度 */
  depth: number;
  /** 是否可见 */
  visible: boolean;
}

/**
 * 元素搜索过滤器
 */
export interface ElementFilter {
  /** 文本搜索 */
  text?: string;
  /** 元素类型过滤 */
  type?: string;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否有文本 */
  hasText?: boolean;
  /** 是否有资源ID */
  hasResourceId?: boolean;
  /** 包名过滤 */
  package?: string;
}

/**
 * 网格画布配置
 */
export interface GridCanvasConfig {
  /** 画布宽度 */
  width: number;
  /** 画布高度 */
  height: number;
  /** 缩放比例 */
  scale: number;
  /** 网格大小 */
  gridSize: number;
  /** 是否显示网格线 */
  showGridLines: boolean;
  /** 是否显示坐标 */
  showCoordinates: boolean;
  /** 背景颜色 */
  backgroundColor: string;
}

/**
 * 元素高亮样式
 */
export interface ElementHighlight {
  /** 边框颜色 */
  borderColor: string;
  /** 边框宽度 */
  borderWidth: number;
  /** 填充颜色 */
  fillColor: string;
  /** 填充透明度 */
  fillOpacity: number;
  /** 是否显示标签 */
  showLabel: boolean;
  /** 标签文本 */
  labelText: string;
}

/**
 * 属性面板配置
 */
export interface PropertyPanelConfig {
  /** 显示的属性列表 */
  visibleProperties: string[];
  /** 属性分组 */
  propertyGroups: PropertyGroup[];
  /** 是否显示技术属性 */
  showTechnicalProps: boolean;
  /** 是否显示位置信息 */
  showPositionInfo: boolean;
}

/**
 * 属性分组
 */
export interface PropertyGroup {
  /** 分组名称 */
  name: string;
  /** 分组标题 */
  title: string;
  /** 属性列表 */
  properties: string[];
  /** 是否默认展开 */
  defaultExpanded: boolean;
  /** 分组图标 */
  icon?: string;
}

/**
 * 匹配结果
 */
export interface MatchResult {
  /** 是否匹配成功 */
  success: boolean;
  /** 匹配的元素 */
  element: UIElement | null;
  /** 匹配置信度 */
  confidence: number;
  /** 匹配详情 */
  details: MatchDetail[];
  /** 错误信息 */
  error?: string;
}

/**
 * 匹配详情
 */
export interface MatchDetail {
  /** 字段名 */
  field: string;
  /** 期望值 */
  expected: string;
  /** 实际值 */
  actual: string;
  /** 是否匹配 */
  matched: boolean;
  /** 匹配类型 */
  matchType: 'exact' | 'contains' | 'regex' | 'excluded';
}

/**
 * 页面信息
 */
export interface PageInfo {
  /** 应用包名 */
  appPackage: string;
  /** 活动名称 */
  activityName: string;
  /** 页面标题 */
  pageTitle: string;
  /** 页面类型 */
  pageType: string;
  /** 元素总数 */
  elementCount: number;
  /** 截图时间戳 */
  timestamp: number;
  /** 设备信息 */
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    resolution: string;
    density: number;
  };
}

/**
 * 导出类型集合，便于其他模块导入
 * 注意：这里不需要重复导出已经在上面声明的类型
 */