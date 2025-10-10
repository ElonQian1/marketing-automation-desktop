/**
 * 日报导出服务
 * 
 * 基于文档：round_2_｜候选池字段清单（v_1_）.md
 * 实现关注清单和回复清单的导出功能
 */

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { message } from 'antd';
import { TaskStatus, ResultCode } from '../../../../constants/precise-acquisition-enums';

// ==================== 类型定义 ====================

/**
 * 关注清单条目
 */
export interface FollowListItem {
  follow_date: string;          // 关注日期 (YYYY-MM-DD)
  follow_account_id: string;    // 关注账号ID
  target_user_id: string;       // 被关注用户ID
  platform: string;            // 平台
  task_id: string;              // 任务ID（用于追踪）
}

/**
 * 回复清单条目
 */
export interface ReplyListItem {
  reply_date: string;           // 日期 (YYYY-MM-DD)
  video_link: string;           // 视频链接
  comment_account_id: string;   // 评论账户ID
  comment_content: string;      // 评论内容
  reply_account_id: string;     // 回复账号ID
  reply_content: string;        // 回复内容
  task_id: string;              // 任务ID（用于追踪）
}

/**
 * 日报导出参数
 */
export interface DailyReportExportParams {
  date: string;                 // 日期 (YYYY-MM-DD)
  include_follow_list: boolean; // 是否包含关注清单
  include_reply_list: boolean;  // 是否包含回复清单
  format: 'csv' | 'xlsx';       // 导出格式
}

/**
 * 日报导出结果
 */
export interface DailyReportExportResult {
  success: boolean;
  follow_list_path?: string;    // 关注清单文件路径
  reply_list_path?: string;     // 回复清单文件路径
  follow_count: number;         // 关注数
  reply_count: number;          // 回复数
  error?: string;
}

// ==================== 服务实现 ====================

export class DailyReportService {
  
