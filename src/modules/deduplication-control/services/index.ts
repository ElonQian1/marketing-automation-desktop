// src/modules/deduplication-control/services/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 查重频控服务模块导出
 */

// 去重服务
export {
  DedupContentSimilarityService,
  DedupDeduplicationStorageService,
  DedupDeduplicationService
} from './dedup-deduplication-service';

// 频控服务
export {
  DedupRateLimitStorageService,
  DedupTimeUtils,
  DedupRateLimitService
} from './dedup-rate-limit-service';

// 熔断器服务
export {
  DedupCircuitBreakerStorageService,
  DedupCircuitBreakerDecisionEngine,
  DedupCircuitBreakerService
} from './dedup-circuit-breaker-service';

// 安全检查服务
export {
  DedupListManagementService,
  DedupRiskAssessmentService,
  DedupSafetyCheckService
} from './dedup-safety-check-service';