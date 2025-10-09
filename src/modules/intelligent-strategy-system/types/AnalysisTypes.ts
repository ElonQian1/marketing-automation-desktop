/**
 * AnalysisTypes.ts
 * 元素分析相关类型定义
 * 
 * @description 定义元素上下文分析、层级分析等相关类型
 */

// === 元素分析上下文 ===

/**
 * 元素分析上下文 - 包含分析所需的完整上下文信息
 */
export interface ElementAnalysisContext {
  /** 目标元素节点 */
  targetElement: ElementNode;
  
  /** 元素层级信息 */
  hierarchy: NodeHierarchyInfo;
  
  /** 文档结构信息 */
  document: DocumentStructure;
  
  /** 分析选项 */
  options: AnalysisOptions;
  
  /** 缓存数据 */
  cache?: AnalysisCache;
}

/**
 * 元素节点定义
 */
export interface ElementNode {
  /** 节点标签名 */
  tag: string;
  
  /** 节点属性 */
  attributes: Record<string, string>;
  
  /** 节点文本内容 */
  text?: string;
  
  /** 节点位置信息 */
  bounds?: BoundsInfo;
  
  /** 节点XPath */
  xpath: string;
  
  /** 节点在XML中的索引 */
  index: number;
  
  /** 是否可点击 */
  clickable: boolean;
  
  /** 是否可见 */
  visible: boolean;
  
  /** 是否可聚焦 */
  focusable: boolean;
  
  /** 其他UI状态 */
  uiState: {
    enabled: boolean;
    selected: boolean;
    checked?: boolean;
    password?: boolean;
  };
}

/**
 * 位置信息
 */
export interface BoundsInfo {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * 节点层级信息
 */
export interface NodeHierarchyInfo {
  /** 父节点 */
  parent?: ElementNode;
  
  /** 所有祖先节点（从父到根） */
  ancestors: ElementNode[];
  
  /** 子节点列表 */
  children: ElementNode[];
  
  /** 所有后代节点 */
  descendants: ElementNode[];
  
  /** 兄弟节点 */
  siblings: ElementNode[];
  
  /** 在兄弟节点中的索引 */
  siblingIndex: number;
  
  /** 从根节点的深度 */
  depth: number;
  
  /** 最近的可点击父节点 */
  nearestClickableParent?: ElementNode;
  
  /** 稳定容器祖先（有稳定ID的容器） */
  stableContainerAncestor?: ElementNode;
}

/**
 * 文档结构信息
 */
export interface DocumentStructure {
  /** 根节点 */
  root: ElementNode;
  
  /** 所有节点的扁平列表 */
  allNodes: ElementNode[];
  
  /** 可点击节点列表 */
  clickableNodes: ElementNode[];
  
  /** 有文本的节点列表 */
  textNodes: ElementNode[];
  
  /** 有ID的节点列表 */
  idNodes: ElementNode[];
  
  /** 文档统计信息 */
  statistics: DocumentStatistics;
  
  /** 应用信息 */
  appInfo: AppInfo;
}

/**
 * 文档统计信息
 */
export interface DocumentStatistics {
  /** 总节点数 */
  totalNodes: number;
  
  /** 可点击节点数 */
  clickableNodesCount: number;
  
  /** 有文本节点数 */
  textNodesCount: number;
  
  /** 有ID节点数 */
  idNodesCount: number;
  
  /** 最大深度 */
  maxDepth: number;
  
  /** 平均深度 */
  averageDepth: number;
  
  /** 重复ID统计 */
  duplicateIds: Record<string, number>;
  
  /** 重复文本统计 */
  duplicateTexts: Record<string, number>;
}

/**
 * 应用信息
 */
export interface AppInfo {
  /** 包名 */
  packageName: string;
  
  /** 当前Activity */
  activityName: string;
  
  /** 应用名称 */
  appName?: string;
  
  /** 应用版本 */
  appVersion?: string;
  
  /** 设备信息 */
  deviceInfo: DeviceInfo;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  /** 设备ID */
  deviceId: string;
  
  /** 设备名称 */
  deviceName?: string;
  
  /** 屏幕尺寸 */
  screenSize: {
    width: number;
    height: number;
  };
  
  /** 屏幕密度 */
  density: number;
  
  /** Android版本 */
  androidVersion?: string;
  
  /** 设备品牌 */
  brand?: string;
  
  /** 设备型号 */
  model?: string;
}

// === 锚点相关类型 ===

/**
 * 锚点信息
 */
export interface AnchorPoint {
  /** 锚点类型 */
  type: AnchorType;
  
  /** 锚点元素 */
  element: ElementNode;
  
  /** 锚点可靠性评分（0-1） */
  reliability: number;
  
  /** 锚点描述 */
  description: string;
  
  /** 锚点特征 */
  features: AnchorFeatures;
}

/**
 * 锚点类型
 */
export type AnchorType = 
  | 'resource-id'      // 基于resource-id的锚点
  | 'content-desc'     // 基于content-desc的锚点
  | 'text'             // 基于文本的锚点
  | 'class-name'       // 基于class的锚点
  | 'position'         // 基于位置的锚点
  | 'structure'        // 基于结构的锚点
  | 'composite';       // 复合锚点

/**
 * 锚点特征
 */
export interface AnchorFeatures {
  /** 是否唯一 */
  isUnique: boolean;
  
  /** 稳定性评分 */
  stability: number;
  
  /** 可见性 */
  visibility: 'visible' | 'hidden' | 'partial';
  
  /** 交互性 */
  interactivity: 'clickable' | 'focusable' | 'none';
  
