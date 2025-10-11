// src/application/services/precise-acquisition/PreciseAcquisitionSystem.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客系统主入口
 * 
 * 统一管理精准获客系统的生命周期、初始化和配置
 */

import { 
  initializePreciseAcquisitionServices,
  disposePreciseAcquisitionServices,
  performHealthCheck,
  getServiceStats,
  validateSystemConfiguration,
  setupGlobalErrorHandling,
  getService,
  SERVICE_KEYS
} from './ServiceRegistry';

import { getConfigManager } from '../shared/ConfigurationManager';
import { ErrorHandler } from '../shared/ErrorHandlingSystem';
import type { 
  ITagManagementService,
  IReportingService
} from '../shared/SharedInterfaces';
import type { IService } from '../shared/DependencyContainer';

// ==================== 系统状态管理 ====================

export enum SystemStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  ERROR = 'error',
  DISPOSING = 'disposing',
  DISPOSED = 'disposed'
}

export interface SystemInfo {
  status: SystemStatus;
  version: string;
  startTime: Date | null;
  uptime: number;
  services: {
    total: number;
    healthy: number;
    errors: number;
  };
  configuration: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// ==================== 主系统管理器 ====================

export class PreciseAcquisitionSystem {
  private static instance: PreciseAcquisitionSystem;
  private status: SystemStatus = SystemStatus.UNINITIALIZED;
  private startTime: Date | null = null;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getInstance(): PreciseAcquisitionSystem {
    if (!PreciseAcquisitionSystem.instance) {
      PreciseAcquisitionSystem.instance = new PreciseAcquisitionSystem();
    }
    return PreciseAcquisitionSystem.instance;
  }

