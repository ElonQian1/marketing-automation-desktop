// src/application/services/adb-application-service.ts
// module: adb | layer: application | role: service
// summary: ADB应用服务统一入口

import { 
  Device, 
  AdbConfig, 
  DiagnosticResult,
  DiagnosticSummary
} from '../../domain/adb';
import { DeviceManagerService } from '../../domain/adb/services/DeviceManagerService';
import { ConnectionService } from '../../domain/adb/services/ConnectionService';
import { DiagnosticService } from '../../domain/adb/services/DiagnosticService';
import { IUiMatcherRepository, MatchCriteriaDTO, MatchResultDTO } from '../../domain/page-analysis/repositories/IUiMatcherRepository';
import type { ISmartScriptRepository } from '../../domain/smart-script/repositories/ISmartScriptRepository';
import type { ExtendedSmartScriptStep } from '../../types/loopScript';
import type { SmartExecutionResult } from '../../types/execution';
import { DeviceWatchingService } from './device-watching';

// 新的模块化服务
import { AdbQueryService } from './query/adb-query-service';
import { AdbHealthService } from './health/adb-health-service';
import { AdbLogBridgeService } from './logging/adb-log-bridge-service';

// 通用抽象层
import { StoreOperations } from './common';

/**
 * ADB 应用服务（重构版）
 * 
 * 作为 Facade 模式的实现，协调各个专门服务，
 * 为 UI 层提供简化的、业务导向的 API 接口
 * 
 * 重构后职责：
 * - 核心调度和协调
 * - 统一的对外接口
 * - 生命周期管理
 */
export class AdbApplicationService {
  private deviceWatchingService: DeviceWatchingService;
  
  // 专门化服务
  private queryService: AdbQueryService;
  private healthService: AdbHealthService;
  private logBridgeService: AdbLogBridgeService;

  constructor(
    private deviceManager: DeviceManagerService,
    private connectionService: ConnectionService,
    private diagnosticService: DiagnosticService,
    private uiMatcherRepository: IUiMatcherRepository,
    private smartScriptRepository: ISmartScriptRepository
  ) {
    // 初始化专门化服务
    this.queryService = new AdbQueryService();
    this.healthService = new AdbHealthService(this.diagnosticService, this.deviceManager);
    this.logBridgeService = new AdbLogBridgeService();

    // 初始化设备监听服务（策略可配置）
    const strategy = (import.meta as unknown as { env?: { VITE_DEVICE_WATCH_STRATEGY?: string } })?.env?.VITE_DEVICE_WATCH_STRATEGY as ('debounce' | 'immediate' | undefined);
    this.deviceWatchingService = new DeviceWatchingService(deviceManager, {
      strategyType: strategy || 'debounce',
      enableLogging: true
    });
    
    // 设置事件处理器来同步状态到Store
    this.setupEventHandlers();
  }

  // ===== 初始化和配置 =====

