// src/domain/precise-acquisition/entities/WatchTarget.ts
// module: domain | layer: domain | role: entity
// summary: 实体定义

/**
 * 精准获客领域模型 - 候选池实体
 * 
 * 遵循 DDD 架构，封装业务逻辑和验证规则
 */

import {
  Platform,
  TargetType,
  SourceType,
  RegionTag,
  validatePlatform,
  validateTargetType,
  validateSourceType,
  validateIndustryTags,
  validateRegionTag,
  parseIndustryTags,
  formatIndustryTags,
} from '../../../constants/precise-acquisition-enums';
import type { IndustryTag } from '../../../constants/precise-acquisition-enums';

/**
 * 候选池实体
 * 
 * 代表一个监控目标（账号或视频），包含所有业务规则和验证逻辑
 */
export class WatchTarget {
  private constructor(
    public readonly id: number | null,
    public readonly dedupKey: string,
    public readonly targetType: TargetType,
    public readonly platform: Platform,
    public readonly idOrUrl: string,
    public readonly title: string | null,
    public readonly source: SourceType | null,
    public readonly industryTags: IndustryTag[],
    public readonly region: RegionTag | null,
    public readonly notes: string | null,
    public readonly createdAt: Date | null,
    public readonly updatedAt: Date | null,
  ) {}

  /**
   * 创建新的候选池实体（用于新增）
   */
  static create(params: {
    targetType: TargetType;
    platform: Platform;
    idOrUrl: string;
    title?: string;
    source?: SourceType;
    industryTags?: IndustryTag[];
    region?: RegionTag;
    notes?: string;
  }): WatchTarget {
    // 验证必填字段
    if (!params.targetType || !params.platform || !params.idOrUrl) {
      throw new Error('targetType, platform, idOrUrl are required');
    }

    // 验证枚举值
    if (!validateTargetType(params.targetType)) {
      throw new Error(`Invalid targetType: ${params.targetType}`);
    }
    if (!validatePlatform(params.platform)) {
      throw new Error(`Invalid platform: ${params.platform}`);
    }
    if (params.source && !validateSourceType(params.source)) {
      throw new Error(`Invalid source: ${params.source}`);
    }
    if (params.region && !validateRegionTag(params.region)) {
      throw new Error(`Invalid region: ${params.region}`);
    }

    // 验证URL格式（如果是URL）
    if (params.idOrUrl.startsWith('http')) {
      try {
        new URL(params.idOrUrl);
      } catch {
        throw new Error(`Invalid URL format: ${params.idOrUrl}`);
      }
    }

    // 生成去重键
    const dedupKey = this.generateDedupKey(params.platform, params.idOrUrl);

    return new WatchTarget(
      null, // 新创建时ID为null
      dedupKey,
      params.targetType,
      params.platform,
      params.idOrUrl,
      params.title || null,
      params.source || null,
      params.industryTags || [],
      params.region || null,
      params.notes || null,
      null, // 创建时间由数据库设置
      null, // 更新时间由数据库设置
    );
  }

