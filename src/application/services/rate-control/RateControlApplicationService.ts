/**
 * 频控管理应用服务
 * 
 * 提供频控和去重系统的应用层封装，整合配置管理、监控统计、预设方案等功能
 */

import { 
  RateControlAndDeduplicationSystem, 
  RateControlConfig, 
  DeduplicationConfig, 
  RateControlState,
  getDefaultRateControlConfig,
  getDefaultDeduplicationConfig,
  createRateControlAndDeduplicationSystem
} from './RateControlAndDeduplicationSystem';
import { Platform } from '../../../constants/precise-acquisition-enums';

// ==================== 预设配置方案 ====================

export interface RateControlPreset {
  id: string;
  name: string;
  description: string;
  rate_config: RateControlConfig;
  dedup_config: DeduplicationConfig;
  use_case: string[];
  risk_level: 'low' | 'medium' | 'high';
}

// ==================== 监控和统计接口 ====================

export interface RateControlMetrics {
  // 执行统计
  total_requests: number;
  accepted_requests: number;
  rejected_requests: number;
  acceptance_rate: number;
  
  // 拒绝原因统计
  rejections_by_reason: Record<string, number>;
  
  // 时间分布
  requests_by_hour: Record<number, number>;
  requests_by_platform: Record<Platform, number>;
  
  // 性能指标
  average_wait_time_ms: number;
  max_wait_time_ms: number;
  circuit_breakers_triggered: number;
  
  // 去重统计
  duplicate_detections: number;
  fuzzy_matches: number;
  exact_matches: number;
  
  // 系统健康度
  system_health_score: number; // 0-1
  last_updated: Date;
}

export interface DeviceRateControlSummary {
  device_id: string;
  account_id?: string;
  platforms: Platform[];
  
  // 当前状态
  is_healthy: boolean;
  circuit_breakers_open: number;
  total_daily_executions: number;
  
  // 预测信息
  estimated_daily_capacity: number;
  next_available_slots: Record<Platform, Date>;
  
  // 历史表现
  success_rate_24h: number;
  average_interval_ms: number;
  peak_usage_hour: number;
}

// ==================== 频控管理应用服务 ====================

export class RateControlApplicationService {
  private system: RateControlAndDeduplicationSystem;
  private currentPreset: RateControlPreset;
  private metrics: RateControlMetrics;
  private isActive: boolean = false;

  constructor(preset?: RateControlPreset) {
    this.currentPreset = preset || this.getConservativePreset();
    this.system = createRateControlAndDeduplicationSystem(
      this.currentPreset.rate_config,
      this.currentPreset.dedup_config
    );
    this.metrics = this.initializeMetrics();
  }

  /**
   * 启动频控系统
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('[RateControlApp] System is already active');
      return;
    }

    this.isActive = true;
    console.log(`[RateControlApp] Started with preset: ${this.currentPreset.name}`);
  }

  /**
   * 停止频控系统
   */
  async stop(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.system.destroy();
    console.log('[RateControlApp] Stopped');
  }

