/**
 * 监控服务（临时实现）
 */

export interface MonitoringTask {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  created_at: Date;
  updated_at: Date;
}

export class MonitoringService {
  async getTasks(): Promise<MonitoringTask[]> {
    // 临时实现
    return [];
  }

  async createTask(config: any): Promise<MonitoringTask> {
    // 临时实现
    return {
      id: Date.now().toString(),
      name: config.name || '未命名任务',
      status: 'stopped',
      created_at: new Date(),
      updated_at: new Date(),
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