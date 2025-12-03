// src/application/services/precise-acquisition/TaskQueueService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客 - 任务队列服务
 */

import { invoke } from '@tauri-apps/api/core';
import {
  ExecutorMode,
  ResultCode,
  TaskStatus,
  TaskType,
} from '../../../constants/precise-acquisition-enums';
import { AuditLog, CommentEntity, TaskEntity } from '../../../domain/precise-acquisition/entities';
import type { TaskGenerationConfig, TaskRow } from '../../../types/precise-acquisition';
import { auditTrailService, AuditTrailService } from './AuditTrailService';
import { commentService, CommentService } from './CommentService';
import { deduplicationService, DeduplicationService } from './DeduplicationService';

export class TaskQueueService {
  constructor(
    private readonly comments: CommentService = commentService,
    private readonly dedup: DeduplicationService = deduplicationService,
    private readonly auditTrail: AuditTrailService = auditTrailService,
  ) {}

  async generateTasks(config: TaskGenerationConfig): Promise<{
    generated_count: number;
    tasks: TaskEntity[];
  }> {
    const comments = await this.comments.list({ limit: 1000 });
    const generated: TaskEntity[] = [];

    for (const comment of comments) {
      await this.populateReplyTask(comment, config, generated);
      await this.populateFollowTask(comment, config, generated);
    }

    const persisted: TaskEntity[] = [];
    for (const task of generated) {
      const payload = task.toDatabasePayload();
      const taskId = await invoke('plugin:prospecting|insert_task', { task: payload }) as string;

      await this.auditTrail.record(AuditLog.createTaskCreation({
        taskId,
        operator: 'system',
        taskPayload: payload,
      }));

      persisted.push(task.withId(taskId));
    }

    return {
      generated_count: persisted.length,
      tasks: persisted,
    };
  }

  async list(params: {
    limit?: number;
    offset?: number;
    status?: TaskStatus;
    task_type?: TaskType;
    assign_account_id?: string;
  } = {}): Promise<TaskEntity[]> {
    const rows = await invoke('plugin:prospecting|list_tasks', {
      limit: params.limit || null,
      offset: params.offset || null,
      status: params.status || null,
      taskType: params.task_type || null,
      assignAccountId: params.assign_account_id || null,
    }) as TaskRow[];

    return rows.map(row => TaskEntity.fromDatabaseRow(row));
  }

  async updateStatus(taskId: string, status: TaskStatus, resultCode?: ResultCode, errorMessage?: string): Promise<void> {
    await invoke('update_task_status', {
      taskId,
      status,
      resultCode: resultCode || null,
      errorMessage: errorMessage || null,
    });

    if (status === TaskStatus.DONE) {
      await this.auditTrail.record(AuditLog.createTaskExecution({
        taskId,
        accountId: 'system',
        operator: 'system',
        executionResult: { status, resultCode },
      }));
    } else if (status === TaskStatus.FAILED) {
      await this.auditTrail.record(AuditLog.createTaskFailure({
        taskId,
        operator: 'system',
        errorInfo: { resultCode, errorMessage },
      }));
    }
  }

  private async populateReplyTask(
    comment: CommentEntity,
    config: TaskGenerationConfig,
    bucket: TaskEntity[],
  ): Promise<void> {
    if (!comment.isEligibleForReplyTask({
      keywords: config.keywords,
      excludeKeywords: config.exclude_keywords,
      minLikeCount: config.min_like_count,
      timeWindowHours: config.time_window_hours,
      regions: config.regions,
    })) {
      return;
    }

    const task = TaskEntity.createReplyTask({
      commentId: comment.id!,
      assignAccountId: 'default_account', // TODO: 实现账号分配逻辑
      executorMode: ExecutorMode.API,
    });

    const commentReserved = await this.dedup.reserveComment(comment, 'default_account');
    const textReserved = await this.dedup.reserveText(comment, 'default_account');
    const duplicated = await this.dedup.isDuplicateTask(task);
    if (commentReserved && textReserved && !duplicated) {
      bucket.push(task);
    }
  }

  private async populateFollowTask(
    comment: CommentEntity,
    config: TaskGenerationConfig,
    bucket: TaskEntity[],
  ): Promise<void> {
    if (!comment.isEligibleForFollowTask({
      minLikeCount: config.min_like_count,
      timeWindowHours: config.time_window_hours,
      regions: config.regions,
      sentiment: 'positive',
    })) {
      return;
    }

    const task = TaskEntity.createFollowTask({
      targetUserId: comment.authorId,
      assignAccountId: 'default_account',
      executorMode: ExecutorMode.API,
    });

    const reserved = await this.dedup.reserveUser(comment, 'default_account');
    const duplicated = await this.dedup.isDuplicateTask(task);
    if (reserved && !duplicated) {
      bucket.push(task);
    }
  }
}

export const taskQueueService = new TaskQueueService();
