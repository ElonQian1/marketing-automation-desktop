// src/modules/prospecting/application/prospecting-use-cases.ts
// module: prospecting | layer: application | role: 精准获客用例
// summary: 精准获客模块的核心业务用例，协调各服务完成业务流程

import type {
  ProspectingRawComment,
  ProspectingComment,
  ProspectingAnalysisResult,
  ProspectingReplyPlan,
  ProspectingIntentType
} from '../domain';
import { ProspectingIntentAnalyzer } from '../services/prospecting-intent-analyzer';
import { ProspectingReplyPlanner } from '../services/prospecting-reply-planner';
import { invoke } from '@tauri-apps/api/core';

/**
 * 评论导入结果
 */
export interface ProspectingImportCommentsResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * 批量分析选项
 */
export interface ProspectingBatchAnalysisOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number, current?: string) => void;
}

/**
 * 批量分析结果
 */
export interface ProspectingBatchAnalysisResult {
  success: boolean;
  analyzed: number;
  failed: number;
  results: ProspectingAnalysisResult[];
  errors: string[];
}

/**
 * 精准获客用例类
 */
export class ProspectingUseCases {
  private intentAnalyzer: ProspectingIntentAnalyzer;
  private replyPlanner: ProspectingReplyPlanner;

  constructor() {
    this.intentAnalyzer = new ProspectingIntentAnalyzer();
    this.replyPlanner = new ProspectingReplyPlanner();
  }

  /**
   * 导入评论数据
   */
  async importComments(comments: ProspectingRawComment[]): Promise<ProspectingImportCommentsResult> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      for (const comment of comments) {
        try {
          // 验证评论数据
          if (!this.validateComment(comment)) {
            skipped++;
            errors.push(`评论 ${comment.id} 数据不完整`);
            continue;
          }

          // 保存到后端
          await invoke('prospecting_save_comment', { comment });
          imported++;
        } catch (error) {
          skipped++;
          errors.push(`保存评论 ${comment.id} 失败: ${error}`);
        }
      }

      return {
        success: imported > 0,
        imported,
        skipped,
        errors
      };
    } catch (error) {
      return {
        success: false,
        imported,
        skipped,
        errors: [...errors, `导入过程失败: ${error}`]
      };
    }
  }

  /**
   * 获取评论列表
   */
  async getComments(filter?: {
    platform?: string;
    intent?: ProspectingIntentType;
    hasAnalysis?: boolean;
  }): Promise<ProspectingComment[]> {
    try {
      const comments: ProspectingComment[] = await invoke('prospecting_get_comments', { filter });
      return comments;
    } catch (error) {
      console.error('[ProspectingUseCases] 获取评论列表失败:', error);
      return [];
    }
  }

  /**
   * 批量分析评论意图
   */
  async batchAnalyzeComments(
    commentIds?: string[],
    options: ProspectingBatchAnalysisOptions = {}
  ): Promise<ProspectingBatchAnalysisResult> {
    const { concurrency = 3, onProgress } = options;
    
    try {
      // 获取待分析的评论
      const commentsToAnalyze = commentIds 
        ? await this.getCommentsByIds(commentIds)
        : await this.getUnanalyzedComments();

      if (commentsToAnalyze.length === 0) {
        return {
          success: true,
          analyzed: 0,
          failed: 0,
          results: [],
          errors: []
        };
      }

      // 执行批量分析
      const results = await this.intentAnalyzer.analyzeBatch(
        commentsToAnalyze,
        { concurrency, onProgress }
      );

      // 保存分析结果
      let analyzed = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const result of results) {
        try {
          await invoke('prospecting_save_analysis', { 
            commentId: result.commentId, 
            analysis: result 
          });
          analyzed++;
        } catch (error) {
          failed++;
          errors.push(`保存分析结果失败 ${result.commentId}: ${error}`);
        }
      }

      return {
        success: analyzed > 0,
        analyzed,
        failed,
        results,
        errors
      };
    } catch (error) {
      return {
        success: false,
        analyzed: 0,
        failed: 0,
        results: [],
        errors: [`批量分析失败: ${error}`]
      };
    }
  }

  /**
   * 创建回复计划
   */
  async createReplyPlans(
    commentIds: string[],
    options: {
      isSimulation?: boolean;
      customReplies?: Record<string, string>; // commentId -> customReply
    } = {}
  ): Promise<{
    success: boolean;
    plans: ProspectingReplyPlan[];
    errors: string[];
  }> {
    const { isSimulation = true, customReplies = {} } = options;
    const plans: ProspectingReplyPlan[] = [];
    const errors: string[] = [];

    try {
      const comments = await this.getCommentsByIds(commentIds);
      
      for (const comment of comments) {
        try {
          const plan = this.replyPlanner.createReplyPlan(comment, {
            isSimulation,
            customReply: customReplies[comment.id]
          });
          
          await this.replyPlanner.saveReplyPlan(plan);
          plans.push(plan);
        } catch (error) {
          errors.push(`创建回复计划失败 ${comment.id}: ${error}`);
        }
      }

      return {
        success: plans.length > 0,
        plans,
        errors
      };
    } catch (error) {
      return {
        success: false,
        plans: [],
        errors: [`创建回复计划失败: ${error}`]
      };
    }
  }

  /**
   * 执行回复计划
   */
  async executeReplyPlans(
    planIds: string[],
    options: {
      concurrency?: number;
      onProgress?: (completed: number, total: number, current?: string) => void;
    } = {}
  ) {
    try {
      const plans = await this.getReplyPlansByIds(planIds);
      return await this.replyPlanner.executeBatchReplyPlans(plans, options);
    } catch (error) {
      console.error('[ProspectingUseCases] 执行回复计划失败:', error);
      return [];
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalComments: number;
    analyzedComments: number;
    intentDistribution: Record<ProspectingIntentType, number>;
    platformDistribution: Record<string, number>;
    replyPlans: {
      total: number;
      completed: number;
      failed: number;
      pending: number;
    };
  }> {
    try {
      return await invoke('prospecting_get_statistics');
    } catch (error) {
      console.error('[ProspectingUseCases] 获取统计信息失败:', error);
      return {
        totalComments: 0,
        analyzedComments: 0,
        intentDistribution: {
          '询价': 0,
          '询地址': 0,
          '售后': 0,
          '咨询': 0,
          '购买': 0,
          '比较': 0,
          '无效': 0
        },
        platformDistribution: {},
        replyPlans: {
          total: 0,
          completed: 0,
          failed: 0,
          pending: 0
        }
      };
    }
  }

  /**
   * 私有辅助方法
   */
  private validateComment(comment: ProspectingRawComment): boolean {
    return !!(
      comment.id &&
      comment.platform &&
      comment.author &&
      comment.content &&
      comment.content.trim().length > 0
    );
  }

  private async getUnanalyzedComments(): Promise<ProspectingRawComment[]> {
    const allComments = await this.getComments({ hasAnalysis: false });
    return allComments;
  }

  private async getCommentsByIds(ids: string[]): Promise<ProspectingComment[]> {
    try {
      return await invoke('prospecting_get_comments_by_ids', { ids });
    } catch (error) {
      console.error('[ProspectingUseCases] 获取指定评论失败:', error);
      return [];
    }
  }

  private async getReplyPlansByIds(ids: string[]): Promise<ProspectingReplyPlan[]> {
    try {
      return await invoke('prospecting_get_reply_plans_by_ids', { ids });
    } catch (error) {
      console.error('[ProspectingUseCases] 获取指定回复计划失败:', error);
      return [];
    }
  }
}