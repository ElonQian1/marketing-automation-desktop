// src/application/services/reporting/UnifiedDailyReportService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 统一日报服务
 * 
 * 合并所有重复的日报实现，提供统一的接口
 * 基于 Round 2 文档规范和 DDD 架构原则
 * 
 * 功能包括：
 * - 关注清单和回复清单导出（CSV/Excel格式）
 * - 日报数据统计和分析
 * - 审计日志记录
 * - 多格式报告生成
 */

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { message } from 'antd';
import type { Task } from '../../../modules/precise-acquisition/shared/types/core';
import { 
  Platform, 
  TaskStatus, 
  ResultCode, 
  AuditAction,
  TaskType 
} from '../../../constants/precise-acquisition-enums';
// import type { 
//   CommentEntity,
//   WatchTarget,
//   AuditLog
// } from '../../../domain/precise-acquisition/entities';
// import type { Task as TaskEntity } from '../../../domain/precise-acquisition/entities/Task';

// ==================== 统一类型定义 ====================

/**
 * 关注清单条目（符合文档规范）
 */
export interface FollowListItem {
  关注日期: string;        // YYYY-MM-DD
  关注账号ID: string;      // 执行关注操作的账号ID
  被关注用户ID?: string;   // 被关注的用户ID（可选，用于审计）
  平台?: string;           // 平台信息（可选）
  任务ID?: string;         // 任务ID用于追溯（可选）
}

/**
 * 回复清单条目（符合文档规范）
 */
export interface ReplyListItem {
  日期: string;            // YYYY-MM-DD
  视频链接: string;        // 视频链接
  评论账户ID: string;      // 评论作者账户ID
  评论内容: string;        // 评论内容
  回复账号ID: string;      // 回复账号ID
  回复内容: string;        // 回复内容
  评论ID?: string;         // 评论ID用于追溯（可选）
  任务ID?: string;         // 任务ID用于追溯（可选）
}

/**
 * 日报导出配置
 */
export interface UnifiedDailyReportConfig {
  date: Date;
  include_follow_list: boolean;
  include_reply_list: boolean;
  format: 'csv' | 'xlsx';
  output_path?: string;
  include_audit_trail?: boolean;
  timezone?: string;
}

/**
 * 日报导出结果
 */
export interface UnifiedDailyReportResult {
  success: boolean;
  follow_count: number;
  reply_count: number;
  follow_list_path?: string;
  reply_list_path?: string;
  error?: string;
  export_time: Date;
  audit_log_id?: string;
}

/**
 * 日报统计数据
 */
export interface DailyReportStats {
  report_date: Date;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  success_rate: number;
  follow_tasks: number;
  reply_tasks: number;
  platform_distribution: Record<Platform, number>;
  execution_time_stats: {
    average_ms: number;
    min_ms: number;
    max_ms: number;
    total_ms: number;
  };
}

// ==================== 统一日报服务类 ====================

/**
 * 统一日报服务
 * 
 * 合并所有日报相关功能，提供统一的接口
 */
export class UnifiedDailyReportService {
  
