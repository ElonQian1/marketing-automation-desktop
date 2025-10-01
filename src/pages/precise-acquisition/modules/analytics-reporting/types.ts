/**
 * 分析报告系统类型定义
 */

export interface ReportMetrics {
  // 时间范围
  timeRange: {
    start: string;
    end: string;
    period: 'daily' | 'weekly' | 'monthly' | 'custom';
  };
  
  // 执行统计
  execution: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    successRate: number;
    
    // 操作统计
    operations: {
      follows: number;
      replies: number;
      likes: number;
      shares: number;
    };
    
    // 设备使用情况
    deviceUsage: Array<{
      deviceId: string;
      deviceName: string;
      tasksExecuted: number;
      successRate: number;
      uptime: number; // 运行时间（小时）
    }>;
  };
  
  // 效果分析
  effectiveness: {
    // 目标达成
    targets: {
      totalTargets: number;
      uniqueTargets: number;
      engagedTargets: number;
      engagementRate: number;
    };
    
    // 互动效果
    interactions: {
      averageResponseTime: number; // 平均响应时间（分钟）
      responseRate: number; // 响应率
      qualityScore: number; // 互动质量评分（1-100）
    };
    
    // 转化效果
    conversions: {
      leads: number; // 线索数量
      contacts: number; // 联系人获取
      conversationRate: number; // 对话转化率
    };
  };
  
  // 质量指标
  quality: {
    // 安全性
    safety: {
      duplicatesDetected: number;
      riskyActionsBlocked: number;
      safetyScore: number; // 安全评分（1-100）
    };
    
    // 智能度
    intelligence: {
      autoOptimizations: number;
      suggestionsAdopted: number;
      intelligenceScore: number; // 智能化评分（1-100）
    };
    
    // 稳定性
    stability: {
      errors: number;
      crashes: number;
      uptimePercentage: number;
    };
  };
}

export interface TrendData {
  date: string;
  value: number;
  change?: number; // 相比前一天的变化
  percentage?: number; // 变化百分比
}

export interface ComparisonReport {
  current: ReportMetrics;
  previous: ReportMetrics;
  
  // 趋势分析
  trends: {
    execution: TrendData[];
    effectiveness: TrendData[];
    quality: TrendData[];
  };
  
  // 改进建议
  recommendations: Array<{
    type: 'performance' | 'quality' | 'efficiency' | 'safety';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    effort: string;
    actionItems: string[];
  }>;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: 'summary' | 'detailed' | 'executive' | 'technical';
  includeCharts: boolean;
  includeRawData: boolean;
  customFields?: string[];
}

export interface DashboardConfig {
  // 显示设置
  layout: {
    columns: number;
    showTrends: boolean;
    showComparisons: boolean;
    refreshInterval: number; // 自动刷新间隔（分钟）
  };
  
  // 图表配置
  charts: {
    type: 'line' | 'bar' | 'pie' | 'area';
    timeGranularity: 'hour' | 'day' | 'week' | 'month';
    showDataLabels: boolean;
    colorScheme: 'default' | 'blue' | 'green' | 'purple';
  };
  
  // 警报设置
  alerts: {
    successRateThreshold: number;
    errorRateThreshold: number;
    enableNotifications: boolean;
    notificationChannels: ('email' | 'popup' | 'webhook')[];
  };
}

export interface PlatformMetrics {
  platform: 'xiaohongshu' | 'douyin';
  
  // 平台特定统计
  stats: {
    totalAccounts: number;
    activeAccounts: number;
    totalPosts: number;
    totalComments: number;
    
    // 内容分析
    contentTypes: {
      video: number;
      image: number;
      text: number;
    };
    
    // 用户群体
    audienceInsights: {
      demographics: {
        ageGroups: Record<string, number>;
        genders: Record<string, number>;
        locations: Record<string, number>;
      };
      interests: Array<{
        category: string;
        count: number;
        percentage: number;
      }>;
    };
  };
  
  // 效果对比
  performance: {
    avgEngagementRate: number;
    avgReachRate: number;
    costPerLead: number;
    roi: number; // 投资回报率
  };
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  
  // 报告配置
  config: {
    metrics: string[]; // 选择的指标
    dimensions: string[]; // 分析维度
    filters: Record<string, any>; // 筛选条件
    groupBy: string[]; // 分组字段
    sortBy: string; // 排序字段
    limit?: number; // 结果数量限制
  };
  
  // 调度设置
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM
    recipients: string[]; // 邮箱地址
  };
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  category: 'operations' | 'marketing' | 'quality' | 'executive';
  
  // 模板结构
  sections: Array<{
    title: string;
    type: 'chart' | 'table' | 'kpi' | 'text';
    config: any;
    dataSource: string;
  }>;
  
  // 样式设置
  styling: {
    theme: 'light' | 'dark' | 'corporate';
    primaryColor: string;
    logoUrl?: string;
    watermark?: string;
  };
  
  isPublic: boolean;
  usageCount: number;
}

export interface AnalyticsQuery {
  // 查询参数
  metrics: string[];
  dimensions: string[];
  filters: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
  }>;
  
  // 时间范围
  dateRange: {
    start: string;
    end: string;
  };
  
  // 分组和排序
  groupBy?: string[];
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  
  // 分页
  offset?: number;
  limit?: number;
}

export interface AnalyticsResult {
  data: Array<Record<string, any>>;
  total: number;
  aggregations?: Record<string, number>;
  
  // 查询元数据
  query: AnalyticsQuery;
  executionTime: number;
  cached: boolean;
}

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // 计算公式
  formula: {
    type: 'simple' | 'ratio' | 'percentage' | 'custom';
    numerator: string;
    denominator?: string;
    customExpression?: string;
  };
  
  // 显示设置
  display: {
    unit: string;
    decimals: number;
    format: 'number' | 'percentage' | 'currency' | 'duration';
    prefix?: string;
    suffix?: string;
  };
  
  // 目标设置
  targets?: {
    green: number; // 优秀阈值
    yellow: number; // 良好阈值
    red: number; // 警告阈值
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // 触发条件
  conditions: Array<{
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    value: number;
    timeWindow: string; // e.g., '5m', '1h', '1d'
  }>;
  
  // 通知设置
  notifications: {
    channels: ('email' | 'webhook' | 'popup')[];
    recipients: string[];
    template: string;
    cooldown: number; // 冷却期（分钟）
  };
  
  // 元数据
  severity: 'critical' | 'warning' | 'info';
  tags: string[];
  createdAt: string;
  lastTriggered?: string;
}