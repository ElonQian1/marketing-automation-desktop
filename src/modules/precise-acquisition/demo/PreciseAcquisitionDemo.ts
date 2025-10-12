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
  PreciseAcquisitionService,
  Platform,
  TaskType,
  TaskStatus,
  TargetType,
  SourceType,
  IndustryTag,
  RegionTag,
  WatchTarget,
  Comment,
  Task
} from '../index';

import { globalAuditManager } from '../audit/AuditLogManager';
// import { CommentFilterEngine, createCommentFilterEngine } from '../comment-collection/engines/CommentFilterEngine';
import { TaskGenerationEngine, createTaskGenerationEngine } from '../task-generation/engines/TaskGenerationEngine';
import { TaskTemplateManager, createTaskTemplateManager } from '../task-generation/templates/TaskTemplateManager';
import { TaskScheduler, createDefaultTaskScheduler } from '../task-generation/state/TaskStateManager';
import { createDefaultTaskExecutionCoordinator } from '../task-execution/executors/TaskExecutors';
import { DailyReportGenerator, ReportType, createDailyReportGenerator } from '../reporting/DailyReportGenerator';

/**
 * 精准获客系统演示类
 */
export class PreciseAcquisitionDemo {
  private service: PreciseAcquisitionService;
  private commentFilter: CommentFilterEngine;
  private taskGenerator: TaskGenerationEngine;
  private templateManager: TaskTemplateManager;
  private taskScheduler: TaskScheduler;
  private taskExecutor: any;
  private reportGenerator: DailyReportGenerator;
  
  constructor() {
    // 初始化系统组件
    this.service = new PreciseAcquisitionService();
    
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
    this.taskGenerator = createTaskGenerationEngine({
      max_tasks_per_batch: 20,
      max_daily_tasks: 50,
      reply_task_config: {
        enabled: true,
        max_replies_per_video: 5,
        min_comment_quality_score: 0.7,
        reply_delay_range: { min_minutes: 15, max_minutes: 120 }
      },
      follow_task_config: {
        enabled: true,
        max_follows_per_day: 10,
        min_follower_count: 500,
        follow_delay_range: { min_minutes: 60, max_minutes: 300 }
      }
    }, this.commentFilter);
    
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
      WatchTarget.create({
        name: '美食博主小王的热门视频',
        platform: Platform.DOUYIN,
        targetType: TargetType.VIDEO,
        idOrUrl: 'https://v.douyin.com/iReABC123/',
        sourceType: SourceType.MANUAL,
        industryTags: [IndustryTag.FOOD_BEVERAGE],
        regionTags: [RegionTag.BEIJING],
        isActive: true
      }),
      
      WatchTarget.create({
        name: '科技评测达人账号',
        platform: Platform.DOUYIN,
        targetType: TargetType.ACCOUNT,
        idOrUrl: 'https://v.douyin.com/user/tech_reviewer',
        sourceType: SourceType.WHITELIST,
        industryTags: [IndustryTag.TECHNOLOGY_INTERNET],
        regionTags: [RegionTag.SHANGHAI],
        isActive: true
      }),
      
      WatchTarget.create({
        name: '健身教练训练视频',
        platform: Platform.XIAOHONGSHU,
        targetType: TargetType.VIDEO,
        idOrUrl: 'https://www.xiaohongshu.com/explore/fitness123',
        sourceType: SourceType.CSV,
        industryTags: [IndustryTag.HEALTH_FITNESS],
        regionTags: [RegionTag.GUANGDONG],
        isActive: true
      })
    ];
    
