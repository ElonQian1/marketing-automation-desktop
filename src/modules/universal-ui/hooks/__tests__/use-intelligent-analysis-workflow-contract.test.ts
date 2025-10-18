// src/modules/universal-ui/hooks/__tests__/use-intelligent-analysis-workflow-contract.test.ts
// module: universal-ui | layer: tests | role: workflow-contract-tests
// summary: 智能分析工作流合同测试，防止"30%残影"和状态串台问题

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIntelligentAnalysisWorkflow } from '../use-intelligent-analysis-workflow';

// Mock 后端服务
vi.mock('../../../../services/intelligent-analysis-backend', () => ({
  intelligentAnalysisBackend: {
    listenToAnalysisProgress: vi.fn(),
    listenToAnalysisComplete: vi.fn(),
    listenToAnalysisError: vi.fn(),
    startAnalysis: vi.fn(),
  }
}));

// 获取mock函数引用
import { intelligentAnalysisBackend } from '../../../../services/intelligent-analysis-backend';
const mockListenToAnalysisProgress = vi.mocked(intelligentAnalysisBackend.listenToAnalysisProgress);
const mockListenToAnalysisComplete = vi.mocked(intelligentAnalysisBackend.listenToAnalysisComplete);
const mockListenToAnalysisError = vi.mocked(intelligentAnalysisBackend.listenToAnalysisError);
const mockStartAnalysis = vi.mocked(intelligentAnalysisBackend.startAnalysis);

