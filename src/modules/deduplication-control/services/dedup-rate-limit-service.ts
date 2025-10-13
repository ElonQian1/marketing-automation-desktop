// src/modules/deduplication-control/services/dedup-rate-limit-service.ts
// module: dedup | layer: services | role: rate-limit-controller
// summary: 频率限制控制服务

/**
 * 频控服务
 * 
 * 实现多层级的频率控制：每小时、每日、时间间隔、高峰期等
 */
import { invoke } from '@tauri-apps/api/core';
import { 
  RateLimitType,
  RateLimitConfig,
  RateLimitResult,
  SafetyCheckRequest 
} from '../types';

/**
 * 频控存储服务
 */
export class RateLimitStorageService {
  /**
   * 获取指定时间范围内的操作计数
   */
  static async getOperationCount(
    accountId: string,
    taskType: 'follow' | 'reply' | 'all',
    timeRangeHours: number
  ): Promise<number> {
    try {
      const count = await invoke<number>('get_operation_count', {
        accountId,
        taskType,
        timeRangeHours
      });
      return count;
    } catch (error) {
      console.error('获取操作计数失败:', error);
      return 0;
    }
  }
  
  /**
   * 获取最后一次操作时间
   */
  static async getLastOperationTime(
    accountId: string,
    taskType: 'follow' | 'reply' | 'all'
  ): Promise<Date | null> {
    try {
      const timestamp = await invoke<string | null>('get_last_operation_time', {
        accountId,
        taskType
      });
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('获取最后操作时间失败:', error);
      return null;
    }
  }
  
  /**
   * 记录操作
   */
  static async recordOperation(
    accountId: string,
    taskType: 'follow' | 'reply',
    deviceId?: string
  ): Promise<void> {
    try {
      await invoke('record_operation', {
        accountId,
        taskType,
        deviceId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('记录操作失败:', error);
    }
  }
  
  /**
   * 获取今日操作统计
   */
  static async getTodayStatistics(accountId: string): Promise<{
    followCount: number;
    replyCount: number;
    totalCount: number;
  }> {
    try {
      const stats = await invoke<{
        follow_count: number;
        reply_count: number;
        total_count: number;
      }>('get_today_statistics', { accountId });
      
      return {
        followCount: stats.follow_count,
        replyCount: stats.reply_count,
        totalCount: stats.total_count
      };
    } catch (error) {
      console.error('获取今日统计失败:', error);
      return { followCount: 0, replyCount: 0, totalCount: 0 };
    }
  }
}

/**
 * 时间工具类
 */
export class TimeUtils {
  /**
   * 检查当前时间是否在指定时间范围内
   */
  static isInTimeRange(timeRanges: Array<{ start: string; end: string }>): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 转换为分钟
    
    return timeRanges.some(range => {
      const [startHour, startMin] = range.start.split(':').map(Number);
      const [endHour, endMin] = range.end.split(':').map(Number);
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      // 处理跨天的情况
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        return currentTime >= startTime && currentTime <= endTime;
      }
    });
  }
  
  /**
   * 计算到下个小时的剩余时间（秒）
   */
  static getSecondsToNextHour(): number {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return Math.floor((nextHour.getTime() - now.getTime()) / 1000);
  }
  
  /**
   * 计算到明天的剩余时间（秒）
   */
  static getSecondsToNextDay(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
  }
  
  /**
   * 生成随机等待时间
   */
  static generateRandomWaitTime(
    minSeconds: number, 
    maxSeconds: number
  ): number {
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  }
}

/**
 * 主频控服务
 */
