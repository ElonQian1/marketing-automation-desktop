import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import type { Device } from '../../../../../domain/adb/entities/Device';
import { monitoringService } from '../../../services/monitoringService';
import type { ReplyTask } from '../../../services/monitoringService';
import type {
  SemiAutoTask,
  SemiAutoTaskCreate,
  SemiAutoTaskFilter,
  SemiAutoTaskStats,
  SemiAutoTaskStatus,
  SemiAutoTaskUpdate,
} from './types';

export interface UseSemiAutoTasksOptions {
  devices?: Device[];
}

export interface UseSemiAutoTasksReturn {
  tasks: SemiAutoTask[];
  loading: boolean;
  error: string | null;
  loadTasks: (filter?: SemiAutoTaskFilter) => Promise<void>;
  createTask: (taskData: SemiAutoTaskCreate, deviceId?: string) => Promise<string>;
  updateTask: (taskId: string, patch: Partial<SemiAutoTaskUpdate>) => void;
  deleteTask: (taskId: string) => Promise<void>;
  executeTask: (taskId: string, deviceId?: string) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  resumeTask: (taskId: string, deviceId?: string) => Promise<void>;
  getStats: () => SemiAutoTaskStats;
}

const DEFAULT_MAX_RETRIES = 3;
const EXECUTION_SIMULATION_MS = 4500;

const buildMockFollowTasks = (devices: Device[] = []): SemiAutoTask[] => {
  const primaryDevice = devices[0];

  const now = Date.now();

  return [
    {
      id: 'follow_seed_001',
      type: 'follow',
      title: '关注直播高互动用户',
      description: '针对近期直播间互动频繁的用户，批量执行关注动作，维护社群热度。',
      status: 'pending',
      priority: 'high',
      deviceId: primaryDevice?.id,
      deviceName: primaryDevice?.name,
      assignAccountId: 'follow_account_main',
      executorMode: 'api',
      targetId: 'user_001',
      targetName: '产品经理小王',
      targetAccount: 'user_001',
      targetContent: '直播间互动频繁，需要重点维护',
      dedupKey: 'follow:user_001',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      retryCount: 0,
      maxRetries: DEFAULT_MAX_RETRIES,
      progress: 0,
      parameters: {
        followCount: 50,
        delayMin: 2,
        delayMax: 6,
        checkDuplication: true,
        autoSwitch: true,
      },
      statistics: {
        successCount: 18,
        failureCount: 2,
        lastExecutedAt: new Date(now - 60 * 60 * 1000).toISOString(),
      },
      metadata: { source: 'seed', category: 'follow' },
    },
    {
      id: 'follow_seed_002',
      type: 'follow',
      title: '关注新品话题潜在客户',
      description: '针对新品话题下互动的潜在客户执行关注动作，触达潜在意向用户。',
      status: 'completed',
      priority: 'medium',
      deviceId: primaryDevice?.id,
      deviceName: primaryDevice?.name,
      assignAccountId: 'follow_account_main',
      executorMode: 'api',
      targetId: 'user_002',
      targetName: '营销总监李总',
      targetAccount: 'user_002',
      targetContent: '新品话题互动活跃，需要重点回访',
      dedupKey: 'follow:user_002',
      createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      retryCount: 0,
      maxRetries: DEFAULT_MAX_RETRIES,
      progress: 100,
      parameters: {
        followCount: 30,
        delayMin: 3,
        delayMax: 5,
        checkDuplication: true,
      },
      result: {
        success: true,
        message: '累计关注 30 位潜在客户',
        data: { processedCount: 30 },
      },
      statistics: {
        successCount: 30,
        failureCount: 0,
        lastExecutedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      },
      metadata: { source: 'seed', category: 'follow' },
    },
  ];
};

const mapReplyTaskStatus = (status: ReplyTask['status']): SemiAutoTaskStatus => {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'completed':
      return 'completed';
    case 'failed':
    default:
      return 'failed';
  }
};

