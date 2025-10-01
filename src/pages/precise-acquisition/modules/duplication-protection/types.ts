/**
 * 查重防护系统类型定义
 */

export interface DuplicationRule {
  id: string;
  name: string;
  description: string;
  type: 'follow' | 'reply' | 'interaction';
  enabled: boolean;
  priority: number; // 1-10，优先级越高越先检查
  
  // 时间窗口配置
  timeWindow: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  
  // 设备范围
  deviceScope: {
    type: 'all' | 'specific' | 'group';
    devices?: string[]; // 特定设备ID
    groups?: string[]; // 设备组ID
  };
  
  // 查重条件
  conditions: {
    maxActionsPerTarget: number; // 对同一目标的最大操作次数
    maxActionsPerTimeWindow: number; // 时间窗口内的最大操作次数
    cooldownPeriod?: number; // 冷却期（小时）
    
    // 高级条件
    checkUserLevel?: boolean; // 检查用户级别重复
    checkContentSimilarity?: boolean; // 检查内容相似度
    respectPlatformLimits?: boolean; // 遵守平台限制
  };
  
  // 动作配置
  actions: {
    onDuplicationDetected: 'block' | 'warn' | 'delay' | 'log';
    delayMinutes?: number; // 延迟执行的分钟数
    warningMessage?: string; // 警告信息
    fallbackStrategy?: 'skip' | 'reassign' | 'queue'; // 备选策略
  };
  
  // 例外规则
  exceptions?: {
    vipTargets?: string[]; // VIP目标账户（允许多次操作）
    urgentKeywords?: string[]; // 紧急关键词（跳过查重）
    highPriorityTasks?: string[]; // 高优先级任务
  };
  
  // 统计数据
  stats: {
    totalChecks: number;
    duplicationsDetected: number;
    actionsBlocked: number;
    lastTriggered?: string;
  };
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DuplicationCheck {
  id: string;
  ruleId: string;
  targetId: string; // 目标用户ID或评论ID
  targetType: 'user' | 'comment' | 'video';
  actionType: 'follow' | 'reply' | 'like' | 'share';
  deviceId: string;
  taskId?: string;
  
  // 检查结果
  result: 'pass' | 'blocked' | 'warning' | 'delayed';
  reason: string;
  confidence: number; // 0-100，检测置信度
  
  // 检查详情
  details: {
    previousActions: Array<{
      actionType: string;
      targetId: string;
      deviceId: string;
      timestamp: string;
    }>;
    timeWindowUsed: string;
    ruleTriggered: string;
    recommendedAction?: string;
  };
  
  // 处理结果
  actionTaken: 'proceeded' | 'blocked' | 'delayed' | 'modified';
  modifiedTarget?: string; // 如果重定向到其他目标
  delayUntil?: string; // 延迟到什么时候
  
  timestamp: string;
}

export interface DuplicationHistory {
  id: string;
  targetId: string;
  targetType: 'user' | 'comment' | 'video';
  targetInfo: {
    name?: string;
    platform: 'xiaohongshu' | 'douyin';
    url?: string;
  };
  
  // 操作历史
  actions: Array<{
    id: string;
    type: 'follow' | 'reply' | 'like' | 'share';
    deviceId: string;
    deviceName?: string;
    content?: string; // 回复内容
    timestamp: string;
    taskId?: string;
    result: 'success' | 'failed' | 'blocked';
  }>;
  
  // 统计数据
  totalActions: number;
  uniqueDevices: number;
  firstAction: string;
  lastAction: string;
  
  // 风险评估
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface DuplicationEvent {
  id: string;
  type: 'rule_triggered' | 'action_blocked' | 'warning_issued' | 'cooldown_started';
  ruleId: string;
  ruleName: string;
  targetId: string;
  deviceId: string;
  
  // 事件详情
  details: {
    originalAction: string;
    blockReason: string;
    impact: 'high' | 'medium' | 'low';
    userNotified: boolean;
  };
  
  // 后续处理
  resolution?: {
    action: 'manual_override' | 'auto_retry' | 'alternative_action' | 'cancelled';
    resolvedBy?: string;
    resolvedAt?: string;
    notes?: string;
  };
  
  timestamp: string;
  acknowledged: boolean;
}

export interface DuplicationConfig {
  globalSettings: {
    enabled: boolean;
    defaultTimeWindow: number; // 小时
    maxGlobalActionsPerHour: number;
    emergencyStop: boolean; // 紧急停止所有操作
    
    // 智能配置
    autoAdjustRules: boolean; // 根据效果自动调整规则
    learningMode: boolean; // 学习模式，记录但不阻止
    platformSync: boolean; // 同步平台官方限制
  };
  
  // 通知设置
  notifications: {
    onRuleTriggered: boolean;
    onHighRiskDetected: boolean;
    notificationMethods: ('popup' | 'email' | 'webhook')[];
    quietHours?: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
  };
  
  // 数据保留
  dataRetention: {
    historyDays: number;
    logLevel: 'minimal' | 'standard' | 'detailed';
    exportFormat: 'json' | 'csv' | 'excel';
  };
}

export interface DuplicationAnalytics {
  timeRange: {
    start: string;
    end: string;
  };
  
  summary: {
    totalChecks: number;
    duplicationsDetected: number;
    actionsBlocked: number;
    falsePositives: number;
    rulesTriggered: {
      ruleId: string;
      count: number;
    }[];
  };
  
  trends: {
    dailyChecks: Array<{ date: string; count: number }>;
    deviceActivity: Array<{ deviceId: string; actions: number; blocked: number }>;
    targetHotspots: Array<{ targetId: string; interactions: number; risk: string }>;
  };
  
  recommendations: {
    suggestedRuleAdjustments: Array<{
      ruleId: string;
      current: any;
      suggested: any;
      reason: string;
    }>;
    performanceImprovements: string[];
    riskMitigations: string[];
  };
}