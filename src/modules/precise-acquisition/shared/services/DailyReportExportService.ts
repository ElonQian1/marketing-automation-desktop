/**
 * 每日报告导出服务
 * 
 * 基于Round2规范，实现关注列表和回复列表的CSV导出功能
 */

import { Task, TaskStatus } from '../../shared/types/core';
import { Comment } from '../../../../domain/precise-acquisition/entities/Comment';
import { WatchTarget } from '../../../../domain/precise-acquisition/entities/WatchTarget';
import { AuditLog } from '../../../../domain/precise-acquisition/entities/AuditLog';

/**
 * 每日报告配置
 */
export interface DailyReportConfig {
  date: Date;
  includeFollows: boolean;
  includeReplies: boolean;
  outputPath?: string;
  timezone?: string;
}

/**
 * 关注列表项
 */
export interface FollowListItem {
  follow_date: string; // YYYY-MM-DD
  followed_account_id: string; // 关注的账号ID
  target_user_id: string; // 原始平台用户ID
  account_name?: string; // 账号昵称（如果有）
  platform: string; // 平台
  task_id: string; // 任务ID用于追溯
}

/**
 * 回复列表项
 */
export interface ReplyListItem {
  reply_date: string; // YYYY-MM-DD
  video_link: string; // 视频链接
  comment_author_id: string; // 评论账户ID
  comment_content: string; // 评论内容
  reply_account_id: string; // 回复账号ID
  reply_content: string; // 回复内容
  comment_id: string; // 评论ID用于追溯
  task_id: string; // 任务ID用于追溯
}

/**
 * 导出结果
 */
export interface ExportResult {
  success: boolean;
  follow_file_path?: string;
  reply_file_path?: string;
  follow_count: number;
  reply_count: number;
  error_message?: string;
  export_time: Date;
}

/**
 * 每日报告导出服务
 */
export class DailyReportExportService {
  
  /**
   * 导出每日报告
   */
  async exportDailyReport(
    config: DailyReportConfig,
    tasks: Task[],
    comments: Comment[],
    watchTargets: WatchTarget[]
  ): Promise<ExportResult> {
    
    try {
      const targetDate = this.formatDate(config.date);
      let followFilePath: string | undefined;
      let replyFilePath: string | undefined;
      let followCount = 0;
      let replyCount = 0;
      
      // 过滤目标日期完成的任务
      const completedTasks = tasks.filter(task => 
        task.status === TaskStatus.DONE &&
        task.executed_at &&
        this.formatDate(task.executed_at) === targetDate
      );
      
      // 导出关注列表
      if (config.includeFollows) {
        const followTasks = completedTasks.filter(task => task.task_type === 'follow');
        const followList = await this.buildFollowList(followTasks);
        followCount = followList.length;
        
        if (followCount > 0) {
          followFilePath = await this.exportFollowListToCSV(followList, targetDate, config.outputPath);
        }
      }
      
      // 导出回复列表
      if (config.includeReplies) {
        const replyTasks = completedTasks.filter(task => task.task_type === 'reply');
        const replyList = await this.buildReplyList(replyTasks, comments, watchTargets);
        replyCount = replyList.length;
        
        if (replyCount > 0) {
          replyFilePath = await this.exportReplyListToCSV(replyList, targetDate, config.outputPath);
        }
      }
      
      // 记录审计日志
      await this.createAuditLog(targetDate, followCount, replyCount);
      
      return {
        success: true,
        follow_file_path: followFilePath,
        reply_file_path: replyFilePath,
        follow_count: followCount,
        reply_count: replyCount,
        export_time: new Date()
      };
      
    } catch (error) {
      return {
        success: false,
        follow_count: 0,
        reply_count: 0,
        error_message: error instanceof Error ? error.message : String(error),
        export_time: new Date()
      };
    }
  }
  
  /**
   * 构建关注列表
   */
  private async buildFollowList(followTasks: Task[]): Promise<FollowListItem[]> {
    const followList: FollowListItem[] = [];
    
    for (const task of followTasks) {
      if (!task.executed_at || !task.target_user_id) continue;
      
      followList.push({
        follow_date: this.formatDate(task.executed_at),
        followed_account_id: task.assign_account_id,
        target_user_id: task.target_user_id,
        account_name: '', // TODO: 从用户信息服务获取
        platform: this.extractPlatformFromTask(task),
        task_id: task.id
      });
    }
    
    return followList;
  }
  
  /**
   * 构建回复列表
   */
  private async buildReplyList(
    replyTasks: Task[],
    comments: Comment[],
    watchTargets: WatchTarget[]
  ): Promise<ReplyListItem[]> {
    const replyList: ReplyListItem[] = [];
    
    for (const task of replyTasks) {
      if (!task.executed_at || !task.comment_id) continue;
      
      // 查找对应的评论
      const comment = comments.find(c => c.id === task.comment_id);
      if (!comment) continue;
      
      // 查找对应的视频/账号 (处理类型转换)
      const watchTarget = watchTargets.find(wt => 
        wt.id?.toString() === comment.sourceTargetId
      );
      if (!watchTarget) continue;
      
      // 获取回复内容
      const replyContent = this.extractReplyContent(task);
      
      replyList.push({
        reply_date: this.formatDate(task.executed_at),
        video_link: watchTarget.idOrUrl,
        comment_author_id: comment.authorId,
        comment_content: comment.content,
        reply_account_id: task.assign_account_id,
        reply_content: replyContent,
        comment_id: comment.id || '',
        task_id: task.id
      });
    }
    
    return replyList;
  }
  
