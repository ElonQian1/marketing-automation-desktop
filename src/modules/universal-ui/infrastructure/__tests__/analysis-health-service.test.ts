// src/modules/universal-ui/infrastructure/__tests__/analysis-health-service.test.ts
// module: universal-ui | layer: infrastructure | role: health-service-test
// summary: 分析健康检查服务测试

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    default: vi.fn()
  }
}));

import { analysisHealthService } from '../analysis-health-service';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'react-hot-toast';

const mockInvoke = vi.mocked(invoke);
const mockToast = vi.mocked(toast);

describe('AnalysisHealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analysisHealthService.clearCache();
  });

  describe('performHealthCheck', () => {
    it('应该返回健康状态当所有检查通过', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const result = await analysisHealthService.performHealthCheck();

      expect(result.healthy).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.checks).toEqual(mockHealthCheck);
      expect(mockInvoke).toHaveBeenCalledWith('plugin:system_diagnostic|health_check', {});
    });

    it('应该返回错误当ADB未连接', async () => {
      const mockHealthCheck = {
        adb_connected: false,
        device_available: false,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const result = await analysisHealthService.performHealthCheck();

      expect(result.healthy).toBe(false);
      expect(result.errors).toContain('ADB 服务未连接，请启动 ADB 并连接设备');
      expect(result.checks).toEqual(mockHealthCheck);
    });

    it('应该返回错误当设备不可用', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: false,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const result = await analysisHealthService.performHealthCheck();

      expect(result.healthy).toBe(false);
      expect(result.errors).toContain('未检测到可用设备，请确保设备已连接并授权调试');
    });

    it('应该返回警告当XML缓存未就绪', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: false,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const result = await analysisHealthService.performHealthCheck();

      expect(result.healthy).toBe(true); // 警告不影响健康状态
      expect(result.warnings).toContain('XML 缓存未就绪，分析性能可能受影响');
    });

    it('应该处理后端异常', async () => {
      mockInvoke.mockRejectedValue(new Error('Backend error'));

      const result = await analysisHealthService.performHealthCheck();

      expect(result.healthy).toBe(false);
      expect(result.errors).toContain('Backend error');
    });

    it('应该使用缓存避免频繁检查', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      // 第一次调用
      const result1 = await analysisHealthService.performHealthCheck();
      // 第二次调用（应该使用缓存）
      const result2 = await analysisHealthService.performHealthCheck();

      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
  });

  describe('checkBeforeAnalysis', () => {
    it('应该显示成功toast当系统健康', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const result = await analysisHealthService.checkBeforeAnalysis();

      expect(result).toBe(true);
      expect(mockToast.loading).toHaveBeenCalledWith('🔍 检查系统状态...', { duration: 3000 });
      expect(mockToast.success).toHaveBeenCalledWith('✅ 系统状态正常，开始分析', {
        id: 'toast-id',
        duration: 2000
      });
    });

    it('应该显示错误toast当系统不健康', async () => {
      const mockHealthCheck = {
        adb_connected: false,
        device_available: false,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const result = await analysisHealthService.checkBeforeAnalysis();

      expect(result).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('❌ 系统检查失败', {
        id: 'toast-id',
        duration: 4000
      });
    });

    it('应该显示警告toast但允许分析继续', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: false, // 警告条件
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const result = await analysisHealthService.checkBeforeAnalysis();

      expect(result).toBe(true); // 仍然允许分析
      expect(mockToast.success).toHaveBeenCalled();
      expect(mockToast.default).toHaveBeenCalledWith('⚠️ XML 缓存未就绪，分析性能可能受影响', {
        icon: '⚠️',
        duration: 3000
      });
    });
  });

  describe('getStatusSummary', () => {
    it('应该返回健康状态摘要', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const summary = await analysisHealthService.getStatusSummary();

      expect(summary.status).toBe('healthy');
      expect(summary.message).toBe('系统状态良好');
      expect(summary.details).toEqual(mockHealthCheck);
    });

    it('应该返回警告状态摘要', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: false,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const summary = await analysisHealthService.getStatusSummary();

      expect(summary.status).toBe('warning');
      expect(summary.message).toContain('1个警告');
    });

    it('应该返回错误状态摘要', async () => {
      const mockHealthCheck = {
        adb_connected: false,
        device_available: false,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      const summary = await analysisHealthService.getStatusSummary();

      expect(summary.status).toBe('error');
      expect(summary.message).toContain('2个错误');
    });
  });

  describe('clearCache', () => {
    it('应该清除缓存强制重新检查', async () => {
      const mockHealthCheck = {
        adb_connected: true,
        device_available: true,
        xml_cache_ready: true,
        analysis_engine_ready: true
      };

      mockInvoke.mockResolvedValue(mockHealthCheck);

      // 第一次调用
      await analysisHealthService.performHealthCheck();
      
      // 清除缓存
      analysisHealthService.clearCache();
      
      // 第二次调用（应该重新执行检查）
      await analysisHealthService.performHealthCheck();

      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });
});