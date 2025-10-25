// src/types/smartScript.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

// 动作类型定义
export type ActionKind = 
  | 'tap'
  | 'long_press' 
  | 'double_tap'
  | 'swipe'
  | 'input'
  | 'wait'
  | 'back'
  | 'keyevent'
  | 'find_only' // 仅查找，不执行动作
  | 'smart_selection'; // 智能选择

// 步骤动作配置
export interface StepAction {
  kind: ActionKind;
  params?: {
    // tap, long_press, double_tap
    tapOffset?: { x: number; y: number }; // 相对元素bounds的偏移(0~1)，默认中心 {0.5,0.5}
    durationMs?: number;

    // swipe
    swipe?: {
      direction: 'up' | 'down' | 'left' | 'right';
      distancePx?: number;
      durationMs?: number;
      startOffset?: { x: number; y: number };
    };

    // input
    text?: string;
    clearBefore?: boolean;

    // wait
    waitMs?: number;

    // keyevent
    keyCode?: number;

    // smart_selection - 🔥 增强版智能选择参数
    smartSelection?: {
      mode: 'match-original' | 'first' | 'last' | 'random' | 'all' | 'auto';  // 🔥 新增 auto
      targetText?: string;
      resourceId?: string;
      
      // 🆕 必填字段（按用户要求）
      containerXPath: string;  // 容器限域 - 必填
      fingerprint?: ElementFingerprint;  // 指纹（match-original模式必需）
      i18nAliases: string[];  // 国际化别名 - 必填
      plan: FallbackPlan[];   // 回退计划 - 必填（至少2条）
      
      // 🔥 新增高级功能字段
      autoExcludeEnabled?: boolean;  // 🆕 启用自动排除别名，默认true
      excludeText?: string[];  // 🆕 排除文本模式（防止误点"已关注"等）
      dedupeTolerance?: number;  // 🆕 去重容差（px），默认10
      enableLightValidation?: boolean;  // 🆕 启用轻校验，默认true
      
      // 增强配置
      minConfidence?: number;
      batchConfigV2?: {
        intervalMs: number;
        jitterMs: number;        // 🆕 抖动
        maxPerSession: number;   // 🆕 单次会话上限
        cooldownMs: number;      // 🆕 冷却时间
        continueOnError?: boolean;
        showProgress?: boolean;
        refreshPolicy?: 'never' | 'on_mutation' | 'every_k' | 'always';  // 🆕 UI刷新策略
        requeryByFingerprint?: boolean;  // 🆕 指纹重查找
        forceLightValidation?: boolean;  // 🆕 强制轻校验
      };
      
      // 随机模式配置
      randomSeed?: number;
      ensureStableSort?: boolean;  // 🆕 确保可复现随机
      
      // match-original模式配置
      fallbackToFirst?: boolean;  // 🆕 指纹失败时降级到first
    };
  };

  postCheck?: {
    expectVisible?: boolean;
    expectGone?: boolean;
    textContains?: string;
    timeoutMs?: number;
  };
}

// 智能脚本相关类型定义
export interface SmartScriptStep {
  id: string;
  step_type: any; // 兼容 SmartActionType 和 string
  name: string;
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
  order: number;
  // 扩展字段以支持智能功能
  find_condition?: any;
  verification?: any;
  retry_config?: any;
  fallback_actions?: SmartScriptStep[];
  pre_conditions?: string[];
  post_conditions?: string[];
  // 新增：动作配置
  action?: StepAction;
}

// 🆕 元素指纹类型（前端版本）
export interface ElementFingerprint {
  textContent?: string;
  textHash?: string;
  classChain?: string[];
  resourceId?: string;
  resourceIdSuffix?: string;
  boundsSignature?: {
    x: number;        // 中心X坐标比例 (0-1)
    y: number;        // 中心Y坐标比例 (0-1)
    width: number;    // 宽度比例 (0-1)
    height: number;   // 高度比例 (0-1)
  };
  parentClass?: string;
  siblingCount?: number;
  childCount?: number;
  depthLevel?: number;
  relativeIndex?: number;
  clickable?: boolean;
  enabled?: boolean;
  selected?: boolean;
  contentDesc?: string;
  packageName?: string;
}

// 🆕 回退计划类型
export interface FallbackPlan {
  id: string;
  strategy: 'self_id' | 'region_text_to_parent' | 'region_local_index' | 'neighbor_relative' | 'global_index' | 'absolute_xpath';
  description: string;
  timeBudgetMs: number;  // 该策略的时间预算
  priority: number;      // 优先级（数字越小优先级越高）
  params?: Record<string, any>;
}

// 🆕 统一执行结果类型（前端版本）
export interface UnifiedExecutionResult {
  success: boolean;
  usedChain: 'intelligent_chain' | 'single_step' | 'static_strategy';
  usedSelectionMode: string;
  usedVariant?: string;
  matchCountEachStep: number[];
  bounds: Array<{left: number; top: number; right: number; bottom: number}>;
  tapXy: Array<{x: number; y: number; confidence: number; validated: boolean}>;
  timings: {
    dumpTimeMs: number;
    matchTimeMs: number;
    clickTimeMs: number;
    totalTimeMs: number;
  };
  screenshots: string[];
  errorCode?: 'NO_MATCH' | 'MULTI_MATCH' | 'ASSERT_FAIL' | 'MUTATION_DETECTED' | 'TIME_BUDGET_EXCEEDED' | 'DEVICE_ERROR' | 'PROTOCOL_ERROR';
  errorMessage?: string;
}

export interface SingleStepTestResult {
  success: boolean;
  step_id: string;
  step_name: string;
  message: string;
  duration_ms: number;
  timestamp: number;
  page_state?: string;
  ui_elements: any[];
  logs: string[];
  error_details?: string;
  extracted_data: Record<string, any>;
}

export interface SmartExecutionResult {
  success: boolean;
  total_steps: number;
  executed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  duration_ms: number;
  logs: any[];
  final_page_state?: string;
  extracted_data: Record<string, any>;
  message: string;
}