// src/hooks/usePreciseAcquisition.ts
// module: shared | layer: application | role: 状态钩子
// summary: React状态管理和业务逻辑封装

/**
 * 精准获客统一 Hook
 * 
 * 提供精准获客系统的统一数据访问和操作接口
 * 整合候选池、评论、任务等所有功能模块
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { prospectingAcquisitionService } from '../application/services/prospecting-acquisition-service';
import type {
  WatchTargetPayload,
  WatchTargetRow,
  CommentRow,
  TaskRow,
  ReplyTemplateRow,
  TaskGenerationConfig,
  PreciseAcquisitionStats,
  TaskStatusUpdate
} from '../types/precise-acquisition';
import type {
  WatchTargetQueryParams,
  ImportValidationResult
} from '../modules/precise-acquisition/shared/types/core';
import {
  Platform,
  TargetType,
  TaskStatus,
  TaskType,
  RegionTag
} from '../constants/precise-acquisition-enums';

export interface UsePreciseAcquisitionOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UsePreciseAcquisitionReturn {
  // 数据状态
  watchTargets: WatchTargetRow[];
  comments: CommentRow[];
  tasks: TaskRow[];
  templates: ReplyTemplateRow[];
  stats: PreciseAcquisitionStats | null;
  
  // 加载状态
  loading: {
    watchTargets: boolean;
    comments: boolean;
    tasks: boolean;
    templates: boolean;
    stats: boolean;
  };
  
  // 候选池管理
  getWatchTargets: (params?: WatchTargetQueryParams) => Promise<void>;
  addWatchTarget: (payload: WatchTargetPayload) => Promise<void>;
  updateWatchTarget: (id: string, payload: Partial<WatchTargetPayload>) => Promise<void>;
  deleteWatchTarget: (id: string) => Promise<void>;
  bulkImportWatchTargets: (payloads: WatchTargetPayload[]) => Promise<{
    success_count: number;
    failed_count: number;
    errors: Array<{ index: number; error: string }>;
  }>;
  validateCsvImport: (csvData: any[]) => ImportValidationResult;
  exportToCsv: (filters?: WatchTargetQueryParams) => Promise<string>;
  
  // 评论管理
  getComments: (params?: {
    limit?: number;
    offset?: number;
    platform?: Platform;
    source_target_id?: string;
    region?: RegionTag;
  }) => Promise<void>;
  addComment: (params: {
    platform: Platform;
    video_id: string;
    author_id: string;
    content: string;
    like_count?: number;
    publish_time: Date;
    region?: RegionTag;
    source_target_id: string;
  }) => Promise<void>;
  filterComments: (params: {
    keywords?: string[];
    exclude_keywords?: string[];
    regions?: RegionTag[];
    min_like_count?: number;
    time_window_hours?: number;
  }) => Promise<CommentRow[]>;
  
  // 任务管理
  getTasks: (params?: {
    limit?: number;
    offset?: number;
    status?: TaskStatus;
    task_type?: TaskType;
    assign_account_id?: string;
  }) => Promise<void>;
  generateTasks: (config: TaskGenerationConfig) => Promise<{
    generated_count: number;
    tasks: TaskRow[];
  }>;
  updateTaskStatus: (update: TaskStatusUpdate) => Promise<void>;
  
  // 模板管理
  getReplyTemplates: () => Promise<void>;
  addReplyTemplate: (payload: {
    title: string;
    content: string;
    category?: string;
    industry_tags?: string[];
    is_enabled?: boolean;
  }) => Promise<void>;
  
  // 统计和报告
  refreshStats: () => Promise<void>;
  generateDailyReport: (date?: Date) => Promise<any>;
  
  // 工具方法
  refreshAll: () => Promise<void>;
  clearError: () => void;
  
  // 错误状态
  error: string | null;
}

/**
 * 精准获客统一 Hook
 */