const transformReplyTask = (task: ReplyTask): SemiAutoTask => {
  const status = mapReplyTaskStatus(task.status);
  const baseTitle = task.comment.videoTitle || '评论回复任务';

  return {
    id: task.id,
    type: 'reply',
    title: baseTitle,
    description: task.comment.content,
    status,
    priority: 'medium',
    deviceId: task.assignedDevice,
    deviceName: task.assignedDevice,
    assignAccountId: task.assignedDevice || 'manual_ops_account',
    executorMode: 'manual',
    targetId: task.comment.authorId,
    targetName: task.comment.authorName,
    targetAccount: task.comment.authorId,
    targetContent: task.comment.content,
    content: task.replyContent || '',
    dedupKey: `reply:${task.comment.id}`,
    videoUrl: task.comment.videoUrl,
    videoTitle: task.comment.videoTitle,
    createdAt: task.createdAt,
    updatedAt: task.completedAt || task.createdAt,
    executionTime: task.completedAt,
    completedAt: task.completedAt,
    errorMessage: task.error,
    retryCount: 0,
    maxRetries: DEFAULT_MAX_RETRIES,
    progress: status === 'completed' ? 100 : status === 'pending' ? 0 : 0,
    parameters: {
      replyText: task.replyContent || '',
      delayMin: 3,
      delayMax: 6,
      checkDuplication: true,
    },
    result:
      status === 'completed'
        ? {
            success: true,
            message: '评论已回复',
            data: { replyContent: task.replyContent },
          }
        : undefined,
    metadata: { source: 'monitoring', commentId: task.comment.id },
  };
};

const applyFilter = (tasks: SemiAutoTask[], filter?: SemiAutoTaskFilter): SemiAutoTask[] => {
  if (!filter) return tasks;

  return tasks.filter((task) => {
    if (filter.type && task.type !== filter.type) return false;
    if (filter.status && task.status !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.deviceId && task.deviceId !== filter.deviceId) return false;
    if (filter.executorMode && task.executorMode !== filter.executorMode) return false;
    if (filter.dateFrom && task.createdAt < filter.dateFrom) return false;
    if (filter.dateTo && task.createdAt > filter.dateTo) return false;
    return true;
  });
};

