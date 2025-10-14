// src/modules/precise-acquisition/rate-limit/hooks/useRateLimit.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 查重频控 React Hook
 * 
 * 提供查重频控功能的React接口
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ProspectingRateLimitService,
  RateLimitCheckResult
} from '../../../../application/services/precise-acquisition/prospecting-rate-limit-service';
import {
  DedupCheckResult,
  DedupStats,
  RateLimitConfig,
  DedupLevel
} from '../services/prospecting-rate-limit-service';
import { 
  Task, 
  Comment, 
  WatchTarget, 
  Platform,
  TaskType 
} from '../../shared/types/core';

export interface UseRateLimitOptions {
  autoRefreshStats?: boolean;
  refreshInterval?: number;
  enableRealTimeChecks?: boolean;
}

export interface UseRateLimitReturn {
  // 服务实例
  service: ProspectingRateLimitService;
  
  // 数据状态
  stats: DedupStats | null;
  recentBlocks: Array<{
    timestamp: Date;
    level: DedupLevel;
    key: string;
    reason: string;
  }>;
  
  // 加载状态
  loading: boolean;
  checking: boolean;
  
  // 错误状态
  error: string | null;
  
  // 检查方法
  checkCommentDedup: (comment: Comment, taskType: TaskType, deviceId: string) => Promise<DedupCheckResult>;
  checkUserDedup: (userId: string, platform: Platform, taskType: TaskType, deviceId: string) => Promise<DedupCheckResult>;
  checkCrossDeviceDedup: (target: WatchTarget, taskType: TaskType, deviceId: string) => Promise<DedupCheckResult>;
  checkRateLimit: (deviceId: string, platform: Platform, taskType: TaskType, config?: Partial<RateLimitConfig>) => Promise<RateLimitCheckResult>;
  performComprehensiveCheck: (task: Task, comment?: Comment, target?: WatchTarget) => Promise<{
    allowed: boolean;
    reasons: string[];
    suggested_delay_ms?: number;
  }>;
  
  // 记录方法
  recordOperation: (task: Task, comment?: Comment, target?: WatchTarget) => Promise<void>;
  
  // 统计和管理
  refreshStats: () => Promise<void>;
  cleanupExpiredRecords: () => Promise<number>;
  
  // 实用方法
  isOperationAllowed: (task: Task, comment?: Comment, target?: WatchTarget) => Promise<boolean>;
  getBlockReason: (task: Task, comment?: Comment, target?: WatchTarget) => Promise<string[]>;
  getSuggestedDelay: (task: Task, comment?: Comment, target?: WatchTarget) => Promise<number | undefined>;
}

