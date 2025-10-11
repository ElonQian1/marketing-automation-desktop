// src/modules/precise-acquisition/application/system/SystemLifecycleManager.ts
// module: application | layer: application | role: application-logic
// summary: 应用逻辑

// modules/precise-acquisition/application/system | SystemLifecycleManager | 系统生命周期管理器
// 负责系统的初始化、健康检查、关闭流程和状态监控，确保系统稳定运行

import { AuditService, AuditLogLevel, AuditEventType } from '../../audit-system';
import { SystemConfig } from './SystemConfigurationManager';

/**
 * 系统状态接口
 */
export interface SystemStatus {
  is_initialized: boolean;
  active_modules: string[];
  system_health: 'healthy' | 'warning' | 'error';
  last_health_check: Date;
  performance_metrics: {
    memory_usage_mb: number;
    cpu_usage_percent: number;
    active_tasks: number;
    pending_tasks: number;
  };
}

/**
 * 初始化服务回调函数类型
 */
export type ServiceInitializer = () => Promise<void>;

/**
 * 系统生命周期管理器
 * 负责系统的完整生命周期管理
 */
export class SystemLifecycleManager {
  private isInitialized = false;
  private auditService?: AuditService;
  private serviceInitializers: Map<string, ServiceInitializer> = new Map();
  private cleanupCallbacks: Array<() => Promise<void>> = [];
  
  constructor(auditService?: AuditService) {
    this.auditService = auditService;
  }
  
  /**
   * 注册服务初始化回调
   */
  registerServiceInitializer(serviceName: string, initializer: ServiceInitializer): void {
    this.serviceInitializers.set(serviceName, initializer);
  }
  
  /**
   * 注册清理回调
   */
  registerCleanupCallback(callback: () => Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }
  
  /**
   * 系统初始化
   */
  async initialize(config: SystemConfig): Promise<void> {
    if (this.isInitialized) {
      console.warn('系统已经初始化过了');
      return;
    }
    
    try {
      await this.auditService?.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.SYSTEM_START,
        operation: 'system_initialize',
        message: '精准获客系统开始初始化',
        details: { config }
      });
      
      // 按照依赖顺序初始化各模块
      const initPromises: Promise<void>[] = [];
      
      // 基础服务初始化（无依赖）
      if (config.modules.audit_system && this.serviceInitializers.has('audit')) {
        initPromises.push(this.serviceInitializers.get('audit')!());
      }
      
      if (config.modules.rate_control && this.serviceInitializers.has('rateControl')) {
        initPromises.push(this.serviceInitializers.get('rateControl')!());
      }
      
      // 等待基础服务完成
      await Promise.all(initPromises);
      
      // 业务服务初始化（依赖基础服务）
      const businessInitPromises: Promise<void>[] = [];
      
      if (config.modules.template_management && this.serviceInitializers.has('template')) {
        businessInitPromises.push(this.serviceInitializers.get('template')!());
      }
      
      if (config.modules.comment_collection && this.serviceInitializers.has('comment')) {
        businessInitPromises.push(this.serviceInitializers.get('comment')!());
      }
      
      if (config.modules.task_execution && this.serviceInitializers.has('taskEngine')) {
        businessInitPromises.push(this.serviceInitializers.get('taskEngine')!());
      }
      
      if (config.modules.reporting && this.serviceInitializers.has('reporting')) {
        businessInitPromises.push(this.serviceInitializers.get('reporting')!());
      }
      
      await Promise.all(businessInitPromises);
      
      this.isInitialized = true;
      
      await this.auditService?.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.SYSTEM_START,
        operation: 'system_initialize',
        message: '精准获客系统初始化完成',
        details: { 
          initialized_modules: Object.keys(config.modules).filter(
            key => config.modules[key as keyof typeof config.modules]
          )
        }
      });
      
    } catch (error) {
      await this.auditService?.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.SYSTEM_START,
        operation: 'system_initialize',
        message: '精准获客系统初始化失败',
        error_message: error instanceof Error ? error.message : String(error)
      });
      
      throw new Error(`系统初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取系统状态
   */
  async getSystemStatus(config: SystemConfig): Promise<SystemStatus> {
    try {
      const performanceMetrics = this.gatherPerformanceMetrics();
      
      // 检查各模块健康状态
      let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy';
      
      // 简化的健康检查逻辑
      if (performanceMetrics.memory_usage_mb > 1000) {
        systemHealth = 'warning';
      }
      
      const activeModules = Object.keys(config.modules).filter(
        key => config.modules[key as keyof typeof config.modules]
      );
      
      return {
        is_initialized: this.isInitialized,
        active_modules: activeModules,
        system_health: systemHealth,
        last_health_check: new Date(),
        performance_metrics: performanceMetrics
      };
      
    } catch (error) {
      await this.auditService?.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.USER_ACTION,
        operation: 'get_system_status',
        message: '获取系统状态失败',
        error_message: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }
      
      // 执行基本的健康检查
      const performanceMetrics = this.gatherPerformanceMetrics();
      
      // 检查内存使用是否过高
      if (performanceMetrics.memory_usage_mb > 2000) {
        console.warn('内存使用过高:', performanceMetrics.memory_usage_mb, 'MB');
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('健康检查失败:', error);
      return false;
    }
  }
  
  /**
   * 系统关闭
   */
  async shutdown(): Promise<void> {
    try {
      await this.auditService?.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.SYSTEM_SHUTDOWN,
        operation: 'system_shutdown',
        message: '精准获客系统开始关闭'
      });
      
      // 执行所有注册的清理回调
      const shutdownPromises = this.cleanupCallbacks.map(callback => callback());
      await Promise.all(shutdownPromises);
      
      this.isInitialized = false;
      
      console.log('精准获客系统已关闭');
      
    } catch (error) {
      console.error('系统关闭时发生错误:', error);
    }
  }
  
  /**
   * 获取系统是否已初始化
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
  
  /**
   * 收集性能指标
   */
  private gatherPerformanceMetrics() {
    return {
      memory_usage_mb: this.getMemoryUsage(),
      cpu_usage_percent: 0, // 浏览器环境无法直接获取CPU使用率
      active_tasks: 0, // 需要从任务引擎获取
      pending_tasks: 0
    };
  }
  
  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    try {
      // 检查性能API是否可用
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const perfMemory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        return perfMemory.usedJSHeapSize / 1024 / 1024;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}