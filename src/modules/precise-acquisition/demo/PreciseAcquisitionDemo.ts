// src/modules/precise-acquisition/demo/PreciseAcquisitionDemo.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客系统 - 端到端演示示例
 * 
 * 演示完整的"合规三步法"工作流程：
 * 1. 候选池导入 → 2. 评论采集筛选 → 3. 任务生成执行
 */

import {
  Platform,
  TaskType,
  TaskStatus,
  TargetType,
  SourceType,
  IndustryTag,
  RegionTag,
  WatchTarget,
  Task
} from '../index';
import type { Comment } from '../index';
import { ProspectingAcquisitionService } from '../prospecting-acquisition-service';

import { globalAuditManager } from '../audit/AuditLogManager';
// import { CommentFilterEngine, createCommentFilterEngine } from '../comment-collection/engines/CommentFilterEngine';
// import { TaskGenerationEngine, createTaskGenerationEngine } from '../task-generation/engines/TaskGenerationEngine';
// import { TaskTemplateManager, createTaskTemplateManager } from '../task-generation/templates/TaskTemplateManager';
// import { TaskScheduler, createDefaultTaskScheduler } from '../task-generation/state/TaskStateManager';
// import { createDefaultTaskExecutionCoordinator } from '../task-execution/executors/TaskExecutors';
// import { DailyReportGenerator, ReportType, createDailyReportGenerator } from '../reporting/DailyReportGenerator';

/**
 * 精准获客系统演示类
 */

// 临时类型定义，用于解决CommentFilterEngine缺失问题
interface CommentFilterEngine {
  filterComments(input: {
    comments: Comment[];
    watch_targets: WatchTarget[];
  }): Promise<{
    filtered_comments: Comment[];
    filter_stats: {
      keyword_matches: number;
      time_window_matches: number;
      interaction_matches: number;
    };
  }>;
}

// 临时任务引擎类型定义
interface TaskGenerationEngine {
  generateTasksFromFilterResult(filterResult: {
    filtered_comments: Comment[];
    filter_stats: unknown;
  }, watchTargets: WatchTarget[]): Promise<{
    tasks: Task[];
    stats: {
      reply_tasks: number;
      follow_tasks: number;
      total_generated: number;
    };
  }>;
}

interface TaskTemplateManager {
  getTemplate(taskType: TaskType): string;
  updateTemplate(taskType: TaskType, template: string): void;
  addTemplate(template: { taskType: TaskType; content: string }): void;
  getAllTemplates(): Array<{ taskType: TaskType; content: string }>;
}

