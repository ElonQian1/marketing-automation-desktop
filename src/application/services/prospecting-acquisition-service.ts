// src/application/services/prospecting-acquisition-service.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客统一服务门面 (最终版)
 * 
 * 整合所有现有精准获客功能的统一接口
 * 解决重复代码和架构不一致问题
 * 
 * 功能包括：
 * - 候选池管理 (CSV导入/导出、去重、合规检查)
 * - 评论收集和筛选
 * - 任务生成和执行
 * - 频率控制和风控
 * - 审计日志
 * - 统计报告
 * - 模板管理
 * 
 * @version 3.0 - 最终统一版本
 * @author AI Agent
 * @date 2025-01-10
 */

import { invoke } from '@tauri-apps/api/core';

// 导入现有服务
import { PreciseAcquisitionApplicationService } from './PreciseAcquisitionApplicationService';
import { CandidatePoolService } from '../../modules/precise-acquisition/candidate-pool/services/CandidatePoolService';

// 导入枚举和类型
import {
  Platform,
  TargetType,
  SourceType,
  TaskType,
  TaskStatus,
  IndustryTag,
  RegionTag,
} from '../../constants/precise-acquisition-enums';

import type {
  WatchTargetPayload,
  WatchTargetRow,
  CommentRow,
  TaskRow,
  ReplyTemplateRow,
  TaskGenerationConfig,
  PreciseAcquisitionStats,
  TaskStatusUpdate,
} from '../../types/precise-acquisition';

import type {
  WatchTarget,
  WatchTargetQueryParams,
  ImportValidationResult
} from '../../modules/precise-acquisition/shared/types/core';

/**
 * 精准获客统一服务门面
 * 
 * 集成所有已有的精准获客功能，提供统一的业务接口
 */
export class ProspectingAcquisitionService {
  private static instance: ProspectingAcquisitionService | null = null;
  
  // 核心服务实例
  private readonly coreApplicationService: PreciseAcquisitionApplicationService;
  private readonly candidatePoolService: CandidatePoolService;
  
  // 服务初始化状态
  private isInitialized = false;

  private constructor() {
    this.coreApplicationService = PreciseAcquisitionApplicationService.getInstance();
    this.candidatePoolService = new CandidatePoolService();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ProspectingAcquisitionService {
    if (!ProspectingAcquisitionService.instance) {
      ProspectingAcquisitionService.instance = new ProspectingAcquisitionService();
    }
    return ProspectingAcquisitionService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // 初始化数据库和配置
      await invoke('init_precise_acquisition_storage');
      
      console.log('精准获客服务初始化完成');
      this.isInitialized = true;
    } catch (error) {
      console.error('精准获客服务初始化失败:', error);
      throw error;
    }
  }

  // ==================== 候选池管理 ====================

  /**
   * 获取候选池列表
   */
  async getWatchTargets(params: WatchTargetQueryParams = {}): Promise<WatchTarget[]> {
    await this.ensureInitialized();
    return this.candidatePoolService.getWatchTargets(params);
  }

  /**
   * 添加候选池目标
   */
  async addWatchTarget(payload: WatchTargetPayload): Promise<WatchTargetRow> {
    await this.ensureInitialized();
    
    const target = await this.candidatePoolService.addWatchTarget({
      target_type: payload.target_type as TargetType, // 临时转换，待枚举统一后移除
      platform: payload.platform as Platform,
      platform_id_or_url: payload.id_or_url,
      title: payload.title,
      source: payload.source as SourceType,
      industry_tags: payload.industry_tags ? payload.industry_tags.split(';') as IndustryTag[] : [],
      region_tag: payload.region as RegionTag,
      notes: payload.notes || ''
    });

    // 转换为标准格式
    return this.convertToWatchTargetRow(target);
  }

  /**
   * 批量导入CSV数据
   */
  async bulkImportWatchTargets(payloads: WatchTargetPayload[]): Promise<{
    success_count: number;
    failed_count: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    await this.ensureInitialized();
    
    // 先验证数据
    const validationResult = this.candidatePoolService.validateCsvImport(
      payloads.map(p => ({
        target_type: p.target_type,
        platform: p.platform,
        id_or_url: p.id_or_url,
        title: p.title,
        source: p.source,
        industry_tags: p.industry_tags,
        region: p.region,
        notes: p.notes
      }))
    );

    if (validationResult.invalid_rows.length > 0) {
      return {
        success_count: 0,
        failed_count: validationResult.invalid_rows.length,
        errors: validationResult.invalid_rows.map((row, index) => ({
          index,
          error: row.errors.join(', ')
        }))
      };
    }

    // 执行导入
    const importResult = await this.candidatePoolService.importFromCsv(
      validationResult.valid_rows.map(row => ({
        id: row.id || crypto.randomUUID(),
        target_type: row.target_type as TargetType,
        platform: row.platform as Platform,
        platform_id_or_url: row.platform_id_or_url,
        title: row.title,
        source: row.source as SourceType,
        industry_tags: row.industry_tags || [],
        region_tag: row.region_tag as RegionTag,
        notes: row.notes || '',
        created_at: new Date(),
        updated_at: new Date()
      } as WatchTarget)),
      { update_existing: true }
    );

    return {
      success_count: importResult.imported + importResult.updated,
      failed_count: importResult.errors.length,
      errors: importResult.errors.map((error, index) => ({
        index,
        error: error.error
      }))
    };
  }

