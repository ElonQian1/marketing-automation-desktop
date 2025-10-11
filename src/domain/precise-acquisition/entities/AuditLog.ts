// src/domain/precise-acquisition/entities/AuditLog.ts
// module: domain | layer: domain | role: entity
// summary: 实体定义

/**
 * 精准获客领域模型 - 审计日志实体
 * 
 * 封装审计日志的业务逻辑和查询规则
 */

import {
  AuditAction,
  validateAuditAction,
} from '../../../constants/precise-acquisition-enums';

/**
 * 审计日志实体
 * 
 * 记录系统中所有重要操作的痕迹，确保可追溯性和合规性
 */
export class AuditLog {
  private constructor(
    public readonly id: string | null,
    public readonly action: AuditAction,
    public readonly taskId: string | null,
    public readonly accountId: string | null,
    public readonly operator: string,
    public readonly payloadHash: string | null,
    public readonly timestamp: Date,
  ) {}

  /**
   * 创建新的审计日志实体
   */
  static create(params: {
    action: AuditAction;
    taskId?: string;
    accountId?: string;
    operator: string;
    payloadHash?: string;
  }): AuditLog {
    // 验证必填字段
    if (!params.action || !params.operator) {
      throw new Error('action and operator are required');
    }

    // 验证枚举值
    if (!validateAuditAction(params.action)) {
      throw new Error(`Invalid action: ${params.action}`);
    }

    // 验证操作员格式
    if (params.operator.trim().length === 0) {
      throw new Error('Operator cannot be empty');
    }

    // 验证负载哈希格式（如果提供）
    if (params.payloadHash && !/^[a-f0-9]{40}$/i.test(params.payloadHash)) {
      throw new Error('Payload hash must be a valid SHA-1 hash');
    }

    return new AuditLog(
      null, // 新创建时ID为null
      params.action,
      params.taskId || null,
      params.accountId || null,
      params.operator.trim(),
      params.payloadHash || null,
      new Date(),
    );
  }

  /**
   * 从数据库行数据重建实体
   */
  static fromDatabaseRow(row: {
    id: string;
    action: string;
    task_id?: string;
    account_id?: string;
    operator: string;
    payload_hash?: string;
    ts: string;
  }): AuditLog {
    return new AuditLog(
      row.id,
      row.action as AuditAction,
      row.task_id || null,
      row.account_id || null,
      row.operator,
      row.payload_hash || null,
      new Date(row.ts),
    );
  }

  /**
   * 转换为数据库载荷格式
   */
  toDatabasePayload(): {
    action: string;
    task_id?: string;
    account_id?: string;
    operator: string;
    payload_hash?: string;
  } {
    return {
      action: this.action,
      task_id: this.taskId || undefined,
      account_id: this.accountId || undefined,
      operator: this.operator,
      payload_hash: this.payloadHash || undefined,
    };
  }

  /**
   * 生成负载哈希（用于敏感数据脱敏）
   */
  static generatePayloadHash(payload: any): string {
    const crypto = require('crypto');
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha1').update(payloadString).digest('hex');
  }

