// src/modules/universal-ui/infrastructure/analysis-health-service.ts
// module: universal-ui | layer: infrastructure | role: health-check-service
// summary: 分析启动前的系统健康检查服务

import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-hot-toast';

interface SystemHealthCheck {
  adb_connected: boolean;
  device_available: boolean;
  xml_cache_ready: boolean;
  analysis_engine_ready: boolean;
}

interface HealthCheckResult {
  healthy: boolean;
  checks: SystemHealthCheck;
  errors: string[];
  warnings: string[];
}

/**
 * 分析健康检查服务
 * 确保分析启动前系统状态正常
 */
export class AnalysisHealthService {
  private lastCheckTime = 0;
  private lastResult: HealthCheckResult | null = null;
  private readonly CACHE_TTL = 5000; // 5秒缓存

  /**
   * 执行完整的系统健康检查
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const now = Date.now();
    
    // 使用缓存结果避免频繁检查
    if (this.lastResult && (now - this.lastCheckTime) < this.CACHE_TTL) {
      return this.lastResult;
    }

    try {
      console.log('🔍 [HealthService] 开始系统健康检查...');
      
      const checks = await invoke<SystemHealthCheck>('analysis_health_check', {});
      const errors: string[] = [];
      const warnings: string[] = [];

      // 检查ADB连接
      if (!checks.adb_connected) {
        errors.push('ADB 服务未连接，请启动 ADB 并连接设备');
      }

      // 检查设备可用性
      if (!checks.device_available) {
        errors.push('未检测到可用设备，请确保设备已连接并授权调试');
      }

      // 检查XML缓存
      if (!checks.xml_cache_ready) {
        warnings.push('XML 缓存未就绪，分析性能可能受影响');
      }

      // 检查分析引擎
      if (!checks.analysis_engine_ready) {
        errors.push('智能分析引擎未就绪，请稍后重试');
      }

      const result: HealthCheckResult = {
        healthy: errors.length === 0,
        checks,
        errors,
        warnings
      };

      this.lastCheckTime = now;
      this.lastResult = result;

      console.log('✅ [HealthService] 健康检查完成', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '系统健康检查失败';
      console.error('❌ [HealthService] 健康检查异常:', error);
      
      return {
        healthy: false,
        checks: {
          adb_connected: false,
          device_available: false,
          xml_cache_ready: false,
          analysis_engine_ready: false
        },
        errors: [errorMessage],
        warnings: []
      };
    }
  }

  /**
   * 执行分析启动前的健康检查并显示反馈
   * @returns true 如果系统健康，可以启动分析
   */
  async checkBeforeAnalysis(): Promise<boolean> {
    const toastId = toast.loading('🔍 检查系统状态...', {
      duration: 3000
    });

    try {
      const result = await this.performHealthCheck();
      
      if (result.healthy) {
        toast.success('✅ 系统状态正常，开始分析', {
          id: toastId,
          duration: 2000
        });
        
        // 显示警告但不阻止分析
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            toast(`⚠️ ${warning}`, {
              icon: '⚠️',
              duration: 3000
            });
          });
        }

        return true;
      } else {
        toast.error('❌ 系统检查失败', {
          id: toastId,
          duration: 4000
        });

        // 显示具体错误信息
        result.errors.forEach((error, index) => {
          setTimeout(() => {
            toast.error(error, {
              duration: 5000,
              position: 'top-center'
            });
          }, index * 500); // 错误消息间隔显示
        });

        return false;
      }
    } catch (error) {
      toast.error('⚠️ 健康检查异常，请重试', {
        id: toastId,
        duration: 4000
      });
      console.error('[HealthService] 检查异常:', error);
      return false;
    }
  }

  /**
   * 清除健康检查缓存（强制重新检查）
   */
  clearCache(): void {
    this.lastCheckTime = 0;
    this.lastResult = null;
  }

  /**
   * 获取系统状态摘要（用于UI显示）
   */
  async getStatusSummary(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details: SystemHealthCheck;
  }> {
    const result = await this.performHealthCheck();
    
    if (result.healthy) {
      return {
        status: result.warnings.length > 0 ? 'warning' : 'healthy',
        message: result.warnings.length > 0 
          ? `系统正常 (${result.warnings.length}个警告)` 
          : '系统状态良好',
        details: result.checks
      };
    } else {
      return {
        status: 'error',
        message: `发现${result.errors.length}个错误`,
        details: result.checks
      };
    }
  }
}

// 全局实例
export const analysisHealthService = new AnalysisHealthService();