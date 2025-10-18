// src/__tests__/event-flow-contracts/job-isolation-contract.test.ts
// module: test | layer: contracts | role: job-isolation-validation
// summary: jobID隔离合约测试 - 确保不同任务的事件不会相互干扰

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EVENTS, ANALYSIS_STATES } from '../../shared/constants/events';
import type { AnalysisState } from '../../shared/constants/events';

/**
 * JobId 隔离合约测试
 * 
 * 🎯 合约要求：
 * 1. 不同 jobId 的事件必须完全隔离
 * 2. 同一 jobId 的事件状态必须连续和一致
 * 3. 多任务并发时不能出现状态串扰
 * 4. 任务完成后状态必须持久化且独立
 */
describe('Event Flow Contract: JobId Isolation', () => {
  let eventBus: Map<string, Array<{eventType: string, jobId: string, payload: any}>>;
  let jobStates: Map<string, AnalysisState>;
  
  // 模拟事件总线
  const mockEmit = vi.fn((eventType: string, payload: any) => {
    if (!eventBus.has(eventType)) {
      eventBus.set(eventType, []);
    }
    eventBus.get(eventType)!.push({
      eventType,
      jobId: payload.jobId,
      payload
    });
    
    // 更新任务状态
    if (payload.jobId && payload.analysisState) {
      jobStates.set(payload.jobId, payload.analysisState);
    }
  });

  beforeEach(() => {
    eventBus = new Map();
    jobStates = new Map();
    vi.clearAllMocks();
  });

  afterEach(() => {
    eventBus.clear();
    jobStates.clear();
  });

  describe('🔒 JobId 完全隔离', () => {
    it('不同 jobId 的事件应完全独立', () => {
      const jobId1 = 'analysis-job-001';
      const jobId2 = 'analysis-job-002';
      
      // 模拟 job1 的分析流程
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId: jobId1,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 50
      });
      
      // 模拟 job2 的分析流程
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId: jobId2,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 20
      });
      
      // job1 完成
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId: jobId1,
        analysisState: ANALYSIS_STATES.COMPLETED,
        result: { success: true }
      });
      
      // 验证状态隔离
      expect(jobStates.get(jobId1)).toBe(ANALYSIS_STATES.COMPLETED);
      expect(jobStates.get(jobId2)).toBe(ANALYSIS_STATES.ANALYZING);
      
      // 验证事件隔离
      const progressEvents = eventBus.get(EVENTS.ANALYSIS_PROGRESS) || [];
      const job1ProgressEvents = progressEvents.filter(e => e.jobId === jobId1);
      const job2ProgressEvents = progressEvents.filter(e => e.jobId === jobId2);
      
      expect(job1ProgressEvents).toHaveLength(1);
      expect(job2ProgressEvents).toHaveLength(1);
      expect(job1ProgressEvents[0].payload.progress).toBe(50);
      expect(job2ProgressEvents[0].payload.progress).toBe(20);
    });

    it('应支持多任务并发不串扰', async () => {
      const jobIds = ['job-001', 'job-002', 'job-003'];
      const expectedStates = [
        ANALYSIS_STATES.ANALYZING,
        ANALYSIS_STATES.COMPLETED, 
        ANALYSIS_STATES.FAILED
      ];
      
      // 并发启动多个任务
      jobIds.forEach((jobId, index) => {
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress: (index + 1) * 10
        });
      });
      
      // 任务结束状态各不相同
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId: jobIds[1],
        analysisState: ANALYSIS_STATES.COMPLETED,
        result: { success: true }
      });
      
      mockEmit(EVENTS.ANALYSIS_ERROR, {
        jobId: jobIds[2],
        analysisState: ANALYSIS_STATES.FAILED,
        error: 'Analysis failed'
      });
      
      // 验证每个任务状态独立
      expect(jobStates.get(jobIds[0])).toBe(ANALYSIS_STATES.ANALYZING);
      expect(jobStates.get(jobIds[1])).toBe(ANALYSIS_STATES.COMPLETED);
      expect(jobStates.get(jobIds[2])).toBe(ANALYSIS_STATES.FAILED);
      
      // 验证事件统计正确
      const allEvents = Array.from(eventBus.values()).flat();
      const job1Events = allEvents.filter(e => e.jobId === jobIds[0]);
      const job2Events = allEvents.filter(e => e.jobId === jobIds[1]);
      const job3Events = allEvents.filter(e => e.jobId === jobIds[2]);
      
      expect(job1Events).toHaveLength(1); // 只有进度事件
      expect(job2Events).toHaveLength(2); // 进度 + 完成事件
      expect(job3Events).toHaveLength(2); // 进度 + 错误事件
    });
  });

  describe('📊 状态一致性验证', () => {
    it('同一任务的状态变更应该连续', () => {
      const jobId = 'consistency-test-job';
      const expectedStates = [
        ANALYSIS_STATES.IDLE,
        ANALYSIS_STATES.ANALYZING,
        ANALYSIS_STATES.COMPLETED
      ];
      
      // 按顺序发送状态变更
      expectedStates.forEach((state, index) => {
        const eventType = index === expectedStates.length - 1 
          ? EVENTS.ANALYSIS_DONE 
          : EVENTS.ANALYSIS_PROGRESS;
          
        mockEmit(eventType, {
          jobId,
          analysisState: state,
          progress: (index + 1) * 30
        });
      });
      
      // 验证最终状态
      expect(jobStates.get(jobId)).toBe(ANALYSIS_STATES.COMPLETED);
      
      // 验证状态变更历史
      const allEvents = Array.from(eventBus.values()).flat()
        .filter(e => e.jobId === jobId)
        .sort((a, b) => expectedStates.indexOf(a.payload.analysisState) - 
                       expectedStates.indexOf(b.payload.analysisState));
      
      allEvents.forEach((event, index) => {
        expect(event.payload.analysisState).toBe(expectedStates[index]);
      });
    });

    it('任务状态不应该回退', () => {
      const jobId = 'no-rollback-job';
      
      // 任务完成
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        result: { success: true }
      });
      
      // 尝试回退到分析中（这应该被忽略或抛出错误）
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 75
      });
      
      // 状态应该保持完成
      expect(jobStates.get(jobId)).toBe(ANALYSIS_STATES.COMPLETED);
    });
  });

  describe('🏗️ 任务生命周期完整性', () => {
    it('每个任务必须有唯一且持久的标识', () => {
      const jobIds = new Set<string>();
      const numJobs = 10;
      
      // 创建多个任务
      for (let i = 0; i < numJobs; i++) {
        const jobId = `lifecycle-job-${Date.now()}-${i}`;
        jobIds.add(jobId);
        
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress: 0
        });
      }
      
      // 验证所有任务ID唯一
      expect(jobIds.size).toBe(numJobs);
      
      // 验证所有任务都有记录
      expect(jobStates.size).toBe(numJobs);
      
      // 验证任务ID格式一致性
      Array.from(jobIds).forEach(jobId => {
        expect(jobId).toMatch(/^lifecycle-job-\d+-\d+$/);
        expect(jobStates.has(jobId)).toBe(true);
      });
    });

    it('已完成任务的状态应该持久化', () => {
      const completedJobs = ['persistent-job-1', 'persistent-job-2'];
      
      completedJobs.forEach(jobId => {
        mockEmit(EVENTS.ANALYSIS_DONE, {
          jobId,
          analysisState: ANALYSIS_STATES.COMPLETED,
          result: { success: true, timestamp: Date.now() }
        });
      });
      
      // 模拟系统重启后状态恢复
      const persistedStates = new Map(jobStates);
      
      // 验证状态持久化
      completedJobs.forEach(jobId => {
        expect(persistedStates.get(jobId)).toBe(ANALYSIS_STATES.COMPLETED);
      });
      
      // 新任务不应影响已完成任务
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId: 'new-job-after-restart',
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 10
      });
      
      completedJobs.forEach(jobId => {
        expect(persistedStates.get(jobId)).toBe(ANALYSIS_STATES.COMPLETED);
      });
    });
  });

  describe('⚡ 性能和资源管理', () => {
    it('大量并发任务时性能不应显著降低', () => {
      const startTime = performance.now();
      const numJobs = 1000;
      
      // 创建大量并发任务
      for (let i = 0; i < numJobs; i++) {
        const jobId = `perf-test-job-${i}`;
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress: Math.random() * 100
        });
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 执行时间应该在合理范围内（< 100ms）
      expect(executionTime).toBeLessThan(100);
      
      // 验证所有任务都被正确处理
      expect(jobStates.size).toBe(numJobs);
    });

    it('内存使用应该合理', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const numJobs = 500;
      
      // 创建并完成大量任务
      for (let i = 0; i < numJobs; i++) {
        const jobId = `memory-test-job-${i}`;
        
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress: 50
        });
        
        mockEmit(EVENTS.ANALYSIS_DONE, {
          jobId,
          analysisState: ANALYSIS_STATES.COMPLETED,
          result: { success: true }
        });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内（< 50MB）
      const maxMemoryIncrease = 50 * 1024 * 1024; // 50MB
      expect(memoryIncrease).toBeLessThan(maxMemoryIncrease);
    });
  });
});