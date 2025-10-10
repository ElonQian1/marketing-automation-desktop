/**
 * 精准获客领域模型 - 任务实体
 * 
 * 封装任务相关的业务逻辑、状态管理和执行规则
 */

import {
  TaskType,
  TaskStatus,
  ExecutorMode,
  ResultCode,
  validateTaskStatus,
  validateExecutorMode,
  validateResultCode,
} from '../../../constants/precise-acquisition-enums';

/**
 * 任务实体
 * 
 * 代表一个待执行的操作任务（回复或关注），包含状态管理和执行逻辑
 */
export class Task {
  private constructor(
    public readonly id: string | null,
    public readonly taskType: TaskType,
    public readonly commentId: string | null,
    public readonly targetUserId: string | null,
    public readonly assignAccountId: string,
    public readonly status: TaskStatus,
    public readonly executorMode: ExecutorMode,
    public readonly resultCode: ResultCode | null,
    public readonly errorMessage: string | null,
    public readonly dedupKey: string,
    public readonly createdAt: Date | null,
    public readonly executedAt: Date | null,
    public readonly priority: number,
    public readonly attempts: number,
    public readonly deadlineAt: Date | null,
    public readonly lockOwner: string | null,
    public readonly leaseUntil: Date | null,
  ) {}

  /**
   * 创建回复任务
   */
  static createReplyTask(params: {
    commentId: string;
    assignAccountId: string;
    executorMode: ExecutorMode;
  }): Task {
    if (!params.commentId || !params.assignAccountId) {
      throw new Error('commentId and assignAccountId are required for reply task');
    }

    if (!validateExecutorMode(params.executorMode)) {
      throw new Error(`Invalid executorMode: ${params.executorMode}`);
    }

    const dedupKey = this.generateDedupKey('reply', params.commentId, params.assignAccountId);

    return new Task(
      null, // �´���ʱIDΪnull
      TaskType.REPLY,
      params.commentId,
      null, // �ظ�������ҪtargetUserId
      params.assignAccountId,
      TaskStatus.NEW,
      params.executorMode,
      null, // ��ʼʱû�н������
      null, // ��ʼʱû�д�����Ϣ
      dedupKey,
      null, // ����ʱ�������ݿ�����
      null, // ִ��ʱ���ʼΪnull
      2,
      0,
      null,
      null,
      null,
    );
  }

  /**
   * 创建关注任务
   */
  static createFollowTask(params: {
    targetUserId: string;
    assignAccountId: string;
    executorMode: ExecutorMode;
  }): Task {
    if (!params.targetUserId || !params.assignAccountId) {
      throw new Error('targetUserId and assignAccountId are required for follow task');
    }
    if (!validateExecutorMode(params.executorMode)) {
      throw new Error(`Invalid executorMode: ${params.executorMode}`);
    }
    const dedupKey = this.generateDedupKey('follow', params.targetUserId, params.assignAccountId);
    return new Task(
      null, // �´���ʱIDΪnull
      TaskType.FOLLOW,
      null, // ��ע������ҪcommentId
      params.targetUserId,
      params.assignAccountId,
      TaskStatus.NEW,
      params.executorMode,
      null, // ��ʼʱû�н������
      null, // ��ʼʱû�д�����Ϣ
      dedupKey,
      null, // ����ʱ�������ݿ�����
      null, // ִ��ʱ���ʼΪnull
      3,
      0,
      null,
      null,
      null,
    );
  }
  static fromDatabaseRow(row: {
    id: string;
    task_type: string;
    comment_id?: string;
    target_user_id?: string;
    assign_account_id: string;
    status: string;
    executor_mode: string;
    result_code?: string;
    error_message?: string;
    dedup_key: string;
    created_at: string;
    executed_at?: string;
    priority: number;
    attempts: number;
    deadline_at?: string;
    lock_owner?: string;
    lease_until?: string;
  }): Task {
    return new Task(
      row.id,
      row.task_type as TaskType,
      row.comment_id || null,
      row.target_user_id || null,
      row.assign_account_id,
      row.status as TaskStatus,
      row.executor_mode as ExecutorMode,
      row.result_code as ResultCode || null,
      row.error_message || null,
      row.dedup_key,
      new Date(row.created_at),
      row.executed_at ? new Date(row.executed_at) : null,
      row.priority,
      row.attempts,
      row.deadline_at ? new Date(row.deadline_at) : null,
      row.lock_owner || null,
      row.lease_until ? new Date(row.lease_until) : null,
    );
  }

  /**
   * 转换为数据库载荷格式
   */
  toDatabasePayload(): {
    task_type: string;
    comment_id?: string;
    target_user_id?: string;
    assign_account_id: string;
    executor_mode: string;
    dedup_key: string;
    priority: number;
    deadline_at?: string;
  } {
    return {
      task_type: this.taskType,
      comment_id: this.commentId || undefined,
      target_user_id: this.targetUserId || undefined,
      assign_account_id: this.assignAccountId,
      executor_mode: this.executorMode,
      dedup_key: this.dedupKey,
      priority: this.priority,
      deadline_at: this.deadlineAt ? this.deadlineAt.toISOString() : undefined,
    };
  }

