// src/application/hooks/useAdb.ts
// module: application | layer: application | role: hook
// summary: React Hook

import { useCallback, useEffect, useMemo } from 'react';
import { 
  useAdbStore,
  useSelectedDevice,
  useOnlineDevices,
  useConnection,
  useIsConnected,
  useAdbPath,
  useDiagnosticResults,
  useDiagnosticSummary,
  useHasErrors,
  useIsLoading,
  useIsInitializing,
  useLastError,
  useAdbActions
} from '../store/adbStore';
import { AdbConfig } from '../../domain/adb';
import { ServiceFactory } from '../services/ServiceFactory';
import type { MatchCriteria } from '../../modules/intelligent-strategy-system/types/StrategyTypes';
import type { SmartScriptStep } from '../../types/smartScript';
// 统一策略/字段规范化工具（与网格检查器一致）
// import { toBackendStrategy, normalizeFieldsAndValues, normalizeIncludes, normalizeExcludes } from '../../components/universal-ui/views/grid-view/panels/node-detail';

// 全局初始化状态，防止多个 useAdb Hook 同时初始化
let globalInitPromise: Promise<void> | null = null;
// 防止重复刷新设备列表
let isRefreshingDevices = false;

/**
 * 统一的ADB Hook（重构版）
 * 
 * 作为React组件与ADB功能的唯一接口，
 * 提供所有ADB相关的状态和操作方法
 * 
 * 重构后只保留存在的方法，移除了不兼容的功能
 */
