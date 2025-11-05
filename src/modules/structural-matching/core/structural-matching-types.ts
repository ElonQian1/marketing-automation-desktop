// src/modules/structural-matching/core/structural-matching-types.ts
// module: structural-matching | layer: core | role: 类型定义
// summary: 结构匹配系统的完整类型定义，包含所有锚点类型和配置结构

/**
 * 🏗️ 完整的结构签名配置
 * 基于MVS（最小可行签名）原则，包含所有必要锚点
 */
export interface StructuralSignatureProfile {
  /** 签名标识 */
  id: string;
  /** 签名名称 */
  name: string;
  /** 创建时间 */
  createdAt: string;
  /** 容器锚点（必须） */
  container: ContainerAnchor;
  /** 预期布局类型 */
  expectedLayout: LayoutType[];
  /** 卡片根锚点（必须） */
  cardRoot: CardRootAnchor;
  /** 祖先/上下文锚点 */
  contextAnchors: ContextAnchor;
  /** 子结构锚点 */
  skeletonRules: SkeletonRules;
  /** 字段精调规则 */
  fieldRules: FieldRule[];
  /** 可转换性锚点（必须） */
  convertibility: ConvertibilityAnchor;
  /** 权重和阈值配置 */
  scoring: ScoringConfig;
  /** 完整性评分 */
  completenessScore: number;
}

/**
 * 🎯 容器锚点 - 限定搜索范围
 */
export interface ContainerAnchor {
  /** XPath表达式 */
  xpath?: string;
  /** 容器指纹 */
  fingerprint?: ContainerFingerprint;
  /** 边界提示 */
  boundsHint?: BoundsRect;
  /** 容错策略 */
  fallbackStrategy: 'relax' | 'parent' | 'global';
}

export interface ContainerFingerprint {
  role: string;
  className?: string;
  scrollable?: boolean;
  boundsPattern?: string; // 如 "[0,*][1080,*]"
}

/**
 * 🎮 布局类型
 */
export type LayoutType = 'WaterfallMulti' | 'MasonrySingle' | 'UniformGrid' | 'List' | 'Carousel' | 'Unknown';

/**
 * 🎯 卡片根锚点 - 定位卡片根节点
 */
export interface CardRootAnchor {
  /** 角色/类名 */
  role: string;
  /** 类名包含检查 */
  classContains?: string;
  /** 可点击父节点路径 */
  clickableParentPath: string; // "↑1", "↑2", "self"
  /** 相对宽度桶（百分比，5%桶化） */
  relativeWidthBucket: number; // 0-20 (0-100%，每桶5%)
  /** 列位桶 */
  leftBucket: number; // 0=左列，1=右列，2=单列等
  /** 最小面积 */
  minArea?: number;
}

/**
 * 🧬 祖先/上下文锚点
 */
export interface ContextAnchor {
  /** 祖先链路径 */
  ancestorChain?: AncestorNode[];
  /** 同级元素数量范围 */
  siblingCountRange?: [number, number];
  /** 深度范围 */
  depthRange?: [number, number];
}

export interface AncestorNode {
  classContains?: string;
  role?: string;
  depthDelta: number; // -1=父级，-2=祖父级
  optional?: boolean;
  attributePattern?: Record<string, string>;
}

/**
 * 🦴 骨架规则 - 子结构约束
 */
export interface SkeletonRules {
  // 🎯 核心匹配规则（新增）
  coreAttributes?: AttributePattern[];
  layoutPatterns?: LayoutPattern[];
  relationshipConstraints?: RelationshipConstraint[];
  
  /** 要求图片在文字上方 */
  requireImageAboveText: boolean;
  /** 允许深度弹性 */
  allowDepthFlex: number;
  /** 子元素规则 */
  children?: ChildElementRule[];
  /** 子元素数量范围 */
  childCountRange?: [number, number];
  /** 结构模式 */
  structurePattern?: StructurePattern;
  
  // 🛡️ 容错策略（新增）
  fallbackRules?: FallbackRule[];
  
  // ⚖️ 权重配置（新增）
  weights?: {
    exactMatch: number;
    attributeMatch: number;
    layoutMatch: number;
    positionMatch: number;
    fallback: number;
  };
}

/**
 * 🏷️ 属性匹配模式
 */
export interface AttributePattern {
  name: string;
  value: string;
  matchType: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  weight: number;
  required: boolean;
}

/**
 * 📐 布局匹配模式
 */
export interface LayoutPattern {
  type: 'bounds' | 'position' | 'neighbors' | 'grid';
  pattern: LayoutPatternData;
  weight: number;
  tolerance: number;
}

/**
 * 📐 布局模式数据
 */
export interface LayoutPatternData {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  relativeX?: number;
  relativeY?: number;
  quadrant?: string;
  neighbors?: NeighborInfo[];
  [key: string]: string | number | boolean | NeighborInfo[] | undefined;
}

/**
 * 🏘️ 邻居信息
 */
export interface NeighborInfo {
  elementInfo: {
    className: string;
    resourceId?: string;
    text?: string;
  };
  relationship: string;
  distance: number;
}

/**
 * 🔗 关系约束
 */
export interface RelationshipConstraint {
  type: 'depth' | 'ancestors' | 'siblings' | 'children';
  minDepth?: number;
  maxDepth?: number;
  anchorPoints?: AnchorPoint[];
  requireAll?: boolean;
  minMatches?: number;
  weight: number;
}

