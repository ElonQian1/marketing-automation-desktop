/**
 * 数据分析引擎
 * 基于数据指标智能推荐监控目标
 */

import type { 
  RecommendationItem, 
  RecommendationCriteria, 
  DataMetrics 
} from './types';

export class DataAnalysisEngine {
  private static instance: DataAnalysisEngine;
  
  static getInstance(): DataAnalysisEngine {
    if (!DataAnalysisEngine.instance) {
      DataAnalysisEngine.instance = new DataAnalysisEngine();
    }
    return DataAnalysisEngine.instance;
  }

  /**
   * 计算推荐评分
   */
  calculateScore(metrics: DataMetrics, criteria: RecommendationCriteria): number {
    let score = 0;
    let maxScore = 0;

    // 浏览量评分 (0-25分)
    if (criteria.minViews && metrics.views >= criteria.minViews) {
      const viewsScore = Math.min(25, (metrics.views / criteria.minViews) * 10);
      score += viewsScore;
    }
    maxScore += 25;

    // 点赞量评分 (0-20分)
    if (criteria.minLikes && metrics.likes >= criteria.minLikes) {
      const likesScore = Math.min(20, (metrics.likes / criteria.minLikes) * 10);
      score += likesScore;
    }
    maxScore += 20;

    // 评论量评分 (0-20分)
    if (criteria.minComments && metrics.comments >= criteria.minComments) {
      const commentsScore = Math.min(20, (metrics.comments / criteria.minComments) * 10);
      score += commentsScore;
    }
    maxScore += 20;

    // 互动率评分 (0-20分)
    if (criteria.minEngagement && metrics.engagement >= criteria.minEngagement) {
      const engagementScore = Math.min(20, (metrics.engagement / criteria.minEngagement) * 10);
      score += engagementScore;
    }
    maxScore += 20;

    // 增长率评分 (0-15分)
    if (criteria.minGrowthRate && metrics.growthRate >= criteria.minGrowthRate) {
      const growthScore = Math.min(15, (metrics.growthRate / criteria.minGrowthRate) * 5);
      score += growthScore;
    }
    maxScore += 15;

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  /**
   * 生成推荐原因
   */
  generateReasons(metrics: DataMetrics, criteria: RecommendationCriteria): string[] {
    const reasons: string[] = [];

    if (criteria.minViews && metrics.views >= criteria.minViews * 2) {
      reasons.push(`浏览量超高：${this.formatNumber(metrics.views)}`);
    } else if (criteria.minViews && metrics.views >= criteria.minViews) {
      reasons.push(`浏览量达标：${this.formatNumber(metrics.views)}`);
    }

    if (criteria.minLikes && metrics.likes >= criteria.minLikes * 2) {
      reasons.push(`点赞量超高：${this.formatNumber(metrics.likes)}`);
    } else if (criteria.minLikes && metrics.likes >= criteria.minLikes) {
      reasons.push(`点赞量达标：${this.formatNumber(metrics.likes)}`);
    }

    if (criteria.minComments && metrics.comments >= criteria.minComments * 2) {
      reasons.push(`评论量超高：${this.formatNumber(metrics.comments)}`);
    } else if (criteria.minComments && metrics.comments >= criteria.minComments) {
      reasons.push(`评论量达标：${this.formatNumber(metrics.comments)}`);
    }

    if (metrics.engagement > 10) {
      reasons.push(`互动率极高：${metrics.engagement.toFixed(1)}%`);
    } else if (metrics.engagement > 5) {
      reasons.push(`互动率较高：${metrics.engagement.toFixed(1)}%`);
    }

    if (metrics.growthRate > 100) {
      reasons.push(`增长迅猛：${metrics.growthRate.toFixed(0)}%`);
    } else if (metrics.growthRate > 50) {
      reasons.push(`增长稳定：${metrics.growthRate.toFixed(0)}%`);
    }

    // 时效性
    const publishHours = this.getHoursSincePublish(metrics.publishTime);
    if (publishHours < 24) {
      reasons.push('新发布内容');
    } else if (publishHours < 72) {
      reasons.push('近期热门');
    }

    return reasons.length > 0 ? reasons : ['符合基本监控条件'];
  }

  /**
   * 计算置信度
   */
  calculateConfidence(metrics: DataMetrics): number {
    let confidence = 50; // 基础置信度

    // 数据完整性
    const hasCompleteData = [
      metrics.views,
      metrics.likes,
      metrics.comments,
      metrics.engagement
    ].every(value => value !== undefined && value >= 0);

    if (hasCompleteData) {
      confidence += 20;
    }

    // 数据规模
    if (metrics.views > 10000) confidence += 10;
    if (metrics.likes > 1000) confidence += 10;
    if (metrics.comments > 100) confidence += 10;

    return Math.min(100, confidence);
  }

  /**
   * 筛选推荐项目
   */
  filterRecommendations(
    items: RecommendationItem[], 
    criteria: RecommendationCriteria
  ): RecommendationItem[] {
    return items.filter(item => {
      const metrics = item.metrics;

      // 基本数据阈值
      if (criteria.minViews && metrics.views < criteria.minViews) return false;
      if (criteria.minLikes && metrics.likes < criteria.minLikes) return false;
      if (criteria.minComments && metrics.comments < criteria.minComments) return false;
      if (criteria.minEngagement && metrics.engagement < criteria.minEngagement) return false;
      if (criteria.minGrowthRate && metrics.growthRate < criteria.minGrowthRate) return false;

      // 时间范围
      if (criteria.publishedWithin) {
        const hoursSincePublish = this.getHoursSincePublish(metrics.publishTime);
        if (hoursSincePublish > criteria.publishedWithin) return false;
      }

      // 地域筛选
      if (criteria.regions && criteria.regions.length > 0) {
        if (!metrics.region || !criteria.regions.includes(metrics.region)) return false;
      }

      // 平台筛选
      if (criteria.platforms && criteria.platforms.length > 0) {
        if (!criteria.platforms.includes(item.platform)) return false;
      }

      return true;
    });
  }

  /**
   * 生成模拟推荐数据（开发用）
   */
  generateMockRecommendations(count: number = 10): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];
    const platforms: ('xiaohongshu' | 'douyin')[] = ['xiaohongshu', 'douyin'];
    const types: ('account' | 'video')[] = ['account', 'video'];
    const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都'];

