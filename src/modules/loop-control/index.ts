// src/modules/loop-control/index.ts
// module: loop-control | layer: public | role: exports
// summary: 循环控制模块统一导出

// 类型导出
export * from './types';

// 组件导出
export { default as LoopStepCard } from './components/LoopStepCard';
export { default as SimpleLoopCard } from './components/SimpleLoopCard'; // 新增简化循环卡片

// Hook导出
export { default as useLoopControl } from './hooks/useLoopControl';

// 工具函数导出
export * from './utils/loopUtils';
export { default as LoopExecutionEngine } from './utils/LoopExecutionEngine';

// 🎯 新增：循环配对和角色切换服务
export { LoopPairingService } from './domain/loop-pairing-service';
export { LoopRoleSwitchService } from './domain/loop-role-switch-service';
export { LoopExecutionService } from './domain/loop-execution-service';
export type { LoopPair } from './domain/loop-pairing-service';
export type { RoleSwitchResult } from './domain/loop-role-switch-service';
export type { LoopExecutionSequence, LoopExecutionResult } from './domain/loop-execution-service';

// 🎯 新增：自动切换 Hook
export { useLoopAutoSwitch } from './application/use-loop-auto-switch';
export type { UseLoopAutoSwitchOptions } from './application/use-loop-auto-switch';

// 🎯 新增：循环测试执行 Hook
export { useLoopTestExecution } from './application/use-loop-test-execution';
export type { UseLoopTestExecutionOptions, LoopTestState, LoopTestStatus } from './application/use-loop-test-execution';

// 🎯 新增：性能优化包装器
export { LoopCardPerformanceWrapper } from './ui/loop-card-performance-wrapper';
export type { LoopCardPerformanceWrapperProps } from './ui/loop-card-performance-wrapper';

// 🎯 新增：循环测试按钮
export { LoopTestButton, CompactLoopTestButton, LoopTestButtonWithProgress } from './ui/loop-test-button';
export type { LoopTestButtonProps } from './ui/loop-test-button';