/**
 * 半自动任务类型定义
 */

export interface SemiAutoTask {
  id: string;
  type: 'follow' | 'reply' | 'comment' | 'like';
  title: string;
  description: string;
  targetAccount?: string;
  targetContent?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'paused';
  priority: 'high' | 'medium' | 'low';
  deviceId?: string;
  deviceName?: string;
  createdAt: string;
  updatedAt: string;
  executionTime?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  progress: number;
  
  // 任务参数
  parameters: {
    targetUrl?: string;
    replyText?: string;
    commentText?: string;
    followCount?: number;
    delayMin?: number;
    delayMax?: number;
    checkDuplication?: boolean;
    autoSwitch?: boolean;
  };
  
  // 执行结果
  result?: {
    success: boolean;
    message: string;
    data?: any;
    screenshotPath?: string;
    logPath?: string;
  };
}

export interface SemiAutoTaskCreate {
  type: SemiAutoTask['type'];
  title: string;
  description?: string;
  targetAccount?: string;
  targetContent?: string;
  priority?: SemiAutoTask['priority'];
  parameters: SemiAutoTask['parameters'];
}

export interface SemiAutoTaskUpdate {
  id: string;
  status?: SemiAutoTask['status'];
  progress?: number;
  errorMessage?: string;
  result?: SemiAutoTask['result'];
}

export interface SemiAutoTaskFilter {
  type?: SemiAutoTask['type'];
  status?: SemiAutoTask['status'];
  priority?: SemiAutoTask['priority'];
  deviceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SemiAutoTaskStats {
  total: number;
  pending: number;
  executing: number;
  completed: number;
  failed: number;
  paused: number;
  successRate: number;
  avgExecutionTime: number;
}