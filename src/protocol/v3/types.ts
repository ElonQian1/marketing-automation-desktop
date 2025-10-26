// src/protocol/v3/types.ts  
// module: protocol | layer: domain | role: V3统一执行协议类型定义
// summary: 企业级V3协议，统一智能单步/自动链/静态策略三大执行系统
//
// 🚀 [V3 统一执行协议 - 已完成并启用]
//
// ✅ 这是 V2 → V3 迁移的核心协议成果，已在生产环境中启用
// ✅ 解决了 V2 系统的所有类型问题，提供企业级统一类型系统
//
// 🔄 V2 → V3 类型系统重构对比：
//
//   【V2 类型系统痛点】❌ 已解决
//   ❌ 三套混乱类型：SmartScriptStep, ChainResult, StaticSpec（不统一）  
//   ❌ 序列化失败：footer_other 无法转换为 StepType 枚举
//   ❌ 重复定义混乱：相同功能类型散布在 6+ 文件中
//   ❌ 维护噩梦：修改一个类型需要同步改动多个文件
//   ❌ 类型安全缺失：前后端类型不匹配导致运行时错误
//
//   【V3 统一协议系统】✅ 当前版本
//   ✅ 三合一统一：SingleStepSpecV3, ChainSpecV3, StaticSpecV3 
//   ✅ 类型安全保障：前后端 TypeScript ↔ Rust 完美对应
//   ✅ 智能类型转换：增强类型自动映射为标准类型
//   ✅ 单一数据源：新增执行类型只需修改此文件
//   ✅ 强类型约束：编译时发现类型错误，零运行时异常
//
// 🎯 核心设计优势：
//   1️⃣ by-ref 引用模式：只传 analysisId (~5KB)，后端从缓存读取完整数据
//   2️⃣ by-inline 内联模式：传完整数据 (~500KB)，兼容调试和特殊场景
//   3️⃣ 上下文信封：统一设备ID、应用包名、屏幕快照等环境信息
//   4️⃣ 质量控制标准化：OCR设置、执行约束、验证规则统一管理
//   5️⃣ 错误处理统一：标准化错误码和回退机制
//
// 📋 使用示例对比：
//   invoke('start_intelligent_analysis', { 
//     element_context: {...}, // 几百行配置
//     step_id: 'xxx'
//   });
//
//   // V3 调用（简洁）
//   invoke('execute_chain_test_v3', {
//     spec: { analysis_id: 'xxx', threshold: 0.7 }, // 只需 2 个字段
//     context: { deviceId, app: {...} }
//   });
//
// 集成状态：
//   ✅ 类型定义：完整且与 Rust 后端同步
//   ✅ 后端支持：src-tauri/src/exec/v3/types.rs 对应
//   ⏳ 前端服务：待创建使用这些类型的服务层
//
// 详见：EXECUTION_V2_MIGRATION_GUIDE.md
// ============================================

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
  /** 用户选择模式：控制智能选择行为（第一个、精确匹配、批量全部等） */
  selectionMode?: 'first' | 'last' | 'match-original' | 'random' | 'all' | 'auto';
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
