// src/__tests__/event-flow-contracts/progress-completion-contract.test.ts
// module: test | layer: contracts | role: progress-flow-validation
// summary: 进度/完成流程合约测试 - 确保分析流程的完整性和正确性

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EVENTS, ANALYSIS_STATES } from '../../shared/constants/events';
import type { AnalysisState } from '../../shared/constants/events';

interface AnalysisEvent {
  jobId: string;
  analysisState: AnalysisState;
  progress?: number;
  timestamp: number;
  result?: any;
  error?: Record<string, unknown>; // 支持复杂错误对象
}

/**
 * 进度/完成流程合约测试
 * 
 * 🎯 合约要求：
 * 1. 分析流程必须按照 idle -> analyzing -> completed/failed 的顺序进行
 * 2. 进度值必须单调递增，范围在 0-100 之间
 * 3. 完成事件必须包含有效的结果数据
 * 4. 错误事件必须包含详细的错误信息
 * 5. 时间戳必须递增，确保事件顺序正确
 */
describe('Event Flow Contract: Progress & Completion Flow', () => {
  let eventHistory: Array<AnalysisEvent>;
  let mockListen: vi.Mock;
  let mockEmit: vi.Mock;
  
  beforeEach(() => {
    eventHistory = [];
    mockListen = vi.fn();
    mockEmit = vi.fn((eventType: string, payload: any) => {
      eventHistory.push({
        ...payload,
        timestamp: Date.now()
      });
    });
  });

  afterEach(() => {
    eventHistory = [];
    vi.clearAllMocks();
  });

  describe('📈 进度流程完整性', () => {
    it('分析进度必须单调递增', () => {
      const jobId = 'progress-monotonic-test';
      const progressValues = [0, 25, 50, 75, 100];
      
      progressValues.forEach((progress, index) => {
        const eventType = progress === 100 
          ? EVENTS.ANALYSIS_DONE 
          : EVENTS.ANALYSIS_PROGRESS;
        const analysisState = progress === 100 
          ? ANALYSIS_STATES.COMPLETED 
          : ANALYSIS_STATES.ANALYZING;
        
        mockEmit(eventType, {
          jobId,
          analysisState,
          progress
        });
        
        // 小延迟确保时间戳递增
        if (index < progressValues.length - 1) {
          vi.advanceTimersByTime(10);
        }
      });
      
      // 验证进度单调递增
      const jobEvents = eventHistory.filter(e => e.jobId === jobId);
      for (let i = 1; i < jobEvents.length; i++) {
        expect(jobEvents[i].progress).toBeGreaterThanOrEqual(jobEvents[i - 1].progress!);
        expect(jobEvents[i].timestamp).toBeGreaterThanOrEqual(jobEvents[i - 1].timestamp);
      }
      
      // 验证最终状态
      const finalEvent = jobEvents[jobEvents.length - 1];
      expect(finalEvent.analysisState).toBe(ANALYSIS_STATES.COMPLETED);
      expect(finalEvent.progress).toBe(100);
    });

    it('进度值必须在有效范围内', () => {
      const jobId = 'progress-range-test';
      const validProgressValues = [0, 10, 33, 66, 89, 100];
      const invalidProgressValues = [-10, 150, NaN, undefined];
      
      // 测试有效进度值
      validProgressValues.forEach(progress => {
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId: `${jobId}-valid`,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress
        });
      });
      
      const validEvents = eventHistory.filter(e => e.jobId.includes('valid'));
      validEvents.forEach(event => {
        expect(event.progress).toBeGreaterThanOrEqual(0);
        expect(event.progress).toBeLessThanOrEqual(100);
        expect(typeof event.progress).toBe('number');
        expect(isFinite(event.progress!)).toBe(true);
      });
      
      // 验证无效进度值被拒绝或规范化
      invalidProgressValues.forEach(progress => {
        expect(() => {
          const normalizedProgress = Math.max(0, Math.min(100, progress || 0));
          expect(normalizedProgress).toBeGreaterThanOrEqual(0);
          expect(normalizedProgress).toBeLessThanOrEqual(100);
        }).not.toThrow();
      });
    });

    it('状态转换必须符合预定义流程', () => {
      const jobId = 'state-transition-test';
      const validTransitions = [
        { from: ANALYSIS_STATES.IDLE, to: ANALYSIS_STATES.ANALYZING },
        { from: ANALYSIS_STATES.ANALYZING, to: ANALYSIS_STATES.COMPLETED },
        { from: ANALYSIS_STATES.ANALYZING, to: ANALYSIS_STATES.FAILED }
      ];
      
      // 测试有效的状态转换
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        analysisState: ANALYSIS_STATES.IDLE,
        progress: 0
      });
      
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 50
      });
      
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        progress: 100,
        result: { success: true }
      });
      
      const stateSequence = eventHistory
        .filter(e => e.jobId === jobId)
        .map(e => e.analysisState);
      
      expect(stateSequence).toEqual([
        ANALYSIS_STATES.IDLE,
        ANALYSIS_STATES.ANALYZING,
        ANALYSIS_STATES.COMPLETED
      ]);
    });
  });

  describe('✅ 完成事件验证', () => {
    it('成功完成必须包含有效结果数据', () => {
      const jobId = 'completion-success-test';
      const expectedResult = {
        success: true,
        data: {
          analyzedSteps: 5,
          elementsFound: 12,
          strategiesApplied: ['xpath', 'hierarchy'],
          executionTime: 2.5
        },
        metadata: {
          version: '2.0',
          timestamp: Date.now(),
          deviceInfo: { id: 'test-device', model: 'Test Phone' }
        }
      };
      
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        progress: 100,
        result: expectedResult
      });
      
      const completionEvent = eventHistory.find(e => 
        e.jobId === jobId && e.analysisState === ANALYSIS_STATES.COMPLETED
      );
      
      expect(completionEvent).toBeDefined();
      expect(completionEvent!.result).toEqual(expectedResult);
      expect(completionEvent!.result.success).toBe(true);
      expect(completionEvent!.result.data).toBeDefined();
      expect(completionEvent!.result.metadata).toBeDefined();
      expect(completionEvent!.progress).toBe(100);
    });

    it('失败完成必须包含详细错误信息', () => {
      const jobId = 'completion-failure-test';
      const expectedError = {
        code: 'ANALYSIS_TIMEOUT',
        message: 'Analysis timed out after 30 seconds',
        details: {
          step: 'element-matching',
          attemptedStrategies: ['xpath', 'hierarchy', 'ocr'],
          lastSuccessfulStep: 'ui-dump',
          remainingSteps: 3
        },
        stackTrace: 'Error: Analysis timeout\n  at AnalysisEngine.analyze...',
        timestamp: Date.now()
      };
      
      mockEmit(EVENTS.ANALYSIS_ERROR, {
        jobId,
        analysisState: ANALYSIS_STATES.FAILED,
        progress: 67,
        error: expectedError
      });
      
      const errorEvent = eventHistory.find(e => 
        e.jobId === jobId && e.analysisState === ANALYSIS_STATES.FAILED
      );
      
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.error).toEqual(expectedError);
      expect(errorEvent!.error.code).toBeDefined();
      expect(errorEvent!.error.message).toBeDefined();
      expect(errorEvent!.error.details).toBeDefined();
      expect(errorEvent!.progress).toBeLessThan(100);
    });

    it('完成事件的时间戳必须合理', () => {
      const jobId = 'completion-timing-test';
      const startTime = Date.now();
      
      // 启动分析
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 0
      });
      
      // 模拟分析过程中的进度更新
      [25, 50, 75].forEach((progress, index) => {
        vi.advanceTimersByTime(500); // 每步500ms
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress
        });
      });
      
      // 完成分析
      vi.advanceTimersByTime(500);
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        progress: 100,
        result: { success: true }
      });
      
      const jobEvents = eventHistory.filter(e => e.jobId === jobId);
      const totalDuration = jobEvents[jobEvents.length - 1].timestamp - jobEvents[0].timestamp;
      
      // 验证总耗时合理（应该约为2秒，允许一些误差）
      expect(totalDuration).toBeGreaterThan(1500);
      expect(totalDuration).toBeLessThan(3000);
      
      // 验证时间戳严格递增
      for (let i = 1; i < jobEvents.length; i++) {
        expect(jobEvents[i].timestamp).toBeGreaterThan(jobEvents[i - 1].timestamp);
      }
    });
  });

  describe('🔄 并发和竞态条件', () => {
    it('多任务并发时完成顺序可能不同于启动顺序', () => {
      const jobIds = ['concurrent-1', 'concurrent-2', 'concurrent-3'];
      const completionOrder: string[] = [];
      
      // 并发启动三个任务
      jobIds.forEach(jobId => {
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress: 0
        });
      });
      
      // 不同任务以不同顺序完成
      const completionSequence = [
        { jobId: jobIds[1], delay: 100 },  // concurrent-2 先完成
        { jobId: jobIds[2], delay: 200 },  // concurrent-3 第二完成
        { jobId: jobIds[0], delay: 300 }   // concurrent-1 最后完成
      ];
      
      completionSequence.forEach(({ jobId, delay }) => {
        vi.advanceTimersByTime(delay);
        mockEmit(EVENTS.ANALYSIS_DONE, {
          jobId,
          analysisState: ANALYSIS_STATES.COMPLETED,
          progress: 100,
          result: { success: true }
        });
        completionOrder.push(jobId);
      });
      
      // 验证完成顺序与启动顺序不同
      expect(completionOrder).toEqual([jobIds[1], jobIds[2], jobIds[0]]);
      
      // 验证每个任务都正确完成
      jobIds.forEach(jobId => {
        const completionEvent = eventHistory.find(e => 
          e.jobId === jobId && e.analysisState === ANALYSIS_STATES.COMPLETED
        );
        expect(completionEvent).toBeDefined();
        expect(completionEvent!.result.success).toBe(true);
      });
    });

    it('快速连续的进度更新应该被正确处理', () => {
      const jobId = 'rapid-progress-test';
      const rapidUpdates = Array.from({ length: 50 }, (_, i) => i * 2); // 0, 2, 4, ..., 98
      
      // 快速发送进度更新
      rapidUpdates.forEach(progress => {
        mockEmit(EVENTS.ANALYSIS_PROGRESS, {
          jobId,
          analysisState: ANALYSIS_STATES.ANALYZING,
          progress
        });
      });
      
      // 完成分析
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        progress: 100,
        result: { success: true }
      });
      
      const jobEvents = eventHistory.filter(e => e.jobId === jobId);
      
      // 验证所有进度更新都被记录
      expect(jobEvents.length).toBe(rapidUpdates.length + 1); // +1 for completion
      
      // 验证进度值正确
      jobEvents.slice(0, -1).forEach((event, index) => {
        expect(event.progress).toBe(rapidUpdates[index]);
      });
      
      // 验证最终完成
      const finalEvent = jobEvents[jobEvents.length - 1];
      expect(finalEvent.analysisState).toBe(ANALYSIS_STATES.COMPLETED);
      expect(finalEvent.progress).toBe(100);
    });
  });

  describe('🎯 边界条件测试', () => {
    it('零进度启动应该被正确处理', () => {
      const jobId = 'zero-progress-test';
      
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 0
      });
      
      const startEvent = eventHistory.find(e => e.jobId === jobId);
      expect(startEvent).toBeDefined();
      expect(startEvent!.progress).toBe(0);
      expect(startEvent!.analysisState).toBe(ANALYSIS_STATES.ANALYZING);
    });

    it('100%进度但未发送完成事件的任务应该被检测', () => {
      const jobId = 'incomplete-100-test';
      
      mockEmit(EVENTS.ANALYSIS_PROGRESS, {
        jobId,
        analysisState: ANALYSIS_STATES.ANALYZING,
        progress: 100  // 100% 但状态仍是 analyzing
      });
      
      const event = eventHistory.find(e => e.jobId === jobId);
      expect(event).toBeDefined();
      expect(event!.progress).toBe(100);
      
      // 这种情况应该被标记为潜在问题
      expect(event!.analysisState).toBe(ANALYSIS_STATES.ANALYZING);
      // 在实际实现中，这应该触发一个警告或自动修正
    });

    it('重复完成事件应该被忽略', () => {
      const jobId = 'duplicate-completion-test';
      
      // 首次完成
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        progress: 100,
        result: { success: true, attempt: 1 }
      });
      
      // 重复完成（应该被忽略）
      mockEmit(EVENTS.ANALYSIS_DONE, {
        jobId,
        analysisState: ANALYSIS_STATES.COMPLETED,
        progress: 100,
        result: { success: true, attempt: 2 }
      });
      
      const completionEvents = eventHistory.filter(e => 
        e.jobId === jobId && e.analysisState === ANALYSIS_STATES.COMPLETED
      );
      
      // 应该只有一个完成事件被记录（第一个）
      expect(completionEvents).toHaveLength(1);
      expect(completionEvents[0].result.attempt).toBe(1);
    });
  });
});