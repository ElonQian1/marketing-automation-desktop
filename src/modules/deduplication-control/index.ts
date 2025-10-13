// src/modules/deduplication-control/index.ts
// module: dedup | layer: public | role: barrel
// summary: 去重控制模块对外公共出口（契约/用例/Hook）

/**
 * 查重频控模块统一导出
 * 
 * 只导出对外稳定的API，不泄露内部服务实现
 */

// 类型定义
export * from './types';

// Note: 不直接导出内部服务实现，应通过用例或Hook暴露功能
// export { DeduplicationService } from './services/dedup-deduplication-service';
// export { RateLimitService } from './services/dedup-rate-limit-service';
// export { CircuitBreakerService } from './services/dedup-circuit-breaker-service';
// export { SafetyCheckService } from './services/dedup-safety-check-service';

// Hooks
export { useSafetyControl } from './hooks/useSafetyControl';

// 组件
export { SafetyConfigPanel } from './components/SafetyConfigPanel';
export { SafetyMonitorPanel } from './components/SafetyMonitorPanel';
export { WhiteBlacklistManager } from './components/WhiteBlacklistManager';
export { DeduplicationControlManager } from './components/DeduplicationControlManager';

// 默认导出主管理组件
export { DeduplicationControlManager as default } from './components/DeduplicationControlManager';