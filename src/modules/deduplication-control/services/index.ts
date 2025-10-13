// src/modules/deduplication-control/services/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 查重频控服务模块导出
 */

// 去重服务
export {
  DedupContentSimilarityService,
  DeduplicationStorageService,
  DeduplicationService
} from './dedup-deduplication-service';

// 频控服务
export {
  RateLimitStorageService,
  TimeUtils,
  RateLimitService
} from './dedup-rate-limit-service';

// 熔断器服务
export {
  CircuitBreakerStorageService,
  CircuitBreakerDecisionEngine,
  CircuitBreakerService
} from './dedup-circuit-breaker-service';

// 安全检查服务
export {
  DedupListManagementService,
  DedupRiskAssessmentService,
  DedupSafetyCheckService
} from './dedup-safety-check-service';