  /**
   * 生成去重键
   */
  private static generateDedupKey(taskType: string, targetId: string, accountId: string): string {
    const crypto = require('crypto');
    const input = `${taskType}:${targetId}:${accountId}`;
    return crypto.createHash('sha1').update(input).digest('hex');
  }

  /**
   * 标记任务为就绪状态
   */
  markAsReady(): Task {
    if (this.status !== TaskStatus.NEW) {
      throw new Error(`Cannot mark task as ready from status: ${this.status}`);
    }

    return this.withStatus(TaskStatus.READY);
  }

  /**
   * 标记任务为执行中状态
   */
  markAsExecuting(): Task {
    if (this.status !== TaskStatus.READY) {
      throw new Error(`Cannot mark task as executing from status: ${this.status}`);
    }

    return this.withStatus(TaskStatus.EXECUTING);
  }

  /**
   * 标记任务为成功完成
   */
  markAsDone(resultCode: ResultCode = ResultCode.OK): Task {
    if (this.status !== TaskStatus.EXECUTING) {
      throw new Error(`Cannot mark task as done from status: ${this.status}`);
    }

    if (!validateResultCode(resultCode)) {
      throw new Error(`Invalid resultCode: ${resultCode}`);
    }

    return new Task(
      this.id,
      this.taskType,
      this.commentId,
      this.targetUserId,
      this.assignAccountId,
      TaskStatus.DONE,
      this.executorMode,
      resultCode,
      null, // �ɹ�ʱ���������Ϣ
      this.dedupKey,
      this.createdAt,
      new Date(), // ����ִ��ʱ��
      this.priority,
      this.attempts,
      this.deadlineAt,
      null,
      null,
    );
  }

  /**
   * �������Ϊʧ��
   */
  markAsFailed(resultCode: ResultCode, errorMessage: string): Task {
    if (this.status !== TaskStatus.EXECUTING && this.status !== TaskStatus.READY) {
      throw new Error(`Cannot mark task as failed from status: ${this.status}`);
    }
 
    if (!validateResultCode(resultCode)) {
      throw new Error(`Invalid resultCode: ${resultCode}`);
    }
 
    if (!errorMessage || errorMessage.trim() === '') {
      throw new Error('Error message is required when marking task as failed');
    }
 
    return new Task(
      this.id,
      this.taskType,
      this.commentId,
      this.targetUserId,
      this.assignAccountId,
      TaskStatus.FAILED,
      this.executorMode,
      resultCode,
      errorMessage.trim(),
      this.dedupKey,
      this.createdAt,
      new Date(), // ����ִ��ʱ��
      this.priority,
      this.attempts,
      this.deadlineAt,
      null,
      null,
    );
  }
 
  /**
   * ����״̬�������
   */
  private withStatus(newStatus: TaskStatus): Task {
    if (!validateTaskStatus(newStatus)) {
      throw new Error(`Invalid task status: ${newStatus}`);
    }
 
    return new Task(
      this.id,
      this.taskType,
      this.commentId,
      this.targetUserId,
      this.assignAccountId,
      newStatus,
      this.executorMode,
      this.resultCode,
      this.errorMessage,
      this.dedupKey,
      this.createdAt,
      this.executedAt,
      this.priority,
      this.attempts,
      this.deadlineAt,
      this.lockOwner,
      this.leaseUntil,
    );
  }
  /**
   * 检查是否可以重试
   */
  canRetry(): boolean {
    if (this.status !== TaskStatus.FAILED) {
      return false;
    }

    // 只有特定错误码才能重试
    const retryableErrors = [
      ResultCode.TEMP_ERROR,
      ResultCode.RATE_LIMITED,
    ];

    return this.resultCode ? retryableErrors.includes(this.resultCode) : false;
  }

  /**
   * 检查是否需要人工干预
   */
  needsManualIntervention(): boolean {
    if (this.status !== TaskStatus.FAILED) {
      return false;
    }

    // 特定错误码需要人工干预
    const manualInterventionErrors = [
      ResultCode.PERMISSION_DENIED,
      ResultCode.BLOCKED,
      ResultCode.PERM_ERROR,
    ];

    return this.resultCode ? manualInterventionErrors.includes(this.resultCode) : true;
  }

