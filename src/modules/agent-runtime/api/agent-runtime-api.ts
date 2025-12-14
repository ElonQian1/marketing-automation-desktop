// src/modules/agent-runtime/api/agent-runtime-api.ts
// module: agent-runtime | layer: api | role: Tauri 命令调用
// summary: 封装 Agent Runtime 插件的 Tauri 命令

import { invoke } from '@tauri-apps/api/core';
import type {
  StartAgentParams,
  AgentResponse,
  AgentStatusResponse,
  AgentEventsResponse,
} from '../domain/agent-runtime-types';

const PLUGIN = 'plugin:agent-runtime|';

/** 启动 Agent */
export async function startAgent(params: StartAgentParams): Promise<AgentResponse> {
  return invoke<AgentResponse>(`${PLUGIN}start`, { params });
}

/** 暂停 Agent */
export async function pauseAgent(): Promise<AgentResponse> {
  return invoke<AgentResponse>(`${PLUGIN}pause`);
}

/** 恢复 Agent */
export async function resumeAgent(): Promise<AgentResponse> {
  return invoke<AgentResponse>(`${PLUGIN}resume`);
}

/** 停止 Agent */
export async function stopAgent(): Promise<AgentResponse> {
  return invoke<AgentResponse>(`${PLUGIN}stop`);
}

/** 批准行动 */
export async function approveAction(): Promise<AgentResponse> {
  return invoke<AgentResponse>(`${PLUGIN}approve`);
}

/** 拒绝行动 */
export async function rejectAction(): Promise<AgentResponse> {
  return invoke<AgentResponse>(`${PLUGIN}reject`);
}

/** 获取状态 */
export async function getAgentStatus(): Promise<AgentStatusResponse> {
  return invoke<AgentStatusResponse>(`${PLUGIN}status`);
}

/** 获取事件 */
export async function getAgentEvents(): Promise<AgentEventsResponse> {
  return invoke<AgentEventsResponse>(`${PLUGIN}get_events`);
}
