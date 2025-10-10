/**
 * 精准获客统一应用服务
 * 
 * @deprecated 此服务已被废弃，请使用 PreciseAcquisitionServiceFacade.v2.ts
 * 
 * 迁移指南：
 * ```typescript
 * // ❌ 旧方式
 * import { UnifiedPreciseAcquisitionService } from './UnifiedPreciseAcquisitionService';
 * const service = UnifiedPreciseAcquisitionService.getInstance();
 * 
 * // ✅ 新方式
 * import { preciseAcquisitionService } from './PreciseAcquisitionServiceFacade.v2';
 * const service = preciseAcquisitionService;
 * ```
 * 
 * 整合所有精准获客相关的业务功能，作为对外统一接口
 * 基于新的模块化架构，消除代码冗余
 * 此服务将在下个版本中移除，请尽快迁移到新的统一门面
 */

import { 
  WatchTarget, 
  CommentEntity, 
  TaskEntity, 
  AuditLog,
  type EntityCreationParams
} from '../../domain/precise-acquisition/entities';
import {
  Platform,
  TargetType,
  TaskType,
  TaskStatus,
  IndustryTag,
  RegionTag
} from '../../constants/precise-acquisition-enums';
import type {
  TaskGenerationConfig,
  RateLimitConfig,
  DeduplicationConfig,
  ComplianceCheckResult,
  PreciseAcquisitionStats
} from '../../types/precise-acquisition';

// 导入新的模块化服务
import { rateLimitService } from '../../modules/precise-acquisition/rate-limit';
import { taskEngineService } from '../../modules/precise-acquisition/task-engine';
// TODO: 这些服务需要完成实现
// import { candidatePoolService } from '../../modules/precise-acquisition/candidate-pool';
// import { commentCollectionService } from '../../modules/precise-acquisition/comment-collection';

/**
 * 精准获客统一应用服务
 * 
 * 作为所有精准获客功能的统一入口，整合新的模块化架构
 */
