/**
 * 精准获客系统 - 监控任务统一类型定义
 * 
 * 这个文件统一了所有监控任务相关的类型定义，
 * 避免在不同模块中出现类型冲突
 */

// 监控筛选条件接口
export interface MonitoringFilters {
  commentTimeRange?: number;
  region?: string[];
  minLikes?: number;
  maxLikes?: number;
  hasPhone?: boolean;
  hasWechat?: boolean;
  ageRange?: [number, number];
  gender?: 'male' | 'female' | 'any';
  deviceType?: string[];
  activityTime?: string[];
}

// 监控任务状态枚举
export type MonitoringTaskStatus = 'active' | 'paused' | 'completed' | 'error';

// 监控任务类型枚举
export type MonitoringTaskType = 'industry' | 'account' | 'video';

// 监控任务统计信息
export interface MonitoringTaskStats {
  followCount: number;
  replyCount: number;
  lastExecuted?: string;
}

/**
 * 监控任务统一接口
 */
export interface MonitoringTask {
  id: string;
  name: string; // 任务名称，必需字段
  type: MonitoringTaskType;
  status: MonitoringTaskStatus;
  createdAt: string; // 统一使用 ISO 字符串格式
  updatedAt: string; // 统一使用 ISO 字符串格式
  keywords?: string[];
  targetAccount?: string;
  targetVideo?: string;
  // 筛选条件
  filters: MonitoringFilters;
  // 执行设备
  assignedDevices: string[];
  // 统计数据
  stats: MonitoringTaskStats;
}

/**
 * 监控任务创建配置
 */
export interface CreateMonitoringTaskConfig {
  name: string;
  type: MonitoringTaskType;
  keywords?: string[];
  targetAccount?: string;
  targetVideo?: string;
  filters?: Partial<MonitoringFilters>;
  assignedDevices?: string[];
}

/**
 * 监控任务更新配置
 */
export interface UpdateMonitoringTaskConfig {
  name?: string;
  status?: MonitoringTaskStatus;
  keywords?: string[];
  targetAccount?: string;
  targetVideo?: string;
  filters?: Partial<MonitoringFilters>;
  assignedDevices?: string[];
}