export const useRateLimit = (options: UseRateLimitOptions = {}): UseRateLimitReturn => {
  const { 
    autoRefreshStats = true, 
    refreshInterval = 60000, // 1分钟
    enableRealTimeChecks = true 
  } = options;
  
  // 服务实例
  const [service] = useState(() => new ProspectingRateLimitService());
  
  // 数据状态
  const [stats, setStats] = useState<DedupStats | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<Array<{
    timestamp: Date;
    level: DedupLevel;
    key: string;
    reason: string;
  }>>([]);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // 错误状态
  const [error, setError] = useState<string | null>(null);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 刷新统计数据
  const refreshStats = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    clearError();
    
    try {
      const newStats = await service.getStats();
      setStats(newStats);
      setRecentBlocks(newStats.recent_blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [service, loading, clearError]);

  // 评论级去重检查
  const checkCommentDedup = useCallback(async (
    comment: Comment, 
    taskType: TaskType, 
    deviceId: string
  ): Promise<DedupCheckResult> => {
    setChecking(true);
    clearError();
    
    try {
      const result = await service.checkCommentDedup(comment, taskType, deviceId);
      
      if (!result.allowed && enableRealTimeChecks) {
        // 添加到最近阻止列表
        setRecentBlocks(prev => [{
          timestamp: new Date(),
          level: DedupLevel.COMMENT,
          key: `${comment.platform}:${comment.id}`,
          reason: result.reason || '评论级去重'
        }, ...prev.slice(0, 9)]); // 保留最近10条
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '评论去重检查失败');
      return {
        allowed: false,
        reason: '检查失败'
      };
    } finally {
      setChecking(false);
    }
  }, [service, enableRealTimeChecks, clearError]);

  // 用户级去重检查
  const checkUserDedup = useCallback(async (
    userId: string,
    platform: Platform,
    taskType: TaskType,
    deviceId: string
  ): Promise<DedupCheckResult> => {
    setChecking(true);
    clearError();
    
    try {
      const result = await service.checkUserDedup(userId, platform, taskType, deviceId);
      
      if (!result.allowed && enableRealTimeChecks) {
        setRecentBlocks(prev => [{
          timestamp: new Date(),
          level: DedupLevel.USER,
          key: `${platform}:${userId}`,
          reason: result.reason || '用户级去重'
        }, ...prev.slice(0, 9)]);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '用户去重检查失败');
      return {
        allowed: false,
        reason: '检查失败'
      };
    } finally {
      setChecking(false);
    }
  }, [service, enableRealTimeChecks, clearError]);

  // 跨设备查重检查
  const checkCrossDeviceDedup = useCallback(async (
    target: WatchTarget,
    taskType: TaskType,
    deviceId: string
  ): Promise<DedupCheckResult> => {
    setChecking(true);
    clearError();
    
    try {
      const result = await service.checkCrossDeviceDedup(target, taskType, deviceId);
      
      if (!result.allowed && enableRealTimeChecks) {
        setRecentBlocks(prev => [{
          timestamp: new Date(),
          level: DedupLevel.DEVICE,
          key: `${target.platform}:${target.platform_id_or_url}`,
          reason: result.reason || '跨设备查重'
        }, ...prev.slice(0, 9)]);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '跨设备查重检查失败');
      return {
        allowed: false,
        reason: '检查失败'
      };
    } finally {
      setChecking(false);
    }
  }, [service, enableRealTimeChecks, clearError]);

  // 频控检查
  const checkRateLimit = useCallback(async (
    deviceId: string,
    platform: Platform,
    taskType: TaskType,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitCheckResult> => {
    setChecking(true);
    clearError();
    
    try {
      const result = await service.checkRateLimit(deviceId, platform, taskType, config);
      
      if (!result.allowed && enableRealTimeChecks) {
        setRecentBlocks(prev => [{
          timestamp: new Date(),
          level: DedupLevel.FREQUENCY,
          key: `${deviceId}:${platform}:${taskType}`,
          reason: result.reason || '频率限制'
        }, ...prev.slice(0, 9)]);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '频控检查失败');
      return {
        allowed: false,
        reason: '检查失败',
        current_rate: 0,
        limit: 0,
        reset_time: new Date()
      };
    } finally {
      setChecking(false);
    }
  }, [service, enableRealTimeChecks, clearError]);

  // 综合检查
  const performComprehensiveCheck = useCallback(async (
    task: Task,
    comment?: Comment,
    target?: WatchTarget
  ) => {
    setChecking(true);
    clearError();
    
    try {
      const result = await service.performComprehensiveCheck(task, comment, target);
      
      if (!result.allowed && enableRealTimeChecks) {
        // 添加所有阻止原因到最近阻止列表
        const blockEntries = result.reasons.map((reason, index) => ({
          timestamp: new Date(),
          level: DedupLevel.COMMENT, // 可以根据reason类型细化
          key: task.id,
          reason
        }));
        
        setRecentBlocks(prev => [...blockEntries, ...prev].slice(0, 10));
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '综合检查失败');
      return {
        allowed: false,
        reasons: ['检查失败']
      };
    } finally {
      setChecking(false);
    }
  }, [service, enableRealTimeChecks, clearError]);

  // 记录操作
  const recordOperation = useCallback(async (
    task: Task,
    comment?: Comment,
    target?: WatchTarget
  ) => {
    clearError();
    
    try {
      // 使用saveRecord方法记录操作，简化实现
      await service.saveRecord(
        'task' as any, // DedupLevel
        `task_${task.id}`,
        task.id,
        Platform.DOUYIN, // 默认平台
        TaskType.REPLY,  // 默认任务类型  
        'default_device', // 设备ID
        undefined, // expiresAt
        { task_id: task.id, timestamp: Date.now() } // metadata
      );
      
      // 刷新统计（异步，不阻塞主流程）
      if (autoRefreshStats) {
        setTimeout(() => refreshStats(), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '记录操作失败');
      throw err;
    }
  }, [service, autoRefreshStats, refreshStats, clearError]);

  // 清理过期记录
  const cleanupExpiredRecords = useCallback(async (): Promise<number> => {
    clearError();
    
    try {
      const deletedCount = await service.cleanExpiredRecords();
      
      // 刷新统计
      await refreshStats();
      
      return deletedCount;
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理过期记录失败');
      return 0;
    }
  }, [service, refreshStats, clearError]);

  // 实用方法：检查操作是否被允许
  const isOperationAllowed = useCallback(async (
    task: Task,
    comment?: Comment,
    target?: WatchTarget
  ): Promise<boolean> => {
    try {
      const result = await service.performComprehensiveCheck(task, comment, target);
      return result.allowed;
    } catch (err) {
      console.error('Failed to check if operation is allowed:', err);
      return false; // 安全起见，默认不允许
    }
  }, [service]);

  // 实用方法：获取阻止原因
  const getBlockReason = useCallback(async (
    task: Task,
    comment?: Comment,
    target?: WatchTarget
  ): Promise<string[]> => {
    try {
      const result = await service.performComprehensiveCheck(task, comment, target);
      return result.reasons;
    } catch (err) {
      console.error('Failed to get block reasons:', err);
      return ['检查失败'];
    }
  }, [service]);

  // 实用方法：获取建议延迟
  const getSuggestedDelay = useCallback(async (
    task: Task,
    comment?: Comment,
    target?: WatchTarget
  ): Promise<number | undefined> => {
    try {
      const result = await service.performComprehensiveCheck(task, comment, target);
      return result.suggested_delay_ms;
    } catch (err) {
      console.error('Failed to get suggested delay:', err);
      return undefined;
    }
  }, [service]);

  // 自动刷新统计
  useEffect(() => {
    if (!autoRefreshStats) return;

    // 初始加载
    refreshStats();

    // 设置定时器
    const interval = setInterval(refreshStats, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshStats, refreshInterval, refreshStats]);

  return {
    service,
    stats,
    recentBlocks,
    loading,
    checking,
    error,
    checkCommentDedup,
    checkUserDedup,
    checkCrossDeviceDedup,
    checkRateLimit,
    performComprehensiveCheck,
    recordOperation,
    refreshStats,
    cleanupExpiredRecords,
    isOperationAllowed,
    getBlockReason,
    getSuggestedDelay
  };
};