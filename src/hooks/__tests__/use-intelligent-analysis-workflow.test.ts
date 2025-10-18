// src/hooks/__tests__/use-intelligent-analysis-workflow.test.ts
// module: hooks | layer: tests | role: 智能分析工作流合同测试
// summary: 防止进度硬编码回归和确保事件流完整性的合同测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EVENTS, ANALYSIS_STATES } from '@/shared/constants/events';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn()
}));

// 必须在导入 hook 之前设置 mock
import { useIntelligentAnalysisWorkflow } from '@/modules/universal-ui/hooks/use-intelligent-analysis-workflow';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

describe('Intelligent Analysis Workflow Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListen.mockImplementation(() => Promise.resolve(() => {}));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Progress Values Anti-Regression', () => {
    it('should never allow hardcoded progress values in frontend', async () => {
      // 合同测试1: 防止前端硬编码进度回归
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 初始状态检查
      expect(result.current.progress).toBe(0);
      expect(result.current.status).toBe(ANALYSIS_STATES.IDLE);
      
      // 模拟后端进度事件
      const mockProgressCallback = mockListen.mock.calls.find(
        call => call[0] === EVENTS.ANALYSIS_PROGRESS
      )?.[1];
      
      expect(mockProgressCallback).toBeDefined();
      
      if (mockProgressCallback) {
        // 测试各种后端进度值都能正确反映
        await act(async () => {
          await mockProgressCallback({ payload: { progress: 25, jobId: 'test-job' } });
        });
        expect(result.current.progress).toBe(25);
        
        await act(async () => {
          await mockProgressCallback({ payload: { progress: 67, jobId: 'test-job' } });
        });
        expect(result.current.progress).toBe(67);
        
        await act(async () => {
          await mockProgressCallback({ payload: { progress: 100, jobId: 'test-job' } });
        });
        expect(result.current.progress).toBe(100);
      }
    });

    it('should reject invalid progress values gracefully', async () => {
      // 确保进度值验证逻辑健壮
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      const mockProgressCallback = mockListen.mock.calls.find(
        call => call[0] === EVENTS.ANALYSIS_PROGRESS
      )?.[1];
      
      if (mockProgressCallback) {
        // 测试边界值处理
        await act(async () => {
          await mockProgressCallback({ payload: { progress: -10, jobId: 'test-job' } });
        });
        expect(result.current.progress).toBe(0); // 应该被规范化为0
        
        await act(async () => {
          await mockProgressCallback({ payload: { progress: 150, jobId: 'test-job' } });
        });
        expect(result.current.progress).toBe(100); // 应该被规范化为100
      }
    });
  });

  describe('Event Flow Integrity', () => {
    it('should maintain complete event subscription coverage', () => {
      // 合同测试2: 事件订阅完整性
      renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 验证所有关键事件都被订阅
      const subscribedEvents = mockListen.mock.calls.map(call => call[0]);
      expect(subscribedEvents).toContain(EVENTS.ANALYSIS_PROGRESS);
      expect(subscribedEvents).toContain(EVENTS.ANALYSIS_DONE);
      expect(subscribedEvents).toContain(EVENTS.ANALYSIS_ERROR);
      
      // 确保订阅数量符合预期（防止重复订阅）
      expect(mockListen).toHaveBeenCalledTimes(3);
    });

    it('should handle job ID matching correctly', async () => {
      // 验证作业ID匹配逻辑防止事件混乱
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 开始分析获取作业ID
      mockInvoke.mockResolvedValueOnce({ jobId: 'job-123' });
      
      await act(async () => {
        await result.current.startAnalysis({
          device_id: 'test-device',
          xml_content: '<test>content</test>',
          analysis_config: {}
        });
      });
      
      const mockProgressCallback = mockListen.mock.calls.find(
        call => call[0] === EVENTS.ANALYSIS_PROGRESS
      )?.[1];
      
      if (mockProgressCallback) {
        // 正确的作业ID应该更新状态
        await act(async () => {
          await mockProgressCallback({ payload: { progress: 50, jobId: 'job-123' } });
        });
        expect(result.current.progress).toBe(50);
        
        // 错误的作业ID应该被忽略
        await act(async () => {
          await mockProgressCallback({ payload: { progress: 75, jobId: 'wrong-job' } });
        });
        expect(result.current.progress).toBe(50); // 应该保持不变
      }
    });
  });

  describe('State Transition Validation', () => {
    it('should enforce valid state transitions only', async () => {
      // 合同测试3: 状态转换有效性
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 初始状态
      expect(result.current.status).toBe(ANALYSIS_STATES.IDLE);
      
      // 开始分析 -> ANALYZING
      mockInvoke.mockResolvedValueOnce({ jobId: 'job-123' });
      await act(async () => {
        await result.current.startAnalysis({
          device_id: 'test-device',
          xml_content: '<test>content</test>',
          analysis_config: {}
        });
      });
      expect(result.current.status).toBe(ANALYSIS_STATES.ANALYZING);
      
      // 完成事件 -> COMPLETED
      const mockDoneCallback = mockListen.mock.calls.find(
        call => call[0] === EVENTS.ANALYSIS_DONE
      )?.[1];
      
      if (mockDoneCallback) {
        await act(async () => {
          await mockDoneCallback({ 
            payload: { 
              result: { elements: [] }, 
              jobId: 'job-123' 
            } 
          });
        });
        expect(result.current.status).toBe(ANALYSIS_STATES.COMPLETED);
        expect(result.current.progress).toBe(100); // 完成时强制100%
      }
    });

    it('should handle error states correctly', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 开始分析
      mockInvoke.mockResolvedValueOnce({ jobId: 'job-456' });
      await act(async () => {
        await result.current.startAnalysis({
          device_id: 'test-device', 
          xml_content: '<test>content</test>',
          analysis_config: {}
        });
      });
      
      // 错误事件 -> FAILED
      const mockErrorCallback = mockListen.mock.calls.find(
        call => call[0] === EVENTS.ANALYSIS_ERROR
      )?.[1];
      
      if (mockErrorCallback) {
        await act(async () => {
          await mockErrorCallback({ 
            payload: { 
              error: 'Test error',
              jobId: 'job-456'
            } 
          });
        });
        expect(result.current.status).toBe(ANALYSIS_STATES.FAILED);
        expect(result.current.error).toBe('Test error');
      }
    });
  });
});