export class RateLimitService {
  private config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = config;
  }
  
  /**
   * 执行完整的频控检查
   */
  async performRateLimitCheck(request: SafetyCheckRequest): Promise<RateLimitResult> {
    const result: RateLimitResult = {
      allowed: true,
      triggeredTypes: [],
      currentUsage: {
        hourly: 0,
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      remainingQuota: {
        hourly: 0,
        daily: 0,
        weekly: 0,
        monthly: 0
      }
    };
    
    // 获取当前使用量
    result.currentUsage = await this.getCurrentUsage(request.accountId, request.taskType);
    
    // 每小时频控检查
    if (this.config.types.includes(RateLimitType.HOURLY) && this.config.hourly.enabled) {
      const hourlyCheck = await this.checkHourlyLimit(request, result.currentUsage.hourly);
      if (!hourlyCheck.allowed) {
        result.allowed = false;
        result.triggeredTypes.push(RateLimitType.HOURLY);
        result.waitTimeSeconds = hourlyCheck.waitTimeSeconds;
        result.resetTime = hourlyCheck.resetTime;
        result.reason = hourlyCheck.reason;
      }
      result.remainingQuota.hourly = hourlyCheck.remainingQuota;
    }
    
    // 每日频控检查
    if (this.config.types.includes(RateLimitType.DAILY) && this.config.daily.enabled) {
      const dailyCheck = await this.checkDailyLimit(request, result.currentUsage.daily);
      if (!dailyCheck.allowed) {
        result.allowed = false;
        result.triggeredTypes.push(RateLimitType.DAILY);
        if (!result.waitTimeSeconds || dailyCheck.waitTimeSeconds! < result.waitTimeSeconds) {
          result.waitTimeSeconds = dailyCheck.waitTimeSeconds;
          result.resetTime = dailyCheck.resetTime;
          result.reason = dailyCheck.reason;
        }
      }
      result.remainingQuota.daily = dailyCheck.remainingQuota;
    }
    
    // 间隔频控检查
    if (this.config.types.includes(RateLimitType.INTERVAL) && this.config.interval.enabled) {
      const intervalCheck = await this.checkIntervalLimit(request);
      if (!intervalCheck.allowed) {
        result.allowed = false;
        result.triggeredTypes.push(RateLimitType.INTERVAL);
        if (!result.waitTimeSeconds || intervalCheck.waitTimeSeconds! < result.waitTimeSeconds) {
          result.waitTimeSeconds = intervalCheck.waitTimeSeconds;
          result.reason = intervalCheck.reason;
        }
      }
    }
    
    // 高峰期限制检查
    if (this.config.peakHours.enabled) {
      const peakHourCheck = this.checkPeakHourLimit(request, result.currentUsage);
      if (!peakHourCheck.allowed) {
        result.allowed = false;
        result.reason = peakHourCheck.reason;
        // 高峰期限制会覆盖其他配额
        if (peakHourCheck.adjustedQuota) {
          result.remainingQuota = peakHourCheck.adjustedQuota;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 获取当前使用量
   */
  private async getCurrentUsage(accountId: string, taskType: 'follow' | 'reply'): Promise<{
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  }> {
    try {
      const [hourly, daily, weekly, monthly] = await Promise.all([
        RateLimitStorageService.getOperationCount(accountId, taskType, 1),
        RateLimitStorageService.getOperationCount(accountId, taskType, 24),
        RateLimitStorageService.getOperationCount(accountId, taskType, 168), // 7天
        RateLimitStorageService.getOperationCount(accountId, taskType, 720)  // 30天
      ]);
      
      return { hourly, daily, weekly, monthly };
    } catch (error) {
      console.error('获取当前使用量失败:', error);
      return { hourly: 0, daily: 0, weekly: 0, monthly: 0 };
    }
  }
  
  /**
   * 检查每小时限制
   */
  private async checkHourlyLimit(
    request: SafetyCheckRequest, 
    currentUsage: number
  ): Promise<{
    allowed: boolean;
    remainingQuota: number;
    waitTimeSeconds?: number;
    resetTime?: Date;
    reason?: string;
  }> {
    const limit = request.taskType === 'follow' 
      ? this.config.hourly.followLimit 
      : this.config.hourly.replyLimit;
    
    const remainingQuota = Math.max(0, limit - currentUsage);
    
    if (currentUsage >= limit) {
      const waitTimeSeconds = TimeUtils.getSecondsToNextHour();
      const resetTime = new Date();
      resetTime.setHours(resetTime.getHours() + 1, 0, 0, 0);
      
      return {
        allowed: false,
        remainingQuota: 0,
        waitTimeSeconds,
        resetTime,
        reason: `每小时${request.taskType === 'follow' ? '关注' : '回复'}次数已达上限 (${limit}次)`
      };
    }
    
    return {
      allowed: true,
      remainingQuota
    };
  }
  
  /**
   * 检查每日限制
   */
  private async checkDailyLimit(
    request: SafetyCheckRequest, 
    currentUsage: number
  ): Promise<{
    allowed: boolean;
    remainingQuota: number;
    waitTimeSeconds?: number;
    resetTime?: Date;
    reason?: string;
  }> {
    const limit = request.taskType === 'follow' 
      ? this.config.daily.followLimit 
      : this.config.daily.replyLimit;
    
    const remainingQuota = Math.max(0, limit - currentUsage);
    
    if (currentUsage >= limit) {
      const waitTimeSeconds = TimeUtils.getSecondsToNextDay();
      const resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);
      
      return {
        allowed: false,
        remainingQuota: 0,
        waitTimeSeconds,
        resetTime,
        reason: `每日${request.taskType === 'follow' ? '关注' : '回复'}次数已达上限 (${limit}次)`
      };
    }
    
    return {
      allowed: true,
      remainingQuota
    };
  }
  
  /**
   * 检查间隔限制
   */
  private async checkIntervalLimit(request: SafetyCheckRequest): Promise<{
    allowed: boolean;
    waitTimeSeconds?: number;
    reason?: string;
  }> {
    const lastOperationTime = await RateLimitStorageService.getLastOperationTime(
      request.accountId,
      request.taskType
    );
    
    if (!lastOperationTime) {
      return { allowed: true };
    }
    
    const now = new Date();
    const timeSinceLastOperation = Math.floor((now.getTime() - lastOperationTime.getTime()) / 1000);
    const minInterval = this.config.interval.minIntervalSeconds;
    
    if (timeSinceLastOperation < minInterval) {
      const waitTimeSeconds = minInterval - timeSinceLastOperation;
      
      // 如果启用随机化间隔，添加随机延迟
      let actualWaitTime = waitTimeSeconds;
      if (this.config.interval.randomizeInterval) {
        const randomDelay = TimeUtils.generateRandomWaitTime(
          this.config.interval.minIntervalSeconds,
          this.config.interval.maxIntervalSeconds
        );
        actualWaitTime = Math.max(waitTimeSeconds, randomDelay);
      }
      
      return {
        allowed: false,
        waitTimeSeconds: actualWaitTime,
        reason: `操作间隔过短，需等待 ${actualWaitTime} 秒`
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 检查高峰期限制
   */
  private checkPeakHourLimit(
    request: SafetyCheckRequest,
    currentUsage: { hourly: number; daily: number; weekly: number; monthly: number }
  ): {
    allowed: boolean;
    reason?: string;
    adjustedQuota?: { hourly: number; daily: number; weekly: number; monthly: number };
  } {
    if (!TimeUtils.isInTimeRange(this.config.peakHours.timeRanges)) {
      return { allowed: true };
    }
    
    // 在高峰期，限制会按倍数调整
    const multiplier = this.config.peakHours.limitMultiplier;
    
    const adjustedHourlyLimit = Math.floor(
      (request.taskType === 'follow' 
        ? this.config.hourly.followLimit 
        : this.config.hourly.replyLimit) * multiplier
    );
    
    const adjustedDailyLimit = Math.floor(
      (request.taskType === 'follow' 
        ? this.config.daily.followLimit 
        : this.config.daily.replyLimit) * multiplier
    );
    
    // 检查是否超过调整后的限制
    if (currentUsage.hourly >= adjustedHourlyLimit) {
      return {
        allowed: false,
        reason: `高峰期每小时限制已达上限 (${adjustedHourlyLimit}次)`,
        adjustedQuota: {
          hourly: Math.max(0, adjustedHourlyLimit - currentUsage.hourly),
          daily: Math.max(0, adjustedDailyLimit - currentUsage.daily),
          weekly: currentUsage.weekly,
          monthly: currentUsage.monthly
        }
      };
    }
    
    if (currentUsage.daily >= adjustedDailyLimit) {
      return {
        allowed: false,
        reason: `高峰期每日限制已达上限 (${adjustedDailyLimit}次)`,
        adjustedQuota: {
          hourly: Math.max(0, adjustedHourlyLimit - currentUsage.hourly),
          daily: Math.max(0, adjustedDailyLimit - currentUsage.daily),
          weekly: currentUsage.weekly,
          monthly: currentUsage.monthly
        }
      };
    }
    
    return {
      allowed: true,
      adjustedQuota: {
        hourly: Math.max(0, adjustedHourlyLimit - currentUsage.hourly),
        daily: Math.max(0, adjustedDailyLimit - currentUsage.daily),
        weekly: currentUsage.weekly,
        monthly: currentUsage.monthly
      }
    };
  }
  
  /**
   * 记录成功的操作
   */
  async recordSuccessfulOperation(request: SafetyCheckRequest): Promise<void> {
    try {
      await RateLimitStorageService.recordOperation(
        request.accountId,
        request.taskType,
        request.deviceId
      );
    } catch (error) {
      console.error('记录操作失败:', error);
    }
  }
  
  /**
   * 获取建议的等待时间
   */
  getRecommendedWaitTime(result: RateLimitResult): number {
    if (result.waitTimeSeconds) {
      return result.waitTimeSeconds;
    }
    
    // 如果没有明确的等待时间，使用默认间隔
    if (this.config.interval.enabled) {
      return this.config.interval.randomizeInterval
        ? TimeUtils.generateRandomWaitTime(
            this.config.interval.minIntervalSeconds,
            this.config.interval.maxIntervalSeconds
          )
        : this.config.interval.minIntervalSeconds;
    }
    
    return 60; // 默认等待60秒
  }
}