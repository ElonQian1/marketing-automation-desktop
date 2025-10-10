/**
 * 评论采集适配器管理器
 * 
 * 统一管理三轨评论采集适配器：抖音OpenAPI、巨量引擎、公开白名单
 * 实现适配器选择、权限验证、任务分发等核心功能
 */

import { Platform, Comment, WatchTarget } from '../../../modules/precise-acquisition/shared/types/core';
import { 
  DouyinCommentAdapter, 
  DouyinAPIConfig,
  createDouyinCommentAdapter 
} from './DouyinCommentAdapter';
import { 
  OceanEngineCommentAdapter, 
  OceanEngineAPIConfig,
  createOceanEngineCommentAdapter 
} from './OceanEngineCommentAdapter';
import { 
  PublicWhitelistAdapter, 
  PublicWhitelistConfig,
  createPublicWhitelistAdapter 
} from './PublicWhitelistAdapter';

// ==================== 统一接口导入 ====================

import {
  UnifiedCommentAdapter as CommentAdapter,
  UnifiedCommentCollectionParams as CommentCollectionParams,
  UnifiedCommentCollectionResult as CommentCollectionResult,
  UnifiedAdapterStatus as AdapterStatus,
  UnifiedPermissionValidationResult as PermissionValidationResult
} from './UnifiedCommentAdapter';

// ==================== 适配器管理器配置 ====================

export interface CommentAdapterManagerConfig {
  douyin?: DouyinAPIConfig;
  oceanengine?: OceanEngineAPIConfig;
  public_whitelist?: PublicWhitelistConfig;
  default_strategy: 'auto' | 'platform_priority' | 'manual';
  platform_priority?: Platform[];
  fallback_enabled: boolean;
}

// ==================== 采集统计信息 ====================

export interface CollectionStats {
  total_collections: number;
  successful_collections: number;
  failed_collections: number;
  total_comments: number;
  collections_by_platform: Record<Platform, number>;
  collections_by_adapter: Record<string, number>;
  average_response_time: number;
  last_collection_time?: Date;
}

// ==================== 适配器管理器 ====================

export class CommentAdapterManager {
  private adapters: Map<Platform, CommentAdapter> = new Map();
  private config: CommentAdapterManagerConfig;
  private stats: CollectionStats;

  constructor(config: CommentAdapterManagerConfig) {
    this.config = config;
    this.stats = this.initializeStats();
    this.initializeAdapters();
  }

  /**
   * 初始化所有适配器
   */
  private initializeAdapters(): void {
    // 初始化抖音适配器
    if (this.config.douyin) {
      try {
        const douyinAdapter = createDouyinCommentAdapter(this.config.douyin);
        this.adapters.set(Platform.DOUYIN, douyinAdapter);
      } catch (error) {
        console.error('[CommentAdapterManager] Failed to initialize Douyin adapter:', error);
      }
    }

    // 初始化巨量引擎适配器
    if (this.config.oceanengine) {
      try {
        const oceanEngineAdapter = createOceanEngineCommentAdapter(this.config.oceanengine);
        this.adapters.set(Platform.OCEANENGINE, oceanEngineAdapter);
      } catch (error) {
        console.error('[CommentAdapterManager] Failed to initialize OceanEngine adapter:', error);
      }
    }

    // 初始化公开白名单适配器
    if (this.config.public_whitelist) {
      try {
        const publicAdapter = createPublicWhitelistAdapter(this.config.public_whitelist);
        this.adapters.set(Platform.PUBLIC, publicAdapter);
      } catch (error) {
        console.error('[CommentAdapterManager] Failed to initialize Public adapter:', error);
      }
    }
  }

