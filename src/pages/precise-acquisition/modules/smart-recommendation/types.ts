// src/pages/precise-acquisition/modules/smart-recommendation/types.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 智能推荐系统类型定义
 */

export interface DataMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number; // 互动率
  growthRate: number; // 增长率
  publishTime: string;
  region?: string;
}

export interface RecommendationItem {
  id: string;
  type: 'account' | 'video';
  platform: 'xiaohongshu' | 'douyin';
  
  // 基本信息
  title: string;
  url: string;
  author: string;
  authorId: string;
  
  // 数据指标
  metrics: DataMetrics;
  
  // 推荐评分
  score: number;
  confidence: number; // 置信度
  
  // 推荐原因
  reasons: string[];
  
  // 状态
  status: 'pending' | 'added' | 'ignored';
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationCriteria {
  // 数据阈值
  minViews?: number;
  minLikes?: number;
  minComments?: number;
  minEngagement?: number; // 最小互动率
  
  // 增长趋势
  minGrowthRate?: number;
  
  // 时间范围
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  publishedWithin?: number; // 发布时间范围（小时）
  
  // 地域筛选
  regions?: string[];
  
  // 平台筛选
  platforms?: ('xiaohongshu' | 'douyin')[];
  
  // 行业关键词
  keywords?: string[];
  excludeKeywords?: string[];
}

export type RecommendationAction = 'add_to_monitoring' | 'ignore' | 'view_details';

export interface RecommendationFilterState {
  criteria: RecommendationCriteria;
  sortBy: 'score' | 'views' | 'likes' | 'comments' | 'engagement' | 'time';
  sortOrder: 'asc' | 'desc';
  statusFilter: 'all' | 'pending' | 'added' | 'ignored';
}