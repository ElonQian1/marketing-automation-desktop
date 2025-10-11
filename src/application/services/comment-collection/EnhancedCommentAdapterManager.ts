// src/application/services/comment-collection/EnhancedCommentAdapterManager.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 增强的评论采集适配器管理器
 * 
 * 🎯 整合了 CommentCollectionService 的业务功能
 * 🔄 保持了原有的策略选择和回退机制
 * 📈 新增数据管理、调度和审计功能
 */

import { invoke } from '@tauri-apps/api/core';
import { Platform, Comment, WatchTarget, CommentQueryParams, AuditAction } from '../../../modules/precise-acquisition/shared/types/core';
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

// ==================== 增强接口定义 ====================

/**
 * 🆕 批量采集配置 (来自 CommentCollectionService)
 */
export interface BatchCollectionConfig {
  targets: WatchTarget[];
  max_comments_per_target: number;
  collection_interval_ms: number;
  respect_rate_limits: boolean;
  skip_failed_targets: boolean;
  since?: Date;
  until?: Date;
}

/**
 * 🆕 批量采集结果 (来自 CommentCollectionService)
 */
export interface BatchCollectionResult {
  total_targets: number;
  successful_targets: number;
  failed_targets: number;
  total_comments_collected: number;
  results: Array<{
    target: WatchTarget;
    success: boolean;
    result?: CommentCollectionResult;
    error?: string;
  }>;
  elapsed_time_ms: number;
}

/**
 * 🆕 自动调度配置 (来自 CommentCollectionService)
 */
export interface AutoCollectionConfig {
  targets: WatchTarget[];
  interval_hours: number;
  max_comments_per_target: number;
  respect_rate_limits: boolean;
}

/**
 * 🆕 调度结果 (来自 CommentCollectionService)
 */
export interface ScheduleResult {
  scheduled: boolean;
  next_run_time: Date;
  scheduled_targets: number;
}

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
  
  // 🆕 增强统计 (来自 CommentCollectionService)
  comments_collected_today: number;
  comments_collected_this_week: number;
  by_platform: Record<Platform, {
    targets_count: number;
    comments_count: number;
    last_collection: Date | null;
  }>;
  recent_errors: Array<{
    timestamp: Date;
    target_id: string;
    platform: Platform;
    error: string;
  }>;
}

// ==================== 增强的适配器管理器 ====================

export class EnhancedCommentAdapterManager {
  private adapters: Map<Platform, CommentAdapter> = new Map();
  private config: CommentAdapterManagerConfig;
  private stats: CollectionStats;
  private collectionHistory: Map<string, Date> = new Map(); // 🆕 来自 CommentCollectionService

  constructor(config: CommentAdapterManagerConfig) {
    this.config = config;
    this.stats = this.initializeStats();
    this.initializeAdapters();
  }

  // ==================== 原有功能保持 ====================
  