export const useAdb = () => {
  const applicationService = useMemo(() => ServiceFactory.getAdbApplicationService(), []);

  // ===== 状态选择器 =====
  
  // 设备相关状态
  const devices = useAdbStore(state => state.devices);
  const selectedDevice = useSelectedDevice();
  const onlineDevices = useOnlineDevices();
  
  // 连接相关状态
  const connection = useConnection();
  const isConnected = useIsConnected();
  const adbPath = useAdbPath();
  
  // 诊断相关状态
  const diagnosticResults = useDiagnosticResults();
  const diagnosticSummary = useDiagnosticSummary();
  const hasErrors = useHasErrors();
  
  // 加载相关状态
  const isLoading = useIsLoading();
  const isInitializing = useIsInitializing();
  const lastError = useLastError();
  
  // Actions
  const actions = useAdbActions();

  // ===== 初始化和配置 =====

  /**
   * 初始化ADB环境
   */
  const initialize = useCallback(async (config?: AdbConfig) => {
    // 使用全局Promise防止重复初始化
    if (globalInitPromise) {
      return globalInitPromise;
    }

    globalInitPromise = (async () => {
      try {
        await applicationService.initialize(config);
      } catch (error) {
        console.error('ADB初始化失败:', error);
        throw error;
      } finally {
        // 初始化完成后清除全局Promise
        globalInitPromise = null;
      }
    })();

    return globalInitPromise;
  }, [applicationService]);

  /**
   * 更新配置（重构版本通过重新初始化实现）
   */
  const updateConfig = useCallback(async (config: AdbConfig) => {
    await applicationService.initialize(config);
  }, [applicationService]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    const store = useAdbStore.getState();
    store.setDevices([]);
    store.setSelectedDevice(null);
    store.setConnection(null);
    store.setError(null);
  }, []);

  // ===== 设备操作 =====

  /**
   * 刷新设备列表
   */
  const refreshDevices = useCallback(async () => {
    if (isRefreshingDevices) {
      console.log('🔄 设备列表刷新中，跳过重复调用');
      return devices;
    }
    
    isRefreshingDevices = true;
    try {
      return await applicationService.refreshDevices();
    } finally {
      isRefreshingDevices = false;
    }
  }, [applicationService, devices]);

  /**
   * 连接到设备
   */
  const connectDevice = useCallback(async (address: string) => {
    await applicationService.connectDevice(address);
  }, [applicationService]);

  /**
   * 断开设备连接
   */
  const disconnectDevice = useCallback(async (deviceId: string) => {
    await applicationService.disconnectDevice(deviceId);
  }, [applicationService]);

  /**
   * 选择设备
   */
  const selectDevice = useCallback((deviceId: string | null) => {
    applicationService.selectDevice(deviceId);
  }, [applicationService]);

  /**
   * 获取设备详细信息
   */
  const getDeviceInfo = useCallback(async (deviceId: string) => {
    return await applicationService.getDeviceInfo(deviceId);
  }, [applicationService]);

  // ===== 连接管理 =====

  /**
   * 测试连接
   */
  const testConnection = useCallback(async () => {
    return await applicationService.testConnection();
  }, [applicationService]);

  /**
   * 启动ADB服务器
   */
  const startAdbServer = useCallback(async () => {
    await applicationService.startAdbServer();
  }, [applicationService]);

  // ===== 查询功能 =====

  /**
   * 获取设备联系人数量
   */
  const getDeviceContactCount = useCallback(async (deviceId: string, timeoutMs: number = 10000) => {
    return await applicationService.getDeviceContactCount(deviceId, timeoutMs);
  }, [applicationService]);

  /**
   * 取消设备查询
   */
  const cancelDeviceQuery = useCallback((deviceId: string) => {
    applicationService.cancelDeviceQuery(deviceId);
  }, [applicationService]);

  // ===== 健康检查 =====

  /**
   * 手动触发健康检查
   */
  const triggerHealthCheck = useCallback(async () => {
    return await applicationService.triggerHealthCheck();
  }, [applicationService]);

  /**
   * 手动触发紧急恢复
   */
  const triggerEmergencyRecovery = useCallback(async () => {
    await applicationService.triggerEmergencyRecovery();
  }, [applicationService]);

  // ===== UI匹配 =====

  /**
   * 元素匹配
   */
  const matchElementByCriteria = useCallback(async (deviceId: string, criteria: MatchCriteria) => {
    return await applicationService.matchElementByCriteria(deviceId, criteria);
  }, [applicationService]);

  // ===== 智能脚本执行 =====

  /**
   * 执行智能脚本
   */
  const executeSmartScript = useCallback(async (deviceId: string, steps: SmartScriptStep[]) => {
    return await applicationService.executeSmartScript(deviceId, steps);
  }, [applicationService]);

  // ===== 服务状态 =====

  /**
   * 获取服务状态
   */
  const getServiceStatus = useCallback(() => {
    return applicationService.getServiceStatus();
  }, [applicationService]);

  /**
   * 检查设备监听是否活跃
   */
  const isDeviceWatchingActive = useCallback(() => {
    return applicationService.isDeviceWatchingActive();
  }, [applicationService]);

  /**
   * 确保设备监听已启动
   */
  const ensureDeviceWatchingStarted = useCallback(() => {
    applicationService.ensureDeviceWatchingStarted();
  }, [applicationService]);

  // ===== 派生状态 =====

  /**
   * 设备总数
   */
  const deviceCount = useMemo(() => devices.length, [devices.length]);

  /**
   * 在线设备数量
   */
  const onlineDeviceCount = useMemo(() => onlineDevices.length, [onlineDevices.length]);

  /**
   * 是否就绪（有设备且连接正常）
   */
  const isReady = useMemo(() => {
    return isConnected && devices.length > 0 && !hasErrors;
  }, [isConnected, devices.length, hasErrors]);

  /**
   * 是否健康（无错误且服务正常）
   */
  const isHealthy = useMemo(() => {
    return !hasErrors && !lastError;
  }, [hasErrors, lastError]);

  // ===== 连接管理 =====

  /**
   * 连接到模拟器
   */
  const connectToEmulators = useCallback(async () => {
    try {
      // 常见的模拟器端口
      const emulatorPorts = ['5554', '5555', '5556', '5557', '5558', '5559'];
      const results = [];
      
      for (const port of emulatorPorts) {
        try {
          await connectDevice(`127.0.0.1:${port}`);
          results.push({ port, success: true });
        } catch (error) {
          results.push({ port, success: false, error });
        }
      }
      
      // 刷新设备列表以获取新连接的设备
      await refreshDevices();
      return results;
    } catch (error) {
      console.error('连接模拟器失败:', error);
      throw error;
    }
  }, [connectDevice, refreshDevices]);

  /**
   * 重启ADB服务器
   */
  const restartAdbServer = useCallback(async () => {
    try {
      await applicationService.stopAdbServer();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      await applicationService.startAdbServer();
      await refreshDevices();
    } catch (error) {
      console.error('重启ADB服务器失败:', error);
      throw error;
    }
  }, [applicationService, refreshDevices]);

  /**
   * 停止ADB服务器
   */
  const stopAdbServer = useCallback(async () => {
    await applicationService.stopAdbServer();
  }, [applicationService]);

  // ===== 诊断功能 =====

  /**
   * 运行快速诊断
   */
  const runQuickDiagnostic = useCallback(async () => {
    return await applicationService.runQuickDiagnostic();
  }, [applicationService]);

  /**
   * 运行完整诊断
   */
  const runFullDiagnostic = useCallback(async () => {
    return await applicationService.runFullDiagnostic();
  }, [applicationService]);

  /**
   * 执行自动修复
   */
  const executeAutoFix = useCallback(async () => {
    return await applicationService.executeAutoFix();
  }, [applicationService]);

  /**
   * 获取诊断报告
   */
  const getDiagnosticReport = useCallback(() => {
    return applicationService.getDiagnosticReport();
  }, [applicationService]);

  // ===== 快捷操作 =====

  /**
   * 快速连接（自动检测并连接设备）
   */
  const quickConnect = useCallback(async () => {
    try {
      await refreshDevices();
      if (devices.length === 0) {
        await connectToEmulators();
      }
      if (devices.length > 0 && !selectedDevice) {
        selectDevice(devices[0].id);
      }
      return true;
    } catch (error) {
      console.error('快速连接失败:', error);
      return false;
    }
  }, [refreshDevices, devices, connectToEmulators, selectedDevice, selectDevice]);

  /**
   * 快速修复（诊断并自动修复问题）
   */
  const quickFix = useCallback(async () => {
    try {
      const diagnostic = await runQuickDiagnostic();
      if (diagnostic.hasErrors()) {
        await executeAutoFix();
      }
      return true;
    } catch (error) {
      console.error('快速修复失败:', error);
      return false;
    }
  }, [runQuickDiagnostic, executeAutoFix]);

  // ===== 错误处理 =====

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    const store = useAdbStore.getState();
    store.setError(null);
  }, []);

  // ===== ADB密钥管理 =====

  /**
   * 清除ADB密钥
   */
  const clearAdbKeys = useCallback(async () => {
    return await applicationService.clearAdbKeys();
  }, [applicationService]);

  // ===== 路径检测 =====

  /**
   * 自动检测ADB路径
   */
  const autoDetectAdbPath = useCallback(async () => {
    return await applicationService.autoDetectAdbPath();
  }, [applicationService]);

  // ===== 紧急恢复功能 =====

  /**
   * 紧急恢复设备监听
   */
  const emergencyRecoverDeviceListening = useCallback(async () => {
    try {
      await applicationService.emergencyRecoverDeviceListening();
      await refreshDevices();
    } catch (error) {
      console.error('紧急恢复设备监听失败:', error);
      throw error;
    }
  }, [applicationService, refreshDevices]);

  /**
   * 诊断回调链
   */
  const diagnoseCallbackChain = useCallback(async () => {
    return await applicationService.diagnoseCallbackChain();
  }, [applicationService]);

  // ===== 批量操作 =====

  /**
   * 批量设备操作
   */
  const batchDeviceOperation = useCallback(async (deviceIds: string[], operation: string) => {
    return await applicationService.batchDeviceOperation(deviceIds, operation);
  }, [applicationService]);

  // ===== 智能脚本执行（多设备） =====

  /**
   * 在多个设备上执行智能脚本
   */
  const executeSmartScriptOnDevices = useCallback(async (deviceIds: string[], steps: SmartScriptStep[]) => {
    return await applicationService.executeSmartScriptOnDevices(deviceIds, steps);
  }, [applicationService]);

  // ===== 自动初始化 =====

  /**
   * 组件挂载时自动初始化
   */
  useEffect(() => {
    let mounted = true;

    const autoInitialize = async () => {
      try {
        // 检查是否已经初始化过
        if (isInitializing || devices.length > 0) {
          return;
        }

        await initialize();
      } catch (error) {
        if (mounted) {
          console.error('自动初始化失败:', error);
        }
      }
    };

    autoInitialize();

    return () => {
      mounted = false;
    };
  }, [initialize, isInitializing, devices.length]);

  // ===== 清理资源 =====

  /**
   * 清理资源
   */
  const cleanup = useCallback(() => {
    applicationService.cleanup();
  }, [applicationService]);

  // ===== 返回接口 =====

  return {
    // 状态
    devices,
    selectedDevice,
    onlineDevices,
    connection,
    isConnected,
    adbPath,
    diagnosticResults,
    diagnosticSummary,
    hasErrors,
    isLoading,
    isInitializing,
    lastError,

    // 派生状态
    deviceCount,
    onlineDeviceCount,
    isReady,
    isHealthy,

    // 初始化和配置
    initialize,
    updateConfig,
    reset,

    // 设备操作
    refreshDevices,
    connectDevice,
    disconnectDevice,
    selectDevice,
    getDeviceInfo,

    // 连接管理
    testConnection,
    startAdbServer,
    connectToEmulators,
    restartAdbServer,
    stopAdbServer,

    // 查询功能
    getDeviceContactCount,
    cancelDeviceQuery,

    // 健康检查
    triggerHealthCheck,
    triggerEmergencyRecovery,

    // 诊断功能
    runQuickDiagnostic,
    runFullDiagnostic,
    executeAutoFix,
    getDiagnosticReport,

    // 快捷操作
    quickConnect,
    quickFix,

    // 错误处理
    clearError,

    // ADB密钥管理
    clearAdbKeys,

    // 路径检测
    autoDetectAdbPath,

    // 紧急恢复功能
    emergencyRecoverDeviceListening,
    diagnoseCallbackChain,

    // 批量操作
    batchDeviceOperation,

    // UI匹配
    matchElementByCriteria,

    // 智能脚本执行
    executeSmartScript,
    executeSmartScriptOnDevices,

    // 服务状态
    getServiceStatus,
    isDeviceWatchingActive,
    ensureDeviceWatchingStarted,

    // 清理
    cleanup,

    // Store actions (直接暴露)
    ...actions
  };
};

export default useAdb;