  /**
   * 初始化ADB环境
   */
  async initialize(config?: AdbConfig): Promise<void> {
    const store = StoreOperations.getStore();
    
    // ✅ 检查Tauri环境
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

      // 1. 初始化日志桥接
      if (!this.logBridgeService.isLogBridgeReady()) {
        await this.logBridgeService.setupLogBridgeSubscriptions();
      }

      // 2. 初始化连接
      const connection = await this.connectionService.initializeConnection(config);
      store.setConnection(connection);
      store.setConfig(config || AdbConfig.default());

      // 3. 运行初始诊断
      await this.diagnosticService.runQuickDiagnostic();
      store.setDiagnosticResults(this.diagnosticService.getLastDiagnosticResults());

      // 4. 获取设备列表
      const devices = await this.deviceManager.getDevices();
      store.setDevices(devices);

      // 5. 启动设备监听
      this.startDeviceWatching();

      // 6. 启动健康检查
      await this.healthService.startHealthChecking();
      this.healthService.setupPeriodicDiagnostics();

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

  // ===== 设备管理 =====

  /**
   * 刷新设备列表
   */
  async refreshDevices(): Promise<Device[]> {
    return await StoreOperations.withLoadingAndErrorHandling(async () => {
      const devices = await this.deviceManager.getDevices();
      StoreOperations.updateDevices(devices);
      
      console.log(`📱 [AdbApplicationService] 设备列表已刷新，发现 ${devices.length} 台设备`);
      return devices;
    }, '刷新设备列表');
  }

  /**
   * 连接设备
   */
  async connectDevice(address: string): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.deviceManager.connectToDevice(address);
      
      // 刷新设备列表
      await this.refreshDevices();
    }, `连接设备 ${address}`);
  }

  /**
   * 断开设备连接
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      // 取消该设备的所有查询
      this.queryService.cancelAllQueriesForDevice(deviceId);
      
      await this.deviceManager.disconnectDevice(deviceId);
      
      // 如果断开的是当前选中的设备，清除选择
      const store = StoreOperations.getStore();
      if (store.selectedDeviceId === deviceId) {
        StoreOperations.selectDevice(null);
      }
      
      // 刷新设备列表
      await this.refreshDevices();
    }, `断开设备 ${deviceId}`);
  }

  /**
   * 选择设备
   */
  selectDevice(deviceId: string | null): void {
    if (deviceId) {
      const store = StoreOperations.getStore();
      const device = store.devices.find(d => d.id === deviceId);
      if (!device) {
        throw new Error(`设备 ${deviceId} 不存在`);
      }
    }
    StoreOperations.selectDevice(deviceId);
  }

  /**
   * 获取设备详细信息
   */
  async getDeviceInfo(deviceId: string): Promise<Record<string, string> | null> {
    return await this.deviceManager.getDeviceInfo(deviceId);
  }

  // ===== 连接管理 =====

  /**
   * 测试ADB连接
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.connectionService.testConnection();
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * 启动ADB服务器
   */
  async startAdbServer(): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.connectionService.startServer();
      
      // 等待一段时间后刷新设备列表
      setTimeout(() => {
        this.refreshDevices().catch(console.error);
      }, 1000);
    }, 'ADB服务器启动');
  }

  /**
   * 停止ADB服务器
   */
  async stopAdbServer(): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.connectionService.stopServer();
    }, 'ADB服务器停止');
  }

  // ===== 查询服务代理 =====

  /**
   * 获取设备联系人数量（代理到查询服务）
   */
  async getDeviceContactCount(deviceId: string, timeoutMs: number = 10000): Promise<number> {
    return await this.queryService.getDeviceContactCount(deviceId, timeoutMs);
  }

  /**
   * 取消设备查询
   */
  cancelDeviceQuery(deviceId: string): void {
    this.queryService.cancelActiveQuery(deviceId);
  }

  // ===== 健康服务代理 =====

  /**
   * 手动触发健康检查
   */
  async triggerHealthCheck(): Promise<DiagnosticSummary> {
    return await this.healthService.triggerHealthCheck();
  }

  /**
   * 运行快速诊断
   */
  async runQuickDiagnostic(): Promise<DiagnosticSummary> {
    return await this.healthService.triggerHealthCheck();
  }

  /**
   * 运行完整诊断
   */
  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    await this.diagnosticService.runFullDiagnostic();
    const store = StoreOperations.getStore();
    
    // runFullDiagnostic 返回 DiagnosticSummary，但我们需要获取实际的结果数组
    // 从诊断服务中获取最后的结果
    const diagnosticResults = this.diagnosticService.getLastDiagnosticResults();
    store.setDiagnosticResults(diagnosticResults);
    return diagnosticResults;
  }

  /**
   * 执行自动修复
   */
  async executeAutoFix(): Promise<boolean> {
    try {
      // 运行诊断找到问题
      const diagnosticSummary = await this.runQuickDiagnostic();
      
      // 尝试常见的修复方法
      if (diagnosticSummary.hasErrors()) {
        // 重启ADB服务器
        await this.stopAdbServer();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.startAdbServer();
        
        // 重新扫描设备
        await this.refreshDevices();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('自动修复失败:', error);
      return false;
    }
  }

  /**
   * 获取诊断报告
   */
  getDiagnosticReport(): DiagnosticResult[] {
    const store = StoreOperations.getStore();
    return store.diagnosticResults;
  }

  /**
   * 清除ADB密钥
   */
  async clearAdbKeys(): Promise<boolean> {
    try {
      // 这里应该调用 Tauri 命令来清除 ADB 密钥
      // 暂时返回成功，实际实现需要调用后端
      console.log('清除ADB密钥（模拟实现）');
      return true;
    } catch (error) {
      console.error('清除ADB密钥失败:', error);
      return false;
    }
  }

  /**
   * 自动检测ADB路径
   */
  async autoDetectAdbPath(): Promise<string | null> {
    try {
      // 这里应该调用 Tauri 命令来自动检测 ADB 路径
      // 暂时返回null，实际实现需要调用后端
      console.log('自动检测ADB路径（模拟实现）');
      return null;
    } catch (error) {
      console.error('自动检测ADB路径失败:', error);
      return null;
    }
  }

  /**
   * 紧急恢复设备监听
   */
  async emergencyRecoverDeviceListening(): Promise<void> {
    try {
      // 停止当前监听
      this.deviceWatchingService.stopWatching();
      
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 重新启动监听
      this.deviceWatchingService.startWatching((devices: Device[]) => {
        const store = StoreOperations.getStore();
        store.setDevices(devices);
      });
      
      console.log('设备监听已紧急恢复');
    } catch (error) {
      console.error('紧急恢复设备监听失败:', error);
      throw error;
    }
  }

  /**
   * 诊断回调链
   */
  async diagnoseCallbackChain(): Promise<Record<string, unknown>> {
    try {
      // 检查设备监听服务状态
      const watchingStatus = this.isDeviceWatchingActive();
      
      // 获取当前服务状态
      const serviceStatus = this.getServiceStatus();
      
      return {
        watchingStatus,
        serviceStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('诊断回调链失败:', error);
      throw error;
    }
  }

  /**
   * 批量设备操作
   */
  async batchDeviceOperation(deviceIds: string[], operation: string): Promise<Record<string, unknown>[]> {
    const results = [];
    
    for (const deviceId of deviceIds) {
      try {
        let result;
        
        switch (operation) {
          case 'disconnect':
            await this.disconnectDevice(deviceId);
            result = { success: true, deviceId };
            break;
          case 'getInfo':
            const info = await this.getDeviceInfo(deviceId);
            result = { success: true, deviceId, data: info };
            break;
          default:
            result = { success: false, deviceId, error: `未知操作: ${operation}` };
        }
        
        results.push(result);
      } catch (error) {
        results.push({ success: false, deviceId, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 在多个设备上执行智能脚本
   */
  async executeSmartScriptOnDevices(deviceIds: string[], steps: ExtendedSmartScriptStep[]): Promise<Array<{
    deviceId: string;
    success: boolean;
    result?: SmartExecutionResult;
    error?: string;
  }>> {
    const results = [];
    
    for (const deviceId of deviceIds) {
      try {
        const result = await this.executeSmartScript(deviceId, steps);
        results.push({
          deviceId,
          success: result.success,
          result: result
        });
      } catch (error) {
        results.push({
          deviceId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }

  /**
   * 手动触发紧急恢复
   */
  async triggerEmergencyRecovery(): Promise<void> {
    await this.healthService.triggerEmergencyRecovery();
  }

  // ===== UI 元素匹配 =====

  /**
   * 根据匹配条件在真机当前界面查找元素
   */
  async matchElementByCriteria(deviceId: string, criteria: MatchCriteriaDTO): Promise<MatchResultDTO> {
    return await StoreOperations.withLoadingAndErrorHandling(async () => {
      return await this.uiMatcherRepository.matchByCriteria(deviceId, criteria);
    }, `匹配UI元素 - 设备: ${deviceId}`);
  }

  // ===== 智能脚本执行 =====

  /**
   * 执行智能脚本
   */
  async executeSmartScript(
    deviceId: string,
    steps: ExtendedSmartScriptStep[]
  ): Promise<SmartExecutionResult> {
    return await StoreOperations.withLoadingAndErrorHandling(async () => {
      return await this.smartScriptRepository.executeOnDevice(deviceId, steps);
    }, `执行智能脚本 - 设备: ${deviceId}`);
  }

  // ===== 设备监听管理 =====

  /**
   * 启动设备监听
   */
  private startDeviceWatching(): void {
    console.log('👁️ [AdbApplicationService] 启动设备监听服务...');
    
    // 设置设备更新回调
    const onDeviceUpdate = (devices: Device[]) => {
      StoreOperations.updateDevices(devices);
      
      // 设备断开时取消相关查询
      // 这里可以添加更多设备变化处理逻辑
    };
    
    this.deviceWatchingService.startWatching(onDeviceUpdate);
  }

  /**
   * 停止设备监听
   */
  private stopDeviceWatching(): void {
    console.log('🛑 [AdbApplicationService] 停止设备监听服务...');
    this.deviceWatchingService.stopWatching();
  }

  /**
   * 检查监听是否活跃
   */
  isDeviceWatchingActive(): boolean {
    return this.deviceWatchingService.isWatching();
  }

  /**
   * 确保设备监听已启动（幂等）
   */
  ensureDeviceWatchingStarted(): void {
    if (this.deviceWatchingService.isWatching()) {
      console.log('✅ [AdbApplicationService] 设备监听已在运行（幂等检查）');
      return;
    }
    console.log('🔁 [AdbApplicationService] 检测到未在监听，立即启动监听');
    this.startDeviceWatching();
  }

  // ===== 事件处理器 =====

  /**
   * 设置事件处理器来同步状态到Store
   */
  private setupEventHandlers(): void {
    // 设备监听已在 startDeviceWatching 中配置
    // 监听领域事件
    this.setupDomainEventHandlers();
  }

  /**
   * 设置领域事件处理器
   */
  private setupDomainEventHandlers(): void {
    // 可以监听领域事件并作出响应
    // 例如：设备连接失败、诊断异常等
    console.log('📡 [AdbApplicationService] 领域事件处理器已设置');
  }

  // ===== 资源清理 =====

  /**
   * 清理资源（应用关闭时调用）
   */
  cleanup(): void {
    console.log('🧹 [AdbApplicationService] 开始清理资源...');

    // 停止设备监听
    this.stopDeviceWatching();

    // 清理各专门服务
    this.queryService.cleanup();
    this.healthService.cleanup();
    this.logBridgeService.cleanup();

    console.log('🧹 [AdbApplicationService] 资源已清理');
  }

  // ===== 调试和状态信息 =====

  /**
   * 获取服务状态信息
   */
  getServiceStatus(): {
    deviceWatching: boolean;
    queryService: { activeQueries: number; devices: string[] };
    healthService: { isHealthCheckActive: boolean; isPeriodicDiagnosticsActive: boolean };
    logBridge: { isReady: boolean; activeListeners: number };
  } {
    return {
      deviceWatching: this.deviceWatchingService.isWatching(),
      queryService: {
        activeQueries: this.queryService.getActiveQueryCount(),
        devices: this.queryService.getActiveQueryDevices()
      },
      healthService: this.healthService.getHealthStatus(),
      logBridge: {
        isReady: this.logBridgeService.isLogBridgeReady(),
        activeListeners: this.logBridgeService.getActiveListenerCount()
      }
    };
  }
}