// src/protocol/v3/types.ts
// module: protocol | layer: domain | role: V3 执行协议类型定义
// summary: 统一的三链执行协议（智能单步/自动链/静态策略）

/**
 * 置信度：0..1 范围的浮点数
 * UI 显示时再乘以 100 转为百分比
 */
export type Confidence = number;

/**
 * 上下文信封：携带设备、应用、快照信息和执行模式
 */
export interface ContextEnvelope {
  deviceId: string;
  app: {
    package: string;
    activity?: string;
  };
  snapshot: {
    /** 分析缓存ID（自动链/单步可带） */
    analysisId?: string;
    /** 分析态的屏幕哈希，用于判断是否需要重评 */
    screenHash?: string;
    /** 原始XML缓存ID，便于复盘 */
    xmlCacheId?: string;
  };
  /** 执行模式：strict（默认，每次重评）或 relaxed（hash一致时复用缓存） */
  executionMode?: 'strict' | 'relaxed';
}

/**
 * 质量设置：控制识别精度的旋钮
 */
export interface QualitySettings {
  /** OCR模式 */
  ocr?: 'auto' | 'force' | 'off';
  /** 文本语言 */
  textLang?: 'zh' | 'en' | 'auto';
  /** 文本标准化选项 */
  normalize?: {
    case?: 'ignore' | 'respect';
    digits?: 'latin' | 'native';
    emoji?: 'strip' | 'keep';
  };
  /** 候选数量，默认 5 */
  nCandidates?: number;
  /** 信号权重分配 */
  signalWeights?: Partial<Record<'resourceId' | 'text' | 'structure', number>>;
}

/**
 * 约束设置：元素必须满足的条件
 */
export interface ConstraintSettings {
  /** 必须可见，默认 true */
  mustBeVisible?: boolean;
  /** 必须可点击，默认 true */
  mustBeClickable?: boolean;
  /** 必须唯一，默认 true */
  unique?: boolean;
  /** 区域约束（ROI：Region of Interest） */
  roi?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * 验证设置：动作执行后的验证条件
 */
export interface ValidationSettings {
  postAction?: {
    /** 等待的事件类型 */
    waitFor: 'nodeGone' | 'newActivity' | 'textAppears';
    /** textAppears 时使用的文本值 */
    value?: string;
    /** 超时时间（毫秒），默认 1200 */
    timeoutMs?: number;
  };
}

// ========== 智能单步 ==========

/**
 * 智能单步执行规格 V3
 */
export interface SingleStepSpecV3 {
  stepId: string;
  action:
    | 'tap'
    | 'input'
    | 'wait'
    | 'swipe'
    | 'smart_tap'
    | 'smart_find_element'
    | 'batch_match'
    | 'recognize_page'
    | 'verify_action'
    | 'wait_for_page_state'
    | 'extract_element'
    | 'smart_navigation'
    | 'loop_start'
    | 'loop_end'
    | 'contact_generate_vcf'
    | 'contact_import_to_device';
  /** 动作参数，如 { target: 'footer_other' } */
  params?: Record<string, unknown>;
  context: ContextEnvelope;
  quality?: QualitySettings;
  constraints?: ConstraintSettings;
  validation?: ValidationSettings;
}

// ========== 智能自动链 ==========

/**
 * 步骤引用或内联定义
 */
export interface StepRefOrInline {
  /** 引用已有步骤ID */
  ref?: string;
  /** 或内联定义步骤 */
  inline?: {
    stepId: string;
    action: SingleStepSpecV3['action'];
    params?: Record<string, unknown>;
  };
}

/**
 * 智能自动链执行规格 V3
 */
export interface ChainSpecV3 {
  chainId?: string;
  /** 有序候选步骤列表 */
  orderedSteps: StepRefOrInline[];
  /** 置信度阈值（0..1），低于此值则跳过 */
  threshold: Confidence;
  /** 执行模式 */
  mode: 'dryrun' | 'execute';
  context: ContextEnvelope;
  quality?: QualitySettings;
  constraints?: ConstraintSettings;
  validation?: ValidationSettings;
}

// ========== 静态策略 ==========

/**
 * 定位器
 */
export interface Locator {
  by: 'id' | 'text' | 'desc' | 'xpath' | 'bounds' | 'index_path';
  value: string;
}

/**
 * 点击点策略
 */
export type ClickPointPolicy = 'center' | 'safe' | 'custom';

/**
 * 静态策略执行规格 V3
 */
export interface StaticSpecV3 {
  strategyId?: string;
  action: 'tap' | 'input' | 'wait' | 'swipe' | 'verify_action' | 'extract_element';
  locator: Locator;
  /** input 动作的文本 */
  inputText?: string;
  /** 点击点策略 */
  clickPointPolicy?: ClickPointPolicy;
  /** 是否为 dryrun 模式（仅验证，不执行） */
  dryrun?: boolean;
  context: ContextEnvelope;
  quality?: QualitySettings;
  constraints?: ConstraintSettings;
  validation?: ValidationSettings;
}

// ========== 事件协议 ==========

/**
 * 执行阶段枚举
 */
export type ExecutionPhase =
  | 'device_ready'
  | 'snapshot_ready'
  | 'match_started'
  | 'matched'
  | 'validated'
  | 'executed'
  | 'finished';

/**
 * 进度事件 V3
 */
export interface ProgressEventV3 {
  type: 'analysis:progress';
  analysisId?: string;
  stepId?: string;
  phase: ExecutionPhase;
  /** 临时分数（0..1） */
  confidence?: Confidence;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * 完成事件 V3
 */
export interface CompleteEventV3 {
  type: 'analysis:complete';
  analysisId?: string;
  summary?: {
    /** 最终采用的步骤ID */
    adoptedStepId?: string;
    /** 总耗时（毫秒） */
    elapsedMs?: number;
    /** 成功/失败原因 */
    reason?: string;
  };
  /** 所有候选步骤的最终分数 */
  scores?: Array<{
    stepId: string;
    confidence: Confidence;
  }>;
  result?: {
    /** 是否成功 */
    ok: boolean;
    /** 点击坐标 */
    coords?: { x: number; y: number };
    /** 候选元素数量 */
    candidateCount?: number;
    /** 当前屏幕哈希 */
    screenHashNow?: string;
    /** 验证结果 */
    validation?: {
      passed: boolean;
      reason?: string;
    };
  };
}

/**
 * 统一的执行事件类型
 */
export type ExecutionEventV3 = ProgressEventV3 | CompleteEventV3;

// ========== 聚合入口 ==========

/**
 * 任务类型标识
 */
export type TaskKind = 'step' | 'chain' | 'static';

/**
 * 统一任务规格（可选的聚合入口）
 */
export type TaskV3 =
  | { kind: 'step'; step: SingleStepSpecV3 }
  | { kind: 'chain'; spec: ChainSpecV3 }
  | { kind: 'static'; spec: StaticSpecV3 };
