// src/application/services/SimplifiedPreciseAcquisitionService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 简化的精准获客统一服务
 * 
 * @deprecated 此服务已被废弃，请使用 PreciseAcquisitionServiceFacade.v2.ts
 * 
 * 迁移指南：
 * ```typescript
 * // ❌ 旧方式
 * import { SimplifiedPreciseAcquisitionService } from './SimplifiedPreciseAcquisitionService';
 * const service = new SimplifiedPreciseAcquisitionService();
 * 
 * // ✅ 新方式
 * import { preciseAcquisitionService } from './PreciseAcquisitionServiceFacade.v2';
 * const service = preciseAcquisitionService;
 * ```
 * 
 * 为了快速解决代码重复问题，创建一个直接使用现有组件的统一服务
 * 此服务将在下个版本中移除，请尽快迁移到新的统一门面
 */

import { PreciseAcquisitionApplicationService } from './PreciseAcquisitionApplicationService';
import { 
  ProspectingTaskEngineService 
} from '../../modules/precise-acquisition/task-engine/services/prospecting-task-engine-service';
import { 
  RateLimitService 
} from '../../modules/precise-acquisition/rate-limit/services/RateLimitService';

// 导入枚举类型
// import {
//   Platform,
//   TargetType,
//   SourceType,
//   TaskType,
//   IndustryTag,
//   RegionTag
// } from '../../constants/precise-acquisition-enums';

/**
 * 统一的精准获客服务门面
 * 
 * @deprecated 请使用 PreciseAcquisitionServiceFacade.v2.ts 替代
 * 
 * 整合现有应用服务与新模块化服务，提供统一接口
 */
export class SimplifiedPreciseAcquisitionService {
  private readonly existingService: PreciseAcquisitionApplicationService;
  private readonly taskEngine: ProspectingTaskEngineService;
  private readonly rateLimitService: RateLimitService;

  constructor() {
    // 使用单例
    this.existingService = PreciseAcquisitionApplicationService.getInstance();
    this.taskEngine = new ProspectingTaskEngineService();
    this.rateLimitService = new RateLimitService();
  }

  // ============ 候选池管理（使用现有服务）============
  
  /**
   * 添加监控目标
   */
  async addWatchTarget(params: {
    platform: string;
    targetType: string;
    idOrUrl: string;
    title?: string;
    source?: string;
    industryTags?: string[];
    region?: string;
    notes?: string;
  }) {
    return this.existingService.addWatchTarget({
      ...params,
      targetType: params.targetType as never, // Type conversion for compatibility
      platform: params.platform as never,
      source: params.source as never,
      industryTags: params.industryTags as never,
      region: params.region as never
    });
  }

  /**
   * 获取监控目标列表
   */
  async getWatchTargets(filters?: {
    platform?: string;
    region?: string;
    industryTags?: string[];
    targetType?: string;
  }) {
    return this.existingService.getWatchTargets(filters as WatchTargetQuery);
  }

  /**
   * 删除监控目标
   */
  async removeWatchTarget(id: number) {
    return this.existingService.removeWatchTarget(id.toString());
  }

  // ============ 任务管理（使用新模块化服务）============

