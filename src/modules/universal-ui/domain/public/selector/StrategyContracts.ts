// src/modules/universal-ui/domain/public/selector/StrategyContracts.ts
// module: universal-ui | layer: domain | role: contracts
// summary: 策略统一契约（手动/智能+6变体）

/**
 * 策略统一契约定义
 * 统一手动静态策略和智能策略的接口规范
 */

// === 基础类型定义 ===

/**
 * 策略类型枚举
 */
export type StrategyKind = 'manual' | 'smart';

/**
 * 被选元素描述符
 * 包含足够信息用于策略生成和匹配
 */
export interface ElementDescriptor {
  /** 节点ID */
  nodeId: string;
  /** 标签名 */
  tagName?: string;
  /** 显示文本 */
  text?: string;
  /** 属性集合 */
  attributes?: Record<string, string | undefined>;
  /** CSS路径 */
  cssPath?: string;
  /** XPath路径 */
  xpath?: string;
  /** 第N个子元素 */
  nthChild?: number;
  /** 元素边界 */
  bounds?: string | { x: number; y: number; width: number; height: number };
  /** 资源ID */
  resourceId?: string;
  /** 内容描述 */
  contentDesc?: string;
  /** 是否可点击 */
  clickable?: boolean;
  /** 元素类型 */
  elementType?: string;
}

// === 手动策略定义 ===

/**
 * 手动策略类型
 */
export type ManualStrategyType = 'xpath-direct' | 'custom' | 'strict' | 'relaxed';

/**
 * 手动策略选择器
 */
export interface ManualSelector {
  /** CSS选择器 */
  css?: string;
  /** XPath选择器 */
  xpath?: string;
  /** 属性匹配规则 */
  attr?: Array<{
    key: string;
    op: 'eq' | 'contains' | 'startsWith';
    value: string;
  }>;
  /** 位置匹配 */
  position?: {
    nthChild?: number;
  };
}

/**
 * 手动策略定义
 */
export interface ManualStrategy {
  kind: 'manual';
  /** 策略名称 */
  name: string;
  /** 策略类型 */
  type: ManualStrategyType;
  /** 选择器 */
  selector: ManualSelector;
  /** 备注说明 */
  notes?: string;
  /** 创建时间 */
  createdAt?: number;
}

// === 智能策略定义 ===

/**
 * 智能匹配变体类型
 * 对应现有的6种智能策略变体
 */
export type SmartMatchVariant =
  | 'self-anchor'           // 自我锚点匹配
  | 'child-anchor'          // 子节点锚点匹配
  | 'parent-clickable'      // 父节点可点击匹配
  | 'region-scoped'         // 区域限定匹配
  | 'neighbor-relative'     // 邻居相对匹配
  | 'index-fallback';       // 索引兜底匹配

/**
 * 智能策略变体参数
 * 为不同变体提供特定配置参数
 */
export type SmartVariantParams =
  | { variant: 'self-anchor'; anchorText?: string; attrKeys?: string[]; similarity?: number }
  | { variant: 'child-anchor'; childText?: string; distance?: number }
  | { variant: 'parent-clickable'; role?: string; clickableSelector?: string }
  | { variant: 'region-scoped'; regionCss?: string; regionXpath?: string }
  | { variant: 'neighbor-relative'; neighborText?: string; relation?: 'left' | 'right' | 'above' | 'below'; distance?: number }
  | { variant: 'index-fallback'; index: number; of?: string };

/**
 * 智能选择器
 */
export interface SmartSelector {
  /** CSS选择器 */
  css?: string;
  /** XPath选择器 */
  xpath?: string;
  /** 匹配得分 (0-1) */
  score?: number;
  /** 推理说明 */
  rationale?: string;
  /** 使用的变体 */
  variant: SmartMatchVariant;
  /** 变体参数 */
  params?: SmartVariantParams;
}

/**
 * 智能策略提供方类型
 */
export type SmartProviderType = 'legacy-smart' | 'heuristic' | 'remote-api' | 'local-llm';

/**
 * 智能策略定义
 */
export interface SmartStrategy {
  kind: 'smart';
  /** 提供方类型 */
  provider: SmartProviderType;
  /** 策略版本 */
  version: string;
  /** 智能选择器 */
  selector: SmartSelector;
  /** 快照ID（可选） */
  snapshotId?: string;
  /** 置信度 (0-1) */
  confidence?: number;
  /** 生成时间 */
  generatedAt?: number;
}

// === 统一策略类型 ===

/**
 * 统一策略类型
 * 可以是手动策略或智能策略
 */
export type AnyStrategy = ManualStrategy | SmartStrategy;

/**
 * 策略元数据
 */
export interface StrategyMetadata {
  /** 数据源 */
  source: 'user-selected' | 'auto-generated' | 'fallback';
  /** 生成时间戳 */
  generatedAt?: number;
  /** 策略版本 */
  version?: string;
  /** 上次更新时间 */
  lastUpdated?: number;
}

/**
 * 统一策略包装器
 * 为策略添加额外的元数据和状态信息
 */
export interface UnifiedStrategy {
  /** 策略类型 */
  kind: StrategyKind;
  /** 具体策略 */
  strategy: AnyStrategy;
  /** 置信度 (0-1) */
  confidence?: number;
  /** 元数据 */
  metadata?: StrategyMetadata;
}

// === 用例接口定义 ===

/**
 * 生成智能策略用例接口
 */
export interface GenerateSmartStrategy {
  /**
   * 根据元素描述符生成智能策略
   * @param input 输入参数
   * @returns 生成的智能策略，失败时返回null
   */
  generate(input: { element: ElementDescriptor }): Promise<SmartStrategy | null>;
}

/**
 * 策略转换工具接口
 */
export interface StrategyConverter {
  /**
   * 将旧格式转换为新策略格式
   */
  fromLegacy(legacyData: any): AnyStrategy | null;
  
  /**
   * 将新策略格式转换为旧格式
   */
  toLegacy(strategy: AnyStrategy): any;
}

// === 常用工具类型 ===

/**
 * 策略生成选项
 */
export interface StrategyGenerationOptions {
  /** 优先使用的变体类型 */
  preferredVariants?: SmartMatchVariant[];
  /** 最小置信度阈值 */
  minConfidence?: number;
  /** 是否启用兜底策略 */
  enableFallback?: boolean;
  /** 超时时间（毫秒） */
  timeoutMs?: number;
}

/**
 * 策略验证结果
 */
export interface StrategyValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  errors?: string[];
  /** 警告信息 */
  warnings?: string[];
  /** 建议改进 */
  suggestions?: string[];
}