  /**
   * 检查任务执行权限
   */
  async checkTaskPermission(request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
    task_type: string;
    target_user_id: string;
    target_video_url?: string;
    content?: string;
  }): Promise<{
    permitted: boolean;
    reason?: string;
    wait_time_ms?: number;
    next_available_time?: Date;
    estimated_queue_position?: number;
  }> {
    if (!this.isActive) {
      return {
        permitted: false,
        reason: 'Rate control system is not active'
      };
    }

    // 更新指标
    this.metrics.total_requests++;

    const result = await this.system.canExecuteTask(request);

    if (!result.can_execute) {
      this.metrics.rejected_requests++;
      this.updateRejectionStats(result.reason || 'Unknown');
      
      if (result.wait_time_ms) {
        this.metrics.average_wait_time_ms = (
          this.metrics.average_wait_time_ms * (this.metrics.rejected_requests - 1) + result.wait_time_ms
        ) / this.metrics.rejected_requests;
        
        this.metrics.max_wait_time_ms = Math.max(this.metrics.max_wait_time_ms, result.wait_time_ms);
      }

      return {
        permitted: false,
        reason: result.reason,
        wait_time_ms: result.wait_time_ms,
        next_available_time: result.next_available_time
      };
    }

    this.metrics.accepted_requests++;
    this.updateAcceptanceStats(request);

    return { permitted: true };
  }

  /**
   * 记录任务执行结果
   */
  async recordTaskResult(request: {
    device_id: string;
    account_id?: string;
    platform: Platform;
    task_type: string;
    target_user_id: string;
    target_video_url?: string;
    content?: string;
    success: boolean;
    execution_time_ms: number;
    error?: Error;
  }): Promise<void> {
    if (!this.isActive) return;

    await this.system.recordTaskExecution(request);

    // 更新监控指标
    this.updateExecutionMetrics(request);
  }

  /**
   * 获取设备频控摘要
   */
  getDeviceRateControlSummary(deviceId: string, accountId?: string): DeviceRateControlSummary[] {
    const states = this.system.getRateControlStatus(deviceId, accountId);
    const summaries: DeviceRateControlSummary[] = [];

    // 按设备+账户分组
    const deviceGroups = new Map<string, RateControlState[]>();
    for (const state of states) {
      const key = `${state.device_id}_${state.account_id || 'no_account'}`;
      if (!deviceGroups.has(key)) {
        deviceGroups.set(key, []);
      }
      deviceGroups.get(key)!.push(state);
    }

    for (const [key, deviceStates] of deviceGroups) {
      const firstState = deviceStates[0];
      const platforms = deviceStates.map(s => s.platform);
      
      const summary: DeviceRateControlSummary = {
        device_id: firstState.device_id,
        account_id: firstState.account_id,
        platforms,
        is_healthy: deviceStates.every(s => s.circuit_state === 'closed'),
        circuit_breakers_open: deviceStates.filter(s => s.circuit_state === 'open').length,
        total_daily_executions: deviceStates.reduce((sum, s) => sum + s.daily_count, 0),
        estimated_daily_capacity: this.calculateDailyCapacity(deviceStates),
        next_available_slots: this.calculateNextAvailableSlots(deviceStates),
        success_rate_24h: this.calculateSuccessRate(deviceStates),
        average_interval_ms: deviceStates.reduce((sum, s) => sum + s.average_interval_ms, 0) / deviceStates.length,
        peak_usage_hour: this.findPeakUsageHour(deviceStates)
      };

      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * 获取系统监控指标
   */
  getMetrics(): RateControlMetrics {
    this.updateSystemHealthScore();
    this.metrics.last_updated = new Date();
    return { ...this.metrics };
  }

  /**
   * 获取去重统计
   */
  getDeduplicationStats() {
    return this.system.getDeduplicationStats();
  }

  /**
   * 重置设备频控状态
   */
  resetDeviceRateControl(deviceId: string, accountId?: string, platform?: Platform): boolean {
    const result = this.system.resetRateControlState(deviceId, accountId, platform);
    
    if (result) {
      console.log(`[RateControlApp] Reset rate control for device ${deviceId}`);
    }
    
    return result;
  }

  /**
   * 切换预设配置
   */
  async switchPreset(preset: RateControlPreset): Promise<void> {
    console.log(`[RateControlApp] Switching from ${this.currentPreset.name} to ${preset.name}`);
    
    // 停止当前系统
    const wasActive = this.isActive;
    if (wasActive) {
      await this.stop();
    }

    // 创建新系统
    this.currentPreset = preset;
    this.system = createRateControlAndDeduplicationSystem(
      preset.rate_config,
      preset.dedup_config
    );

    // 如果之前是活跃的，重新启动
    if (wasActive) {
      await this.start();
    }
  }

  /**
   * 获取当前预设
   */
  getCurrentPreset(): RateControlPreset {
    return { ...this.currentPreset };
  }

  /**
   * 获取所有可用预设
   */
  getAvailablePresets(): RateControlPreset[] {
    return [
      this.getConservativePreset(),
      this.getBalancedPreset(),
      this.getAggressivePreset(),
      this.getDebugPreset()
    ];
  }

  // ==================== 私有方法 - 预设配置 ====================

  /**
   * 获取保守预设（默认）
   */
  private getConservativePreset(): RateControlPreset {
    return {
      id: 'conservative',
      name: '保守模式',
      description: '最安全的频控策略，适合长期稳定运行',
      rate_config: {
        ...getDefaultRateControlConfig(),
        hourly_limit: 30,
        daily_limit: 300,
        min_interval_ms: 60000,  // 1分钟
        max_interval_ms: 600000, // 10分钟
        jitter_factor: 0.5,      // 更大的随机性
        failure_threshold: 3,    // 更敏感的熔断
        platform_specific: {
          [Platform.DOUYIN]: {
            multiplier: 0.8,
            special_limits: {
              peak_hours: [19, 20, 21, 22],
              peak_multiplier: 0.5
            }
          },
          [Platform.OCEANENGINE]: {
            multiplier: 1.0
          },
          [Platform.PUBLIC]: {
            multiplier: 0.3,
            special_limits: {
              peak_hours: [9, 10, 11, 14, 15, 16, 19, 20, 21],
              peak_multiplier: 0.6
            }
          },
          [Platform.XIAOHONGSHU]: {
            multiplier: 0.9,
            special_limits: {
              peak_hours: [20, 21, 22],
              peak_multiplier: 0.7
            }
          }
        }
      },
      dedup_config: {
        ...getDefaultDeduplicationConfig(),
        time_window_hours: 48,   // 48小时去重窗口
        fuzzy_matching: {
          enabled: true,
          similarity_threshold: 0.9, // 更严格的相似度
          algorithm: 'levenshtein'
        }
      },
      use_case: ['长期运行', '大规模部署', '高风险平台'],
      risk_level: 'low'
    };
  }

  /**
   * 获取平衡预设
   */
  private getBalancedPreset(): RateControlPreset {
    return {
      id: 'balanced',
      name: '平衡模式',
      description: '效率与安全的平衡，适合日常使用',
      rate_config: getDefaultRateControlConfig(),
      dedup_config: getDefaultDeduplicationConfig(),
      use_case: ['日常运营', '中等规模', '标准任务'],
      risk_level: 'medium'
    };
  }

  /**
   * 获取激进预设
   */
  private getAggressivePreset(): RateControlPreset {
    return {
      id: 'aggressive',
      name: '激进模式',
      description: '追求最大效率，适合短期冲刺',
      rate_config: {
        ...getDefaultRateControlConfig(),
        hourly_limit: 80,
        daily_limit: 800,
        min_interval_ms: 15000,  // 15秒
        max_interval_ms: 120000, // 2分钟
        jitter_factor: 0.2,      // 较小的随机性
        failure_threshold: 8,    // 更宽松的熔断
        platform_specific: {
          [Platform.DOUYIN]: {
            multiplier: 1.2,
            special_limits: {
              peak_hours: [19, 20, 21],
              peak_multiplier: 0.9
            }
          },
          [Platform.OCEANENGINE]: {
            multiplier: 2.0
          },
          [Platform.PUBLIC]: {
            multiplier: 0.8,
            special_limits: {
              peak_hours: [12, 13, 19, 20, 21],
              peak_multiplier: 0.8
            }
          },
          [Platform.XIAOHONGSHU]: {
            multiplier: 1.5,
            special_limits: {
              peak_hours: [20, 21, 22],
              peak_multiplier: 0.9
            }
          }
        }
      },
      dedup_config: {
        ...getDefaultDeduplicationConfig(),
        time_window_hours: 12,   // 12小时去重窗口
        fuzzy_matching: {
          enabled: true,
          similarity_threshold: 0.7, // 较宽松的相似度
          algorithm: 'jaccard'
        }
      },
      use_case: ['短期冲刺', '紧急任务', '测试环境'],
      risk_level: 'high'
    };
  }

  /**
   * 获取调试预设
   */
  private getDebugPreset(): RateControlPreset {
    return {
      id: 'debug',
      name: '调试模式',
      description: '开发和测试专用，最小限制',
      rate_config: {
        ...getDefaultRateControlConfig(),
        hourly_limit: 1000,
        daily_limit: 10000,
        min_interval_ms: 1000,   // 1秒
        max_interval_ms: 5000,   // 5秒
        jitter_enabled: false,   // 关闭随机性
        circuit_breaker_enabled: false, // 关闭熔断
        failure_threshold: 1000,
        platform_specific: {
          [Platform.DOUYIN]: { multiplier: 10.0 },
          [Platform.OCEANENGINE]: { multiplier: 10.0 },
          [Platform.PUBLIC]: { multiplier: 10.0 },
          [Platform.XIAOHONGSHU]: { multiplier: 10.0 }
        }
      },
      dedup_config: {
        ...getDefaultDeduplicationConfig(),
        time_window_hours: 1,    // 1小时去重窗口
        fuzzy_matching: {
          enabled: false,        // 关闭模糊匹配
          similarity_threshold: 0.5,
          algorithm: 'levenshtein'
        }
      },
      use_case: ['开发调试', '功能测试', '性能测试'],
      risk_level: 'high'
    };
  }

  // ==================== 私有方法 - 指标计算 ====================

  /**
   * 初始化监控指标
   */
  private initializeMetrics(): RateControlMetrics {
    return {
      total_requests: 0,
      accepted_requests: 0,
      rejected_requests: 0,
      acceptance_rate: 0,
      rejections_by_reason: {},
      requests_by_hour: {},
      requests_by_platform: {
        [Platform.DOUYIN]: 0,
        [Platform.OCEANENGINE]: 0,
        [Platform.PUBLIC]: 0,
        [Platform.XIAOHONGSHU]: 0
      },
      average_wait_time_ms: 0,
      max_wait_time_ms: 0,
      circuit_breakers_triggered: 0,
      duplicate_detections: 0,
      fuzzy_matches: 0,
      exact_matches: 0,
      system_health_score: 1.0,
      last_updated: new Date()
    };
  }

  /**
   * 更新拒绝统计
   */
  private updateRejectionStats(reason: string): void {
    this.metrics.rejections_by_reason[reason] = (this.metrics.rejections_by_reason[reason] || 0) + 1;
    
    if (reason.includes('duplicate')) {
      this.metrics.duplicate_detections++;
      if (reason.includes('Fuzzy')) {
        this.metrics.fuzzy_matches++;
      } else {
        this.metrics.exact_matches++;
      }
    } else if (reason.includes('Circuit breaker')) {
      this.metrics.circuit_breakers_triggered++;
    }
  }

  /**
   * 更新接受统计
   */
  private updateAcceptanceStats(request: { platform: Platform }): void {
    const hour = new Date().getHours();
    this.metrics.requests_by_hour[hour] = (this.metrics.requests_by_hour[hour] || 0) + 1;
    this.metrics.requests_by_platform[request.platform] = (this.metrics.requests_by_platform[request.platform] || 0) + 1;
    
    // 更新接受率
    if (this.metrics.total_requests > 0) {
      this.metrics.acceptance_rate = this.metrics.accepted_requests / this.metrics.total_requests;
    }
  }

  /**
   * 更新执行指标
   */
  private updateExecutionMetrics(request: { success: boolean; execution_time_ms: number }): void {
    // 这里可以添加更多的执行相关指标
  }

  /**
   * 计算日容量
   */
  private calculateDailyCapacity(states: RateControlState[]): number {
    return states.reduce((sum, state) => {
      const config = this.currentPreset.rate_config;
      const platformConfig = config.platform_specific[state.platform];
      const baseLimit = config.daily_limit * (platformConfig?.multiplier || 1);
      return sum + baseLimit;
    }, 0);
  }

  /**
   * 计算下次可用时间槽
   */
  private calculateNextAvailableSlots(states: RateControlState[]): Record<Platform, Date> {
    const slots: Record<Platform, Date> = {} as Record<Platform, Date>;
    
    for (const state of states) {
      slots[state.platform] = state.next_available_time;
    }
    
    return slots;
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(states: RateControlState[]): number {
    let totalExecutions = 0;
    let totalFailures = 0;
    
    for (const state of states) {
      totalExecutions += state.total_executions;
      totalFailures += state.total_failures;
    }
    
    return totalExecutions > 0 ? (totalExecutions - totalFailures) / totalExecutions : 1;
  }

  /**
   * 找到峰值使用时间
   */
  private findPeakUsageHour(states: RateControlState[]): number {
    // 这里需要基于历史数据计算，暂时返回默认值
    return 20; // 晚上8点作为默认峰值时间
  }

  /**
   * 更新系统健康度评分
   */
  private updateSystemHealthScore(): void {
    let score = 1.0;
    
    // 基于接受率调整
    if (this.metrics.acceptance_rate < 0.8) {
      score -= (0.8 - this.metrics.acceptance_rate) * 0.5;
    }
    
    // 基于熔断器触发次数调整
    if (this.metrics.circuit_breakers_triggered > 0) {
      score -= Math.min(this.metrics.circuit_breakers_triggered * 0.1, 0.3);
    }
    
    // 基于平均等待时间调整
    if (this.metrics.average_wait_time_ms > 60000) { // 超过1分钟
      score -= Math.min((this.metrics.average_wait_time_ms - 60000) / 300000, 0.2); // 最多扣除0.2
    }
    
    this.metrics.system_health_score = Math.max(0, Math.min(1, score));
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建频控应用服务实例
 */
export function createRateControlApplicationService(preset?: RateControlPreset): RateControlApplicationService {
  return new RateControlApplicationService(preset);
}