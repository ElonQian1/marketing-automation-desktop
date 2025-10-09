/**
 * 精准获客应用服务
 * 
 * 统一管理候选池、任务生成、查重频控等业务逻辑
 * 遵循 DDD 架构，协调领域实体和基础设施服务
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  WatchTarget, 
  CommentEntity, 
  TaskEntity, 
  AuditLog,
  type EntityCreationParams,
  type EntityDatabaseRows,
} from '../../domain/precise-acquisition/entities';
import {
  Platform,
  TargetType,
  SourceType,
  TaskType,
  TaskStatus,
  ExecutorMode,
  ResultCode,
  IndustryTag,
  RegionTag,
  AuditAction,
} from '../../constants/precise-acquisition-enums';
import type {
  WatchTargetRow,
  CommentRow,
  TaskRow,
  AuditLogRow,
  TaskGenerationConfig,
  RateLimitConfig,
  DeduplicationConfig,
  ComplianceCheckResult,
  PreciseAcquisitionStats,
} from '../../types/precise-acquisition';

/**
 * 精准获客应用服务
 * 
 * 负责协调所有精准获客相关的业务操作
 */
export class PreciseAcquisitionApplicationService {
  private static instance: PreciseAcquisitionApplicationService | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PreciseAcquisitionApplicationService {
    if (!PreciseAcquisitionApplicationService.instance) {
      PreciseAcquisitionApplicationService.instance = new PreciseAcquisitionApplicationService();
    }
    return PreciseAcquisitionApplicationService.instance;
  }

  // ==================== 候选池管理 ====================

  /**
   * 添加候选池目标
   */
  async addWatchTarget(params: EntityCreationParams['watchTarget']): Promise<WatchTarget> {
    try {
      // 创建领域实体（包含验证）
      const watchTarget = WatchTarget.create(params);
      
      // 检查合规性
      const complianceResult = await this.checkCompliance(watchTarget);
      if (!complianceResult.is_allowed) {
        throw new Error(`不符合合规要求: ${complianceResult.reason}`);
      }

      // 转换为数据库载荷并保存
      const payload = watchTarget.toDatabasePayload();
      const result = await invoke('bulk_upsert_watch_targets', { 
        payloads: [payload] 
      }) as number;

      if (result !== 1) {
        throw new Error('Failed to insert watch target');
      }

      // 记录审计日志
      await this.logAuditEvent(AuditLog.createImport({
        operator: 'manual',
        importData: { action: 'add_watch_target', target: params },
      }));

      // 返回刷新后的实体
      const savedTarget = await this.getWatchTargetByDedupKey(watchTarget.dedupKey);
      if (!savedTarget) {
        throw new Error('Failed to retrieve saved watch target');
      }

      return savedTarget;
    } catch (error) {
      console.error('Failed to add watch target:', error);
      throw error;
    }
  }

