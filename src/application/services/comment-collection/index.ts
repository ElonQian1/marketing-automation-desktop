// src/application/services/comment-collection/index.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 三轨评论采集系统 - 统一导出
 * 
 * 导出所有评论采集适配器和管理器，提供完整的API界面
 */

// ==================== 适配器导出 ====================

// 抖音OpenAPI适配器
export {
  DouyinCommentAdapter,
  createDouyinCommentAdapter,
  validateDouyinConfig,
  type DouyinAPIConfig
} from './DouyinCommentAdapter';

// 统一类型导出（从核心类型模块）
export {
  type WatchTarget,
  type Comment
} from '../../../modules/precise-acquisition/shared/types/core';

// 巨量引擎适配器
export {
  OceanEngineCommentAdapter,
  createOceanEngineCommentAdapter,
  validateOceanEngineConfig,
  type OceanEngineAPIConfig
} from './OceanEngineCommentAdapter';

// 公开白名单适配器
export {
  PublicWhitelistAdapter,
  createPublicWhitelistAdapter,
  validatePublicWhitelistConfig,
  getDefaultPublicWhitelistConfig,
  type PublicWhitelistConfig
} from './PublicWhitelistAdapter';

// ==================== 管理器导出 ====================

// 适配器管理器
export {
  CommentAdapterManager,
  createCommentAdapterManager,
  validateCommentAdapterManagerConfig,
  type CommentAdapterManagerConfig,
  type CollectionStats
} from './CommentAdapterManager';

// 统一接口类型 (直接从 UnifiedCommentAdapter 导出)
export {
  type UnifiedCommentAdapter as CommentAdapter,
  type UnifiedPermissionValidationResult as PermissionValidationResult,
  type UnifiedAdapterStatus as AdapterStatus,
  type UnifiedCommentCollectionParams as CommentCollectionParams,
  type UnifiedCommentCollectionResult as CommentCollectionResult
} from './UnifiedCommentAdapter';

// ==================== 常量定义 ====================

/**
 * 支持的平台列表
 */
export const SUPPORTED_PLATFORMS = ['douyin', 'oceanengine', 'public'] as const;

/**
 * 默认采集参数
 */
export const DEFAULT_COLLECTION_PARAMS = {
  limit: 20,
  cursor: undefined,
  time_range: undefined
} as const;

/**
 * 默认批量处理选项
 */
export const DEFAULT_BATCH_OPTIONS = {
  concurrent_limit: 3,
  delay_between_requests: 1000,
  stop_on_error: false
} as const;

// ==================== 错误类定义 ====================

/**
 * 评论采集相关错误基类
 */
export class CommentCollectionError extends Error {
  public readonly code: string;
  public readonly platform?: string;
  
  constructor(message: string, code: string, platform?: string) {
    super(message);
    this.name = 'CommentCollectionError';
    this.code = code;
    this.platform = platform;
  }
}

/**
 * 适配器不可用错误
 */
export class AdapterUnavailableError extends CommentCollectionError {
  constructor(platform: string, reason: string) {
    super(`Adapter for ${platform} is unavailable: ${reason}`, 'ADAPTER_UNAVAILABLE', platform);
    this.name = 'AdapterUnavailableError';
  }
}

/**
 * 权限验证失败错误
 */
export class PermissionDeniedError extends CommentCollectionError {
  constructor(platform: string, reason: string) {
    super(`Permission denied for ${platform}: ${reason}`, 'PERMISSION_DENIED', platform);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * 速率限制错误
 */
export class RateLimitExceededError extends CommentCollectionError {
  public readonly resetTime?: Date;
  
  constructor(platform: string, resetTime?: Date) {
    super(`Rate limit exceeded for ${platform}`, 'RATE_LIMIT_EXCEEDED', platform);
    this.name = 'RateLimitExceededError';
    this.resetTime = resetTime;
  }
}

/**
 * 目标不支持错误
 */
export class UnsupportedTargetError extends CommentCollectionError {
  constructor(platform: string, targetType: string) {
    super(`Target type ${targetType} not supported by ${platform} adapter`, 'UNSUPPORTED_TARGET', platform);
    this.name = 'UnsupportedTargetError';
  }
}

// ==================== 实用工具函数 ====================

/**
 * 从URL提取平台类型
 */
export function extractPlatformFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    if (domain.includes('douyin') || domain.includes('tiktok')) {
      return 'douyin';
    }
    
    if (domain.includes('oceanengine') || domain.includes('bytedance')) {
      return 'oceanengine';
    }
    
    return 'public';
  } catch {
    return null;
  }
}

/**
 * 生成唯一的评论ID
 */
export function generateCommentId(platform: string, originalId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${platform}_${originalId}_${timestamp}_${random}`;
}

/**
 * 创建评论采集日志记录器
 */
export function createCollectionLogger(prefix = '[CommentCollection]') {
  return {
    info: (message: string, data?: any) => {
      console.log(`${prefix} ${message}`, data || '');
    },
    warn: (message: string, data?: any) => {
      console.warn(`${prefix} ${message}`, data || '');
    },
    error: (message: string, error?: any) => {
      console.error(`${prefix} ${message}`, error || '');
    },
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`${prefix} ${message}`, data || '');
      }
    }
  };
}