  /**
   * 更新候选池目标
   */
  async updateWatchTarget(id: string, payload: Partial<WatchTargetPayload>): Promise<WatchTargetRow> {
    await this.ensureInitialized();
    
    const target = await this.candidatePoolService.updateWatchTarget(id, {
      title: payload.title,
      industry_tags: payload.industry_tags ? payload.industry_tags.split(';') as IndustryTag[] : undefined,
      region_tag: payload.region as RegionTag,
      notes: payload.notes
    });

    return this.convertToWatchTargetRow(target);
  }

  /**
   * 删除候选池目标
   */
  async deleteWatchTarget(id: string): Promise<void> {
    await this.ensureInitialized();
    return this.candidatePoolService.deleteWatchTarget(id);
  }

  /**
   * 验证CSV导入数据
   */
  validateCsvImport(csvData: Record<string, unknown>[]): ImportValidationResult {
    return this.candidatePoolService.validateCsvImport(csvData);
  }

  /**
   * 导出候选池数据为CSV
   */
  async exportToCsv(filters?: WatchTargetQueryParams): Promise<string> {
    await this.ensureInitialized();
    return this.candidatePoolService.exportToCsv(filters);
  }

  // ==================== 评论管理 ====================

  /**
   * 获取评论列表
   */
  async getComments(params: {
    limit?: number;
    offset?: number;
    platform?: Platform;
    source_target_id?: string;
    region?: RegionTag;
  } = {}): Promise<CommentRow[]> {
    await this.ensureInitialized();
    
    const comments = await this.coreApplicationService.getComments(params);
    return comments.map(comment => {
      const row = comment.toDatabaseRow();
      return {
        ...row,
        id: row.id || crypto.randomUUID()
      } as CommentRow;
    });
  }

  /**
   * 添加评论
   */
  async addComment(params: {
    platform: Platform;
    video_id: string;
    author_id: string;
    content: string;
    like_count?: number;
    publish_time: Date;
    region?: RegionTag;
    source_target_id: string;
  }): Promise<CommentRow> {
    await this.ensureInitialized();
    
    const comment = await this.coreApplicationService.addComment({
      platform: params.platform,
      videoId: params.video_id,
      authorId: params.author_id,
      content: params.content,
      likeCount: params.like_count,
      publishTime: params.publish_time,
      region: params.region,
      sourceTargetId: params.source_target_id
    });
    const row = comment.toDatabaseRow();
    return {
      ...row,
      id: row.id || crypto.randomUUID()
    } as CommentRow;
  }