  /**
   * 初始化所有适配器
   */
  private initializeAdapters(): void {
    // 抖音适配器
    if (this.config.douyin) {
      try {
        const douyinAdapter = createDouyinCommentAdapter(this.config.douyin);
        this.adapters.set(Platform.DOUYIN, douyinAdapter);
      } catch (error) {
        console.warn('Failed to initialize Douyin adapter:', error);
      }
    }

    // 巨量引擎适配器
    if (this.config.oceanengine) {
      try {
        const oceanEngineAdapter = createOceanEngineCommentAdapter(this.config.oceanengine);
        this.adapters.set(Platform.OCEANENGINE, oceanEngineAdapter);
      } catch (error) {
        console.warn('Failed to initialize OceanEngine adapter:', error);
      }
    }

    // 公开白名单适配器
    if (this.config.public_whitelist) {
      try {
        const publicAdapter = createPublicWhitelistAdapter(this.config.public_whitelist);
        this.adapters.set(Platform.PUBLIC, publicAdapter);
      } catch (error) {
        console.warn('Failed to initialize Public Whitelist adapter:', error);
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

  // ==================== 🆕 数据管理功能 (来自 CommentCollectionService) ====================

  /**
   * 🆕 获取已采集的评论列表
   */
  async getComments(params: CommentQueryParams = {}): Promise<{
    comments: Comment[];
    total: number;
  }> {
    try {
      const result = await invoke('get_collected_comments', {
        limit: params.limit || 50,
        offset: params.offset || 0,
        platform: params.platform || null,
        sourceTargetId: params.source_target_id || null,
        region: params.region || null,
        minLikeCount: params.min_like_count || null,
        timeRange: params.time_range ? {
          start: params.time_range.start.toISOString(),
          end: params.time_range.end.toISOString()
        } : null
      });

      return result as { comments: Comment[]; total: number };
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw error;
    }
  }

  /**
   * 🆕 检查目标是否需要更新
   */
  async checkTargetsForUpdate(targets: WatchTarget[], updateThresholdHours: number = 24): Promise<WatchTarget[]> {
    const needsUpdate: WatchTarget[] = [];
    const thresholdTime = new Date(Date.now() - updateThresholdHours * 60 * 60 * 1000);

    for (const target of targets) {
      const lastCollection = this.collectionHistory.get(target.id) || target.last_fetch_at;
      
      if (!lastCollection || lastCollection < thresholdTime) {
        needsUpdate.push(target);
      }
    }

    return needsUpdate;
  }

  /**
   * 🆕 自动采集调度
   */
  async scheduleAutoCollection(config: AutoCollectionConfig): Promise<ScheduleResult> {
    try {
      const result = await invoke('schedule_auto_collection', {
        targets: config.targets.map(t => t.id),
        intervalHours: config.interval_hours,
        maxCommentsPerTarget: config.max_comments_per_target,
        respectRateLimits: config.respect_rate_limits
      });

      return result as ScheduleResult;
    } catch (error) {
      console.error('Failed to schedule auto collection:', error);
      throw error;
    }
  }

  // ==================== 🆕 批量采集功能 (整合两个系统) ====================

  /**
   * 🆕 批量采集评论 (整合版本)
   */
  async batchCollectComments(config: BatchCollectionConfig): Promise<BatchCollectionResult> {
    const startTime = Date.now();
    const results: BatchCollectionResult['results'] = [];
    
    let successfulTargets = 0;
    let failedTargets = 0;
    let totalCommentsCollected = 0;

    for (const target of config.targets) {
      try {
        // 检查频率限制
        if (config.respect_rate_limits) {
          await this.checkRateLimit(target);
        }

        // 执行采集
        const result = await this.collectComments({
          target,
          limit: config.max_comments_per_target,
          since: config.since,
          until: config.until
        });

        results.push({
          target,
          success: true,
          result
        });

        successfulTargets++;
        totalCommentsCollected += result.comments.length;

        // 记录采集历史
        this.collectionHistory.set(target.id, new Date());

        // 采集间隔
        if (config.collection_interval_ms > 0) {
          await this.sleep(config.collection_interval_ms);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        
        results.push({
          target,
          success: false,
          error: errorMessage
        });

        failedTargets++;

        // 是否跳过失败的目标
        if (!config.skip_failed_targets) {
          break;
        }
      }
    }

    const elapsedTime = Date.now() - startTime;

    return {
      total_targets: config.targets.length,
      successful_targets: successfulTargets,
      failed_targets: failedTargets,
      total_comments_collected: totalCommentsCollected,
      results,
      elapsed_time_ms: elapsedTime
    };
  }

  // ==================== 🆕 私有工具方法 (来自 CommentCollectionService) ====================

  /**
   * 🆕 检查频率限制
   */
  private async checkRateLimit(target: WatchTarget): Promise<void> {
    const adapter = this.adapters.get(target.platform);
    if (!adapter) return;

    const status = await adapter.getStatus();
    if (status.rate_limit_remaining !== undefined && status.rate_limit_remaining <= 0) {
      const resetTime = status.rate_limit_reset_time;
      const waitTime = resetTime ? resetTime.getTime() - Date.now() : 60000;
      
      if (waitTime > 0) {
        throw new Error(`频率限制：需等待 ${Math.ceil(waitTime / 1000)} 秒`);
      }
    }
  }

  /**
   * 🆕 保存采集结果
   */
  private async saveCollectionResult(result: CommentCollectionResult): Promise<void> {
    try {
      await invoke('save_collection_result', {
        targetId: result.target_id,
        platform: result.source_platform,
        comments: result.comments,
        totalCount: result.total_count,
        collectedAt: result.collected_at.toISOString()
      });
    } catch (error) {
      console.error('Failed to save collection result:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 🆕 记录审计事件
   */
  private async logAuditEvent(event: {
    action: AuditAction;
    target_id?: string;
    platform?: Platform;
    operator: string;
  }): Promise<void> {
    try {
      await invoke('log_audit_event', {
        action: event.action,
        targetId: event.target_id,
        platform: event.platform,
        operator: event.operator,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * 🆕 工具函数：睡眠
   */
  /**
   * 🆕 记录采集错误
   */
  private async logCollectionError(target: WatchTarget, error: any): Promise<void> {
    try {
      await invoke('log_collection_error', {
        targetId: target.id,
        platform: target.platform,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log collection error:', logError);
    }
  }

  /**
   * 更新统计信息 (增强版本)
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

    // 🆕 更新增强统计
    if (!this.stats.by_platform[platform]) {
      this.stats.by_platform[platform] = {
        targets_count: 0,
        comments_count: 0,
        last_collection: null
      };
    }
    
    this.stats.by_platform[platform].targets_count++;
    this.stats.by_platform[platform].comments_count += commentCount;
    this.stats.by_platform[platform].last_collection = new Date();

    // 更新平均响应时间
    const totalTime = this.stats.average_response_time * (this.stats.total_collections - 1) + responseTime;
    this.stats.average_response_time = totalTime / this.stats.total_collections;

    this.stats.last_collection_time = new Date();

    // 🆕 记录错误到recent_errors (失败时)
    if (!success) {
      this.stats.recent_errors.push({
        timestamp: new Date(),
        target_id: '',  // 在调用处提供
        platform,
        error: 'Collection failed'
      });

      // 保持recent_errors数组不超过50个
      if (this.stats.recent_errors.length > 50) {
        this.stats.recent_errors = this.stats.recent_errors.slice(-50);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== 核心适配器选择和采集功能 ====================

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
   * 采集评论（主要入口方法）- 增强版本
   */
  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const startTime = Date.now();
    
    try {
      // 🆕 记录采集开始
      await this.logAuditEvent({
        action: AuditAction.COMMENT_FETCH,
        target_id: params.target.id,
        platform: params.target.platform,
        operator: 'system'
      });

      // 选择适配器
      const selection = await this.selectBestAdapter(params.target);
      if (!selection) {
        throw new Error('No suitable adapter found for target');
      }

      console.log(`[EnhancedCommentAdapterManager] Using ${selection.platform} adapter: ${selection.reason}`);

      // 执行采集
      const result = await selection.adapter.collectComments(params);

      // 🆕 保存采集结果到数据库
      await this.saveCollectionResult(result);
      
      // 🆕 更新采集历史
      this.collectionHistory.set(params.target.id, new Date());

      // 更新统计信息
      this.updateStats(selection.platform, true, result.comments.length, Date.now() - startTime);

      return result;

    } catch (error) {
      // 🆕 记录错误
      await this.logCollectionError(params.target, error);
      
      // 更新失败统计
      this.updateStats(params.target.platform, false, 0, Date.now() - startTime);

      // 尝试回退策略
      if (this.config.fallback_enabled && error instanceof Error && !error.message.includes('No suitable adapter')) {
        console.warn(`[EnhancedCommentAdapterManager] Primary collection failed, trying fallback: ${error.message}`);
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
        console.log(`[EnhancedCommentAdapterManager] Trying fallback adapter: ${platform}`);
        const result = await adapter.collectComments(params);
        
        // 🆕 保存回退采集结果
        await this.saveCollectionResult(result);
        this.collectionHistory.set(params.target.id, new Date());
        
        this.updateStats(platform, true, result.comments.length, 0);
        return result;

      } catch (fallbackError) {
        console.warn(`[EnhancedCommentAdapterManager] Fallback adapter ${platform} failed:`, fallbackError);
        this.updateStats(platform, false, 0, 0);
        continue;
      }
    }

    throw new Error('All fallback adapters failed');
  }

  getCollectionStats(): CollectionStats {
    return { ...this.stats };
  }

  private initializeStats(): CollectionStats {
    return {
      total_collections: 0,
      successful_collections: 0,
      failed_collections: 0,
      total_comments: 0,
      collections_by_platform: {} as Record<Platform, number>,
      collections_by_adapter: {},
      average_response_time: 0,
      last_collection_time: undefined,
      // 🆕 增强统计字段
      comments_collected_today: 0,
      comments_collected_this_week: 0,
      by_platform: {} as Record<Platform, {
        targets_count: number;
        comments_count: number;
        last_collection: Date | null;
      }>,
      recent_errors: []
    };
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建增强的评论适配器管理器实例
 */
export function createEnhancedCommentAdapterManager(config: CommentAdapterManagerConfig): EnhancedCommentAdapterManager {
  return new EnhancedCommentAdapterManager(config);
}

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