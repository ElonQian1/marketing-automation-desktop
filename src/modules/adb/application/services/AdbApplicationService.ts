// src/modules/adb/application/services/AdbApplicationService.ts
// module: adb | layer: application | role: app-service
// summary: 应用服务

// modules/adb/application/services | AdbApplicationService | ADB应用服务协调器（重构版）
// 作为Facade模式实现，协调各个专门服务，为UI层提供简化的业务导向API接口

import { Device } from '../../domain/entities/Device';
import { AdbConnection, AdbConfig } from '../../domain/entities/AdbConnection';
import { DiagnosticResult, DiagnosticSummary } from '../../domain/entities/DiagnosticResult';

// 专门化服务
import { DeviceManagementService } from './DeviceManagementService';
import { ConnectionManagementService } from './ConnectionManagementService';
import { DiagnosticManagementService } from './DiagnosticManagementService';

// 外部依赖（暂时保持原始导入路径，后续会迁移）
import { DeviceManagerService } from '../../../../domain/adb/services/DeviceManagerService';
import { ConnectionService } from '../../../../domain/adb/services/ConnectionService';
import { DiagnosticService } from '../../../../domain/adb/services/DiagnosticService';
import { StoreOperations } from '../../../../application/services/common';

/**
 * ADB应用服务（重构版）
 * 
 * 作为Facade模式的实现，协调各个专门服务，
 * 为UI层提供简化的、业务导向的API接口
 * 
 * 重构后职责：
 * - 核心调度和协调
 * - 统一的对外接口
 * - 生命周期管理
 */
export class AdbApplicationService {
  // 专门化服务
  private deviceManagementService: DeviceManagementService;
  private connectionManagementService: ConnectionManagementService;
  private diagnosticManagementService: DiagnosticManagementService;

  constructor(
    private deviceManager: DeviceManagerService,
    private connectionService: ConnectionService,
    private diagnosticService: DiagnosticService
  ) {
    // 初始化专门化服务
    this.deviceManagementService = new DeviceManagementService(deviceManager);
    this.connectionManagementService = new ConnectionManagementService(connectionService);
    this.diagnosticManagementService = new DiagnosticManagementService(diagnosticService);
  }

  // ===== 生命周期管理 =====

  /**
   * 初始化ADB环境
   */
  async initialize(config?: AdbConfig): Promise<void> {
    const store = StoreOperations.getStore();
    
    // 检查Tauri环境
    const { isTauri } = await import('@tauri-apps/api/core');
    if (!isTauri()) {
      console.warn('🌐 运行在浏览器环境中，ADB功能将受限');
      store.setInitializing(false);
      store.setDevices([]);
      StoreOperations.clearError();
      return;
    }
    
    try {
      store.setInitializing(true);
      StoreOperations.clearError();

      // 1. 初始化连接
      await this.connectionManagementService.initializeConnection(config);

      // 2. 运行初始诊断
      await this.diagnosticManagementService.runQuickDiagnostic();

      // 3. 获取设备列表
      await this.deviceManagementService.refreshDevices();

      console.log('✅ [AdbApplicationService] ADB环境初始化完成');
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      StoreOperations.setError(errorObj);
      console.error('❌ [AdbApplicationService] ADB环境初始化失败:', error);
      throw errorObj;
    } finally {
      store.setInitializing(false);
    }
  }

  // ===== 设备管理API（代理到专门服务） =====

  async refreshDevices(): Promise<Device[]> {
    return await this.deviceManagementService.refreshDevices();
  }

  async connectDevice(address: string): Promise<void> {
    return await this.deviceManagementService.connectDevice(address);
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    return await this.deviceManagementService.disconnectDevice(deviceId);
  }

  selectDevice(deviceId: string | null): void {
    this.deviceManagementService.selectDevice(deviceId);
  }

  async getDeviceInfo(deviceId: string): Promise<Record<string, string> | null> {
    return await this.deviceManagementService.getDeviceInfo(deviceId);
  }

  // ===== 连接管理API（代理到专门服务） =====

  async testConnection(): Promise<boolean> {
    return await this.connectionManagementService.testConnection();
  }

  async startAdbServer(): Promise<void> {
    await this.connectionManagementService.startAdbServer();
    // 服务器启动后刷新设备列表
    setTimeout(() => {
      this.refreshDevices().catch(console.error);
    }, 1000);
  }

  async stopAdbServer(): Promise<void> {
    return await this.connectionManagementService.stopAdbServer();
  }

  // ===== 诊断管理API（代理到专门服务） =====

  async triggerHealthCheck(): Promise<DiagnosticSummary> {
    return await this.diagnosticManagementService.triggerHealthCheck();
  }

  async runQuickDiagnostic(): Promise<DiagnosticSummary> {
    return await this.diagnosticManagementService.runQuickDiagnostic();
  }

  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    return await this.diagnosticManagementService.runFullDiagnostic();
  }

  async executeAutoFix(): Promise<boolean> {
    return await this.diagnosticManagementService.executeAutoFix();
  }

  getDiagnosticReport(): DiagnosticResult[] {
    return this.diagnosticManagementService.getDiagnosticReport();
  }

  // ===== 工具方法 =====

  /**
   * 获取当前连接状态
   */
  getCurrentConnection(): AdbConnection | null {
    return this.connectionManagementService.getCurrentConnection();
  }

  /**
   * 检查系统整体健康状态
   */
  async checkSystemHealth(): Promise<number> {
    return await this.diagnosticManagementService.checkSystemHealth();
  }

  /**
   * 清理资源
   */
  dispose(): void {
    console.log('🧹 [AdbApplicationService] 清理资源');
    // 各个专门服务如果有清理逻辑，可以在这里调用
  }
}