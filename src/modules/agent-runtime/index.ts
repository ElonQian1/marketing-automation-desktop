// src/modules/agent-runtime/index.ts
// module: agent-runtime | layer: public | role: 模块导出
// summary: Agent 自主运行时模块的公共 API

// 类型导出
export type {
  AgentRunState,
  AgentStateSnapshot,
  AgentEvent,
  AgentEventType,
  StartAgentParams,
  AgentResponse,
  AgentStatusResponse,
  AgentEventsResponse,
} from './domain/agent-runtime-types';

export {
  stateColors,
  stateLabels,
  stateIcons,
} from './domain/agent-runtime-types';

// API 导出
export {
  startAgent,
  pauseAgent,
  resumeAgent,
  stopAgent,
  approveAction,
  rejectAction,
  getAgentStatus,
  getAgentEvents,
} from './api/agent-runtime-api';

// Hook 导出
export { useAgentRuntime } from './hooks/use-agent-runtime';
export type { UseAgentRuntimeResult } from './hooks/use-agent-runtime';

// UI 组件导出
export { AgentRuntimeControlPanel } from './ui/agent-runtime-control-panel';
