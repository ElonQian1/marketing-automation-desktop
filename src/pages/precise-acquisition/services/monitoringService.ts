// 精准获客监控服务
export interface MonitoringTask {
  id: string;
  name: string;
  status: string;
  progress: number;
}

export class MonitoringService {
  private tasks = new Map();
  
  createTask(id: string, name: string) {
    return { id, name, status: 'pending', progress: 0 };
  }
  
  getTask(id: string) {
    return this.tasks.get(id);
  }
}

export const monitoringService = new MonitoringService();
