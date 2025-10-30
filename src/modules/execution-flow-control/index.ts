// src/modules/execution-flow-control/index.ts
// module: execution-flow-control | layer: public | role: 模块导出
// summary: 执行流程控制模块的统一导出，提供对外稳定API

// 领域模型导出
export {
  ExecutionFailureStrategy,
  ExecutionFailureHandlingValidator,
  DEFAULT_FAILURE_HANDLING_CONFIG,
  FAILURE_STRATEGY_DESCRIPTIONS,
  FAILURE_STRATEGY_ICONS
} from './domain/failure-handling-strategy';

export type {
  ExecutionFailureHandlingConfig,
  ExecutionFailureDecision,
  ExecutionFlowContext
} from './domain/failure-handling-strategy';

export {
  hasFailureHandling,
  hasFailureHandlingConfig,
  createDefaultFailureHandling,
  adaptStepForFailureHandling,
  adaptStepsForFailureHandling
} from './domain/extended-step-types';

export type {
  ExecutionFlowControlStep,
  FailureHandlingContext,
  ExecutionFlowControlResult,
  ExecutionFlowControllerState
} from './domain/extended-step-types';

// 应用层导出
export { ExecutionFlowController } from './application/execution-flow-use-case';

// 服务层导出
export { ExecutionFlowDecisionService } from './services/execution-flow-decision-service';

// UI组件导出
export {
  ExecutionFailureConfig,
  ExecutionFailureStatusIndicator
} from './ui/execution-failure-config';

export {
  StepFailureConfigPanel
} from './ui/step-failure-config-panel';

// 🆕 高级配置组件导出
export {
  JumpTargetSelector
} from './ui/components/jump-target-selector';

export {
  RetryConfigPanel
} from './ui/components/retry-config-panel';

export {
  AdvancedFailureConfigModal
} from './ui/components/advanced-failure-config-modal';

export type {
  ExecutionFailureConfigProps
} from './ui/execution-failure-config';

export type {
  JumpTargetStep
} from './ui/components/jump-target-selector';

export type {
  RetryConfig
} from './ui/components/retry-config-panel';

export type {
  AdvancedFailureConfig
} from './ui/components/advanced-failure-config-modal';

// Hook导出
export {
  useExecutionFlowControl,
  useStepFailureHandling
} from './hooks/use-execution-flow-control';

//工具导出
export {
  extractFailureConfigFromStep,
  applyFailureConfigToStep,
  convertToExecutionFlowStep,
  convertStepsToExecutionFlowSteps,
  convertFromExecutionFlowStep,
  convertFromExecutionFlowSteps,
  hasValidFailureHandling,
  getStepFailureStrategy,
  createDefaultFailureHandlingForStep
} from './utils/step-type-adapter';

export type {
  UseExecutionFlowControlOptions,
  UseExecutionFlowControlReturn
} from './hooks/use-execution-flow-control';