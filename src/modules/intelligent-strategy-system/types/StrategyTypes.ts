/**
 * StrategyTypes.ts
 * 匹配策略相关类型定义
 * 
 * @description 定义各种匹配策略的类型和配置
 */

// === 匹配策略类型 ===

/**
 * 支持的匹配策略
 */
export type MatchStrategy = 
  | 'absolute'              // 绝对定位：使用bounds等位置信息
  | 'strict'                // 严格匹配：常用语义字段组合
  | 'relaxed'               // 宽松匹配：少数字段或模糊匹配
  | 'positionless'          // 无位置匹配：忽略位置相关字段
  | 'standard'              // 标准匹配：跨设备稳定匹配
  | 'custom'                // 自定义匹配：根据参数智能选择
  | 'xpath-direct'          // XPath直接匹配
  | 'xpath-first-index'     // XPath第一个索引匹配
  | 'xpath-all-elements'    // XPath全部元素匹配
  | 'hidden-element-parent' // 隐藏元素父容器查找
  | 'self-anchor'           // 自我锚点匹配（新增）
  | 'child-anchor'          // 子节点锚点匹配（新增）
  | 'parent-clickable'      // 父节点可点击匹配（新增）
  | 'region-scoped'         // 区域限定匹配（新增）
  | 'neighbor-relative'     // 邻居相对匹配（新增）
  | 'index-fallback';       // 索引兜底匹配（新增）

/**
 * 策略推荐结果
 */
export interface StrategyRecommendation {
  /** 推荐的主要策略 */
  strategy: MatchStrategy;
  
  /** 推荐置信度（0-1） */
  confidence: number;
  
  /** 推荐理由 */
  reason: string;
  
  /** 综合评分（0-100） */
  score: number;
  
  /** 预估性能 */
  performance: {
    speed: 'fast' | 'medium' | 'slow';
    stability: 'high' | 'medium' | 'low';
    crossDevice: 'excellent' | 'good' | 'fair';
  };
  
  /** 备选策略列表 */
  alternatives: StrategyCandidate[];
  
  /** 推荐标签 */
  tags: StrategyTag[];
  
  /** 应用场景描述 */
  scenarios: string[];
  
  /** 注意事项和限制 */
  limitations?: string[];
}

/**
 * 策略候选项详细定义
 */
export interface StrategyCandidate {
  /** 唯一标识 */
  id: string;
  
  /** 策略类型 */
  strategy: MatchStrategy;
  
  /** 产生此候选的分析步骤 */
  sourceStep: string;
  
  /** 评分详情 */
  scoring: {
    /** 总分（0-100） */
    total: number;
    
    /** 分项评分 */
    breakdown: {
      uniqueness: number;    // 唯一性评分
      stability: number;     // 稳定性评分
      performance: number;   // 性能评分
      reliability: number;   // 可靠性评分
    };
    
    /** 加分项 */
    bonuses: Array<{
      reason: string;
      points: number;
    }>;
    
    /** 扣分项 */
    penalties: Array<{
      reason: string;
      points: number;
    }>;
  };
  
  /** 匹配条件 */
  criteria: MatchingCriteria;
  
  /** 本地验证结果 */
  validation: ValidationResult;
  
  /** 策略元信息 */
  metadata: {
    /** 创建时间 */
    createdAt: number;
    
    /** 预估执行时间（毫秒） */
    estimatedExecutionTime: number;
    
    /** 适用设备类型 */
    deviceCompatibility: string[];
    
    /** 策略复杂度 */
    complexity: 'simple' | 'medium' | 'complex';
  };
}

/**
 * 匹配条件定义
 */
export interface MatchingCriteria {
  /** 匹配字段 */
  fields: string[];
  
  /** 字段值 */
  values: Record<string, any>;
  
  /** 包含条件（字段必须包含的内容） */
  includes?: Record<string, string[]>;
  
  /** 排除条件（字段不能包含的内容） */
  excludes?: Record<string, string[]>;
  
  /** XPath表达式（如果适用） */
  xpath?: string;
  
  /** 位置约束（如果适用） */
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  
  /** 层级约束 */
  hierarchy?: {
    /** 相对父节点的层级 */
    parentLevel?: number;
    
    /** 相对根节点的深度 */
    depth?: number;
    
    /** 兄弟节点索引 */
    siblingIndex?: number;
  };
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否通过验证 */
  passed: boolean;
  