  /**
   * 导出日报
   */
  async exportDailyReport(params: DailyReportExportParams): Promise<DailyReportExportResult> {
    try {
      const result: DailyReportExportResult = {
        success: false,
        follow_count: 0,
        reply_count: 0
      };

      // 获取当日已完成的任务
      const completedTasks = await invoke<any[]>('list_tasks', {
        status: TaskStatus.DONE,
        result_code: ResultCode.OK,
        created_since: `${params.date}T00:00:00.000Z`,
        created_until: `${params.date}T23:59:59.999Z`
      });

      // 分离关注任务和回复任务
      const followTasks = completedTasks.filter(task => task.task_type === 'follow');
      const replyTasks = completedTasks.filter(task => task.task_type === 'reply');

      result.follow_count = followTasks.length;
      result.reply_count = replyTasks.length;

      // 导出关注清单
      if (params.include_follow_list && followTasks.length > 0) {
        const followListPath = await this.exportFollowList(followTasks, params.date, params.format);
        result.follow_list_path = followListPath;
      }

      // 导出回复清单
      if (params.include_reply_list && replyTasks.length > 0) {
        const replyListPath = await this.exportReplyList(replyTasks, params.date, params.format);
        result.reply_list_path = replyListPath;
      }

      // 记录到daily_reports表
      await this.recordDailyReport({
        date: params.date,
        follow_count: result.follow_count,
        reply_count: result.reply_count,
        file_path: result.follow_list_path || result.reply_list_path || ''
      });

      result.success = true;
      return result;
    } catch (error) {
      console.error('导出日报失败:', error);
      return {
        success: false,
        follow_count: 0,
        reply_count: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 导出关注清单
   */
  private async exportFollowList(followTasks: any[], date: string, format: 'csv' | 'xlsx'): Promise<string> {
    const followList: FollowListItem[] = [];

    for (const task of followTasks) {
      // 获取任务执行详情
      const followItem: FollowListItem = {
        follow_date: date,
        follow_account_id: task.assign_account_id,
        target_user_id: task.target_user_id || '',
        platform: await this.inferPlatformFromTask(task),
        task_id: task.id
      };
      followList.push(followItem);
    }

    if (format === 'csv') {
      return await this.exportFollowListToCsv(followList, date);
    } else {
      throw new Error('XLSX格式暂未实现');
    }
  }

  /**
   * 导出回复清单
   */
  private async exportReplyList(replyTasks: any[], date: string, format: 'csv' | 'xlsx'): Promise<string> {
    const replyList: ReplyListItem[] = [];

    for (const task of replyTasks) {
      // 获取评论详情
      const comment = await this.getCommentDetails(task.comment_id);
      const video = await this.getVideoDetails(comment?.video_id);

      const replyItem: ReplyListItem = {
        reply_date: date,
        video_link: video?.url || comment?.video_id || '',
        comment_account_id: comment?.author_id || '',
        comment_content: comment?.content || '',
        reply_account_id: task.assign_account_id,
        reply_content: await this.getReplyContentFromTask(task),
        task_id: task.id
      };
      replyList.push(replyItem);
    }

    if (format === 'csv') {
      return await this.exportReplyListToCsv(replyList, date);
    } else {
      throw new Error('XLSX格式暂未实现');
    }
  }

  /**
   * 导出关注清单到CSV
   */
  private async exportFollowListToCsv(followList: FollowListItem[], date: string): Promise<string> {
    const headers = ['关注日期', '关注账号ID'];
    const rows = followList.map(item => [
      item.follow_date,
      item.follow_account_id
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 使用前端对话框选择文件路径
    const fileName = `关注清单_${date}.csv`;
    try {
      const filePath = await save({
        defaultPath: fileName,
        filters: [{ name: 'CSV文件', extensions: ['csv'] }]
      });
      
      if (!filePath) {
        throw new Error('用户取消了文件保存');
      }
      
      // 使用后端保存文件内容
      const savedPath = await invoke<string>('save_file_dialog', {
        file_path: filePath,
        content: csvContent
      });
      
      message.success(`关注清单已导出: ${savedPath}`);
      return savedPath;
    } catch (error) {
      throw new Error(`保存关注清单失败: ${error}`);
    }
  }

  /**
   * 导出回复清单到CSV
   */
  private async exportReplyListToCsv(replyList: ReplyListItem[], date: string): Promise<string> {
    const headers = ['日期', '视频链接', '评论账户ID', '评论内容', '回复账号ID', '回复内容'];
    const rows = replyList.map(item => [
      item.reply_date,
      item.video_link,
      item.comment_account_id,
      `"${item.comment_content.replace(/"/g, '""')}"`, // CSV转义
      item.reply_account_id,
      `"${item.reply_content.replace(/"/g, '""')}"` // CSV转义
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 使用前端对话框选择文件路径
    const fileName = `回复清单_${date}.csv`;
    try {
      const filePath = await save({
        defaultPath: fileName,
        filters: [{ name: 'CSV文件', extensions: ['csv'] }]
      });
      
      if (!filePath) {
        throw new Error('用户取消了文件保存');
      }
      
      // 使用后端保存文件内容
      const savedPath = await invoke<string>('save_file_dialog', {
        file_path: filePath,
        content: csvContent
      });
      
      message.success(`回复清单已导出: ${savedPath}`);
      return savedPath;
    } catch (error) {
      throw new Error(`保存回复清单失败: ${error}`);
    }
  }

  /**
   * 记录日报到数据库
   */
  private async recordDailyReport(report: {
    date: string;
    follow_count: number;
    reply_count: number;
    file_path: string;
  }): Promise<void> {
    await invoke('insert_daily_report', {
      report: {
        id: `rpt_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`,
        date: report.date,
        follow_count: report.follow_count,
        reply_count: report.reply_count,
        file_path: report.file_path
      }
    });
  }

  /**
   * 从任务推断平台
   */
  private async inferPlatformFromTask(task: any): Promise<string> {
    // 从comment或target_user_id推断平台
    if (task.comment_id) {
      const comment = await this.getCommentDetails(task.comment_id);
      return comment?.platform || 'unknown';
    }
    return 'unknown';
  }

  /**
   * 获取评论详情
   */
  private async getCommentDetails(commentId: string): Promise<any> {
    try {
      const comments = await invoke<any[]>('list_comments', {
        comment_id: commentId,
        limit: 1
      });
      return comments[0] || null;
    } catch (error) {
      console.warn('获取评论详情失败:', error);
      return null;
    }
  }

  /**
   * 获取视频详情（从候选池）
   */
  private async getVideoDetails(videoId: string): Promise<any> {
    try {
      const targets = await invoke<any[]>('list_watch_targets', {
        target_type: 'video',
        id_or_url: videoId,
        limit: 1
      });
      return targets[0] || null;
    } catch (error) {
      console.warn('获取视频详情失败:', error);
      return null;
    }
  }

  /**
   * 从任务获取回复内容
   */
  private async getReplyContentFromTask(task: any): Promise<string> {
    // 从任务的执行结果或审计日志中获取实际发送的回复内容
    // 这里需要根据实际的数据存储结构来实现
    try {
      const auditLogs = await invoke<any[]>('list_audit_logs', {
        task_id: task.id,
        action: 'TASK_EXECUTE',
        limit: 1
      });
      
      const log = auditLogs[0];
      if (log && log.payload_hash) {
        // 从payload中解析回复内容
        // 实际实现需要根据审计日志的存储格式
        return '回复内容'; // 占位符
      }
      
      return '未记录回复内容';
    } catch (error) {
      console.warn('获取回复内容失败:', error);
      return '获取回复内容失败';
    }
  }

  /**
   * 获取指定日期的日报统计
   */
  async getDailyReportStats(date: string): Promise<{
    follow_count: number;
    reply_count: number;
    total_tasks: number;
    success_rate: number;
  }> {
    try {
      const tasks = await invoke<any[]>('list_tasks', {
        created_since: `${date}T00:00:00.000Z`,
        created_until: `${date}T23:59:59.999Z`
      });

      const followTasks = tasks.filter(t => t.task_type === 'follow');
      const replyTasks = tasks.filter(t => t.task_type === 'reply');
      const successTasks = tasks.filter(t => t.status === TaskStatus.DONE && t.result_code === ResultCode.OK);

      return {
        follow_count: followTasks.filter(t => t.status === TaskStatus.DONE && t.result_code === ResultCode.OK).length,
        reply_count: replyTasks.filter(t => t.status === TaskStatus.DONE && t.result_code === ResultCode.OK).length,
        total_tasks: tasks.length,
        success_rate: tasks.length > 0 ? (successTasks.length / tasks.length) * 100 : 0
      };
    } catch (error) {
      console.error('获取日报统计失败:', error);
      return {
        follow_count: 0,
        reply_count: 0,
        total_tasks: 0,
        success_rate: 0
      };
    }
  }
}

// 导出单例
export const dailyReportService = new DailyReportService();