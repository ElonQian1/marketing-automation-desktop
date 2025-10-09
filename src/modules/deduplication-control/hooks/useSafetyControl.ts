/**
 * 查重频控管理Hook
 * 
 * 提供查重频控配置管理、安全检查和统计功能
 */
import { useState, useCallback, useEffect } from 'react';
import { 
  DeduplicationConfig,
  RateLimitConfig,
  CircuitBreakerConfig,
  SafetyCheckRequest,
  SafetyCheckResult,
  SafetyStatistics,
  WhitelistConfig,
  BlacklistConfig,
  SafetyRule,
  DeduplicationStrategy,
  RateLimitType,
  CircuitBreakerState
} from '../types';
import { SafetyCheckService } from '../services';

/**
 * 默认配置
 */
const defaultDeduplicationConfig: DeduplicationConfig = {
  strategies: [
    DeduplicationStrategy.COMMENT_LEVEL,
    DeduplicationStrategy.USER_LEVEL,
    DeduplicationStrategy.CONTENT_LEVEL
  ],
  commentLevel: {
    enabled: true,
    similarityThreshold: 0.8,
    timeWindowHours: 24
  },
  userLevel: {
    enabled: true,
    cooldownDays: 7,
    crossPlatform: false
  },
  contentLevel: {
    enabled: true,
    hashAlgorithm: 'md5',
    ignorePunctuation: true
  },
  crossDevice: {
    enabled: false,
    fingerprintStrategy: 'hybrid'
  }
};

const defaultRateLimitConfig: RateLimitConfig = {
  types: [RateLimitType.HOURLY, RateLimitType.DAILY, RateLimitType.INTERVAL],
  hourly: {
    enabled: true,
    limit: 50,
    followLimit: 30,
    replyLimit: 20
  },
  daily: {
    enabled: true,
    limit: 200,
    followLimit: 120,
    replyLimit: 80
  },
  interval: {
    enabled: true,
    minIntervalSeconds: 30,
    maxIntervalSeconds: 120,
    randomizeInterval: true
  },
  peakHours: {
    enabled: true,
    timeRanges: [
      { start: '09:00', end: '11:30' },
      { start: '14:00', end: '17:00' },
      { start: '19:00', end: '22:00' }
    ],
    limitMultiplier: 0.6
  }
};

const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  enabled: true,
  failureThreshold: 10,
  failureRateThreshold: 0.5,
  timeWindowMinutes: 10,
  minimumRequests: 5,
  openDurationMinutes: 5,
  halfOpenMaxRequests: 3,
  autoRecovery: {
    enabled: true,
    checkIntervalMinutes: 1,
    successThreshold: 3
  }
};

/**
 * 查重频控管理Hook
 */
