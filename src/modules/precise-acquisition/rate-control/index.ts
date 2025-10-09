/**
 * 频控和去重模块导出文件
 */

// 服务
export { RateControlService } from './services/RateControlService';
export type { 
  RateLimitConfig,
  DeduplicationConfig,
  RateLimitCheckResult,
  DeduplicationCheckResult,
  RateControlStats
} from './services/RateControlService';

// 组件
export { RateControlManager } from './components/RateControlManager';