/**
 * 🛡️ 回退规则
 */
export interface FallbackRule {
  name: string;
  description: string;
  modifications: FallbackModifications;
  threshold: number;
}

/**
 * 🛡️ 回退修改配置
 */
export interface FallbackModifications {
  requireExactText?: boolean;
  allowPartialResourceId?: boolean;
  allowSimilarClassName?: boolean;
  ignoreAbsolutePosition?: boolean;
  relaxBoundsConstraint?: boolean;
  allowPositionFlex?: number;
  useOnlyResourceId?: boolean;
  ignoreAllLayout?: boolean;
  ignoreAllRelationships?: boolean;
}

/**
 * ⚓ 锚点定义
 */
export interface AnchorPoint {
  xpath: string;
  fingerprint: Record<string, string | number | boolean>;
  relationship: RelationshipType;
  weight: number;
}

/**
 * 🧬 祖先链配置
 */
export interface AncestorChain {
  depth: number;
  anchorPoints: AnchorPoint[];
  jumpStrategy: 'sequential' | 'skip' | 'adaptive';
  fallbackDepth: number;
}

/**
 * 🎯 祖先节点
 */
export interface AncestorNode {
  element: ElementInfo;
  pathIndex: number;
  significance: number;
  nodeType: string;
}

/**
 * 🔗 关系类型
 */
export type RelationshipType = 'ancestor' | 'parent' | 'sibling' | 'self' | 'child' | 'descendant';

export interface ChildElementRule {
  role: string;
  presence: boolean;
  order?: string; // "after(ImageView)", "before(TextView)"
  positionConstraint?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  sizeConstraint?: {
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: [number, number]; // [width, height]
  };
}

export type StructurePattern = 'image-text-vertical' | 'text-image-vertical' | 'image-text-horizontal' | 'grid-2x2' | 'custom';

/**
 * 📝 字段精调规则
 */
export interface FieldRule {
  /** 字段名称 */
  fieldName: string;
  /** 类名包含检查 */
  classContains?: string;
  /** 仅要求存在 */
  presenceOnly?: boolean;
  /** 必须等于 */
  mustEqual?: string;
  /** 包含检查 */
  contains?: string;
  /** 正则表达式 */
  regex?: string;
  /** 权重 */
  weight?: number;
}

/**
 * 🔄 可转换性锚点 - 确保命中可转换为UIElement
 */
export interface ConvertibilityAnchor {
  /** 可点击父节点策略 */
  clickableParentStrategy: 'self' | 'parent' | 'ancestor' | 'bounds';
  /** 可点击父节点最大上溯层数 */
  maxParentLevels: number;
  /** 边界策略 */
  boundsStrategy: 'content_region' | 'whole_card' | 'center_point';
  /** 后备策略 */
  fallbackStrategy: 'ignore' | 'force_bounds' | 'use_container';
}

/**
 * ⚖️ 评分配置
 */
export interface ScoringConfig {
  /** 权重模式 */
  weightsMode: 'Default' | 'Strict' | 'Relaxed';
  /** 最小置信度 */
  minConfidence: number;
  /** 顶部差距 */
  topGap: number;
  /** 唯一性要求 */
  uniquenessRequired: boolean;
  /** 权重分布 */
  weights?: WeightDistribution;
}

export interface WeightDistribution {
  resourceId: number;
  contentDesc: number;
  text: number;
  className: number;
  containerBonus: number;
  clickableParentBonus: number;
  ancestorChainBonus: number;
  skeletonBonus: number;
}

/**
 * 🎯 简化的前端数据结构（用于UI展示）
 */
export interface StructuralSignatureSimple {
  container: {
    role: string;
    depth: number;
  };
  skeleton: SkeletonElement[];
}

export interface SkeletonElement {
  tag: string;
  role: string;
  index: number;
}

/**
 * 📊 完整性评分结果
 */
export interface CompletenessAnalysis {
  score: number; // 0-1
  warnings: string[];
  suggestions: string[];
  missingAnchors: string[];
  strengthLevel: 'weak' | 'moderate' | 'strong' | 'excellent';
}

/**
 * 🔍 边界矩形
 */
export interface BoundsRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * 📱 元素信息（从selectedElement提取的标准化数据）
 */
export interface ElementInfo {
  id: string;
  resourceId: string;
  contentDesc: string;
  text: string;
  className: string;
  bounds: string;
  clickable: boolean;
  scrollable: boolean;
  enabled: boolean;
  focused: boolean;
  selected: boolean;
  checkable: boolean;
  checked: boolean;
  password: boolean;
  children?: ElementInfo[];
  parent?: ElementInfo;
  ancestors?: ElementInfo[];
  siblings?: ElementInfo[];
}

/**
 * 🏠 XML上下文信息
 */
export interface XmlContext {
  allElements: ElementInfo[];
  containers: ElementInfo[];
  clickableElements: ElementInfo[];
  textElements: ElementInfo[];
  imageElements: ElementInfo[];
  layoutAnalysis: LayoutAnalysis;
}

export interface LayoutAnalysis {
  detectedLayout: LayoutType;
  confidence: number;
  containerBounds: BoundsRect;
  cardCount: number;
  averageCardSize: { width: number; height: number };
  columnCount: number;
  rowCount: number;
  spacing: { horizontal: number; vertical: number };
}