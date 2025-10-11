// src/modules/precise-acquisition/rate-limit/services/RateLimitService.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 查重频控服务 - 统一门面
 * 
 * 整合去重检查、频率限制和记录管理功能
 */

import { Comment, Task, WatchTarget, Platform, TaskType } from '../../shared/types/core';
import { 
  RateLimitConfig, 
  DedupCheckResult, 
  RateLimitCheckResult, 
  DedupStats,
  DedupRecord,
  DedupLevel,
  RateLimitStrategy
} from '../types';
import { DedupChecker } from './DedupChecker';
import { RateLimiter } from './RateLimiter';
import { RecordManager } from './RecordManager';

export class RateLimitService {
  private dedupChecker = new DedupChecker();
  private rateLimiter = new RateLimiter();
  private recordManager = new RecordManager();

  private defaultConfig: RateLimitConfig = {
    strategy: RateLimitStrategy.ADAPTIVE,
    base_interval_ms: 3000,
    max_interval_ms: 60000,
    max_operations_per_hour: 120,
    max_operations_per_day: 1000,
    cooldown_after_failure_ms: 30000,
    burst_size: 5,
    window_size_minutes: 15
  };

  // === 去重检查接口 ===

  /**
   * 评论级去重检查
   */
  async checkCommentDedup(
    comment: Comment, 
    taskType: TaskType, 
    deviceId: string
  ): Promise<DedupCheckResult> {
    return this.dedupChecker.checkCommentDedup(comment, taskType, deviceId);
  }

  /**
   * 用户级去重检查
   */
  async checkUserDedup(
    userId: string,
    platform: Platform,
    taskType: TaskType,
    deviceId: string,
    config?: Partial<RateLimitConfig>
  ): Promise<DedupCheckResult> {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    return this.dedupChecker.checkUserDedup(userId, platform, taskType, deviceId, effectiveConfig);
  }

  /**
   * 跨设备查重检查
   */
  async checkCrossDeviceDedup(
    target: WatchTarget,
    taskType: TaskType,
    currentDeviceId: string
  ): Promise<DedupCheckResult> {
    return this.dedupChecker.checkCrossDeviceDedup(target, taskType, currentDeviceId);
  }

  /**
   * 综合去重检查
   */
  async performComprehensiveCheck(
    task: Task,
    comment?: Comment,
    target?: WatchTarget,
    config?: Partial<RateLimitConfig>
  ): Promise<{
    allowed: boolean;
    reasons: string[];
    suggested_delay_ms?: number;
  }> {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    return this.dedupChecker.performComprehensiveCheck(task, effectiveConfig, comment, target);
  }

  /**
   * 通用去重检查 (向后兼容的别名方法)
   */
  async checkDuplicate(params: {
    task: Task;
    comment?: Comment;
    target?: WatchTarget;
    config?: Partial<RateLimitConfig>;
  }): Promise<boolean> {
    const result = await this.performComprehensiveCheck(
      params.task, 
      params.comment, 
      params.target, 
      params.config
    );
    return !result.allowed; // 返回 true 表示是重复的
  }

  // === 频率限制接口 ===

  /**
   * 频控检查
   */
  async checkRateLimit(
    deviceId: string,
    platform: Platform,
    taskType: TaskType,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitCheckResult> {
    return this.rateLimiter.checkRateLimit(deviceId, platform, taskType, config);
  }

  /**
   * 获取建议的下次执行时间
   */
  async getNextExecutionTime(
    deviceId: string,
    platform: Platform,
    taskType: TaskType,
    config?: Partial<RateLimitConfig>
  ): Promise<Date> {
    return this.rateLimiter.getNextExecutionTime(deviceId, platform, taskType, config);
  }

  // === 记录管理接口 ===

  /**
   * 保存去重记录
   */
  async saveRecord(
    level: DedupLevel,
    key: string,
    value: string,
    platform: Platform,
    taskType: TaskType,
    deviceId: string,
    expiresAt?: Date,
    metadata?: Record<string, any>
  ): Promise<DedupRecord> {
    return this.recordManager.saveRecord(level, key, value, platform, taskType, deviceId, expiresAt, metadata);
  }

  /**
   * 获取去重统计信息
   */
  async getStats(): Promise<DedupStats> {
    return this.recordManager.getStats();
  }

  /**
   * 清理过期记录
   */
  async cleanExpiredRecords(): Promise<number> {
    return this.recordManager.cleanExpiredRecords();
  }

  // === 综合操作接口 ===

  /**
   * 完整的任务前置检查
   * 包含去重检查和频控检查
   */
  async performFullPreCheck(
    task: Task,
    comment?: Comment,
    target?: WatchTarget,
    config?: Partial<RateLimitConfig>
  ): Promise<{
    allowed: boolean;
    reasons: string[];
    next_execution_time?: Date;
  }> {
    try {
      // 1. 执行去重检查
      const dedupResult = await this.performComprehensiveCheck(task, comment, target, config);

      // 2. 执行频控检查（仅在去重通过时进行）
      let rateLimitResult: RateLimitCheckResult | undefined;
      let nextExecutionTime: Date | undefined;

      if (dedupResult.allowed && task.assigned_device_id) {
        rateLimitResult = await this.checkRateLimit(
          task.assigned_device_id,
          task.platform,
          task.task_type,
          config
        );

        if (!rateLimitResult.allowed) {
          nextExecutionTime = await this.getNextExecutionTime(
            task.assigned_device_id,
            task.platform,
            task.task_type,
            config
          );
        }
      }

      // 3. 综合判断
      const overallAllowed = dedupResult.allowed && (rateLimitResult?.allowed ?? true);
      const allReasons = [
        ...dedupResult.reasons,
        ...(rateLimitResult?.allowed === false ? [rateLimitResult.reason!] : [])
      ];

      return {
        allowed: overallAllowed,
        reasons: allReasons,
        next_execution_time: nextExecutionTime
      };

    } catch (error) {
      console.error('Full pre-check failed:', error);
      return {
        allowed: false,
        reasons: ['系统检查异常，为安全起见拒绝操作']
      };
    }
  }
}

// 导出单例实例
export const rateLimitService = new RateLimitService();

// 导出类型定义
export type {
  RateLimitConfig,
  DedupCheckResult,
  RateLimitCheckResult,
  DedupStats,
  DedupLevel
} from '../types';