// src/application/analysis/devTracer.ts
// module: application | layer: application | role: dev-tracer
// summary: 开发期事件追踪器,记录所有Tauri事件到本地存储

import { listen } from '@tauri-apps/api/event';
import { EVENTS } from '../../shared/constants/events';

interface EventLog {
  ts: string;
  eventName: string;
  payload: unknown;
}

const EVENT_LOG_KEY = 'dev_event_logs';
const MAX_LOGS = 500; // 最多保留500条日志

/**
 * 开发期事件追踪器
 * 
 * 在开发模式下监听所有analysis相关事件并落盘到localStorage
 * 可通过 window.__exportEventLogs() 导出完整日志
 */
export async function attachDevTracer() {
  if (import.meta.env.MODE !== 'development') {
    console.log('[DevTracer] 非开发模式,跳过事件追踪');
    return;
  }

  console.log('🔧 [DevTracer] 启动事件追踪器...');

  // 清空旧日志
  localStorage.setItem(EVENT_LOG_KEY, JSON.stringify([]));

  const logEvent = (eventName: string, payload: unknown) => {
    const log: EventLog = {
      ts: new Date().toISOString(),
      eventName,
      payload,
    };

    // console.debug('[EVT]', eventName, payload); // 保留控制台输出
    console.log(`[EVT] ${eventName}`, payload);

    // 追加到 localStorage
    try {
      const logs = JSON.parse(localStorage.getItem(EVENT_LOG_KEY) || '[]') as EventLog[];
      logs.push(log);

      // 限制日志数量
      if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS);
      }

      localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('[DevTracer] 日志存储失败:', error);
    }
  };

  // 监听所有 analysis 事件
  await listen(EVENTS.ANALYSIS_PROGRESS, (event) =>
    logEvent(EVENTS.ANALYSIS_PROGRESS, event.payload)
  );
  await listen(EVENTS.ANALYSIS_DONE, (event) =>
    logEvent(EVENTS.ANALYSIS_DONE, event.payload)
  );
  await listen(EVENTS.ANALYSIS_ERROR, (event) =>
    logEvent(EVENTS.ANALYSIS_ERROR, event.payload)
  );

  // 暴露导出函数到全局
  (window as any).__exportEventLogs = () => {
    const logs = JSON.parse(localStorage.getItem(EVENT_LOG_KEY) || '[]');
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ [DevTracer] 事件日志已导出');
  };

  console.log('✅ [DevTracer] 事件追踪器已就绪');
  console.log('💡 使用 window.__exportEventLogs() 导出日志');
}