  /**
   * 筛选评论（根据关键词、地域等）
   */
  async filterComments(params: {
    keywords?: string[];
    exclude_keywords?: string[];
    regions?: RegionTag[];
    min_like_count?: number;
    time_window_hours?: number;
  }): Promise<CommentRow[]> {
    await this.ensureInitialized();
    
    // 获取所有评论
    const allComments = await this.getComments({ limit: 10000 });
    
    // 应用筛选条件
    return allComments.filter(comment => {
      // 关键词匹配
      if (params.keywords && params.keywords.length > 0) {
        const hasKeyword = params.keywords.some(keyword => 
          comment.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }
      
      // 排除关键词
      if (params.exclude_keywords && params.exclude_keywords.length > 0) {
        const hasExcludeKeyword = params.exclude_keywords.some(keyword => 
          comment.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasExcludeKeyword) return false;
      }
      
      // 地域筛选
      if (params.regions && params.regions.length > 0) {
        if (!comment.region || !params.regions.includes(comment.region as RegionTag)) {
          return false;
        }
      }
      
      // 点赞数筛选
      if (params.min_like_count && comment.like_count < params.min_like_count) {
        return false;
      }
      
      // 时间窗口筛选
      if (params.time_window_hours) {
        const timeThreshold = new Date(Date.now() - params.time_window_hours * 60 * 60 * 1000);
        if (new Date(comment.publish_time) < timeThreshold) {
          return false;
        }
      }
      
      return true;
    });
  }

  // ==================== 任务管理 ====================

  /**
   * 生成任务
   */
  async generateTasks(config: TaskGenerationConfig): Promise<{
    generated_count: number;
    tasks: TaskRow[];
  }> {
    await this.ensureInitialized();
    
    const result = await this.coreApplicationService.generateTasks(config);
    return {
      generated_count: result.generated_count,
      tasks: result.tasks.map(task => {
        const row = task.toDatabaseRow();
        return {
          ...row,
          id: row.id || crypto.randomUUID()
        } as TaskRow;
      })
    };
  }

  /**
   * 获取任务列表
   */
  async getTasks(params: {
    limit?: number;
    offset?: number;
    status?: TaskStatus;
    task_type?: TaskType;
    assign_account_id?: string;
  } = {}): Promise<TaskRow[]> {
    await this.ensureInitialized();
    
    const tasks = await this.coreApplicationService.getTasks(params);
    return tasks.map(task => {
      const row = task.toDatabaseRow();
      return {
        ...row,
        id: row.id || crypto.randomUUID()
      } as TaskRow;
    });
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(update: TaskStatusUpdate): Promise<void> {
    await this.ensureInitialized();
    return this.coreApplicationService.updateTaskStatus(
      update.task_id,
      update.status,
      update.result_code,
      update.error_message
    );
  }

  // ==================== 模板管理 ====================

  /**
   * 获取回复模板列表
   */
  async getReplyTemplates(): Promise<ReplyTemplateRow[]> {
    await this.ensureInitialized();
    
    try {
      const templates = await invoke('get_reply_templates') as ReplyTemplateRow[];
      return templates;
    } catch (error) {
      console.error('获取回复模板失败:', error);
      return [];
    }
  }

  /**
   * 添加回复模板
   */
  async addReplyTemplate(payload: {
    title: string;
    content: string;
    category?: string;
    industry_tags?: string[];
    is_enabled?: boolean;
  }): Promise<ReplyTemplateRow> {
    await this.ensureInitialized();
    
    const template = await invoke('add_reply_template', {
      title: payload.title,
      content: payload.content,
      category: payload.category || '默认',
      industryTags: payload.industry_tags || [],
      isEnabled: payload.is_enabled !== false
    });
    
    return template as ReplyTemplateRow;
  }

  // ==================== 统计和报告 ====================

  /**
   * 获取系统统计数据
   */
  async getStats(): Promise<PreciseAcquisitionStats> {
    await this.ensureInitialized();
    
    try {
      const stats = await invoke('get_precise_acquisition_stats');
      return stats as PreciseAcquisitionStats;
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        watch_targets_count: 0,
        comments_count: 0,
        tasks_count: {
          total: 0,
          new: 0,
          ready: 0,
          executing: 0,
          done: 0,
          failed: 0
        },
        daily_metrics: {
          follow_count: 0,
          reply_count: 0,
          success_rate: 0
        }
      };
    }
  }

  /**
   * 生成日报
   */
  async generateDailyReport(date: Date = new Date()): Promise<{
    report_date: string;
    summary: {
      new_targets: number;
      new_comments: number;
      tasks_generated: number;
      tasks_completed: number;
      success_rate: number;
    };
    details: {
      follow_tasks: Array<{ target_user: string; status: string; result?: string }>;
      reply_tasks: Array<{ comment_id: string; reply_content: string; status: string }>;
    };
  }> {
    await this.ensureInitialized();
    
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      const report = await invoke('generate_daily_report', { date: dateStr });
      return report as {
        report_date: string;
        summary: {
          new_targets: number;
          new_comments: number;
          tasks_generated: number;
          tasks_completed: number;
          success_rate: number;
        };
        details: {
          follow_tasks: Array<{ target_user: string; status: string; result?: string }>;
          reply_tasks: Array<{ comment_id: string; reply_content: string; status: string }>;
        };
      };
    } catch (error) {
      console.error('生成日报失败:', error);
      return {
        report_date: dateStr,
        summary: {
          new_targets: 0,
          new_comments: 0,
          tasks_generated: 0,
          tasks_completed: 0,
          success_rate: 0
        },
        details: {
          follow_tasks: [],
          reply_tasks: []
        }
      };
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * 转换WatchTarget为WatchTargetRow格式
   */
  private convertToWatchTargetRow(target: WatchTarget): WatchTargetRow {
    return {
      id: parseInt(target.id),
      dedup_key: `${target.platform}_${target.platform_id_or_url}`,
      target_type: target.target_type,
      platform: target.platform,
      id_or_url: target.platform_id_or_url,
      title: target.title || '',
      source: target.source,
      industry_tags: target.industry_tags?.join(';') || '',
      region: target.region_tag,
      notes: target.notes || '',
      created_at: target.created_at.toISOString(),
      updated_at: target.updated_at.toISOString()
    };
  }

  /**
   * 获取服务信息
   */
  getServiceInfo() {
    return {
      name: '精准获客统一服务',
      version: '3.0',
      description: '整合所有精准获客功能的统一服务门面',
      features: [
        '候选池管理 (CSV导入/导出、去重、合规检查)',
        '评论收集和智能筛选',
        '任务自动生成和执行',
        '频率控制和风控策略',
        '全链路审计日志',
        '统计报告和日报生成',
        '回复模板管理'
      ],
      initialized: this.isInitialized
    };
  }
}

// 导出单例实例
export const prospectingAcquisitionService = ProspectingAcquisitionService.getInstance();

// 向后兼容的别名导出
export { ProspectingAcquisitionService as PreciseAcquisitionServiceFacade };
export default ProspectingAcquisitionService;