  /**
   * 批量导入候选池目标
   */
  async bulkImportWatchTargets(targets: EntityCreationParams['watchTarget'][]): Promise<{
    success_count: number;
    failed_count: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    const results = {
      success_count: 0,
      failed_count: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };

    const validPayloads: any[] = [];

    // 验证和转换所有目标
    for (let i = 0; i < targets.length; i++) {
      try {
        const target = WatchTarget.create(targets[i]);
        
        // 检查合规性
        const complianceResult = await this.checkCompliance(target);
        if (!complianceResult.is_allowed) {
          results.failed_count++;
          results.errors.push({
            index: i,
            error: `不符合合规要求: ${complianceResult.reason}`,
          });
          continue;
        }

        validPayloads.push(target.toDatabasePayload());
        results.success_count++;
      } catch (error) {
        results.failed_count++;
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 批量插入有效的目标
    if (validPayloads.length > 0) {
      try {
        await invoke('bulk_upsert_watch_targets', { payloads: validPayloads });
        
        // 记录审计日志
        await this.logAuditEvent(AuditLog.createImport({
          operator: 'bulk_import',
          importData: { 
            total: targets.length,
            success: results.success_count,
            failed: results.failed_count,
          },
        }));
      } catch (error) {
        // 如果批量插入失败，更新结果
        results.success_count = 0;
        results.failed_count = targets.length;
        results.errors = [{ index: -1, error: '批量插入失败: ' + (error instanceof Error ? error.message : String(error)) }];
      }
    }

    return results;
  }

  /**
   * 获取候选池目标列表
   */
  async getWatchTargets(params: {
    limit?: number;
    offset?: number;
    platform?: Platform;
    target_type?: TargetType;
  } = {}): Promise<WatchTarget[]> {
    try {
      const rows = await invoke('list_watch_targets', {
        limit: params.limit || null,
        offset: params.offset || null,
        platform: params.platform || null,
        targetType: params.target_type || null,
      }) as WatchTargetRow[];

      return rows.map(row => WatchTarget.fromDatabaseRow(row));
    } catch (error) {
      console.error('Failed to get watch targets:', error);
      throw error;
    }
  }

  /**
   * 根据去重键获取候选池目标
   */
  async getWatchTargetByDedupKey(dedupKey: string): Promise<WatchTarget | null> {
    try {
      const row = await invoke('get_watch_target_by_dedup_key', {
        dedupKey,
      }) as WatchTargetRow | null;

      return row ? WatchTarget.fromDatabaseRow(row) : null;
    } catch (error) {
      console.error('Failed to get watch target by dedup key:', error);
      throw error;
    }
  }

  // ==================== 评论管理 ====================

  /**
   * 添加评论
   */
  async addComment(params: EntityCreationParams['comment']): Promise<CommentEntity> {
    try {
      // 创建领域实体（包含验证）
      const comment = CommentEntity.create(params);
      
      // 转换为数据库载荷并保存
      const payload = comment.toDatabasePayload();
      const commentId = await invoke('insert_comment', { comment: payload }) as string;

      // 记录审计日志
      await this.logAuditEvent(AuditLog.createCommentFetch({
        operator: 'system',
        fetchResult: { commentId, platform: params.platform },
      }));

      // 返回带ID的实体
      return CommentEntity.fromDatabaseRow({
        id: commentId,
        ...payload,
        inserted_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
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
    try {
      const rows = await invoke('list_comments', {
        limit: params.limit || null,
        offset: params.offset || null,
        platform: params.platform || null,
        sourceTargetId: params.source_target_id || null,
        region: params.region || null,
      }) as CommentRow[];

      return rows.map(row => CommentEntity.fromDatabaseRow(row));
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw error;
    }
  }

  // ==================== 任务管理 ====================

  /**
   * 生成任务
   */
  async generateTasks(config: TaskGenerationConfig): Promise<{
    generated_count: number;
    tasks: TaskEntity[];
  }> {
    try {
      // 获取符合条件的评论
      const comments = await this.getComments({
        limit: 1000, // 限制处理量
      });

      const generatedTasks: TaskEntity[] = [];

      for (const comment of comments) {
        // 检查评论是否适合生成回复任务
        if (comment.isEligibleForReplyTask({
          keywords: config.keywords,
          excludeKeywords: config.exclude_keywords,
          minLikeCount: config.min_like_count,
          timeWindowHours: config.time_window_hours,
          regions: config.regions,
        })) {
          // 生成回复任务
          const task = TaskEntity.createReplyTask({
            commentId: comment.id!,
            assignAccountId: 'default_account', // TODO: 实现账号分配逻辑
            executorMode: ExecutorMode.API,
          });

          // 检查去重
          try {
            const commentDedupKey = comment.generateDedupKey();
            const reserved = await invoke('check_and_reserve_dedup', {
              key: commentDedupKey,
              scope: 'comment',
              ttlDays: 90,
              byAccount: 'default_account',
            }) as boolean;
            if (reserved && !(await this.isDuplicateTask(task))) {
              generatedTasks.push(task);
            }
          } catch (e) {
            if (!(await this.isDuplicateTask(task))) {
              generatedTasks.push(task);
            }
          }
        }

        // 检查评论是否适合生成关注任务
        if (comment.isEligibleForFollowTask({
          minLikeCount: config.min_like_count,
          timeWindowHours: config.time_window_hours,
          regions: config.regions,
          sentiment: 'positive', // 只关注正面评论的用户
        })) {
          // 生成关注任务
          const task = TaskEntity.createFollowTask({
            targetUserId: comment.authorId,
            assignAccountId: 'default_account', // TODO: 实现账号分配逻辑
            executorMode: ExecutorMode.API,
          });

          // 检查去重
          try {
            const userDedupKey = comment.generateUserDedupKey();
            const reserved = await invoke('check_and_reserve_dedup', {
              key: userDedupKey,
              scope: 'user',
              ttlDays: 7,
              byAccount: 'default_account',
            }) as boolean;
            if (reserved && !(await this.isDuplicateTask(task))) {
              generatedTasks.push(task);
            }
          } catch (e) {
            if (!(await this.isDuplicateTask(task))) {
              generatedTasks.push(task);
            }
          }
        }
      }

      // 批量插入任务
      for (const task of generatedTasks) {
        const payload = task.toDatabasePayload();
        await invoke('insert_task', { task: payload });

        // 记录审计日志
        await this.logAuditEvent(AuditLog.createTaskCreation({
          taskId: task.id || 'unknown',
          operator: 'system',
          taskPayload: payload,
        }));
      }

      return {
        generated_count: generatedTasks.length,
        tasks: generatedTasks,
      };
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      throw error;
    }
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
    try {
      const rows = await invoke('list_tasks', {
        limit: params.limit || null,
        offset: params.offset || null,
        status: params.status || null,
        taskType: params.task_type || null,
        assignAccountId: params.assign_account_id || null,
      }) as TaskRow[];

      return rows.map(row => TaskEntity.fromDatabaseRow(row));
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    resultCode?: ResultCode, 
    errorMessage?: string
  ): Promise<void> {
    try {
      await invoke('update_task_status', {
        taskId,
        status,
        resultCode: resultCode || null,
        errorMessage: errorMessage || null,
      });

      // 记录审计日志
      if (status === TaskStatus.DONE) {
        await this.logAuditEvent(AuditLog.createTaskExecution({
          taskId,
          accountId: 'system',
          operator: 'system',
          executionResult: { status, resultCode },
        }));
      } else if (status === TaskStatus.FAILED) {
        await this.logAuditEvent(AuditLog.createTaskFailure({
          taskId,
          operator: 'system',
          errorInfo: { resultCode, errorMessage },
        }));
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  }

  // ==================== 查重和频控 ====================

  /**
   * 检查任务是否重复
   */
  private async isDuplicateTask(task: TaskEntity): Promise<boolean> {
    try {
      // 根据去重键查询现有任务
      const existingTasks = await this.getTasks({ limit: 1 });
      return existingTasks.some(existing => existing.isDuplicateOf(task));
    } catch (error) {
      console.error('Failed to check task duplication:', error);
      return false; // 出错时默认不重复，让任务继续
    }
  }

  /**
   * 检查频控限制
   */
  async checkRateLimit(accountId: string, config: RateLimitConfig): Promise<{
    allowed: boolean;
    reason?: string;
    wait_seconds?: number;
  }> {
    try {
      // TODO: 实现实际的频控检查逻辑
      // 这里需要查询该账号的历史执行记录，检查是否超过限制
      
      // 模拟实现
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 查询最近一小时和一天的任务执行次数
      const recentTasks = await this.getTasks({
        assign_account_id: accountId,
        limit: 1000,
      });

      const hourlyCount = recentTasks.filter(task => 
        task.executedAt && task.executedAt >= hourAgo && task.status === TaskStatus.DONE
      ).length;

      const dailyCount = recentTasks.filter(task => 
        task.executedAt && task.executedAt >= dayAgo && task.status === TaskStatus.DONE
      ).length;

      if (hourlyCount >= config.hourly_limit) {
        return {
          allowed: false,
          reason: `已达到每小时限制 (${config.hourly_limit})`,
          wait_seconds: 3600 - Math.floor((now.getTime() - hourAgo.getTime()) / 1000),
        };
      }

      if (dailyCount >= config.daily_limit) {
        return {
          allowed: false,
          reason: `已达到每日限制 (${config.daily_limit})`,
          wait_seconds: 86400 - Math.floor((now.getTime() - dayAgo.getTime()) / 1000),
        };
      }

      // 检查最小间隔
      const lastExecution = recentTasks
        .filter(task => task.executedAt && task.status === TaskStatus.DONE)
        .sort((a, b) => (b.executedAt?.getTime() || 0) - (a.executedAt?.getTime() || 0))[0];

      if (lastExecution?.executedAt) {
        const intervalSeconds = (now.getTime() - lastExecution.executedAt.getTime()) / 1000;
        if (intervalSeconds < config.min_interval_seconds) {
          return {
            allowed: false,
            reason: `未达到最小间隔要求 (${config.min_interval_seconds}秒)`,
            wait_seconds: config.min_interval_seconds - Math.floor(intervalSeconds),
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return { allowed: false, reason: '频控检查失败' };
    }
  }

  // ==================== 合规检查 ====================

  /**
   * 检查候选池目标的合规性
   */
  private async checkCompliance(watchTarget: WatchTarget): Promise<ComplianceCheckResult> {
    const complianceInfo = watchTarget.getComplianceInfo();
    
    if (!complianceInfo.isCompliant) {
      return {
        is_allowed: false,
        source_type: watchTarget.source || SourceType.MANUAL,
        reason: complianceInfo.reason,
      };
    }

    // 对于公开来源，需要检查白名单
    if (watchTarget.platform === Platform.PUBLIC) {
      // TODO: 实现白名单检查逻辑
      // 这里应该从配置或数据库中获取白名单列表
      const whitelistEntries = [
        'douyin.com',
        'tiktok.com',
        // 其他白名单域名
      ];

      if (!watchTarget.isInWhitelist(whitelistEntries)) {
        return {
          is_allowed: false,
          source_type: SourceType.WHITELIST,
          reason: '该公开来源不在白名单中',
        };
      }
    }

    return {
      is_allowed: true,
      source_type: watchTarget.source || SourceType.MANUAL,
    };
  }

  // ==================== 审计日志 ====================

  /**
   * 记录审计事件
   */
  private async logAuditEvent(auditLog: AuditLog): Promise<void> {
    try {
      const payload = auditLog.toDatabasePayload();
      await invoke('insert_audit_log', { log: payload });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // 审计日志失败不应该影响主要业务流程，所以这里只记录错误
    }
  }

  // ==================== 统计和报表 ====================

  /**
   * 获取统计数据
   */
  async getStats(): Promise<PreciseAcquisitionStats> {
    try {
      const [watchTargets, allTasks] = await Promise.all([
        this.getWatchTargets({ limit: 10000 }),
        this.getTasks({ limit: 10000 }),
      ]);

      const tasksByStatus = allTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 计算今日指标
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTasks = allTasks.filter(task => 
        task.executedAt && task.executedAt >= today
      );

      const todayFollowCount = todayTasks.filter(task => 
        task.taskType === TaskType.FOLLOW && task.status === TaskStatus.DONE
      ).length;

      const todayReplyCount = todayTasks.filter(task => 
        task.taskType === TaskType.REPLY && task.status === TaskStatus.DONE
      ).length;

      const todaySuccessCount = todayTasks.filter(task => 
        task.status === TaskStatus.DONE
      ).length;

      const successRate = todayTasks.length > 0 
        ? (todaySuccessCount / todayTasks.length) * 100 
        : 0;

      return {
        watch_targets_count: watchTargets.length,
        comments_count: 0, // TODO: 实现评论计数
        tasks_count: {
          total: allTasks.length,
          new: tasksByStatus[TaskStatus.NEW] || 0,
          ready: tasksByStatus[TaskStatus.READY] || 0,
          executing: tasksByStatus[TaskStatus.EXECUTING] || 0,
          done: tasksByStatus[TaskStatus.DONE] || 0,
          failed: tasksByStatus[TaskStatus.FAILED] || 0,
        },
        daily_metrics: {
          follow_count: todayFollowCount,
          reply_count: todayReplyCount,
          success_rate: Math.round(successRate * 100) / 100,
        },
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
      hourly_limit: 20,
      daily_limit: 150,
      min_interval_seconds: 90,
      max_interval_seconds: 180,
    };
  }

  /**
   * 获取默认查重配置
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
      keywords: [],
      time_window_hours: 24,
      regions: undefined,
      min_like_count: 1,
      exclude_keywords: ['垃圾', '骗人', '假的'],
    };
  }
}