  /**
   * 导出日报（主要入口方法）
   */
  async exportDailyReport(config: UnifiedDailyReportConfig): Promise<UnifiedDailyReportResult> {
    const startTime = Date.now();
    
    try {
      const result: UnifiedDailyReportResult = {
        success: false,
        follow_count: 0,
        reply_count: 0,
        export_time: new Date()
      };

      // 获取当日已完成的任务
      const dateStr = this.formatDate(config.date);
      const completedTasks = await this.getCompletedTasks(dateStr);

      // 分离关注任务和回复任务
      const followTasks = completedTasks.filter(task => 
        task.task_type === TaskType.FOLLOW && task.result_code === ResultCode.OK
      );
      const replyTasks = completedTasks.filter(task => 
        task.task_type === TaskType.REPLY && task.result_code === ResultCode.OK
      );

      result.follow_count = followTasks.length;
      result.reply_count = replyTasks.length;

      // 导出关注清单
      if (config.include_follow_list && followTasks.length > 0) {
        const followListPath = await this.exportFollowList(
          followTasks, 
          dateStr, 
          config.format,
          config.output_path
        );
        result.follow_list_path = followListPath;
      }

      // 导出回复清单
      if (config.include_reply_list && replyTasks.length > 0) {
        const replyListPath = await this.exportReplyList(
          replyTasks, 
          dateStr, 
          config.format,
          config.output_path
        );
        result.reply_list_path = replyListPath;
      }

      // 记录到数据库
      await this.recordDailyReport({
        date: dateStr,
        follow_count: result.follow_count,
        reply_count: result.reply_count,
        file_path: result.follow_list_path || result.reply_list_path || ''
      });

      // 记录审计日志
      if (config.include_audit_trail) {
        const auditLogId = await this.logReportExport(config, result);
        result.audit_log_id = auditLogId;
      }

      result.success = true;
      const executionTime = Date.now() - startTime;
      
      message.success(
        `日报导出完成：关注 ${result.follow_count} 条，回复 ${result.reply_count} 条，耗时 ${Math.round(executionTime / 1000)}秒`
      );

      return result;

    } catch (error) {
      console.error('日报导出失败:', error);
      return {
        success: false,
        follow_count: 0,
        reply_count: 0,
        error: error instanceof Error ? error.message : String(error),
        export_time: new Date()
      };
    }
  }

  /**
   * 获取日报统计数据
   */
  async getDailyReportStats(date: Date): Promise<DailyReportStats> {
    const dateStr = this.formatDate(date);
    const tasks = await this.getTasksByDate(dateStr);
    
    const successfulTasks = tasks.filter(task => task.status === TaskStatus.DONE);
    const failedTasks = tasks.filter(task => task.status === TaskStatus.FAILED);
    
    // 计算平台分布
    const platformDistribution: Record<Platform, number> = {} as Record<Platform, number>;
    tasks.forEach(() => {
      const platform = this.inferPlatformFromTask();
      platformDistribution[platform] = (platformDistribution[platform] || 0) + 1;
    });
    
    // 计算执行时间统计（模拟数据，实际应从数据库获取）
    const executionTimes = tasks
      .filter(task => task.executed_at && task.created_at)
      .map(task => {
        const start = new Date(task.created_at!).getTime();
        const end = new Date(task.executed_at!).getTime();
        return end - start;
      });

    return {
      report_date: date,
      total_tasks: tasks.length,
      successful_tasks: successfulTasks.length,
      failed_tasks: failedTasks.length,
      success_rate: tasks.length > 0 ? successfulTasks.length / tasks.length : 0,
      follow_tasks: tasks.filter(task => task.task_type === TaskType.FOLLOW).length,
      reply_tasks: tasks.filter(task => task.task_type === TaskType.REPLY).length,
      platform_distribution: platformDistribution,
      execution_time_stats: {
        average_ms: executionTimes.length > 0 ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0,
        min_ms: executionTimes.length > 0 ? Math.min(...executionTimes) : 0,
        max_ms: executionTimes.length > 0 ? Math.max(...executionTimes) : 0,
        total_ms: executionTimes.reduce((a, b) => a + b, 0)
      }
    };
  }

  /**
   * 生成CSV模板
   */
  generateCsvTemplate(type: 'follow' | 'reply'): string {
    if (type === 'follow') {
      return '关注日期,关注账号ID\n2025-01-01,account_123';
    } else {
      return '日期,视频链接,评论账户ID,评论内容,回复账号ID,回复内容\n2025-01-01,https://example.com/video/123,user_456,示例评论,account_789,示例回复';
    }
  }

  // ==================== 私有方法 ====================

  private async getCompletedTasks(dateStr: string): Promise<Task[]> {
    try {
      return await invoke('plugin:prospecting|list_tasks', {
        status: TaskStatus.DONE,
        result_code: ResultCode.OK,
        created_since: `${dateStr}T00:00:00.000Z`,
        created_until: `${dateStr}T23:59:59.999Z`
      }) as Task[];
    } catch (error) {
      console.error('获取已完成任务失败:', error);
      return [];
    }
  }

