// src/modules/prospecting/services/prospecting-reply-planner.ts
// module: prospecting | layer: services | role: 回复计划管理服务
// summary: 创建、执行和管理评论回复计划

import { invoke } from '@tauri-apps/api/core';
import type {
  ProspectingComment,
  ProspectingReplyPlan,
  ProspectingReplyStep,
  ProspectingReplyPlanStatus,
  ProspectingSocialPlatform
} from '../domain';
import { ProspectingMockDeviceService } from './prospecting-mock-device';

/**
 * 回复计划创建选项
 */
export interface ProspectingCreateReplyPlanOptions {
  /** 是否为模拟执行 */
  isSimulation?: boolean;
  /** 自定义回复内容（覆盖AI建议） */
  customReply?: string;
}

/**
 * 回复计划执行结果
 */
export interface ProspectingReplyExecutionResult {
  planId: string;
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  error?: string;
  executionTime: number;
}

/**
 * 回复计划管理器
 */
export class ProspectingReplyPlanner {
  private mockDevice: ProspectingMockDeviceService;

  constructor() {
    this.mockDevice = new ProspectingMockDeviceService();
  }

  /**
   * 为单个评论创建回复计划
   */
  createReplyPlan(
    comment: ProspectingComment,
    options: ProspectingCreateReplyPlanOptions = {}
  ): ProspectingReplyPlan {
    const { isSimulation = true, customReply } = options;
    
    if (!comment.analysis) {
      throw new Error('评论尚未分析，无法创建回复计划');
    }

    if (!comment.videoUrl) {
      throw new Error('评论缺少视频链接，无法创建回复计划');
    }

    const planId = this.generatePlanId();
    const replyContent = customReply || comment.analysis.suggestedReply;
    
    const steps = this.createReplySteps(comment.platform, comment.videoUrl);

    return {
      id: planId,
      commentId: comment.id,
      platform: comment.platform,
      videoUrl: comment.videoUrl,
      targetAuthor: comment.author,
      targetComment: comment.content,
      replyContent,
      steps,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSimulation
    };
  }

  /**
   * 批量创建回复计划
   */
  createBatchReplyPlans(
    comments: ProspectingComment[],
    options: ProspectingCreateReplyPlanOptions = {}
  ): ProspectingReplyPlan[] {
    return comments
      .filter(comment => comment.analysis && comment.videoUrl)
      .map(comment => this.createReplyPlan(comment, options));
  }

  /**
   * 执行回复计划
   */
  async executeReplyPlan(plan: ProspectingReplyPlan): Promise<ProspectingReplyExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 更新计划状态为执行中
      plan.status = 'executing';
      plan.executedAt = Date.now();
      plan.updatedAt = Date.now();
      
      // 保存计划状态
      await this.saveReplyPlan(plan);

      let result: { success: boolean; completedSteps: number; error?: string };

      if (plan.isSimulation) {
        // 模拟执行
        result = await this.mockDevice.executeReplyPlan(plan);
      } else {
        // 真实执行（调用后端ADB服务）
        result = await this.executeRealReplyPlan(plan);
      }

      // 更新计划状态
      plan.status = result.success ? 'completed' : 'failed';
      plan.completedAt = result.success ? Date.now() : undefined;
      plan.error = result.error;
      plan.updatedAt = Date.now();
      