  /**
   * 导出关注列表为CSV
   */
  private async exportFollowListToCSV(
    followList: FollowListItem[],
    targetDate: string,
    outputPath?: string
  ): Promise<string> {
    
    const headers = ['关注日期', '关注账号ID', '目标用户ID', '平台', '账号昵称', '任务ID'];
    const csvContent = [
      headers.join(','),
      ...followList.map(item => [
        item.follow_date,
        item.followed_account_id,
        item.target_user_id,
        item.platform,
        item.account_name || '',
        item.task_id
      ].map(field => this.escapeCsvField(field)).join(','))
    ].join('\n');
    
    const fileName = `关注列表_${targetDate}.csv`;
    const filePath = outputPath ? `${outputPath}/${fileName}` : fileName;
    
    // 添加BOM以确保中文正确显示
    const csvWithBOM = '\uFEFF' + csvContent;
    
    // TODO: 调用Tauri API保存文件
    await this.saveFile(filePath, csvWithBOM);
    
    return filePath;
  }
  
  /**
   * 导出回复列表为CSV
   */
  private async exportReplyListToCSV(
    replyList: ReplyListItem[],
    targetDate: string,
    outputPath?: string
  ): Promise<string> {
    
    const headers = ['日期', '视频链接', '评论账户ID', '评论内容', '回复账号ID', '回复内容', '评论ID', '任务ID'];
    const csvContent = [
      headers.join(','),
      ...replyList.map(item => [
        item.reply_date,
        item.video_link,
        item.comment_author_id,
        item.comment_content,
        item.reply_account_id,
        item.reply_content,
        item.comment_id,
        item.task_id
      ].map(field => this.escapeCsvField(field)).join(','))
    ].join('\n');
    
    const fileName = `回复列表_${targetDate}.csv`;
    const filePath = outputPath ? `${outputPath}/${fileName}` : fileName;
    
    // 添加BOM以确保中文正确显示
    const csvWithBOM = '\uFEFF' + csvContent;
    
    // TODO: 调用Tauri API保存文件
    await this.saveFile(filePath, csvWithBOM);
    
    return filePath;
  }
  
  /**
   * CSV字段转义
   */
  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
  
  /**
   * 从任务中提取平台信息
   */
  private extractPlatformFromTask(task: Task): string {
    // 根据任务ID或其他字段推断平台
    // 这里需要根据实际业务逻辑实现
    return 'douyin'; // 默认抖音
  }
  
  /**
   * 提取回复内容
   */
  private extractReplyContent(task: Task): string {
    // TODO: 从任务执行结果中获取实际回复内容
    // 现在暂时返回默认值，后续需要根据实际存储结构调整
    return '回复内容';
  }
  
  /**
   * 格式化日期为YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * 保存文件（通过Tauri）
   */
  private async saveFile(filePath: string, content: string): Promise<void> {
    // TODO: 实现Tauri文件保存API调用
    console.log(`保存文件: ${filePath}, 大小: ${content.length} 字符`);
    
    // 模拟文件保存
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      // const { writeTextFile } = (window as any).__TAURI__.fs;
      // await writeTextFile(filePath, content);
    }
  }
  
  /**
   * 创建审计日志
   */
  private async createAuditLog(
    targetDate: string,
    followCount: number,
    replyCount: number
  ): Promise<void> {
    
    const auditLog = AuditLog.createExport({
      operator: 'system',
      exportData: {
        date: targetDate,
        follow_count: followCount,
        reply_count: replyCount,
        export_type: 'csv'
      }
    });
    
    // TODO: 保存审计日志到数据库
    console.log('创建审计日志:', auditLog);
  }
  
  /**
   * 按日期范围导出
   */
  async exportDateRange(
    startDate: Date,
    endDate: Date,
    tasks: Task[],
    comments: Comment[],
    watchTargets: WatchTarget[]
  ): Promise<ExportResult[]> {
    
    const results: ExportResult[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const config: DailyReportConfig = {
        date: new Date(currentDate),
        includeFollows: true,
        includeReplies: true
      };
      
      const result = await this.exportDailyReport(config, tasks, comments, watchTargets);
      results.push(result);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return results;
  }
  
  /**
   * 获取导出统计
   */
  getExportStats(results: ExportResult[]): {
    totalDays: number;
    successfulDays: number;
    totalFollows: number;
    totalReplies: number;
    failedDays: string[];
  } {
    
    const failedDays: string[] = [];
    let totalFollows = 0;
    let totalReplies = 0;
    let successfulDays = 0;
    
    for (const result of results) {
      if (result.success) {
        successfulDays++;
        totalFollows += result.follow_count;
        totalReplies += result.reply_count;
      } else {
        failedDays.push(result.export_time.toISOString().split('T')[0]);
      }
    }
    
    return {
      totalDays: results.length,
      successfulDays,
      totalFollows,
      totalReplies,
      failedDays
    };
  }
}