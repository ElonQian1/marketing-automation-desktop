/**
 * 半自动任务管理 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { SemiAutoTask, SemiAutoTaskCreate, SemiAutoTaskUpdate, SemiAutoTaskFilter, SemiAutoTaskStats } from './types';

export const useSemiAutoTasks = () => {
  const [tasks, setTasks] = useState<SemiAutoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载任务列表
  const loadTasks = useCallback(async (filter?: SemiAutoTaskFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      // 模拟数据 - 实际项目中应该调用后端API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTasks: SemiAutoTask[] = [
        {
          id: '1',
          type: 'follow',
          title: '关注美食博主',
          description: '批量关注美食类相关博主',
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          progress: 0,
          parameters: {
            followCount: 50,
            delayMin: 2,
            delayMax: 5,
            checkDuplication: true,
          }
        },
        {
          id: '2',
          type: 'reply',
          title: '自动回复评论',
          description: '针对热门内容进行互动回复',
          status: 'executing',
          priority: 'medium',
          deviceId: 'device_1',
          deviceName: '设备1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionTime: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          progress: 65,
          parameters: {
            replyText: '很棒的内容，学到了！',
            delayMin: 3,
            delayMax: 8,
            checkDuplication: true,
          }
        }
      ];
      
      // 应用过滤器
      let filteredTasks = mockTasks;
      if (filter) {
        if (filter.type) {
          filteredTasks = filteredTasks.filter(task => task.type === filter.type);
        }
        if (filter.status) {
          filteredTasks = filteredTasks.filter(task => task.status === filter.status);
        }
        if (filter.priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
        }
        if (filter.deviceId) {
          filteredTasks = filteredTasks.filter(task => task.deviceId === filter.deviceId);
        }
      }
      
      setTasks(filteredTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建任务
  const createTask = useCallback(async (taskData: SemiAutoTaskCreate): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      // 模拟创建任务
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTask: SemiAutoTask = {
        ...taskData,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        progress: 0,
        priority: taskData.priority || 'medium',
        description: taskData.description || '',
      };
      
      setTasks(prev => [newTask, ...prev]);
      return newTask.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新任务
  const updateTask = useCallback(async (update: SemiAutoTaskUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      // 模拟更新任务
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setTasks(prev => prev.map(task => 
        task.id === update.id
          ? { ...task, ...update, updatedAt: new Date().toISOString() }
          : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新任务失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除任务
  const deleteTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 模拟删除任务
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除任务失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 执行任务
  const executeTask = useCallback(async (taskId: string, deviceId?: string) => {
    await updateTask({
      id: taskId,
      status: 'executing',
      progress: 0,
      ...(deviceId && { deviceId })
    });
    
    // 模拟任务执行进度
    const progressInterval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.id === taskId && task.status === 'executing') {
          const newProgress = Math.min(task.progress + Math.random() * 20, 100);
          return { ...task, progress: newProgress };
        }
        return task;
      }));
    }, 1000);
    
    // 模拟任务完成
    setTimeout(async () => {
      clearInterval(progressInterval);
      await updateTask({
        id: taskId,
        status: 'completed',
        progress: 100,
        result: {
          success: true,
          message: '任务执行成功',
          data: { processedCount: 25 }
        }
      });
    }, 5000);
  }, [updateTask]);

  // 暂停任务
  const pauseTask = useCallback(async (taskId: string) => {
    await updateTask({
      id: taskId,
      status: 'paused'
    });
  }, [updateTask]);

  // 重新开始任务
  const resumeTask = useCallback(async (taskId: string) => {
    await updateTask({
      id: taskId,
      status: 'executing'
    });
  }, [updateTask]);

  // 获取统计数据
  const getStats = useCallback((): SemiAutoTaskStats => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const executing = tasks.filter(t => t.status === 'executing').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const paused = tasks.filter(t => t.status === 'paused').length;
    
    const successRate = total > 0 ? (completed / total) * 100 : 0;
    const avgExecutionTime = 0; // 实际计算需要基于历史数据
    
    return {
      total,
      pending,
      executing,
      completed,
      failed,
      paused,
      successRate,
      avgExecutionTime
    };
  }, [tasks]);

  // 初始加载
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    executeTask,
    pauseTask,
    resumeTask,
    getStats
  };
};