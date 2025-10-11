// src/modules/precise-acquisition/rate-limit/services/RateLimiter.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 查重频控 - 频率限制器
 * 
 * 负责频率控制逻辑
 */

import { invoke } from '@tauri-apps/api/core';
import { Platform, TaskType } from '../../shared/types/core';
import { RateLimitStrategy, RateLimitConfig, RateLimitCheckResult, DedupRecord } from '../types';

export class RateLimiter {
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

  /**
   * 频控检查
   */
  async checkRateLimit(
    deviceId: string,
    platform: Platform,
    taskType: TaskType,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitCheckResult> {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    
    try {
      // 获取最近操作记录
      const since = new Date(Date.now() - effectiveConfig.window_size_minutes * 60 * 1000);
      const recentOperations = await this.getRecentOperations(
        deviceId, 
        platform, 
        taskType, 
        since
      );

      // 检查小时限制
      const hourOperations = recentOperations.filter(
        op => Date.now() - op.created_at.getTime() < 60 * 60 * 1000
      );

      if (hourOperations.length >= effectiveConfig.max_operations_per_hour) {
        const oldestHourOp = hourOperations
          .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0];
        const resetTime = new Date(oldestHourOp.created_at.getTime() + 60 * 60 * 1000);

        return {
          allowed: false,
          reason: '已达到每小时操作限制',
          current_rate: hourOperations.length,
          limit: effectiveConfig.max_operations_per_hour,
          reset_time: resetTime,
          retry_after_ms: resetTime.getTime() - Date.now()
        };
      }

      // 检查每日限制
      const dayOperations = recentOperations.filter(
        op => Date.now() - op.created_at.getTime() < 24 * 60 * 60 * 1000
      );

      if (dayOperations.length >= effectiveConfig.max_operations_per_day) {
        const oldestDayOp = dayOperations
          .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0];
        const resetTime = new Date(oldestDayOp.created_at.getTime() + 24 * 60 * 60 * 1000);

        return {
          allowed: false,
          reason: '已达到每日操作限制',
          current_rate: dayOperations.length,
          limit: effectiveConfig.max_operations_per_day,
          reset_time: resetTime,
          retry_after_ms: resetTime.getTime() - Date.now()
        };
      }

      return {
        allowed: true,
        current_rate: recentOperations.length,
        limit: effectiveConfig.max_operations_per_hour,
        reset_time: new Date(Date.now() + effectiveConfig.window_size_minutes * 60 * 1000)
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: false,
        reason: '频控检查失败',
        current_rate: 0,
        limit: effectiveConfig.max_operations_per_hour,
        reset_time: new Date()
      };
    }
  }

  /**
   * 计算动态间隔
   */
  calculateDynamicInterval(
    recentFailures: number,
    strategy: RateLimitStrategy = RateLimitStrategy.ADAPTIVE,
    config?: Partial<RateLimitConfig>
  ): number {
    const effectiveConfig = { ...this.defaultConfig, ...config };

    switch (strategy) {
      case RateLimitStrategy.FIXED_INTERVAL:
        return effectiveConfig.base_interval_ms;

      case RateLimitStrategy.EXPONENTIAL_BACKOFF:
        return Math.min(
          effectiveConfig.base_interval_ms * Math.pow(2, recentFailures),
          effectiveConfig.max_interval_ms
        );

      case RateLimitStrategy.ADAPTIVE:
        // 根据失败次数和时间适应性调整
        const failureFactor = Math.min(recentFailures / 5, 3); // 最多3倍
        const adaptiveInterval = effectiveConfig.base_interval_ms * (1 + failureFactor);
        return Math.min(adaptiveInterval, effectiveConfig.max_interval_ms);

      case RateLimitStrategy.TIME_WINDOW:
        // 在时间窗口内平均分配
        return (effectiveConfig.window_size_minutes * 60 * 1000) / effectiveConfig.max_operations_per_hour;

      default:
        return effectiveConfig.base_interval_ms;
    }
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
    const rateLimitResult = await this.checkRateLimit(deviceId, platform, taskType, config);
    
    if (rateLimitResult.allowed) {
      return new Date();
    }

    if (rateLimitResult.retry_after_ms) {
      return new Date(Date.now() + rateLimitResult.retry_after_ms);
    }

    // 回退到配置的基础间隔
    const effectiveConfig = { ...this.defaultConfig, ...config };
    return new Date(Date.now() + effectiveConfig.base_interval_ms);
  }

  // === 私有辅助方法 ===

  private async getRecentOperations(
    deviceId: string,
    platform: Platform,
    taskType: TaskType,
    since: Date
  ): Promise<DedupRecord[]> {
    try {
      const operations = await invoke<DedupRecord[]>('get_recent_operations', {
        device_id: deviceId,
        platform,
        task_type: taskType,
        since: since.toISOString()
      });

      return operations;
    } catch (error) {
      console.error('Failed to get recent operations:', error);
      return [];
    }
  }
}