export class UnifiedPreciseAcquisitionService {
  private static instance: UnifiedPreciseAcquisitionService | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): UnifiedPreciseAcquisitionService {
    if (!UnifiedPreciseAcquisitionService.instance) {
      UnifiedPreciseAcquisitionService.instance = new UnifiedPreciseAcquisitionService();
    }
    return UnifiedPreciseAcquisitionService.instance;
  }

  // ==================== 候选池管理 ====================

  /**
   * 添加监控目标
   */
  async addWatchTarget(params: EntityCreationParams['watchTarget']): Promise<WatchTarget> {
    // 合规性检查
    const target = WatchTarget.create(params);
    const complianceResult = await this.checkCompliance(target);
    
    if (!complianceResult.compliant) {
      throw new Error(`合规检查失败: ${complianceResult.issues.join(', ')}`);
    }

    return candidatePoolService.addTarget(params);
  }

  /**
   * 批量导入监控目标
   */
  async bulkImportWatchTargets(targets: EntityCreationParams['watchTarget'][]): Promise<{
    successful: WatchTarget[];
    failed: Array<{ target: EntityCreationParams['watchTarget']; error: string }>;
    duplicates: string[];
  }> {
    return candidatePoolService.bulkImport(targets);
  }

  /**
   * 获取监控目标列表
   */
  async getWatchTargets(params: {
    limit?: number;
    offset?: number;
    platform?: Platform;
    target_type?: TargetType;
  } = {}): Promise<WatchTarget[]> {
    return candidatePoolService.getTargets(params);
  }

  /**
   * 根据去重键获取目标
   */
  async getWatchTargetByDedupKey(dedupKey: string): Promise<WatchTarget | null> {
    return candidatePoolService.getTargetByDedupKey(dedupKey);
  }

  // ==================== 评论管理 ====================

  /**
   * 添加评论
   */
  async addComment(params: EntityCreationParams['comment']): Promise<CommentEntity> {
    return commentCollectionService.addComment(params);
  }

  /**
   * 获取评论列表
   */
  async getComments(params: {
    limit?: number;
    offset?: number;
    platform?: Platform;
    source_target_id?: string;
    region?: RegionTag;
  } = {}): Promise<CommentEntity[]> {
    return commentCollectionService.getComments(params);
  }

  // ==================== 任务管理 ====================

  /**
   * 生成任务
   */
  async generateTasks(config: TaskGenerationConfig): Promise<{
    generated_count: number;
    tasks: TaskEntity[];
  }> {
    // 首先进行去重和频控检查
    const preCheckResult = await rateLimitService.performFullPreCheck(
      // 临时创建任务对象用于检查
      {
        id: 'temp',
        task_type: config.task_types?.[0] || TaskType.FOLLOW,
        platform: config.platform || Platform.XIAOHONGSHU,
        status: TaskStatus.NEW,
        priority: config.priority,
        target_user_id: config.target_user_id,
        assigned_device_id: config.device_id,
        created_at: new Date(),
        updated_at: new Date(),
        retry_count: 0,
        metadata: {}
      } as TaskEntity
    );

    if (!preCheckResult.allowed) {
      throw new Error(`任务生成被阻止: ${preCheckResult.reasons.join(', ')}`);
    }

    // 使用任务引擎生成任务
    const result = await taskEngineService.generateTasks({
      target: config.target,
      max_tasks_per_target: config.max_tasks_per_target || 10,
      task_types: config.task_types || [TaskType.FOLLOW],
      priority: config.priority,
      assignment_strategy: config.assignment_strategy || 'round_robin'
    });

    return {
      generated_count: result.total_count,
      tasks: result.generated_tasks
    };
  }

  /**
   * 获取任务列表
   */
  async getTasks(params: {
    limit?: number;
    offset?: number;
    status?: TaskStatus;
    task_type?: TaskType;
    assign_account_id?: string;
  } = {}): Promise<TaskEntity[]> {
    const result = await taskEngineService.getTasks({
      status: params.status ? [params.status] : undefined,
      task_type: params.task_type ? [params.task_type] : undefined,
      assigned_device_id: params.assign_account_id ? [params.assign_account_id] : undefined,
      limit: params.limit,
      offset: params.offset
    });

    return result.tasks;
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    resultCode?: string,
    errorMessage?: string
  ): Promise<void> {
    await taskEngineService.updateTaskStatus(taskId, status, errorMessage);

    // 记录去重信息（如果任务完成）
    if (status === TaskStatus.DONE) {
      const task = await taskEngineService.getTaskById(taskId);
      if (task) {
        await rateLimitService.recordOperationCompletion(task, true);
      }
    }
  }

  // ==================== 去重和频控 ====================

  /**
   * 检查频率限制
   */
  async checkRateLimit(deviceId: string, config?: Partial<RateLimitConfig>): Promise<{
    allowed: boolean;
    reason?: string;
    reset_time?: Date;
    current_rate: number;
  }> {
    const result = await rateLimitService.checkRateLimit(
      deviceId,
      Platform.XIAOHONGSHU, // 默认平台
      TaskType.FOLLOW, // 默认任务类型
      config
    );

    return {
      allowed: result.allowed,
      reason: result.reason,
      reset_time: result.reset_time,
      current_rate: result.current_rate
    };
  }

  /**
   * 获取去重统计
   */
  async getDedupStats() {
    return rateLimitService.getStats();
  }

  // ==================== 合规和审计 ====================

  /**
   * 合规性检查
   */
  private async checkCompliance(target: WatchTarget): Promise<ComplianceCheckResult> {
    // 使用新的工具函数进行合规检查
    const { checkCompliance } = await import('../modules/precise-acquisition/shared/utils');
    return checkCompliance(target);
  }

  /**
   * 记录审计事件
   */
  private async logAuditEvent(auditLog: AuditLog): Promise<void> {
    try {
      // 这里可以接入审计系统模块（待实现）
      console.log('Audit event logged:', auditLog);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  // ==================== 统计数据 ====================

  /**
   * 获取统计数据
   */
  async getStats(): Promise<PreciseAcquisitionStats> {
    try {
      // 获取各模块的统计数据
      const [taskStats, dedupStats, targetStats] = await Promise.all([
        taskEngineService.getExecutionStats(),
        rateLimitService.getStats(),
        candidatePoolService.getStats()
      ]);

      return {
        watch_targets_count: targetStats.total_targets,
        comments_count: targetStats.total_comments || 0,
        tasks_count: {
          total: taskStats.total_tasks,
          new: taskStats.pending_tasks,
          ready: taskStats.pending_tasks,
          executing: 0, // 需要从task stats获取
          done: taskStats.completed_tasks,
          failed: taskStats.failed_tasks,
        },
        daily_metrics: {
          follow_count: 0, // 需要从task stats计算
          reply_count: 0,
          like_count: 0,
          success_rate: taskStats.success_rate,
        },
        dedup_effectiveness: {
          total_blocks: dedupStats.total_records,
          comment_level_blocks: dedupStats.by_level['comment'] || 0,
          user_level_blocks: dedupStats.by_level['user'] || 0,
          device_level_blocks: dedupStats.by_level['device'] || 0,
        }
      };

    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  // ==================== 配置管理 ====================

  /**
   * 获取默认频控配置
   */
  getDefaultRateLimitConfig(): RateLimitConfig {
    return {
      strategy: 'adaptive',
      base_interval_ms: 3000,
      max_interval_ms: 60000,
      max_operations_per_hour: 120,
      max_operations_per_day: 1000,
      cooldown_after_failure_ms: 30000,
      burst_size: 5,
      window_size_minutes: 15
    };
  }

  /**
   * 获取默认去重配置
   */
  getDefaultDeduplicationConfig(): DeduplicationConfig {
    return {
      comment_level_enabled: true,
      user_level_enabled: true,
      user_cooldown_days: 7,
      cross_device_enabled: true,
    };
  }

  /**
   * 获取默认任务生成配置
   */
  getDefaultTaskGenerationConfig(): TaskGenerationConfig {
    return {
      max_tasks_per_target: 10,
      task_types: [TaskType.FOLLOW],
      priority: 'medium',
      assignment_strategy: 'round_robin',
      time_window_hours: 24,
      require_dedup_check: true,
      require_rate_limit_check: true,
    };
  }
}

// 导出单例实例和服务类
export const unifiedPreciseAcquisitionService = UnifiedPreciseAcquisitionService.getInstance();
export { UnifiedPreciseAcquisitionService };