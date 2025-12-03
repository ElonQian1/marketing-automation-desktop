// src/modules/precise-acquisition/reporting/services/prospecting-reporting-service.ts
// module: prospecting | layer: services | role: reporting-engine
// summary: 报告生成服务

/**
 * 日报生成服务
 * 
 * 实现自动生成日报功能：
 * 1. 任务执行统计：成功率、失败原因分析
 * 2. 性能分析：响应时间、资源使用情况
 * 3. 异常总结：错误汇总和趋势分析
 * 4. 合规检查：操作合规性评估
 * 5. 建议生成：基于数据的改进建议
 */

import { invoke } from '@tauri-apps/api/core';
import { Platform, TaskType, TaskStatus, ResultCode } from '../../shared/types/core';
import { AuditService, AuditLogLevel, AuditEventType } from '../../audit-system';
import { RateControlService } from '../../rate-control';

/**
 * 日报数据接口
 */
export interface DailyReport {
  id: string;
  date: Date;
  generated_at: Date;
  
  // 基础统计
  summary: {
    total_tasks: number;
    successful_tasks: number;
    failed_tasks: number;
    success_rate: number;
    avg_execution_time_ms: number;
    total_processing_time_ms: number;
  };
  
  // 平台统计
  platform_stats: Record<Platform, {
    tasks: number;
    success_rate: number;
    avg_response_time_ms: number;
    errors: number;
    top_errors: Array<{
      error_code: string;
      count: number;
      percentage: number;
    }>;
  }>;
  
  // 任务类型统计
  task_type_stats: Record<TaskType, {
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
    avg_duration_ms: number;
  }>;
  
  // 性能指标
  performance_metrics: {
    peak_memory_usage_mb: number;
    avg_memory_usage_mb: number;
    peak_cpu_usage_percent: number;
    avg_cpu_usage_percent: number;
    slow_operations_count: number;
    operations_over_5s: Array<{
      operation: string;
      count: number;
      avg_duration_ms: number;
    }>;
  };
  
  // 频控和去重统计
  rate_control_stats: {
    total_requests: number;
    blocked_by_rate_limit: number;
    blocked_by_deduplication: number;
    rate_limit_efficiency: number;
    dedup_efficiency: number;
  };
  
