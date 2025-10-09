/**
 * 查重频控 - 类型定义
 */

import { Platform, TaskType } from '../../shared/types/core';

/**
 * 去重级别枚举
 */
export enum DedupLevel {
  COMMENT = 'comment',    // 评论级去重
  USER = 'user',          // 用户级去重
  DEVICE = 'device',      // 设备级去重
  FREQUENCY = 'frequency' // 频率去重
}

/**
 * 频控策略枚举
 */
export enum RateLimitStrategy {
  FIXED_INTERVAL = 'fixed_interval',     // 固定间隔
  EXPONENTIAL_BACKOFF = 'exponential_backoff', // 指数退避
  ADAPTIVE = 'adaptive',                 // 自适应调整
  TIME_WINDOW = 'time_window'           // 时间窗口
}

/**
 * 去重记录
 */
export interface DedupRecord {
  id: string;
  level: DedupLevel;
  key: string;              // 去重键
  value: string;            // 去重值
  platform: Platform;
  task_type: TaskType;
  device_id: string;
  created_at: Date;
  expires_at?: Date;
  metadata?: Record<string, any>;
}

/**
 * 频控配置
 */
export interface RateLimitConfig {
  strategy: RateLimitStrategy;
  base_interval_ms: number;      // 基础间隔（毫秒）
  max_interval_ms: number;       // 最大间隔（毫秒）
  max_operations_per_hour: number;
  max_operations_per_day: number;
  cooldown_after_failure_ms: number;
  burst_size: number;            // 突发大小
  window_size_minutes: number;   // 时间窗口大小（分钟）
}

/**
 * 去重检查结果
 */
export interface DedupCheckResult {
  allowed: boolean;
  reason?: string;
  conflicting_record?: DedupRecord;
  next_available_time?: Date;
}

/**
 * 频控检查结果
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  current_rate: number;
  limit: number;
  reset_time: Date;
  retry_after_ms?: number;
}

/**
 * 去重统计信息
 */
export interface DedupStats {
  total_records: number;
  active_records: number;
  expired_records: number;
  by_level: Record<DedupLevel, number>;
  by_platform: Record<Platform, number>;
  by_task_type: Record<TaskType, number>;
  recent_blocks: Array<{
    timestamp: Date;
    level: DedupLevel;
    key: string;
    reason: string;
  }>;
  effectiveness_rate: number; // 有效去重率
}