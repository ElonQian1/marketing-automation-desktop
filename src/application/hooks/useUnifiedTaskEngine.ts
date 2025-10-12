// src/application/hooks/useUnifiedTaskEngine.ts
// module: application | layer: application | role: hook
// summary: React Hook

/**
 * 统一任务引擎Hook
 * 
 * 🎯 目标：提供统一的React Hook接口
 * 🔄 策略：整合useTaskEngine和useTaskManagement等分散的Hook
 * 📅 创建：任务引擎架构整合阶段
 * 
 * ✅ 功能整合：
 * - 任务生成、执行、查询、管理
 * - 实时状态更新
 * - 错误处理和重试
 * - 统计和监控
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  enhancedTaskEngineManager,
  UnifiedTaskGenerationParams,
  UnifiedTaskGenerationResult,
  UnifiedTaskExecutionParams,
  UnifiedTaskExecutionResult,
  UnifiedTaskQueryParams,
  UnifiedTaskQueryResult,
  UnifiedTaskAssignmentResult,
  UnifiedTaskExecutionStats
} from '../services/task-execution/EnhancedTaskEngineManager';

import { Task } from '../../modules/precise-acquisition/shared/types/core';
import { TaskStatus } from '../../constants/precise-acquisition-enums';

// ==================== Hook状态接口 ====================

export interface UseUnifiedTaskEngineState {
  // 🔄 任务数据
  tasks: Task[];
  currentTask: Task | null;
  
  // 🔄 加载状态
  isGenerating: boolean;
  isExecuting: boolean;
  isQuerying: boolean;
  isManaging: boolean;
  
  // 🔄 错误处理
  generationError: string | null;
  executionError: string | null;
  queryError: string | null;
  managementError: string | null;
  
  // 🔄 统计信息
  stats: UnifiedTaskExecutionStats | null;
  
  // 🔄 分页信息
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UseUnifiedTaskEngineActions {
  // 🎯 任务生成
  generateTasks: (params: UnifiedTaskGenerationParams) => Promise<UnifiedTaskGenerationResult>;
  batchGenerateTasks: (params: UnifiedTaskGenerationParams[]) => Promise<UnifiedTaskGenerationResult[]>;
  
  // 🎯 任务执行
  executeTask: (params: UnifiedTaskExecutionParams) => Promise<UnifiedTaskExecutionResult>;
  executeTasks: (tasks: Task[], devices?: any[]) => Promise<UnifiedTaskExecutionResult[]>;
  
  // 🎯 任务查询
  queryTasks: (params: UnifiedTaskQueryParams) => Promise<UnifiedTaskQueryResult>;
  refreshTasks: () => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  getTaskById: (taskId: string) => Promise<Task | null>;
  
  // 🎯 任务管理
  assignTasksToDevice: (deviceId: string, taskIds: string[]) => Promise<UnifiedTaskAssignmentResult>;
  updateTaskStatus: (taskId: string, status: TaskStatus, result?: any, error?: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  retryTask: (taskId: string) => Promise<UnifiedTaskExecutionResult>;
  
  // 🎯 统计功能
  loadStats: (since?: Date) => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // 🎯 状态管理
  clearErrors: () => void;
  resetState: () => void;
  setCurrentTask: (task: Task | null) => void;
}

export type UseUnifiedTaskEngineReturn = UseUnifiedTaskEngineState & UseUnifiedTaskEngineActions;

// ==================== Hook配置选项 ====================

export interface UseUnifiedTaskEngineOptions {
  // 🔄 自动加载选项
  autoLoad?: boolean;
  autoLoadParams?: UnifiedTaskQueryParams;
  
  // 🔄 实时更新选项
  enableRealTimeUpdates?: boolean;
  updateInterval?: number; // 毫秒
  
  // 🔄 错误重试选项
  enableAutoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number; // 毫秒
  
  // 🔄 缓存选项
  enableCaching?: boolean;
  cacheTimeout?: number; // 毫秒
  
  // 🔄 分页选项
  defaultPageSize?: number;
  maxPageSize?: number;
}

const DEFAULT_OPTIONS: UseUnifiedTaskEngineOptions = {
  autoLoad: true,
  autoLoadParams: { page: 1, page_size: 20 },
  enableRealTimeUpdates: false,
  updateInterval: 30000, // 30秒
  enableAutoRetry: true,
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  enableCaching: true,
  cacheTimeout: 300000, // 5分钟
  defaultPageSize: 20,
  maxPageSize: 100
};

// ==================== 主Hook实现 ====================

/**
 * 🎯 统一任务引擎Hook
 * 
 * 提供完整的任务引擎功能访问
 */