  private async getTasksByDate(dateStr: string): Promise<Task[]> {
    try {
      return await invoke('plugin:prospecting|list_tasks', {
        created_since: `${dateStr}T00:00:00.000Z`,
        created_until: `${dateStr}T23:59:59.999Z`
      }) as Task[];
    } catch (error) {
      console.error('获取任务失败:', error);
      return [];
    }
  }

  private async exportFollowList(
    followTasks: Task[], 
    dateStr: string, 
    format: 'csv' | 'xlsx',
    outputPath?: string
  ): Promise<string> {
    const followList: FollowListItem[] = followTasks.map(task => ({
      关注日期: dateStr,
      关注账号ID: task.assign_account_id || 'unknown',
      被关注用户ID: task.target_user_id,
      平台: this.inferPlatformFromTask(),
      任务ID: task.id
    }));

    if (format === 'csv') {
      return this.exportFollowListToCsv(followList, dateStr, outputPath);
    } else {
      return this.exportFollowListToExcel(followList, dateStr, outputPath);
    }
  }

  private async exportReplyList(
    replyTasks: Task[], 
    dateStr: string, 
    format: 'csv' | 'xlsx',
    outputPath?: string
  ): Promise<string> {
    const replyList: ReplyListItem[] = [];
    
    for (const task of replyTasks) {
      // 获取相关的评论和视频信息
      const commentInfo = await this.getCommentInfo(task.comment_id);
      const videoInfo = await this.getVideoInfo(String(commentInfo?.video_id || ''));
      
      replyList.push({
        日期: dateStr,
        视频链接: String(videoInfo?.url || 'unknown'),
        评论账户ID: String(commentInfo?.author_id || 'unknown'),
        评论内容: String(commentInfo?.content || 'unknown'),
        回复账号ID: task.assign_account_id || 'unknown',
        回复内容: (task as Task & { reply_content?: string }).reply_content || 'auto_reply',
        评论ID: task.comment_id,
        任务ID: task.id
      });
    }

    if (format === 'csv') {
      return this.exportReplyListToCsv(replyList, dateStr, outputPath);
    } else {
      return this.exportReplyListToExcel(replyList, dateStr, outputPath);
    }
  }

