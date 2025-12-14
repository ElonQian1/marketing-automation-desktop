// src/modules/agent-runtime/domain/agent-runtime-types.ts
// module: agent-runtime | layer: domain | role: 类型定义
// summary: Agent 自主运行时的前端类型定义

/** Agent 运行状态 */
export type AgentRunState =
  | 'Idle'
  | 'Thinking'
  | 'Executing'
  | 'Observing'
  | 'WaitingForApproval'
  | 'Paused'
  | 'Recovering'
  | 'Stopped';

/** Agent 状态快照 */
export interface AgentStateSnapshot {
  runState: AgentRunState;
  currentDeviceId: string | null;
  currentGoalDescription: string | null;
  currentGoalProgress: number;
  completedGoalsCount: number;
  failedGoalsCount: number;
  consecutiveFailures: number;
  lastAction: string | null;
  lastActionResult: string | null;
  startedAt: string | null;
  totalRuntimeSecs: number;
  pendingApprovalAction: string | null;
}

/** 启动参数 */
export interface StartAgentParams {
  goal: string;
  deviceId: string;
  mode?: 'autonomous' | 'semi' | 'supervised';
}

/** 状态响应 */
export interface AgentStatusResponse {
  success: boolean;
  state: string;
  snapshot: AgentStateSnapshot | null;
  isRunning: boolean;
  error: string | null;
}

/** 通用响应 */
export interface AgentResponse {
  success: boolean;
  message: string;
  error: string | null;
}

/** Agent 事件类型 */
export type AgentEventType =
  | 'stateChanged'
  | 'goalProgress'
  | 'actionExecuted'
  | 'approvalRequired'
  | 'goalCompleted'
  | 'goalFailed'
  | 'aiThinking'
  | 'error';

/** Agent 事件 */
export interface AgentEvent {
  type: AgentEventType;
  state?: AgentRunState;
  goalId?: string;
  progress?: number;
  description?: string;
  action?: string;
  result?: string;
  success?: boolean;
  riskLevel?: string;
  reason?: string;
  thought?: string;
  message?: string;
}

/** 事件响应 */
export interface AgentEventsResponse {
  success: boolean;
  events: AgentEvent[];
}

/** 状态颜色映射 */
export const stateColors: Record<AgentRunState, string> = {
  Idle: 'default',
  Thinking: 'processing',
  Executing: 'processing',
  Observing: 'processing',
  WaitingForApproval: 'warning',
  Paused: 'warning',
  Recovering: 'error',
  Stopped: 'default',
};

/** 状态文本映射 */
export const stateLabels: Record<AgentRunState, string> = {
  Idle: '空闲',
  Thinking: '思考中',
  Executing: '执行中',
  Observing: '观察中',
  WaitingForApproval: '等待确认',
  Paused: '已暂停',
  Recovering: '恢复中',
  Stopped: '已停止',
};

/** 状态图标映射 */
export const stateIcons: Record<AgentRunState, string> = {
  Idle: '💤',
  Thinking: '🧠',
  Executing: '⚡',
  Observing: '👁️',
  WaitingForApproval: '⏳',
  Paused: '⏸️',
  Recovering: '🔧',
  Stopped: '🛑',
};