    for (let i = 0; i < count; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const metrics: DataMetrics = {
        views: Math.floor(Math.random() * 100000) + 5000,
        likes: Math.floor(Math.random() * 10000) + 500,
        comments: Math.floor(Math.random() * 1000) + 50,
        shares: Math.floor(Math.random() * 500) + 10,
        engagement: Math.random() * 15 + 2,
        growthRate: Math.random() * 200 + 10,
        publishTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        region: regions[Math.floor(Math.random() * regions.length)]
      };

      const criteria: RecommendationCriteria = {
        minViews: 10000,
        minLikes: 1000,
        minComments: 100,
        minEngagement: 5
      };

      const score = this.calculateScore(metrics, criteria);
      const confidence = this.calculateConfidence(metrics);
      const reasons = this.generateReasons(metrics, criteria);

      recommendations.push({
        id: `rec_${Date.now()}_${i}`,
        type,
        platform,
        title: type === 'account' 
          ? `优质${platform === 'xiaohongshu' ? '小红书' : '抖音'}博主_${i + 1}`
          : `热门${platform === 'xiaohongshu' ? '小红书' : '抖音'}视频_${i + 1}`,
        url: `https://${platform}.com/item/${Date.now()}_${i}`,
        author: `作者_${i + 1}`,
        authorId: `author_${i + 1}`,
        metrics,
        score,
        confidence,
        reasons,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  // 工具方法
  private formatNumber(num: number): string {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toLocaleString();
  }

  private getHoursSincePublish(publishTime: string): number {
    return (Date.now() - new Date(publishTime).getTime()) / (1000 * 60 * 60);
  }
}