  /** 匹配到的元素数量 */
  matchCount: number;
  
  /** 唯一性检查结果 */
  uniqueness: {
    /** 是否唯一 */
    isUnique: boolean;
    
    /** 冲突元素信息 */
    conflicts?: Array<{
      xpath: string;
      attributes: Record<string, string>;
    }>;
  };
  
  /** 验证错误信息 */
  errors: string[];
  
  /** 警告信息 */
  warnings: string[];
  
  /** 验证耗时（毫秒） */
  validationTime: number;
}

/**
 * 策略标签 - 用于分类和描述策略特点
 */
export type StrategyTag = 
  | 'recommended'       // 推荐策略
  | 'fast'             // 快速执行
  | 'stable'           // 跨设备稳定
  | 'precise'          // 精确匹配
  | 'fallback'         // 兜底策略
  | 'experimental'     // 实验性策略
  | 'legacy'           // 兼容旧版
  | 'resource-heavy'   // 资源密集
  | 'cross-platform'   // 跨平台兼容
  | 'text-based'       // 基于文本
  | 'position-based'   // 基于位置
  | 'structure-based'; // 基于结构

// === 策略配置 ===

/**
 * 策略配置选项
 */
export interface StrategyConfig {
  /** 策略类型 */
  type: MatchStrategy;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 优先级（数字越小优先级越高） */
  priority: number;
  
  /** 权重（用于评分计算） */
  weight: number;
  
  /** 策略特定参数 */
  parameters: Record<string, any>;
  
  /** 适用条件 */
  conditions: {
    /** 最小置信度要求 */
    minConfidence?: number;
    
    /** 最大执行时间（毫秒） */
    maxExecutionTime?: number;
    
    /** 设备类型限制 */
    deviceTypes?: string[];
    
    /** 应用包名白名单 */
    allowedPackages?: string[];
  };
}

/**
 * 策略组合配置
 */
export interface StrategyComposition {
  /** 主策略 */
  primary: MatchStrategy;
  
  /** 回退策略链 */
  fallbacks: MatchStrategy[];
  
  /** 组合模式 */
  mode: 'sequential' | 'parallel' | 'hybrid';
  
  /** 决策阈值 */
  thresholds: {
    /** 成功阈值 */
    success: number;
    
    /** 回退阈值 */
    fallback: number;
    
    /** 失败阈值 */
    failure: number;
  };
}

// === 策略执行结果 ===

/**
 * 策略执行结果
 */
export interface StrategyExecutionResult {
  /** 执行的策略 */
  strategy: MatchStrategy;
  
  /** 是否成功 */
  success: boolean;
  
  /** 匹配到的元素 */
  matchedElement?: any;
  
  /** 执行时间（毫秒） */
  executionTime: number;
  
  /** 匹配置信度 */
  matchConfidence: number;
  
  /** 错误信息 */
  error?: string;
  
  /** 执行日志 */
  logs: string[];
  
  /** 性能指标 */
  metrics: {
    /** XML解析时间 */
    xmlParseTime: number;
    
    /** 元素查找时间 */
    searchTime: number;
    
    /** 验证时间 */
    validationTime: number;
    
    /** 内存使用 */
    memoryUsage?: number;
  };
}

// === 策略分析器接口 ===

/**
 * 策略分析器基础接口
 */
export interface IStrategyAnalyzer {
  /** 分析器名称 */
  readonly name: string;
  
  /** 支持的分析步骤 */
  readonly supportedSteps: string[];
  
  /**
   * 分析元素并生成候选策略
   * @param context 分析上下文
   * @returns 候选策略列表
   */
  analyze(context: AnalysisContext): Promise<StrategyCandidate[]>;
  
  /**
   * 验证策略的可行性
   * @param candidate 候选策略
   * @param context 分析上下文
   * @returns 验证结果
   */
  validate(candidate: StrategyCandidate, context: AnalysisContext): Promise<ValidationResult>;
}

/**
 * 分析上下文
 */
export interface AnalysisContext {
  /** 目标元素 */
  element: any;
  
  /** XML内容 */
  xmlContent: string;
  
  /** 已解析的DOM树 */
  parsedXml?: Document;
  
  /** 祖先节点链 */
  ancestors: any[];
  
  /** 兄弟节点 */
  siblings: any[];
  
  /** 子节点 */
  children: any[];
  
  /** 设备信息 */
  deviceInfo: any;
  
  /** 配置选项 */
  config: Record<string, any>;
}