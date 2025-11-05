// src/modules/structural-matching/services/step-card-parameter-inference/types.ts
// module: structural-matching | layer: services | role: 步骤卡片参数推导类型定义
// summary: 定义步骤卡片参数推导所需的核心类型

import { FieldType } from '../../domain/constants/field-types';
import { FieldMatchStrategy } from '../../domain/skeleton-match-strategy';

/**
 * 结构匹配计划 - 从步骤卡片推导出的完整匹配参数
 */
export interface StructuralMatchPlan {
  /** 计划版本 */
  version: string;
  
  /** XML快照哈希 */
  snapshotHash: string;
  
  /** 推导生成时间 */
  generatedAt: string;
  
  /** 原始静态XPath */
  sourceXPath: string;
  
  /** 选中元素锚点信息 */
  selectedAnchor: {
    /** 祖先链签名 */
    ancestorChain: Array<{
      className: string;
      role: string;
      depth: number;
      signature: string;
    }>;
    /** 可点击父元素签名 */
    clickableParentSig: string;
    /** 自身元素签名 */
    selfSignature: string;
  };
  
  /** 容器限域配置 */
  containerGate: {
    /** 容器XPath */
    containerXPath: string;
    /** 兜底模式 */
    fallbackMode: "nearest_scrollable" | "business_pane";
    /** 限域模式：pre=先限域再搜索, post=匹配后校验在容器内 */
    gateMode: "pre" | "post";
  };
  
  /** 字段掩码配置 */
  fieldMask: {
    text: "use" | "ignore-numeric" | "pattern-match";
    contentDesc: "use" | "ignore-numeric" | "pattern-match"; 
    resourceId: "use" | "soft";
    bounds: "geom-iou" | "ignore";
    booleanFields: "exact" | "soft";
  };
  
  /** 布局限域配置 */
  layoutGate: {
    /** 归一化中心点 [x%, y%] */
    normalizedCenter: [number, number];
    /** 归一化尺寸 [width%, height%] */
    normalizedSize: [number, number];
    /** 允许的最大漂移 */
    maxShift: number;
  };
  
  /** 评分配置 */
  scoring: {
    /** 权重配置档案 */
    weightsProfile: "Speed" | "Default" | "Robust";
    /** 最小置信度 */
    minConfidence: number;
    /** 顶部间隙 */
    topGap: number;
    /** 早期停止 */
    earlyStop: boolean;
  };
}

/**
 * 元素结构特征分析结果
 */
export interface ElementStructuralFeatures {
  /** 目标元素 */
  targetElement: ParsedUIElement;
  
  /** 容器元素 */
  containerElement: ParsedUIElement | null;
  
  /** 祖先链 */
  ancestorChain: ParsedUIElement[];
  
  /** 兄弟元素 */
  siblings: ParsedUIElement[];
  
  /** 结构签名 */
  structuralSignature: {
    shapeHash: string;
    childLayout: string;
    repeatPattern: "list-like" | "grid-like" | "single";
  };
  
  /** 几何特征 */
  geometricFeatures: {
    absoluteBounds: { x: number; y: number; width: number; height: number };
    relativeBounds: { x: number; y: number; width: number; height: number };
    containerBounds: { x: number; y: number; width: number; height: number };
  };
}

/**
 * 解析后的UI元素（从XML解析得到）
 */
export interface ParsedUIElement {
  /** 元素标签 */
  tag: string;
  
  /** 属性集合 */
  attributes: Record<string, string>;
  
  /** 文本内容 */
  text?: string;
  
  /** 边界信息 */
  bounds: { x: number; y: number; width: number; height: number };
  
  /** 子元素 */
  children: ParsedUIElement[];
  
  /** 父元素引用 */
  parent: ParsedUIElement | null;
  
  /** 在父元素中的索引 */
  index: number;
  
  /** XPath路径 */
  xpath: string;
  
  /** 深度 */
  depth: number;
}

/**
 * XML快照分析选项
 */
export interface XmlAnalysisOptions {
  /** 是否包含不可见元素 */
  includeInvisible?: boolean;
  
  /** 最大分析深度 */
  maxDepth?: number;
  
  /** 是否构建父子关系 */
  buildRelations?: boolean;
  
  /** 是否计算XPath */
  calculateXPath?: boolean;
}

/**
 * 参数推导选项
 */
export interface ParameterInferenceOptions {
  /** 推导模式 */
  mode: "conservative" | "balanced" | "aggressive";
  
  /** 是否忽略易变字段 */
  ignoreVolatileFields?: boolean;
  
  /** 容器检测策略 */
  containerStrategy: "auto" | "nearest_scrollable" | "semantic_parent";
  
  /** 几何特征权重 */
  geometricWeight?: number;
  
  /** 文本特征权重 */
  textWeight?: number;
  
  /** 结构特征权重 */
  structuralWeight?: number;
}

/**
 * 推导结果状态
 */
export interface InferenceResult {
  /** 是否成功 */
  success: boolean;
  
  /** 推导出的计划 */
  plan?: StructuralMatchPlan;
  
  /** 错误信息 */
  error?: string;
  
  /** 警告信息 */
  warnings?: string[];
  
  /** 推导统计 */
  stats?: {
    analysisTimeMs: number;
    elementsAnalyzed: number;
    featuresExtracted: number;
  };
}

/**
 * 字段策略推导结果
 */
export interface FieldStrategyInference {
  /** 字段类型 */
  fieldType: FieldType;
  
  /** 推荐策略 */
  recommendedStrategy: FieldMatchStrategy;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 推导置信度 */
  confidence: number;
  
  /** 推导原因 */
  reason: string;
  
  /** 字段值 */
  value: string;
  
  /** 是否为易变字段 */
  isVolatile: boolean;
}