/**
 * 每日报告服务门面
 * 
 * 集成每日报告导出服务到精准获客服务门面中
 */

import { DailyReportExportService, DailyReportConfig, ExportResult } from './DailyReportExportService';
import { Task } from '../../shared/types/core';
import { Comment } from '../../../../domain/precise-acquisition/entities/Comment';
import { WatchTarget } from '../../../../domain/precise-acquisition/entities/WatchTarget';

/**
 * 扩展的精准获客服务门面接口 - 添加日报功能
 */
export interface IPreciseAcquisitionServiceWithReports {
  // 原有功能...
  
  // 日报导出功能
  exportDailyReport(config: DailyReportConfig): Promise<ExportResult>;
  exportDateRangeReports(startDate: Date, endDate: Date): Promise<ExportResult[]>;
  getReportExportHistory(): Promise<ExportResult[]>;
}

/**
 * 日报导出功能混入
 * 
 * 为现有的PreciseAcquisitionServiceFacade.v2添加日报功能
 */
export class DailyReportServiceMixin {
  
  private reportExportService: DailyReportExportService;
  private exportHistory: ExportResult[] = [];
  
  constructor() {
    this.reportExportService = new DailyReportExportService();
  }
  
  /**
   * 导出每日报告
   */
  async exportDailyReport(
    config: DailyReportConfig,
    tasks: Task[],
    comments: Comment[],
    watchTargets: WatchTarget[]
  ): Promise<ExportResult> {
    
    const result = await this.reportExportService.exportDailyReport(
      config,
      tasks,
      comments,
      watchTargets
    );
    
    // 缓存导出历史
    this.exportHistory.unshift(result);
    
    // 只保留最近100条记录
    if (this.exportHistory.length > 100) {
      this.exportHistory = this.exportHistory.slice(0, 100);
    }
    
    return result;
  }
  
  /**
   * 批量导出日期范围报告
   */
  async exportDateRangeReports(
    startDate: Date,
    endDate: Date,
    tasks: Task[],
    comments: Comment[],
    watchTargets: WatchTarget[]
  ): Promise<ExportResult[]> {
    
    const results = await this.reportExportService.exportDateRange(
      startDate,
      endDate,
      tasks,
      comments,
      watchTargets
    );
    
    // 添加到历史记录
    this.exportHistory.unshift(...results);
    
    // 只保留最近100条记录
    if (this.exportHistory.length > 100) {
      this.exportHistory = this.exportHistory.slice(0, 100);
    }
    
    return results;
  }
  
  /**
   * 获取导出历史
   */
  getReportExportHistory(): ExportResult[] {
    return [...this.exportHistory];
  }
  
  /**
   * 获取导出统计
   */
  getReportExportStats(): {
    totalExports: number;
    successfulExports: number;
    totalFollows: number;
    totalReplies: number;
    lastExportTime?: Date;
  } {
    
    const stats = this.reportExportService.getExportStats(this.exportHistory);
    const lastExport = this.exportHistory[0];
    
    return {
      totalExports: stats.totalDays,
      successfulExports: stats.successfulDays,
      totalFollows: stats.totalFollows,
      totalReplies: stats.totalReplies,
      lastExportTime: lastExport?.export_time
    };
  }
  
  /**
   * 清理导出历史
   */
  clearExportHistory(): void {
    this.exportHistory = [];
  }
  
  /**
   * 验证导出配置
   */
  validateExportConfig(config: DailyReportConfig): {
    isValid: boolean;
    errors: string[];
  } {
    
    const errors: string[] = [];
    
    if (!config.includeFollows && !config.includeReplies) {
      errors.push('必须至少选择一种导出类型（关注或回复）');
    }
    
    if (!config.date || isNaN(config.date.getTime())) {
      errors.push('日期格式无效');
    }
    
    if (config.date && config.date > new Date()) {
      errors.push('不能导出未来日期的数据');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 预览导出数据（不实际生成文件）
   */
  async previewExportData(
    config: DailyReportConfig,
    tasks: Task[],
    comments: Comment[],
    watchTargets: WatchTarget[]
  ): Promise<{
    followCount: number;
    replyCount: number;
    estimatedFileSize: number;
    previewData: {
      follows: Array<{ target_user_id: string; account_id: string }>;
      replies: Array<{ comment_content: string; reply_content: string }>;
    };
  }> {
    
    const targetDate = config.date.toISOString().split('T')[0];
    
    // 过滤目标日期的任务
    const filteredTasks = tasks.filter(task => 
      task.executed_at &&
      task.executed_at.toISOString().split('T')[0] === targetDate
    );
    
    const followTasks = filteredTasks.filter(task => task.task_type === 'follow');
    const replyTasks = filteredTasks.filter(task => task.task_type === 'reply');
    
    // 预览数据（只取前5条）
    const previewFollows = followTasks.slice(0, 5).map(task => ({
      target_user_id: task.target_user_id || '',
      account_id: task.assign_account_id
    }));
    
    const previewReplies = replyTasks.slice(0, 5).map(task => {
      const comment = comments.find(c => c.id === task.comment_id);
      return {
        comment_content: comment?.content || '',
        reply_content: '回复内容' // TODO: 从任务执行记录中获取实际回复内容
      };
    });
    
    // 估算文件大小（字节）
    const avgFollowRowSize = 100; // 预估每行100字节
    const avgReplyRowSize = 200; // 预估每行200字节
    const estimatedFileSize = 
      (config.includeFollows ? followTasks.length * avgFollowRowSize : 0) +
      (config.includeReplies ? replyTasks.length * avgReplyRowSize : 0);
    
    return {
      followCount: followTasks.length,
      replyCount: replyTasks.length,
      estimatedFileSize,
      previewData: {
        follows: previewFollows,
        replies: previewReplies
      }
    };
  }
}