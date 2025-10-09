/**
 * 查重频控模块 - 统一导出
 */

export * from './types';
export * from './services/RateLimitService';
export * from './services/DedupChecker';
export * from './services/RateLimiter';
export * from './services/RecordManager';

// 导出主要服务实例
export { rateLimitService } from './services/RateLimitService';