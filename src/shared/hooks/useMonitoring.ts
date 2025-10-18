// src/shared/hooks/useMonitoring.ts
// module: shared | layer: hooks | role: unified-monitoring
// summary: 统一监控Hook，支持account和industry类型，消除重复代码

/**
 * 统一监控Hook
 * 
 * 🎯 目标：
 * - 消除useAccountMonitoring和useIndustryMonitoring的重复逻辑
 * - 提供统一的监控任务管理功能
 * - 支持不同类型的监控（账号、行业等）
 * - 保持向后兼容性
 * 
 * 🔄 重构说明：
 * - 提取共同的状态管理逻辑
 * - 通过type参数区分不同监控类型
 * - 统一的API接口设计
 */
import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { monitoringService } from '../../pages/precise-acquisition/services/monitoringService';
import type { 
  MonitoringTask, 
  CommentData,
  CreateMonitoringTaskConfig
} from '../../pages/precise-acquisition/services/monitoringService';
import type { MonitoringTaskType } from '../../pages/precise-acquisition/shared/types/monitoringTypes';

export type MonitoringType = 'account' | 'industry' | 'video';

interface UseMonitoringReturn {
  tasks: MonitoringTask[];
  comments: CommentData[];
  loading: boolean;
  stats: {
    totalTasks: number;
    activeTasks: number;
    pendingComments: number;
    totalReplies: number;
  };
  loadTasks: () => Promise<void>;
  loadComments: () => Promise<void>;
  createTask: (config: Partial<MonitoringTask>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<MonitoringTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  updateComment: (commentId: string, updates: Partial<CommentData>) => Promise<void>;
  refreshAll: () => Promise<void>;
}

/**
 * 统一监控Hook
 * @param type 监控类型：'account' | 'industry' | 'video'
 */
export const useMonitoring = (type: MonitoringType): UseMonitoringReturn => {
  const [tasks, setTasks] = useState<MonitoringTask[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);

  // 根据类型过滤任务
  const filterTasksByType = useCallback((taskList: MonitoringTask[]) => {
    if (type === 'account') {
      // 账号监控包含 account 和 video 类型
      return taskList.filter(task => task.type === 'account' || task.type === 'video');
    }
    return taskList.filter(task => task.type === type);
  }, [type]);

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const taskList = await monitoringService.getTasks();
      setTasks(filterTasksByType(taskList));
    } catch (error) {
      console.error(`Failed to load ${type} monitoring tasks:`, error);
      message.error(`加载${type === 'account' ? '账号' : '行业'}监控任务失败`);
    } finally {
      setLoading(false);
    }
  }, [type, filterTasksByType]);

  // 加载评论数据
  const loadComments = useCallback(async () => {
    try {
      // 获取所有任务的评论数据
      const allComments: CommentData[] = [];
      for (const task of tasks) {
        const taskComments = await monitoringService.getCommentsByTask(task.id);
        allComments.push(...taskComments);
      }
      setComments(allComments);
    } catch (error) {
      console.error(`Failed to load ${type} monitoring comments:`, error);
      message.error(`加载${type === 'account' ? '账号' : '行业'}评论数据失败`);
    }
  }, [tasks, type]);

  // 创建任务
  const createTask = useCallback(async (config: Partial<MonitoringTask>) => {
    try {
      // 确保必需字段存在
      const taskConfig: CreateMonitoringTaskConfig = {
        name: config.name || `${type === 'account' ? '账号' : '行业'}监控任务-${Date.now()}`,
        type: type as MonitoringTaskType,
        keywords: config.keywords,
        targetAccount: config.targetAccount,
        targetVideo: config.targetVideo,
        filters: config.filters,
        assignedDevices: config.assignedDevices,
      };
      
      const newTask = await monitoringService.createTask(taskConfig);
      setTasks(prev => [...prev, newTask]);
      message.success('监控任务创建成功');
    } catch (error) {
      console.error(`Failed to create ${type} monitoring task:`, error);
      message.error('创建任务失败');
    }
  }, [type]);

  // 更新任务
  const updateTask = useCallback(async (taskId: string, updates: Partial<MonitoringTask>) => {
    try {
      await monitoringService.updateTask(taskId, updates);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ));
      message.success('任务更新成功');
    } catch (error) {
      console.error(`Failed to update ${type} monitoring task:`, error);
      message.error('任务更新失败');
    }
  }, [type]);

  // 删除任务
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await monitoringService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      message.success('任务删除成功');
    } catch (error) {
      console.error(`Failed to delete ${type} monitoring task:`, error);
      message.error('任务删除失败');
    }
  }, [type]);

  // 切换任务状态
  const toggleTaskStatus = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'active' ? 'paused' : 'active';
    await updateTask(taskId, { status: newStatus });
  }, [tasks, updateTask]);

  // 更新评论
  const updateComment = useCallback(async (commentId: string, updates: Partial<CommentData>) => {
    try {
      if (updates.status) {
        await monitoringService.updateCommentStatus(commentId, updates.status);
      }
      
      setComments(prev => prev.map(comment =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      ));
      
      if (updates.status === 'replied') {
        message.success('回复处理成功');
      }
    } catch (error) {
      console.error(`Failed to update ${type} monitoring comment:`, error);
      message.error('更新评论失败');
    }
  }, [type]);

  // 刷新所有数据
  const refreshAll = useCallback(async () => {
    await Promise.all([loadTasks(), loadComments()]);
  }, [loadTasks, loadComments]);

  // 计算统计数据
  const stats = {
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => t.status === 'active').length,
    pendingComments: comments.filter(c => c.status === 'pending').length,
    totalReplies: comments.filter(c => c.status === 'replied').length
  };

  // 初始化数据
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    tasks,
    comments,
    loading,
    stats,
    loadTasks,
    loadComments,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    updateComment,
    refreshAll
  };
};

// 向后兼容的专用Hook
export const useAccountMonitoring = () => useMonitoring('account');
export const useIndustryMonitoring = () => useMonitoring('industry');