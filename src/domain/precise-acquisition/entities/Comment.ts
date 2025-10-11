// src/domain/precise-acquisition/entities/Comment.ts
// module: domain | layer: domain | role: entity
// summary: 实体定义

/**
 * 精准获客领域模型 - 评论实体
 * 
 * 封装评论相关的业务逻辑和验证规则
 */

import {
  Platform,
  RegionTag,
  validatePlatform,
  validateRegionTag,
} from '../../../constants/precise-acquisition-enums';

/**
 * 评论实体
 * 
 * 代表从各平台拉取的评论数据，包含内容分析和筛选逻辑
 */
export class Comment {
  private constructor(
    public readonly id: string | null,
    public readonly platform: Platform,
    public readonly videoId: string,
    public readonly authorId: string,
    public readonly content: string,
    public readonly likeCount: number | null,
    public readonly publishTime: Date,
    public readonly region: RegionTag | null,
    public readonly sourceTargetId: string,
    public readonly insertedAt: Date | null,
  ) {}

  /**
   * 创建新的评论实体
   */
  static create(params: {
    platform: Platform;
    videoId: string;
    authorId: string;
    content: string;
    likeCount?: number;
    publishTime: Date;
    region?: RegionTag;
    sourceTargetId: string;
  }): Comment {
    // 验证必填字段
    if (!params.platform || !params.videoId || !params.authorId || !params.content || !params.sourceTargetId) {
      throw new Error('platform, videoId, authorId, content, sourceTargetId are required');
    }

    // 验证枚举值
    if (!validatePlatform(params.platform)) {
      throw new Error(`Invalid platform: ${params.platform}`);
    }
    if (params.region && !validateRegionTag(params.region)) {
      throw new Error(`Invalid region: ${params.region}`);
    }

    // 验证内容长度
    if (params.content.length > 1000) {
      throw new Error('Comment content too long (max 1000 characters)');
    }

    // 验证发布时间不能是未来时间
    if (params.publishTime > new Date()) {
      throw new Error('Publish time cannot be in the future');
    }

    return new Comment(
      null, // 新创建时ID为null
      params.platform,
      params.videoId,
      params.authorId,
      params.content.trim(),
      params.likeCount || null,
      params.publishTime,
      params.region || null,
      params.sourceTargetId,
      null, // 插入时间由数据库设置
    );
  }

  /**
   * 从数据库行数据重建实体
   */
  static fromDatabaseRow(row: {
    id: string;
    platform: string;
    video_id: string;
    author_id: string;
    content: string;
    like_count?: number;
    publish_time: string;
    region?: string;
    source_target_id: string;
    inserted_at: string;
  }): Comment {
    return new Comment(
      row.id,
      row.platform as Platform,
      row.video_id,
      row.author_id,
      row.content,
      row.like_count || null,
      new Date(row.publish_time),
      row.region as RegionTag || null,
      row.source_target_id,
      new Date(row.inserted_at),
    );
  }

  /**
   * 转换为数据库载荷格式
   */
  toDatabasePayload(): {
    platform: string;
    video_id: string;
    author_id: string;
    content: string;
    like_count?: number;
    publish_time: string;
    region?: string;
    source_target_id: string;
  } {
    return {
      platform: this.platform,
      video_id: this.videoId,
      author_id: this.authorId,
      content: this.content,
      like_count: this.likeCount || undefined,
      publish_time: this.publishTime.toISOString(),
      region: this.region || undefined,
      source_target_id: this.sourceTargetId,
    };
  }

  /**
   * 检查评论是否包含关键词
   */
  containsKeywords(keywords: string[]): boolean {
    if (!keywords || keywords.length === 0) return false;
    
    const lowerContent = this.content.toLowerCase();
    return keywords.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
  }

  /**
   * 检查评论是否包含排除关键词
   */
  containsExcludeKeywords(excludeKeywords: string[]): boolean {
    if (!excludeKeywords || excludeKeywords.length === 0) return false;
    
    const lowerContent = this.content.toLowerCase();
    return excludeKeywords.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
  }

  /**
   * 检查是否满足最小点赞数要求
   */
  meetsMinLikeCount(minLikeCount: number): boolean {
    if (this.likeCount === null) return false;
    return this.likeCount >= minLikeCount;
  }

  /**
   * 检查是否在指定时间窗口内
   */
  isWithinTimeWindow(windowHours: number): boolean {
    const now = new Date();
    const diffHours = (now.getTime() - this.publishTime.getTime()) / (1000 * 60 * 60);
    return diffHours <= windowHours;
  }

  /**
   * 检查是否匹配地域过滤
   */
  matchesRegionFilter(regions: RegionTag[]): boolean {
    if (!regions || regions.length === 0) return true; // 无地域过滤时通过
    if (!this.region) return false; // 评论无地域信息时不通过
    
    return regions.includes(this.region);
  }

  /**
   * 生成去重键（用于评论级查重）
   */
  generateDedupKey(): string {
    const crypto = require('crypto');
    const input = `${this.platform}:${this.id}`;
    return crypto.createHash('sha1').update(input).digest('hex');
  }

  /**
   * 生成用户级去重键（用于用户级查重）
   */
  generateUserDedupKey(): string {
    const crypto = require('crypto');
    const input = `${this.platform}:${this.authorId}`;
    return crypto.createHash('sha1').update(input).digest('hex');
  }