  // 错误分析
  error_analysis: {
    total_errors: number;
    error_rate: number;
    critical_errors: number;
    error_categories: Record<string, {
      count: number;
      percentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    top_error_messages: Array<{
      message: string;
      count: number;
      first_seen: Date;
      last_seen: Date;
    }>;
  };
  
  // 时间分布分析
  time_distribution: {
    hourly_stats: Array<{
      hour: number;
      tasks: number;
      success_rate: number;
      avg_response_time_ms: number;
    }>;
    peak_hours: number[];
    low_activity_hours: number[];
  };
  
  // 合规性检查
  compliance_check: {
    total_operations: number;
    compliant_operations: number;
    compliance_rate: number;
    violations: Array<{
      type: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  
  // 改进建议
  recommendations: Array<{
    category: 'performance' | 'reliability' | 'compliance' | 'efficiency';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    potential_impact: string;
    implementation_effort: 'low' | 'medium' | 'high';
  }>;
  
  // 趋势分析
  trends: {
    task_volume_trend: 'increasing' | 'decreasing' | 'stable';
    success_rate_trend: 'improving' | 'declining' | 'stable';
    performance_trend: 'improving' | 'declining' | 'stable';
    error_rate_trend: 'increasing' | 'decreasing' | 'stable';
  };
}

/**
 * 报告生成选项
 */
export interface ReportGenerationOptions {
  date?: Date;
  include_detailed_errors?: boolean;
  include_performance_details?: boolean;
  include_trends?: boolean;
  custom_metrics?: string[];
  export_format?: 'json' | 'html' | 'pdf';
}

/**
 * 周报数据接口
 */
export interface WeeklyReport {
  id: string;
  week_start: Date;
  week_end: Date;
  generated_at: Date;
  
  daily_summaries: Array<{
    date: Date;
    total_tasks: number;
    success_rate: number;
    avg_response_time_ms: number;
  }>;
  
  week_summary: DailyReport['summary'];
  week_trends: DailyReport['trends'];
  key_achievements: string[];
  major_issues: string[];
  week_recommendations: DailyReport['recommendations'];
}

/**
 * 日报生成服务
 */
export class ReportingService {
  
  private auditService: AuditService;
  private rateControlService: RateControlService;
  
  constructor() {
    this.auditService = new AuditService();
    this.rateControlService = new RateControlService();
  }
  
  /**
   * 生成日报
   */
  async generateDailyReport(
    date: Date = new Date(),
    options: ReportGenerationOptions = {}
  ): Promise<DailyReport> {
    
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);
    
    try {
      // 并行收集各模块数据
      const [
        basicStats,
        auditStats,
        rateControlStats,
        taskStats,
        performanceData,
        complianceData
      ] = await Promise.all([
        this.collectBasicStats(startTime, endTime),
        this.auditService.getStats(startTime, endTime),
        this.rateControlService.getStats(1), // 1天
        this.collectBasicStats(startTime, endTime), // 暂时用basicStats替代taskStats
        this.collectPerformanceMetrics(startTime, endTime),
        this.collectComplianceData(startTime, endTime)
      ]);
      
      // 生成报告
      const report: DailyReport = {
        id: `daily_report_${date.toISOString().split('T')[0]}_${Date.now()}`,
        date,
        generated_at: new Date(),
        
        summary: basicStats,
        
        platform_stats: await this.analyzePlatformStats(startTime, endTime),
        
        task_type_stats: await this.analyzeTaskTypeStats(startTime, endTime),
        
        performance_metrics: performanceData,
        
        rate_control_stats: {
          total_requests: rateControlStats.total_operations,
          blocked_by_rate_limit: rateControlStats.blocked_by_rate_limit,
          blocked_by_deduplication: rateControlStats.blocked_by_deduplication,
          rate_limit_efficiency: this.calculateRateLimitEfficiency(rateControlStats),
          dedup_efficiency: this.calculateDedupEfficiency(rateControlStats)
        },
        
        error_analysis: await this.analyzeErrors(startTime, endTime, auditStats),
        
        time_distribution: await this.analyzeTimeDistribution(startTime, endTime),
        
        compliance_check: complianceData,
        
        recommendations: await this.generateRecommendations(basicStats, auditStats, performanceData),
        
        trends: await this.analyzeTrends(date)
      };
      
      // 保存报告
      await this.saveReport(report);
      
      // 记录生成事件
      await this.auditService.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.DATA_EXPORT,
        operation: 'generate_daily_report',
        message: `生成日报: ${date.toDateString()}`,
        details: {
          report_id: report.id,
          date: date.toISOString(),
          total_tasks: report.summary.total_tasks,
          success_rate: report.summary.success_rate
        }
      });
      
      return report;
      
    } catch (error) {
      await this.auditService.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.DATA_EXPORT,
        operation: 'generate_daily_report',
        message: '生成日报失败',
        error_message: error instanceof Error ? error.message : String(error),
        details: { date: date.toISOString() }
      });
      
