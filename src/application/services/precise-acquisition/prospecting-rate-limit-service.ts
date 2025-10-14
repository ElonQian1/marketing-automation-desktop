// src/application/services/precise-acquisition/prospecting-rate-limit-service.ts
// module: precise-acquisition | layer: application | role: rate-limit-service
// summary: 精准获客频控服务

/**
 * 精准获客 - 频控服务
 *
 * 提供频控配置及检查逻辑，便于任务生成和执行阶段复用
 */

import { invoke } from '@tauri-apps/api/core';
import { ResultCode, TaskStatus } from '../../../constants/precise-acquisition-enums';
import type { RateLimitConfig, TaskRow } from '../../../types/precise-acquisition';

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  wait_seconds?: number;
  next_available_at?: string;
  metrics?: {
    hourlyCount: number;
    dailyCount: number;
    recentRateLimited: number;
    recentBlocked: number;
  };
}

export class ProspectingRateLimitService {
  /**
   * 默认频控配置
   */
  getDefaultConfig(): RateLimitConfig {
    return {
      hourly_limit: 20,
      daily_limit: 150,
      min_interval_seconds: 90,
      max_interval_seconds: 180,
    };
  }

  /**
   * 频控检查
   */
  async check(accountId: string, config: RateLimitConfig): Promise<RateLimitCheckResult> {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const maxInterval = Math.max(config.min_interval_seconds, config.max_interval_seconds);
      const jitterRange = Math.max(0, maxInterval - config.min_interval_seconds);
      const recommendedInterval = config.min_interval_seconds + (jitterRange > 0 ? Math.round(jitterRange * 0.6) : 0);

      const recentTasks = await invoke('list_tasks', {
        assign_account_id: accountId,
        limit: 1000,
      }) as TaskRow[];

      const doneTasks = recentTasks.filter(task => task.executed_at && task.status === TaskStatus.DONE);
      const hourlyCount = doneTasks.filter(task => {
        if (!task.executed_at) return false;
        const executedAt = new Date(task.executed_at);
        return executedAt >= hourAgo;
      }).length;
      const dailyCount = doneTasks.filter(task => {
        if (!task.executed_at) return false;
        const executedAt = new Date(task.executed_at);
        return executedAt >= dayAgo;
      }).length;

      const recentRateLimited = recentTasks.filter(task => task.result_code === ResultCode.RATE_LIMITED).length;
      const recentBlocked = recentTasks.filter(task =>
        task.result_code === ResultCode.BLOCKED || task.result_code === ResultCode.PERMISSION_DENIED,
      ).length;

      const baseMetrics = {
        hourlyCount,
        dailyCount,
        recentRateLimited,
        recentBlocked,
      };

      if (hourlyCount >= config.hourly_limit) {
        const waitSeconds = Math.max(0, 3600 - Math.floor((now.getTime() - hourAgo.getTime()) / 1000));
        return {
          allowed: false,
          reason: `已达到每小时限制 (${config.hourly_limit})`,
          wait_seconds: waitSeconds,
          next_available_at: new Date(now.getTime() + waitSeconds * 1000).toISOString(),
          metrics: baseMetrics,
        };
      }

      if (dailyCount >= config.daily_limit) {
        const waitSeconds = Math.max(0, 86400 - Math.floor((now.getTime() - dayAgo.getTime()) / 1000));
        return {
          allowed: false,
          reason: `已达到每日限制 (${config.daily_limit})`,
          wait_seconds: waitSeconds,
          next_available_at: new Date(now.getTime() + waitSeconds * 1000).toISOString(),
          metrics: baseMetrics,
        };
      }

      const lastExecution = doneTasks
        .map(task => new Date(task.executed_at!))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      if (lastExecution) {
        const intervalSeconds = (now.getTime() - lastExecution.getTime()) / 1000;
        const jitter = jitterRange > 0
          ? Math.min(jitterRange, Math.round(config.min_interval_seconds * (0.05 + Math.random() * 0.15)))
          : 0;
        const requiredInterval = config.min_interval_seconds + jitter;

        if (intervalSeconds < requiredInterval) {
          const waitSeconds = Math.max(0, requiredInterval - Math.floor(intervalSeconds));
          return {
            allowed: false,
            reason: `未达到最小间隔要求 (${config.min_interval_seconds}秒 + 抖动)`,
            wait_seconds: waitSeconds,
            next_available_at: new Date(now.getTime() + waitSeconds * 1000).toISOString(),
            metrics: baseMetrics,
          };
        }
      }

      if (recentRateLimited >= 3) {
        const cooldown = maxInterval * 2;
        return {
          allowed: false,
          reason: '频控命中次数过多，自动降速',
          wait_seconds: cooldown,
          next_available_at: new Date(now.getTime() + cooldown * 1000).toISOString(),
          metrics: baseMetrics,
        };
      }

      if (recentBlocked >= 3) {
        const waitSeconds = 1800;
        return {
          allowed: false,
          reason: '检测到权限/封禁风险，建议人工检查',
          wait_seconds: waitSeconds,
          next_available_at: new Date(now.getTime() + waitSeconds * 1000).toISOString(),
          metrics: baseMetrics,
        };
      }

      return {
        allowed: true,
        next_available_at: new Date(now.getTime() + recommendedInterval * 1000).toISOString(),
        metrics: baseMetrics,
      };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return { allowed: false, reason: '频控检查失败' };
    }
  }
}

export const prospectingRateLimitService = new ProspectingRateLimitService();
