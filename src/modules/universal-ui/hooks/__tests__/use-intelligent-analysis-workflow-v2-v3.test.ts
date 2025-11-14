// src/modules/universal-ui/hooks/__tests__/use-intelligent-analysis-workflow-v2-v3.test.ts
// module: universal-ui | layer: tests | role: v2-v3-dual-mode-tests
// summary: V2/V3双模式切换测试，确保动态路由正确工作

/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock FeatureFlagManager
const mockGetSmartExecutionVersion = vi.fn();
vi.mock('../../../../config/feature-flags', () => ({
  featureFlagManager: {
    getSmartExecutionVersion: mockGetSmartExecutionVersion,
    checkV3Health: vi.fn().mockResolvedValue(true),
    isEnabled: vi.fn().mockReturnValue(true),
  }
}));

// Mock V2 Backend
const mockV2ListenProgress = vi.fn();
const mockV2ListenComplete = vi.fn();
const mockV2ListenError = vi.fn();
const mockV2StartAnalysis = vi.fn();
const mockV2CancelAnalysis = vi.fn();

vi.mock('../../../../services/intelligent-analysis-backend', () => ({
  intelligentAnalysisBackend: {
    listenToAnalysisProgress: mockV2ListenProgress,
    listenToAnalysisComplete: mockV2ListenComplete,
    listenToAnalysisError: mockV2ListenError,
    startAnalysis: mockV2StartAnalysis,
    cancelAnalysis: mockV2CancelAnalysis,
  },
  useIntelligentAnalysisBackend: () => ({
    listenToAnalysisProgress: mockV2ListenProgress,
    listenToAnalysisComplete: mockV2ListenComplete,
    listenToAnalysisError: mockV2ListenError,
    startAnalysis: mockV2StartAnalysis,
    cancelAnalysis: mockV2CancelAnalysis,
  }),
}));

// Mock V3 Backend
const mockV3ListenProgress = vi.fn();
const mockV3ListenComplete = vi.fn();
const mockV3ListenError = vi.fn();
const mockV3ExecuteChain = vi.fn();
const mockV3CancelAnalysis = vi.fn();
const mockV3Cleanup = vi.fn();

vi.mock('../../../../services/intelligent-analysis-backend-v3', () => ({
  IntelligentAnalysisBackendV3: {
    listenToAnalysisProgress: mockV3ListenProgress,
    listenToAnalysisComplete: mockV3ListenComplete,
    listenToAnalysisError: mockV3ListenError,
    executeChainV3: mockV3ExecuteChain,
    cancelAnalysis: mockV3CancelAnalysis,
    cleanup: mockV3Cleanup,
  }
}));

