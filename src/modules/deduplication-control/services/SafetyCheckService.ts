/**
 * 安全检查服务
 * 
 * 统一的安全检查门面，整合去重、频控、熔断器等所有安全机制
 */
import { 
  DeduplicationConfig,
  RateLimitConfig,
  CircuitBreakerConfig,
  SafetyCheckRequest,
  SafetyCheckResult,
  SafetyStatistics,
  WhitelistConfig,
  BlacklistConfig
} from '../types';

import { DeduplicationService } from './DeduplicationService';
import { RateLimitService } from './RateLimitService';
import { CircuitBreakerService } from './CircuitBreakerService';

/**
 * 白名单和黑名单服务
 */
export class ListManagementService {
  /**
   * 检查是否在白名单中
   */
  static checkWhitelist(
    request: SafetyCheckRequest,
    whitelist: WhitelistConfig
  ): { isWhitelisted: boolean; reason?: string } {
    // 检查用户白名单
    const userWhitelisted = whitelist.users.some(user => 
      user.userId === request.targetUserId && 
      user.platform === request.platform
    );
    
    if (userWhitelisted) {
      return { isWhitelisted: true, reason: '用户在白名单中' };
    }
    
    // 检查内容白名单（关键词）
    if (request.content) {
      const keywordWhitelisted = whitelist.keywords.some(keyword => 
        request.content!.includes(keyword.keyword) &&
        (!keyword.platform || keyword.platform === request.platform)
      );
      
      if (keywordWhitelisted) {
        return { isWhitelisted: true, reason: '内容包含白名单关键词' };
      }
    }
    
    // 检查时间段白名单
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const timeWhitelisted = whitelist.timeSlots.some(slot => {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      const [currentHour, currentMin] = currentTime.split(':').map(Number);
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      const current = currentHour * 60 + currentMin;
      
      if (startTime > endTime) { // 跨天
        return current >= startTime || current <= endTime;
      } else {
        return current >= startTime && current <= endTime;
      }
    });
    
    if (timeWhitelisted) {
      return { isWhitelisted: true, reason: '当前时间在白名单时间段内' };
    }
    
    return { isWhitelisted: false };
  }
  
  /**
   * 检查是否在黑名单中
   */
  static checkBlacklist(
    request: SafetyCheckRequest,
    blacklist: BlacklistConfig
  ): { isBlacklisted: boolean; reason?: string } {
    // 检查用户黑名单
    const userBlacklisted = blacklist.users.some(user => 
      user.userId === request.targetUserId && 
      user.platform === request.platform &&
      (!user.expiresAt || user.expiresAt > new Date())
    );
    
    if (userBlacklisted) {
      return { isBlacklisted: true, reason: '用户在黑名单中' };
    }
    
    // 检查内容黑名单（关键词）
    if (request.content) {
      const keywordBlacklisted = blacklist.keywords.some(keyword => 
        request.content!.includes(keyword.keyword) &&
        (!keyword.platform || keyword.platform === request.platform)
      );
      
      if (keywordBlacklisted) {
        return { isBlacklisted: true, reason: '内容包含黑名单关键词' };
      }
    }
    
    return { isBlacklisted: false };
  }
}

/**
 * 风险评估服务
 */
export class RiskAssessmentService {
  /**
   * 计算综合风险评分 (0-100)
   */
  static calculateRiskScore(
    deduplicationResult: any,
    rateLimitResult: any,
    circuitBreakerStatus: any,
    request: SafetyCheckRequest
  ): number {
    let riskScore = 0;
    
    // 去重风险评分 (0-40分)
    if (!deduplicationResult.allowed) {
      const strategies = deduplicationResult.triggeredStrategies.length;
      riskScore += Math.min(40, strategies * 10);
    }
    
    // 频控风险评分 (0-30分)
    if (!rateLimitResult.allowed) {
      const types = rateLimitResult.triggeredTypes.length;
      riskScore += Math.min(30, types * 10);
      
      // 如果剩余配额很少，增加风险
      const dailyUsageRatio = rateLimitResult.remainingQuota.daily / 
        (rateLimitResult.currentUsage.daily + rateLimitResult.remainingQuota.daily);
      if (dailyUsageRatio < 0.1) { // 剩余配额少于10%
        riskScore += 10;
      }
    }
    
    // 熔断器风险评分 (0-30分)
    switch (circuitBreakerStatus.state) {
      case 'open':
        riskScore += 30;
        break;
      case 'half_open':
        riskScore += 15;
        break;
      case 'closed':
        // 基于失败率评分
        riskScore += Math.min(15, circuitBreakerStatus.failureRate * 100);
        break;
    }
    
    // 时间风险评分 (高峰期增加风险)
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 8 && hour <= 22) { // 白天时间风险更高
      riskScore += 5;
    }
    
