// src/pages/precise-acquisition/modules/industry-monitoring/services/monitoringService.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 监控服务（临时实现）
 */

import { MonitoringTask, CreateMonitoringTaskConfig } from '../../../shared/types/monitoringTypes';

// 重新导出类型供外部使用
export type { MonitoringTask, CreateMonitoringTaskConfig } from '../../../shared/types/monitoringTypes';

export class MonitoringService {
  async getTasks(): Promise<MonitoringTask[]> {
    // 临时实现
    return [];
  }

  async createTask(config: CreateMonitoringTaskConfig): Promise<MonitoringTask> {
    // 临时实现
    const now = new Date().toISOString();
    return {
      id: Date.now().toString(),
      name: config.name || '未命名任务',
      type: config.type || 'industry',
      status: 'paused', // 使用统一的状态枚举
      keywords: config.keywords || [],
      targetAccount: config.targetAccount,
      targetVideo: config.targetVideo,
      createdAt: now,
      updatedAt: now,
      filters: {
        commentTimeRange: config.filters?.commentTimeRange,
        region: config.filters?.region || [],
        minLikes: config.filters?.minLikes,
        maxLikes: config.filters?.maxLikes,
        hasPhone: config.filters?.hasPhone,
        hasWechat: config.filters?.hasWechat,
        ageRange: config.filters?.ageRange,
        gender: config.filters?.gender,
        deviceType: config.filters?.deviceType,
        activityTime: config.filters?.activityTime,
      },
      assignedDevices: config.assignedDevices || [],
      stats: {
        followCount: 0,
        replyCount: 0,
        lastExecuted: undefined,
      },
    };
  }

  async updateTask(id: string, updates: Partial<MonitoringTask>): Promise<void> {
    // 临时实现
    console.log('更新监控任务:', id, updates);
  }

  async deleteTask(id: string): Promise<void> {
    // 临时实现
    console.log('删除监控任务:', id);
  }
}

export const monitoringService = new MonitoringService();