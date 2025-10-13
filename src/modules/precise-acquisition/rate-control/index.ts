// src/modules/precise-acquisition/rate-control/index.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 频控和去重模块导出文件
 */

// 服务
export { RateControlService } from './services/prospecting-rate-control-service';
export type { 
  RateLimitConfig,
  DeduplicationConfig,
  RateLimitCheckResult,
  DeduplicationCheckResult,
  RateControlStats
} from './services/prospecting-rate-control-service';

// 组件
export { RateControlManager } from './components/RateControlManager';