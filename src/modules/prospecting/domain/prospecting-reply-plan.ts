// src/modules/prospecting/domain/prospecting-reply-plan.ts
// module: prospecting | layer: domain | role: 回复计划实体
// summary: ADB回复执行计划的领域模型

import { ProspectingSocialPlatform } from './prospecting-comment';

/**
 * 回复计划状态
 */
export type ProspectingReplyPlanStatus = 
  | 'pending'    // 待执行
  | 'executing'  // 执行中
  | 'completed'  // 已完成
  | 'failed'     // 执行失败
  | 'cancelled'; // 已取消

/**
 * 回复执行步骤
 */
export interface ProspectingReplyStep {
  /** 步骤ID */
  id: string;
  /** 步骤类型 */
  type: 'open_app' | 'navigate_to_video' | 'find_comment' | 'input_reply' | 'send_reply';
  /** 步骤描述 */
  description: string;
  /** 执行参数 */
  params: Record<string, any>;
  /** 状态 */
  status: 'pending' | 'executing' | 'completed' | 'failed';
  /** 错误信息 */
  error?: string;
  /** 执行时间（毫秒） */
  duration?: number;
}

/**
 * 回复计划
 */
export interface ProspectingReplyPlan {
  /** 计划ID */
  id: string;
  /** 关联的评论ID */
  commentId: string;
  /** 平台 */
  platform: ProspectingSocialPlatform;
  /** 视频/帖子URL */
  videoUrl: string;
  /** 目标评论作者 */
  targetAuthor: string;
  /** 目标评论内容 */
  targetComment: string;
  /** 计划回复的内容 */
  replyContent: string;
  /** 执行步骤 */
  steps: ProspectingReplyStep[];
  /** 计划状态 */
  status: ProspectingReplyPlanStatus;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 执行时间 */
  executedAt?: number;
  /** 完成时间 */
  completedAt?: number;
  /** 错误信息 */
  error?: string;
  /** 是否为模拟执行 */
  isSimulation: boolean;
}

/**
 * 批量回复计划
 */
export interface ProspectingBatchReplyPlan {
  /** 批次ID */
  batchId: string;
  /** 包含的回复计划 */
  plans: ProspectingReplyPlan[];
  /** 批次状态 */
  status: ProspectingReplyPlanStatus;
  /** 创建时间 */
  createdAt: number;
  /** 完成数量 */
  completedCount: number;
  /** 失败数量 */
  failedCount: number;
}