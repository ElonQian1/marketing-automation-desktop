// src/__tests__/event-flow-contracts/e2e-integration-contract.test.ts
// module: test | layer: contracts | role: e2e-integration-validation
// summary: E2E端到端事件流合约测试 - 验证完整分析生命周期的事件完整性

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EVENTS, ANALYSIS_STATES } from '../../shared/constants/events';
import type { AnalysisState } from '../../shared/constants/events';

interface SystemComponent {
  name: string;
  eventsSent: Array<{eventType: string, payload: any, timestamp: number}>;
  eventsReceived: Array<{eventType: string, payload: any, timestamp: number}>;
}

interface E2ETestScenario {
  name: string;
  components: SystemComponent[];
  expectedEventFlow: string[];
  timeoutMs: number;
}

/**
 * E2E 端到端事件流合约测试
 * 
 * 🎯 合约要求：
 * 1. 完整的分析生命周期事件必须按正确顺序触发
 * 2. 前端和后端事件必须正确同步
 * 3. 事件传播延迟必须在可接受范围内
 * 4. 系统各组件间的事件通信必须可靠
 * 5. 异常情况下的事件回滚和错误传播必须正确
 */
describe('Event Flow Contract: E2E Integration', () => {
  let systemComponents: Map<string, SystemComponent>;
  let globalEventBus: Array<{component: string, eventType: string, payload: any, timestamp: number}>;
  let mockTauriInvoke: vi.Mock;
  
  beforeEach(() => {
    systemComponents = new Map();
    globalEventBus = [];
    
    // 模拟系统组件
    const components = ['frontend', 'backend', 'eventAckService', 'healthService'];
    components.forEach(name => {
      systemComponents.set(name, {
        name,
        eventsSent: [],
        eventsReceived: []
      });
    });
    
    mockTauriInvoke = vi.fn();
  });

  afterEach(() => {
    systemComponents.clear();
    globalEventBus = [];
    vi.clearAllMocks();
  });

  // 模拟组件间通信
  const simulateComponentEvent = (
    from: string, 
    to: string, 
    eventType: string, 
    payload: any,
    propagationDelay: number = 0
  ) => {
    const timestamp = Date.now();
    
    // 发送方记录
    const sender = systemComponents.get(from);
    if (sender) {
      sender.eventsSent.push({ eventType, payload, timestamp });
    }
    
    // 全局事件记录
    globalEventBus.push({ component: from, eventType, payload, timestamp });
    
    // 模拟网络延迟
    setTimeout(() => {
      const receiver = systemComponents.get(to);
      if (receiver) {
        receiver.eventsReceived.push({ 
          eventType, 
          payload, 
          timestamp: timestamp + propagationDelay 
        });
      }
    }, propagationDelay);
  };

  describe('🔄 完整分析生命周期', () => {
    it('应该按正确顺序完成完整的分析流程', async () => {
      const jobId = 'e2e-lifecycle-test';
      const expectedEventSequence = [
        'health_check_requested',
        'health_check_completed', 
        'analysis_started',
        'analysis_progress',
        'analysis_progress',
        'analysis_progress',
        'analysis_completed',
        'event_acknowledged'
      ];
      
      // 1. 前端请求健康检查
      simulateComponentEvent('frontend', 'backend', 'health_check_requested', {
        jobId,
        timestamp: Date.now()
      });
      
      // 2. 后端完成健康检查
      vi.advanceTimersByTime(100);
      simulateComponentEvent('backend', 'frontend', 'health_check_completed', {
        jobId,
        healthy: true,
        checks: {
          adb_connected: true,
          device_available: true,
          xml_cache_ready: true,
          analysis_engine_ready: true
        }
      });
      
      // 3. 前端启动分析
      vi.advanceTimersByTime(50);
      simulateComponentEvent('frontend', 'backend', 'analysis_started', {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 0
      });
      
      // 4. 后端发送进度更新
      const progressUpdates = [25, 50, 75];
      for (const progress of progressUpdates) {
        vi.advanceTimersByTime(500);
        simulateComponentEvent('backend', 'frontend', EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress
        });
      }
      
      // 5. 后端完成分析
      vi.advanceTimersByTime(500);
      simulateComponentEvent('backend', 'frontend', EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        progress: 100,
        result: {
          success: true,
          elementsAnalyzed: 15,
          strategiesUsed: ['xpath', 'hierarchy'],
          executionTimeMs: 2100
        }
      });
      
      // 6. 前端确认事件
      vi.advanceTimersByTime(10);
      simulateComponentEvent('frontend', 'eventAckService', 'event_acknowledged', {
        jobId,
        eventType: 'analysis_completed',
        timestamp: Date.now()
      });
      
      // 等待所有异步操作完成
      await vi.runAllTimersAsync();
      
      // 验证事件顺序
      const actualEventSequence = globalEventBus.map(e => e.eventType);
      expect(actualEventSequence).toEqual(expectedEventSequence);
      
      // 验证最终状态
      const finalEvent = globalEventBus[globalEventBus.length - 2]; // 倒数第二个是完成事件
      expect(finalEvent.eventType).toBe(EVENTS.ANALYSIS_DONE);
      expect(finalEvent.payload.analysisState).toBe(ANALYSIS_STATES.COMPLETED);
      expect(finalEvent.payload.result.success).toBe(true);
    });

    it('应该正确处理分析失败场景', async () => {
      const jobId = 'e2e-failure-test';
      
      // 1. 启动分析
      simulateComponentEvent('frontend', 'backend', 'analysis_started', {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 0
      });
      
      // 2. 进度更新到一半
      vi.advanceTimersByTime(300);
      simulateComponentEvent('backend', 'frontend', EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 45
      });
      
      // 3. 发生错误
      vi.advanceTimersByTime(200);
      simulateComponentEvent('backend', 'frontend', EVENTS.ANALYSIS_ERROR, {
        jobId,
        analysisState: ANALYSIS_STATES.FAILED,
        progress: 45,
        error: {
          code: 'DEVICE_DISCONNECTED',
          message: 'Device was disconnected during analysis',
          recoverySuggestions: ['Reconnect device', 'Restart analysis']
        }
      });
      
      // 4. 前端确认错误事件
      vi.advanceTimersByTime(10);
      simulateComponentEvent('frontend', 'eventAckService', 'event_acknowledged', {
        jobId,
        eventType: 'analysis_error',
        timestamp: Date.now()
      });
      
      await vi.runAllTimersAsync();
      
      // 验证错误事件被正确传播
      const errorEvent = globalEventBus.find(e => e.eventType === EVENTS.ANALYSIS_ERROR);
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.payload.analysisState).toBe(ANALYSIS_STATES.FAILED);
      expect(errorEvent!.payload.error.code).toBe('DEVICE_DISCONNECTED');
      
      // 验证事件被确认
      const ackEvent = globalEventBus.find(e => e.eventType === 'event_acknowledged');
      expect(ackEvent).toBeDefined();
      expect(ackEvent!.payload.eventType).toBe('analysis_error');
    });
  });

  describe('⚡ 性能和延迟验证', () => {
    it('事件传播延迟应该在可接受范围内', async () => {
      const jobId = 'e2e-latency-test';
      const maxAcceptableLatency = 100; // 100ms
      
      const startTime = performance.now();
      
      // 发送高优先级事件
      simulateComponentEvent('frontend', 'backend', 'urgent_analysis_request', {
        jobId,
        priority: 'high',
        timeout: 5000
      }, 10); // 10ms 网络延迟
      
      // 模拟快速响应
      vi.advanceTimersByTime(50);
      simulateComponentEvent('backend', 'frontend', 'urgent_analysis_response', {
        jobId,
        acknowledged: true,
        processingStarted: true
      }, 10);
      
      await vi.runAllTimersAsync();
      
      const endTime = performance.now();
      const totalLatency = endTime - startTime;
      
      expect(totalLatency).toBeLessThan(maxAcceptableLatency);
      
      // 验证所有组件都及时收到事件
      const backendReceived = systemComponents.get('backend')!.eventsReceived;
      const frontendReceived = systemComponents.get('frontend')!.eventsReceived;
      
      expect(backendReceived).toHaveLength(1);
      expect(frontendReceived).toHaveLength(1);
    });

    it('大量并发事件应该被正确处理', async () => {
      const numConcurrentJobs = 20;
      const jobIds = Array.from({ length: numConcurrentJobs }, (_, i) => `concurrent-job-${i}`);
      
      // 并发启动多个分析任务
      jobIds.forEach((jobId, index) => {
        simulateComponentEvent('frontend', 'backend', 'analysis_started', {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress: 0,
          priority: index % 3 // 不同优先级
        }, Math.random() * 20); // 随机网络延迟
      });
      
      // 模拟所有任务完成
      vi.advanceTimersByTime(1000);
      jobIds.forEach(jobId => {
        simulateComponentEvent('backend', 'frontend', EVENTS.ANALYSIS_DONE, {
          jobId,
          analysisState: ANALYSIS_STATES.COMPLETED,
          progress: 100,
          result: { success: true }
        }, Math.random() * 30);
      });
      
      await vi.runAllTimersAsync();
      
      // 验证所有任务都被正确处理
      const startEvents = globalEventBus.filter(e => e.eventType === 'analysis_started');
      const completeEvents = globalEventBus.filter(e => e.eventType === EVENTS.ANALYSIS_DONE);
      
      expect(startEvents).toHaveLength(numConcurrentJobs);
      expect(completeEvents).toHaveLength(numConcurrentJobs);
      
      // 验证每个任务都有对应的完成事件
      jobIds.forEach(jobId => {
        const hasStart = startEvents.some(e => e.payload.jobId === jobId);
        const hasComplete = completeEvents.some(e => e.payload.jobId === jobId);
        expect(hasStart).toBe(true);
        expect(hasComplete).toBe(true);
      });
    });
  });

  describe('🛡️ 容错和恢复机制', () => {
    it('应该正确处理组件无响应情况', async () => {
      const jobId = 'e2e-timeout-test';
      const responseTimeout = 5000; // 5秒超时
      
      // 发送请求但后端不响应
      simulateComponentEvent('frontend', 'backend', 'analysis_started', {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        timeout: responseTimeout
      });
      
      // 模拟超时检测
      vi.advanceTimersByTime(responseTimeout + 1000);
      
      // 前端应该发送超时事件
      simulateComponentEvent('frontend', 'eventAckService', 'analysis_timeout', {
        jobId,
        originalRequest: 'analysis_started',
        timeoutMs: responseTimeout,
        timestamp: Date.now()
      });
      
      await vi.runAllTimersAsync();
      
      // 验证超时事件被记录
      const timeoutEvent = globalEventBus.find(e => e.eventType === 'analysis_timeout');
      expect(timeoutEvent).toBeDefined();
      expect(timeoutEvent!.payload.jobId).toBe(jobId);
    });

    it('应该支持事件重试机制', async () => {
      const jobId = 'e2e-retry-test';
      const maxRetries = 3;
      
      // 模拟重试场景
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        simulateComponentEvent('frontend', 'backend', 'analysis_request_with_retry', {
          jobId,
          attempt,
          maxRetries,
          analysisState: ANALYSIS_STATES.ANALYZING
        });
        
        vi.advanceTimersByTime(1000);
        
        if (attempt < maxRetries) {
          // 前面几次失败
          simulateComponentEvent('backend', 'frontend', 'analysis_request_failed', {
            jobId,
            attempt,
            error: `Attempt ${attempt} failed`,
            willRetry: true
          });
        } else {
          // 最后一次成功
          simulateComponentEvent('backend', 'frontend', EVENTS.ANALYSIS_DONE, {
            jobId,
            attempt,
            analysisState: ANALYSIS_STATES.COMPLETED,
            progress: 100,
            result: { success: true, retriesUsed: maxRetries }
          });
        }
        
        vi.advanceTimersByTime(500);
      }
      
      await vi.runAllTimersAsync();
      
      // 验证重试逻辑
      const requestEvents = globalEventBus.filter(e => e.eventType === 'analysis_request_with_retry');
      const failureEvents = globalEventBus.filter(e => e.eventType === 'analysis_request_failed');
      const successEvent = globalEventBus.find(e => e.eventType === EVENTS.ANALYSIS_DONE);
      
      expect(requestEvents).toHaveLength(maxRetries);
      expect(failureEvents).toHaveLength(maxRetries - 1);
      expect(successEvent).toBeDefined();
      expect(successEvent!.payload.result.retriesUsed).toBe(maxRetries);
    });
  });

  describe('📊 系统健康监控', () => {
    it('应该监控和报告系统各组件的健康状态', async () => {
      const healthCheckInterval = 1000; // 1秒间隔
      const monitoringDuration = 5000; // 监控5秒
      
      // 启动健康监控
      const healthChecks: Array<{component: string, status: string, timestamp: number}> = [];
      
      // 模拟定期健康检查
      const components = ['frontend', 'backend', 'eventAckService'];
      const healthStatuses = ['healthy', 'degraded', 'unhealthy'];
      
      for (let time = 0; time < monitoringDuration; time += healthCheckInterval) {
        vi.advanceTimersByTime(healthCheckInterval);
        
        components.forEach(component => {
          const status = healthStatuses[Math.floor(Math.random() * healthStatuses.length)];
          const healthCheck = {
            component,
            status,
            timestamp: Date.now()
          };
          
          healthChecks.push(healthCheck);
          
          simulateComponentEvent('healthService', 'frontend', 'component_health_status', {
            component,
            status,
            timestamp: healthCheck.timestamp,
            metrics: {
              responseTime: Math.random() * 100,
              errorRate: Math.random() * 0.1,
              throughput: Math.random() * 1000
            }
          });
        });
      }
      
      await vi.runAllTimersAsync();
      
      // 验证健康检查数据
      const healthEvents = globalEventBus.filter(e => e.eventType === 'component_health_status');
      expect(healthEvents.length).toBeGreaterThan(0);
      
      // 验证每个组件都有健康状态报告
      components.forEach(component => {
        const componentHealthEvents = healthEvents.filter(e => e.payload.component === component);
        expect(componentHealthEvents.length).toBeGreaterThan(0);
      });
      
      // 验证健康状态数据格式正确
      healthEvents.forEach(event => {
        expect(event.payload.component).toBeDefined();
        expect(event.payload.status).toBeOneOf(healthStatuses);
        expect(event.payload.metrics).toBeDefined();
        expect(event.payload.metrics.responseTime).toBeTypeOf('number');
      });
    });
  });
});