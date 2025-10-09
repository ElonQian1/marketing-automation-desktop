/**
 * 评论采集服务
 * 
 * 统一管理三轨适配器，提供评论采集的核心业务逻辑
 * 实现合规性检查、自动选择适配器、批量采集等功能
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  CommentCollectionAdapter, 
  CommentCollectionParams, 
  CommentCollectionResult, 
  AdapterStatus 
} from '../adapters/CommentCollectionAdapter';
import { DouyinAdapter } from '../adapters/DouyinAdapter';
import { OceanEngineAdapter } from '../adapters/OceanEngineAdapter';
import { WhitelistAdapter } from '../adapters/WhitelistAdapter';
import { 
  WatchTarget, 
  Comment, 
  Platform, 
  CommentQueryParams,
  AuditAction
} from '../../shared/types/core';
import { generateId } from '../../shared/utils';

/**
 * 批量采集配置
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
 * 批量采集结果
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
 * 采集统计信息
 */
export interface CollectionStats {
  total_collections: number;
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

export class CommentCollectionService {
  private adapters: Map<Platform, CommentCollectionAdapter> = new Map();
  private collectionHistory: Map<string, Date> = new Map();

  constructor() {
    this.initializeAdapters();
  }

  /**
   * 初始化适配器
   */
  private initializeAdapters(): void {
    this.adapters.set(Platform.DOUYIN, new DouyinAdapter());
    this.adapters.set(Platform.OCEANENGINE, new OceanEngineAdapter());
    this.adapters.set(Platform.PUBLIC, new WhitelistAdapter());
  }

  /**
   * 获取所有适配器状态
   */
  async getAllAdapterStatus(): Promise<AdapterStatus[]> {
    const statuses: AdapterStatus[] = [];
    
    for (const [platform, adapter] of this.adapters) {
      try {
        const status = await adapter.getStatus();
        statuses.push(status);
      } catch (error) {
        statuses.push({
          platform,
          available: false,
          auth_status: 'invalid',
          last_error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return statuses;
  }

  /**
   * 获取指定平台的适配器状态
   */
  async getAdapterStatus(platform: Platform): Promise<AdapterStatus> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`不支持的平台: ${platform}`);
    }

    return await adapter.getStatus();
  }

  /**
   * 选择合适的适配器
   */
  private selectAdapter(target: WatchTarget): CommentCollectionAdapter {
    const adapter = this.adapters.get(target.platform);
    if (!adapter) {
      throw new Error(`不支持的平台: ${target.platform}`);
    }

    if (!adapter.isTargetSupported(target)) {
      throw new Error(`适配器不支持此目标类型: ${target.target_type}`);
    }

    return adapter;
  }

  /**
   * 采集单个目标的评论
   */
  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const { target } = params;
    
    // 选择适配器
    const adapter = this.selectAdapter(target);
    
    // 检查适配器状态
    const status = await adapter.getStatus();
    if (!status.available) {
      throw new Error(`适配器不可用: ${status.last_error || '未知原因'}`);
    }

    // 验证权限
    const permissions = await adapter.validatePermissions(target);
    if (!permissions.canCollect) {
      throw new Error(`权限验证失败: ${permissions.reason}`);
    }

    try {
      // 记录采集开始
      await this.logAuditEvent({
        action: AuditAction.COMMENT_FETCH,
        target_id: target.id,
        platform: target.platform,
        operator: 'system'
      });

      // 执行采集
      const result = await adapter.collectComments(params);
      
      // 保存采集结果到数据库
      await this.saveCollectionResult(result);
      
      // 更新采集历史
      this.collectionHistory.set(target.id, new Date());

      return result;

    } catch (error) {
      console.error(`Failed to collect comments for target ${target.id}:`, error);
      
      // 记录错误
      await this.logCollectionError(target, error);
      
      throw error;
    }
  }

  /**
   * 批量采集评论
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

  /**
   * 获取已采集的评论列表
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
   * 获取采集统计信息
   */
  async getCollectionStats(): Promise<CollectionStats> {
    try {
      const result = await invoke('get_collection_stats');
      return result as CollectionStats;
    } catch (error) {
      console.error('Failed to get collection stats:', error);
      throw error;
    }
  }

  /**
   * 检查目标是否需要更新
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
   * 自动采集调度
   */
  async scheduleAutoCollection(config: {
    targets: WatchTarget[];
    interval_hours: number;
    max_comments_per_target: number;
    respect_rate_limits: boolean;
  }): Promise<{
    scheduled: boolean;
    next_run_time: Date;
    scheduled_targets: number;
  }> {
    try {
      const result = await invoke('schedule_auto_collection', {
        targets: config.targets.map(t => t.id),
        intervalHours: config.interval_hours,
        maxCommentsPerTarget: config.max_comments_per_target,
        respectRateLimits: config.respect_rate_limits
      });

      return result as {
        scheduled: boolean;
        next_run_time: Date;
        scheduled_targets: number;
      };
    } catch (error) {
      console.error('Failed to schedule auto collection:', error);
      throw error;
    }
  }

  /**
   * 检查频率限制
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
   * 保存采集结果
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
   * 记录采集错误
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
   * 记录审计事件
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
   * 工具函数：睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}