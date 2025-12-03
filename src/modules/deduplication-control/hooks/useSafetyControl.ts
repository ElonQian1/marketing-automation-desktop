// src/modules/deduplication-control/hooks/useSafetyControl.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

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
  WhitelistEntry,
  BlacklistEntry,
  SafetyConfig,
  DeduplicationStrategy,
  RateLimitType,
  CircuitBreakerState,
  ListType
} from '../types';
import { DedupSafetyCheckService } from '../services';

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
  types: [RateLimitType.HOURLY, RateLimitType.DAILY],
  hourly: {
    enabled: true,
    limit: 60,
    followLimit: 30,
    replyLimit: 20
  },
  daily: {
    enabled: true,
    limit: 500,
    followLimit: 250,
    replyLimit: 100
  },
  interval: {
    enabled: true,
    minIntervalSeconds: 3,
    maxIntervalSeconds: 10,
    randomizeInterval: true
  },
  peakHours: {
    enabled: false,
    timeRanges: [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ],
    limitMultiplier: 0.5
  }
};

const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  enabled: true,
  failureThreshold: 5,
  failureRateThreshold: 0.5,
  timeWindowMinutes: 10,
  minimumRequests: 10,
  openDurationMinutes: 5,
  halfOpenMaxRequests: 3,
  autoRecovery: {
    enabled: true,
    checkIntervalMinutes: 5,
    successThreshold: 3
  }
};

/**
 * 查重频控管理Hook
 */
