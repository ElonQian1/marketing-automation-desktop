// src/modules/precise-acquisition/task-generation/engines/TaskGenerationEngine.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客系统 - 任务生成引擎
 * 
 * 基于筛选后的评论生成回复任务和关注任务
 * 实现文档中的"合规三步法"第二步：从评论到任务的转换
 */

import { WatchTarget, Comment, Task } from '../../shared/types/core';
import { Platform, TaskType, TaskStatus, TaskPriority } from '../../shared/constants';
// import { CommentFilterEngine, CommentFilterResult } from '../comment-collection/engines/CommentFilterEngine';

// ==================== 任务生成配置 ====================

/**
 * 任务生成策略配置
 */
export interface TaskGenerationConfig {
  // 基础配置
  max_tasks_per_batch?: number;           // 单批最大任务数
  max_daily_tasks?: number;               // 每日任务上限
  
  // 回复任务配置
  reply_task_config?: {
    enabled: boolean;                     // 是否启用回复任务
    max_replies_per_video?: number;       // 每个视频最大回复数
    min_comment_quality_score?: number;   // 最小评论质量分
    reply_delay_range?: {                 // 回复延迟范围
      min_minutes: number;
      max_minutes: number;
    };
    template_selection_strategy?: 'random' | 'weighted' | 'contextual'; // 模板选择策略
  };
  
  // 关注任务配置
  follow_task_config?: {
    enabled: boolean;                     // 是否启用关注任务
    max_follows_per_day?: number;         // 每日最大关注数
    min_follower_count?: number;          // 最小粉丝数要求
    follow_delay_range?: {                // 关注延迟范围
      min_minutes: number;
      max_minutes: number;
    };
    avoid_duplicate_follows?: boolean;    // 避免重复关注
  };
  
  // 优先级策略
  priority_strategy?: {
    high_priority_keywords?: string[];   // 高优先级关键词
    industry_priority_weights?: Map<string, number>; // 行业优先级权重
    time_decay_factor?: number;          // 时间衰减因子
  };
  
  // 安全配置
  safety_config?: {
    enable_content_check?: boolean;      // 启用内容检查
    sensitive_word_check?: boolean;      // 敏感词检查
    rate_limit_protection?: boolean;     // 速率限制保护
  };
}

/**
 * 任务生成结果
 */