  /**
   * 生成任务
   */
  async generateTasks(config: {
    targetId?: string;
    maxTasks?: number;
    taskTypes?: string[];
    deviceId?: string;
    timeWindowHours?: number;
  }) {
    try {
      const tasks = await this.taskEngine.generateTasks({
        target: { id: config.targetId } as WatchTarget,  // 修复属性名
        max_tasks: config.maxTasks || 10,
        task_types: config.taskTypes as never || ['reply'],
        device_id: config.deviceId,
        time_window_hours: config.timeWindowHours || 24
      });
      
      return {
        success: true,
        data: tasks,
        message: `成功生成 ${tasks.length} 个任务`
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: `任务生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 查询任务
   */
  async queryTasks(filters?: {
    status?: string;
    platform?: string;
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const tasks = await this.taskEngine.queryTasks({
        status: filters?.status as never,
        platform: filters?.platform as never,
        device_id: filters?.deviceId,
        start_date: filters?.startDate,
        end_date: filters?.endDate
      });
      
      return {
        success: true,
        data: tasks,
        total: tasks.length
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        total: 0,
        message: `任务查询失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 执行任务
   */
  async executeTasks(taskIds: string[]) {
    try {
      const results = await Promise.all(
        taskIds.map(id => this.taskEngine.executeTask(id))
      );
      
      return {
        success: true,
        results,
        message: `批量执行完成，成功: ${results.filter(r => r.success).length}，失败: ${results.filter(r => !r.success).length}`
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        message: `任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // ============ 限流和去重（使用新模块化服务）============

  /**
   * 检查是否可以执行操作（防重复+限流）
   */
  async canPerformAction(params: {
    actionType: string;
    targetId: string;
    deviceId: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    nextAllowedTime?: Date;
  }> {
    try {
      // 检查去重
      const isDuplicate = await this.rateLimitService.checkDuplicate({
        action_type: params.actionType,
        target_id: params.targetId,
        device_id: params.deviceId
      });

      if (isDuplicate) {
        return {
          allowed: false,
          reason: '操作已执行过，避免重复'
        };
      }

      // 检查限流 - 使用简化的调用方式
      const isAllowed = await this.rateLimitService.checkRateLimit(
        params.deviceId,
        'XIAOHONGSHU' as Platform, // Platform 枚举
        'REPLY' as TaskType, // TaskType 枚举  
        {} // 可选配置
      );

      if (!isAllowed.allowed) {
        return {
          allowed: false,
          reason: '超出限流限制',
          nextAllowedTime: isAllowed.next_allowed_time
        };
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        reason: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 记录操作（用于去重和限流统计）
   */
  async recordAction(params: {
    actionType: string;
    targetId: string;
    deviceId: string;
    success: boolean;
    errorMessage?: string;
  }) {
    try {
      await this.rateLimitService.recordAction({
        action_type: params.actionType,
        target_id: params.targetId,
        device_id: params.deviceId,
        success: params.success,
        error_message: params.errorMessage
      });
    } catch (error) {
      console.warn('记录操作失败:', error);
    }
  }

  // ============ 评论相关（使用现有服务）============

  /**
   * 获取评论数据
   */
  async getComments(filters?: {
    platform?: string;
    sourceTargetId?: string;
    keywords?: string[];
    minLikeCount?: number;
    region?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.existingService.getComments(filters);
  }

  /**
   * 分析评论
   */
  async analyzeComments(commentIds: string[]) {
    return this.existingService.analyzeComments(commentIds);
  }

  // ============ 统计和报告============

  /**
   * 获取统计数据
   */
  async getStatistics(params?: {
    startDate?: Date;
    endDate?: Date;
    platform?: string;
    deviceId?: string;
  }) {
    try {
      // 整合现有服务和新服务的统计数据
      const existingStats = await this.existingService.getStatistics?.(params) || {};
      
      return {
        success: true,
        data: {
          ...existingStats,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        message: `统计数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const checks = {
      existingService: true,
      taskEngine: true,
      rateLimitService: true
    };

    // 简单的健康检查
    try {
      await this.taskEngine.queryTasks({ limit: 1 });
    } catch {
      checks.taskEngine = false;
    }

    try {
      await this.rateLimitService.checkRateLimit({
        action_type: 'test',
        device_id: 'test'
      });
    } catch {
      checks.rateLimitService = false;
    }

    const allHealthy = Object.values(checks).every(status => status);

    return {
      healthy: allHealthy,
      services: checks,
      timestamp: new Date().toISOString()
    };
  }
}

// 默认导出单例
export const preciseAcquisitionService = new SimplifiedPreciseAcquisitionService();