// src/pages/precise-acquisition/services/timeFilterEnhancement.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 时间筛选增强功能
 */

import type { MonitoringTask, CommentData } from './monitoringService';

export class TimeFilterEnhancement {
  /**
   * 根据时间范围筛选评论
   */
  static filterCommentsByTime(comments: CommentData[], filters: MonitoringTask['filters']): CommentData[] {
    if (!filters.commentTimeRange || filters.commentTimeRange === 0) {
      return comments; // 不限制时间
    }

    const now = new Date();
    const timeRangeMs = filters.commentTimeRange * 24 * 60 * 60 * 1000; // 转换为毫秒
    const cutoffTime = new Date(now.getTime() - timeRangeMs);

    return comments.filter(comment => {
      const publishTime = new Date(comment.publishTime);
      const isWithinTimeRange = publishTime >= cutoffTime;

      // 额外的智能筛选
      if (filters.onlyRecentTrending && isWithinTimeRange) {
        // 只保留最近且有一定互动量的评论
        const hoursOld = (now.getTime() - publishTime.getTime()) / (1000 * 60 * 60);
        const minLikesForAge = hoursOld < 24 ? 5 : hoursOld < 72 ? 10 : 20;
        return comment.likes >= minLikesForAge;
      }

      if (filters.excludeOldReplies && isWithinTimeRange) {
        // 排除已经有很多回复的旧评论（通常意味着话题已经过时）
        const hoursOld = (now.getTime() - publishTime.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 48) {
          // 超过48小时的评论，如果互动较少，可能已经冷却
          return comment.likes > 10; // 保留仍有一定热度的评论
        }
      }

      return isWithinTimeRange;
    });
  }

  /**
   * 获取时间范围的智能建议
   */
  static getTimeRangeRecommendations(taskType: string, keywords: string[]): {
    recommended: number;
    explanation: string;
    alternatives: Array<{ value: number; label: string; reason: string }>;
  } {
    // 基于任务类型和关键词的智能推荐
    let recommended = 7; // 默认一周
    let explanation = '平衡时效性和内容丰富度的推荐设置';

    // 根据关键词判断是否为热点话题
    const hotKeywords = ['新闻', '热点', '突发', '紧急', '最新', '刚刚', '实时'];
    const isHotTopic = keywords.some(keyword => 
      hotKeywords.some(hot => keyword.includes(hot))
    );

    // 根据任务类型调整推荐
    if (isHotTopic) {
      recommended = 1;
      explanation = '检测到热点关键词，建议关注最新评论';
    } else if (taskType === 'industry') {
      recommended = 14;
      explanation = '行业监控建议使用较长时间范围，捕获更多潜在客户';
    }

    const alternatives = [
      {
        value: 1,
        label: '24小时内',
        reason: '适合热点事件、紧急公关、快速响应场景'
      },
      {
        value: 3,
        label: '3天内',
        reason: '适合新产品发布、活动推广、短期营销'
      },
      {
        value: 7,
        label: '1周内',
        reason: '常规行业监控的黄金时间，平衡时效性和覆盖面'
      },
      {
        value: 14,
        label: '2周内',
        reason: '深度行业分析、潜在客户挖掘、长期话题追踪'
      },
      {
        value: 30,
        label: '1个月内',
        reason: '趋势分析、竞品监控、市场调研'
      },
      {
        value: 90,
        label: '3个月内',
        reason: '长期战略分析、行业报告生成、历史数据对比'
      }
    ];

    return { recommended, explanation, alternatives };
  }

  /**
   * 格式化时间范围显示
   */
  static formatTimeRange(days: number): string {
    if (days === 0) return '不限制时间';
    if (days === 1) return '24小时内';
    if (days < 7) return `${days}天内`;
    if (days === 7) return '1周内';
    if (days === 14) return '2周内';
    if (days < 30) return `${Math.round(days / 7)}周内`;
    if (days === 30) return '1个月内';
    if (days < 90) return `${Math.round(days / 30)}个月内`;
    if (days === 90) return '3个月内';
    if (days < 365) return `${Math.round(days / 30)}个月内`;
    return '1年内';
  }

  /**
   * 获取相对时间描述
   */
  static getRelativeTimeDescription(publishTime: string): string {
    const now = new Date();
    const publish = new Date(publishTime);
    const diffMs = now.getTime() - publish.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) return '刚刚发布';
    if (diffHours < 24) return `${Math.floor(diffHours)}小时前`;
    if (diffDays < 7) return `${Math.floor(diffDays)}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  }

  /**
   * 检查评论是否为热门且新鲜
   */
  static isHotAndFresh(comment: CommentData, maxHours: number = 72): boolean {
    const now = new Date();
    const publishTime = new Date(comment.publishTime);
    const hoursOld = (now.getTime() - publishTime.getTime()) / (1000 * 60 * 60);

    // 在指定时间内且有足够互动量
    const isRecent = hoursOld <= maxHours;
    const hasGoodEngagement = comment.likes >= 10 || 
      (comment.likes >= 5 && hoursOld <= 24);

    return isRecent && hasGoodEngagement;
  }
}