      throw error;
    }
  }
  
  /**
   * 收集基础统计数据
   */
  private async collectBasicStats(startTime: Date, endTime: Date): Promise<DailyReport['summary']> {
    try {
      const stats = await invoke('plugin:prospecting|get_daily_task_stats', {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }) as {
        total_tasks: number;
        successful_tasks: number;
        failed_tasks: number;
        avg_execution_time_ms: number;
        total_processing_time_ms: number;
      };
      
      return {
        ...stats,
        success_rate: stats.total_tasks > 0 ? (stats.successful_tasks / stats.total_tasks) * 100 : 0
      };
      
    } catch (error) {
      console.error('收集基础统计失败:', error);
      return {
        total_tasks: 0,
        successful_tasks: 0,
        failed_tasks: 0,
        success_rate: 0,
        avg_execution_time_ms: 0,
        total_processing_time_ms: 0
      };
    }
  }
  
  /**
   * 分析平台统计
   */
  private async analyzePlatformStats(startTime: Date, endTime: Date): Promise<DailyReport['platform_stats']> {
    const platformStats: DailyReport['platform_stats'] = {} as any;
    
    const platforms = [Platform.DOUYIN, Platform.OCEANENGINE, Platform.PUBLIC];
    
    for (const platform of platforms) {
      try {
        const stats = await invoke('plugin:prospecting|get_platform_daily_stats', {
          platform,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        }) as {
          tasks: number;
          successful_tasks: number;
          avg_response_time_ms: number;
          errors: number;
          top_errors: Array<{ error_code: string; count: number }>;
        };
        
        platformStats[platform] = {
          tasks: stats.tasks,
          success_rate: stats.tasks > 0 ? (stats.successful_tasks / stats.tasks) * 100 : 0,
          avg_response_time_ms: stats.avg_response_time_ms,
          errors: stats.errors,
          top_errors: stats.top_errors.map(error => ({
            ...error,
            percentage: stats.errors > 0 ? (error.count / stats.errors) * 100 : 0
          }))
        };
        
      } catch (error) {
        console.error(`分析平台${platform}统计失败:`, error);
        platformStats[platform] = {
          tasks: 0,
          success_rate: 0,
          avg_response_time_ms: 0,
          errors: 0,
          top_errors: []
        };
      }
    }
    
    return platformStats;
  }
  
  /**
   * 分析任务类型统计
   */
  private async analyzeTaskTypeStats(startTime: Date, endTime: Date): Promise<DailyReport['task_type_stats']> {
    const taskTypeStats: DailyReport['task_type_stats'] = {} as any;
    
    const taskTypes = [TaskType.REPLY, TaskType.FOLLOW];
    
    for (const taskType of taskTypes) {
      try {
        const stats = await invoke('plugin:prospecting|get_task_type_daily_stats', {
          task_type: taskType,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        }) as {
          total: number;
          successful: number;
          failed: number;
          avg_duration_ms: number;
        };
        
        taskTypeStats[taskType] = {
          ...stats,
          success_rate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
        };
        
      } catch (error) {
        console.error(`分析任务类型${taskType}统计失败:`, error);
        taskTypeStats[taskType] = {
          total: 0,
          successful: 0,
          failed: 0,
          success_rate: 0,
          avg_duration_ms: 0
        };
      }
    }
    
    return taskTypeStats;
  }
  
  /**
   * 收集性能指标
   */
  private async collectPerformanceMetrics(startTime: Date, endTime: Date): Promise<DailyReport['performance_metrics']> {
    try {
      const metrics = await invoke('plugin:prospecting|get_daily_performance_metrics', {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }) as DailyReport['performance_metrics'];
      
      return metrics;
      
    } catch (error) {
      console.error('收集性能指标失败:', error);
      return {
        peak_memory_usage_mb: 0,
        avg_memory_usage_mb: 0,
        peak_cpu_usage_percent: 0,
        avg_cpu_usage_percent: 0,
        slow_operations_count: 0,
        operations_over_5s: []
      };
    }
  }
  
  /**
   * 收集合规数据
   */
  private async collectComplianceData(startTime: Date, endTime: Date): Promise<DailyReport['compliance_check']> {
    try {
      const complianceData = await invoke('plugin:prospecting|get_daily_compliance_stats', {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }) as DailyReport['compliance_check'];
      
      return complianceData;
      
    } catch (error) {
      console.error('收集合规数据失败:', error);
      return {
        total_operations: 0,
        compliant_operations: 0,
        compliance_rate: 0,
        violations: []
      };
    }
  }
  
  /**
   * 分析错误
   */
  private async analyzeErrors(startTime: Date, endTime: Date, auditStats: any): Promise<DailyReport['error_analysis']> {
    try {
      const errorAnalysis = await invoke('plugin:prospecting|analyze_daily_errors', {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }) as DailyReport['error_analysis'];
      
      return errorAnalysis;
      
    } catch (error) {
      console.error('分析错误失败:', error);
      return {
        total_errors: 0,
        error_rate: 0,
        critical_errors: 0,
        error_categories: {},
        top_error_messages: []
      };
    }
  }
  
  /**
   * 分析时间分布
   */
  private async analyzeTimeDistribution(startTime: Date, endTime: Date): Promise<DailyReport['time_distribution']> {
    try {
      const timeDistribution = await invoke('plugin:prospecting|analyze_time_distribution', {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }) as DailyReport['time_distribution'];
      
      return timeDistribution;
      
    } catch (error) {
      console.error('分析时间分布失败:', error);
      return {
        hourly_stats: [],
        peak_hours: [],
        low_activity_hours: []
      };
    }
  }
  
  /**
   * 分析趋势
   */
  private async analyzeTrends(currentDate: Date): Promise<DailyReport['trends']> {
    try {
      // 获取过去7天的数据进行趋势分析
      const endDate = new Date(currentDate);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 7);
      
      const trends = await invoke('plugin:prospecting|analyze_trends', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }) as DailyReport['trends'];
      
      return trends;
      
    } catch (error) {
      console.error('分析趋势失败:', error);
      return {
        task_volume_trend: 'stable',
        success_rate_trend: 'stable',
        performance_trend: 'stable',
        error_rate_trend: 'stable'
      };
    }
  }
  
  /**
   * 生成改进建议
   */
  private async generateRecommendations(
    basicStats: DailyReport['summary'],
    auditStats: any,
    performanceData: DailyReport['performance_metrics']
  ): Promise<DailyReport['recommendations']> {
    
    const recommendations: DailyReport['recommendations'] = [];
    
    // 成功率建议
    if (basicStats.success_rate < 90) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        title: '提升任务成功率',
        description: `当前成功率${basicStats.success_rate.toFixed(1)}%，建议分析失败原因并优化执行逻辑`,
        potential_impact: '提升用户体验和业务效果',
        implementation_effort: 'medium'
      });
    }
    
    // 性能建议
    if (basicStats.avg_execution_time_ms > 5000) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: '优化执行性能',
        description: `平均执行时间${basicStats.avg_execution_time_ms}ms，建议优化处理逻辑`,
        potential_impact: '提升系统响应速度',
        implementation_effort: 'medium'
      });
    }
    
    // 内存使用建议
    if (performanceData.peak_memory_usage_mb > 1000) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: '优化内存使用',
        description: `峰值内存使用${performanceData.peak_memory_usage_mb}MB，建议优化内存管理`,
        potential_impact: '降低系统资源消耗',
        implementation_effort: 'high'
      });
    }
    
    // 错误率建议
    const errorRate = auditStats.error_rate || 0;
    if (errorRate > 5) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        title: '降低错误率',
        description: `当前错误率${errorRate.toFixed(1)}%，建议加强错误处理和监控`,
        potential_impact: '提升系统稳定性',
        implementation_effort: 'medium'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 计算频控效率
   */
  private calculateRateLimitEfficiency(stats: any): number {
    if (stats.total_operations === 0) return 100;
    return Math.max(0, 100 - (stats.blocked_by_rate_limit / stats.total_operations) * 100);
  }
  
  /**
   * 计算去重效率
   */
  private calculateDedupEfficiency(stats: any): number {
    if (stats.total_operations === 0) return 100;
    return (stats.blocked_by_deduplication / stats.total_operations) * 100;
  }
  
  /**
   * 保存报告
   */
  private async saveReport(report: DailyReport): Promise<void> {
    try {
      await invoke('plugin:prospecting|save_daily_report', {
        report: {
          ...report,
          date: report.date.toISOString(),
          generated_at: report.generated_at.toISOString()
        }
      });
    } catch (error) {
      console.error('保存报告失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取历史报告
   */
  async getHistoricalReports(
    startDate: Date,
    endDate: Date,
    limit: number = 30
  ): Promise<DailyReport[]> {
    
    try {
      const reports = await invoke('plugin:prospecting|get_historical_reports', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit
      }) as any[];
      
      return reports.map(report => ({
        ...report,
        date: new Date(report.date),
        generated_at: new Date(report.generated_at)
      }));
      
    } catch (error) {
      console.error('获取历史报告失败:', error);
      return [];
    }
  }
  
  /**
   * 生成周报
   */
  async generateWeeklyReport(weekStart: Date): Promise<WeeklyReport> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    try {
      // 获取这一周的所有日报
      const dailyReports = await this.getHistoricalReports(weekStart, weekEnd);
      
      const weeklyReport: WeeklyReport = {
        id: `weekly_report_${weekStart.toISOString().split('T')[0]}_${Date.now()}`,
        week_start: weekStart,
        week_end: weekEnd,
        generated_at: new Date(),
        
        daily_summaries: dailyReports.map(report => ({
          date: report.date,
          total_tasks: report.summary.total_tasks,
          success_rate: report.summary.success_rate,
          avg_response_time_ms: report.summary.avg_execution_time_ms
        })),
        
        week_summary: this.calculateWeekSummary(dailyReports),
        week_trends: this.calculateWeekTrends(dailyReports),
        key_achievements: this.identifyKeyAchievements(dailyReports),
        major_issues: this.identifyMajorIssues(dailyReports),
        week_recommendations: this.generateWeeklyRecommendations(dailyReports)
      };
      
      // 保存周报
      await invoke('plugin:prospecting|save_weekly_report', {
        report: {
          ...weeklyReport,
          week_start: weeklyReport.week_start.toISOString(),
          week_end: weeklyReport.week_end.toISOString(),
          generated_at: weeklyReport.generated_at.toISOString()
        }
      });
      
      return weeklyReport;
      
    } catch (error) {
      console.error('生成周报失败:', error);
      throw error;
    }
  }
  
  /**
   * 计算周汇总
   */
  private calculateWeekSummary(dailyReports: DailyReport[]): DailyReport['summary'] {
    if (dailyReports.length === 0) {
      return {
        total_tasks: 0,
        successful_tasks: 0,
        failed_tasks: 0,
        success_rate: 0,
        avg_execution_time_ms: 0,
        total_processing_time_ms: 0
      };
    }
    
    const totalTasks = dailyReports.reduce((sum, report) => sum + report.summary.total_tasks, 0);
    const successfulTasks = dailyReports.reduce((sum, report) => sum + report.summary.successful_tasks, 0);
    const failedTasks = dailyReports.reduce((sum, report) => sum + report.summary.failed_tasks, 0);
    const totalProcessingTime = dailyReports.reduce((sum, report) => sum + report.summary.total_processing_time_ms, 0);
    
    const avgExecutionTime = dailyReports.reduce((sum, report) => 
      sum + (report.summary.avg_execution_time_ms * report.summary.total_tasks), 0
    ) / Math.max(totalTasks, 1);
    
    return {
      total_tasks: totalTasks,
      successful_tasks: successfulTasks,
      failed_tasks: failedTasks,
      success_rate: totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0,
      avg_execution_time_ms: avgExecutionTime,
      total_processing_time_ms: totalProcessingTime
    };
  }
  
  /**
   * 计算周趋势
   */
  private calculateWeekTrends(dailyReports: DailyReport[]): DailyReport['trends'] {
    if (dailyReports.length < 2) {
      return {
        task_volume_trend: 'stable',
        success_rate_trend: 'stable',
        performance_trend: 'stable',
        error_rate_trend: 'stable'
      };
    }
    
    // 简化的趋势计算
    const firstHalf = dailyReports.slice(0, Math.floor(dailyReports.length / 2));
    const secondHalf = dailyReports.slice(Math.floor(dailyReports.length / 2));
    
    const firstHalfAvgTasks = firstHalf.reduce((sum, r) => sum + r.summary.total_tasks, 0) / firstHalf.length;
    const secondHalfAvgTasks = secondHalf.reduce((sum, r) => sum + r.summary.total_tasks, 0) / secondHalf.length;
    
    const firstHalfAvgSuccessRate = firstHalf.reduce((sum, r) => sum + r.summary.success_rate, 0) / firstHalf.length;
    const secondHalfAvgSuccessRate = secondHalf.reduce((sum, r) => sum + r.summary.success_rate, 0) / secondHalf.length;
    
    return {
      task_volume_trend: secondHalfAvgTasks > firstHalfAvgTasks * 1.1 ? 'increasing' : 
                        secondHalfAvgTasks < firstHalfAvgTasks * 0.9 ? 'decreasing' : 'stable',
      success_rate_trend: secondHalfAvgSuccessRate > firstHalfAvgSuccessRate + 5 ? 'improving' :
                         secondHalfAvgSuccessRate < firstHalfAvgSuccessRate - 5 ? 'declining' : 'stable',
      performance_trend: 'stable', // 简化处理
      error_rate_trend: 'stable'   // 简化处理
    };
  }
  
  /**
   * 识别关键成就
   */
  private identifyKeyAchievements(dailyReports: DailyReport[]): string[] {
    const achievements: string[] = [];
    
    const maxSuccessRate = Math.max(...dailyReports.map(r => r.summary.success_rate));
    const maxDailyTasks = Math.max(...dailyReports.map(r => r.summary.total_tasks));
    
    if (maxSuccessRate >= 95) {
      achievements.push(`达到${maxSuccessRate.toFixed(1)}%的最高成功率`);
    }
    
    if (maxDailyTasks >= 1000) {
      achievements.push(`单日处理任务数达到${maxDailyTasks}个`);
    }
    
    return achievements;
  }
  
  /**
   * 识别主要问题
   */
  private identifyMajorIssues(dailyReports: DailyReport[]): string[] {
    const issues: string[] = [];
    
    const minSuccessRate = Math.min(...dailyReports.map(r => r.summary.success_rate));
    const avgErrorRate = dailyReports.reduce((sum, r) => sum + r.error_analysis.error_rate, 0) / dailyReports.length;
    
    if (minSuccessRate < 80) {
      issues.push(`成功率最低降至${minSuccessRate.toFixed(1)}%`);
    }
    
    if (avgErrorRate > 10) {
      issues.push(`平均错误率达到${avgErrorRate.toFixed(1)}%`);
    }
    
    return issues;
  }
  
  /**
   * 生成周度建议
   */
  private generateWeeklyRecommendations(dailyReports: DailyReport[]): DailyReport['recommendations'] {
    // 合并和去重日报中的建议
    const allRecommendations = dailyReports.flatMap(r => r.recommendations);
    const uniqueRecommendations = allRecommendations.filter((rec, index, arr) => 
      arr.findIndex(r => r.title === rec.title) === index
    );
    
    // 按优先级排序并返回前5个
    return uniqueRecommendations
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  }
  
  /**
   * 导出报告
   */
  async exportReport(
    reportId: string,
    format: 'json' | 'html' | 'pdf' = 'json'
  ): Promise<string> {
    
    try {
      const filePath = await invoke('plugin:prospecting|export_report', {
        report_id: reportId,
        format
      }) as string;
      
      await this.auditService.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.DATA_EXPORT,
        operation: 'export_report',
        message: `导出报告: ${reportId}`,
        details: { report_id: reportId, format }
      });
      
      return filePath;
      
    } catch (error) {
      await this.auditService.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.DATA_EXPORT,
        operation: 'export_report',
        message: '导出报告失败',
        error_message: error instanceof Error ? error.message : String(error),
        details: { report_id: reportId, format }
      });
      
      throw error;
    }
  }
  
  /**
   * 删除过期报告
   */
  async cleanupExpiredReports(retentionDays: number = 90): Promise<number> {
    try {
      const deletedCount = await invoke('plugin:prospecting|cleanup_expired_reports', {
        retention_days: retentionDays
      }) as number;
      
      await this.auditService.logEvent({
        level: AuditLogLevel.INFO,
        event_type: AuditEventType.DATA_RETENTION_CLEANUP,
        operation: 'cleanup_expired_reports',
        message: `清理过期报告完成，删除 ${deletedCount} 个报告`,
        details: { retention_days: retentionDays, deleted_count: deletedCount }
      });
      
      return deletedCount;
      
    } catch (error) {
      await this.auditService.logEvent({
        level: AuditLogLevel.ERROR,
        event_type: AuditEventType.DATA_RETENTION_CLEANUP,
        operation: 'cleanup_expired_reports',
        message: '清理过期报告失败',
        error_message: error instanceof Error ? error.message : String(error),
        details: { retention_days: retentionDays }
      });
      
      throw error;
    }
  }
}