// src/modules/precise-acquisition/PreciseAcquisitionService.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

// modules/precise-acquisition | PreciseAcquisitionService | 精准获客系统服务门面（重构版）
// 重构后的轻量级门面类，通过委托模式协调各个管理器，保持对外API兼容性

import { TemplateManagementService } from './template-management';
import { EnhancedCommentAdapterManager } from '../../application/services/comment-collection/EnhancedCommentAdapterManager';
import { TaskEngineService, TaskExecutorService } from './task-engine';
import { RateControlService } from './rate-control';
import { AuditService } from './audit-system';
import { ReportingService } from './reporting/index';

import { 
  SystemConfigurationManager, 
  SystemConfig 
} from './application/system/SystemConfigurationManager';

import { 
  SystemLifecycleManager, 
  SystemStatus 
} from './application/system/SystemLifecycleManager';

import { ServiceRegistry } from './application/system/ServiceRegistry';

/**
 * 精准获客系统主服务（重构版）
 * 使用委托模式调用各个专门的管理器
 */
export class PreciseAcquisitionService {
  private configManager: SystemConfigurationManager;
  private lifecycleManager: SystemLifecycleManager;
  private serviceRegistry: ServiceRegistry;
  
  constructor(config?: Partial<SystemConfig>) {
    // 初始化管理器
    this.lifecycleManager = new SystemLifecycleManager();
    this.configManager = new SystemConfigurationManager();
    this.serviceRegistry = new ServiceRegistry(this.lifecycleManager);
    
    // 应用配置并初始化服务
    if (config) {
      const mergedConfig = this.configManager.createDefaultConfig(config);
      this.serviceRegistry.initializeServices(mergedConfig);
    } else {
      const defaultConfig = this.configManager.getCurrentConfig();
      this.serviceRegistry.initializeServices(defaultConfig);
    }
  }
  
  /**
   * 系统初始化
   */
  async initialize(): Promise<void> {
    const currentConfig = this.configManager.getCurrentConfig();
    await this.lifecycleManager.initialize(currentConfig);
  }
  
  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const currentConfig = this.configManager.getCurrentConfig();
    return await this.lifecycleManager.getSystemStatus(currentConfig);
  }
  
  /**
   * 更新系统配置
   */
  async updateConfig(newConfig: Partial<SystemConfig>): Promise<void> {
    await this.configManager.updateConfig(newConfig);
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    return await this.lifecycleManager.healthCheck();
  }
  
  /**
   * 系统关闭
   */
  async shutdown(): Promise<void> {
    await this.lifecycleManager.shutdown();
  }
  
  // 以下方法委托给 ServiceRegistry
  
  /**
   * 获取服务实例 - 模板管理
   */
  getTemplateService(): TemplateManagementService {
    return this.serviceRegistry.getTemplateService();
  }
  
  /**
   * 获取服务实例 - 评论收集
   */
  getCommentService(): EnhancedCommentAdapterManager {
    return this.serviceRegistry.getCommentService();
  }
  
  /**
   * 获取服务实例 - 任务引擎
   */
  getTaskEngineService(): TaskEngineService {
    return this.serviceRegistry.getTaskEngineService();
  }
  
  /**
   * 获取服务实例 - 任务执行器
   */
  getTaskExecutorService(): TaskExecutorService {
    return this.serviceRegistry.getTaskExecutorService();
  }
  
  /**
   * 获取服务实例 - 频控管理
   */
  getRateControlService(): RateControlService {
    return this.serviceRegistry.getRateControlService();
  }
  
  /**
   * 获取服务实例 - 审计系统
   */
  getAuditService(): AuditService {
    return this.serviceRegistry.getAuditService();
  }
  
  /**
   * 获取服务实例 - 报告系统
   */
  getReportingService(): ReportingService {
    return this.serviceRegistry.getReportingService();
  }
}

// 导出接口供其他模块使用
export type { SystemConfig, SystemStatus };