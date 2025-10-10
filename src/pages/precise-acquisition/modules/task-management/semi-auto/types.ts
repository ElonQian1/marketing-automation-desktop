import { UnifiedExecutorMode } from '../../../../../modules/precise-acquisition/shared/utils/type-mappings';

/**
 * 半自动执行域模型 - 类型定义
 *
 * 结构化半自动任务的核心实体，涵盖任务元数据、参数、执行结果以及执行前检查等信息
 */

export type SemiAutoTaskType = 'follow' | 'reply' | 'comment' | 'like';

export type SemiAutoTaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'paused';

export type SemiAutoTaskPriority = 'high' | 'medium' | 'low';

export type ExecutorModeType = UnifiedExecutorMode;

export interface SemiAutoTaskParameterSet {
  targetUrl?: string;
  replyText?: string;
  commentText?: string;
  followCount?: number;
  delayMin?: number;
  delayMax?: number;
  checkDuplication?: boolean;
  autoSwitch?: boolean;
  [key: string]: unknown;
}

export interface SemiAutoTaskResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  screenshotPath?: string;
  logPath?: string;
}

export interface SemiAutoTaskStatistics {
  successCount?: number;
  failureCount?: number;
  lastExecutedAt?: string;
}

export interface SemiAutoTask {
  id: string;
  type: SemiAutoTaskType;
  title: string;
  description: string;
  status: SemiAutoTaskStatus;
  priority: SemiAutoTaskPriority;
  deviceId?: string;
  deviceName?: string;
  assignAccountId?: string;
  executorMode?: ExecutorModeType;
  targetId?: string;
  targetName?: string;
  targetAccount?: string;
  targetContent?: string;
  content?: string;
  dedupKey?: string;
  videoUrl?: string;
  videoTitle?: string;
  createdAt: string;
  updatedAt: string;
  executionTime?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  progress: number;
  parameters: SemiAutoTaskParameterSet;
  result?: SemiAutoTaskResult;
  statistics?: SemiAutoTaskStatistics;
  metadata?: Record<string, unknown>;
}

export interface SemiAutoTaskCreate {
  type: SemiAutoTaskType;
  title: string;
  description?: string;
  targetAccount?: string;
  targetContent?: string;
  priority?: SemiAutoTaskPriority;
  executorMode?: ExecutorModeType;
  assignAccountId?: string;
  parameters: SemiAutoTaskParameterSet;
}

export interface SemiAutoTaskUpdate {
  id: string;
  status?: SemiAutoTaskStatus;
  progress?: number;
  errorMessage?: string;
  result?: SemiAutoTaskResult;
  deviceId?: string;
  deviceName?: string;
  completedAt?: string;
  statistics?: SemiAutoTaskStatistics;
  metadata?: Record<string, unknown>;
}

export interface SemiAutoTaskFilter {
  type?: SemiAutoTaskType;
  status?: SemiAutoTaskStatus;
  priority?: SemiAutoTaskPriority;
  deviceId?: string;
  executorMode?: ExecutorModeType;
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

export type PrecheckKey = 'permissions' | 'rateLimit' | 'deduplication' | 'sensitiveWords';

export type PrecheckStatus = 'pass' | 'warning' | 'blocked';

export interface PrecheckResult {
  key: PrecheckKey;
  label: string;
  status: PrecheckStatus;
  message: string;
  detail?: string;
  waitSeconds?: number;
}

export interface PrecheckContext {
  taskId: string;
  executorMode: ExecutorModeType;
  assignAccountId?: string;
  dedupKey?: string;
  commentContent?: string;
  lastExecutedAt?: string;
  targetId?: string;
}

export interface UsePrecheckEvaluatorResult {
  loading: boolean;
  checks: PrecheckResult[];
  allPassed: boolean;
  refresh: () => Promise<void>;
}
