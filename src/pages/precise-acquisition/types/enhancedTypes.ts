// src/pages/precise-acquisition/types/enhancedTypes.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 监控服务的增强类型定义
 */

import type { Device } from '../../../domain/adb/entities/Device';

// 增强的监控任务接口
export interface EnhancedMonitoringTask {
  id: string;
  type: 'industry' | 'account' | 'video';
  status: 'active' | 'paused' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  
  // 监控配置
  keywords?: string[];
  targetAccount?: string;
  targetVideo?: string;
  
  // 增强的筛选条件
  filters: {
    region?: string[];
    commentTimeRange?: number; // 天数，0表示不限制
    commentTimeUnit?: 'hours' | 'days' | 'weeks' | 'months'; // 时间单位
    commentTimeValue?: number; // 时间数值
    minLikes?: number;
    minComments?: number;
    minViews?: number;
    // 新增：更精细的时间控制
    commentDateFrom?: string; // 起始日期 (ISO string)
    commentDateTo?: string;   // 结束日期 (ISO string)
    onlyRecentTrending?: boolean; // 仅最近热门评论
    excludeOldReplies?: boolean;  // 排除已有大量回复的旧评论
  };
  
  // 执行设备
  assignedDevices: string[];
  
  // 统计数据
  stats: {
    followCount: number;
    replyCount: number;
    lastExecuted?: string;
  };
}

export interface EnhancedCommentData {
  id: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  authorId: string;
  authorName: string;
  content: string;
  publishTime: string;
  likes: number;
  region?: string;
  
  // 任务相关
  taskId: string;
  status: 'pending' | 'followed' | 'replied' | 'ignored';
  assignedDevice?: string;
  
  // 回复信息
  replyContent?: string;
  replyTime?: string;
  replyDevice?: string;
  
  // 新增：时间相关
  isHotAndFresh?: boolean; // 是否为热门且新鲜的评论
  timeScore?: number; // 时间评分（0-100）
  interactionScore?: number; // 互动评分（0-100）
}

export interface DuplicationRule {
  id: string;
  name: string;
  type: 'follow' | 'reply';
  devices: string[];
  timeWindow: number; // 小时
  maxActions: number; // 同一目标的最大操作次数
  enabled: boolean;
}

export interface ReplyTask {
  id: string;
  commentId: string;
  comment: EnhancedCommentData;
  status: 'pending' | 'completed' | 'failed';
  assignedDevice?: string;
  replyContent?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// 时间筛选配置
export interface TimeFilterConfig {
  range: number; // 天数
  onlyRecentTrending: boolean;
  excludeOldReplies: boolean;
  customDateRange?: {
    from: string;
    to: string;
  };
}

// 智能推荐结果
export interface TimeRangeRecommendation {
  recommended: number;
  explanation: string;
  alternatives: Array<{
    value: number;
    label: string;
    reason: string;
  }>;
}

// 评论筛选结果
export interface CommentFilterResult {
  filtered: EnhancedCommentData[];
  totalCount: number;
  filteredCount: number;
  timeRangeUsed: number;
  recommendations?: {
    hotComments: number;
    freshComments: number;
    trendingComments: number;
  };
}