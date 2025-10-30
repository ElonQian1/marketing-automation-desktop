// src/modules/execution-flow-control/domain/failure-handling-strategy.ts
// module: execution-flow-control | layer: domain | role: 失败处理策略领域模型
// summary: 定义脚本执行失败时的处理策略，包括停止、继续、跳转等行为

/**
 * 失败处理策略类型
 */
export enum ExecutionFailureStrategy {
  /** 停止整个脚本 */
  STOP_SCRIPT = 'stop_script',
  /** 继续执行下一步 */
  CONTINUE_NEXT = 'continue_next',
  /** 跳转到指定步骤 */
  JUMP_TO_STEP = 'jump_to_step',
  /** 重试当前步骤 */
  RETRY_CURRENT = 'retry_current',
  /** 跳过当前步骤并标记为已跳过 */
  SKIP_CURRENT = 'skip_current'
}

/**
 * 失败处理配置
 */
export interface ExecutionFailureHandlingConfig {
  /** 处理策略 */
  strategy: ExecutionFailureStrategy;
  
  /** 跳转目标步骤ID（仅当strategy为JUMP_TO_STEP时有效） */
  targetStepId?: string;
  
  /** 跳转目标步骤索引（仅当strategy为JUMP_TO_STEP时有效，优先级低于stepId） */
  targetStepIndex?: number;
  
  /** 重试次数（仅当strategy为RETRY_CURRENT时有效） */
  retryCount?: number;
  
  /** 重试间隔（毫秒） */
  retryIntervalMs?: number;
  
  /** 失败描述信息 */
  failureMessage?: string;
  
  /** 是否记录详细失败日志 */
  enableDetailedLogging?: boolean;
}

/**
 * 默认失败处理配置
 */
export const DEFAULT_FAILURE_HANDLING_CONFIG: ExecutionFailureHandlingConfig = {
  strategy: ExecutionFailureStrategy.STOP_SCRIPT,
  retryCount: 0,
  retryIntervalMs: 1000,
  enableDetailedLogging: true
};

/**
 * 失败处理策略描述
 */
export const FAILURE_STRATEGY_DESCRIPTIONS: Record<ExecutionFailureStrategy, string> = {
  [ExecutionFailureStrategy.STOP_SCRIPT]: '停止整个脚本执行',
  [ExecutionFailureStrategy.CONTINUE_NEXT]: '跳过失败步骤，继续执行后续步骤',
  [ExecutionFailureStrategy.JUMP_TO_STEP]: '跳转到指定步骤继续执行',
  [ExecutionFailureStrategy.RETRY_CURRENT]: '重试当前失败的步骤',
  [ExecutionFailureStrategy.SKIP_CURRENT]: '跳过当前步骤并标记为已跳过'
};

/**
 * 失败处理策略图标
 */
export const FAILURE_STRATEGY_ICONS: Record<ExecutionFailureStrategy, string> = {
  [ExecutionFailureStrategy.STOP_SCRIPT]: '🛑',
  [ExecutionFailureStrategy.CONTINUE_NEXT]: '⏭️',
  [ExecutionFailureStrategy.JUMP_TO_STEP]: '🎯',
  [ExecutionFailureStrategy.RETRY_CURRENT]: '🔄',
  [ExecutionFailureStrategy.SKIP_CURRENT]: '⏸️'
};

/**
 * 失败处理决策结果
 */
export interface ExecutionFailureDecision {
  /** 决策类型 */
  action: ExecutionFailureStrategy;
  
  /** 目标步骤ID（如果是跳转） */
  targetStepId?: string;
  
  /** 目标步骤索引（如果是跳转） */
  targetStepIndex?: number;
  
  /** 是否应该停止整个执行 */
  shouldStop: boolean;
  
  /** 是否应该重试 */
  shouldRetry: boolean;
  
  /** 重试次数 */
  retryCount?: number;
  
  /** 决策原因描述 */
  reason: string;
  
  /** 额外的上下文信息 */
  context?: Record<string, unknown>;
}

/**
 * 执行上下文信息
 */
export interface ExecutionFlowContext {
  /** 当前步骤索引 */
  currentStepIndex: number;
  
  /** 当前步骤ID */
  currentStepId: string;
  
  /** 总步骤数 */
  totalSteps: number;
  
  /** 已执行步骤数 */
  executedSteps: number;
  
  /** 已失败步骤数 */
  failedSteps: number;
  
  /** 已跳过步骤数 */
  skippedSteps: number;
  
  /** 失败错误信息 */
  error?: Error | string;
  
  /** 可用的步骤列表（用于跳转选择） */
  availableSteps: Array<{
    id: string;
    index: number;
    name: string;
    enabled: boolean;
  }>;
}

/**
 * 失败处理策略验证器
 */
export class ExecutionFailureHandlingValidator {
  /**
   * 验证失败处理配置是否有效
   */
  static validate(config: ExecutionFailureHandlingConfig, context: ExecutionFlowContext): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证跳转目标
    if (config.strategy === ExecutionFailureStrategy.JUMP_TO_STEP) {
      if (!config.targetStepId && config.targetStepIndex === undefined) {
        errors.push('跳转策略必须指定目标步骤ID或索引');
      }
      
      if (config.targetStepIndex !== undefined) {
        if (config.targetStepIndex < 0 || config.targetStepIndex >= context.totalSteps) {
          errors.push(`目标步骤索引 ${config.targetStepIndex} 超出范围 [0, ${context.totalSteps - 1}]`);
        }
        
        if (config.targetStepIndex === context.currentStepIndex) {
          warnings.push('跳转到当前步骤可能导致无限循环');
        }
      }
      
      if (config.targetStepId) {
        const targetStep = context.availableSteps.find(step => step.id === config.targetStepId);
        if (!targetStep) {
          errors.push(`目标步骤 ${config.targetStepId} 不存在`);
        } else if (!targetStep.enabled) {
          warnings.push(`目标步骤 ${config.targetStepId} 已被禁用`);
        }
      }
    }

    // 验证重试配置
    if (config.strategy === ExecutionFailureStrategy.RETRY_CURRENT) {
      if (!config.retryCount || config.retryCount <= 0) {
        errors.push('重试策略必须指定有效的重试次数');
      }
      
      if (config.retryCount && config.retryCount > 10) {
        warnings.push('重试次数过多可能导致执行时间过长');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}