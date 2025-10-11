// src/pages/precise-acquisition/modules/industry-monitoring/hooks/useIndustryMonitoring.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 行业监控Hook
 * 
 * 管理行业监控任务的状态和操作
 */
import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { monitoringService } from '../../../services/monitoringService';
import type { MonitoringTask, CommentData } from '../../../services/monitoringService';

interface UseIndustryMonitoringReturn {
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

export const useIndustryMonitoring = (): UseIndustryMonitoringReturn => {
  const [tasks, setTasks] = useState<MonitoringTask[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const taskList = await monitoringService.getTasks();
      setTasks(taskList.filter(task => task.type === 'industry'));
    } catch (error) {
      console.error('加载任务失败:', error);
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

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
      console.error('加载评论失败:', error);
      message.error('加载评论失败');
    }
  }, [tasks]);

  // 创建任务
  const createTask = useCallback(async (config: Partial<MonitoringTask>) => {
    try {
      const newTask = await monitoringService.createTask({
        ...config,
        type: 'industry'
      });
      setTasks(prev => [...prev, newTask]);
      message.success('任务创建成功');
    } catch (error) {
      console.error('创建任务失败:', error);
      message.error('创建任务失败');
    }
  }, []);

  // 更新任务
  const updateTask = useCallback(async (taskId: string, updates: Partial<MonitoringTask>) => {
    try {
      await monitoringService.updateTask(taskId, updates);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ));
      message.success('任务更新成功');
    } catch (error) {
      console.error('更新任务失败:', error);
      message.error('更新任务失败');
    }
  }, []);

  // 删除任务
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await monitoringService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      message.success('任务删除成功');
    } catch (error) {
      console.error('删除任务失败:', error);
      message.error('删除任务失败');
    }
  }, []);

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
      console.error('更新评论失败:', error);
      message.error('更新评论失败');
    }
  }, []);

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