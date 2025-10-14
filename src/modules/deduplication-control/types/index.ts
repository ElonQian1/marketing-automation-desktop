// src/modules/deduplication-control/types/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 查重频控机制 - 类型定义
 * 
 * 定义查重、频控、熔断等机制的核心类型
 */

/**
 * 去重策略类型
 */
export enum DedupDeduplicationStrategy {
  COMMENT_LEVEL = 'comment_level',        // 评论级去重
  USER_LEVEL = 'user_level',              // 用户级去重
  CONTENT_LEVEL = 'content_level',        // 内容级去重
  CROSS_DEVICE = 'cross_device',          // 跨设备去重
  TIME_WINDOW = 'time_window',            // 时间窗口去重
}

/**
 * 频控类型
 */
export enum DedupRateLimitType {
  HOURLY = 'hourly',                      // 每小时限制
  DAILY = 'daily',                        // 每日限制
  WEEKLY = 'weekly',                      // 每周限制
  MONTHLY = 'monthly',                    // 每月限制
  INTERVAL = 'interval',                  // 间隔限制
}

/**
 * 熔断状态
 */
export enum DedupCircuitBreakerState {
  CLOSED = 'closed',                      // 关闭状态（正常）
  OPEN = 'open',                          // 开启状态（熔断）
  HALF_OPEN = 'half_open',               // 半开状态（试探）
}

/**
 * 去重配置
 */
export interface DedupDeduplicationConfig {
  /** 启用的去重策略 */
  strategies: DedupDeduplicationStrategy[];
  
  /** 评论级去重配置 */
  commentLevel: {
    enabled: boolean;
    /** 内容相似度阈值 (0-1) */
    similarityThreshold: number;
    /** 时间窗口（小时） */
    timeWindowHours: number;
  };
  
  /** 用户级去重配置 */
  userLevel: {
    enabled: boolean;
    /** 用户冷却期（天） */
    cooldownDays: number;
    /** 是否跨平台去重 */
    crossPlatform: boolean;
  };
  
  /** 内容级去重配置 */
  contentLevel: {
    enabled: boolean;
    /** 内容哈希算法 */
    hashAlgorithm: 'md5' | 'sha1' | 'sha256';
    /** 是否忽略标点符号 */
    ignorePunctuation: boolean;
  };
  
  /** 跨设备去重配置 */
  crossDevice: {
    enabled: boolean;
    /** 设备指纹策略 */
    fingerprintStrategy: 'account' | 'imei' | 'mac' | 'hybrid';
  };
}

/**
 * 频控配置
 */
export interface DedupRateLimitConfig {
  /** 启用的频控类型 */
  types: DedupRateLimitType[];
  
  /** 每小时限制 */
  hourly: {
    enabled: boolean;
    limit: number;
    /** 关注任务限制 */
    followLimit: number;
    /** 回复任务限制 */
    replyLimit: number;
  };
  
  /** 每日限制 */
  daily: {
    enabled: boolean;
    limit: number;
    followLimit: number;
    replyLimit: number;
  };
  
  /** 间隔限制 */
  interval: {
    enabled: boolean;
    /** 最小间隔（秒） */
    minIntervalSeconds: number;
    /** 最大间隔（秒） */
    maxIntervalSeconds: number;
    /** 随机化间隔 */
    randomizeInterval: boolean;
  };
  
  /** 高峰期限制 */
  peakHours: {
    enabled: boolean;
    /** 高峰期时间段 */
    timeRanges: Array<{
      start: string; // HH:mm
      end: string;   // HH:mm
    }>;
    /** 高峰期限制倍数 */
    limitMultiplier: number;
  };
}

/**
 * 熔断器配置
 */
export interface DedupCircuitBreakerConfig {
  enabled: boolean;
  
  /** 失败阈值 */
  failureThreshold: number;
  
  /** 失败率阈值 (0-1) */
  failureRateThreshold: number;
  
  /** 时间窗口（分钟） */
  timeWindowMinutes: number;
  
  /** 最小请求数量 */
  minimumRequests: number;
  
  /** 熔断持续时间（分钟） */
  openDurationMinutes: number;
  