    return Math.min(100, Math.max(0, riskScore));
  }
  
  /**
   * 生成风险评估报告
   */
  static generateRiskReport(riskScore: number): {
    level: 'low' | 'medium' | 'high';
    description: string;
    recommendations: string[];
  } {
    if (riskScore <= 30) {
      return {
        level: 'low',
        description: '风险等级较低，可以正常执行操作',
        recommendations: [
          '保持当前操作频率',
          '继续监控系统状态'
        ]
      };
    } else if (riskScore <= 70) {
      return {
        level: 'medium',
        description: '风险等级中等，建议谨慎执行',
        recommendations: [
          '适当降低操作频率',
          '检查网络连接状态',
          '关注系统反馈'
        ]
      };
    } else {
      return {
        level: 'high',
        description: '风险等级较高，建议暂停操作',
        recommendations: [
          '暂停当前操作',
          '等待系统恢复',
          '检查账号和设备状态',
          '考虑手动干预'
        ]
      };
    }
  }
}

/**
 * 主安全检查服务
 */
export class SafetyCheckService {
  private deduplicationService: DeduplicationService;
  private rateLimitService: RateLimitService;
  private circuitBreakerService: CircuitBreakerService;
  private whitelist?: WhitelistConfig;
  private blacklist?: BlacklistConfig;
  
  constructor(
    deduplicationConfig: DeduplicationConfig,
    rateLimitConfig: RateLimitConfig,
    circuitBreakerConfig: CircuitBreakerConfig,
    whitelist?: WhitelistConfig,
    blacklist?: BlacklistConfig
  ) {
    this.deduplicationService = new DeduplicationService(deduplicationConfig);
    this.rateLimitService = new RateLimitService(rateLimitConfig);
    this.circuitBreakerService = new CircuitBreakerService(circuitBreakerConfig);
    this.whitelist = whitelist;
    this.blacklist = blacklist;
  }
  
  /**
   * 执行完整的安全检查
   */
  async performSafetyCheck(request: SafetyCheckRequest): Promise<SafetyCheckResult> {
    const checkTime = new Date();
    
    // 1. 黑名单检查（优先级最高）
    if (this.blacklist) {
      const blacklistCheck = ListManagementService.checkBlacklist(request, this.blacklist);
      if (blacklistCheck.isBlacklisted) {
        return this.createBlockedResult(
          'blacklist',
          blacklistCheck.reason || '在黑名单中',
          checkTime
        );
      }
    }
    
    // 2. 白名单检查（跳过其他检查）
    if (this.whitelist) {
      const whitelistCheck = ListManagementService.checkWhitelist(request, this.whitelist);
      if (whitelistCheck.isWhitelisted) {
        return this.createAllowedResult(
          whitelistCheck.reason || '在白名单中',
          checkTime
        );
      }
    }
    
    // 3. 并行执行各项安全检查
    const [deduplicationResult, rateLimitResult, circuitBreakerResult] = await Promise.all([
      this.deduplicationService.performDeduplicationCheck(request),
      this.rateLimitService.performRateLimitCheck(request),
      this.circuitBreakerService.checkCircuitBreaker(request)
    ]);
    
    // 4. 综合判断是否允许
    const allowed = deduplicationResult.allowed && 
                   rateLimitResult.allowed && 
                   circuitBreakerResult.allowed;
    
    // 5. 计算风险评分
    const riskScore = RiskAssessmentService.calculateRiskScore(
      deduplicationResult,
      rateLimitResult,
      circuitBreakerResult.status,
      request
    );
    
    // 6. 生成建议
    const recommendations = this.generateRecommendations(
      deduplicationResult,
      rateLimitResult,
      circuitBreakerResult,
      riskScore
    );
    
    return {
      allowed,
      deduplication: deduplicationResult,
      rateLimit: rateLimitResult,
      circuitBreaker: circuitBreakerResult.status,
      riskScore,
      recommendations,
      checkTime
    };
  }
  
  /**
   * 记录成功的操作
   */
  async recordSuccessfulOperation(request: SafetyCheckRequest): Promise<void> {
    await Promise.all([
      this.deduplicationService.recordSuccessfulInteraction(request),
      this.rateLimitService.recordSuccessfulOperation(request),
      this.circuitBreakerService.recordSuccess(request)
    ]);
  }
  
  /**
   * 记录失败的操作
   */
  async recordFailedOperation(
    request: SafetyCheckRequest,
    errorMessage?: string
  ): Promise<void> {
    await this.circuitBreakerService.recordFailure(request, errorMessage);
  }
  
