/**
 * 任务引擎 React Hook
 * 
 * 提供任务生成、管理和监控的React接口
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  TaskEngineService,
  TaskGenerationConfig,
  TaskGenerationResult,
  BatchTaskGenerationConfig,
  TaskExecutionStats,
  TaskQuery
} from '../services/TaskEngineService';
import { 
  Task, 
  TaskStatus, 
  TaskType, 
  Platform,
  TaskPriority,
  WatchTarget 
} from '../../shared/types/core';

export interface UseTaskEngineOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTaskEngineReturn {
  // 服务实例
  service: TaskEngineService;
  
  // 数据状态
  tasks: Task[];
  stats: TaskExecutionStats | null;
  
  // 加载状态
  loading: boolean;
  generating: boolean;
  updating: boolean;
  
  // 错误状态
  error: string | null;
  
  // 操作方法
  generateTasks: (config: TaskGenerationConfig) => Promise<TaskGenerationResult>;
  batchGenerateTasks: (config: BatchTaskGenerationConfig) => Promise<TaskGenerationResult[]>;
  refreshTasks: (query?: TaskQuery) => Promise<void>;
  refreshStats: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus, result?: any, error?: string) => Promise<void>;
  assignTasksToDevice: (deviceId: string, maxTasks?: number, taskTypes?: TaskType[]) => Promise<Task[]>;
  cancelTask: (taskId: string, reason?: string) => Promise<void>;
  retryFailedTask: (taskId: string) => Promise<void>;
  
  // 状态查询
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByType: (taskType: TaskType) => Task[];
  getTasksByPlatform: (platform: Platform) => Task[];
  getPendingTasksCount: () => number;
  getExecutingTasksCount: () => number;
  getCompletedTasksCount: () => number;
  getFailedTasksCount: () => number;
}

export const useTaskEngine = (options: UseTaskEngineOptions = {}): UseTaskEngineReturn => {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  // 服务实例
  const [service] = useState(() => new TaskEngineService());
  
  // 数据状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskExecutionStats | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // 错误状态
  const [error, setError] = useState<string | null>(null);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 刷新任务列表
  const refreshTasks = useCallback(async (query?: TaskQuery) => {
    if (loading) return;
    
    setLoading(true);
    clearError();
    
    try {
      const result = await service.getTasks(query || {
        limit: 100,
        order_by: 'created_at',
        order_direction: 'desc'
      });
      
      setTasks(result.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务失败');
    } finally {
      setLoading(false);
    }
  }, [service, loading, clearError]);

  // 刷新统计数据
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await service.getExecutionStats();
      setStats(newStats);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
      // 统计数据刷新失败不算作严重错误
    }
  }, [service]);

  // 生成任务
  const generateTasks = useCallback(async (config: TaskGenerationConfig): Promise<TaskGenerationResult> => {
    setGenerating(true);
    clearError();
    
    try {
      const result = await service.generateTasks(config);
      
      // 刷新任务列表和统计
      await Promise.all([refreshTasks(), refreshStats()]);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '任务生成失败');
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [service, refreshTasks, refreshStats, clearError]);

  // 批量生成任务
  const batchGenerateTasks = useCallback(async (config: BatchTaskGenerationConfig): Promise<TaskGenerationResult[]> => {
    setGenerating(true);
    clearError();
    
    try {
      const results = await service.batchGenerateTasks(config);
      
      // 刷新任务列表和统计
      await Promise.all([refreshTasks(), refreshStats()]);
      
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量任务生成失败');
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [service, refreshTasks, refreshStats, clearError]);

  // 更新任务状态
  const updateTaskStatus = useCallback(async (
    taskId: string, 
    status: TaskStatus, 
    result?: any, 
    error?: string
  ) => {
    setUpdating(true);
    clearError();
    
    try {
      await service.updateTaskStatus(taskId, status, error);
      
      // 更新本地任务状态
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status, updated_at: new Date(), error_message: error }
            : task
        )
      );
      
      // 刷新统计
      await refreshStats();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新任务状态失败');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [service, refreshStats, clearError]);

  // 分配任务给设备
  const assignTasksToDevice = useCallback(async (
    deviceId: string, 
    maxTasks: number = 10,
    taskTypes?: TaskType[]
  ): Promise<Task[]> => {
    setUpdating(true);
    clearError();
    
    try {
      // 修复方法签名：assignTasksToDevice需要taskIds数组
      const availableTasks = tasks.filter(t => 
        t.status === TaskStatus.NEW && 
        (!taskTypes || taskTypes.includes(t.task_type))
      ).slice(0, maxTasks);
      
      const taskIds = availableTasks.map(t => t.id);
      const assignmentResult = await service.assignTasksToDevice(deviceId, taskIds);
      
      // 更新本地任务状态
      setTasks(prevTasks => 
        prevTasks.map(task => {
          const assignedTask = assignmentResult.assigned_tasks.find(at => at.id === task.id);
          if (assignedTask) {
            return { ...task, assigned_device_id: deviceId, status: TaskStatus.READY };
          }
          return task;
        })
      );
      
      await refreshStats();
      
      return assignmentResult.assigned_tasks;
    } catch (err) {
      setError(err instanceof Error ? err.message : '任务分配失败');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [service, refreshStats, clearError]);

  // 取消任务
  const cancelTask = useCallback(async (taskId: string, reason?: string) => {
    setUpdating(true);
    clearError();
    
    try {
      await service.cancelTask(taskId, reason);
      
      // 从本地任务列表中移除或更新状态
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: TaskStatus.FAILED, error_message: `已取消: ${reason}`, updated_at: new Date() }
            : task
        )
      );
      
      await refreshStats();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消任务失败');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [service, refreshStats, clearError]);

  // 重试失败任务
  const retryFailedTask = useCallback(async (taskId: string) => {
    setUpdating(true);
    clearError();
    
    try {
      await service.retryFailedTask(taskId);
      
      // 更新本地任务状态
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: TaskStatus.READY, error_message: undefined, updated_at: new Date() }
            : task
        )
      );
      
      await refreshStats();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '重试任务失败');
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [service, refreshStats, clearError]);

  // 状态查询方法
  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getTasksByType = useCallback((taskType: TaskType): Task[] => {
    return tasks.filter(task => task.task_type === taskType);
  }, [tasks]);

  const getTasksByPlatform = useCallback((platform: Platform): Task[] => {
    return tasks.filter(task => task.platform === platform);
  }, [tasks]);

  const getPendingTasksCount = useCallback((): number => {
    return tasks.filter(task => task.status === TaskStatus.NEW || task.status === TaskStatus.READY).length;
  }, [tasks]);

  const getExecutingTasksCount = useCallback((): number => {
    return tasks.filter(task => task.status === TaskStatus.EXECUTING).length;
  }, [tasks]);

  const getCompletedTasksCount = useCallback((): number => {
    return tasks.filter(task => task.status === TaskStatus.DONE).length;
  }, [tasks]);

  const getFailedTasksCount = useCallback((): number => {
    return tasks.filter(task => task.status === TaskStatus.FAILED).length;
  }, [tasks]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    // 初始加载
    refreshTasks();
    refreshStats();

    // 设置定时器
    const interval = setInterval(() => {
      refreshStats(); // 更频繁地刷新统计
      
      // 如果有执行中的任务，也刷新任务列表
      if (tasks.some(task => task.status === TaskStatus.EXECUTING)) {
        refreshTasks();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshTasks, refreshStats, tasks]);

  return {
    service,
    tasks,
    stats,
    loading,
    generating,
    updating,
    error,
    generateTasks,
    batchGenerateTasks,
    refreshTasks,
    refreshStats,
    updateTaskStatus,
    assignTasksToDevice,
    cancelTask,
    retryFailedTask,
    getTasksByStatus,
    getTasksByType,
    getTasksByPlatform,
    getPendingTasksCount,
    getExecutingTasksCount,
    getCompletedTasksCount,
    getFailedTasksCount
  };
};