export const useSemiAutoTasks = (
  options: UseSemiAutoTasksOptions = {},
): UseSemiAutoTasksReturn => {
  const { devices = [] } = options;

  const [tasks, setTasks] = useState<SemiAutoTask[]>([]);
  const [manualTasksState, setManualTasksState] = useState<SemiAutoTask[]>([]);
  const manualTasksRef = useRef<SemiAutoTask[]>(manualTasksState);
  const remoteTasksRef = useRef<SemiAutoTask[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setManualTasks = useCallback(
    (updater: (prev: SemiAutoTask[]) => SemiAutoTask[]) => {
      setManualTasksState((prev) => {
        const next = updater(prev);
        manualTasksRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    manualTasksRef.current = manualTasksState;
  }, [manualTasksState]);

  const mergeAndSortTasks = useCallback((base: SemiAutoTask[]): SemiAutoTask[] => {
    const manual = manualTasksRef.current;
    const merged = [
      ...manual,
      ...base.filter((task) => !manual.some((manualTask) => manualTask.id === task.id)),
    ];
    return merged.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, []);

  const loadTasks = useCallback(
    async (filter?: SemiAutoTaskFilter) => {
      setLoading(true);
      setError(null);

      try {
        const [replyTasks] = await Promise.all([
          monitoringService.getReplyTasks(),
        ]);

        const followTasks = buildMockFollowTasks(devices);
        const mappedReplies = replyTasks.map(transformReplyTask);

        const combined = applyFilter([...followTasks, ...mappedReplies], filter);
        remoteTasksRef.current = combined;
        setTasks(mergeAndSortTasks(remoteTasksRef.current));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '加载任务失败，请稍后重试';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [devices, mergeAndSortTasks],
  );

  const createTask = useCallback(
    async (taskData: SemiAutoTaskCreate, deviceId?: string) => {
      setError(null);
      const device = devices.find((item) => item.id === deviceId);
      const now = new Date().toISOString();

      const manualTask: SemiAutoTask = {
        id: `manual_${Date.now()}`,
        type: taskData.type,
        title: taskData.title,
        description: taskData.description || '',
        status: 'pending',
        priority: taskData.priority || 'medium',
        deviceId,
        deviceName: device?.name,
        assignAccountId: taskData.assignAccountId,
        executorMode: taskData.executorMode || 'manual',
        targetAccount: taskData.targetAccount,
        targetContent: taskData.targetContent,
        createdAt: now,
        updatedAt: now,
        retryCount: 0,
        maxRetries: DEFAULT_MAX_RETRIES,
        progress: 0,
        parameters: taskData.parameters,
        metadata: { source: 'manual' },
      };

      setManualTasks((prev) => [manualTask, ...prev]);
      setTasks(mergeAndSortTasks(remoteTasksRef.current));

      return manualTask.id;
    },
    [devices, mergeAndSortTasks],
  );

  const updateTask = useCallback(
    (taskId: string, patch: Partial<SemiAutoTaskUpdate>) => {
      const mapper = (task: SemiAutoTask): SemiAutoTask =>
        task.id === taskId
          ? {
              ...task,
              ...('status' in patch ? { status: patch.status! } : {}),
              ...('progress' in patch ? { progress: patch.progress ?? task.progress } : {}),
              ...('errorMessage' in patch ? { errorMessage: patch.errorMessage } : {}),
              ...('result' in patch ? { result: patch.result } : {}),
              ...('deviceId' in patch ? { deviceId: patch.deviceId } : {}),
              ...('deviceName' in patch ? { deviceName: patch.deviceName } : {}),
              ...('completedAt' in patch ? { completedAt: patch.completedAt } : {}),
              ...('statistics' in patch ? { statistics: patch.statistics } : {}),
              ...('metadata' in patch ? { metadata: { ...task.metadata, ...patch.metadata } } : {}),
              updatedAt: new Date().toISOString(),
            }
          : task;

      setManualTasks((prev) => prev.map(mapper));
      remoteTasksRef.current = remoteTasksRef.current.map(mapper);
      setTasks(mergeAndSortTasks(remoteTasksRef.current));
    },
    [mergeAndSortTasks, setManualTasks],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      setError(null);
      setManualTasks((prev) => prev.filter((task) => task.id !== taskId));
      remoteTasksRef.current = remoteTasksRef.current.filter((task) => task.id !== taskId);
      setTasks(mergeAndSortTasks(remoteTasksRef.current));
    },
    [mergeAndSortTasks, setManualTasks],
  );

  const simulateExecution = useCallback(
    (taskId: string) => {
      const start = Date.now();

      const progressMapper = (task: SemiAutoTask): SemiAutoTask => {
        if (task.id !== taskId || task.status !== 'executing') return task;
        const elapsed = Date.now() - start;
        const progress = Math.min(100, Math.round((elapsed / EXECUTION_SIMULATION_MS) * 100));
        return { ...task, progress };
      };

      const progressTimer = setInterval(() => {
        setManualTasks((prev) => prev.map(progressMapper));
        remoteTasksRef.current = remoteTasksRef.current.map(progressMapper);
        setTasks(mergeAndSortTasks(remoteTasksRef.current));
      }, 800);

      setTimeout(() => {
        clearInterval(progressTimer);
        updateTask(taskId, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
          result: {
            success: true,
            message: '任务执行完成（模拟）',
          },
        });
      }, EXECUTION_SIMULATION_MS);
    },
    [updateTask],
  );

  const executeTask = useCallback(
    async (taskId: string, deviceId?: string) => {
      setError(null);
      const device = devices.find((item) => item.id === deviceId);
      updateTask(taskId, {
        status: 'executing',
        progress: 0,
        deviceId,
        deviceName: device?.name,
      });
      simulateExecution(taskId);
    },
    [devices, simulateExecution, updateTask],
  );

  const pauseTask = useCallback(
    async (taskId: string) => {
      setError(null);
      updateTask(taskId, { status: 'paused' });
    },
    [updateTask],
  );

  const resumeTask = useCallback(
    async (taskId: string, deviceId?: string) => {
      setError(null);
      await executeTask(taskId, deviceId);
    },
    [executeTask],
  );

  const getStats = useCallback((): SemiAutoTaskStats => {
    const total = tasks.length;
    const pending = tasks.filter((task) => task.status === 'pending').length;
    const executing = tasks.filter((task) => task.status === 'executing').length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const failed = tasks.filter((task) => task.status === 'failed').length;
    const paused = tasks.filter((task) => task.status === 'paused').length;

    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      pending,
      executing,
      completed,
      failed,
      paused,
      successRate,
      avgExecutionTime: 0,
    };
  }, [tasks]);

  const state: UseSemiAutoTasksReturn = useMemo(
    () => ({
      tasks,
      loading,
      error,
      loadTasks,
      createTask,
      updateTask: (taskId: string, patch: Partial<SemiAutoTaskUpdate>) =>
        updateTask(taskId, patch),
      deleteTask,
      executeTask,
      pauseTask,
      resumeTask,
      getStats,
    }),
    [
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
      getStats,
    ],
  );

  useEffect(() => {
    loadTasks().catch((err) => {
      const errMsg = err instanceof Error ? err.message : '初始化任务列表失败';
      setError(errMsg);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
};
