// src/pages/precise-acquisition/modules/industry-monitoring/types/enhancedTypes.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 增强监控类型定义
 */

export interface EnhancedMonitoringTask {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  config: {
    keywords: string[];
    platforms: string[];
    maxResults: number;
    interval: number;
  };
  metrics: {
    totalResults: number;
    successRate: number;
    lastRunTime?: Date;
  };
  created_at: Date;
  updated_at: Date;
}

export interface MonitoringConfig {
  keywords: string[];
  platforms: string[];
  maxResults: number;
  interval: number;
  enabled: boolean;
}

export interface MonitoringResult {
  taskId: string;
  results: any[];
  timestamp: Date;
  success: boolean;
  error?: string;
}