export function useSafetyControl() {
  // 配置状态
  const [deduplicationConfig, setDeduplicationConfig] = useState<DeduplicationConfig>(
    defaultDeduplicationConfig
  );
  const [rateLimitConfig, setRateLimitConfig] = useState<RateLimitConfig>(
    defaultRateLimitConfig
  );
  const [circuitBreakerConfig, setCircuitBreakerConfig] = useState<CircuitBreakerConfig>(
    defaultCircuitBreakerConfig
  );
  const [whitelist, setWhitelist] = useState<WhitelistConfig | undefined>();
  const [blacklist, setBlacklist] = useState<BlacklistConfig | undefined>();
  
  // 运行状态
  const [safetyService, setSafetyService] = useState<SafetyCheckService | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // 统计数据
  const [statistics, setStatistics] = useState<SafetyStatistics | null>(null);
  const [recentChecks, setRecentChecks] = useState<SafetyCheckResult[]>([]);
  
  /**
   * 初始化安全服务
   */
  const initializeSafetyService = useCallback(() => {
    if (!isEnabled) {
      setSafetyService(null);
      return;
    }
    
    const service = new SafetyCheckService(
      deduplicationConfig,
      rateLimitConfig,
      circuitBreakerConfig,
      whitelist,
      blacklist
    );
    
    setSafetyService(service);
  }, [
    deduplicationConfig, 
    rateLimitConfig, 
    circuitBreakerConfig, 
    whitelist, 
    blacklist, 
    isEnabled
  ]);
  
  /**
   * 执行安全检查
   */
  const performSafetyCheck = useCallback(async (
    request: SafetyCheckRequest
  ): Promise<SafetyCheckResult> => {
    if (!safetyService) {
      throw new Error('安全服务未初始化');
    }
    
    setLoading(true);
    try {
      const result = await safetyService.performSafetyCheck(request);
      
      // 更新最近检查记录
      setRecentChecks(prev => [result, ...prev.slice(0, 49)]); // 保持最近50条
      
      return result;
    } finally {
      setLoading(false);
    }
  }, [safetyService]);
  
  /**
   * 记录操作成功
   */
  const recordSuccess = useCallback(async (request: SafetyCheckRequest): Promise<void> => {
    if (safetyService) {
      await safetyService.recordSuccessfulOperation(request);
    }
  }, [safetyService]);
  
  /**
   * 记录操作失败
   */
  const recordFailure = useCallback(async (
    request: SafetyCheckRequest,
    errorMessage?: string
  ): Promise<void> => {
    if (safetyService) {
      await safetyService.recordFailedOperation(request, errorMessage);
    }
  }, [safetyService]);
  
  /**
   * 更新去重配置
   */
  const updateDeduplicationConfig = useCallback((
    updates: Partial<DeduplicationConfig>
  ) => {
    setDeduplicationConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  /**
   * 更新频控配置
   */
  const updateRateLimitConfig = useCallback((
    updates: Partial<RateLimitConfig>
  ) => {
    setRateLimitConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  /**
   * 更新熔断器配置
   */
  const updateCircuitBreakerConfig = useCallback((
    updates: Partial<CircuitBreakerConfig>
  ) => {
    setCircuitBreakerConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  /**
   * 加载统计数据
   */
  const loadStatistics = useCallback(async (
    accountId: string,
    timeRange: { start: Date; end: Date }
  ) => {
    if (!safetyService) return;
    
    setLoading(true);
    try {
      const stats = await safetyService.getSafetyStatistics(accountId, timeRange);
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [safetyService]);
  
  /**
   * 重置配置到默认值
   */
  const resetToDefaults = useCallback(() => {
    setDeduplicationConfig(defaultDeduplicationConfig);
    setRateLimitConfig(defaultRateLimitConfig);
    setCircuitBreakerConfig(defaultCircuitBreakerConfig);
    setWhitelist(undefined);
    setBlacklist(undefined);
  }, []);
  
  /**
   * 导出配置
   */
  const exportConfig = useCallback(() => {
    return {
      deduplication: deduplicationConfig,
      rateLimit: rateLimitConfig,
      circuitBreaker: circuitBreakerConfig,
      whitelist,
      blacklist
    };
  }, [deduplicationConfig, rateLimitConfig, circuitBreakerConfig, whitelist, blacklist]);
  
  /**
   * 导入配置
   */
  const importConfig = useCallback((config: {
    deduplication?: DeduplicationConfig;
    rateLimit?: RateLimitConfig;
    circuitBreaker?: CircuitBreakerConfig;
    whitelist?: WhitelistConfig;
    blacklist?: BlacklistConfig;
  }) => {
    if (config.deduplication) {
      setDeduplicationConfig(config.deduplication);
    }
    if (config.rateLimit) {
      setRateLimitConfig(config.rateLimit);
    }
    if (config.circuitBreaker) {
      setCircuitBreakerConfig(config.circuitBreaker);
    }
    if (config.whitelist) {
      setWhitelist(config.whitelist);
    }
    if (config.blacklist) {
      setBlacklist(config.blacklist);
    }
  }, []);
  
  /**
   * 获取系统健康状态
   */
  const getHealthStatus = useCallback(() => {
    if (!statistics) {
      return { status: 'unknown', score: 0, message: '暂无数据' };
    }
    
    const { totalChecks, passedChecks, blockedChecks } = statistics;
    if (totalChecks === 0) {
      return { status: 'unknown', score: 0, message: '暂无检查记录' };
    }
    
    const passRate = passedChecks / totalChecks;
    let status: 'healthy' | 'warning' | 'critical' | 'unknown';
    let message: string;
    
    if (passRate >= 0.9) {
      status = 'healthy';
      message = '系统运行正常';
    } else if (passRate >= 0.7) {
      status = 'warning';
      message = '系统运行良好，但需要关注';
    } else {
      status = 'critical';
      message = '系统运行异常，需要立即处理';
    }
    
    return {
      status,
      score: Math.round(passRate * 100),
      message,
      details: {
        totalChecks,
        passedChecks,
        blockedChecks,
        passRate: Math.round(passRate * 100)
      }
    };
  }, [statistics]);
  
  // 初始化服务
  useEffect(() => {
    initializeSafetyService();
  }, [initializeSafetyService]);
  
  return {
    // 配置
    deduplicationConfig,
    rateLimitConfig,
    circuitBreakerConfig,
    whitelist,
    blacklist,
    
    // 状态
    isEnabled,
    loading,
    safetyService,
    
    // 数据
    statistics,
    recentChecks,
    
    // 方法
    setIsEnabled,
    performSafetyCheck,
    recordSuccess,
    recordFailure,
    updateDeduplicationConfig,
    updateRateLimitConfig,
    updateCircuitBreakerConfig,
    setWhitelist,
    setBlacklist,
    loadStatistics,
    resetToDefaults,
    exportConfig,
    importConfig,
    getHealthStatus,
    
    // 工具方法
    initializeSafetyService
  };
}