  /**
   * 从数据库行数据重建实体
   */
  static fromDatabaseRow(row: {
    id: number;
    dedup_key: string;
    target_type: string;
    platform: string;
    id_or_url: string;
    title?: string;
    source?: string;
    industry_tags?: string;
    region?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }): WatchTarget {
    return new WatchTarget(
      row.id,
      row.dedup_key,
      row.target_type as TargetType,
      row.platform as Platform,
      row.id_or_url,
      row.title || null,
      row.source as SourceType || null,
      row.industry_tags ? parseIndustryTags(row.industry_tags) : [],
      row.region as RegionTag || null,
      row.notes || null,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  /**
   * 转换为数据库载荷格式
   */
  toDatabasePayload(): {
    dedup_key: string;
    target_type: string;
    platform: string;
    id_or_url: string;
    title?: string;
    source?: string;
    industry_tags?: string;
    region?: string;
    notes?: string;
  } {
    return {
      dedup_key: this.dedupKey,
      target_type: this.targetType,
      platform: this.platform,
      id_or_url: this.idOrUrl,
      title: this.title || undefined,
      source: this.source || undefined,
      industry_tags: this.industryTags.length > 0 ? formatIndustryTags(this.industryTags) : undefined,
      region: this.region || undefined,
      notes: this.notes || undefined,
    };
  }

  /**
   * 生成去重键
   */
  private static generateDedupKey(platform: Platform, idOrUrl: string): string {
    const crypto = require('crypto');
    const input = `${platform}:${idOrUrl}`;
    return crypto.createHash('sha1').update(input).digest('hex');
  }

  /**
   * 检查是否可以拉取评论
   */
  canFetchComments(): boolean {
    // 根据合规三步法，只有授权的抖音账号/视频、巨量引擎广告内容、或白名单公开内容可以拉取评论
    switch (this.platform) {
      case Platform.DOUYIN:
        return this.source === SourceType.MANUAL || this.source === SourceType.CSV;
      case Platform.OCEANENGINE:
        return this.source === SourceType.ADS;
      case Platform.PUBLIC:
        return this.source === SourceType.WHITELIST;
      default:
        return false;
    }
  }

  /**
   * 检查是否在白名单中（对于公开来源）
   */
  isInWhitelist(whitelistEntries: string[]): boolean {
    if (this.platform !== Platform.PUBLIC) {
      return true; // 非公开来源不需要白名单验证
    }
    
    return whitelistEntries.some(entry => this.idOrUrl.includes(entry));
  }

  /**
   * 获取显示名称
   */
  getDisplayName(): string {
    if (this.title) {
      return this.title;
    }
    
    // 从URL提取显示名称
    if (this.idOrUrl.startsWith('http')) {
      try {
        const url = new URL(this.idOrUrl);
        return url.hostname + url.pathname;
      } catch {
        return this.idOrUrl;
      }
    }
    
    return this.idOrUrl;
  }

  /**
   * 检查是否需要更新
   */
  needsUpdate(hours: number = 24): boolean {
    if (!this.updatedAt) return true;
    
    const now = new Date();
    const diffHours = (now.getTime() - this.updatedAt.getTime()) / (1000 * 60 * 60);
    return diffHours >= hours;
  }

  /**
   * 获取业务标识符（用于日志和显示）
   */
  getBusinessId(): string {
    return `${this.platform}:${this.targetType}:${this.dedupKey.substring(0, 8)}`;
  }

  /**
   * 验证更新参数
   */
  static validateUpdateParams(params: {
    title?: string;
    industryTags?: IndustryTag[];
    region?: RegionTag;
    notes?: string;
  }): void {
    if (params.region && !validateRegionTag(params.region)) {
      throw new Error(`Invalid region: ${params.region}`);
    }
    
    if (params.industryTags) {
      const tagsString = formatIndustryTags(params.industryTags);
      if (!validateIndustryTags(params.industryTags)) {
        throw new Error(`Invalid industry tags: ${tagsString}`);
      }
    }
  }

  /**
   * 创建更新副本
   */
  withUpdates(updates: {
    title?: string;
    industryTags?: IndustryTag[];
    region?: RegionTag;
    notes?: string;
  }): WatchTarget {
    WatchTarget.validateUpdateParams(updates);
    
    return new WatchTarget(
      this.id,
      this.dedupKey,
      this.targetType,
      this.platform,
      this.idOrUrl,
      updates.title !== undefined ? updates.title : this.title,
      this.source,
      updates.industryTags !== undefined ? updates.industryTags : this.industryTags,
      updates.region !== undefined ? updates.region : this.region,
      updates.notes !== undefined ? updates.notes : this.notes,
      this.createdAt,
      new Date(), // 更新时间设为当前时间
    );
  }

  /**
   * 检查是否与另一个目标重复
   */
  isDuplicateOf(other: WatchTarget): boolean {
    return this.dedupKey === other.dedupKey;
  }

  /**
   * 获取合规检查信息
   */
  getComplianceInfo(): {
    isCompliant: boolean;
    reason?: string;
    requirements?: string[];
  } {
    const requirements: string[] = [];
    
    switch (this.platform) {
      case Platform.DOUYIN:
        requirements.push('必须是已授权账号下的内容');
        if (this.source !== SourceType.MANUAL && this.source !== SourceType.CSV) {
          return {
            isCompliant: false,
            reason: '抖音平台只允许手动添加或CSV导入的授权内容',
            requirements,
          };
        }
        break;
        
      case Platform.OCEANENGINE:
        requirements.push('必须是广告资产下的内容');
        if (this.source !== SourceType.ADS) {
          return {
            isCompliant: false,
            reason: '巨量引擎平台只允许广告回流的内容',
            requirements,
          };
        }
        break;
        
      case Platform.PUBLIC:
        requirements.push('必须是白名单允许的公开内容');
        if (this.source !== SourceType.WHITELIST) {
          return {
            isCompliant: false,
            reason: '公开平台只允许白名单来源的内容',
            requirements,
          };
        }
        break;
    }
    
    return { isCompliant: true, requirements };
  }
}