  /** 语义信息 */
  semantics: {
    /** 是否有意义的文本 */
    meaningfulText: boolean;
    
    /** 是否是导航元素 */
    isNavigation: boolean;
    
    /** 是否是内容元素 */
    isContent: boolean;
    
    /** 是否是控制元素 */
    isControl: boolean;
  };
}

// === 分析选项和配置 ===

/**
 * 分析选项
 */
export interface AnalysisOptions {
  /** 分析模式 */
  mode: AnalysisMode;
  
  /** 是否启用深度分析 */
  deepAnalysis: boolean;
  
  /** 是否缓存结果 */
  enableCaching: boolean;
  
  /** 超时时间（毫秒） */
  timeout: number;
  
  /** 最大分析深度 */
  maxDepth: number;
  
  /** 性能优先级 */
  performancePriority: 'speed' | 'accuracy' | 'balanced';
  
  /** 自定义权重 */
  customWeights?: Record<string, number>;
  
  /** 排除的分析步骤 */
  excludeSteps?: string[];
  
  /** 包含的分析步骤 */
  includeSteps?: string[];
}

/**
 * 分析模式
 */
export type AnalysisMode = 
  | 'quick'      // 快速分析：只进行基础检查
  | 'standard'   // 标准分析：进行常规的Step 0-6分析
  | 'thorough'   // 彻底分析：进行全面深入分析
  | 'custom';    // 自定义分析：按照指定步骤分析

/**
 * 分析缓存
 */
export interface AnalysisCache {
  /** XML解析缓存 */
  parsedXml?: Document;
  
  /** 节点索引缓存 */
  nodeIndex?: Map<string, ElementNode>;
  
  /** XPath缓存 */
  xpathCache?: Map<ElementNode, string>;
  
  /** 层级关系缓存 */
  hierarchyCache?: Map<ElementNode, NodeHierarchyInfo>;
  
  /** 唯一性检查缓存 */
  uniquenessCache?: Map<string, boolean>;
  
  /** 缓存创建时间 */
  createdAt: number;
  
  /** 缓存有效期（毫秒） */
  ttl: number;
}

// === 分析结果类型 ===

/**
 * 元素分析结果
 */
export interface ElementAnalysisResult {
  /** 目标元素 */
  element: ElementNode;
  
  /** 分析成功状态 */
  success: boolean;
  
  /** 识别出的锚点 */
  anchorPoints: AnchorPoint[];
  
  /** 可用的匹配策略 */
  availableStrategies: string[];
  
  /** 推荐的策略 */
  recommendedStrategy: string;
  
  /** 元素特征摘要 */
  features: ElementFeatureSummary;
  
  /** 分析元数据 */
  metadata: AnalysisMetadata;
  
  /** 性能指标 */
  performance: AnalysisPerformance;
  
  /** 警告和建议 */
  warnings: string[];
  
  /** 调试信息 */
  debugInfo?: any;
}

/**
 * 元素特征摘要
 */
export interface ElementFeatureSummary {
  /** 主要识别特征 */
  primaryFeatures: string[];
  
  /** 次要识别特征 */
  secondaryFeatures: string[];
  
  /** 稳定性评估 */
  stability: {
    overall: number;
    crossDevice: number;
    temporal: number;
  };
  
  /** 唯一性评估 */
  uniqueness: {
    local: number;    // 在当前页面中的唯一性
    global: number;   // 在应用中的唯一性
    contextual: number; // 在上下文中的唯一性
  };
  
  /** 复杂度评估 */
  complexity: {
    structural: 'simple' | 'medium' | 'complex';
    computational: 'low' | 'medium' | 'high';
    maintenance: 'easy' | 'medium' | 'hard';
  };
}

/**
 * 分析元数据
 */
export interface AnalysisMetadata {
  /** 分析开始时间 */
  startTime: number;
  
  /** 分析结束时间 */
  endTime: number;
  
  /** 分析版本 */
  version: string;
  
  /** 使用的分析步骤 */
  stepsExecuted: string[];
  
  /** 跳过的分析步骤 */
  stepsSkipped: string[];
  
  /** 分析器版本信息 */
  analyzerVersions: Record<string, string>;
}

/**
 * 分析性能指标
 */
export interface AnalysisPerformance {
  /** 总耗时（毫秒） */
  totalTime: number;
  
  /** 各步骤耗时 */
  stepTimes: Record<string, number>;
  
  /** 内存使用峰值 */
  peakMemoryUsage?: number;
  
  /** CPU使用率 */
  cpuUsage?: number;
  
  /** 缓存命中率 */
  cacheHitRate: number;
}

// === 辅助类型 ===

/**
 * 字段层级分类
 */
export interface FieldHierarchy {
  /** 字段名 */
  field: string;
  
  /** 字段值 */
  value: any;
  
  /** 字段所在层级 */
  level: 'self' | 'parent' | 'child' | 'descendant' | 'ancestor';
  
  /** 距离目标节点的层级距离 */
  distance: number;
  
  /** 字段权重 */
  weight: number;
}

/**
 * 层级分析结果
 */
export interface HierarchyAnalysisResult {
  /** 字段层级分类 */
  fieldHierarchy: FieldHierarchy[];
  
  /** 结构稳定性评分 */
  structuralStability: number;
  
  /** 推荐的层级策略 */
  recommendedLevelStrategy: 'self' | 'parent' | 'ancestor' | 'mixed';
  
  /** 层级复杂度 */
  hierarchyComplexity: 'simple' | 'medium' | 'complex';
  
  /** 潜在风险点 */
  riskFactors: string[];
}