/**
 * 精准获客系统统一服务门面
 * 
 * 整合所有模块的服务架构，提供统一的接口访问
 */

import { 
  TemplateManagementService,
  TemplateContext,
  TemplateRenderResult 
} from './template-management';

import { 
  CommentCollectionService
} from './comment-collection';

import { 
  TaskEngineService,
  TaskExecutorService,
  TaskExecutionContext,
  TaskExecutionResult 
} from './task-engine';

import { 
  RateControlService,
  RateLimitConfig,
  DeduplicationConfig,
  RateControlStats 
} from './rate-control';

import { 
  AuditService,
  AuditLogLevel,
  AuditEventType,
  AuditLogEntry 
} from './audit-system';

import { 
  ReportingService,
  DailyReport,
  WeeklyReport 
} from './reporting/index';

import { Platform, TaskType, Task, TaskStatus } from './shared/types/core';

/**
 * 系统状态
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
 * 系统配置
 */
export interface SystemConfig {
  // 模块启用配置
  modules: {
    template_management: boolean;
    comment_collection: boolean;
    task_execution: boolean;
    rate_control: boolean;
    audit_system: boolean;
    reporting: boolean;
  };
  
  // 全局配置
  global: {
    max_concurrent_tasks: number;
    default_timeout_ms: number;
    enable_debug_logging: boolean;
    auto_cleanup_days: number;
  };
  
  // 平台配置
  platforms: Record<Platform, {
    enabled: boolean;
    priority: number;
    rate_limit_multiplier: number;
  }>;
}

/**
 * 精准获客系统主服务
 */
export class PreciseAcquisitionService {
  
  // 各模块服务实例
  private templateService: TemplateManagementService;
  private commentService: CommentCollectionService;
  private taskEngineService: TaskEngineService;
  private taskExecutorService: TaskExecutorService;
  private rateControlService: RateControlService;
  private auditService: AuditService;
  private reportingService: ReportingService;
  
  private isInitialized = false;
  private systemConfig: SystemConfig;
  
  constructor(config?: Partial<SystemConfig>) {
    // 初始化默认配置
    this.systemConfig = this.createDefaultConfig(config);
    
    // 初始化服务实例
    this.initializeServices();
  }
  
  /**
   * 创建默认配置
   */
  private createDefaultConfig(userConfig?: Partial<SystemConfig>): SystemConfig {
    const defaultConfig: SystemConfig = {
      modules: {
        template_management: true,
        comment_collection: true,
        task_execution: true,
        rate_control: true,
        audit_system: true,
        reporting: true
      },
      global: {
        max_concurrent_tasks: 10,
        default_timeout_ms: 30000,
        enable_debug_logging: false,
        auto_cleanup_days: 30
      },
      platforms: {
        [Platform.DOUYIN]: {
          enabled: true,
          priority: 1,
          rate_limit_multiplier: 1.0
        },
        [Platform.OCEANENGINE]: {
          enabled: true,
          priority: 2,
          rate_limit_multiplier: 1.2
        },
        [Platform.PUBLIC]: {
          enabled: true,
          priority: 3,
          rate_limit_multiplier: 0.5
        }
      }
    };
    
    // 合并用户配置
    return this.mergeConfig(defaultConfig, userConfig || {});
  }
  
  /**
   * 合并配置
   */
  private mergeConfig(defaultConfig: SystemConfig, userConfig: Partial<SystemConfig>): SystemConfig {
    return {
      modules: { ...defaultConfig.modules, ...userConfig.modules },
      global: { ...defaultConfig.global, ...userConfig.global },
      platforms: { ...defaultConfig.platforms, ...userConfig.platforms }
    };
  }
  
  /**
   * 初始化服务实例
   */
  private initializeServices(): void {
    // 初始化各模块服务
    if (this.systemConfig.modules.audit_system) {
      this.auditService = new AuditService();
    }
    
    if (this.systemConfig.modules.rate_control) {
      this.rateControlService = new RateControlService();
    }
    
    if (this.systemConfig.modules.template_management) {
      this.templateService = new TemplateManagementService();
    }
    
    if (this.systemConfig.modules.comment_collection) {
      this.commentService = new CommentCollectionService();
    }
    
    if (this.systemConfig.modules.task_execution) {
      this.taskEngineService = new TaskEngineService();
      this.taskExecutorService = new TaskExecutorService();
    }
    
    if (this.systemConfig.modules.reporting) {
      this.reportingService = new ReportingService();
    }
  }
  
