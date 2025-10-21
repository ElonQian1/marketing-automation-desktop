// src/modules/prospecting/hooks/use-prospecting.ts
// module: prospecting | layer: hooks | role: 精准获客React Hook
// summary: 提供精准获客功能的React Hook，封装业务逻辑

import { useState, useCallback, useRef } from 'react';
import type {
  ProspectingComment,
  ProspectingRawComment,
  ProspectingIntentType,
  ProspectingSocialPlatform,
  ProspectingReplyPlan
} from '../domain';
import { ProspectingUseCases } from '../application/prospecting-use-cases';

/**
 * 筛选条件
 */
export interface ProspectingUseProspectingFilter {
  platform?: ProspectingSocialPlatform;
  intent?: ProspectingIntentType;
  hasAnalysis?: boolean;
}

/**
 * 批量操作进度
 */
export interface ProspectingBatchProgress {
  current: number;
  total: number;
  currentItem?: string;
}

/**
 * 精准获客Hook返回值
 */
export interface ProspectingUseProspectingReturn {
  // 数据状态
  comments: ProspectingComment[];
  statistics: any;
  loading: boolean;
  
  // 操作状态
  analyzing: boolean;
  analysisProgress: ProspectingBatchProgress;
  executing: boolean;
  executionProgress: ProspectingBatchProgress;

  // 数据操作
  loadComments: (filter?: ProspectingUseProspectingFilter) => Promise<void>;
  loadStatistics: () => Promise<void>;
  importComments: (comments: ProspectingRawComment[]) => Promise<boolean>;
  
  // AI分析
  analyzeComments: (commentIds: string[]) => Promise<boolean>;
  
  // 回复管理
  createReplyPlans: (commentIds: string[], isSimulation?: boolean) => Promise<ProspectingReplyPlan[]>;
  executeReplyPlans: (planIds: string[]) => Promise<boolean>;
  
  // 示例数据
  importSampleData: () => Promise<boolean>;
}

/**
 * 精准获客Hook
 */
