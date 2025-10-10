/**
 * 频控和去重系统
 * 
 * 实现完整的频率控制和去重机制，防止任务重复执行和被平台检测
 * 支持随机抖动、熔断机制、跨设备去重等高级功能
 */

import { Platform } from '../../../constants/precise-acquisition-enums';

// ==================== 频控配置接口 ====================

export interface RateControlConfig {
  // 基础频控设置
  hourly_limit: number;           // 小时任务上限
  daily_limit: number;            // 日任务上限
  min_interval_ms: number;        // 最小间隔时间（毫秒）
  max_interval_ms: number;        // 最大间隔时间（毫秒）
  
  // 随机抖动设置
  jitter_enabled: boolean;        // 是否启用随机抖动
  jitter_factor: number;          // 抖动因子（0-1）
  jitter_type: 'uniform' | 'exponential' | 'gaussian'; // 抖动类型
  
  // 熔断机制设置
  circuit_breaker_enabled: boolean;    // 是否启用熔断
  failure_threshold: number;           // 连续失败阈值
  recovery_timeout_ms: number;         // 熔断恢复时间
  partial_recovery_threshold: number;  // 部分恢复阈值
  
  // 平台特定设置
  platform_specific: Record<Platform, {
    multiplier: number;          // 平台频控倍数
    special_limits?: {
      peak_hours?: number[];     // 高峰时段
      peak_multiplier?: number;  // 高峰时段倍数
    };
  }>;
}

// ==================== 去重配置接口 ====================

export interface DeduplicationConfig {
  // 去重范围设置
  scope: 'device' | 'account' | 'global';    // 去重范围
  time_window_hours: number;                 // 时间窗口（小时）
  
  // 去重字段设置
  dedup_fields: Array<'target_user_id' | 'target_video_url' | 'content' | 'task_type'>;
  
  // 存储设置
  storage_type: 'memory' | 'sqlite' | 'redis';
  max_entries: number;                       // 最大存储条目数
  cleanup_interval_hours: number;            // 清理间隔（小时）
  
  // 模糊匹配设置
  fuzzy_matching: {
    enabled: boolean;
    similarity_threshold: number;            // 相似度阈值（0-1）
    algorithm: 'levenshtein' | 'cosine' | 'jaccard';
  };
}

// ==================== 状态跟踪接口 ====================

export interface RateControlState {
  device_id: string;
  account_id?: string;
  platform: Platform;
  
  // 计数器
  hourly_count: number;
  daily_count: number;
  last_reset_hour: number;
  last_reset_day: number;
  
  // 时间跟踪
  last_execution_time: Date;
  next_available_time: Date;
  
  // 熔断状态
  circuit_state: 'closed' | 'open' | 'half_open';
  consecutive_failures: number;
  circuit_opened_at?: Date;
  
  // 统计信息
  total_executions: number;
  total_failures: number;
  average_interval_ms: number;
}

export interface DeduplicationEntry {
  id: string;
  fingerprint: string;
  device_id: string;
  account_id?: string;
  platform: Platform;
  task_type: string;
  target_user_id: string;
  target_video_url?: string;
  content?: string;
  created_at: Date;
  expires_at: Date;
}

// ==================== 频控和去重系统 ====================

export class RateControlAndDeduplicationSystem {
  private rateConfig: RateControlConfig;
  private dedupConfig: DeduplicationConfig;
  private rateStates: Map<string, RateControlState> = new Map();
  private dedupEntries: Map<string, DeduplicationEntry> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(rateConfig: RateControlConfig, dedupConfig: DeduplicationConfig) {
    this.rateConfig = rateConfig;
    this.dedupConfig = dedupConfig;
    this.startCleanupTimer();
  }