  /**
   * 系统初始化
   */
  async initialize(): Promise<void> {
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
        details: { config: this.systemConfig }
      });
      
      // 按照依赖顺序初始化各模块
      const initPromises: Promise<void>[] = [];
      
      // 基础服务初始化（无依赖）
      if (this.auditService) {
        initPromises.push(Promise.resolve()); // AuditService 在构造函数中已初始化
      }
      
      if (this.rateControlService) {
        initPromises.push(Promise.resolve()); // RateControlService 在构造函数中已初始化
      }
      
      // 等待基础服务完成
      await Promise.all(initPromises);
      
      // 业务服务初始化（依赖基础服务）
      const businessInitPromises: Promise<void>[] = [];
      
      if (this.templateService) {
        businessInitPromises.push(this.initializeTemplateService());
      }
      
      if (this.commentService) {
        businessInitPromises.push(this.initializeCommentService());
      }
      
      if (this.taskEngineService) {
        businessInitPromises.push(this.initializeTaskEngine());
      }
      
      if (this.reportingService) {
        businessInitPromises.push(Promise.resolve()); // ReportingService 无需特殊初始化
      }
      
      await Promise.all(businessInitPromises);
      
      this.isInitialized = true;
      
      await this.auditService?.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.SYSTEM_START,
        operation: 'system_initialize',
        message: '精准获客系统初始化完成',
        details: { 
          initialized_modules: Object.keys(this.systemConfig.modules).filter(
            key => this.systemConfig.modules[key as keyof typeof this.systemConfig.modules]
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
   * 初始化任务引擎
   */
  private async initializeTaskEngine(): Promise<void> {
    // 初始化任务引擎配置
    console.log('任务引擎初始化完成');
  }
  
  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const performanceMetrics = {
        memory_usage_mb: typeof (performance as any).memory !== 'undefined' 
          ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 
          : 0,
        cpu_usage_percent: 0, // 浏览器环境无法直接获取CPU使用率
        active_tasks: 0, // 需要从任务引擎获取
        pending_tasks: 0
      };
      
      // 检查各模块健康状态
      let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy';
      
      // 简化的健康检查逻辑
      if (performanceMetrics.memory_usage_mb > 1000) {
        systemHealth = 'warning';
      }
      
      const activeModules = Object.keys(this.systemConfig.modules).filter(
        key => this.systemConfig.modules[key as keyof typeof this.systemConfig.modules]
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
   * 更新系统配置
   */
  async updateConfig(newConfig: Partial<SystemConfig>): Promise<void> {
    const oldConfig = { ...this.systemConfig };
    
    try {
      this.systemConfig = this.mergeConfig(this.systemConfig, newConfig);
      
      await this.auditService?.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.CONFIG_CHANGE,
        operation: 'update_system_config',
        message: '系统配置已更新',
        details: { old_config: oldConfig, new_config: this.systemConfig }
      });
      
    } catch (error) {
      await this.auditService?.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.CONFIG_CHANGE,
        operation: 'update_system_config',
        message: '更新系统配置失败',
        error_message: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * 获取服务实例 - 模板管理
   */
  getTemplateService(): TemplateManagementService {
    if (!this.templateService) {
      throw new Error('模板管理服务未启用');
    }
    return this.templateService;
  }
  
  /**
   * 获取服务实例 - 评论收集
   */
  getCommentService(): CommentCollectionService {
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
      
      // 关闭各模块服务
      const shutdownPromises: Promise<void>[] = [];
      
      if (this.auditService) {
        shutdownPromises.push(this.auditService.shutdown());
      }
      
      if (this.rateControlService) {
        shutdownPromises.push(this.rateControlService.cleanupExpiredData());
      }
      
      await Promise.all(shutdownPromises);
      
      this.isInitialized = false;
      
      console.log('精准获客系统已关闭');
      
    } catch (error) {
      console.error('系统关闭时发生错误:', error);
    }
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const status = await this.getSystemStatus();
      return status.system_health !== 'error';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 获取系统版本信息
   */
  getVersionInfo(): {
    version: string;
    build_date: string;
    modules: Record<string, string>;
  } {
    return {
      version: '1.0.0',
      build_date: new Date().toISOString(),
      modules: {
        'template-management': '1.0.0',
        'comment-collection': '1.0.0',
        'task-engine': '1.0.0',
        'rate-control': '1.0.0',
        'audit-system': '1.0.0',
        'reporting': '1.0.0'
      }
    };
  }
}