  /**
   * 获取所有适配器状态
   */
  async getAllAdapterStatus(): Promise<Record<Platform, AdapterStatus>> {
    const statusMap: Record<Platform, AdapterStatus> = {} as Record<Platform, AdapterStatus>;

    for (const [platform, adapter] of this.adapters) {
      try {
        statusMap[platform] = await adapter.getStatus();
      } catch (error) {
        statusMap[platform] = {
          platform,
          available: false,
          auth_status: 'invalid',
          last_error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return statusMap;
  }

  /**
   * 为目标选择最佳适配器
   */
  async selectBestAdapter(target: WatchTarget): Promise<{
    adapter: CommentAdapter;
    platform: Platform;
    reason: string;
  } | null> {
    // 首先尝试目标指定的平台
    if (this.adapters.has(target.platform)) {
      const adapter = this.adapters.get(target.platform)!;
      
      if (adapter.isTargetSupported(target)) {
        const status = await adapter.getStatus();
        if (status.available) {
          const permissions = await adapter.validatePermissions(target);
          if (permissions.canCollect) {
            return {
              adapter,
              platform: target.platform,
              reason: 'Target platform match with valid permissions'
            };
          }
        }
      }
    }

    // 根据策略选择适配器
    switch (this.config.default_strategy) {
      case 'auto':
        return this.selectAdapterAuto(target);
      case 'platform_priority':
        return this.selectAdapterByPriority(target);
      case 'manual':
        return null; // 手动模式不自动选择
      default:
        return this.selectAdapterAuto(target);
    }
  }

  /**
   * 自动选择适配器
   */
  private async selectAdapterAuto(target: WatchTarget): Promise<{
    adapter: CommentAdapter;
    platform: Platform;
    reason: string;
  } | null> {
    const candidateAdapters: Array<{
      adapter: CommentAdapter;
      platform: Platform;
      score: number;
    }> = [];

    for (const [platform, adapter] of this.adapters) {
      if (!adapter.isTargetSupported(target)) continue;

      const status = await adapter.getStatus();
      if (!status.available) continue;

      const permissions = await adapter.validatePermissions(target);
      if (!permissions.canCollect) continue;

      // 计算适配器评分
      let score = 0;
      
      // 平台匹配度
      if (platform === target.platform) score += 100;
      
      // 历史成功率
      const platformStats = this.stats.collections_by_platform[platform] || 0;
      if (platformStats > 0) score += Math.min(platformStats / 10, 50);
      
      // 权限完整性
      if (!permissions.requiredScopes || permissions.requiredScopes.length === 0) score += 20;

      candidateAdapters.push({ adapter, platform, score });
    }

    if (candidateAdapters.length === 0) return null;

    // 选择评分最高的适配器
    candidateAdapters.sort((a, b) => b.score - a.score);
    const best = candidateAdapters[0];

    return {
      adapter: best.adapter,
      platform: best.platform,
      reason: `Auto-selected based on score: ${best.score}`
    };
  }

  /**
   * 按优先级选择适配器
   */
  private async selectAdapterByPriority(target: WatchTarget): Promise<{
    adapter: CommentAdapter;
    platform: Platform;
    reason: string;
  } | null> {
    const priorities = this.config.platform_priority || [Platform.DOUYIN, Platform.OCEANENGINE, Platform.PUBLIC];

    for (const platform of priorities) {
      const adapter = this.adapters.get(platform);
      if (!adapter) continue;

      if (!adapter.isTargetSupported(target)) continue;

      const status = await adapter.getStatus();
      if (!status.available) continue;

      const permissions = await adapter.validatePermissions(target);
      if (permissions.canCollect) {
        return {
          adapter,
          platform,
          reason: `Selected by platform priority (position: ${priorities.indexOf(platform) + 1})`
        };
      }
    }

    return null;
  }

  /**
   * 采集评论（主要入口方法）
   */
  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const startTime = Date.now();
    
    try {
      // 选择适配器
      const selection = await this.selectBestAdapter(params.target);
      if (!selection) {
        throw new Error('No suitable adapter found for target');
      }

      console.log(`[CommentAdapterManager] Using ${selection.platform} adapter: ${selection.reason}`);

      // 执行采集
      const result = await selection.adapter.collectComments(params);

      // 更新统计信息
      this.updateStats(selection.platform, true, result.comments.length, Date.now() - startTime);

      return result;

    } catch (error) {
      // 更新失败统计
      this.updateStats(params.target.platform, false, 0, Date.now() - startTime);

      // 尝试回退策略
      if (this.config.fallback_enabled && error instanceof Error && !error.message.includes('No suitable adapter')) {
        console.warn(`[CommentAdapterManager] Primary collection failed, trying fallback: ${error.message}`);
        return this.collectCommentsWithFallback(params);
      }

      throw error;
    }
  }

  /**
   * 回退采集策略
   */
  private async collectCommentsWithFallback(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const availableAdapters: Array<{ adapter: CommentAdapter; platform: Platform }> = [];

    // 收集所有可用的适配器
    for (const [platform, adapter] of this.adapters) {
      if (adapter.isTargetSupported(params.target)) {
        const status = await adapter.getStatus();
        if (status.available) {
          const permissions = await adapter.validatePermissions(params.target);
          if (permissions.canCollect) {
            availableAdapters.push({ adapter, platform });
          }
        }
      }
    }

    if (availableAdapters.length === 0) {
      throw new Error('No fallback adapters available');
    }

    // 尝试每个适配器
    for (const { adapter, platform } of availableAdapters) {
      try {
        console.log(`[CommentAdapterManager] Trying fallback adapter: ${platform}`);
        const result = await adapter.collectComments(params);
        
        this.updateStats(platform, true, result.comments.length, 0);
        return result;

      } catch (fallbackError) {
        console.warn(`[CommentAdapterManager] Fallback adapter ${platform} failed:`, fallbackError);
        this.updateStats(platform, false, 0, 0);
        continue;
      }
    }

    throw new Error('All fallback adapters failed');
  }

  /**
   * 批量采集评论
   */
  async collectCommentsInBatch(
    targets: WatchTarget[],
    params: Omit<CommentCollectionParams, 'target'>,
    batchOptions?: {
      concurrent_limit?: number;
      delay_between_requests?: number;
      stop_on_error?: boolean;
    }
  ): Promise<{
    results: Array<{
      target: WatchTarget;
      result?: CommentCollectionResult;
      error?: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      total_comments: number;
    };
  }> {
    const concurrentLimit = batchOptions?.concurrent_limit || 3;
    const delay = batchOptions?.delay_between_requests || 1000;
    const stopOnError = batchOptions?.stop_on_error || false;

    const results: Array<{
      target: WatchTarget;
      result?: CommentCollectionResult;
      error?: string;
    }> = [];

    const summary = {
      total: targets.length,
      successful: 0,
      failed: 0,
      total_comments: 0
    };

    // 分批处理
    for (let i = 0; i < targets.length; i += concurrentLimit) {
      const batch = targets.slice(i, i + concurrentLimit);
      
      const batchPromises = batch.map(async (target) => {
        try {
          const result = await this.collectComments({ ...params, target });
          return { target, result };
        } catch (error) {
          return { 
            target, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      for (const batchResult of batchResults) {
        results.push(batchResult);
        
        if (batchResult.result) {
          summary.successful++;
          summary.total_comments += batchResult.result.comments.length;
        } else {
          summary.failed++;
          
          if (stopOnError) {
            console.error(`[CommentAdapterManager] Stopping batch due to error: ${batchResult.error}`);
            return { results, summary };
          }
        }
      }

      // 批次间延迟
      if (i + concurrentLimit < targets.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { results, summary };
  }

  /**
   * 获取采集统计信息
   */
  getCollectionStats(): CollectionStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * 更新适配器配置
   */
  updateAdapterConfig(platform: Platform, config: any): void {
    const adapter = this.adapters.get(platform);
    if (adapter && 'updateConfig' in adapter) {
      (adapter as any).updateConfig(config);
    }
  }

  /**
   * 获取可用的平台列表
   */
  getAvailablePlatforms(): Platform[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 检查特定目标的支持情况
   */
  async checkTargetSupport(target: WatchTarget): Promise<{
    supported_platforms: Platform[];
    available_adapters: Platform[];
    permission_issues: Record<Platform, string>;
  }> {
    const supported_platforms: Platform[] = [];
    const available_adapters: Platform[] = [];
    const permission_issues: Record<Platform, string> = {
      [Platform.DOUYIN]: '',
      [Platform.OCEANENGINE]: '',
      [Platform.PUBLIC]: '',
      [Platform.XIAOHONGSHU]: '',
    };

    for (const [platform, adapter] of this.adapters) {
      if (adapter.isTargetSupported(target)) {
        supported_platforms.push(platform);

        const status = await adapter.getStatus();
        if (status.available) {
          const permissions = await adapter.validatePermissions(target);
          if (permissions.canCollect) {
            available_adapters.push(platform);
          } else {
            permission_issues[platform] = permissions.reason || 'Permission check failed';
          }
        } else {
          permission_issues[platform] = status.last_error || 'Adapter not available';
        }
      }
    }

    return {
      supported_platforms,
      available_adapters,
      permission_issues
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化统计信息
   */
  private initializeStats(): CollectionStats {
    return {
      total_collections: 0,
      successful_collections: 0,
      failed_collections: 0,
      total_comments: 0,
      collections_by_platform: {} as Record<Platform, number>,
      collections_by_adapter: {},
      average_response_time: 0,
      last_collection_time: undefined
    };
  }

  /**
   * 更新统计信息
   */
  private updateStats(platform: Platform, success: boolean, commentCount: number, responseTime: number): void {
    this.stats.total_collections++;
    
    if (success) {
      this.stats.successful_collections++;
      this.stats.total_comments += commentCount;
    } else {
      this.stats.failed_collections++;
    }

    // 更新平台统计
    this.stats.collections_by_platform[platform] = (this.stats.collections_by_platform[platform] || 0) + 1;

    // 更新平均响应时间
    const totalTime = this.stats.average_response_time * (this.stats.total_collections - 1) + responseTime;
    this.stats.average_response_time = totalTime / this.stats.total_collections;

    this.stats.last_collection_time = new Date();
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建评论适配器管理器实例
 */
export function createCommentAdapterManager(config: CommentAdapterManagerConfig): CommentAdapterManager {
  return new CommentAdapterManager(config);
}

// ==================== 配置验证 ====================

/**
 * 验证适配器管理器配置
 */
export function validateCommentAdapterManagerConfig(config: Partial<CommentAdapterManagerConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.default_strategy) {
    errors.push('default_strategy is required');
  }

  if (config.default_strategy === 'platform_priority' && !config.platform_priority) {
    errors.push('platform_priority is required when using platform_priority strategy');
  }

  if (!config.douyin && !config.oceanengine && !config.public_whitelist) {
    errors.push('At least one adapter configuration is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}