// src/application/services/PreciseAcquisitionServiceFacade.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客服务委托器
 * 
 * 避免重复代码，提供统一的服务入口
 * 直接委托给现有服务，不做类型转换
 */

import { PreciseAcquisitionApplicationService } from './PreciseAcquisitionApplicationService';
import {
  ProspectingTaskEngineService
} from '../../modules/precise-acquisition/task-engine/services/prospecting-task-engine-service';
import { 
  RateLimitService 
} from '../../modules/precise-acquisition/rate-limit/services/prospecting-rate-limit-service';

/**
 * 精准获客服务统一门面
 * 
 * 直接委托给现有服务，避免重复代码
 */
export class PreciseAcquisitionServiceFacade {
  private readonly legacyService: PreciseAcquisitionApplicationService;
  private readonly newTaskEngine: ProspectingTaskEngineService;
  private readonly newRateLimiter: RateLimitService;

  private constructor() {
    this.legacyService = PreciseAcquisitionApplicationService.getInstance();
    this.newTaskEngine = new ProspectingTaskEngineService();
    this.newRateLimiter = new RateLimitService();
  }

  private static instance: PreciseAcquisitionServiceFacade | null = null;

  /**
   * 获取单例实例
   */
  static getInstance(): PreciseAcquisitionServiceFacade {
    if (!PreciseAcquisitionServiceFacade.instance) {
      PreciseAcquisitionServiceFacade.instance = new PreciseAcquisitionServiceFacade();
    }
    return PreciseAcquisitionServiceFacade.instance;
  }

  // ============ 现有服务代理 ============

  /**
   * 候选池管理（使用原有服务）
   */
  get candidatePool() {
    return {
      add: this.legacyService.addWatchTarget.bind(this.legacyService),
      bulkImport: this.legacyService.bulkImportWatchTargets.bind(this.legacyService),
      get: this.legacyService.getWatchTargets.bind(this.legacyService),
      getByKey: this.legacyService.getWatchTargetByDedupKey.bind(this.legacyService)
    };
  }

  /**
   * 评论管理（使用原有服务）
   */
  get comments() {
    return {
      add: this.legacyService.addComment.bind(this.legacyService),
      get: this.legacyService.getComments.bind(this.legacyService)
    };
  }

  /**
   * 任务管理（使用原有服务）
   */
  get tasks() {
    return {
      generate: this.legacyService.generateTasks.bind(this.legacyService),
      get: this.legacyService.getTasks.bind(this.legacyService),
      updateStatus: this.legacyService.updateTaskStatus.bind(this.legacyService)
    };
  }

  /**
   * 限流控制（使用原有服务）
   */
  get rateLimit() {
    return {
      check: this.legacyService.checkRateLimit.bind(this.legacyService)
    };
  }

  /**
   * 统计报告（使用原有服务）
   */
  get stats() {
    return {
      get: this.legacyService.getStats.bind(this.legacyService)
    };
  }

  // ============ 新模块化服务代理 ============

  /**
   * 新任务引擎
   */
  get modernTaskEngine() {
    return {
      generate: this.newTaskEngine.generateTasks.bind(this.newTaskEngine),
      batchGenerate: this.newTaskEngine.batchGenerateTasks.bind(this.newTaskEngine),
      getTasks: this.newTaskEngine.getTasks.bind(this.newTaskEngine),
      getById: this.newTaskEngine.getTaskById.bind(this.newTaskEngine),
      getStats: this.newTaskEngine.getExecutionStats.bind(this.newTaskEngine),
      assign: this.newTaskEngine.assignTasksToDevice.bind(this.newTaskEngine),
      updateStatus: this.newTaskEngine.updateTaskStatus.bind(this.newTaskEngine),
      cancel: this.newTaskEngine.cancelTask.bind(this.newTaskEngine),
      retry: this.newTaskEngine.retryFailedTask.bind(this.newTaskEngine),
      batchUpdate: this.newTaskEngine.batchUpdateTaskStatus.bind(this.newTaskEngine),
      getContext: this.newTaskEngine.getTaskExecutionContext.bind(this.newTaskEngine),
      getFailedTasks: this.newTaskEngine.getRecentFailedTasks.bind(this.newTaskEngine),
      getRetryableTasks: this.newTaskEngine.getRetryableTasks.bind(this.newTaskEngine),
      cleanup: this.newTaskEngine.cleanupCompletedTasks.bind(this.newTaskEngine)
    };
  }

  /**
   * 新限流服务
   */
  get modernRateLimit() {
    return {
      checkCommentDedup: this.newRateLimiter.checkCommentDedup.bind(this.newRateLimiter),
      checkUserDedup: this.newRateLimiter.checkUserDedup.bind(this.newRateLimiter),
      checkCrossDeviceDedup: this.newRateLimiter.checkCrossDeviceDedup.bind(this.newRateLimiter),
      performComprehensiveCheck: this.newRateLimiter.performComprehensiveCheck.bind(this.newRateLimiter),
      checkRateLimit: this.newRateLimiter.checkRateLimit.bind(this.newRateLimiter),
      getNextExecutionTime: this.newRateLimiter.getNextExecutionTime.bind(this.newRateLimiter),
      saveRecord: this.newRateLimiter.saveRecord.bind(this.newRateLimiter),
      getStats: this.newRateLimiter.getStats.bind(this.newRateLimiter),
      cleanExpiredRecords: this.newRateLimiter.cleanExpiredRecords.bind(this.newRateLimiter),
      performFullPreCheck: this.newRateLimiter.performFullPreCheck.bind(this.newRateLimiter)
    };
  }

  // ============ 便捷方法 ============

  /**
   * 健康检查
   */
  async healthCheck() {
    const services = {
      legacyService: 'healthy',
      taskEngine: 'healthy',
      rateLimitService: 'healthy'
    };

    // 简单检查服务是否可用
    try {
      await this.candidatePool.get({ limit: 1 });
    } catch {
      services.legacyService = 'unhealthy';
    }

    try {
      await this.modernTaskEngine.getTasks({ limit: 1 });
    } catch {
      services.taskEngine = 'unhealthy';
    }

    try {
      await this.modernRateLimit.getStats();
    } catch {
      services.rateLimitService = 'unhealthy';
    }

    return {
      overall: Object.values(services).every(status => status === 'healthy') ? 'healthy' : 'degraded',
      services,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取所有服务的信息
   */
  getServiceInfo() {
    return {
      description: '精准获客服务统一门面',
      services: {
        existingService: 'PreciseAcquisitionApplicationService - 原有完整业务逻辑',
        taskEngine: 'TaskEngineService - 新模块化任务引擎',
        rateLimitService: 'RateLimitService - 新模块化限流服务'
      },
      usage: {
        candidatePool: '候选池管理 (使用原有服务)',
        comments: '评论处理 (使用原有服务)',
        tasks: '任务管理 (使用原有服务)',
        stats: '统计报告 (使用原有服务)',
        taskEngine: '任务引擎 (使用新模块化服务)',
        rateLimit: '限流控制 (使用新模块化服务)'
      },
      migration: {
        status: 'in_progress',
        description: '正在逐步将原有服务功能迁移到新模块化架构',
        next_steps: [
          '统一类型定义',
          '接口兼容性适配',
          '数据迁移工具',
          '测试覆盖增强'
        ]
      }
    };
  }
}

// 默认导出单例实例
export const preciseAcquisitionService = PreciseAcquisitionServiceFacade.getInstance();