  /**
   * 启动精准获客系统
   */
  async start(): Promise<void> {
    if (this.status !== SystemStatus.UNINITIALIZED) {
      console.log(`[PreciseAcquisitionSystem] System already started (status: ${this.status})`);
      return;
    }

    try {
      this.status = SystemStatus.INITIALIZING;
      console.log('[PreciseAcquisitionSystem] Starting precision acquisition system...');

      // 1. 设置全局错误处理
      setupGlobalErrorHandling();
      console.log('[PreciseAcquisitionSystem] Global error handling configured');

      // 2. 验证系统配置
      const configValidation = await validateSystemConfiguration();
      if (!configValidation.valid) {
        throw new Error(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
      }
      
      if (configValidation.warnings.length > 0) {
        console.warn('[PreciseAcquisitionSystem] Configuration warnings:', configValidation.warnings);
      }
      console.log('[PreciseAcquisitionSystem] Configuration validated');

      // 3. 初始化所有服务
      await initializePreciseAcquisitionServices();
      console.log('[PreciseAcquisitionSystem] Services initialized');

      // 4. 执行健康检查
      const healthCheck = await performHealthCheck();
      if (!healthCheck.healthy) {
        const unhealthyServices = healthCheck.services.filter(s => !s.healthy);
        console.warn('[PreciseAcquisitionSystem] Some services are unhealthy:', unhealthyServices);
      }
      console.log('[PreciseAcquisitionSystem] Health check completed');

      // 5. 系统启动完成
      this.status = SystemStatus.RUNNING;
      this.startTime = new Date();
      
      console.log('[PreciseAcquisitionSystem] ✅ Precision acquisition system started successfully');
      console.log('[PreciseAcquisitionSystem] System info:', await this.getSystemInfo());

    } catch (error) {
      this.status = SystemStatus.ERROR;
      console.error('[PreciseAcquisitionSystem] ❌ Failed to start system:', error);
      
      this.errorHandler.handle(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * 停止精准获客系统
   */
  async stop(): Promise<void> {
    if (this.status === SystemStatus.DISPOSED || this.status === SystemStatus.DISPOSING) {
      console.log('[PreciseAcquisitionSystem] System already stopped');
      return;
    }

    try {
      this.status = SystemStatus.DISPOSING;
      console.log('[PreciseAcquisitionSystem] Stopping precision acquisition system...');

      // 销毁所有服务
      await disposePreciseAcquisitionServices();
      console.log('[PreciseAcquisitionSystem] Services disposed');

      this.status = SystemStatus.DISPOSED;
      this.startTime = null;
      
      console.log('[PreciseAcquisitionSystem] ✅ System stopped successfully');

    } catch (error) {
      this.status = SystemStatus.ERROR;
      console.error('[PreciseAcquisitionSystem] ❌ Error stopping system:', error);
      
      this.errorHandler.handle(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * 重启系统
   */
  async restart(): Promise<void> {
    console.log('[PreciseAcquisitionSystem] Restarting system...');
    
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    await this.start();
    
    console.log('[PreciseAcquisitionSystem] ✅ System restarted successfully');
  }

  /**
   * 获取系统状态
   */
  getStatus(): SystemStatus {
    return this.status;
  }

  /**
   * 检查系统是否正在运行
   */
  isRunning(): boolean {
    return this.status === SystemStatus.RUNNING;
  }

  /**
   * 获取系统信息
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const configValidation = await validateSystemConfiguration();
    const serviceStats = getServiceStats();
    const healthCheck = await performHealthCheck();
    
    const healthyServices = healthCheck.services.filter(s => s.healthy).length;
    const errorServices = healthCheck.services.filter(s => !s.healthy).length;

    return {
      status: this.status,
      version: getConfigManager().getConfig().version,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      services: {
        total: serviceStats.totalServices,
        healthy: healthyServices,
        errors: errorServices
      },
      configuration: {
        valid: configValidation.valid,
        errors: configValidation.errors,
        warnings: configValidation.warnings
      }
    };
  }

  /**
   * 执行系统诊断
   */
  async diagnose(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    details: {
      configuration: { status: string; issues: string[] };
      services: { status: string; issues: string[] };
      performance: { status: string; metrics: Record<string, any> };
    };
  }> {
    console.log('[PreciseAcquisitionSystem] Running system diagnostics...');

    const configValidation = await validateSystemConfiguration();
    const healthCheck = await performHealthCheck();
    const serviceStats = getServiceStats();

    // 配置诊断
    const configStatus = configValidation.valid ? 'healthy' : 'error';
    const configIssues = [...configValidation.errors, ...configValidation.warnings];

    // 服务诊断
    const unhealthyServices = healthCheck.services.filter(s => !s.healthy);
    const serviceStatus = unhealthyServices.length === 0 ? 'healthy' : 
                         unhealthyServices.length < serviceStats.totalServices / 2 ? 'warning' : 'error';
    const serviceIssues = unhealthyServices.map(s => `${s.key}: ${s.error || 'unhealthy'}`);

    // 性能诊断
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const performanceMetrics = {
      uptime,
      memoryUsage: process.memoryUsage(),
      totalServices: serviceStats.totalServices,
      healthyServices: healthCheck.services.filter(s => s.healthy).length
    };

    // 整体状态评估
    const hasErrors = configStatus === 'error' || serviceStatus === 'error';
    const hasWarnings = serviceStatus === 'warning' || configIssues.length > 0;
    
    const overall: 'healthy' | 'warning' | 'error' = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';

    const diagnosis = {
      overall,
      details: {
        configuration: { status: configStatus, issues: configIssues },
        services: { status: serviceStatus, issues: serviceIssues },
        performance: { status: 'healthy', metrics: performanceMetrics }
      }
    };

    console.log('[PreciseAcquisitionSystem] Diagnostics completed:', diagnosis);
    return diagnosis;
  }
}

// ==================== 服务访问器 ====================

/**
 * 标签系统服务访问器
 */
export class TagSystemAccessor {
  private static service: any | null = null;

  static async getInstance(): Promise<any> {
    if (!TagSystemAccessor.service) {
      TagSystemAccessor.service = await GenericServiceAccessor.getService(SERVICE_KEYS.TAG_SYSTEM_MANAGER);
    }
    return TagSystemAccessor.service;
  }

  static reset(): void {
    TagSystemAccessor.service = null;
  }
}

/**
 * 通用服务访问器
 */
export class GenericServiceAccessor {
  private static services: Map<symbol, any> = new Map();

  static async getService<T extends IService>(key: symbol): Promise<T> {
    if (!GenericServiceAccessor.services.has(key)) {
      const service = await getService<T>(key);
      GenericServiceAccessor.services.set(key, service);
    }
    return GenericServiceAccessor.services.get(key);
  }

  static reset(): void {
    GenericServiceAccessor.services.clear();
  }

  static resetService(key: symbol): void {
    GenericServiceAccessor.services.delete(key);
  }
}

/**
 * 报告服务访问器
 */
export class ReportingAccessor {
  private static service: any | null = null;

  static async getInstance(): Promise<any> {
    if (!ReportingAccessor.service) {
      ReportingAccessor.service = await GenericServiceAccessor.getService(SERVICE_KEYS.REPORTING_SERVICE);
    }
    return ReportingAccessor.service;
  }

  static reset(): void {
    ReportingAccessor.service = null;
  }
}

// ==================== 便捷函数 ====================

/**
 * 获取精准获客系统实例
 */
export function getPreciseAcquisitionSystem(): PreciseAcquisitionSystem {
  return PreciseAcquisitionSystem.getInstance();
}

/**
 * 启动精准获客系统
 */
export async function startPreciseAcquisitionSystem(): Promise<void> {
  const system = getPreciseAcquisitionSystem();
  await system.start();
}

/**
 * 停止精准获客系统
 */
export async function stopPreciseAcquisitionSystem(): Promise<void> {
  const system = getPreciseAcquisitionSystem();
  await system.stop();
}

/**
 * 重启精准获客系统
 */
export async function restartPreciseAcquisitionSystem(): Promise<void> {
  const system = getPreciseAcquisitionSystem();
  await system.restart();
}

/**
 * 检查系统是否运行中
 */
export function isPreciseAcquisitionSystemRunning(): boolean {
  const system = getPreciseAcquisitionSystem();
  return system.isRunning();
}

/**
 * 获取系统信息
 */
export async function getPreciseAcquisitionSystemInfo(): Promise<SystemInfo> {
  const system = getPreciseAcquisitionSystem();
  return await system.getSystemInfo();
}

/**
 * 执行系统诊断
 */
export async function diagnosePreciseAcquisitionSystem(): Promise<{
  overall: 'healthy' | 'warning' | 'error';
  details: {
    configuration: { status: string; issues: string[] };
    services: { status: string; issues: string[] };
    performance: { status: string; metrics: Record<string, any> };
  };
}> {
  const system = getPreciseAcquisitionSystem();
  return await system.diagnose();
}

// ==================== 服务访问便捷函数 ====================

/**
 * 获取标签系统服务
 */
export async function getTagSystemService(): Promise<any> {
  return await TagSystemAccessor.getInstance();
}

/**
 * 获取CSV验证服务
 */
export async function getCsvValidationService(): Promise<any> {
  return await GenericServiceAccessor.getService(SERVICE_KEYS.CSV_VALIDATION_SERVICE);
}

/**
 * 获取评论收集服务
 */
export async function getCommentCollectionService(): Promise<any> {
  return await GenericServiceAccessor.getService(SERVICE_KEYS.COMMENT_COLLECTION_ADAPTER);
}

/**
 * 获取任务执行服务
 */
export async function getTaskExecutionService(): Promise<any> {
  return await GenericServiceAccessor.getService(SERVICE_KEYS.TASK_EXECUTION_ENGINE);
}

/**
 * 获取速率控制服务
 */
export async function getRateControlService(): Promise<any> {
  return await GenericServiceAccessor.getService(SERVICE_KEYS.RATE_CONTROL_SERVICE);
}

/**
 * 获取报告服务
 */
export async function getReportingService(): Promise<any> {
  return await ReportingAccessor.getInstance();
}

// ==================== 错误恢复 ====================

/**
 * 重置所有服务访问器
 */
export function resetAllServiceAccessors(): void {
  TagSystemAccessor.reset();
  ReportingAccessor.reset();
  GenericServiceAccessor.reset();
  
  console.log('[PreciseAcquisitionSystem] All service accessors reset');
}

/**
 * 紧急系统重置
 */
export async function emergencySystemReset(): Promise<void> {
  try {
    console.log('[PreciseAcquisitionSystem] Performing emergency system reset...');
    
    // 1. 重置所有服务访问器
    resetAllServiceAccessors();
    
    // 2. 停止系统（如果正在运行）
    const system = getPreciseAcquisitionSystem();
    if (system.isRunning()) {
      await system.stop();
    }
    
    // 3. 等待清理完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. 重新启动系统
    await system.start();
    
    console.log('[PreciseAcquisitionSystem] ✅ Emergency reset completed successfully');
    
  } catch (error) {
    console.error('[PreciseAcquisitionSystem] ❌ Emergency reset failed:', error);
    throw error;
  }
}