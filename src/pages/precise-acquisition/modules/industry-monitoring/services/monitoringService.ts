/**
 * 监控服务（临时实现）
 */

export interface MonitoringTask {
  id: string;
  name: string;
  type: 'industry' | 'account' | 'video';
  status: 'running' | 'stopped' | 'error';
  keywords?: string[];
  targetAccount?: string;
  targetVideo?: string;
  created_at: Date;
  createdAt: Date; // 向后兼容
  updated_at: Date;
  filters: {
    commentTimeRange?: number;
    region?: string[];
    minLikes?: number;
  };
  assignedDevices: string[];
  stats: {
    followCount: number;
    replyCount: number;
  };
}

export class MonitoringService {
  async getTasks(): Promise<MonitoringTask[]> {
    // 临时实现
    return [];
  }

  async createTask(config: any): Promise<MonitoringTask> {
    // 临时实现
    const now = new Date();
    return {
      id: Date.now().toString(),
      name: config.name || '未命名任务',
      type: config.type || 'industry',
      status: 'stopped',
      keywords: config.keywords || [],
      targetAccount: config.targetAccount,
      targetVideo: config.targetVideo,
      created_at: now,
      createdAt: now, // 向后兼容
      updated_at: now,
      filters: {
        commentTimeRange: config.filters?.commentTimeRange,
        region: config.filters?.region || [],
        minLikes: config.filters?.minLikes,
      },
      assignedDevices: config.assignedDevices || [],
      stats: {
        followCount: 0,
        replyCount: 0,
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