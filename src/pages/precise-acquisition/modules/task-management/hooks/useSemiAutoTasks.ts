import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type { Device } from '../../../../../domain/adb/entities/Device';
import { ExecutorMode } from '../../../../../constants/precise-acquisition-enums';
import { monitoringService } from '../../../services/monitoringService';
import type { ReplyTask } from '../../../services/monitoringService';
import type { SemiAutoTask } from './types';

const buildMockFollowTasks = (onlineDevices: Device[]): SemiAutoTask[] => {
  const primaryDevice = onlineDevices[0];

  return [
    {
      id: 'follow_1',
      type: 'follow',
      status: 'pending',
      priority: 'high',
      targetId: 'user_001',
      targetName: '产品经理小王',
      assignedDevice: primaryDevice?.id,
      assignAccountId: 'follow_account_main',
      executorMode: ExecutorMode.API,
      dedupKey: 'follow:user_001',
      createdAt: new Date().toISOString(),
      videoUrl: 'https://example.com/video/1',
      videoTitle: '如何提升产品转化率',
    },
    {
      id: 'follow_2',
      type: 'follow',
      status: 'completed',
      priority: 'medium',
      targetId: 'user_002',
      targetName: '营销总监李总',
      assignedDevice: primaryDevice?.id,
      assignAccountId: 'follow_account_main',
      executorMode: ExecutorMode.API,
      dedupKey: 'follow:user_002',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      videoUrl: 'https://example.com/video/2',
      videoTitle: 'B2B营销打法解析',
    },
  ];
};

const transformReplyTask = (task: ReplyTask): SemiAutoTask => ({
  id: task.id,
  type: 'reply',
  status: task.status === 'pending' ? 'pending' : task.status === 'completed' ? 'completed' : 'failed',
  priority: 'medium',
  targetId: task.comment.authorId,
  targetName: task.comment.authorName,
  content: task.replyContent || task.comment.content,
  assignedDevice: task.assignedDevice,
  assignAccountId: task.assignedDevice || 'manual_ops_account',
  executorMode: ExecutorMode.MANUAL,
  dedupKey: `reply:${task.comment.id}`,
  createdAt: task.createdAt,
  completedAt: task.completedAt,
  error: task.error,
  comment: task.comment,
  videoUrl: task.comment.videoUrl,
  videoTitle: task.comment.videoTitle,
});

export interface UseSemiAutoTasksOptions {
  onlineDevices: Device[];
}

export interface UseSemiAutoTasksResult {
  tasks: SemiAutoTask[];
  loading: boolean;
  refresh: () => Promise<void>;
  executeTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, patch: Partial<SemiAutoTask>) => void;
  deleteTask: (taskId: string) => Promise<void>;
}

export function useSemiAutoTasks(options: UseSemiAutoTasksOptions): UseSemiAutoTasksResult {
  const { onlineDevices } = options;
  const [tasks, setTasks] = useState<SemiAutoTask[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [replyTasks] = await Promise.all([
        monitoringService.getReplyTasks(),
      ]);

      const mergedTasks = [
        ...buildMockFollowTasks(onlineDevices),
        ...replyTasks.map(transformReplyTask),
      ];

      setTasks(mergedTasks);
    } catch (error) {
      console.error('加载任务失败:', error);
      message.error('加载任务失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [onlineDevices]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const executeTask = useCallback(
    async (taskId: string) => {
      const snapshot = tasks.find((task) => task.id === taskId);
      if (!snapshot) {
        message.warning('任务不存在或已被移除');
        return;
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'executing',
              }
            : task,
        ),
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  error: undefined,
                }
              : task,
          ),
        );

        const actionLabel = snapshot.type === 'follow' ? '关注' : '回复';
        message.success(`${actionLabel}任务执行成功`);
      } catch (error) {
        console.error('任务执行失败:', error);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'failed',
                  error: '执行失败',
                }
              : task,
          ),
        );
        message.error('任务执行失败，请稍后重试');
      }
    },
    [tasks],
  );

  const updateTask = useCallback((taskId: string, patch: Partial<SemiAutoTask>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
            }
          : task,
      ),
    );
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    message.success('任务已删除');
  }, []);

  return {
    tasks,
    loading,
    refresh,
    executeTask,
    updateTask,
    deleteTask,
  };
}