describe('智能分析工作流合同测试 - 防止30%残影回归', () => {
  let progressCallback: (jobId: string, progress: number, currentStep: string, estimatedTimeLeft: number) => void;
  let completeCallback: (jobId: string, result: { selectionHash: string; smartCandidates: unknown[]; staticCandidates: unknown[]; recommendedKey: string }) => void;
  let errorCallback: (error: string) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置事件监听器模拟
    mockListenToAnalysisProgress.mockImplementation((callback) => {
      progressCallback = callback;
      return Promise.resolve(() => {});
    });
    
    mockListenToAnalysisComplete.mockImplementation((callback) => {
      completeCallback = callback;
      return Promise.resolve(() => {});
    });
    
    mockListenToAnalysisError.mockImplementation((callback) => {
      errorCallback = callback;
      return Promise.resolve(() => {});
    });
    
    mockStartAnalysis.mockResolvedValue('test-job-id');
  });

  describe('🔒 合同测试1: 不同jobId的进度不得串台', () => {
    it('应该只更新匹配jobId的作业进度，其他作业不受影响', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 创建两个分析作业
      await act(async () => {
        await result.current.startAnalysis({
          deviceId: 'device1',
          elementXPath: '//*[@text="button1"]',
          elementBounds: '0,0,100,50',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
      });
      
      // 模拟第二个作业
      const job2Id = 'job-2-id';
      act(() => {
        result.current.currentJobs.set(job2Id, {
          jobId: job2Id,
          stepId: 'step-2',
          selectionHash: 'hash-2',
          state: 'running',
          progress: 0,
          startedAt: Date.now()
        });
      });
      
      // 发送第一个作业的进度更新
      act(() => {
        progressCallback('test-job-id', 45, 'XML解析中', 30);
      });
      
      // 验证：只有匹配的作业被更新
      const job1 = result.current.currentJobs.get('test-job-id');
      const job2 = result.current.currentJobs.get(job2Id);
      
      expect(job1?.progress).toBe(45);
      expect(job2?.progress).toBe(0); // 未被影响
      
      // 发送第二个作业的进度更新
      act(() => {
        progressCallback(job2Id, 75, '元素分析中', 15);
      });
      
      // 验证：各自独立更新
      expect(result.current.currentJobs.get('test-job-id')?.progress).toBe(45); // 保持不变
      expect(result.current.currentJobs.get(job2Id)?.progress).toBe(75); // 更新为75
    });

    it('应该只更新匹配jobId的步骤卡片，防止进度串台', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 创建两个步骤卡片并绑定不同的作业ID
      await act(async () => {
        const stepId1 = await result.current.createStepCardQuick({
          deviceId: 'device1',
          elementXPath: '//*[@text="button1"]',
          elementBounds: '0,0,100,50',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
        
        const stepId2 = await result.current.createStepCardQuick({
          deviceId: 'device2',
          elementXPath: '//*[@text="button2"]',
          elementBounds: '0,50,100,100',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
        
        // 手动设置不同的作业ID
        result.current.updateStepCard(stepId1, { analysisJobId: 'job-1', analysisState: 'analyzing' });
        result.current.updateStepCard(stepId2, { analysisJobId: 'job-2', analysisState: 'analyzing' });
      });
      
      // 发送job-1的进度更新
      act(() => {
        progressCallback('job-1', 60, '策略匹配中', 20);
      });
      
      // 验证：只有job-1对应的步骤卡片被更新
      const step1 = result.current.stepCards.find(c => c.analysisJobId === 'job-1');
      const step2 = result.current.stepCards.find(c => c.analysisJobId === 'job-2');
      
      expect(step1?.analysisProgress).toBe(60);
      expect(step2?.analysisProgress).toBe(0); // 应该保持初始值
    });
  });

  describe('🚀 合同测试2: completed强制progress=100且清理loading状态', () => {
    it('收到completed事件必须强制progress=100并清理所有loading状态', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 开始分析
      await act(async () => {
        await result.current.startAnalysis({
          deviceId: 'device1',
          elementXPath: '//*[@text="submit"]',
          elementBounds: '0,0,100,50',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
      });
      
      // 模拟进度更新到某个中间值
      act(() => {
        progressCallback('test-job-id', 73, '分析中', 10);
      });
      
      // 验证进度确实是73%
      expect(result.current.currentJobs.get('test-job-id')?.progress).toBe(73);
      expect(result.current.isAnalyzing).toBe(true);
      
      // 发送完成事件
      act(() => {
        completeCallback('test-job-id', {
          selectionHash: 'test-hash',
          smartCandidates: [],
          staticCandidates: [],
          recommendedKey: 'test-key'
        });
      });
      
      // 🎯 关键验证：progress强制为100，loading状态清除
      const completedJob = result.current.currentJobs.get('test-job-id');
      expect(completedJob?.state).toBe('completed');
      expect(completedJob?.progress).toBe(100); // 强制100%
      expect(result.current.isAnalyzing).toBe(false); // loading清除
      
      // 验证步骤卡片状态
      const stepCard = result.current.stepCards.find(c => c.analysisJobId === undefined); // jobId应该被清除
      expect(stepCard?.analysisState).toBe('analysis_completed');
      expect(stepCard?.analysisProgress).toBe(100);
    });

    it('completed事件必须清除analysisJobId防止后续误匹配', async () => { 
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 创建步骤卡片并开始分析
      await act(async () => {
        const stepId = await result.current.createStepCardQuick({
          deviceId: 'device1',
          elementXPath: '//*[@text="test"]',
          elementBounds: '0,0,100,50',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
        
        // 手动设置为分析中状态
        result.current.updateStepCard(stepId, { 
          analysisJobId: 'job-123', 
          analysisState: 'analyzing' 
        });
      });
      
      // 验证设置成功
      let stepCard = result.current.stepCards[0];
      expect(stepCard.analysisJobId).toBe('job-123');
      expect(stepCard.analysisState).toBe('analyzing');
      
      // 发送完成事件
      act(() => {
        completeCallback('job-123', {
          selectionHash: 'test-hash',
          smartCandidates: [],
          staticCandidates: [],
          recommendedKey: 'key1'
        });
      });
      
      // 🔒 关键验证：analysisJobId必须被清除
      stepCard = result.current.stepCards[0];
      expect(stepCard.analysisJobId).toBeUndefined();
      expect(stepCard.analysisState).toBe('analysis_completed');
      
      // 再次发送同一jobId的进度更新，应该被忽略
      act(() => {
        progressCallback('job-123', 50, '不应该更新', 0);
      });
      
      // 验证：步骤卡片不被误更新
      stepCard = result.current.stepCards[0];
      expect(stepCard.analysisProgress).toBe(100); // 保持100%
      expect(stepCard.analysisState).toBe('analysis_completed'); // 保持完成状态
    });
  });

  describe('🛡️ 合同测试3: completed后到来的旧progress必须被忽略', () => {
    it('作业完成后的任何进度更新都应该被忽略', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 开始分析
      await act(async () => {
        await result.current.startAnalysis({
          deviceId: 'device1',
          elementXPath: '//*[@text="button"]',
          elementBounds: '0,0,100,50',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
      });
      
      // 发送完成事件
      act(() => {
        completeCallback('test-job-id', {
          selectionHash: 'hash',
          smartCandidates: [],
          staticCandidates: [],
          recommendedKey: 'key'
        });
      });
      
      // 验证作业已完成
      expect(result.current.currentJobs.get('test-job-id')?.state).toBe('completed');
      expect(result.current.currentJobs.get('test-job-id')?.progress).toBe(100);
      
      // ⚠️ 模拟延迟到达的旧进度更新（网络延迟/事件乱序）
      act(() => {
        progressCallback('test-job-id', 30, '过时的进度', 60);
      });
      
      // 🎯 关键验证：已完成的作业不应该被"倒退"
      const job = result.current.currentJobs.get('test-job-id');
      expect(job?.state).toBe('completed'); // 状态不变
      expect(job?.progress).toBe(100); // 进度保持100%
      expect(result.current.isAnalyzing).toBe(false); // loading状态不变
    });

    it('步骤卡片完成后不应该响应旧的进度更新', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 创建步骤并设置为分析中
      await act(async () => {
        const stepId = await result.current.createStepCardQuick({
          deviceId: 'device1',
          elementXPath: '//*[@text="test"]',
          elementBounds: '0,0,100,50',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
        
        result.current.updateStepCard(stepId, { 
          analysisJobId: 'job-456',
          analysisState: 'analyzing',
          analysisProgress: 0
        });
      });
      
      // 完成分析
      act(() => {
        completeCallback('job-456', {
          selectionHash: 'hash',
          smartCandidates: [{ key: 'smart1', confidence: 0.9, description: '智能策略' }],
          staticCandidates: [],
          recommendedKey: 'smart1'
        });
      });
      
      // 验证完成状态
      let stepCard = result.current.stepCards[0];
      expect(stepCard.analysisState).toBe('analysis_completed');
      expect(stepCard.analysisProgress).toBe(100);
      expect(stepCard.analysisJobId).toBeUndefined(); // jobId已清除
      
      // 尝试发送旧的进度更新
      act(() => {
        progressCallback('job-456', 45, '过时更新', 30);
      });
      
      // 🛡️ 关键验证：步骤卡片不应该响应（因为jobId已清除）
      stepCard = result.current.stepCards[0];
      expect(stepCard.analysisProgress).toBe(100); // 保持100%
      expect(stepCard.analysisState).toBe('analysis_completed'); // 保持完成状态
      expect(stepCard.smartCandidates).toHaveLength(1); // 结果数据不被破坏
    });

    it('多作业环境下完成的作业不响应任何进度更新', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 创建多个作业
      const jobIds = ['job-1', 'job-2', 'job-3'];
      
      act(() => {
        jobIds.forEach((jobId, index) => {
          result.current.currentJobs.set(jobId, {
            jobId,
            stepId: `step-${index}`,
            selectionHash: `hash-${index}`,
            state: 'running',
            progress: 20 * (index + 1), // 20%, 40%, 60%
            startedAt: Date.now()
          });
        });
      });
      
      // 完成第二个作业
      act(() => {
        completeCallback('job-2', {
          selectionHash: 'hash-2',
          smartCandidates: [],
          staticCandidates: [],
          recommendedKey: 'key2'
        });
      });
      
      // 验证第二个作业已完成
      expect(result.current.currentJobs.get('job-2')?.state).toBe('completed');
      expect(result.current.currentJobs.get('job-2')?.progress).toBe(100);
      
      // 向已完成的作业发送进度更新
      act(() => {
        progressCallback('job-2', 75, '不应该生效', 10);
      });
      
      // 验证：已完成的作业不受影响
      expect(result.current.currentJobs.get('job-2')?.progress).toBe(100);
      expect(result.current.currentJobs.get('job-2')?.state).toBe('completed');
      
      // 验证：其他运行中的作业仍可正常更新
      act(() => {
        progressCallback('job-1', 85, '正常更新', 5);
      });
      
      expect(result.current.currentJobs.get('job-1')?.progress).toBe(85);
      expect(result.current.currentJobs.get('job-1')?.state).toBe('running');
    });
  });

  describe('🔄 综合场景：防止状态竞态和回归', () => {
    it('快速连续的progress->complete->progress序列应该正确处理', async () => {
      const { result } = renderHook(() => useIntelligentAnalysisWorkflow());
      
      // 开始分析
      await act(async () => {
        await result.current.startAnalysis({
          deviceId: 'device1',
          elementXPath: '//*[@text="rapid-test"]',
          elementBounds: '0,0,100,50',
          xmlContent: '<hierarchy></hierarchy>',
          elementAttributes: {},
        });
      });
      
      // 快速序列：progress -> complete -> progress
      act(() => {
        progressCallback('test-job-id', 90, '即将完成', 2);
        completeCallback('test-job-id', {
          selectionHash: 'rapid-hash',
          smartCandidates: [],
          staticCandidates: [],
          recommendedKey: 'rapid-key'
        });
        progressCallback('test-job-id', 95, '过时进度', 1); // 这个应该被忽略
      });
      
      // 验证最终状态正确
      const job = result.current.currentJobs.get('test-job-id');
      expect(job?.state).toBe('completed');
      expect(job?.progress).toBe(100); // 不是95%
      expect(result.current.isAnalyzing).toBe(false);
    });
  });
});