export const useSafetyControl = () => {
  // 配置状态
  const [deduplicationConfig, setDeduplicationConfig] = useState<DeduplicationConfig>(defaultDeduplicationConfig);
  const [rateLimitConfig, setRateLimitConfig] = useState<RateLimitConfig>(defaultRateLimitConfig);
  const [circuitBreakerConfig, setCircuitBreakerConfig] = useState<CircuitBreakerConfig>(defaultCircuitBreakerConfig);
  
  // 列表状态
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  
  // 其他状态
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<SafetyStatistics | null>(null);
  const [recentChecks, setRecentChecks] = useState<SafetyCheckResult[]>([]);
  const [safetyService] = useState(() => new DedupSafetyCheckService(
    deduplicationConfig,
    rateLimitConfig,
    circuitBreakerConfig
  ));

  // 统一配置对象
  const config: SafetyConfig = {
    deduplication: deduplicationConfig,
    rateLimit: rateLimitConfig,
    circuitBreaker: circuitBreakerConfig
  };

  // 更新配置
  const updateConfig = useCallback(async (newConfig: SafetyConfig) => {
    try {
      setLoading(true);
      setError(null);
      
      setDeduplicationConfig(newConfig.deduplication);
      setRateLimitConfig(newConfig.rateLimit);
      setCircuitBreakerConfig(newConfig.circuitBreaker);
      
      // 保存到后端
      // await invoke('plugin:prospecting|save_safety_config', { config: newConfig });
    } catch (err) {
      setError(err instanceof Error ? err.message : '配置更新失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 白名单操作
  const addToWhitelist = useCallback(async (entry: Omit<WhitelistEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: WhitelistEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setWhitelist(prev => [...prev, newEntry]);
  }, []);

  const updateWhitelistEntry = useCallback(async (id: string, updates: Partial<WhitelistEntry>) => {
    setWhitelist(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
    ));
  }, []);

  const deleteWhitelistEntry = useCallback(async (id: string) => {
    setWhitelist(prev => prev.filter(entry => entry.id !== id));
  }, []);

  // 黑名单操作
  const addToBlacklist = useCallback(async (entry: Omit<BlacklistEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: BlacklistEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setBlacklist(prev => [...prev, newEntry]);
  }, []);

  const updateBlacklistEntry = useCallback(async (id: string, updates: Partial<BlacklistEntry>) => {
    setBlacklist(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
    ));
  }, []);

  const deleteBlacklistEntry = useCallback(async (id: string) => {
    setBlacklist(prev => prev.filter(entry => entry.id !== id));
  }, []);

  // 批量操作
  const batchImportWhitelist = useCallback(async (entries: any[]) => {
    const newEntries: WhitelistEntry[] = entries.map(entry => ({
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    setWhitelist(prev => [...prev, ...newEntries]);
  }, []);

  const batchImportBlacklist = useCallback(async (entries: any[]) => {
    const newEntries: BlacklistEntry[] = entries.map(entry => ({
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    setBlacklist(prev => [...prev, ...newEntries]);
  }, []);

  const exportWhitelist = useCallback(async () => {
    const csv = [
      'identifier,identifierType,reason,priority,tags',
      ...whitelist.map(entry => 
        `${entry.identifier},${entry.identifierType},${entry.reason},${entry.priority},"${(entry.tags || []).join(',')}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitelist.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [whitelist]);

  const exportBlacklist = useCallback(async () => {
    const csv = [
      'identifier,identifierType,reason,severity,autoBlock,tags',
      ...blacklist.map(entry => 
        `${entry.identifier},${entry.identifierType},${entry.reason},${entry.severity},${entry.autoBlock},"${(entry.tags || []).join(',')}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blacklist.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [blacklist]);

  // 安全检查
  const performSafetyCheck = useCallback(async (request: SafetyCheckRequest): Promise<SafetyCheckResult> => {
    try {
      const result = await safetyService.performSafetyCheck(request);
      setRecentChecks(prev => [result, ...prev.slice(0, 49)]); // 保留最近50条
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '安全检查失败');
    }
  }, [safetyService]);

  // 统计数据加载
  const loadStatistics = useCallback(async (accountId: string, timeRange: { start: Date; end: Date }) => {
    try {
      setLoading(true);
      setError(null);
      
      // 模拟数据加载
      const mockStatistics: SafetyStatistics = {
        timeRange,
        totalChecks: 1250,
        passedChecks: 1100,
        blockedChecks: 150,
        blockReasons: {
          deduplication: 80,
          rateLimit: 45,
          circuitBreaker: 25
        },
        hourlyStats: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          checks: Math.floor(Math.random() * 100) + 20,
          passed: Math.floor(Math.random() * 80) + 15,
          blocked: Math.floor(Math.random() * 20) + 2
        })),
        riskDistribution: {
          low: 900,
          medium: 250,
          high: 100
        }
      };
      
      setStatistics(mockStatistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : '统计数据加载失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 健康状态
  const healthStatus = {
    status: error ? 'critical' as const : 'healthy' as const,
    score: error ? 0 : 95,
    message: error || '系统运行正常',
    details: statistics ? {
      totalChecks: statistics.totalChecks,
      passedChecks: statistics.passedChecks,
      blockedChecks: statistics.blockedChecks,
      passRate: Math.round((statistics.passedChecks / statistics.totalChecks) * 100)
    } : undefined
  };

  // 刷新健康状态
  const refreshHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // 刷新逻辑
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟刷新
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 其他方法
  const updateDeduplicationConfig = useCallback((config: DeduplicationConfig) => {
    setDeduplicationConfig(config);
  }, []);

  const updateRateLimitConfig = useCallback((config: RateLimitConfig) => {
    setRateLimitConfig(config);
  }, []);

  const updateCircuitBreakerConfig = useCallback((config: CircuitBreakerConfig) => {
    setCircuitBreakerConfig(config);
  }, []);

  const resetToDefaults = useCallback(() => {
    setDeduplicationConfig(defaultDeduplicationConfig);
    setRateLimitConfig(defaultRateLimitConfig);
    setCircuitBreakerConfig(defaultCircuitBreakerConfig);
    setWhitelist([]);
    setBlacklist([]);
  }, []);

  const initializeSafetyService = useCallback(() => {
    // 初始化服务逻辑
  }, []);

  // 模拟初始数据加载
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // 加载初始白名单和黑名单数据
        setWhitelist([]);
        setBlacklist([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  return {
    // 主要接口（匹配组件期望）
    config,
    statistics,
    recentChecks,
    healthStatus,
    whitelist,
    blacklist,
    loading,
    error,
    
    // 操作方法
    updateConfig,
    loadStatistics,
    refreshHealth,
    performSafetyCheck,
    
    // 白名单操作
    addToWhitelist,
    updateWhitelistEntry,
    deleteWhitelistEntry,
    batchImportWhitelist,
    exportWhitelist,
    
    // 黑名单操作
    addToBlacklist,
    updateBlacklistEntry,
    deleteBlacklistEntry,
    batchImportBlacklist,
    exportBlacklist,
    
    // 其他方法（向后兼容）
    deduplicationConfig,
    rateLimitConfig,
    circuitBreakerConfig,
    isEnabled,
    setIsEnabled,
    safetyService,
    updateDeduplicationConfig,
    updateRateLimitConfig,
    updateCircuitBreakerConfig,
    resetToDefaults,
    initializeSafetyService
  };
};