  /** 半开状态最大请求数 */
  halfOpenMaxRequests: number;
  
  /** 自动恢复配置 */
  autoRecovery: {
    enabled: boolean;
    /** 恢复检查间隔（分钟） */
    checkIntervalMinutes: number;
    /** 连续成功次数阈值 */
    successThreshold: number;
  };
}

/**
 * 去重检查结果
 */
export interface DeduplicationResult {
  /** 是否允许执行 */
  allowed: boolean;
  
  /** 触发的去重策略 */
  triggeredStrategies: DedupDeduplicationStrategy[];
  
  /** 重复项详情 */
  duplicates: Array<{
    strategy: DedupDeduplicationStrategy;
    reason: string;
    conflictId?: string;
    conflictTime?: Date;
  }>;
  
  /** 建议操作 */
  suggestions: string[];
}

/**
 * 频控检查结果
 */
export interface RateLimitResult {
  /** 是否允许执行 */
  allowed: boolean;
  
  /** 触发的频控类型 */
  triggeredTypes: DedupRateLimitType[];
  
  /** 当前使用量 */
  currentUsage: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  
  /** 剩余配额 */
  remainingQuota: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  
  /** 等待时间（秒） */
  waitTimeSeconds?: number;
  
  /** 重置时间 */
  resetTime?: Date;
  
  /** 详细原因 */
  reason?: string;
}

/**
 * 熔断器状态信息
 */
export interface CircuitBreakerStatus {
  /** 当前状态 */
  state: DedupCircuitBreakerState;
  
  /** 失败计数 */
  failureCount: number;
  
  /** 成功计数 */
  successCount: number;
  
  /** 失败率 */
  failureRate: number;
  
  /** 最后失败时间 */
  lastFailureTime?: Date;
  
  /** 最后成功时间 */
  lastSuccessTime?: Date;
  
  /** 下次检查时间 */
  nextCheckTime?: Date;
  
  /** 状态变更历史 */
  stateHistory: Array<{
    state: DedupCircuitBreakerState;
    timestamp: Date;
    reason: string;
  }>;
}

/**
 * 安全检查请求
 */
export interface SafetyCheckRequest {
  /** 任务类型 */
  taskType?: 'follow' | 'reply';
  
  /** 操作类型 */
  action: string;
  
  /** 目标用户ID（兼容性） */
  targetUserId?: string;
  
  /** 目标（新字段） */
  target: string;
  
  /** 内容 */
  content: string;
  
  /** 平台 */
  platform?: string;
  
  /** 执行账号ID */
  accountId: string;
  
  /** 设备ID */
  deviceId?: string;
  
  /** 元数据 */
  metadata?: Record<string, unknown>;
  
  /** 上下文信息 */
  context?: {
    commentId?: string;
    videoId?: string;
    topicId?: string;
  };
}

/**
 * 安全检查结果
 */
export interface SafetyCheckResult {
  /** 是否允许执行 */
  allowed: boolean;
  
  /** 拦截原因 */
  blockReason?: string;
  
  /** 去重检查结果 */
  deduplication: DeduplicationResult;
  
  /** 频控检查结果 */
  rateLimit: RateLimitResult;
  
  /** 熔断器状态 */
  circuitBreaker: CircuitBreakerStatus;
  
  /** 综合风险评分 (0-100) */
  riskScore: number;
  
  /** 建议操作 */
  recommendations: Array<{
    type: 'wait' | 'skip' | 'retry' | 'manual_review';
    message: string;
    waitTime?: number;
  }>;
  
  /** 检查时间 */
  checkTime: Date;
}

/**
 * 统计信息
 */
export interface SafetyStatistics {
  /** 时间范围 */
  timeRange: {
    start: Date;
    end: Date;
  };
  
  /** 总检查次数 */
  totalChecks: number;
  
  /** 通过次数 */
  passedChecks: number;
  
  /** 被拦截次数 */
  blockedChecks: number;
  
  /** 按策略分组的拦截统计 */
  blockReasons: {
    deduplication: number;
    rateLimit: number;
    circuitBreaker: number;
  };
  