  /**
   * 检查是否为疑似垃圾评论
   */
  isLikelySpam(): boolean {
    const content = this.content.toLowerCase();
    
    // 简单的垃圾评论检测规则
    const spamIndicators = [
      content.length < 2, // 过短
      /^[^a-z\u4e00-\u9fa5]*$/.test(content), // 只包含特殊字符
      content === '👍', // 单纯表情
      content === '666',
      content === '好',
      content === '赞',
    ];
    
    return spamIndicators.some(indicator => indicator === true);
  }

  /**
   * 提取评论的情感倾向
   */
  getSentiment(): 'positive' | 'neutral' | 'negative' {
    const content = this.content.toLowerCase();
    
    const positiveWords = ['好', '棒', '赞', '优秀', '厉害', '不错', '喜欢', '爱了', '太棒了'];
    const negativeWords = ['差', '烂', '垃圾', '骗人', '假的', '不行', '失望', '坑'];
    
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (content.includes(word) ? 1 : 0), 0);
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (content.includes(word) ? 1 : 0), 0);
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * 检查是否适合生成回复任务
   */
  isEligibleForReplyTask(criteria: {
    keywords: string[];
    excludeKeywords?: string[];
    minLikeCount?: number;
    timeWindowHours?: number;
    regions?: RegionTag[];
  }): boolean {
    // 检查关键词匹配
    if (!this.containsKeywords(criteria.keywords)) {
      return false;
    }
    
    // 检查排除关键词
    if (criteria.excludeKeywords && this.containsExcludeKeywords(criteria.excludeKeywords)) {
      return false;
    }
    
    // 检查最小点赞数
    if (criteria.minLikeCount && !this.meetsMinLikeCount(criteria.minLikeCount)) {
      return false;
    }
    
    // 检查时间窗口
    if (criteria.timeWindowHours && !this.isWithinTimeWindow(criteria.timeWindowHours)) {
      return false;
    }
    
    // 检查地域过滤
    if (criteria.regions && !this.matchesRegionFilter(criteria.regions)) {
      return false;
    }
    
    // 排除疑似垃圾评论
    if (this.isLikelySpam()) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查是否适合生成关注任务
   */
  isEligibleForFollowTask(criteria: {
    minLikeCount?: number;
    timeWindowHours?: number;
    regions?: RegionTag[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  }): boolean {
    // 检查最小点赞数（关注任务通常要求更高的互动）
    if (criteria.minLikeCount && !this.meetsMinLikeCount(criteria.minLikeCount)) {
      return false;
    }
    
    // 检查时间窗口
    if (criteria.timeWindowHours && !this.isWithinTimeWindow(criteria.timeWindowHours)) {
      return false;
    }
    
    // 检查地域过滤
    if (criteria.regions && !this.matchesRegionFilter(criteria.regions)) {
      return false;
    }
    
    // 检查情感倾向
    if (criteria.sentiment && this.getSentiment() !== criteria.sentiment) {
      return false;
    }
    
    // 排除疑似垃圾评论
    if (this.isLikelySpam()) {
      return false;
    }
    
    return true;
  }

  /**
   * 获取业务标识符（用于日志和显示）
   */
  getBusinessId(): string {
    const shortId = this.id ? this.id.substring(0, 8) : 'new';
    return `${this.platform}:comment:${shortId}`;
  }

  /**
   * 获取显示摘要
   */
  getDisplaySummary(maxLength: number = 50): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + '...';
  }

  /**
   * 检查评论是否过期（对于任务生成的时效性）
   */
  isExpired(maxAgeHours: number = 72): boolean {
    const now = new Date();
    const ageHours = (now.getTime() - this.publishTime.getTime()) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  }

  /**
   * 生成文本指纹桶（用于去重）
   * 将评论内容按语义分片，生成多个hash桶用于模糊去重
   */
  generateTextFingerprintBuckets(): string[] {
    const crypto = require('crypto');
    const content = this.content.trim().toLowerCase();
    
    if (content.length < 5) {
      // 短内容直接生成单个hash
      return [crypto.createHash('md5').update(content).digest('hex')];
    }
    
    const buckets: string[] = [];
    const windowSize = Math.max(10, Math.floor(content.length / 3)); // 动态窗口大小
    
    // 滑动窗口生成多个文本片段hash
    for (let i = 0; i <= content.length - windowSize; i += Math.floor(windowSize / 2)) {
      const fragment = content.substring(i, i + windowSize);
      const hash = crypto.createHash('md5').update(fragment).digest('hex');
      buckets.push(hash);
    }
    
    // 去除重复hash
    return [...new Set(buckets)];
  }

  /**
   * 转换为数据库行格式
   */
  toDatabaseRow(): {
    id?: string;
    platform: string;
    video_id: string;
    author_id: string;
    content: string;
    like_count: number | null;
    publish_time: string;
    region: string | null;
    source_target_id: string;
    inserted_at?: string;
  } {
    return {
      ...(this.id && { id: this.id }),
      platform: this.platform,
      video_id: this.videoId,
      author_id: this.authorId,
      content: this.content,
      like_count: this.likeCount,
      publish_time: this.publishTime.toISOString(),
      region: this.region,
      source_target_id: this.sourceTargetId,
      ...(this.insertedAt && { inserted_at: this.insertedAt.toISOString() })
    };
  }
}