export const usePreciseAcquisition = (
  options: UsePreciseAcquisitionOptions = {}
): UsePreciseAcquisitionReturn => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  // 数据状态
  const [watchTargets, setWatchTargets] = useState<WatchTargetRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplateRow[]>([]);
  const [stats, setStats] = useState<PreciseAcquisitionStats | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState({
    watchTargets: false,
    comments: false,
    tasks: false,
    templates: false,
    stats: false
  });
  
  // 错误状态
  const [error, setError] = useState<string | null>(null);

  // 初始化服务
  useEffect(() => {
    const initService = async () => {
      try {
        await prospectingAcquisitionService.initialize();
        console.log('精准获客服务初始化完成');
      } catch (err) {
        console.error('精准获客服务初始化失败:', err);
        setError('服务初始化失败');
      }
    };
    
    initService();
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshAll();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // 候选池管理方法
  const getWatchTargets = useCallback(async (params?: WatchTargetQueryParams) => {
    setLoading(prev => ({ ...prev, watchTargets: true }));
    try {
      const targets = await prospectingAcquisitionService.getWatchTargets(params);
      // 简化转换，避免类型问题
      const rows = targets.map(target => ({
        id: parseInt(target.id),
        dedup_key: `${target.platform}_${target.platform_id_or_url}`,
        target_type: target.target_type as any,
        platform: target.platform as any,
        id_or_url: target.platform_id_or_url,
        title: target.title || '',
        source: target.source as any,
        industry_tags: target.industry_tags?.join(';') || '',
        region: target.region_tag as any,
        notes: target.notes || '',
        created_at: target.created_at.toISOString(),
        updated_at: target.updated_at.toISOString()
      })) as WatchTargetRow[];
      setWatchTargets(rows);
      setError(null);
    } catch (err) {
      console.error('获取候选池失败:', err);
      setError('获取候选池失败');
      message.error('获取候选池失败');
    } finally {
      setLoading(prev => ({ ...prev, watchTargets: false }));
    }
  }, []);

  const addWatchTarget = useCallback(async (payload: WatchTargetPayload) => {
    try {
      await prospectingAcquisitionService.addWatchTarget(payload);
      message.success('添加候选目标成功');
      await getWatchTargets(); // 刷新列表
    } catch (err) {
      console.error('添加候选目标失败:', err);
      message.error('添加候选目标失败');
      throw err;
    }
  }, [getWatchTargets]);

  const updateWatchTarget = useCallback(async (id: string, payload: Partial<WatchTargetPayload>) => {
    try {
      await prospectingAcquisitionService.updateWatchTarget(id, payload);
      message.success('更新候选目标成功');
      await getWatchTargets(); // 刷新列表
    } catch (err) {
      console.error('更新候选目标失败:', err);
      message.error('更新候选目标失败');
      throw err;
    }
  }, [getWatchTargets]);

  const deleteWatchTarget = useCallback(async (id: string) => {
    try {
      await prospectingAcquisitionService.deleteWatchTarget(id);
      message.success('删除候选目标成功');
      await getWatchTargets(); // 刷新列表
    } catch (err) {
      console.error('删除候选目标失败:', err);
      message.error('删除候选目标失败');
      throw err;
    }
  }, [getWatchTargets]);

  const bulkImportWatchTargets = useCallback(async (payloads: WatchTargetPayload[]) => {
    try {
      const result = await prospectingAcquisitionService.bulkImportWatchTargets(payloads);
      
      if (result.success_count > 0) {
        message.success(`成功导入 ${result.success_count} 个目标`);
      }
      if (result.failed_count > 0) {
        message.warning(`${result.failed_count} 个目标导入失败`);
      }
      
      await getWatchTargets(); // 刷新列表
      return result;
    } catch (err) {
      console.error('批量导入失败:', err);
      message.error('批量导入失败');
      throw err;
    }
  }, [getWatchTargets]);

  const validateCsvImport = useCallback((csvData: any[]): ImportValidationResult => {
    return prospectingAcquisitionService.validateCsvImport(csvData);
  }, []);

  const exportToCsv = useCallback(async (filters?: WatchTargetQueryParams): Promise<string> => {
    try {
      return await prospectingAcquisitionService.exportToCsv(filters);
    } catch (err) {
      console.error('导出CSV失败:', err);
      message.error('导出CSV失败');
      throw err;
    }
  }, []);

  // 评论管理方法
  const getComments = useCallback(async (params?: {
    limit?: number;
    offset?: number;
    platform?: Platform;
    source_target_id?: string;
    region?: RegionTag;
  }) => {
    setLoading(prev => ({ ...prev, comments: true }));
    try {
      const commentsList = await prospectingAcquisitionService.getComments(params);
      setComments(commentsList);
      setError(null);
    } catch (err) {
      console.error('获取评论失败:', err);
      setError('获取评论失败');
      message.error('获取评论失败');
    } finally {
      setLoading(prev => ({ ...prev, comments: false }));
    }
  }, []);

  const addComment = useCallback(async (params: {
    platform: Platform;
    video_id: string;
    author_id: string;
    content: string;
    like_count?: number;
    publish_time: Date;
    region?: RegionTag;
    source_target_id: string;
  }) => {
    try {
      await prospectingAcquisitionService.addComment(params);
      message.success('添加评论成功');
      await getComments(); // 刷新列表
    } catch (err) {
      console.error('添加评论失败:', err);
      message.error('添加评论失败');
      throw err;
    }
  }, [getComments]);

  const filterComments = useCallback(async (params: {
    keywords?: string[];
    exclude_keywords?: string[];
    regions?: RegionTag[];
    min_like_count?: number;
    time_window_hours?: number;
  }): Promise<CommentRow[]> => {
    try {
      return await prospectingAcquisitionService.filterComments(params);
    } catch (err) {
      console.error('筛选评论失败:', err);
      message.error('筛选评论失败');
      throw err;
    }
  }, []);

  // 任务管理方法
  const getTasks = useCallback(async (params?: {
    limit?: number;
    offset?: number;
    status?: TaskStatus;
    task_type?: TaskType;
    assign_account_id?: string;
  }) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      const tasksList = await prospectingAcquisitionService.getTasks(params);
      setTasks(tasksList);
      setError(null);
    } catch (err) {
      console.error('获取任务失败:', err);
      setError('获取任务失败');
      message.error('获取任务失败');
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  }, []);

  const generateTasks = useCallback(async (config: TaskGenerationConfig) => {
    try {
      const result = await prospectingAcquisitionService.generateTasks(config);
      message.success(`成功生成 ${result.generated_count} 个任务`);
      await getTasks(); // 刷新任务列表
      return result;
    } catch (err) {
      console.error('生成任务失败:', err);
      message.error('生成任务失败');
      throw err;
    }
  }, [getTasks]);

  const updateTaskStatus = useCallback(async (update: TaskStatusUpdate) => {
    try {
      await prospectingAcquisitionService.updateTaskStatus(update);
      message.success('更新任务状态成功');
      await getTasks(); // 刷新任务列表
    } catch (err) {
      console.error('更新任务状态失败:', err);
      message.error('更新任务状态失败');
      throw err;
    }
  }, [getTasks]);

  // 模板管理方法
  const getReplyTemplates = useCallback(async () => {
    setLoading(prev => ({ ...prev, templates: true }));
    try {
      const templatesList = await prospectingAcquisitionService.getReplyTemplates();
      setTemplates(templatesList);
      setError(null);
    } catch (err) {
      console.error('获取模板失败:', err);
      setError('获取模板失败');
      message.error('获取模板失败');
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  }, []);

  const addReplyTemplate = useCallback(async (payload: {
    title: string;
    content: string;
    category?: string;
    industry_tags?: string[];
    is_enabled?: boolean;
  }) => {
    try {
      await prospectingAcquisitionService.addReplyTemplate(payload);
      message.success('添加模板成功');
      await getReplyTemplates(); // 刷新列表
    } catch (err) {
      console.error('添加模板失败:', err);
      message.error('添加模板失败');
      throw err;
    }
  }, [getReplyTemplates]);

  // 统计和报告方法
  const refreshStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const statsData = await prospectingAcquisitionService.getStats();
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('获取统计数据失败:', err);
      setError('获取统计数据失败');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  const generateDailyReport = useCallback(async (date?: Date) => {
    try {
      return await prospectingAcquisitionService.generateDailyReport(date);
    } catch (err) {
      console.error('生成日报失败:', err);
      message.error('生成日报失败');
      throw err;
    }
  }, []);

  // 工具方法
  const refreshAll = useCallback(async () => {
    await Promise.all([
      getWatchTargets(),
      getComments(),
      getTasks(),
      getReplyTemplates(),
      refreshStats()
    ]);
  }, [getWatchTargets, getComments, getTasks, getReplyTemplates, refreshStats]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 数据状态
    watchTargets,
    comments,
    tasks,
    templates,
    stats,
    
    // 加载状态
    loading,
    
    // 候选池管理
    getWatchTargets,
    addWatchTarget,
    updateWatchTarget,
    deleteWatchTarget,
    bulkImportWatchTargets,
    validateCsvImport,
    exportToCsv,
    
    // 评论管理
    getComments,
    addComment,
    filterComments,
    
    // 任务管理
    getTasks,
    generateTasks,
    updateTaskStatus,
    
    // 模板管理
    getReplyTemplates,
    addReplyTemplate,
    
    // 统计和报告
    refreshStats,
    generateDailyReport,
    
    // 工具方法
    refreshAll,
    clearError,
    
    // 错误状态
    error
  };
};

export default usePreciseAcquisition;