  /**
   * 检查任务是否过期
   */
  isExpired(maxAgeHours: number = 24): boolean {
    if (!this.createdAt) return false;
    
    const now = new Date();
    const ageHours = (now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  }

  /**
   * 检查是否为高优先级任务
   */
  isHighPriority(): boolean {
    // API自动执行的任务通常优先级更高
    return this.executorMode === ExecutorMode.API;
  }

  /**
   * 获取任务执行时长（如果已执行）
   */
  getExecutionDurationMinutes(): number | null {
    if (!this.createdAt || !this.executedAt) {
      return null;
    }

    const diffMs = this.executedAt.getTime() - this.createdAt.getTime();
    return Math.round(diffMs / (1000 * 60));
  }

  /**
   * 检查是否应该被频控延迟
   */
  shouldBeRateLimited(lastExecutionTime: Date | null, minIntervalMinutes: number): boolean {
    if (!lastExecutionTime) {
      return false;
    }

    const now = new Date();
    const diffMinutes = (now.getTime() - lastExecutionTime.getTime()) / (1000 * 60);
    return diffMinutes < minIntervalMinutes;
  }

  /**
   * 获取任务描述
   */
  getDescription(): string {
    const action = this.taskType === TaskType.REPLY ? '回复评论' : '关注用户';
    const target = this.taskType === TaskType.REPLY 
      ? `评论ID: ${this.commentId?.substring(0, 8)}...`
      : `用户ID: ${this.targetUserId?.substring(0, 8)}...`;
    
    return `${action} - ${target}`;
  }

  /**
   * 获取业务标识符（用于日志和显示）
   */
  getBusinessId(): string {
    const shortId = this.id ? this.id.substring(0, 8) : 'new';
    return `task:${this.taskType}:${shortId}`;
  }

  /**
   * 检查是否与另一个任务重复
   */
  isDuplicateOf(other: Task): boolean {
    return this.dedupKey === other.dedupKey;
  }

  /**
   * 获取状态变更历史的下一个有效状态
   */
  getNextValidStatuses(): TaskStatus[] {
    switch (this.status) {
      case TaskStatus.NEW:
        return [TaskStatus.READY];
      case TaskStatus.READY:
        return [TaskStatus.EXECUTING];
      case TaskStatus.EXECUTING:
        return [TaskStatus.DONE, TaskStatus.FAILED];
      case TaskStatus.DONE:
        return []; // 终态，无后续状态
      case TaskStatus.FAILED:
        return [TaskStatus.READY]; // 可以重试
      default:
        return [];
    }
  }

  /**
   * 验证状态转换是否合法
   */
  isValidStatusTransition(newStatus: TaskStatus): boolean {
    return this.getNextValidStatuses().includes(newStatus);
  }

  /**
   * 获取任务权重（用于优先级排序）
   */
  getTaskWeight(): number {
    let weight = 0;
    
    // API任务权重更高
    if (this.executorMode === ExecutorMode.API) {
      weight += 100;
    }
    
    // 回复任务权重略高于关注任务
    if (this.taskType === TaskType.REPLY) {
      weight += 10;
    }
    
    // 失败的可重试任务权重降低
    if (this.status === TaskStatus.FAILED && this.canRetry()) {
      weight -= 50;
    }
    
    return weight;
  }

  /**
   * 创建带有新ID的任务副本
   */
  withId(newId: string): Task {
    return new Task(
      newId,
      this.taskType,
      this.commentId,
      this.targetUserId,
      this.assignAccountId,
      this.status,
      this.executorMode,
      this.resultCode,
      this.errorMessage,
      this.dedupKey,
      this.createdAt,
      this.executedAt,
      this.priority,
      this.attempts,
      this.deadlineAt,
      this.lockOwner,
      this.leaseUntil
    );
  }

  /**
   * 转换为数据库行格式
   */
  toDatabaseRow(): {
    id?: string;
    task_type: string;
    comment_id?: string;
    target_user_id?: string;
    assign_account_id: string;
    status: string;
    executor_mode: string;
    result_code?: string;
    error_message?: string;
    dedup_key: string;
    created_at?: string;
    executed_at?: string;
    priority: number;
    attempts: number;
    deadline_at?: string;
    lock_owner?: string;
    lease_until?: string;
  } {
    return {
      ...(this.id && { id: this.id }),
      task_type: this.taskType,
      comment_id: this.commentId || undefined,
      target_user_id: this.targetUserId || undefined,
      assign_account_id: this.assignAccountId,
      status: this.status,
      executor_mode: this.executorMode,
      result_code: this.resultCode || undefined,
      error_message: this.errorMessage || undefined,
      dedup_key: this.dedupKey,
      ...(this.createdAt && { created_at: this.createdAt.toISOString() }),
      ...(this.executedAt && { executed_at: this.executedAt.toISOString() }),
      priority: this.priority,
      attempts: this.attempts,
      ...(this.deadlineAt && { deadline_at: this.deadlineAt.toISOString() }),
      lock_owner: this.lockOwner || undefined,
      ...(this.leaseUntil && { lease_until: this.leaseUntil.toISOString() })
    };
  }
}





