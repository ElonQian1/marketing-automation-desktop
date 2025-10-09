/**
 * 任务管理相关的 Hook
 * 
 * 提供任务生成、状态管理、执行监控等功能
 */

import { useState, useCallback, useEffect } from 'react';
import { preciseAcquisitionService } from '../application/services';
import { TaskType, TaskStatus, ExecutorMode } from '../constants/precise-acquisition-enums';
import type { TaskEntity } from '../domain/precise-acquisition/entities';
import type { TaskGenerationConfig, RateLimitConfig } from '../types/precise-acquisition';

/**
 * 任务管理状态
 */
export interface TaskManagementState {
  tasks: TaskEntity[];
  loading: boolean;
  stats: {
    total: number;
    new: number;
    ready: number;
    executing: number;
    done: number;
    failed: number;
  };
  rateLimitConfig: RateLimitConfig;
  error: string | null;
}

/**
 * 任务筛选参数
 */
export interface TaskFilters {
  status?: TaskStatus;
  taskType?: TaskType;
  assignAccountId?: string;
  search?: string;
}

/**
 * 使用任务管理功能的 Hook
 */
export function useTaskManagement() {
  const [state, setState] = useState<TaskManagementState>({
    tasks: [],
    loading: false,
    stats: {
      total: 0,
      new: 0,
      ready: 0,
      executing: 0,
      done: 0,
      failed: 0,
    },
    rateLimitConfig: preciseAcquisitionService.getDefaultRateLimitConfig(),
    error: null,
  });

  const [currentFilters, setCurrentFilters] = useState<TaskFilters>({});

  /**
   * 计算任务统计
   */
  const calculateStats = useCallback((tasks: TaskEntity[]) => {
    return {
      total: tasks.length,
      new: tasks.filter(t => t.status === TaskStatus.NEW).length,
      ready: tasks.filter(t => t.status === TaskStatus.READY).length,
      executing: tasks.filter(t => t.status === TaskStatus.EXECUTING).length,
      done: tasks.filter(t => t.status === TaskStatus.DONE).length,
      failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
    };
  }, []);

  /**
   * 加载任务列表
   */
  const loadTasks = useCallback(async (
    filters: TaskFilters = {},
    pagination?: { limit?: number; offset?: number }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const tasks = await preciseAcquisitionService.getTasks({
        status: filters.status,
        task_type: filters.taskType,
        assign_account_id: filters.assignAccountId,
        limit: pagination?.limit,
        offset: pagination?.offset,
      });

      const stats = calculateStats(tasks);

      setState(prev => ({
        ...prev,
        tasks,
        stats,
        loading: false,
      }));

      setCurrentFilters(filters);
      return tasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [calculateStats]);

  /**
   * 生成任务
   */
  const generateTasks = useCallback(async (config: TaskGenerationConfig) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await preciseAcquisitionService.generateTasks(config);
      
      // 重新加载任务列表
      await loadTasks(currentFilters);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [loadTasks, currentFilters]);

  /**
   * 更新任务状态
   */
  const updateTaskStatus = useCallback(async (
    taskId: string,
    status: TaskStatus,
    resultCode?: string,
    errorMessage?: string
  ) => {
    try {
      await preciseAcquisitionService.updateTaskStatus(taskId, status, resultCode as any, errorMessage);
      
      // 重新加载任务列表以获取最新状态
      await loadTasks(currentFilters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [loadTasks, currentFilters]);

  /**
   * 批量更新任务状态
   */
  const batchUpdateTaskStatus = useCallback(async (
    taskIds: string[],
    status: TaskStatus
  ) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const taskId of taskIds) {
      try {
        await updateTaskStatus(taskId, status);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`任务 ${taskId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
  }, [updateTaskStatus]);

  /**
   * 检查频控限制
   */
  const checkRateLimit = useCallback(async (accountId: string) => {
    try {
      return await preciseAcquisitionService.checkRateLimit(accountId, state.rateLimitConfig);
    } catch (error) {
      console.error('频控检查失败:', error);
      return { allowed: false, reason: '频控检查失败' };
    }
  }, [state.rateLimitConfig]);

  /**
   * 更新频控配置
   */
  const updateRateLimitConfig = useCallback((config: RateLimitConfig) => {
    setState(prev => ({ ...prev, rateLimitConfig: config }));
  }, []);

  /**
   * 获取任务详情
   */
  const getTaskById = useCallback((taskId: string) => {
    return state.tasks.find(task => task.id === taskId);
  }, [state.tasks]);

  /**
   * 获取账号任务统计
   */
  const getAccountTaskStats = useCallback((accountId: string) => {
    const accountTasks = state.tasks.filter(task => task.assignAccountId === accountId);
    return calculateStats(accountTasks);
  }, [state.tasks, calculateStats]);

  /**
   * 获取任务执行进度
   */
  const getTaskProgress = useCallback(() => {
    if (state.stats.total === 0) return 0;
    return Math.round((state.stats.done / state.stats.total) * 100);
  }, [state.stats]);

  /**
   * 获取任务成功率
   */
  const getTaskSuccessRate = useCallback(() => {
    const completedTasks = state.stats.done + state.stats.failed;
    if (completedTasks === 0) return 0;
    return Math.round((state.stats.done / completedTasks) * 100);
  }, [state.stats]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      tasks: [],
      loading: false,
      stats: {
        total: 0,
        new: 0,
        ready: 0,
        executing: 0,
        done: 0,
        failed: 0,
      },
      rateLimitConfig: preciseAcquisitionService.getDefaultRateLimitConfig(),
      error: null,
    });
    setCurrentFilters({});
  }, []);

  // 自动加载初始数据
  useEffect(() => {
    loadTasks();
  }, []);

  return {
    // 状态
    ...state,
    currentFilters,
    
    // 基础操作
    loadTasks,
    generateTasks,
    updateTaskStatus,
    batchUpdateTaskStatus,
    
    // 频控相关
    checkRateLimit,
    updateRateLimitConfig,
    
    // 查询和统计
    getTaskById,
    getAccountTaskStats,
    getTaskProgress,
    getTaskSuccessRate,
    
    // 工具方法
    clearError,
    reset,
  };
}