  /**
   * 获取安全统计信息
   */
  async getSafetyStatistics(
    accountId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<SafetyStatistics> {
    // 这里应该调用后端获取统计数据
    // 暂时返回模拟数据
    return {
      timeRange,
      totalChecks: 0,
      passedChecks: 0,
      blockedChecks: 0,
      blockReasons: {
        deduplication: 0,
        rateLimit: 0,
        circuitBreaker: 0
      },
      hourlyStats: [],
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0
      }
    };
  }
  
  /**
   * 创建被阻止的结果
   */
  private createBlockedResult(
    reason: string,
    message: string,
    checkTime: Date
  ): SafetyCheckResult {
    return {
      allowed: false,
      deduplication: {
        allowed: false,
        triggeredStrategies: [],
        duplicates: [],
        suggestions: []
      },
      rateLimit: {
        allowed: false,
        triggeredTypes: [],
        currentUsage: { hourly: 0, daily: 0, weekly: 0, monthly: 0 },
        remainingQuota: { hourly: 0, daily: 0, weekly: 0, monthly: 0 },
        reason: message
      },
      circuitBreaker: {
        state: 'closed' as any,
        failureCount: 0,
        successCount: 0,
        failureRate: 0,
        stateHistory: []
      },
      riskScore: 100,
      recommendations: [
        {
          type: 'skip',
          message
        }
      ],
      checkTime
    };
  }
  
  /**
   * 创建允许的结果
   */
  private createAllowedResult(
    reason: string,
    checkTime: Date
  ): SafetyCheckResult {
    return {
      allowed: true,
      deduplication: {
        allowed: true,
        triggeredStrategies: [],
        duplicates: [],
        suggestions: []
      },
      rateLimit: {
        allowed: true,
        triggeredTypes: [],
        currentUsage: { hourly: 0, daily: 0, weekly: 0, monthly: 0 },
        remainingQuota: { hourly: 999, daily: 999, weekly: 999, monthly: 999 }
      },
      circuitBreaker: {
        state: 'closed' as any,
        failureCount: 0,
        successCount: 0,
        failureRate: 0,
        stateHistory: []
      },
      riskScore: 0,
      recommendations: [
        {
          type: 'retry',
          message: reason
        }
      ],
      checkTime
    };
  }
  
  /**
   * 生成操作建议
   */
  private generateRecommendations(
    deduplicationResult: any,
    rateLimitResult: any,
    circuitBreakerResult: any,
    riskScore: number
  ): Array<{
    type: 'wait' | 'skip' | 'retry' | 'manual_review';
    message: string;
    waitTime?: number;
  }> {
    const recommendations: Array<{
      type: 'wait' | 'skip' | 'retry' | 'manual_review';
      message: string;
      waitTime?: number;
    }> = [];
    
    // 去重建议
    if (!deduplicationResult.allowed) {
      recommendations.push({
        type: 'skip',
        message: '检测到重复操作，建议跳过或修改内容'
      });
    }
    
    // 频控建议
    if (!rateLimitResult.allowed) {
      if (rateLimitResult.waitTimeSeconds) {
        recommendations.push({
          type: 'wait',
          message: `操作频率过高，建议等待 ${rateLimitResult.waitTimeSeconds} 秒`,
          waitTime: rateLimitResult.waitTimeSeconds
        });
      } else {
        recommendations.push({
          type: 'skip',
          message: '已达到频率限制，建议稍后重试'
        });
      }
    }
    
    // 熔断器建议
    if (!circuitBreakerResult.allowed) {
      if (circuitBreakerResult.status.state === 'open') {
        recommendations.push({
          type: 'manual_review',
          message: '系统已熔断，需要手动检查和恢复'
        });
      } else {
        recommendations.push({
          type: 'wait',
          message: '系统不稳定，建议等待恢复',
          waitTime: 300 // 5分钟
        });
      }
    }
    
    // 风险评分建议
    const riskReport = RiskAssessmentService.generateRiskReport(riskScore);
    if (riskReport.level === 'high') {
      recommendations.push({
        type: 'manual_review',
        message: '风险等级过高，建议人工审核'
      });
    } else if (riskReport.level === 'medium') {
      recommendations.push({
        type: 'wait',
        message: '风险等级中等，建议降低操作频率',
        waitTime: 120 // 2分钟
      });
    }
    
    // 如果没有其他建议且允许执行
    if (recommendations.length === 0 && 
        deduplicationResult.allowed && 
        rateLimitResult.allowed && 
        circuitBreakerResult.allowed) {
      recommendations.push({
        type: 'retry',
        message: '安全检查通过，可以执行操作'
      });
    }
    
    return recommendations;
  }
}