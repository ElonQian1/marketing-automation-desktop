// src/modules/agent-runtime/hooks/use-agent-runtime.ts
// module: agent-runtime | layer: hooks | role: Agent 运行时 Hook
// summary: 提供 Agent 状态管理和控制的 React Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  AgentRunState,
  AgentStateSnapshot,
  AgentEvent,
  StartAgentParams,
} from '../domain/agent-runtime-types';
import {
  startAgent,
  pauseAgent,
  resumeAgent,
  stopAgent,
  approveAction,
  rejectAction,
  getAgentStatus,
  getAgentEvents,
} from '../api/agent-runtime-api';

// ========== 事件名称常量（与后端保持一致）==========
const AGENT_RUNTIME_EVENTS = {
  STATE_CHANGED: 'agent_runtime:state_changed',
  PROGRESS: 'agent_runtime:progress',
  ACTION: 'agent_runtime:action',
  THINKING: 'agent_runtime:thinking',
  ERROR: 'agent_runtime:error',
  COMPLETED: 'agent_runtime:completed',
} as const;

export interface UseAgentRuntimeResult {
  // 状态
  state: AgentRunState;
  snapshot: AgentStateSnapshot | null;
  isRunning: boolean;
  events: AgentEvent[];
  loading: boolean;

  // 操作
  start: (params: StartAgentParams) => Promise<boolean>;
  pause: () => Promise<boolean>;
  resume: () => Promise<boolean>;
  stop: () => Promise<boolean>;
  approve: () => Promise<boolean>;
  reject: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useAgentRuntime(pollInterval = 2000): UseAgentRuntimeResult {
  const [state, setState] = useState<AgentRunState>('Idle');
  const [snapshot, setSnapshot] = useState<AgentStateSnapshot | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlistenRefs = useRef<UnlistenFn[]>([]);

  // 刷新状态
  const refresh = useCallback(async () => {
    try {
      const status = await getAgentStatus();
      if (status.success && status.snapshot) {
        setState(status.snapshot.runState);
        setSnapshot(status.snapshot);
        setIsRunning(status.isRunning);
      }
    } catch (error) {
      console.error('获取 Agent 状态失败:', error);
    }
  }, []);

  // 处理事件推送（替代轮询）
  const handleAgentEvent = useCallback((event: AgentEvent) => {
    setEvents(prev => [...prev, event].slice(-100));
    
    // 根据事件类型更新状态
    if ('state' in event && event.state) {
      setState(event.state as AgentRunState);
    }
  }, []);

  // 获取事件（兼容旧的轮询方式，作为备用）
  const fetchEvents = useCallback(async () => {
    try {
      const result = await getAgentEvents();
      if (result.success && result.events.length > 0) {
        setEvents(prev => [...prev, ...result.events].slice(-100));
      }
    } catch (error) {
      console.error('获取 Agent 事件失败:', error);
    }
  }, []);

  // 启动 Agent
  const start = useCallback(async (params: StartAgentParams): Promise<boolean> => {
    setLoading(true);
    try {
      setEvents([]); // 清空事件
      const result = await startAgent(params);
      if (result.success) {
        message.success(result.message);
        await refresh();
        return true;
      } else {
        message.error(result.error || '启动失败');
        return false;
      }
    } catch (error) {
      message.error(`启动失败: ${error}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // 暂停 Agent
  const pause = useCallback(async (): Promise<boolean> => {
    try {
      const result = await pauseAgent();
      if (result.success) {
        message.info(result.message);
        await refresh();
        return true;
      } else {
        message.error(result.error || '暂停失败');
        return false;
      }
    } catch (error) {
      message.error(`暂停失败: ${error}`);
      return false;
    }
  }, [refresh]);

  // 恢复 Agent
  const resume = useCallback(async (): Promise<boolean> => {
    try {
      const result = await resumeAgent();
      if (result.success) {
        message.success(result.message);
        await refresh();
        return true;
      } else {
        message.error(result.error || '恢复失败');
        return false;
      }
    } catch (error) {
      message.error(`恢复失败: ${error}`);
      return false;
    }
  }, [refresh]);

  // 停止 Agent
  const stop = useCallback(async (): Promise<boolean> => {
    try {
      const result = await stopAgent();
      if (result.success) {
        message.info(result.message);
        await refresh();
        return true;
      } else {
        message.error(result.error || '停止失败');
        return false;
      }
    } catch (error) {
      message.error(`停止失败: ${error}`);
      return false;
    }
  }, [refresh]);

  // 批准行动
  const approve = useCallback(async (): Promise<boolean> => {
    try {
      const result = await approveAction();
      if (result.success) {
        message.success(result.message);
        await refresh();
        return true;
      } else {
        message.error(result.error || '批准失败');
        return false;
      }
    } catch (error) {
      message.error(`批准失败: ${error}`);
      return false;
    }
  }, [refresh]);

  // 拒绝行动
  const reject = useCallback(async (): Promise<boolean> => {
    try {
      const result = await rejectAction();
      if (result.success) {
        message.info(result.message);
        await refresh();
        return true;
      } else {
        message.error(result.error || '拒绝失败');
        return false;
      }
    } catch (error) {
      message.error(`拒绝失败: ${error}`);
      return false;
    }
  }, [refresh]);

  // 轮询状态（降低频率，主要依赖事件推送）
  useEffect(() => {
    // 初始加载
    refresh();

    // 订阅 Tauri 事件（实时推送）
    const setupListeners = async () => {
      const eventNames = Object.values(AGENT_RUNTIME_EVENTS);
      for (const eventName of eventNames) {
        try {
          const unlisten = await listen<AgentEvent>(eventName, (e) => {
            handleAgentEvent(e.payload);
          });
          unlistenRefs.current.push(unlisten);
        } catch (err) {
          console.warn(`监听事件 ${eventName} 失败:`, err);
        }
      }
    };
    setupListeners();

    // 备用轮询（频率降低到 2 秒，主要用于状态同步）
    pollRef.current = setInterval(() => {
      refresh();
    }, pollInterval);

    return () => {
      // 清理事件监听
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
      
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [refresh, handleAgentEvent, pollInterval]);

  return {
    state,
    snapshot,
    isRunning,
    events,
    loading,
    start,
    pause,
    resume,
    stop,
    approve,
    reject,
    refresh,
  };
}