export function useUnifiedTaskEngine(
  options: UseUnifiedTaskEngineOptions = {}
): UseUnifiedTaskEngineReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // ==================== 状态管理 ====================
  
  const [state, setState] = useState<UseUnifiedTaskEngineState>({
    tasks: [],
    currentTask: null,
    isGenerating: false,
    isExecuting: false,
    isQuerying: false,
    isManaging: false,
    generationError: null,
    executionError: null,
    queryError: null,
    managementError: null,
    stats: null,
    pagination: {
      page: 1,
      pageSize: opts.defaultPageSize || 20,
      total: 0,
      hasMore: false
    }
  });

  // 缓存和定时器引用
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // ==================== 辅助函数 ====================

  /**
   * 🔧 更新状态
   */
  const updateState = useCallback((updates: Partial<UseUnifiedTaskEngineState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 🔧 清除错误
   */
  const clearErrors = useCallback(() => {
    updateState({
      generationError: null,
      executionError: null,
      queryError: null,
      managementError: null
    });
  }, [updateState]);

  /**
   * 🔧 重置状态
   */
  const resetState = useCallback(() => {
    setState({
      tasks: [],
      currentTask: null,
      isGenerating: false,
      isExecuting: false,
      isQuerying: false,
      isManaging: false,
      generationError: null,
      executionError: null,
      queryError: null,
      managementError: null,
      stats: null,
      pagination: {
        page: 1,
        pageSize: opts.defaultPageSize || 20,
        total: 0,
        hasMore: false
      }
    });
    cacheRef.current.clear();
    retryCountRef.current.clear();
  }, [opts.defaultPageSize]);

  /**
   * 🔧 设置当前任务
   */
  const setCurrentTask = useCallback((task: Task | null) => {
    updateState({ currentTask: task });
  }, [updateState]);

  /**
   * 🔧 缓存操作
   */
  const getCachedData = useCallback((key: string) => {
    if (!opts.enableCaching) return null;
    
    const cached = cacheRef.current.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > (opts.cacheTimeout || 300000)) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [opts.enableCaching, opts.cacheTimeout]);

  const setCachedData = useCallback((key: string, data: any) => {
    if (!opts.enableCaching) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, [opts.enableCaching]);

  /**
   * 🔧 错误重试逻辑
   */
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    key: string,
    maxRetries: number = opts.maxRetries || 3
  ): Promise<T> => {
    const retryCount = retryCountRef.current.get(key) || 0;
    
    try {
      const result = await operation();
      retryCountRef.current.delete(key); // 成功后清除重试计数
      return result;
    } catch (error) {
      if (opts.enableAutoRetry && retryCount < maxRetries) {
        retryCountRef.current.set(key, retryCount + 1);
        
        // 等待重试延迟
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay || 1000));
        
        console.warn(`重试操作 ${key}, 次数: ${retryCount + 1}/${maxRetries}`);
        return withRetry(operation, key, maxRetries);
      }
      
      throw error;
    }
  }, [opts.enableAutoRetry, opts.maxRetries, opts.retryDelay]);

  // ==================== 任务生成 ====================

  /**
   * 🎯 生成任务
   */
  const generateTasks = useCallback(async (
    params: UnifiedTaskGenerationParams
  ): Promise<UnifiedTaskGenerationResult> => {
    updateState({ isGenerating: true, generationError: null });
    
    try {
      const result = await withRetry(
        () => enhancedTaskEngineManager.generateTasks(params),
        `generate-${params.target.id}`
      );
      
      // 🔄 更新任务列表
      updateState({ 
        tasks: [...state.tasks, ...result.generated_tasks],
        isGenerating: false 
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '任务生成失败';
      updateState({ 
        isGenerating: false, 
        generationError: errorMessage 
      });
      throw error;
    }
  }, [state.tasks, updateState, withRetry]);

  /**
   * 🔄 批量生成任务
   */
  const batchGenerateTasks = useCallback(async (
    params: UnifiedTaskGenerationParams[]
  ): Promise<UnifiedTaskGenerationResult[]> => {
    updateState({ isGenerating: true, generationError: null });
    
    try {
      const results = await withRetry(
        () => enhancedTaskEngineManager.batchGenerateTasks(params),
        `batch-generate-${params.length}`
      );
      
      // 🔄 合并新生成的任务
      const newTasks = results.flatMap(r => r.generated_tasks);
      updateState({ 
        tasks: [...state.tasks, ...newTasks],
        isGenerating: false 
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量任务生成失败';
      updateState({ 
        isGenerating: false, 
        generationError: errorMessage 
      });
      throw error;
    }
  }, [state.tasks, updateState, withRetry]);

  // ==================== 任务执行 ====================

  /**
   * 🎯 执行任务
   */
  const executeTask = useCallback(async (
    params: UnifiedTaskExecutionParams
  ): Promise<UnifiedTaskExecutionResult> => {
    updateState({ isExecuting: true, executionError: null });
    
    try {
      const result = await withRetry(
        () => enhancedTaskEngineManager.executeTask(params),
        `execute-${params.task.id}`
      );
      
      // 🔄 更新任务状态
      const updatedTasks = state.tasks.map(task => 
        task.id === params.task.id 
          ? { ...task, status: result.status }
          : task
      );
      
      updateState({ 
        tasks: updatedTasks,
        isExecuting: false 
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '任务执行失败';
      updateState({ 
        isExecuting: false, 
        executionError: errorMessage 
      });
      throw error;
    }
  }, [state.tasks, updateState, withRetry]);

  /**
   * 🔄 批量执行任务
   */
  const executeTasks = useCallback(async (
    tasks: Task[], 
    devices?: any[]
  ): Promise<UnifiedTaskExecutionResult[]> => {
    updateState({ isExecuting: true, executionError: null });
    
    try {
      const results = await withRetry(
        () => enhancedTaskEngineManager.executeTasks(tasks, devices),
        `batch-execute-${tasks.length}`
      );
      
      // 🔄 批量更新任务状态
      const taskStatusMap = new Map(results.map(r => [r.task_id, r.status]));
      const updatedTasks = state.tasks.map(task => 
        taskStatusMap.has(task.id)
          ? { ...task, status: taskStatusMap.get(task.id)! }
          : task
      );
      
      updateState({ 
        tasks: updatedTasks,
        isExecuting: false 
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量任务执行失败';
      updateState({ 
        isExecuting: false, 
        executionError: errorMessage 
      });
      throw error;
    }
  }, [state.tasks, updateState, withRetry]);

  // ==================== 任务查询 ====================

  /**
   * 🎯 查询任务
   */
  const queryTasks = useCallback(async (
    params: UnifiedTaskQueryParams
  ): Promise<UnifiedTaskQueryResult> => {
    updateState({ isQuerying: true, queryError: null });
    
    try {
      // 🔄 检查缓存
      const cacheKey = JSON.stringify(params);
      let cachedResult = getCachedData(cacheKey);
      
      if (!cachedResult) {
        cachedResult = await withRetry(
          () => enhancedTaskEngineManager.getTasks(params),
          `query-${cacheKey.slice(0, 20)}`
        );
        setCachedData(cacheKey, cachedResult);
      }
      
      // 🔄 更新状态
      updateState({ 
        tasks: cachedResult.tasks,
        pagination: {
          page: cachedResult.page,
          pageSize: cachedResult.page_size,
          total: cachedResult.total,
          hasMore: cachedResult.has_more
        },
        isQuerying: false 
      });
      
      return cachedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '任务查询失败';
      updateState({ 
        isQuerying: false, 
        queryError: errorMessage 
      });
      throw error;
    }
  }, [updateState, withRetry, getCachedData, setCachedData]);

  /**
   * 🔄 刷新任务
   */
  const refreshTasks = useCallback(async () => {
    if (opts.autoLoadParams) {
      await queryTasks(opts.autoLoadParams);
    }
  }, [queryTasks, opts.autoLoadParams]);

  /**
   * 🔄 加载更多任务
   */
  const loadMoreTasks = useCallback(async () => {
    if (!state.pagination.hasMore || state.isQuerying) return;
    
    const nextPage = state.pagination.page + 1;
    const params: UnifiedTaskQueryParams = {
      ...opts.autoLoadParams,
      page: nextPage,
      page_size: state.pagination.pageSize
    };
    
    try {
      const result = await queryTasks(params);
      
      // 🔄 追加任务而不是替换
      updateState({ 
        tasks: [...state.tasks, ...result.tasks]
      });
    } catch (error) {
      console.error('加载更多任务失败:', error);
    }
  }, [state.pagination, state.isQuerying, state.tasks, queryTasks, opts.autoLoadParams, updateState]);

  /**
   * 🔄 获取单个任务详情
   */
  const getTaskById = useCallback(async (taskId: string): Promise<Task | null> => {
    try {
      return await withRetry(
        () => enhancedTaskEngineManager.getTaskById(taskId),
        `get-task-${taskId}`
      );
    } catch (error) {
      console.error('获取任务详情失败:', error);
      return null;
    }
  }, [withRetry]);

  // ==================== 任务管理 ====================

  /**
   * 🎯 分配任务给设备
   */
  const assignTasksToDevice = useCallback(async (
    deviceId: string, 
    taskIds: string[]
  ): Promise<UnifiedTaskAssignmentResult> => {
    updateState({ isManaging: true, managementError: null });
    
    try {
      const result = await withRetry(
        () => enhancedTaskEngineManager.assignTasksToDevice(deviceId, taskIds),
        `assign-${deviceId}-${taskIds.length}`
      );
      
      updateState({ isManaging: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '任务分配失败';
      updateState({ 
        isManaging: false, 
        managementError: errorMessage 
      });
      throw error;
    }
  }, [updateState, withRetry]);

  /**
   * 🔄 更新任务状态
   */
  const updateTaskStatus = useCallback(async (
    taskId: string, 
    status: TaskStatus, 
    result?: any, 
    error?: string
  ): Promise<void> => {
    updateState({ isManaging: true, managementError: null });
    
    try {
      await withRetry(
        () => enhancedTaskEngineManager.updateTaskStatus(taskId, status, result, error),
        `update-status-${taskId}`
      );
      
      // 🔄 本地更新任务状态
      const updatedTasks = state.tasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      );
      
      updateState({ 
        tasks: updatedTasks,
        isManaging: false 
      });
    } catch (updateError) {
      const errorMessage = updateError instanceof Error ? updateError.message : '更新任务状态失败';
      updateState({ 
        isManaging: false, 
        managementError: errorMessage 
      });
      throw updateError;
    }
  }, [state.tasks, updateState, withRetry]);

  /**
   * 🔄 取消任务
   */
  const cancelTask = useCallback(async (taskId: string): Promise<void> => {
    await updateTaskStatus(taskId, TaskStatus.CANCELLED);
  }, [updateTaskStatus]);

  /**
   * 🔄 重试任务
   */
  const retryTask = useCallback(async (taskId: string): Promise<UnifiedTaskExecutionResult> => {
    updateState({ isExecuting: true, executionError: null });
    
    try {
      const result = await withRetry(
        () => enhancedTaskEngineManager.retryTask(taskId),
        `retry-${taskId}`
      );
      
      // 🔄 更新任务状态
      const updatedTasks = state.tasks.map(task => 
        task.id === taskId ? { ...task, status: result.status } : task
      );
      
      updateState({ 
        tasks: updatedTasks,
        isExecuting: false 
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重试任务失败';
      updateState({ 
        isExecuting: false, 
        executionError: errorMessage 
      });
      throw error;
    }
  }, [state.tasks, updateState, withRetry]);

  // ==================== 统计功能 ====================

  /**
   * 🎯 加载统计数据
   */
  const loadStats = useCallback(async (since?: Date): Promise<void> => {
    try {
      const stats = await withRetry(
        () => enhancedTaskEngineManager.getExecutionStats(since),
        `stats-${since?.getTime() || 'all'}`
      );
      
      updateState({ stats });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, [updateState, withRetry]);

  /**
   * 🔄 刷新统计数据
   */
  const refreshStats = useCallback(async (): Promise<void> => {
    await loadStats();
  }, [loadStats]);

  // ==================== 生命周期 ====================

  /**
   * 🔄 自动加载
   */
  useEffect(() => {
    if (opts.autoLoad && opts.autoLoadParams) {
      queryTasks(opts.autoLoadParams).catch(console.error);
    }
  }, [opts.autoLoad, opts.autoLoadParams, queryTasks]);

  /**
   * 🔄 实时更新
   */
  useEffect(() => {
    if (opts.enableRealTimeUpdates && opts.updateInterval) {
      intervalRef.current = setInterval(() => {
        refreshTasks().catch(console.error);
      }, opts.updateInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [opts.enableRealTimeUpdates, opts.updateInterval, refreshTasks]);

  /**
   * 🔄 清理
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ==================== 返回Hook接口 ====================

  return {
    // 状态
    ...state,
    
    // 动作
    generateTasks,
    batchGenerateTasks,
    executeTask,
    executeTasks,
    queryTasks,
    refreshTasks,
    loadMoreTasks,
    getTaskById,
    assignTasksToDevice,
    updateTaskStatus,
    cancelTask,
    retryTask,
    loadStats,
    refreshStats,
    clearErrors,
    resetState,
    setCurrentTask
  };
}

// ==================== 便捷Hook变体 ====================

/**
 * 🔄 简化的任务生成Hook
 */
export function useTaskGeneration() {
  const { generateTasks, batchGenerateTasks, isGenerating, generationError } = useUnifiedTaskEngine({
    autoLoad: false
  });
  
  return {
    generateTasks,
    batchGenerateTasks,
    isGenerating,
    generationError
  };
}

/**
 * 🔄 简化的任务执行Hook
 */
export function useTaskExecution() {
  const { executeTask, executeTasks, retryTask, isExecuting, executionError } = useUnifiedTaskEngine({
    autoLoad: false
  });
  
  return {
    executeTask,
    executeTasks,
    retryTask,
    isExecuting,
    executionError
  };
}

/**
 * 🔄 简化的任务查询Hook
 */
export function useTaskQuery(params?: UnifiedTaskQueryParams) {
  return useUnifiedTaskEngine({
    autoLoad: !!params,
    autoLoadParams: params,
    enableRealTimeUpdates: true
  });
}

/**
 * 🔄 简化的任务统计Hook
 */
export function useTaskStats(since?: Date) {
  const { stats, loadStats, refreshStats } = useUnifiedTaskEngine({
    autoLoad: false
  });
  
  useEffect(() => {
    loadStats(since);
  }, [loadStats, since]);
  
  return {
    stats,
    loadStats,
    refreshStats
  };
}

// ==================== 向后兼容导出 ====================

// 现有Hook兼容性
export { useUnifiedTaskEngine as useTaskEngine };
export { useUnifiedTaskEngine as useTaskManagement };
export { useUnifiedTaskEngine as useEnhancedTaskEngine };

// 类型已在上方单独导出，无需重复导出