  /**
   * 检查是否可以执行任务
   */
  async canExecuteTask(request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
    task_type: string;
    target_user_id: string;
    target_video_url?: string;
    content?: string;
  }): Promise<{
    can_execute: boolean;
    reason?: string;
    wait_time_ms?: number;
    next_available_time?: Date;
  }> {
    // 检查去重
    const dedupResult = await this.checkDeduplication(request);
    if (!dedupResult.is_unique) {
      return {
        can_execute: false,
        reason: `Task is duplicate: ${dedupResult.reason}`,
        wait_time_ms: 0
      };
    }

    // 检查频控
    const rateResult = await this.checkRateLimit(request);
    if (!rateResult.can_execute) {
      return {
        can_execute: false,
        reason: rateResult.reason,
        wait_time_ms: rateResult.wait_time_ms,
        next_available_time: rateResult.next_available_time
      };
    }

    return { can_execute: true };
  }

  /**
   * 记录任务执行
   */
  async recordTaskExecution(request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
    task_type: string;
    target_user_id: string;
    target_video_url?: string;
    content?: string;
    success: boolean;
    execution_time_ms: number;
  }): Promise<void> {
    const stateKey = this.getRateStateKey(request.device_id, request.account_id, request.platform);
    const state = this.getRateState(stateKey, request);

    // 更新执行统计
    state.total_executions++;
    state.last_execution_time = new Date();
    
    // 更新计数器
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    
    if (state.last_reset_hour !== currentHour) {
      state.hourly_count = 0;
      state.last_reset_hour = currentHour;
    }
    
    if (state.last_reset_day !== currentDay) {
      state.daily_count = 0;
      state.last_reset_day = currentDay;
    }
    
    state.hourly_count++;
    state.daily_count++;

    // 更新平均间隔
    if (state.total_executions > 1) {
      const totalIntervals = state.average_interval_ms * (state.total_executions - 1) + request.execution_time_ms;
      state.average_interval_ms = totalIntervals / state.total_executions;
    } else {
      state.average_interval_ms = request.execution_time_ms;
    }

    // 计算下次可执行时间
    const nextInterval = this.calculateNextInterval(state, request.platform);
    state.next_available_time = new Date(Date.now() + nextInterval);

    // 处理失败情况和熔断
    if (!request.success) {
      state.total_failures++;
      state.consecutive_failures++;
      
      if (this.rateConfig.circuit_breaker_enabled && 
          state.consecutive_failures >= this.rateConfig.failure_threshold &&
          state.circuit_state === 'closed') {
        state.circuit_state = 'open';
        state.circuit_opened_at = new Date();
        console.warn(`[RateControl] Circuit breaker opened for ${stateKey} after ${state.consecutive_failures} failures`);
      }
    } else {
      // 成功执行，重置连续失败计数
      state.consecutive_failures = 0;
      
      // 如果熔断器处于半开状态，可能恢复
      if (state.circuit_state === 'half_open') {
        state.circuit_state = 'closed';
        console.log(`[RateControl] Circuit breaker closed for ${stateKey} after successful execution`);
      }
    }

    // 记录去重条目
    await this.recordDeduplicationEntry(request);
  }

  /**
   * 获取频控状态
   */
  getRateControlStatus(deviceId: string, accountId?: string, platform?: Platform): RateControlState[] {
    const results: RateControlState[] = [];
    
    for (const [key, state] of this.rateStates) {
      if (state.device_id === deviceId && 
          (!accountId || state.account_id === accountId) &&
          (!platform || state.platform === platform)) {
        results.push({ ...state });
      }
    }
    
    return results;
  }

  /**
   * 获取去重统计
   */
  getDeduplicationStats(): {
    total_entries: number;
    entries_by_platform: Record<Platform, number>;
    entries_by_device: Record<string, number>;
    oldest_entry_age_hours: number;
    cleanup_due_in_ms: number;
  } {
    const stats = {
      total_entries: this.dedupEntries.size,
      entries_by_platform: {} as Record<Platform, number>,
      entries_by_device: {} as Record<string, number>,
      oldest_entry_age_hours: 0,
      cleanup_due_in_ms: 0
    };

    let oldestEntry: Date | null = null;

    for (const entry of this.dedupEntries.values()) {
      // 按平台统计
      stats.entries_by_platform[entry.platform] = (stats.entries_by_platform[entry.platform] || 0) + 1;
      
      // 按设备统计
      stats.entries_by_device[entry.device_id] = (stats.entries_by_device[entry.device_id] || 0) + 1;
      
      // 找最老的条目
      if (!oldestEntry || entry.created_at < oldestEntry) {
        oldestEntry = entry.created_at;
      }
    }

    if (oldestEntry) {
      stats.oldest_entry_age_hours = (Date.now() - oldestEntry.getTime()) / (1000 * 60 * 60);
    }

    return stats;
  }

  /**
   * 重置频控状态
   */
  resetRateControlState(deviceId: string, accountId?: string, platform?: Platform): boolean {
    const keysToReset: string[] = [];
    
    for (const [key, state] of this.rateStates) {
      if (state.device_id === deviceId && 
          (!accountId || state.account_id === accountId) &&
          (!platform || state.platform === platform)) {
        keysToReset.push(key);
      }
    }

    for (const key of keysToReset) {
      this.rateStates.delete(key);
    }

    return keysToReset.length > 0;
  }

  /**
   * 清理过期数据
   */
  cleanup(): void {
    const now = new Date();
    let cleanedCount = 0;

    // 清理过期去重条目
    for (const [key, entry] of this.dedupEntries) {
      if (entry.expires_at <= now) {
        this.dedupEntries.delete(key);
        cleanedCount++;
      }
    }

    // 清理过期熔断状态
    for (const [key, state] of this.rateStates) {
      if (state.circuit_state === 'open' && state.circuit_opened_at) {
        const timeSinceOpened = now.getTime() - state.circuit_opened_at.getTime();
        if (timeSinceOpened >= this.rateConfig.recovery_timeout_ms) {
          state.circuit_state = 'half_open';
          console.log(`[RateControl] Circuit breaker moved to half-open for ${key}`);
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`[RateControl] Cleaned up ${cleanedCount} expired deduplication entries`);
    }
  }

  /**
   * 销毁系统，清理资源
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.rateStates.clear();
    this.dedupEntries.clear();
  }

  // ==================== 私有方法 - 频控检查 ====================

  /**
   * 检查频率限制
   */
  private async checkRateLimit(request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
  }): Promise<{
    can_execute: boolean;
    reason?: string;
    wait_time_ms?: number;
    next_available_time?: Date;
  }> {
    const stateKey = this.getRateStateKey(request.device_id, request.account_id, request.platform);
    const state = this.getRateState(stateKey, request);

    // 检查熔断状态
    if (state.circuit_state === 'open') {
      const waitTime = state.circuit_opened_at ? 
        this.rateConfig.recovery_timeout_ms - (Date.now() - state.circuit_opened_at.getTime()) : 
        this.rateConfig.recovery_timeout_ms;

      return {
        can_execute: false,
        reason: 'Circuit breaker is open',
        wait_time_ms: Math.max(0, waitTime),
        next_available_time: new Date(Date.now() + Math.max(0, waitTime))
      };
    }

    // 检查时间间隔
    const now = new Date();
    if (state.next_available_time > now) {
      const waitTime = state.next_available_time.getTime() - now.getTime();
      return {
        can_execute: false,
        reason: 'Minimum interval not met',
        wait_time_ms: waitTime,
        next_available_time: state.next_available_time
      };
    }

    // 检查小时限制
    const currentHour = now.getHours();
    if (state.last_reset_hour !== currentHour) {
      state.hourly_count = 0;
      state.last_reset_hour = currentHour;
    }

    const hourlyLimit = this.getAdjustedLimit(this.rateConfig.hourly_limit, request.platform, currentHour);
    if (state.hourly_count >= hourlyLimit) {
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0);
      nextHour.setSeconds(0);
      nextHour.setMilliseconds(0);

      return {
        can_execute: false,
        reason: 'Hourly limit exceeded',
        wait_time_ms: nextHour.getTime() - now.getTime(),
        next_available_time: nextHour
      };
    }

    // 检查日限制
    const currentDay = now.getDate();
    if (state.last_reset_day !== currentDay) {
      state.daily_count = 0;
      state.last_reset_day = currentDay;
    }

    const dailyLimit = this.getAdjustedLimit(this.rateConfig.daily_limit, request.platform, currentHour);
    if (state.daily_count >= dailyLimit) {
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0);
      nextDay.setMinutes(0);
      nextDay.setSeconds(0);
      nextDay.setMilliseconds(0);

      return {
        can_execute: false,
        reason: 'Daily limit exceeded',
        wait_time_ms: nextDay.getTime() - now.getTime(),
        next_available_time: nextDay
      };
    }

    return { can_execute: true };
  }

  /**
   * 计算下次执行间隔
   */
  private calculateNextInterval(state: RateControlState, platform: Platform): number {
    let baseInterval = this.rateConfig.min_interval_ms;
    
    // 根据连续失败次数增加间隔
    if (state.consecutive_failures > 0) {
      baseInterval *= Math.pow(2, Math.min(state.consecutive_failures, 5)); // 最多32倍
    }
    
    // 应用平台特定倍数
    const platformConfig = this.rateConfig.platform_specific[platform];
    if (platformConfig) {
      baseInterval *= platformConfig.multiplier;
      
      // 检查是否在高峰时段
      const currentHour = new Date().getHours();
      if (platformConfig.special_limits?.peak_hours?.includes(currentHour)) {
        baseInterval *= (platformConfig.special_limits.peak_multiplier || 2);
      }
    }
    
    // 确保不超过最大间隔
    baseInterval = Math.min(baseInterval, this.rateConfig.max_interval_ms);
    
    // 应用随机抖动
    if (this.rateConfig.jitter_enabled && this.rateConfig.jitter_factor > 0) {
      const jitter = this.generateJitter(baseInterval, this.rateConfig.jitter_factor, this.rateConfig.jitter_type);
      baseInterval += jitter;
    }
    
    return Math.max(baseInterval, this.rateConfig.min_interval_ms);
  }

  /**
   * 生成随机抖动
   */
  private generateJitter(baseInterval: number, factor: number, type: 'uniform' | 'exponential' | 'gaussian'): number {
    const maxJitter = baseInterval * factor;
    
    switch (type) {
      case 'uniform':
        return (Math.random() - 0.5) * 2 * maxJitter; // -maxJitter 到 +maxJitter
      
      case 'exponential':
        return maxJitter * (Math.random() < 0.5 ? -1 : 1) * (1 - Math.exp(-Math.random() * 2));
      
      case 'gaussian':
        // Box-Muller变换生成正态分布
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return (z0 / 3) * maxJitter; // 3σ范围内
      
      default:
        return 0;
    }
  }

  /**
   * 获取调整后的限制
   */
  private getAdjustedLimit(baseLimit: number, platform: Platform, currentHour: number): number {
    const platformConfig = this.rateConfig.platform_specific[platform];
    if (!platformConfig) return baseLimit;
    
    let adjustedLimit = baseLimit * platformConfig.multiplier;
    
    // 检查高峰时段调整
    if (platformConfig.special_limits?.peak_hours?.includes(currentHour)) {
      adjustedLimit *= (platformConfig.special_limits.peak_multiplier || 1);
    }
    
    return Math.floor(adjustedLimit);
  }

  // ==================== 私有方法 - 去重检查 ====================

  /**
   * 检查任务去重
   */
  private async checkDeduplication(request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
    task_type: string;
    target_user_id: string;
    target_video_url?: string;
    content?: string;
  }): Promise<{
    is_unique: boolean;
    reason?: string;
    existing_entry_id?: string;
  }> {
    const fingerprint = this.generateTaskFingerprint(request);
    
    // 精确匹配检查
    for (const entry of this.dedupEntries.values()) {
      if (this.shouldCheckAgainstEntry(entry, request) && entry.fingerprint === fingerprint) {
        return {
          is_unique: false,
          reason: 'Exact match found',
          existing_entry_id: entry.id
        };
      }
    }

    // 模糊匹配检查（如果启用）
    if (this.dedupConfig.fuzzy_matching.enabled) {
      const fuzzyResult = await this.checkFuzzyDuplication(request, fingerprint);
      if (!fuzzyResult.is_unique) {
        return fuzzyResult;
      }
    }

    return { is_unique: true };
  }

  /**
   * 模糊匹配检查
   */
  private async checkFuzzyDuplication(request: any, fingerprint: string): Promise<{
    is_unique: boolean;
    reason?: string;
    existing_entry_id?: string;
  }> {
    const threshold = this.dedupConfig.fuzzy_matching.similarity_threshold;
    
    for (const entry of this.dedupEntries.values()) {
      if (!this.shouldCheckAgainstEntry(entry, request)) continue;
      
      const similarity = this.calculateSimilarity(
        fingerprint, 
        entry.fingerprint, 
        this.dedupConfig.fuzzy_matching.algorithm
      );
      
      if (similarity >= threshold) {
        return {
          is_unique: false,
          reason: `Fuzzy match found (similarity: ${similarity.toFixed(3)})`,
          existing_entry_id: entry.id
        };
      }
    }

    return { is_unique: true };
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(str1: string, str2: string, algorithm: 'levenshtein' | 'cosine' | 'jaccard'): number {
    switch (algorithm) {
      case 'levenshtein':
        return this.levenshteinSimilarity(str1, str2);
      case 'cosine':
        return this.cosineSimilarity(str1, str2);
      case 'jaccard':
        return this.jaccardSimilarity(str1, str2);
      default:
        return 0;
    }
  }

  /**
   * Levenshtein距离相似度
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Levenshtein距离计算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 余弦相似度
   */
  private cosineSimilarity(str1: string, str2: string): number {
    const vector1 = this.getCharVector(str1);
    const vector2 = this.getCharVector(str2);
    
    const dotProduct = this.dotProduct(vector1, vector2);
    const magnitude1 = this.magnitude(vector1);
    const magnitude2 = this.magnitude(vector2);
    
    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  /**
   * Jaccard相似度
   */
  private jaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size === 0 ? 1 : intersection.size / union.size;
  }

  // ==================== 私有方法 - 工具函数 ====================

  /**
   * 生成任务指纹
   */
  private generateTaskFingerprint(request: {
    task_type: string;
    target_user_id: string;
    target_video_url?: string;
    content?: string;
  }): string {
    const parts: string[] = [];
    
    for (const field of this.dedupConfig.dedup_fields) {
      if (request[field]) {
        parts.push(`${field}:${request[field]}`);
      }
    }
    
    return parts.join('|');
  }

  /**
   * 检查是否应该与某个条目比较
   */
  private shouldCheckAgainstEntry(entry: DeduplicationEntry, request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
  }): boolean {
    // 检查平台
    if (entry.platform !== request.platform) return false;
    
    // 根据去重范围检查
    switch (this.dedupConfig.scope) {
      case 'device':
        return entry.device_id === request.device_id;
      case 'account':
        return entry.account_id === request.account_id;
      case 'global':
        return true;
      default:
        return false;
    }
  }

  /**
   * 记录去重条目
   */
  private async recordDeduplicationEntry(request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
    task_type: string;
    target_user_id: string;
    target_video_url?: string;
    content?: string;
  }): Promise<void> {
    const id = `${request.device_id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const fingerprint = this.generateTaskFingerprint(request);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.dedupConfig.time_window_hours * 60 * 60 * 1000);

    const entry: DeduplicationEntry = {
      id,
      fingerprint,
      device_id: request.device_id,
      account_id: request.account_id,
      platform: request.platform,
      task_type: request.task_type,
      target_user_id: request.target_user_id,
      target_video_url: request.target_video_url,
      content: request.content,
      created_at: now,
      expires_at: expiresAt
    };

    this.dedupEntries.set(id, entry);

    // 检查是否超出最大条目数
    if (this.dedupEntries.size > this.dedupConfig.max_entries) {
      this.cleanupOldestEntries();
    }
  }

  /**
   * 清理最老的条目
   */
  private cleanupOldestEntries(): void {
    const entries = Array.from(this.dedupEntries.entries()).sort(
      ([, a], [, b]) => a.created_at.getTime() - b.created_at.getTime()
    );

    const excessCount = entries.length - this.dedupConfig.max_entries;
    for (let i = 0; i < excessCount; i++) {
      this.dedupEntries.delete(entries[i][0]);
    }
  }

  /**
   * 获取频控状态键
   */
  private getRateStateKey(deviceId: string, accountId?: string, platform?: Platform): string {
    return `${deviceId}_${accountId || 'no_account'}_${platform || 'no_platform'}`;
  }

  /**
   * 获取或创建频控状态
   */
  private getRateState(key: string, request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
  }): RateControlState {
    let state = this.rateStates.get(key);
    
    if (!state) {
      const now = new Date();
      state = {
        device_id: request.device_id,
        account_id: request.account_id,
        platform: request.platform,
        hourly_count: 0,
        daily_count: 0,
        last_reset_hour: now.getHours(),
        last_reset_day: now.getDate(),
        last_execution_time: new Date(0),
        next_available_time: new Date(0),
        circuit_state: 'closed',
        consecutive_failures: 0,
        total_executions: 0,
        total_failures: 0,
        average_interval_ms: 0
      };
      
      this.rateStates.set(key, state);
    }
    
    return state;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    const intervalMs = this.dedupConfig.cleanup_interval_hours * 60 * 60 * 1000;
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * 字符向量化（用于余弦相似度）
   */
  private getCharVector(str: string): Record<string, number> {
    const vector: Record<string, number> = {};
    for (const char of str) {
      vector[char] = (vector[char] || 0) + 1;
    }
    return vector;
  }

  /**
   * 向量点积
   */
  private dotProduct(v1: Record<string, number>, v2: Record<string, number>): number {
    let product = 0;
    for (const key of Object.keys(v1)) {
      if (v2[key]) {
        product += v1[key] * v2[key];
      }
    }
    return product;
  }

  /**
   * 向量模长
   */
  private magnitude(vector: Record<string, number>): number {
    let sum = 0;
    for (const value of Object.values(vector)) {
      sum += value * value;
    }
    return Math.sqrt(sum);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建频控和去重系统实例
 */
export function createRateControlAndDeduplicationSystem(
  rateConfig: RateControlConfig,
  dedupConfig: DeduplicationConfig
): RateControlAndDeduplicationSystem {
  return new RateControlAndDeduplicationSystem(rateConfig, dedupConfig);
}

/**
 * 获取默认频控配置
 */
export function getDefaultRateControlConfig(): RateControlConfig {
  return {
    hourly_limit: 50,
    daily_limit: 500,
    min_interval_ms: 30000,      // 30秒
    max_interval_ms: 300000,     // 5分钟
    jitter_enabled: true,
    jitter_factor: 0.3,
    jitter_type: 'uniform',
    circuit_breaker_enabled: true,
    failure_threshold: 5,
    recovery_timeout_ms: 600000, // 10分钟
    partial_recovery_threshold: 0.5,
    platform_specific: {
      [Platform.DOUYIN]: {
        multiplier: 1.0,
        special_limits: {
          peak_hours: [19, 20, 21], // 晚高峰
          peak_multiplier: 0.7      // 高峰时段降低频率
        }
      },
      [Platform.OCEANENGINE]: {
        multiplier: 1.5            // API可以稍快一些
      },
      [Platform.PUBLIC]: {
        multiplier: 0.5,           // 公开源更保守
        special_limits: {
          peak_hours: [9, 10, 11, 14, 15, 16], // 工作时间
          peak_multiplier: 0.8
        }
      },
      [Platform.XIAOHONGSHU]: {
        multiplier: 1.2,           // 小红书API适中频率
        special_limits: {
          peak_hours: [20, 21, 22], // 晚高峰
          peak_multiplier: 0.8
        }
      }
    }
  };
}

/**
 * 获取默认去重配置
 */
export function getDefaultDeduplicationConfig(): DeduplicationConfig {
  return {
    scope: 'device',
    time_window_hours: 24,
    dedup_fields: ['target_user_id', 'task_type'],
    storage_type: 'memory',
    max_entries: 10000,
    cleanup_interval_hours: 1,
    fuzzy_matching: {
      enabled: true,
      similarity_threshold: 0.85,
      algorithm: 'levenshtein'
    }
  };
}