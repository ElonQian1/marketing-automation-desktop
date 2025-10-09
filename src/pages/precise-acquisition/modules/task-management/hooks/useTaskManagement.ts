/**
 * 任务管理Hook
 * 
 * 管理任务的创建、执行、状态更新等逻辑
 */
import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import { TaskItem } from '../components/TaskStatusCard';

interface UseTaskManagementOptions {
  maxConcurrentTasks?: number;
  autoStart?: boolean;
}

interface UseTaskManagementReturn {
  tasks: TaskItem[];
  runningTasks: TaskItem[];
  addTask: (task: Omit<TaskItem, 'id' | 'status' | 'progress'>) => string;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
  restartTask: (taskId: string) => void;
  reorderTasks: (newTasks: TaskItem[]) => void;
  clearCompletedTasks: () => void;
  startNextPendingTask: () => void;
}

export const useTaskManagement = (
  options: UseTaskManagementOptions = {}
): UseTaskManagementReturn => {
  const { maxConcurrentTasks = 3, autoStart = false } = options;
  
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const taskExecutors = useRef<Map<string, AbortController>>(new Map());

  // 计算运行中的任务
  const runningTasks = tasks.filter(task => task.status === 'running');

  // 添加任务
  const addTask = useCallback((taskData: Omit<TaskItem, 'id' | 'status' | 'progress'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      startTime: undefined
    };

    setTasks(prev => [...prev, newTask]);

    // 如果启用自动开始且当前运行任务数未达到上限，立即开始任务
    if (autoStart && runningTasks.length < maxConcurrentTasks) {
      setTimeout(() => startTask(newTask.id), 100);
    }

    message.success(`任务 "${taskData.name}" 已添加到队列`);
    return newTask.id;
  }, [autoStart, maxConcurrentTasks, runningTasks.length]);

  // 删除任务
  const removeTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 如果任务正在运行，先停止它
    if (task.status === 'running') {
      stopTask(taskId);
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
    message.success(`任务 "${task.name}" 已删除`);
  }, [tasks]);

  // 更新任务
  const updateTask = useCallback((taskId: string, updates: Partial<TaskItem>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  // 开始任务
  const startTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 检查并发限制
    if (runningTasks.length >= maxConcurrentTasks) {
      message.warning(`同时运行的任务不能超过 ${maxConcurrentTasks} 个`);
      return;
    }

    // 创建 AbortController 用于取消任务
    const controller = new AbortController();
    taskExecutors.current.set(taskId, controller);

    // 更新任务状态
    updateTask(taskId, {
      status: 'running',
      startTime: new Date().toLocaleString(),
      errorMessage: undefined
    });

    try {
      // 模拟任务执行过程
      await executeTask(task, controller.signal, (progress) => {
        updateTask(taskId, { progress });
      });

      // 任务完成
      updateTask(taskId, {
        status: 'completed',
        progress: 100
      });

      message.success(`任务 "${task.name}" 执行完成`);

      // 自动开始下一个等待中的任务
      setTimeout(() => startNextPendingTask(), 1000);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 任务被取消
        updateTask(taskId, { status: 'paused' });
      } else {
        // 任务执行失败
        updateTask(taskId, {
          status: 'failed',
          errorMessage: error.message || '未知错误'
        });
        message.error(`任务 "${task.name}" 执行失败: ${error.message}`);
      }
    } finally {
      taskExecutors.current.delete(taskId);
    }
  }, [tasks, runningTasks.length, maxConcurrentTasks, updateTask]);

  // 暂停任务
  const pauseTask = useCallback((taskId: string) => {
    const controller = taskExecutors.current.get(taskId);
    if (controller) {
      controller.abort();
    }
  }, []);

  // 停止任务
  const stopTask = useCallback((taskId: string) => {
    const controller = taskExecutors.current.get(taskId);
    if (controller) {
      controller.abort();
    }

    updateTask(taskId, {
      status: 'pending',
      progress: 0,
      startTime: undefined,
      errorMessage: undefined
    });
  }, [updateTask]);

  // 重启任务
  const restartTask = useCallback((taskId: string) => {
    updateTask(taskId, {
      status: 'pending',
      progress: 0,
      startTime: undefined,
      errorMessage: undefined
    });

    // 如果启用自动开始，立即开始任务
    if (autoStart && runningTasks.length < maxConcurrentTasks) {
      setTimeout(() => startTask(taskId), 100);
    }
  }, [updateTask, autoStart, runningTasks.length, maxConcurrentTasks, startTask]);

  // 重新排序任务
  const reorderTasks = useCallback((newTasks: TaskItem[]) => {
    setTasks(newTasks);
  }, []);

  // 清除已完成的任务
  const clearCompletedTasks = useCallback(() => {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    setTasks(prev => prev.filter(t => t.status !== 'completed'));
    
    if (completedCount > 0) {
      message.success(`已清除 ${completedCount} 个已完成的任务`);
    }
  }, [tasks]);

  // 开始下一个等待中的任务
  const startNextPendingTask = useCallback(() => {
    if (runningTasks.length >= maxConcurrentTasks) return;

    const nextTask = tasks.find(t => t.status === 'pending');
    if (nextTask) {
      startTask(nextTask.id);
    }
  }, [tasks, runningTasks.length, maxConcurrentTasks, startTask]);

  return {
    tasks,
    runningTasks,
    addTask,
    removeTask,
    updateTask,
    startTask,
    pauseTask,
    stopTask,
    restartTask,
    reorderTasks,
    clearCompletedTasks,
    startNextPendingTask
  };
};

// 模拟任务执行函数
async function executeTask(
  task: TaskItem,
  signal: AbortSignal,
  onProgress: (progress: number) => void
): Promise<void> {
  const totalSteps = 100;
  const stepDelay = 50; // 50ms per step

  for (let i = 0; i <= totalSteps; i++) {
    if (signal.aborted) {
      throw new Error('Task was cancelled');
    }

    onProgress(i);
    
    // 模拟一些任务可能失败
    if (Math.random() < 0.01 && i > 50) { // 1% 概率在50%进度后失败
      throw new Error('Random task failure for testing');
    }

    await new Promise(resolve => setTimeout(resolve, stepDelay));
  }
}