export const useProspecting = (): ProspectingUseProspectingReturn => {
  // 状态管理
  const [comments, setComments] = useState<ProspectingComment[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<ProspectingBatchProgress>({ 
    current: 0, 
    total: 0 
  });
  const [executionProgress, setExecutionProgress] = useState<ProspectingBatchProgress>({ 
    current: 0, 
    total: 0 
  });

  // 业务用例实例（使用ref保持单例）
  const useCasesRef = useRef<ProspectingUseCases | null>(null);
  if (!useCasesRef.current) {
    useCasesRef.current = new ProspectingUseCases();
  }
  const useCases = useCasesRef.current;

  /**
   * 加载评论数据
   */
  const loadComments = useCallback(async (filter?: ProspectingUseProspectingFilter) => {
    setLoading(true);
    try {
      const data = await useCases.getComments(filter);
      setComments(data);
    } catch (error) {
      console.error('[useProspecting] 加载评论失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [useCases]);

  /**
   * 加载统计数据
   */
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await useCases.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('[useProspecting] 加载统计数据失败:', error);
      throw error;
    }
  }, [useCases]);

  /**
   * 导入评论
   */
  const importComments = useCallback(async (newComments: ProspectingRawComment[]): Promise<boolean> => {
    try {
      const result = await useCases.importComments(newComments);
      
      if (result.success) {
        // 刷新数据
        await loadComments();
        await loadStatistics();
      }
      
      return result.success;
    } catch (error) {
      console.error('[useProspecting] 导入评论失败:', error);
      return false;
    }
  }, [useCases, loadComments, loadStatistics]);

  /**
   * 分析评论
   */
  const analyzeComments = useCallback(async (commentIds: string[]): Promise<boolean> => {
    if (commentIds.length === 0) return false;
    
    setAnalyzing(true);
    setAnalysisProgress({ current: 0, total: commentIds.length });

    try {
      const result = await useCases.batchAnalyzeComments(commentIds, {
        concurrency: 3,
        onProgress: (completed, total, current) => {
          setAnalysisProgress({ 
            current: completed, 
            total, 
            currentItem: current 
          });
        }
      });

      if (result.success) {
        // 刷新数据
        await loadComments();
        await loadStatistics();
      }

      return result.success;
    } catch (error) {
      console.error('[useProspecting] 分析评论失败:', error);
      return false;
    } finally {
      setAnalyzing(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  }, [useCases, loadComments, loadStatistics]);

  /**
   * 创建回复计划
   */
  const createReplyPlans = useCallback(async (
    commentIds: string[], 
    isSimulation = true
  ): Promise<ProspectingReplyPlan[]> => {
    try {
      const result = await useCases.createReplyPlans(commentIds, { isSimulation });
      
      if (result.success) {
        await loadStatistics();
      }
      
      return result.plans;
    } catch (error) {
      console.error('[useProspecting] 创建回复计划失败:', error);
      return [];
    }
  }, [useCases, loadStatistics]);

  /**
   * 执行回复计划
   */
  const executeReplyPlans = useCallback(async (planIds: string[]): Promise<boolean> => {
    if (planIds.length === 0) return false;

    setExecuting(true);
    setExecutionProgress({ current: 0, total: planIds.length });

    try {
      const results = await useCases.executeReplyPlans(planIds, {
        concurrency: 2,
        onProgress: (completed, total, current) => {
          setExecutionProgress({
            current: completed,
            total,
            currentItem: current
          });
        }
      });

      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        await loadStatistics();
      }

      return successCount > 0;
    } catch (error) {
      console.error('[useProspecting] 执行回复计划失败:', error);
      return false;
    } finally {
      setExecuting(false);
      setExecutionProgress({ current: 0, total: 0 });
    }
  }, [useCases, loadStatistics]);

  /**
   * 导入示例数据
   */
  const importSampleData = useCallback(async (): Promise<boolean> => {
    const sampleComments: ProspectingRawComment[] = [
      {
        id: `dy_${Date.now()}_1`,
        platform: 'douyin',
        videoUrl: 'https://v.douyin.com/sample1',
        author: '小王',
        content: '这个产品多少钱一套？支持发货到广州吗？质量怎么样？',
        timestamp: Date.now(),
        likeCount: 12
      },
      {
        id: `xhs_${Date.now()}_1`,
        platform: 'xhs',
        videoUrl: 'https://www.xiaohongshu.com/explore/sample1',
        author: 'Lynn',
        content: '实体店地址在哪？可以线下看样品吗？离市中心远不远？',
        timestamp: Date.now(),
        likeCount: 8
      },
      {
        id: `dy_${Date.now()}_2`,
        platform: 'douyin',
        videoUrl: 'https://v.douyin.com/sample2',
        author: '老张',
        content: '售后怎么联系？我这边安装有问题，客服电话打不通',
        timestamp: Date.now(),
        likeCount: 3
      },
      {
        id: `xhs_${Date.now()}_2`,
        platform: 'xhs',
        videoUrl: 'https://www.xiaohongshu.com/explore/sample2',
        author: '美美',
        content: '好看👍👍 想买同款',
        timestamp: Date.now(),
        likeCount: 25
      },
      {
        id: `dy_${Date.now()}_3`,
        platform: 'douyin',
        videoUrl: 'https://v.douyin.com/sample3',
        author: '阿强',
        content: '和xx品牌比怎么样？性价比如何？',
        timestamp: Date.now(),
        likeCount: 6
      }
    ];

    return await importComments(sampleComments);
  }, [importComments]);

  return {
    // 数据状态
    comments,
    statistics,
    loading,
    
    // 操作状态
    analyzing,
    analysisProgress,
    executing,
    executionProgress,

    // 数据操作
    loadComments,
    loadStatistics,
    importComments,
    
    // AI分析
    analyzeComments,
    
    // 回复管理
    createReplyPlans,
    executeReplyPlans,
    
    // 示例数据
    importSampleData,
  };
};