  private async exportFollowListToCsv(
    followList: FollowListItem[], 
    dateStr: string,
    outputPath?: string
  ): Promise<string> {
    const headers = ['关注日期', '关注账号ID'];
    const rows = followList.map(item => [
      item.关注日期,
      item.关注账号ID
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const filename = `关注清单_${dateStr}.csv`;
    const filePath = outputPath ? `${outputPath}/${filename}` : filename;

    try {
      if (outputPath) {
        await invoke('plugin:file_manager|write_text', { path: filePath, content: csvContent });
        return filePath;
      } else {
        const savedPath = await save({
          defaultPath: filename,
          filters: [{ name: 'CSV文件', extensions: ['csv'] }]
        });
        
        if (savedPath) {
          await invoke('plugin:file_manager|write_text', { path: savedPath, content: csvContent });
          return savedPath;
        }
        
        throw new Error('用户取消了文件保存');
      }
    } catch (error) {
      console.error('导出关注清单CSV失败:', error);
      throw error;
    }
  }

  private async exportReplyListToCsv(
    replyList: ReplyListItem[], 
    dateStr: string,
    outputPath?: string
  ): Promise<string> {
    const headers = ['日期', '视频链接', '评论账户ID', '评论内容', '回复账号ID', '回复内容'];
    const rows = replyList.map(item => [
      item.日期,
      item.视频链接,
      item.评论账户ID,
      `"${item.评论内容.replace(/"/g, '""')}"`, // CSV转义处理
      item.回复账号ID,
      `"${item.回复内容.replace(/"/g, '""')}"` // CSV转义处理
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const filename = `回复清单_${dateStr}.csv`;
    const filePath = outputPath ? `${outputPath}/${filename}` : filename;

    try {
      if (outputPath) {
        await invoke('plugin:file_manager|write_text', { path: filePath, content: csvContent });
        return filePath;
      } else {
        const savedPath = await save({
          defaultPath: filename,
          filters: [{ name: 'CSV文件', extensions: ['csv'] }]
        });
        
        if (savedPath) {
          await invoke('plugin:file_manager|write_text', { path: savedPath, content: csvContent });
          return savedPath;
        }
        
        throw new Error('用户取消了文件保存');
      }
    } catch (error) {
      console.error('导出回复清单CSV失败:', error);
      throw error;
    }
  }

  private async exportFollowListToExcel(
    followList: FollowListItem[], 
    dateStr: string,
    outputPath?: string
  ): Promise<string> {
    // TODO: 实现Excel导出功能
    // 目前先使用CSV格式作为回退
    console.warn('Excel导出功能尚未实现，使用CSV格式');
    return this.exportFollowListToCsv(followList, dateStr, outputPath);
  }

  private async exportReplyListToExcel(
    replyList: ReplyListItem[], 
    dateStr: string,
    outputPath?: string
  ): Promise<string> {
    // TODO: 实现Excel导出功能
    // 目前先使用CSV格式作为回退
    console.warn('Excel导出功能尚未实现，使用CSV格式');
    return this.exportReplyListToCsv(replyList, dateStr, outputPath);
  }

  private async recordDailyReport(data: {
    date: string;
    follow_count: number;
    reply_count: number;
    file_path: string;
  }): Promise<void> {
    try {
      await invoke('plugin:prospecting|insert_daily_report', {
        payload: {
          date: data.date,
          follow_count: data.follow_count,
          reply_count: data.reply_count,
          file_path: data.file_path
        }
      });
    } catch (error) {
      console.error('记录日报失败:', error);
      // 非关键错误，不抛出异常
    }
  }

  private async logReportExport(
    config: UnifiedDailyReportConfig, 
    result: UnifiedDailyReportResult
  ): Promise<string> {
    try {
      return await invoke('plugin:prospecting|insert_audit_log', {
        payload: {
          action: AuditAction.EXPORT,
          operator: 'system',
          resource_id: this.formatDate(config.date),
          resource_type: 'daily_report',
          details: JSON.stringify({
            include_follow_list: config.include_follow_list,
            include_reply_list: config.include_reply_list,
            format: config.format,
            follow_count: result.follow_count,
            reply_count: result.reply_count,
            success: result.success
          }),
          result: result.success ? 'success' : 'failed',
          error_message: result.error
        }
      }) as string;
    } catch (error) {
      console.error('记录审计日志失败:', error);
      return '';
    }
  }

  private async getCommentInfo(commentId?: string): Promise<Record<string, unknown> | null> {
    if (!commentId) return null;
    
    try {
      return await invoke('plugin:prospecting|get_comment_by_id', { id: commentId });
    } catch (error) {
      console.error('获取评论信息失败:', error);
      return null;
    }
  }

  private async getVideoInfo(videoId?: string): Promise<Record<string, unknown> | null> {
    if (!videoId) return null;
    
    try {
      return await invoke('plugin:prospecting|get_watch_target_by_id', { id: videoId });
    } catch (error) {
      console.error('获取视频信息失败:', error);
      return null;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private inferPlatformFromTask(): Platform {
    // 根据任务相关信息推断平台
    // 这里是简化实现，实际应该根据任务关联的目标或评论来判断
    return Platform.DOUYIN; // 默认平台
  }
}

// ==================== 导出单例实例 ====================

export const unifiedDailyReportService = new UnifiedDailyReportService();

// ==================== 向后兼容的工厂函数 ====================

/**
 * 创建日报服务实例（向后兼容）
 */
export function createDailyReportService(): UnifiedDailyReportService {
  return unifiedDailyReportService;
}

/**
 * 获取默认配置（向后兼容）
 */
export function getDefaultDailyReportConfig(): UnifiedDailyReportConfig {
  return {
    date: new Date(),
    include_follow_list: true,
    include_reply_list: true,
    format: 'csv',
    include_audit_trail: true,
    timezone: 'Asia/Shanghai'
  };
}