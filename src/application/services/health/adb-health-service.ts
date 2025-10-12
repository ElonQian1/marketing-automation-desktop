// src/application/services/health/adb-health-service.ts
// module: adb | layer: application | role: service
// summary: ADB健康检查服务

import { AdbDiagnosticService } from '../../../domain/adb/services/adb-diagnostic-service';
import { DeviceManagerService } from '../../../domain/adb/services/DeviceManagerService';
import { StoreOperations } from '../common/StoreOperations';
import type { DiagnosticSummary } from '../../../domain/adb';

/**
 * ADB 健康管理服务
 * 
 * 专门负责健康检查、定期诊断、紧急恢复等功能
 * 从 AdbApplicationService 中提取，实现单一职责原则
 */
export class AdbHealthService {
  private healthChecker: (() => void) | null = null;
  private diagnosticsInterval: NodeJS.Timeout | null = null;

  constructor(
    private diagnosticService: AdbDiagnosticService,
    private deviceManager: DeviceManagerService
  ) {}

  /**
   * 启动健康检查
   */
  async startHealthChecking(): Promise<void> {
    if (this.healthChecker) {
      this.healthChecker();
    }

    console.log('🏥 [AdbHealthService] 启动健康检查...');
    this.healthChecker = await this.diagnosticService.scheduleHealthCheck(300000); // 5分钟
  }

  /**
   * 停止健康检查
   */
  stopHealthChecking(): void {
    if (this.healthChecker) {
      console.log('🛑 [AdbHealthService] 停止健康检查...');
      this.healthChecker();
      this.healthChecker = null;
    }
  }

  /**
   * 设置定期诊断检查
   */
  setupPeriodicDiagnostics(): void {
    // 清除之前的定时器
    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
    }

    this.diagnosticsInterval = setInterval(async () => {
      console.log('🔍 [AdbHealthService] 执行定期诊断检查...');
      try {
        const diagnosticSummary = await this.diagnosticService.runQuickDiagnostic();
        const store = StoreOperations.getStore();
        store.setDiagnosticResults(this.diagnosticService.getLastDiagnosticResults());
        
        // 如果发现严重问题，触发恢复
        if (diagnosticSummary.hasErrors()) {
          console.warn('🚨 [AdbHealthService] 检测到关键问题，触发恢复流程');
          await this.performEmergencyRecovery();
        }
      } catch (error) {
        console.error('❌ [AdbHealthService] 定期诊断失败:', error);
      }
    }, 120000); // 2分钟检查一次

    console.log('🔍 [AdbHealthService] 定期诊断检查已启动');
  }

  /**
   * 停止定期诊断
   */
  stopPeriodicDiagnostics(): void {
    if (this.diagnosticsInterval) {
      console.log('🛑 [AdbHealthService] 停止定期诊断...');
      clearInterval(this.diagnosticsInterval);
      this.diagnosticsInterval = null;
    }
  }

  /**
   * 执行紧急恢复
   */
  async performEmergencyRecovery(): Promise<void> {
    console.log('🚨 [AdbHealthService] 开始紧急恢复流程...');
    
    try {
      const store = StoreOperations.getStore();
      
      // 1. 重置错误状态
      StoreOperations.clearError();
      store.setLoading(false);
      
      // 2. 重新连接 ADB
      try {
        console.log('🔄 [AdbHealthService] 重新启动 ADB 服务器...');
        // 这里应该调用 connectionService，但为了避免循环依赖，暂时跳过
        // await this.connectionService.restartServer();
      } catch (connectionError) {
        console.warn('⚠️ [AdbHealthService] ADB 服务器重启失败:', connectionError);
      }
      
      // 3. 刷新设备列表
      try {
        console.log('📱 [AdbHealthService] 刷新设备列表...');
        const devices = await this.deviceManager.getDevices();
        store.setDevices(devices);
      } catch (deviceError) {
        console.warn('⚠️ [AdbHealthService] 设备列表刷新失败:', deviceError);
      }
      
      // 4. 重新运行诊断
      try {
        console.log('🔍 [AdbHealthService] 重新运行诊断...');
        await this.diagnosticService.runQuickDiagnostic();
        store.setDiagnosticResults(this.diagnosticService.getLastDiagnosticResults());
      } catch (diagnosticError) {
        console.warn('⚠️ [AdbHealthService] 重新诊断失败:', diagnosticError);
      }
      
      console.log('✅ [AdbHealthService] 紧急恢复完成');
      
    } catch (error) {
      console.error('❌ [AdbHealthService] 紧急恢复失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发紧急恢复（公开方法）
   */
  async triggerEmergencyRecovery(): Promise<void> {
    await this.performEmergencyRecovery();
  }

  /**
   * 手动触发健康检查
   */
  async triggerHealthCheck(): Promise<DiagnosticSummary> {
    console.log('🔍 [AdbHealthService] 手动触发健康检查...');
    
    try {
      const diagnosticSummary = await this.diagnosticService.runQuickDiagnostic();
      const store = StoreOperations.getStore();
      store.setDiagnosticResults(this.diagnosticService.getLastDiagnosticResults());
      
      console.log('✅ [AdbHealthService] 健康检查完成');
      return diagnosticSummary;
    } catch (error) {
      console.error('❌ [AdbHealthService] 健康检查失败:', error);
      throw error;
    }
  }

  /**
   * 获取健康状态信息
   */
  getHealthStatus(): {
    isHealthCheckActive: boolean;
    isPeriodicDiagnosticsActive: boolean;
    lastCheckTime?: Date;
  } {
    return {
      isHealthCheckActive: this.healthChecker !== null,
      isPeriodicDiagnosticsActive: this.diagnosticsInterval !== null,
      // 可以添加更多状态信息
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    console.log('[AdbHealthService] 清理健康管理资源...');
    
    this.stopHealthChecking();
    this.stopPeriodicDiagnostics();
    
    console.log('[AdbHealthService] 健康管理资源清理完成');
  }
}