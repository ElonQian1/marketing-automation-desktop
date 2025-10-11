/**
 * 统一日报服务 Hook
 * 
 * 为React组件提供统一的日报服务接口
 * 集成状态管理和错误处理
 */

import { useState, useCallback } from 'react';
import { message } from 'antd';
import { 
  unifiedDailyReportService,
  type UnifiedDailyReportConfig,
  type UnifiedDailyReportResult,
  type DailyReportStats,
  getDefaultDailyReportConfig
} from '../services/reporting/UnifiedDailyReportService';

// ==================== Hook 返回类型 ====================

export interface UseUnifiedDailyReportReturn {
  // 导出功能
  exportDailyReport: (config?: Partial<UnifiedDailyReportConfig>) => Promise<UnifiedDailyReportResult>;
  
  // 统计功能
  getDailyReportStats: (date: Date) => Promise<DailyReportStats>;
  
  // 模板功能
  generateCsvTemplate: (type: 'follow' | 'reply') => string;
  
  // 状态
  isExporting: boolean;
  isLoadingStats: boolean;
  lastExportResult: UnifiedDailyReportResult | null;
  lastStats: DailyReportStats | null;
  
  // 错误状态
  exportError: string | null;
  statsError: string | null;
  
  // 重置函数
  clearErrors: () => void;
  clearResults: () => void;
}

// ==================== Hook 实现 ====================

/**
 * 统一日报服务 Hook
 */
export function useUnifiedDailyReport(): UseUnifiedDailyReportReturn {
  // 导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportResult, setLastExportResult] = useState<UnifiedDailyReportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // 统计状态
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [lastStats, setLastStats] = useState<DailyReportStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  /**
   * 导出日报
   */
  const exportDailyReport = useCallback(async (
    partialConfig?: Partial<UnifiedDailyReportConfig>
  ): Promise<UnifiedDailyReportResult> => {
    if (isExporting) {
      const error = '已有导出任务在进行中，请稍后再试';
      message.warning(error);
      throw new Error(error);
    }

    setIsExporting(true);
    setExportError(null);
    
    try {
      const config: UnifiedDailyReportConfig = {
        ...getDefaultDailyReportConfig(),
        ...partialConfig
      };

      const result = await unifiedDailyReportService.exportDailyReport(config);
      
      setLastExportResult(result);
      
      if (!result.success) {
        setExportError(result.error || '导出失败');
        message.error(`日报导出失败: ${result.error || '未知错误'}`);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setExportError(errorMessage);
      message.error(`日报导出异常: ${errorMessage}`);
      
      const failedResult: UnifiedDailyReportResult = {
        success: false,
        follow_count: 0,
        reply_count: 0,
        error: errorMessage,
        export_time: new Date()
      };
      
      setLastExportResult(failedResult);
      return failedResult;
      
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  /**
   * 获取日报统计
   */
  const getDailyReportStats = useCallback(async (date: Date): Promise<DailyReportStats> => {
    if (isLoadingStats) {
      const error = '已有统计任务在进行中，请稍后再试';
      message.warning(error);
      throw new Error(error);
    }

    setIsLoadingStats(true);
    setStatsError(null);
    
    try {
      const stats = await unifiedDailyReportService.getDailyReportStats(date);
      setLastStats(stats);
      return stats;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatsError(errorMessage);
      message.error(`获取日报统计失败: ${errorMessage}`);
      throw error;
      
    } finally {
      setIsLoadingStats(false);
    }
  }, [isLoadingStats]);

  /**
   * 生成CSV模板
   */
  const generateCsvTemplate = useCallback((type: 'follow' | 'reply'): string => {
    try {
      return unifiedDailyReportService.generateCsvTemplate(type);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`生成CSV模板失败: ${errorMessage}`);
      return '';
    }
  }, []);

  /**
   * 清除错误状态
   */
  const clearErrors = useCallback(() => {
    setExportError(null);
    setStatsError(null);
  }, []);

  /**
   * 清除结果数据
   */
  const clearResults = useCallback(() => {
    setLastExportResult(null);
    setLastStats(null);
    clearErrors();
  }, [clearErrors]);

  return {
    // 导出功能
    exportDailyReport,
    
    // 统计功能
    getDailyReportStats,
    
    // 模板功能
    generateCsvTemplate,
    
    // 状态
    isExporting,
    isLoadingStats,
    lastExportResult,
    lastStats,
    
    // 错误状态
    exportError,
    statsError,
    
    // 重置函数
    clearErrors,
    clearResults
  };
}

// ==================== 预设配置工厂函数 ====================

/**
 * 生成今日关注清单导出配置
 */
export function getTodayFollowListConfig(): UnifiedDailyReportConfig {
  return {
    date: new Date(),
    include_follow_list: true,
    include_reply_list: false,
    format: 'csv',
    include_audit_trail: true,
    timezone: 'Asia/Shanghai'
  };
}

/**
 * 生成今日回复清单导出配置
 */
export function getTodayReplyListConfig(): UnifiedDailyReportConfig {
  return {
    date: new Date(),
    include_follow_list: false,
    include_reply_list: true,
    format: 'csv',
    include_audit_trail: true,
    timezone: 'Asia/Shanghai'
  };
}

/**
 * 生成完整日报导出配置
 */
export function getFullDailyReportConfig(date?: Date): UnifiedDailyReportConfig {
  return {
    date: date || new Date(),
    include_follow_list: true,
    include_reply_list: true,
    format: 'csv',
    include_audit_trail: true,
    timezone: 'Asia/Shanghai'
  };
}

// ==================== 类型导出 ====================

export type {
  UnifiedDailyReportConfig,
  UnifiedDailyReportResult,
  DailyReportStats
} from '../services/reporting/UnifiedDailyReportService';