export interface TaskGenerationResult {
  success: boolean;
  generated_tasks: Task[];
  skipped_comments: Comment[];
  generation_stats: {
    total_comments_processed: number;
    reply_tasks_generated: number;
    follow_tasks_generated: number;
    skipped_count: number;
    error_count: number;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * 任务模板信息
 */
export interface TaskTemplate {
  id: string;
  type: TaskType;
  name: string;
  content_template: string;              // 模板内容（支持变量替换）
  variables: string[];                   // 可用变量列表
  weight?: number;                       // 选择权重
  conditions?: {                         // 应用条件
    keywords?: string[];
    platforms?: Platform[];
    industries?: string[];
  };
}

// ==================== 任务生成引擎 ====================

/**
 * 任务生成引擎核心类
 */
export class TaskGenerationEngine {
  private config: TaskGenerationConfig;
  private templates: Map<TaskType, TaskTemplate[]>;
  private commentFilter: CommentFilterEngine;
  
  constructor(
    config: TaskGenerationConfig,
    commentFilter: CommentFilterEngine
  ) {
    this.config = this.validateAndMergeConfig(config);
    this.templates = new Map();
    this.commentFilter = commentFilter;
  }
  
  /**
   * 从筛选结果生成任务
   */
  async generateTasksFromFilterResult(
    filterResult: CommentFilterResult,
    watchTargets: WatchTarget[]
  ): Promise<TaskGenerationResult> {
    try {
      const result: TaskGenerationResult = {
        success: true,
        generated_tasks: [],
        skipped_comments: [],
        generation_stats: {
          total_comments_processed: 0,
          reply_tasks_generated: 0,
          follow_tasks_generated: 0,
          skipped_count: 0,
          error_count: 0
        },
        errors: [],
        warnings: []
      };
      
      // 处理每个评论
      for (const comment of filterResult.filtered_comments) {
        try {
          result.generation_stats.total_comments_processed++;
          
          // 查找对应的监控目标
          const watchTarget = watchTargets.find(target => 
            target.id === comment.sourceTargetId
          );
          
          if (!watchTarget) {
            result.skipped_comments.push(comment);
            result.generation_stats.skipped_count++;
            result.warnings?.push(`未找到评论 ${comment.id} 对应的监控目标`);
            continue;
          }
          
          // 生成回复任务
          if (this.config.reply_task_config?.enabled) {
            const replyTask = await this.generateReplyTask(comment, watchTarget);
            if (replyTask) {
              result.generated_tasks.push(replyTask);
              result.generation_stats.reply_tasks_generated++;
            }
          }
          
          // 生成关注任务
          if (this.config.follow_task_config?.enabled) {
            const followTask = await this.generateFollowTask(comment, watchTarget);
            if (followTask) {
              result.generated_tasks.push(followTask);
              result.generation_stats.follow_tasks_generated++;
            }
          }
          
        } catch (error) {
          result.generation_stats.error_count++;
          result.errors?.push(`处理评论 ${comment.id} 时出错: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
      
      // 应用每日限制
      result.generated_tasks = this.applyDailyLimits(result.generated_tasks);
      
      // 排序和优先级处理
      result.generated_tasks = this.applyPriorityStrategy(result.generated_tasks);
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        generated_tasks: [],
        skipped_comments: [],
        generation_stats: {
          total_comments_processed: 0,
          reply_tasks_generated: 0,
          follow_tasks_generated: 0,
          skipped_count: 0,
          error_count: 1
        },
        errors: [error instanceof Error ? error.message : '未知错误']
      };
    }
  }
  
  /**
   * 批量生成任务
   */
  async generateTasksBatch(
    comments: Comment[],
    watchTargets: WatchTarget[]
  ): Promise<TaskGenerationResult> {
    // 先通过过滤器筛选评论
    const filterResult = await this.commentFilter.filterComments({
      comments,
      watch_targets: watchTargets
    });
    
    // 生成任务
    return this.generateTasksFromFilterResult(filterResult, watchTargets);
  }
  
  /**
   * 生成单个回复任务
   */
  private async generateReplyTask(
    comment: Comment,
    watchTarget: WatchTarget
  ): Promise<Task | null> {
    try {
      // 检查评论质量分
      const qualityScore = this.calculateCommentQualityScore(comment);
      const minScore = this.config.reply_task_config?.min_comment_quality_score || 0.6;
      
      if (qualityScore < minScore) {
        return null;
      }
      
      // 选择回复模板
      const template = await this.selectReplyTemplate(comment, watchTarget);
      if (!template) {
        return null;
      }
      
      // 生成回复内容
      const replyContent = this.generateReplyContent(template, comment, watchTarget);
      
      // 计算执行时间
      const executionTime = this.calculateTaskExecutionTime(
        this.config.reply_task_config?.reply_delay_range
      );
      
      // 创建任务
      const task = Task.create({
        type: TaskType.REPLY,
        title: `回复评论: ${comment.content.substring(0, 20)}...`,
        content: replyContent,
        targetId: comment.id,
        sourceTargetId: watchTarget.id!,
        platform: comment.platform,
        priority: this.calculateTaskPriority(comment, watchTarget),
        status: TaskStatus.PENDING,
        scheduledTime: executionTime,
        metadata: {
          comment_id: comment.id,
          template_id: template.id,
          quality_score: qualityScore,
          watch_target_id: watchTarget.id
        }
      });
      
      return task;
      
    } catch (error) {
      console.warn('生成回复任务失败:', error);
      return null;
    }
  }
  
  /**
   * 生成单个关注任务
   */
  private async generateFollowTask(
    comment: Comment,
    watchTarget: WatchTarget
  ): Promise<Task | null> {
    try {
      // 检查是否已关注
      if (this.config.follow_task_config?.avoid_duplicate_follows) {
        const alreadyFollowed = await this.checkIfAlreadyFollowed(comment.author_id);
        if (alreadyFollowed) {
          return null;
        }
      }
      
      // 检查粉丝数要求
      const followerCount = await this.getAuthorFollowerCount(comment.author_id);
      const minFollowers = this.config.follow_task_config?.min_follower_count || 0;
      
      if (followerCount < minFollowers) {
        return null;
      }
      
      // 计算执行时间
      const executionTime = this.calculateTaskExecutionTime(
        this.config.follow_task_config?.follow_delay_range
      );
      
      // 创建任务
      const task = Task.create({
        type: TaskType.FOLLOW,
        title: `关注用户: ${comment.author_id}`,
        content: `关注在 ${watchTarget.name} 下评论的用户`,
        targetId: comment.author_id,
        sourceTargetId: watchTarget.id!,
        platform: comment.platform,
        priority: this.calculateTaskPriority(comment, watchTarget),
        status: TaskStatus.PENDING,
        scheduledTime: executionTime,
        metadata: {
          comment_id: comment.id,
          author_id: comment.author_id,
          follower_count: followerCount,
          watch_target_id: watchTarget.id
        }
      });
      
      return task;
      
    } catch (error) {
      console.warn('生成关注任务失败:', error);
      return null;
    }
  }
  
  /**
   * 计算评论质量分
   */
  private calculateCommentQualityScore(comment: Comment): number {
    let score = 0.5; // 基础分
    
    // 评论长度评分
    const contentLength = comment.content.length;
    if (contentLength > 10 && contentLength < 200) {
      score += 0.2;
    }
    
    // 点赞数评分
    if (comment.like_count > 0) {
      score += Math.min(comment.like_count * 0.05, 0.3);
    }
    
    // 发布时间评分（越新越好）
    const daysSincePublish = (Date.now() - comment.publish_time.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublish < 1) {
      score += 0.2;
    } else if (daysSincePublish < 7) {
      score += 0.1;
    }
    
    // 内容质量评分（简单规则）
    if (this.hasHighQualityIndicators(comment.content)) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 选择回复模板
   */
  private async selectReplyTemplate(
    comment: Comment,
    watchTarget: WatchTarget
  ): Promise<TaskTemplate | null> {
    const replyTemplates = this.templates.get(TaskType.REPLY) || [];
    
    if (replyTemplates.length === 0) {
      return null;
    }
    
    const strategy = this.config.reply_task_config?.template_selection_strategy || 'random';
    
    switch (strategy) {
      case 'weighted':
        return this.selectWeightedTemplate(replyTemplates);
      case 'contextual':
        return this.selectContextualTemplate(replyTemplates, comment, watchTarget);
      default:
        return replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
    }
  }
  
  /**
   * 生成回复内容
   */
  private generateReplyContent(
    template: TaskTemplate,
    comment: Comment,
    watchTarget: WatchTarget
  ): string {
    let content = template.content_template;
    
    // 变量替换
    const variables: { [key: string]: string } = {
      '{comment_author}': comment.author_id,
      '{comment_content}': comment.content.substring(0, 50),
      '{target_name}': watchTarget.name,
      '{current_time}': new Date().toLocaleString(),
      '{random_emoji}': this.getRandomEmoji()
    };
    
    for (const [variable, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(variable, 'g'), value);
    }
    
    return content;
  }
  
  /**
   * 计算任务优先级
   */
  private calculateTaskPriority(comment: Comment, watchTarget: WatchTarget): TaskPriority {
    let priorityScore = 0;
    
    // 基于关键词的优先级
    const highPriorityKeywords = this.config.priority_strategy?.high_priority_keywords || [];
    for (const keyword of highPriorityKeywords) {
      if (comment.content.includes(keyword)) {
        priorityScore += 10;
      }
    }
    
    // 基于点赞数的优先级
    priorityScore += comment.like_count * 2;
    
    // 基于时间的优先级（越新优先级越高）
    const hoursOld = (Date.now() - comment.publish_time.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 1) priorityScore += 5;
    else if (hoursOld < 24) priorityScore += 3;
    
    // 转换为枚举值
    if (priorityScore >= 15) return TaskPriority.HIGH;
    if (priorityScore >= 8) return TaskPriority.MEDIUM;
    return TaskPriority.LOW;
  }
  
  /**
   * 计算任务执行时间
   */
  private calculateTaskExecutionTime(delayRange?: { min_minutes: number; max_minutes: number }): Date {
    if (!delayRange) {
      return new Date(Date.now() + 30 * 60 * 1000); // 默认30分钟后
    }
    
    const minDelay = delayRange.min_minutes * 60 * 1000;
    const maxDelay = delayRange.max_minutes * 60 * 1000;
    const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    return new Date(Date.now() + randomDelay);
  }
  
  /**
   * 应用每日限制
   */
  private applyDailyLimits(tasks: Task[]): Task[] {
    const maxDaily = this.config.max_daily_tasks || 100;
    const maxBatch = this.config.max_tasks_per_batch || 50;
    
    let limitedTasks = tasks.slice(0, Math.min(maxDaily, maxBatch));
    
    // 按任务类型应用限制
    const replyLimit = this.config.reply_task_config?.max_replies_per_video || 10;
    const followLimit = this.config.follow_task_config?.max_follows_per_day || 20;
    
    // 统计并限制
    const replyTasks = limitedTasks.filter(t => t.task_type === TaskType.REPLY).slice(0, replyLimit);
    const followTasks = limitedTasks.filter(t => t.task_type === TaskType.FOLLOW).slice(0, followLimit);
    
    return [...replyTasks, ...followTasks];
  }
  
  /**
   * 应用优先级策略
   */
  private applyPriorityStrategy(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // 首先按优先级排序
      const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // 然后按计划时间排序
      return a.scheduled_time.getTime() - b.scheduled_time.getTime();
    });
  }
  
  // ==================== 辅助方法 ====================
  
  private validateAndMergeConfig(config: TaskGenerationConfig): TaskGenerationConfig {
    return {
      max_tasks_per_batch: config.max_tasks_per_batch || 50,
      max_daily_tasks: config.max_daily_tasks || 100,
      reply_task_config: {
        enabled: config.reply_task_config?.enabled ?? true,
        max_replies_per_video: config.reply_task_config?.max_replies_per_video || 10,
        min_comment_quality_score: config.reply_task_config?.min_comment_quality_score || 0.6,
        reply_delay_range: config.reply_task_config?.reply_delay_range || { min_minutes: 10, max_minutes: 60 },
        template_selection_strategy: config.reply_task_config?.template_selection_strategy || 'random'
      },
      follow_task_config: {
        enabled: config.follow_task_config?.enabled ?? true,
        max_follows_per_day: config.follow_task_config?.max_follows_per_day || 20,
        min_follower_count: config.follow_task_config?.min_follower_count || 100,
        follow_delay_range: config.follow_task_config?.follow_delay_range || { min_minutes: 30, max_minutes: 180 },
        avoid_duplicate_follows: config.follow_task_config?.avoid_duplicate_follows ?? true
      },
      priority_strategy: config.priority_strategy || {},
      safety_config: {
        enable_content_check: config.safety_config?.enable_content_check ?? true,
        sensitive_word_check: config.safety_config?.sensitive_word_check ?? true,
        rate_limit_protection: config.safety_config?.rate_limit_protection ?? true
      }
    };
  }
  
  private hasHighQualityIndicators(content: string): boolean {
    const qualityPatterns = ['谢谢', '很好', '学到了', '有用', '赞同', '支持'];
    return qualityPatterns.some(pattern => content.includes(pattern));
  }
  
  private selectWeightedTemplate(templates: TaskTemplate[]): TaskTemplate {
    const totalWeight = templates.reduce((sum, t) => sum + (t.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const template of templates) {
      random -= (template.weight || 1);
      if (random <= 0) return template;
    }
    
    return templates[0];
  }
  
  private selectContextualTemplate(
    templates: TaskTemplate[],
    comment: Comment,
    watchTarget: WatchTarget
  ): TaskTemplate {
    // TODO: 实现基于上下文的模板选择
    return templates[0];
  }
  
  private getRandomEmoji(): string {
    const emojis = ['👍', '😊', '🙏', '💪', '👏', '🔥', '✨', '💯'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }
  
  private async checkIfAlreadyFollowed(authorId: string): Promise<boolean> {
    // TODO: 实现关注状态检查
    return false;
  }
  
  private async getAuthorFollowerCount(authorId: string): Promise<number> {
    // TODO: 实现粉丝数获取
    return Math.floor(Math.random() * 10000);
  }
  
  /**
   * 添加任务模板
   */
  public addTemplate(template: TaskTemplate): void {
    if (!this.templates.has(template.type)) {
      this.templates.set(template.type, []);
    }
    this.templates.get(template.type)!.push(template);
  }
  
  /**
   * 删除任务模板
   */
  public removeTemplate(templateId: string, type: TaskType): void {
    const templates = this.templates.get(type);
    if (templates) {
      const index = templates.findIndex(t => t.id === templateId);
      if (index > -1) {
        templates.splice(index, 1);
      }
    }
  }
  
  /**
   * 获取所有模板
   */
  public getTemplates(type?: TaskType): TaskTemplate[] {
    if (type) {
      return this.templates.get(type) || [];
    }
    
    const allTemplates: TaskTemplate[] = [];
    for (const templates of this.templates.values()) {
      allTemplates.push(...templates);
    }
    return allTemplates;
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建任务生成引擎
 */
export function createTaskGenerationEngine(
  config: TaskGenerationConfig,
  commentFilter: CommentFilterEngine
): TaskGenerationEngine {
  return new TaskGenerationEngine(config, commentFilter);
}

/**
 * 创建默认配置的任务生成引擎
 */
export function createDefaultTaskGenerationEngine(
  commentFilter: CommentFilterEngine
): TaskGenerationEngine {
  const defaultConfig: TaskGenerationConfig = {
    max_tasks_per_batch: 50,
    max_daily_tasks: 100,
    reply_task_config: {
      enabled: true,
      max_replies_per_video: 10,
      min_comment_quality_score: 0.6,
      reply_delay_range: { min_minutes: 10, max_minutes: 60 },
      template_selection_strategy: 'random'
    },
    follow_task_config: {
      enabled: true,
      max_follows_per_day: 20,
      min_follower_count: 100,
      follow_delay_range: { min_minutes: 30, max_minutes: 180 },
      avoid_duplicate_follows: true
    },
    priority_strategy: {
      high_priority_keywords: ['合作', '咨询', '购买', '感兴趣'],
      time_decay_factor: 0.8
    },
    safety_config: {
      enable_content_check: true,
      sensitive_word_check: true,
      rate_limit_protection: true
    }
  };
  
  return new TaskGenerationEngine(defaultConfig, commentFilter);
}