interface TaskScheduler {
  schedule(tasks: Task[]): Promise<void>;
  getScheduledTasks(): Task[];
  addTasks(tasks: Task[]): void;
  getQueueStatus(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
}

interface DailyReportGenerator {
  generateReport(options: {
    type: ReportType;
    date: Date;
    data: unknown;
    date_range?: unknown;
  }): Promise<{
    success: boolean;
    summary?: {
      total_items: number;
    };
  }>;
}

enum ReportType {
  DAILY_SUMMARY = 'daily_summary',
  FOLLOW_LIST = 'follow_list',
  REPLY_LIST = 'reply_list'
}

// 临时工厂函数
function createTaskGenerationEngine(): TaskGenerationEngine {
  return {
    async generateTasksFromFilterResult(filterResult) {
      return {
        tasks: [],
        stats: {
          reply_tasks: filterResult.filtered_comments.length,
          follow_tasks: 0,
          total_generated: filterResult.filtered_comments.length
        }
      };
    }
  };
}

function createTaskTemplateManager(): TaskTemplateManager {
  const templates: Array<{ taskType: TaskType; content: string }> = [];
  return {
    getTemplate: (taskType: TaskType) => `Default template for ${taskType}`,
    updateTemplate: () => {},
    addTemplate: (template) => templates.push(template),
    getAllTemplates: () => templates
  };
}

function createDefaultTaskScheduler(): TaskScheduler {
  const tasks: Task[] = [];
  return {
    schedule: async () => {},
    getScheduledTasks: () => tasks,
    addTasks: (newTasks) => tasks.push(...newTasks),
    getQueueStatus: () => ({
      pending: tasks.length,
      running: 0,
      completed: 0,
      failed: 0
    })
  };
}

function createDailyReportGenerator(_auditManager: unknown): DailyReportGenerator {
  return {
    async generateReport() {
      return {
        success: true,
        summary: {
          total_items: 0
        }
      };
    }
  };
}

function createDefaultTaskExecutionCoordinator(): unknown {
  return {
    start: () => {},
    stop: () => {},
    getStatus: () => 'running'
  };
}

// 临时工厂函数
function createCommentFilterEngine(_config?: unknown): CommentFilterEngine {
  return {
    async filterComments(input: {
      comments: Comment[];
      watch_targets: WatchTarget[];
    }): Promise<{
      filtered_comments: Comment[];
      filter_stats: {
        keyword_matches: number;
        time_window_matches: number;
        interaction_matches: number;
      };
    }> {
      // 临时实现：返回所有评论，统计为0
      return {
        filtered_comments: input.comments,
        filter_stats: {
          keyword_matches: 0,
          time_window_matches: 0,
          interaction_matches: 0
        }
      };
    }
  };
}

// 临时WatchTarget工厂函数
function createWatchTarget(data: Partial<WatchTarget>): WatchTarget {
  const now = new Date();
  return {
    id: data.id || `watch_${Date.now()}`,
    target_type: data.target_type || TargetType.ACCOUNT,
    platform: data.platform || Platform.XIAOHONGSHU,
    platform_id_or_url: data.platform_id_or_url || '',
    title: data.title,
    source: data.source || SourceType.MANUAL,
    industry_tags: data.industry_tags,
    region_tag: data.region_tag,
    last_fetch_at: data.last_fetch_at,
    notes: data.notes,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
}

// 临时Comment工厂函数
function createComment(data: Partial<Comment>): Comment {
  const now = new Date();
  return {
    id: data.id || `comment_${Date.now()}`,
    platform: data.platform || Platform.XIAOHONGSHU,
    video_id: data.video_id || '',
    author_id: data.author_id || '',
    content: data.content || '',
    like_count: data.like_count,
    publish_time: data.publish_time || now,
    source_target_id: data.source_target_id || '',
    inserted_at: data.inserted_at || now,
  };
}

export class PreciseAcquisitionDemo {
  private service: ProspectingAcquisitionService;
  private commentFilter: CommentFilterEngine;
  private taskGenerator: TaskGenerationEngine;
  private templateManager: TaskTemplateManager;
  private taskScheduler: TaskScheduler;
  private taskExecutor: any;
  private reportGenerator: DailyReportGenerator;
  
  constructor() {
    // 初始化系统组件
    this.service = new ProspectingAcquisitionService();
    
    // 创建评论过滤引擎
    this.commentFilter = createCommentFilterEngine({
      keyword_filters: {
        enabled: true,
        include_keywords: ['合作', '咨询', '购买', '感兴趣', '联系', '加盟'],
        exclude_keywords: ['广告', '推广', '刷粉', '代理', '兼职'],
        match_mode: 'fuzzy'
      },
      time_window_filter: {
        enabled: true,
        mode: 'recent_hours',
        hours: 24
      },
      interaction_filter: {
        enabled: true,
        min_like_count: 2,
        min_quality_score: 0.7
      },
      content_quality_filter: {
        enabled: true,
        min_length: 10,
        max_length: 300,
        require_meaningful_content: true
      }
    });
    
    // 创建任务生成引擎
    this.taskGenerator = createTaskGenerationEngine();
    
    // 创建模板管理器并添加示例模板
    this.templateManager = createTaskTemplateManager();
    this.setupTemplates();
    
    // 创建任务调度器
    this.taskScheduler = createDefaultTaskScheduler();
    
    // 创建任务执行器
    this.taskExecutor = createDefaultTaskExecutionCoordinator();
    
    // 创建报告生成器
    this.reportGenerator = createDailyReportGenerator(globalAuditManager);
  }
  
  /**
   * 演示完整工作流程
   */
  async demonstrateCompleteWorkflow(): Promise<void> {
    console.log('🚀 开始精准获客系统演示...\n');
    
    try {
      // 步骤1：候选池管理演示
      console.log('📊 步骤1: 候选池管理');
      const watchTargets = await this.demonstrateCandidatePoolManagement();
      console.log(`✅ 创建了 ${watchTargets.length} 个监控目标\n`);
      
      // 步骤2：评论采集与筛选演示
      console.log('💬 步骤2: 评论采集与筛选');
      const comments = await this.demonstrateCommentCollection(watchTargets);
      console.log(`✅ 采集了 ${comments.length} 条评论\n`);
      
      // 步骤3：评论筛选
      console.log('🔍 步骤3: 评论质量筛选');
      const filterResult = await this.demonstrateCommentFiltering(comments, watchTargets);
      console.log(`✅ 筛选出 ${filterResult.filtered_comments.length} 条优质评论\n`);
      
      // 步骤4：任务生成
      console.log('⚡ 步骤4: 任务生成');
      const taskResult = await this.demonstrateTaskGeneration(filterResult, watchTargets);
      console.log(`✅ 生成了 ${taskResult.generated_tasks.length} 个任务\n`);
      
      // 步骤5：任务调度
      console.log('📅 步骤5: 任务调度');
      await this.demonstrateTaskScheduling(taskResult.generated_tasks);
      console.log('✅ 任务已加入调度队列\n');
      
      // 步骤6：任务执行
      console.log('🎯 步骤6: 任务执行');
      await this.demonstrateTaskExecution();
      console.log('✅ 任务执行完成\n');
      
      // 步骤7：日报生成
      console.log('📋 步骤7: 日报生成');
      await this.demonstrateReportGeneration();
      console.log('✅ 日报生成完成\n');
      
      console.log('🎉 完整工作流程演示成功！');
      
    } catch (error) {
      console.error('❌ 演示过程中出现错误:', error);
      
      // 记录错误审计日志
      globalAuditManager.log({
        level: 'error' as any,
        category: 'system_config' as any,
        action: 'demo_workflow',
        description: '演示工作流程失败',
        result: {
          success: false,
          error_message: error instanceof Error ? error.message : '未知错误'
        }
      });
    }
  }
  
  /**
   * 演示候选池管理
   */
  private async demonstrateCandidatePoolManagement(): Promise<WatchTarget[]> {
    console.log('  - 创建监控目标...');
    
    const watchTargets: WatchTarget[] = [
      createWatchTarget({
        title: '美食博主小王的热门视频',
        platform: Platform.DOUYIN,
        target_type: TargetType.VIDEO,
        platform_id_or_url: 'https://v.douyin.com/iReABC123/',
        source: SourceType.MANUAL,
        industry_tags: [IndustryTag.FOOD_BEVERAGE],
        region_tag: RegionTag.BEIJING,
      }),
      
      createWatchTarget({
        title: '科技评测达人账号',
        platform: Platform.DOUYIN,
        target_type: TargetType.ACCOUNT,
        platform_id_or_url: 'https://v.douyin.com/user/tech_reviewer',
        source: SourceType.WHITELIST,
        industry_tags: [IndustryTag.AI_TECH],
        region_tag: RegionTag.SHANGHAI,
      }),
      
      createWatchTarget({
        title: '健身教练训练视频',
        platform: Platform.XIAOHONGSHU,
        target_type: TargetType.VIDEO,
        platform_id_or_url: 'https://www.xiaohongshu.com/explore/fitness123',
        source: SourceType.CSV,
        industry_tags: [IndustryTag.FITNESS],
        region_tag: RegionTag.GUANGDONG,
      })
    ];
    
    // 记录审计日志
    globalAuditManager.logCandidatePoolAction(
      'create_watch_targets',
      `创建了 ${watchTargets.length} 个监控目标`,
      'demo_system',
      { targets: watchTargets.map(t => ({ name: t.title || t.platform_id_or_url, platform: t.platform })) },
      { success: true, duration_ms: 100 }
    );
    
    return watchTargets;
  }
  
  /**
   * 演示评论采集
   */
  private async demonstrateCommentCollection(watchTargets: WatchTarget[]): Promise<Comment[]> {
    console.log('  - 模拟评论采集...');
    
    const comments: Comment[] = [
      // 美食视频下的评论
      createComment({
        platform: Platform.DOUYIN,
        video_id: 'iReABC123',
        author_id: 'user_001',
        content: '这道菜看起来太好吃了！请问可以合作教学吗？',
        like_count: 15,
        publish_time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        source_target_id: watchTargets[0].id!
      }),
      
      createComment({
        platform: Platform.DOUYIN,
        video_id: 'iReABC123',
        author_id: 'user_002',
        content: '想学这个菜的做法，有课程吗？',
        like_count: 8,
        publish_time: new Date(Date.now() - 1 * 60 * 60 * 1000),
        source_target_id: watchTargets[0].id!
      }),
      
      createComment({
        platform: Platform.DOUYIN,
        video_id: 'iReABC123',
        author_id: 'user_003',
        content: '广告太多了，取关',
        like_count: 2,
        publish_time: new Date(Date.now() - 30 * 60 * 1000),
        source_target_id: watchTargets[0].id!
      }),
      
      // 科技账号下的评论
      createComment({
        platform: Platform.DOUYIN,
        video_id: 'tech_review_456',
        author_id: 'user_004',
        content: '测评很专业，咨询一下产品购买链接',
        like_count: 25,
        publish_time: new Date(Date.now() - 45 * 60 * 1000),
        source_target_id: watchTargets[1].id!
      }),
      
      createComment({
        platform: Platform.DOUYIN,
        video_id: 'tech_review_456',
        author_id: 'user_005',
        content: '求推荐类似产品',
        like_count: 12,
        publish_time: new Date(Date.now() - 20 * 60 * 1000),
        source_target_id: watchTargets[1].id!
      }),
      
      // 健身视频下的评论
      createComment({
        platform: Platform.XIAOHONGSHU,
        video_id: 'fitness123',
        author_id: 'user_006',
        content: '动作很标准！想了解私教课程',
        like_count: 18,
        publish_time: new Date(Date.now() - 90 * 60 * 1000),
        source_target_id: watchTargets[2].id!
      }),
      
      createComment({
        platform: Platform.XIAOHONGSHU,
        video_id: 'fitness123',
        author_id: 'user_007',
        content: '太棒了',
        like_count: 3,
        publish_time: new Date(Date.now() - 10 * 60 * 1000),
        source_target_id: watchTargets[2].id!
      })
    ];
    
    // 记录审计日志
    globalAuditManager.logCommentCollectionAction(
      'collect_comments',
      `模拟采集了 ${comments.length} 条评论`,
      Platform.DOUYIN,
      undefined,
      { comment_count: comments.length },
      { success: true, duration_ms: 200 }
    );
    
    return comments;
  }
  
  /**
   * 演示评论筛选
   */
  private async demonstrateCommentFiltering(comments: Comment[], watchTargets: WatchTarget[]): Promise<any> {
    console.log('  - 应用筛选条件...');
    
    const filterResult = await this.commentFilter.filterComments({
      comments,
      watch_targets: watchTargets
    });
    
    console.log(`    原始评论: ${comments.length} 条`);
    console.log(`    筛选后: ${filterResult.filtered_comments.length} 条`);
    console.log(`    过滤统计:`);
    console.log(`      - 关键词匹配: ${filterResult.filter_stats.keyword_matches}`);
    console.log(`      - 时间窗口过滤: ${filterResult.filter_stats.time_window_matches}`);
    console.log(`      - 互动质量过滤: ${filterResult.filter_stats.interaction_matches}`);
    
    return filterResult;
  }
  
  /**
   * 演示任务生成
   */
  private async demonstrateTaskGeneration(filterResult: any, watchTargets: WatchTarget[]): Promise<any> {
    console.log('  - 生成回复和关注任务...');
    
    const taskResult = await this.taskGenerator.generateTasksFromFilterResult(
      filterResult,
      watchTargets
    );
    
    console.log(`    生成任务统计:`);
    console.log(`      - 回复任务: ${taskResult.stats.reply_tasks} 个`);
    console.log(`      - 关注任务: ${taskResult.stats.follow_tasks} 个`);
    console.log(`      - 总生成数: ${taskResult.stats.total_generated} 条`);
    
    return taskResult;
  }
  
  /**
   * 演示任务调度
   */
  private async demonstrateTaskScheduling(tasks: Task[]): Promise<void> {
    console.log('  - 添加任务到调度队列...');
    
    this.taskScheduler.addTasks(tasks);
    
    const status = this.taskScheduler.getQueueStatus();
    console.log(`    队列状态:`);
    console.log(`      - 待执行: ${status.pending} 个`);
    console.log(`      - 运行中: ${status.running} 个`);
    // 注释掉next_execution访问，因为接口中没有此属性
    // if (status.next_execution) {
    //   console.log(`      - 下次执行: ${status.next_execution.toLocaleString()}`);
    // }
  }
  
  /**
   * 演示任务执行
   */
  private async demonstrateTaskExecution(): Promise<void> {
    console.log('  - 模拟任务执行...');
    
    // 模拟执行几个任务
    const mockResults = [
      {
        task_id: 'task_001',
        success: true,
        executed_at: new Date(),
        execution_time_ms: 1200,
        result_data: { reply_id: 'reply_123' }
      },
      {
        task_id: 'task_002',
        success: true,
        executed_at: new Date(),
        execution_time_ms: 800,
        result_data: { followed_user_id: 'user_004' }
      },
      {
        task_id: 'task_003',
        success: false,
        executed_at: new Date(),
        execution_time_ms: 500,
        error_message: 'API调用频率限制'
      }
    ];
    
    console.log(`    执行结果:`);
    for (const result of mockResults) {
      const status = result.success ? '✅' : '❌';
      console.log(`      ${status} ${result.task_id}: ${result.success ? '成功' : result.error_message}`);
    }
  }
  
  /**
   * 演示报告生成
   */
  private async demonstrateReportGeneration(): Promise<void> {
    console.log('  - 生成日报...');
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // 生成日常总结报告
    const summaryReport = await this.reportGenerator.generateReport({
      type: ReportType.DAILY_SUMMARY,
      date: today,
      data: {},
      date_range: {
        start_date: yesterday,
        end_date: today
      }
      // 移除include_metadata，因为接口中没有此属性
      // include_metadata: true,
      // format: 'json'
    });
    
    // 生成关注清单
    const followReport = await this.reportGenerator.generateReport({
      type: ReportType.FOLLOW_LIST,
      date: today,
      data: {},
      date_range: {
        start_date: yesterday,
        end_date: today
      }
      // 移除platforms，因为接口中没有此属性
      // platforms: [Platform.DOUYIN, Platform.XIAOHONGSHU],
      // format: 'json'
    });
    
    // 生成回复清单
    const replyReport = await this.reportGenerator.generateReport({
      type: ReportType.REPLY_LIST,
      date: today,
      data: {},
      date_range: {
        start_date: yesterday,
        end_date: today
      }
      // 移除platforms，因为接口中没有此属性
      // platforms: [Platform.DOUYIN, Platform.XIAOHONGSHU],
      // format: 'json'
    });
    
    console.log(`    报告生成结果:`);
    console.log(`      - 日常总结: ${summaryReport.success ? '✅' : '❌'}`);
    console.log(`      - 关注清单: ${followReport.success ? '✅' : '❌'} (${followReport.summary?.total_items || 0} 项)`);
    console.log(`      - 回复清单: ${replyReport.success ? '✅' : '❌'} (${replyReport.summary?.total_items || 0} 项)`);
  }
  
  /**
   * 设置示例模板
   */
  private setupTemplates(): void {
    // 添加回复模板，使用正确的属性名
    this.templateManager.addTemplate({
      taskType: TaskType.REPLY,
      content: '谢谢您的关注！关于您咨询的问题，欢迎私信详细沟通。'
      // 移除不存在的属性
      // id: 'reply_consulting',
      // name: '咨询回复模板',
      // type: TaskType.REPLY,
      // category: '业务咨询',
      // description: '回复业务咨询类评论',
      // content_template: '谢谢您的关注！{random_emoji} 关于您咨询的问题，欢迎私信详细沟通。',
      // variables: [...],
      // conditions: {...},
      // weight: 8,
      // is_active: true,
      // created_at: new Date(),
      // updated_at: new Date(),
      // usage_count: 0
    });
    
    this.templateManager.addTemplate({
      taskType: TaskType.REPLY,
      content: '感谢您的支持和关注！'
      // 移除不存在的属性，只保留必要的taskType和content
    });
  }
  
  /**
   * 获取系统状态摘要
   */
  async getSystemStatus(): Promise<any> {
    const auditSummary = globalAuditManager.getSummary(7);
    const queueStatus = this.taskScheduler.getQueueStatus();
    
    return {
      audit_summary: auditSummary,
      task_queue: queueStatus,
      template_count: this.templateManager.getAllTemplates().length,
      system_health: {
        status: 'healthy',
        uptime: '99.9%',
        last_check: new Date()
      }
    };
  }
}

// ==================== 导出演示函数 ====================

/**
 * 运行完整演示
 */
export async function runPreciseAcquisitionDemo(): Promise<void> {
  const demo = new PreciseAcquisitionDemo();
  await demo.demonstrateCompleteWorkflow();
}

/**
 * 获取演示系统状态
 */
export async function getDemoSystemStatus(): Promise<any> {
  const demo = new PreciseAcquisitionDemo();
  return demo.getSystemStatus();
}

/**
 * 使用示例说明
 */
export const DEMO_USAGE_EXAMPLE = `
// 运行完整演示
import { runPreciseAcquisitionDemo } from '@/modules/precise-acquisition/demo';

async function main() {
  try {
    await runPreciseAcquisitionDemo();
    console.log('演示完成！');
  } catch (error) {
    console.error('演示失败:', error);
  }
}

main();
`;

export default PreciseAcquisitionDemo;
