// src/modules/precise-acquisition/application/system/ServiceRegistry.ts
// module: application | layer: application | role: application-logic
// summary: 应用逻辑

// modules/precise-acquisition/application/system | ServiceRegistry | 服务注册表
// 负责各模块服务实例的创建、注册和获取，实现依赖注入模式和服务生命周期管理

import { 
  ProspectingTemplateManagementService
} from '../../template-management';

import { 
  EnhancedCommentAdapterManager,
  createEnhancedCommentAdapterManager
} from '../../../../application/services/comment-collection/EnhancedCommentAdapterManager';

import { 
  TaskEngineService,
  TaskExecutorService
} from '../../task-engine';

import { 
  RateControlService
} from '../../rate-control';

import { 
  AuditService
} from '../../audit-system';

import { 
  ReportingService
} from '../../reporting';

import { SystemConfig } from './SystemConfigurationManager';
import { SystemLifecycleManager, ServiceInitializer } from './SystemLifecycleManager';

/**
 * 服务注册表
 * 负责服务实例的创建、注册和获取
 */
export class ServiceRegistry {
  // 各模块服务实例
  private templateService?: ProspectingTemplateManagementService;
  private commentService?: EnhancedCommentAdapterManager;
  private taskEngineService?: TaskEngineService;
  private taskExecutorService?: TaskExecutorService;
  private rateControlService?: RateControlService;
  private auditService?: AuditService;
  private reportingService?: ReportingService;
  
  private lifecycleManager: SystemLifecycleManager;
  
  constructor(lifecycleManager: SystemLifecycleManager) {
    this.lifecycleManager = lifecycleManager;
  }
  
  /**
   * 初始化服务实例
   */
  initializeServices(config: SystemConfig): void {
    // 初始化各模块服务
    if (config.modules.audit_system) {
      this.auditService = new AuditService();
      this.lifecycleManager.registerServiceInitializer('audit', this.initializeAuditService.bind(this));
      this.lifecycleManager.registerCleanupCallback(async () => {
        await this.auditService?.shutdown();
      });
    }
    
    if (config.modules.rate_control) {
      this.rateControlService = new RateControlService();
      this.lifecycleManager.registerServiceInitializer('rateControl', this.initializeRateControlService.bind(this));
      this.lifecycleManager.registerCleanupCallback(async () => {
        await this.rateControlService?.cleanupExpiredData();
      });
    }
    
    if (config.modules.template_management) {
      this.templateService = new ProspectingTemplateManagementService();
      this.lifecycleManager.registerServiceInitializer('template', this.initializeTemplateService.bind(this));
    }
    
    if (config.modules.comment_collection) {
      this.commentService = createEnhancedCommentAdapterManager({
        default_strategy: 'auto',
        fallback_enabled: true
      });
      this.lifecycleManager.registerServiceInitializer('comment', this.initializeCommentService.bind(this));
    }
    
    if (config.modules.task_execution) {
      this.taskEngineService = new TaskEngineService();
      this.taskExecutorService = new TaskExecutorService();
      this.lifecycleManager.registerServiceInitializer('taskEngine', this.initializeTaskEngineServices.bind(this));
    }
    
    if (config.modules.reporting) {
      this.reportingService = new ReportingService();
      this.lifecycleManager.registerServiceInitializer('reporting', this.initializeReportingService.bind(this));
    }
  }
  
  /**
   * 获取服务实例 - 模板管理
   */
  getTemplateService(): ProspectingTemplateManagementService {
    if (!this.templateService) {
      throw new Error('模板管理服务未启用');
    }
    return this.templateService;
  }
  
  /**
   * 获取服务实例 - 评论收集
   */
  getCommentService(): EnhancedCommentAdapterManager {
    if (!this.commentService) {
      throw new Error('评论收集服务未启用');
    }
    return this.commentService;
  }
  
  /**
   * 获取服务实例 - 任务引擎
   */
  getTaskEngineService(): TaskEngineService {
    if (!this.taskEngineService) {
      throw new Error('任务引擎服务未启用');
    }
    return this.taskEngineService;
  }
  
  /**
   * 获取服务实例 - 任务执行器
   */
  getTaskExecutorService(): TaskExecutorService {
    if (!this.taskExecutorService) {
      throw new Error('任务执行器服务未启用');
    }
    return this.taskExecutorService;
  }
  
  /**
   * 获取服务实例 - 频控管理
   */
  getRateControlService(): RateControlService {
    if (!this.rateControlService) {
      throw new Error('频控管理服务未启用');
    }
    return this.rateControlService;
  }
  
  /**
   * 获取服务实例 - 审计系统
   */
  getAuditService(): AuditService {
    if (!this.auditService) {
      throw new Error('审计系统服务未启用');
    }
    return this.auditService;
  }
  
  /**
   * 获取服务实例 - 报告系统
   */
  getReportingService(): ReportingService {
    if (!this.reportingService) {
      throw new Error('报告系统服务未启用');
    }
    return this.reportingService;
  }
  
  /**
   * 初始化审计服务
   */
  private async initializeAuditService(): Promise<void> {
    // 审计服务在构造函数中已初始化
    console.log('审计服务初始化完成');
  }
  
  /**
   * 初始化频控服务
   */
  private async initializeRateControlService(): Promise<void> {
    // 频控服务在构造函数中已初始化
    console.log('频控服务初始化完成');
  }
  
  /**
   * 初始化模板服务
   */
  private async initializeTemplateService(): Promise<void> {
    // 加载默认模板等初始化操作
    console.log('模板服务初始化完成');
  }
  
  /**
   * 初始化评论收集服务
   */
  private async initializeCommentService(): Promise<void> {
    // 初始化评论收集适配器
    console.log('评论收集服务初始化完成');
  }
  
  /**
   * 初始化任务引擎服务
   */
  private async initializeTaskEngineServices(): Promise<void> {
    // 初始化任务引擎配置
    console.log('任务引擎服务初始化完成');
  }
  
  /**
   * 初始化报告服务
   */
  private async initializeReportingService(): Promise<void> {
    // 报告服务无需特殊初始化
    console.log('报告服务初始化完成');
  }
}