    // 记录审计日志
    globalAuditManager.logCandidatePoolAction(
      'create_watch_targets',
      `创建了 ${watchTargets.length} 个监控目标`,
      'demo_system',
      { targets: watchTargets.map(t => ({ name: t.name, platform: t.platform })) },
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
      Comment.create({
        platform: Platform.DOUYIN,
        videoId: 'iReABC123',
        authorId: 'user_001',
        content: '这道菜看起来太好吃了！请问可以合作教学吗？',
        likeCount: 15,
        publishTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        sourceTargetId: watchTargets[0].id!
      }),
      
      Comment.create({
        platform: Platform.DOUYIN,
        videoId: 'iReABC123',
        authorId: 'user_002',
        content: '想学这个菜的做法，有课程吗？',
        likeCount: 8,
        publishTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        sourceTargetId: watchTargets[0].id!
      }),
      
      Comment.create({
        platform: Platform.DOUYIN,
        videoId: 'iReABC123',
        authorId: 'user_003',
        content: '广告太多了，取关',
        likeCount: 2,
        publishTime: new Date(Date.now() - 30 * 60 * 1000),
        sourceTargetId: watchTargets[0].id!
      }),
      
      // 科技账号下的评论
      Comment.create({
        platform: Platform.DOUYIN,
        videoId: 'tech_review_456',
        authorId: 'user_004',
        content: '测评很专业，咨询一下产品购买链接',
        likeCount: 25,
        publishTime: new Date(Date.now() - 45 * 60 * 1000),
        sourceTargetId: watchTargets[1].id!
      }),
      
      Comment.create({
        platform: Platform.DOUYIN,
        videoId: 'tech_review_456',
        authorId: 'user_005',
        content: '求推荐类似产品',
        likeCount: 12,
        publishTime: new Date(Date.now() - 20 * 60 * 1000),
        sourceTargetId: watchTargets[1].id!
      }),
      
      // 健身视频下的评论
      Comment.create({
        platform: Platform.XIAOHONGSHU,
        videoId: 'fitness123',
        authorId: 'user_006',
        content: '动作很标准！想了解私教课程',
        likeCount: 18,
        publishTime: new Date(Date.now() - 90 * 60 * 1000),
        sourceTargetId: watchTargets[2].id!
      }),
      
      Comment.create({
        platform: Platform.XIAOHONGSHU,
        videoId: 'fitness123',
        authorId: 'user_007',
        content: '太棒了',
        likeCount: 3,
        publishTime: new Date(Date.now() - 10 * 60 * 1000),
        sourceTargetId: watchTargets[2].id!
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
    console.log(`      - 回复任务: ${taskResult.generation_stats.reply_tasks_generated} 个`);
    console.log(`      - 关注任务: ${taskResult.generation_stats.follow_tasks_generated} 个`);
    console.log(`      - 跳过评论: ${taskResult.generation_stats.skipped_count} 条`);
    
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
    if (status.next_execution) {
      console.log(`      - 下次执行: ${status.next_execution.toLocaleString()}`);
    }
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
      date_range: {
        start_date: yesterday,
        end_date: today
      },
      include_metadata: true,
      format: 'json'
    });
    
    // 生成关注清单
    const followReport = await this.reportGenerator.generateReport({
      type: ReportType.FOLLOW_LIST,
      date_range: {
        start_date: yesterday,
        end_date: today
      },
      platforms: [Platform.DOUYIN, Platform.XIAOHONGSHU],
      format: 'json'
    });
    
    // 生成回复清单
    const replyReport = await this.reportGenerator.generateReport({
      type: ReportType.REPLY_LIST,
      date_range: {
        start_date: yesterday,
        end_date: today
      },
      platforms: [Platform.DOUYIN, Platform.XIAOHONGSHU],
      format: 'json'
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
    // 添加回复模板
    this.templateManager.addTemplate({
      id: 'reply_consulting',
      name: '咨询回复模板',
      type: TaskType.REPLY,
      category: '业务咨询',
      description: '回复业务咨询类评论',
      content_template: '谢谢您的关注！{random_emoji} 关于您咨询的问题，欢迎私信详细沟通。',
      variables: [
        {
          name: 'random_emoji',
          display_name: '随机表情',
          description: '随机表情符号',
          type: 'custom'
        }
      ],
      conditions: {
        keywords: ['咨询', '合作', '购买', '联系'],
        platforms: [Platform.DOUYIN, Platform.XIAOHONGSHU]
      },
      weight: 8,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0
    });
    
    this.templateManager.addTemplate({
      id: 'reply_appreciation',
      name: '感谢回复模板',
      type: TaskType.REPLY,
      category: '友好回复',
      description: '对正面评论表示感谢',
      content_template: '感谢支持！{random_emoji} 您的鼓励是我们前进的动力。',
      variables: [
        {
          name: 'random_emoji',
          display_name: '随机表情',
          description: '随机表情符号',
          type: 'custom'
        }
      ],
      weight: 5,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0
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