  /** 按时间分组的统计 */
  hourlyStats: Array<{
    hour: number;
    checks: number;
    passed: number;
    blocked: number;
  }>;
  
  /** 风险评分分布 */
  riskDistribution: {
    low: number;      // 0-30
    medium: number;   // 31-70
    high: number;     // 71-100
  };
}

/**
 * 规则管理接口
 */
export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  
  /** 规则类型 */
  type: 'deduplication' | 'rate_limit' | 'circuit_breaker' | 'custom';
  
  /** 规则条件 */
  conditions: {
    platforms?: string[];
    taskTypes?: string[];
    timeRanges?: Array<{ start: string; end: string }>;
    accountTypes?: string[];
  };
  
  /** 规则配置 */
  config: DedupDeduplicationConfig | DedupRateLimitConfig | DedupCircuitBreakerConfig | Record<string, unknown>;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 更新时间 */
  updatedAt: Date;
  
  /** 创建者 */
  createdBy: string;
}

/**
 * 白名单配置
 */
export interface WhitelistConfig {
  /** 用户白名单 */
  users: Array<{
    userId: string;
    platform: string;
    reason: string;
    addedAt: Date;
    addedBy: string;
  }>;
  
  /** 内容白名单（关键词） */
  keywords: Array<{
    keyword: string;
    platform?: string;
    reason: string;
    addedAt: Date;
    addedBy: string;
  }>;
  
  /** 时间段白名单 */
  timeSlots: Array<{
    start: string; // HH:mm
    end: string;   // HH:mm
    reason: string;
    addedAt: Date;
    addedBy: string;
  }>;
}

/**
 * 黑名单配置
 */
export interface BlacklistConfig {
  /** 用户黑名单 */
  users: Array<{
    userId: string;
    platform: string;
    reason: string;
    addedAt: Date;
    addedBy: string;
    expiresAt?: Date;
  }>;
  
  /** 内容黑名单（关键词） */
  keywords: Array<{
    keyword: string;
    platform?: string;
    reason: string;
    addedAt: Date;
    addedBy: string;
  }>;
  
  /** IP黑名单 */
  ips: Array<{
    ip: string;
    reason: string;
    addedAt: Date;
    addedBy: string;
    expiresAt?: Date;
  }>;
}

/**
 * 白名单条目
 */
export interface WhitelistEntry {
  id: string;
  identifier: string;
  identifierType: 'phone' | 'userId' | 'nickname' | 'email' | 'custom';
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * 黑名单条目
 */
export interface BlacklistEntry {
  id: string;
  identifier: string;
  identifierType: 'phone' | 'userId' | 'nickname' | 'email' | 'custom';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoBlock: boolean;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * 列表类型
 */
export type ListType = 'whitelist' | 'blacklist';

/**
 * 列表操作类型
 */
export type ListAction = 'add' | 'update' | 'delete' | 'batch_import' | 'export';

/**
 * 安全配置（统一配置接口）
 */
export interface DedupSafetyConfig {
  deduplication: DedupDeduplicationConfig;
  rateLimit: DedupRateLimitConfig;
  circuitBreaker: DedupCircuitBreakerConfig;
}

// ========================
// 临时向后兼容别名（将在后续版本中移除）
// ========================

/** @deprecated 请使用 DedupDeduplicationStrategy */
export { DedupDeduplicationStrategy as DeduplicationStrategy };
/** @deprecated 请使用 DedupRateLimitType */  
export { DedupRateLimitType as RateLimitType };
/** @deprecated 请使用 DedupCircuitBreakerState */
export { DedupCircuitBreakerState as CircuitBreakerState };

/** @deprecated 请使用 DedupDeduplicationConfig */
export type DeduplicationConfig = DedupDeduplicationConfig;
/** @deprecated 请使用 DedupRateLimitConfig */
export type RateLimitConfig = DedupRateLimitConfig;
/** @deprecated 请使用 DedupCircuitBreakerConfig */
export type CircuitBreakerConfig = DedupCircuitBreakerConfig;
/** @deprecated 请使用 DedupSafetyConfig */
export type SafetyConfig = DedupSafetyConfig;