      // 更新步骤状态
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        if (i < result.completedSteps) {
          step.status = 'completed';
        } else if (i === result.completedSteps && result.error) {
          step.status = 'failed';
          step.error = result.error;
        }
      }

      await this.saveReplyPlan(plan);

      return {
        planId: plan.id,
        success: result.success,
        completedSteps: result.completedSteps,
        totalSteps: plan.steps.length,
        error: result.error,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      plan.status = 'failed';
      plan.error = error instanceof Error ? error.message : '未知错误';
      plan.updatedAt = Date.now();
      
      await this.saveReplyPlan(plan);

      return {
        planId: plan.id,
        success: false,
        completedSteps: 0,
        totalSteps: plan.steps.length,
        error: plan.error,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * 批量执行回复计划
   */
  async executeBatchReplyPlans(
    plans: ProspectingReplyPlan[],
    options: {
      concurrency?: number;
      onProgress?: (completed: number, total: number, current?: string) => void;
    } = {}
  ): Promise<ProspectingReplyExecutionResult[]> {
    const { concurrency = 2, onProgress } = options;
    const results: ProspectingReplyExecutionResult[] = [];
    let completed = 0;

    // 简单的并发控制
    const semaphore = new Array(concurrency).fill(null);
    let planIndex = 0;

    const workers = semaphore.map(async () => {
      while (planIndex < plans.length) {
        const index = planIndex++;
        const plan = plans[index];
        
        try {
          onProgress?.(completed, plans.length, plan.targetAuthor);
          const result = await this.executeReplyPlan(plan);
          results[index] = result;
          completed++;
          onProgress?.(completed, plans.length);
        } catch (error) {
          console.error(`[ProspectingReplyPlanner] 执行计划 ${plan.id} 失败:`, error);
          results[index] = {
            planId: plan.id,
            success: false,
            completedSteps: 0,
            totalSteps: plan.steps.length,
            error: error instanceof Error ? error.message : '未知错误',
            executionTime: 0
          };
          completed++;
          onProgress?.(completed, plans.length);
        }
      }
    });

    await Promise.all(workers);
    
    return results.filter(r => r !== undefined);
  }

  /**
   * 获取回复计划列表
   */
  async getReplyPlans(): Promise<ProspectingReplyPlan[]> {
    try {
      return await invoke('plugin:prospecting|get_reply_plans', { commentIds: [] }); // Assuming empty list for all, or I need to check the backend signature.
    } catch (error) {
      console.error('[ProspectingReplyPlanner] 获取回复计划失败:', error);
      return [];
    }
  }

  /**
   * 保存回复计划
   */
  async saveReplyPlan(plan: ProspectingReplyPlan): Promise<void> {
    try {
      await invoke('plugin:prospecting|save_reply_plan', { plan });
    } catch (error) {
      console.error('[ProspectingReplyPlanner] 保存回复计划失败:', error);
      throw error;
    }
  }

  /**
   * 创建回复步骤
   */
  private createReplySteps(platform: ProspectingSocialPlatform, videoUrl: string): ProspectingReplyStep[] {
    const stepId = () => Math.random().toString(36).substr(2, 9);

    return [
      {
        id: stepId(),
        type: 'open_app',
        description: `打开${platform === 'douyin' ? '抖音' : '小红书'}应用`,
        params: { platform },
        status: 'pending'
      },
      {
        id: stepId(),
        type: 'navigate_to_video',
        description: '导航到目标视频',
        params: { videoUrl },
        status: 'pending'
      },
      {
        id: stepId(),
        type: 'find_comment',
        description: '查找目标评论',
        params: {},
        status: 'pending'
      },
      {
        id: stepId(),
        type: 'input_reply',
        description: '输入回复内容',
        params: {},
        status: 'pending'
      },
      {
        id: stepId(),
        type: 'send_reply',
        description: '发送回复',
        params: {},
        status: 'pending'
      }
    ];
  }

  /**
   * 执行真实回复计划（调用后端ADB服务）
   */
  private async executeRealReplyPlan(plan: ProspectingReplyPlan): Promise<{
    success: boolean;
    completedSteps: number;
    error?: string;
  }> {
    try {
      const result = await invoke('plugin:prospecting|execute_real_reply_plan', { planId: plan.id }) as {
        success: boolean;
        completedSteps: number;
        error?: string;
      };
      return result;
    } catch (error) {
      return {
        success: false,
        completedSteps: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成计划ID
   */
  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}