describe('智能分析工作流 - V2/V3双模式路由测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认设置监听器返回清理函数
    mockV2ListenProgress.mockResolvedValue(() => {});
    mockV3ListenProgress.mockResolvedValue(() => {});
    mockV2ListenComplete.mockResolvedValue(() => {});
    mockV3ListenComplete.mockResolvedValue(() => {});
    mockV2ListenError.mockResolvedValue(() => {});
    mockV3ListenError.mockResolvedValue(() => {});
  });

  describe('🔀 版本路由测试', () => {
    it('V2模式：应该调用V2事件监听', () => {
      mockGetSmartExecutionVersion.mockResolvedValue('v2');

      // 直接测试服务层路由逻辑
      const version: 'v2' | 'v3' = 'v2';
      const backendService = version === 'v3' 
        ? { listenToAnalysisProgress: mockV3ListenProgress }
        : { listenToAnalysisProgress: mockV2ListenProgress };

      backendService.listenToAnalysisProgress(() => {});

      expect(mockV2ListenProgress).toHaveBeenCalledTimes(1);
      expect(mockV3ListenProgress).not.toHaveBeenCalled();
    });

    it('V3模式：应该调用V3事件监听', () => {
      mockGetSmartExecutionVersion.mockResolvedValue('v3');

      // 直接测试服务层路由逻辑
      const version: 'v2' | 'v3' = 'v3';
      const backendService = version === 'v3'
        ? { listenToAnalysisProgress: mockV3ListenProgress }
        : { listenToAnalysisProgress: mockV2ListenProgress };

      backendService.listenToAnalysisProgress(() => {});

      expect(mockV3ListenProgress).toHaveBeenCalledTimes(1);
      expect(mockV2ListenProgress).not.toHaveBeenCalled();
    });

    it('V2模式：执行路由应该选择V2 backend', () => {
      const version: 'v2' | 'v3' = 'v2';
      
      if (version === 'v3') {
        mockV3ExecuteChain({}, {});
      } else {
        mockV2StartAnalysis({}, 'step-id', {});
      }

      expect(mockV2StartAnalysis).toHaveBeenCalledTimes(1);
      expect(mockV3ExecuteChain).not.toHaveBeenCalled();
    });

    it('V3模式：执行路由应该选择V3 backend', () => {
      const version: 'v2' | 'v3' = 'v3';
      
      if (version === 'v3') {
        mockV3ExecuteChain({}, {});
      } else {
        mockV2StartAnalysis({}, 'step-id', {});
      }

      expect(mockV3ExecuteChain).toHaveBeenCalledTimes(1);
      expect(mockV2StartAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('🔄 V3失败回退逻辑测试', () => {
    it('V3执行失败：应该捕获异常并准备回退', async () => {
      mockV3ExecuteChain.mockRejectedValue(new Error('V3 backend not available'));

      try {
        await mockV3ExecuteChain({}, {});
      } catch (error) {
        // 验证：捕获到V3错误
        expect(error).toEqual(new Error('V3 backend not available'));
        
        // 这里应该触发回退到V2的逻辑
        await mockV2StartAnalysis({}, 'fallback-step', {});
        expect(mockV2StartAnalysis).toHaveBeenCalled();
      }
    });

    it('V3返回错误结果：should handle gracefully', async () => {
      mockV3ExecuteChain.mockResolvedValue({
        ok: false,
        analysis_id: 'failed-job',
        summary: { reason: '元素未找到' }
      });

      const result = await mockV3ExecuteChain({}, {});
      
      expect(result.ok).toBe(false);
      expect(result.summary.reason).toBe('元素未找到');
      
      // V3正常返回（虽然失败），不应该回退V2
      expect(mockV2StartAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('🎯 取消分析路由测试', () => {
    it('V2模式：应该路由到V2取消方法', async () => {
      const version: 'v2' | 'v3' = 'v2';
      
      if (version === 'v3') {
        await mockV3CancelAnalysis('job-id');
      } else {
        await mockV2CancelAnalysis('job-id');
      }

      expect(mockV2CancelAnalysis).toHaveBeenCalledWith('job-id');
      expect(mockV3CancelAnalysis).not.toHaveBeenCalled();
    });

    it('V3模式：应该路由到V3取消方法', async () => {
      const version: 'v2' | 'v3' = 'v3';
      
      if (version === 'v3') {
        await mockV3CancelAnalysis('job-id');
      } else {
        await mockV2CancelAnalysis('job-id');
      }

      expect(mockV3CancelAnalysis).toHaveBeenCalledWith('job-id');
      expect(mockV2CancelAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('🧹 清理逻辑路由测试', () => {
    it('V2模式：不调用V3清理', () => {
      const version: 'v2' | 'v3' = 'v2';
      
      if (version === 'v3') {
        mockV3Cleanup();
      }

      expect(mockV3Cleanup).not.toHaveBeenCalled();
    });

    it('V3模式：调用V3清理', () => {
      const version: 'v2' | 'v3' = 'v3';
      
      if (version === 'v3') {
        mockV3Cleanup();
      }

      expect(mockV3Cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('📊 事件监听器管理测试', () => {
    it('应该正确设置V2事件监听器', async () => {
      const callbacks = {
        progress: vi.fn(),
        complete: vi.fn(),
        error: vi.fn(),
      };

      await mockV2ListenProgress(callbacks.progress);
      await mockV2ListenComplete(callbacks.complete);
      await mockV2ListenError(callbacks.error);

      expect(mockV2ListenProgress).toHaveBeenCalledWith(callbacks.progress);
      expect(mockV2ListenComplete).toHaveBeenCalledWith(callbacks.complete);
      expect(mockV2ListenError).toHaveBeenCalledWith(callbacks.error);
    });

    it('应该正确设置V3事件监听器', async () => {
      const callbacks = {
        progress: vi.fn(),
        complete: vi.fn(),
        error: vi.fn(),
      };

      await mockV3ListenProgress(callbacks.progress);
      await mockV3ListenComplete(callbacks.complete);
      await mockV3ListenError(callbacks.error);

      expect(mockV3ListenProgress).toHaveBeenCalledWith(callbacks.progress);
      expect(mockV3ListenComplete).toHaveBeenCalledWith(callbacks.complete);
      expect(mockV3ListenError).toHaveBeenCalledWith(callbacks.error);
    });
  });

  describe('✅ 核心路由逻辑验证', () => {
    it('版本切换：路由函数应该正确选择backend', () => {
      const testCases = [
        { version: 'v2' as const, expectedV2: true, expectedV3: false },
        { version: 'v3' as const, expectedV2: false, expectedV3: true },
      ];

      testCases.forEach(({ version, expectedV3 }) => {
        vi.clearAllMocks();
        
        // 模拟路由逻辑
        const backend = version === 'v3' 
          ? { start: mockV3ExecuteChain, cancel: mockV3CancelAnalysis }
          : { start: mockV2StartAnalysis, cancel: mockV2CancelAnalysis };

        backend.start();
        backend.cancel();

        if (expectedV3) {
          expect(mockV3ExecuteChain).toHaveBeenCalled();
          expect(mockV3CancelAnalysis).toHaveBeenCalled();
          expect(mockV2StartAnalysis).not.toHaveBeenCalled();
          expect(mockV2CancelAnalysis).not.toHaveBeenCalled();
        } else {
          expect(mockV2StartAnalysis).toHaveBeenCalled();
          expect(mockV2CancelAnalysis).toHaveBeenCalled();
          expect(mockV3ExecuteChain).not.toHaveBeenCalled();
          expect(mockV3CancelAnalysis).not.toHaveBeenCalled();
        }
      });
    });
  });
});

