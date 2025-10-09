/**
 * 查重频控 - 核心检查器
 * 
 * 负责执行具体的去重检查逻辑
 */

import { invoke } from '@tauri-apps/api/core';
import { Comment, Task, WatchTarget, Platform, TaskType } from '../../shared/types/core';
import { DedupLevel, DedupRecord, DedupCheckResult, RateLimitConfig } from '../types';

export class DedupChecker {
  /**
   * 评论级去重检查
   */
  async checkCommentDedup(
    comment: Comment, 
    taskType: TaskType, 
    deviceId: string
  ): Promise<DedupCheckResult> {
    const dedupKey = this.generateCommentDedupKey(comment, taskType);
    
    try {
      const existingRecord = await this.findDedupRecord(
        DedupLevel.COMMENT, 
        dedupKey
      );

      if (existingRecord) {
        return {
          allowed: false,
          reason: '该评论已存在相同类型的操作记录',
          conflicting_record: existingRecord
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Comment dedup check failed:', error);
      return {
        allowed: false,
        reason: '去重检查失败，为安全起见拒绝操作'
      };
    }
  }

  /**
   * 用户级去重检查
   */
  async checkUserDedup(
    userId: string,
    platform: Platform,
    taskType: TaskType,
    deviceId: string,
    config: RateLimitConfig
  ): Promise<DedupCheckResult> {
    const dedupKey = this.generateUserDedupKey(userId, platform, taskType);
    
    try {
      const existingRecord = await this.findDedupRecord(
        DedupLevel.USER, 
        dedupKey
      );

      if (existingRecord) {
        // 检查是否在冷却期内
        const cooldownEnd = new Date(existingRecord.created_at.getTime() + config.cooldown_after_failure_ms);
        if (new Date() < cooldownEnd) {
          return {
            allowed: false,
            reason: '用户操作冷却期内，请稍后再试',
            conflicting_record: existingRecord,
            next_available_time: cooldownEnd
          };
        }
      }

      return { allowed: true };

    } catch (error) {
      console.error('User dedup check failed:', error);
      return {
        allowed: false,
        reason: '用户去重检查失败'
      };
    }
  }

  /**
   * 跨设备查重检查
   */
  async checkCrossDeviceDedup(
    target: WatchTarget,
    taskType: TaskType,
    currentDeviceId: string
  ): Promise<DedupCheckResult> {
    const dedupKey = this.generateTargetDedupKey(target, taskType);
    
    try {
      const existingRecords = await this.findDedupRecords(
        DedupLevel.DEVICE, 
        dedupKey
      );

      // 过滤掉当前设备的记录
      const otherDeviceRecords = existingRecords.filter(
        record => record.device_id !== currentDeviceId
      );

      if (otherDeviceRecords.length > 0) {
        const latestRecord = otherDeviceRecords
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];

        return {
          allowed: false,
          reason: `其他设备(${latestRecord.device_id})已对该目标执行相同操作`,
          conflicting_record: latestRecord
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Cross-device dedup check failed:', error);
      return {
        allowed: false,
        reason: '跨设备查重检查失败'
      };
    }
  }

  /**
   * 综合去重检查
   */
  async performComprehensiveCheck(
    task: Task,
    config: RateLimitConfig,
    comment?: Comment,
    target?: WatchTarget
  ): Promise<{
    allowed: boolean;
    reasons: string[];
    suggested_delay_ms?: number;
  }> {
    const results: DedupCheckResult[] = [];
    const reasons: string[] = [];

    try {
      // 1. 评论级去重检查
      if (comment && task.assigned_device_id) {
        const commentResult = await this.checkCommentDedup(
          comment, 
          task.task_type, 
          task.assigned_device_id
        );
        results.push(commentResult);
        if (!commentResult.allowed) {
          reasons.push(commentResult.reason!);
        }
      }

      // 2. 用户级去重检查  
      if (task.target_user_id && task.assigned_device_id) {
        const userResult = await this.checkUserDedup(
          task.target_user_id,
          task.platform,
          task.task_type,
          task.assigned_device_id,
          config
        );
        results.push(userResult);
        if (!userResult.allowed) {
          reasons.push(userResult.reason!);
        }
      }

      // 3. 跨设备查重检查
      if (target && task.assigned_device_id) {
        const deviceResult = await this.checkCrossDeviceDedup(
          target,
          task.task_type,
          task.assigned_device_id
        );
        results.push(deviceResult);
        if (!deviceResult.allowed) {
          reasons.push(deviceResult.reason!);
        }
      }

      const allAllowed = results.every(result => result.allowed);
      const suggestedDelay = this.calculateSuggestedDelay(results);

      return {
        allowed: allAllowed,
        reasons,
        suggested_delay_ms: suggestedDelay
      };

    } catch (error) {
      console.error('Comprehensive dedup check failed:', error);
      return {
        allowed: false,
        reasons: ['去重检查系统异常'],
        suggested_delay_ms: 60000 // 1分钟后重试
      };
    }
  }

  // === 私有辅助方法 ===

  private generateCommentDedupKey(comment: Comment, taskType: TaskType): string {
    return `comment_${comment.platform}_${comment.id}_${taskType}`;
  }

  private generateUserDedupKey(userId: string, platform: Platform, taskType: TaskType): string {
    return `user_${platform}_${userId}_${taskType}`;
  }

  private generateTargetDedupKey(target: WatchTarget, taskType: TaskType): string {
    return `target_${target.platform}_${target.id}_${taskType}`;
  }

  private async findDedupRecord(level: DedupLevel, key: string): Promise<DedupRecord | null> {
    try {
      const record = await invoke<DedupRecord | null>('find_dedup_record', {
        level,
        key
      });
      return record;
    } catch (error) {
      console.error('Failed to find dedup record:', error);
      return null;
    }
  }

  private async findDedupRecords(level: DedupLevel, key: string): Promise<DedupRecord[]> {
    try {
      const records = await invoke<DedupRecord[]>('find_dedup_records', {
        level,
        key
      });
      return records;
    } catch (error) {
      console.error('Failed to find dedup records:', error);
      return [];
    }
  }

  private calculateSuggestedDelay(results: DedupCheckResult[]): number | undefined {
    const nextAvailableTimes = results
      .filter(result => !result.allowed && result.next_available_time)
      .map(result => result.next_available_time!.getTime());

    if (nextAvailableTimes.length === 0) {
      return undefined;
    }

    const maxNextTime = Math.max(...nextAvailableTimes);
    const now = Date.now();
    return Math.max(0, maxNextTime - now);
  }
}