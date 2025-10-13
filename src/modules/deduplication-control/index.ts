// src/modules/deduplication-control/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 查重频控模块统一导出
 * 
 * 提供模块内所有公共接口的统一入口
 */

// 类型定义
export * from './types';

// 服务类
export { DeduplicationService } from './services/dedup-deduplication-service';
export { RateLimitService } from './services/dedup-rate-limit-service';
export { CircuitBreakerService } from './services/dedup-circuit-breaker-service';
export { SafetyCheckService } from './services/dedup-safety-check-service';

// Hooks
export { useSafetyControl } from './hooks/useSafetyControl';

// 组件
export { SafetyConfigPanel } from './components/SafetyConfigPanel';
export { SafetyMonitorPanel } from './components/SafetyMonitorPanel';
export { WhiteBlacklistManager } from './components/WhiteBlacklistManager';
export { DeduplicationControlManager } from './components/DeduplicationControlManager';

// 默认导出主管理组件
export { DeduplicationControlManager as default } from './components/DeduplicationControlManager';