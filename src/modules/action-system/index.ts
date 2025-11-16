// src/modules/action-system/index.ts
// module: action-system | layer: module | role: 操作类型系统统一导出
// summary: 操作类型系统的门牌导出，提供统一API接口

// 核心类型定义
export * from '../../types/action-types';

// API 层
export * from '../../api/action-execution';

// Hook 层
export * from '../../hooks/useActionExecution';
export * from '../../hooks/useActionRecommendation';

// 组件层
export * from '../../components/action-system/ActionSelector';
export * from '../../components/action-system/ActionParamsPanel';
export * from '../../components/action-system/ActionPreview';

// 工具函数
export { createActionType, validateActionParams, ACTION_CONFIGS } from '../../types/action-types';

// 便捷类型别名
export type {
  ActionType,
  ActionTypeId
} from '../../types/action-types';

// API层类型
export type {
  ActionResult,
  ActionRecommendation,
  ActionExecutionResult
} from '../../api/action-execution';

export type { ActionExecutionResult as ExecutionResult } from '../../api/action-execution';