  /**
   * 创建任务创建的审计日志
   */
  static createTaskCreation(params: {
    taskId: string;
    accountId?: string;
    operator: string;
    taskPayload?: any;
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.TASK_CREATE,
      taskId: params.taskId,
      accountId: params.accountId,
      operator: params.operator,
      payloadHash: params.taskPayload ? AuditLog.generatePayloadHash(params.taskPayload) : undefined,
    });
  }

  /**
   * 创建任务执行的审计日志
   */
  static createTaskExecution(params: {
    taskId: string;
    accountId: string;
    operator: string;
    executionResult?: any;
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.TASK_EXECUTE,
      taskId: params.taskId,
      accountId: params.accountId,
      operator: params.operator,
      payloadHash: params.executionResult ? AuditLog.generatePayloadHash(params.executionResult) : undefined,
    });
  }

  /**
   * 创建任务失败的审计日志
   */
  static createTaskFailure(params: {
    taskId: string;
    accountId?: string;
    operator: string;
    errorInfo?: any;
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.TASK_FAIL,
      taskId: params.taskId,
      accountId: params.accountId,
      operator: params.operator,
      payloadHash: params.errorInfo ? AuditLog.generatePayloadHash(params.errorInfo) : undefined,
    });
  }

  /**
   * 创建导出操作的审计日志
   */
  static createExport(params: {
    operator: string;
    exportData?: any;
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.EXPORT,
      operator: params.operator,
      payloadHash: params.exportData ? AuditLog.generatePayloadHash(params.exportData) : undefined,
    });
  }

  /**
   * 创建导入操作的审计日志
   */
  static createImport(params: {
    operator: string;
    importData?: any;
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.IMPORT,
      operator: params.operator,
      payloadHash: params.importData ? AuditLog.generatePayloadHash(params.importData) : undefined,
    });
  }

  /**
   * 创建批次创建的审计日志
   */
  static createBatchCreation(params: {
    operator: string;
    batchData?: any;
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.BATCH_CREATE,
      operator: params.operator,
      payloadHash: params.batchData ? AuditLog.generatePayloadHash(params.batchData) : undefined,
    });
  }

  /**
   * 创建评论拉取的审计日志
   */
  static createCommentFetch(params: {
    accountId?: string;
    operator: string;
    fetchResult?: any;
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.COMMENT_FETCH,
      accountId: params.accountId,
      operator: params.operator,
      payloadHash: params.fetchResult ? AuditLog.generatePayloadHash(params.fetchResult) : undefined,
    });
  }

  /**
   * 创建删除操作的审计日志
   */
  static createDeletion(params: {
    operator: string;
    deletionData: {
      targetId: string;
      entityType: string;
    };
  }): AuditLog {
    return AuditLog.create({
      action: AuditAction.DELETE,
      operator: params.operator,
      payloadHash: AuditLog.generatePayloadHash(params.deletionData),
    });
  }

  /**
   * 检查是否为系统操作
   */
  isSystemOperation(): boolean {
    return this.operator === 'system';
  }

  /**
   * 检查是否为API操作
   */
  isApiOperation(): boolean {
    return this.operator === 'api';
  }

  /**
   * 检查是否为人工操作
   */
  isManualOperation(): boolean {
    return this.operator !== 'system' && this.operator !== 'api';
  }

  /**
   * 检查是否与任务相关
   */
  isTaskRelated(): boolean {
    return this.taskId !== null;
  }

  /**
   * 检查是否与账号相关
   */
  isAccountRelated(): boolean {
    return this.accountId !== null;
  }

  /**
   * 检查是否为关键操作（需要特别关注）
   */
  isCriticalOperation(): boolean {
    const criticalActions = [
      AuditAction.TASK_FAIL,
      AuditAction.EXPORT,
      AuditAction.IMPORT,
      AuditAction.DELETE,
    ];
    return criticalActions.includes(this.action);
  }

  /**
   * 获取操作类型分类
   */
  getOperationCategory(): 'task' | 'data' | 'system' {
    const taskActions = [AuditAction.TASK_CREATE, AuditAction.TASK_EXECUTE, AuditAction.TASK_FAIL];
    const dataActions = [AuditAction.EXPORT, AuditAction.IMPORT, AuditAction.BATCH_CREATE, AuditAction.COMMENT_FETCH];
    const systemActions = [AuditAction.DELETE];
    
    if (taskActions.includes(this.action)) {
      return 'task';
    } else if (dataActions.includes(this.action)) {
      return 'data';
    } else if (systemActions.includes(this.action)) {
      return 'system';
    } else {
      return 'system';
    }
  }

  /**
   * 检查日志是否在指定时间范围内
   */
  isWithinTimeRange(startTime: Date, endTime: Date): boolean {
    return this.timestamp >= startTime && this.timestamp <= endTime;
  }

  /**
   * 获取操作的风险级别
   */
  getRiskLevel(): 'low' | 'medium' | 'high' {
    switch (this.action) {
      case AuditAction.TASK_FAIL:
        return 'high'; // 任务失败需要关注
      case AuditAction.EXPORT:
        return 'medium'; // 数据导出有敏感性
      case AuditAction.IMPORT:
        return 'medium'; // 数据导入可能影响业务
      case AuditAction.TASK_EXECUTE:
        return 'low'; // 正常任务执行
      case AuditAction.TASK_CREATE:
        return 'low'; // 任务创建
      case AuditAction.BATCH_CREATE:
        return 'low'; // 批次创建
      case AuditAction.COMMENT_FETCH:
        return 'low'; // 评论拉取
      default:
        return 'medium';
    }
  }

  /**
   * 获取业务标识符（用于日志和显示）
   */
  getBusinessId(): string {
    const shortId = this.id ? this.id.substring(0, 8) : 'new';
    return `audit:${this.action}:${shortId}`;
  }

  /**
   * 获取操作描述
   */
  getDescription(): string {
    const descriptions: Record<AuditAction, string> = {
      [AuditAction.TASK_CREATE]: '创建任务',
      [AuditAction.TASK_EXECUTE]: '执行任务',
      [AuditAction.TASK_FAIL]: '任务失败',
      [AuditAction.EXPORT]: '导出数据',
      [AuditAction.IMPORT]: '导入数据',
      [AuditAction.BATCH_CREATE]: '创建批次',
      [AuditAction.COMMENT_FETCH]: '拉取评论',
      [AuditAction.DELETE]: '删除操作',
    };
    
    return descriptions[this.action] || this.action;
  }

  /**
   * 检查是否应该触发告警
   */
  shouldTriggerAlert(): boolean {
    // 高风险操作或失败操作应该触发告警
    return this.getRiskLevel() === 'high' || this.action === AuditAction.TASK_FAIL;
  }

  /**
   * 获取关联的实体信息
   */
  getRelatedEntities(): {
    taskId?: string;
    accountId?: string;
    hasPayload: boolean;
  } {
    return {
      taskId: this.taskId || undefined,
      accountId: this.accountId || undefined,
      hasPayload: this.payloadHash !== null,
    };
  }

  /**
   * 检查是否包含敏感操作
   */
  containsSensitiveOperation(): boolean {
    // 导出和某些执行操作可能包含敏感信息
    const sensitiveActions = [
      AuditAction.EXPORT,
      AuditAction.TASK_EXECUTE,
    ];
    return sensitiveActions.includes(this.action);
  }

  /**
   * 获取日志的保留期要求（天数）
   */
  getRetentionDays(): number {
    switch (this.getRiskLevel()) {
      case 'high':
        return 365; // 高风险操作保留1年
      case 'medium':
        return 180; // 中风险操作保留6个月
      case 'low':
        return 90;  // 低风险操作保留3个月
      default:
        return 90;
    }
  }

  /**
   * 检查日志是否应该被归档
   */
  shouldBeArchived(currentDate: Date = new Date()): boolean {
    const retentionDays = this.getRetentionDays();
    const ageInDays = (currentDate.getTime() - this.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > retentionDays;
  }
}