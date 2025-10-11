// src/application/services/comment-collection/PublicWhitelistAdapter.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 公开白名单评论采集适配器
 * 
 * 基于公开API和合规白名单实现公共资源的评论采集
 * 严格遵守robots.txt和平台服务条款
 */

import { 
  Platform, 
  TargetType, 
  IndustryTag, 
  RegionTag,
  WatchTarget, 
  Comment
} from '../../../modules/precise-acquisition/shared/types/core';

// 导入统一接口
import { 
  UnifiedCommentAdapter,
  UnifiedAdapterStatus,
  UnifiedCommentCollectionParams,
  UnifiedCommentCollectionResult,
  UnifiedPermissionValidationResult
} from './UnifiedCommentAdapter';

// ==================== 白名单配置 ====================

export interface PublicWhitelistConfig {
  allowed_domains: string[];
  robots_txt_compliance: boolean;
  rate_limit_per_minute: number;
  user_agent: string;
  api_keys?: Record<string, string>; // 平台名 -> API Key
}

// ==================== 白名单采集规则 ====================

interface WhitelistRule {
  domain: string;
  platform: Platform;
  max_requests_per_minute: number;
  requires_api_key: boolean;
  api_endpoint?: string;
  data_format: 'json' | 'xml' | 'html';
  comment_selector: string; // CSS选择器或API字段路径
  pagination_type: 'offset' | 'cursor' | 'page';
  robots_txt_url: string;
}

interface RobotsTxtRules {
  allowed_paths: string[];
  disallowed_paths: string[];
  crawl_delay: number;
  last_updated: Date;
}

interface PublicCommentData {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  likes?: number;
  replies?: number;
  location?: string;
  source_url: string;
}

// ==================== 公开白名单适配器 ====================

export class PublicWhitelistAdapter implements UnifiedCommentAdapter {
  private config: PublicWhitelistConfig;
  private whitelistRules: Map<string, WhitelistRule> = new Map();
  private robotsCache: Map<string, RobotsTxtRules> = new Map();
  private rateLimitTracker: Map<string, Date[]> = new Map();

  constructor(config: PublicWhitelistConfig) {
    this.config = config;
    this.initializeWhitelistRules();
  }

  /**
   * 获取适配器平台类型
   */
  getPlatform(): Platform {
    return Platform.PUBLIC;
  }

  /**
   * 根据URL查找匹配的白名单规则
   */
  private findMatchingRule(url: string): WhitelistRule | null {
    try {
      const domain = new URL(url).hostname;
      return this.whitelistRules.get(domain) || null;
    } catch (error) {
      console.error('Invalid URL format:', url);
      return null;
    }
  }

  /**
   * 获取适配器状态
   */
  async getStatus(): Promise<UnifiedAdapterStatus> {
    try {
      const validDomains = await this.validateWhitelistDomains();
      const robotsCompliance = await this.checkRobotsCompliance();

      if (validDomains === 0) {
        return {
          platform: this.getPlatform(),
          available: false,
          auth_status: 'invalid',
          last_error: 'No valid domains in whitelist'
        };
      }

      if (this.config.robots_txt_compliance && !robotsCompliance) {
        return {
          platform: this.getPlatform(),
          available: false,
          auth_status: 'invalid',
          last_error: 'Robots.txt compliance check failed'
        };
      }

      return {
        platform: this.getPlatform(),
        available: true,
        auth_status: 'authenticated',
        last_error: undefined
      };
    } catch (error) {
      return {
        platform: this.getPlatform(),
        available: false,
        auth_status: 'invalid',
        last_error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 检查目标是否支持
   */
  isTargetSupported(target: WatchTarget): boolean {
    // 从URL提取域名
    const domain = this.extractDomain(target.platform_id_or_url);
    if (!domain) return false;

    // 检查是否在白名单中
    if (!this.config.allowed_domains.includes(domain)) return false;

    // 检查是否有对应的采集规则
    return this.whitelistRules.has(domain);
  }

  /**
   * 采集评论
   */
  async collectComments(params: UnifiedCommentCollectionParams): Promise<UnifiedCommentCollectionResult> {
    const { target, limit = 20, cursor, time_range } = params;

    // 验证目标支持
    if (!this.isTargetSupported(target)) {
      throw new Error(`Target not supported or not in whitelist: ${target.platform_id_or_url}`);
    }

    const domain = this.extractDomain(target.platform_id_or_url)!;
    const rule = this.whitelistRules.get(domain)!;

    // 验证权限和合规性
    const permissions = await this.validatePermissionsWithRule(target, rule);
    if (!permissions.canCollect) {
      throw new Error(`Permission denied: ${permissions.reason}`);
    }

    // 检查速率限制
    if (!this.checkRateLimit(domain, rule)) {
      throw new Error('Rate limit exceeded for domain');
    }

    try {
      // 根据数据格式调用不同的采集方法
      let rawComments: PublicCommentData[];
      
      switch (rule.data_format) {
        case 'json':
          rawComments = await this.collectFromAPI(target, rule, { cursor, limit, time_range });
          break;
        case 'html':
          rawComments = await this.collectFromHTML(target, rule, { cursor, limit });
          break;
        case 'xml':
          rawComments = await this.collectFromXML(target, rule, { cursor, limit });
          break;
        default:
          throw new Error(`Unsupported data format: ${rule.data_format}`);
      }

      // 转换为标准格式
      const comments = rawComments.map(comment => 
        this.standardizeComment(comment, target, rule.platform)
      );

      // 更新速率限制跟踪
      this.updateRateLimitTracker(domain);

      const hasMore = rawComments.length === limit;

      return {
        comments,
        has_more: hasMore,
        next_cursor: hasMore ? this.generateNextCursor(rawComments, cursor) : undefined,
        total_count: undefined, // 公开API通常不提供总数
        collected_at: new Date(),
        source_platform: this.getPlatform(),
        target_id: target.id,
        rate_limit_info: this.getRateLimitInfo(domain, rule)
      };

    } catch (error) {
      console.error('[PublicWhitelistAdapter] Failed to collect comments:', error);
      throw new Error(`Failed to collect comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 验证采集权限（CommentAdapter接口兼容版本）
   */
  async validatePermissions(target: WatchTarget): Promise<UnifiedPermissionValidationResult> {
    const rule = this.findMatchingRule(target.platform_id_or_url);
    if (!rule) {
      return {
        canCollect: false,
        reason: 'Target not in whitelist'
      };
    }
    
    return await this.validatePermissionsWithRule(target, rule);
  }

  /**
   * 验证采集权限（带规则参数的内部版本）
   */
  async validatePermissionsWithRule(
    target: WatchTarget, 
    rule: WhitelistRule
  ): Promise<{
    canCollect: boolean;
    reason?: string;
    compliance_status?: string;
  }> {
    try {
      // 检查robots.txt合规性
      if (this.config.robots_txt_compliance) {
        const robotsRules = await this.getRobotsRules(rule.domain);
        const targetPath = new URL(target.platform_id_or_url).pathname;
        
        if (!this.isPathAllowed(targetPath, robotsRules)) {
          return {
            canCollect: false,
            reason: 'Path disallowed by robots.txt',
            compliance_status: 'robots_txt_blocked'
          };
        }
      }

      // 检查API密钥（如果需要）
      if (rule.requires_api_key && !this.config.api_keys?.[rule.domain]) {
        return {
          canCollect: false,
          reason: 'API key required but not configured',
          compliance_status: 'missing_api_key'
        };
      }

      // 检查速率限制
      if (!this.checkRateLimit(rule.domain, rule)) {
        return {
          canCollect: false,
          reason: 'Rate limit would be exceeded',
          compliance_status: 'rate_limited'
        };
      }

      return { 
        canCollect: true, 
        compliance_status: 'compliant' 
      };

    } catch (error) {
      return {
        canCollect: false,
        reason: `Permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        compliance_status: 'check_failed'
      };
    }
  }

  // ==================== 私有方法 - 数据采集 ====================

  /**
   * 从JSON API采集评论
   */
  private async collectFromAPI(
    target: WatchTarget,
    rule: WhitelistRule,
    params: { cursor?: string; limit: number; time_range?: { start: Date; end: Date } }
  ): Promise<PublicCommentData[]> {
    if (!rule.api_endpoint) {
      throw new Error('API endpoint not configured for this domain');
    }

    const url = new URL(rule.api_endpoint);
    
    // 构建查询参数
    const searchParams = new URLSearchParams();
    searchParams.set('target', target.platform_id_or_url);
    searchParams.set('limit', params.limit.toString());
    
    if (params.cursor) {
      searchParams.set('cursor', params.cursor);
    }
    
    if (params.time_range) {
      searchParams.set('start_date', params.time_range.start.toISOString());
      searchParams.set('end_date', params.time_range.end.toISOString());
    }

    url.search = searchParams.toString();

    const headers: Record<string, string> = {
      'User-Agent': this.config.user_agent,
      'Accept': 'application/json'
    };

    // 添加API密钥（如果需要）
    if (rule.requires_api_key && this.config.api_keys?.[rule.domain]) {
      headers['Authorization'] = `Bearer ${this.config.api_keys[rule.domain]}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // 根据不同平台的响应格式解析数据
    return this.parseAPIResponse(data, rule);
  }

  /**
   * 从HTML页面采集评论
   */
  private async collectFromHTML(
    target: WatchTarget,
    rule: WhitelistRule,
    params: { cursor?: string; limit: number }
  ): Promise<PublicCommentData[]> {
    const response = await fetch(target.platform_id_or_url, {
      headers: {
        'User-Agent': this.config.user_agent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`HTML request failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // 注意：在实际生产环境中，应该使用 Tauri 的 HTML 解析能力
    // 这里提供伪代码示例
    return this.parseHTMLComments(html, rule, params.limit);
  }

  /**
   * 从XML数据采集评论
   */
  private async collectFromXML(
    target: WatchTarget,
    rule: WhitelistRule,
    params: { cursor?: string; limit: number }
  ): Promise<PublicCommentData[]> {
    const response = await fetch(target.platform_id_or_url, {
      headers: {
        'User-Agent': this.config.user_agent,
        'Accept': 'application/xml,text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`XML request failed: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    
    // 解析XML数据
    return this.parseXMLComments(xml, rule, params.limit);
  }

  // ==================== 私有方法 - 数据解析 ====================

  /**
   * 解析API响应
   */
  private parseAPIResponse(data: any, rule: WhitelistRule): PublicCommentData[] {
    // 根据不同平台的API格式解析数据
    // 这里需要针对每个白名单平台定制解析逻辑
    
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeCommentData(item, rule));
    }
    
    if (data.comments && Array.isArray(data.comments)) {
      return data.comments.map((item: any) => this.normalizeCommentData(item, rule));
    }
    
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => this.normalizeCommentData(item, rule));
    }
    
    return [];
  }

  /**
   * 解析HTML评论
   */
  private parseHTMLComments(html: string, rule: WhitelistRule, limit: number): PublicCommentData[] {
    // 注意：这是简化的伪代码实现
    // 在实际生产环境中，应该使用 Tauri 的后端进行 HTML 解析
    
    const comments: PublicCommentData[] = [];
    
    // 使用正则表达式或DOM解析提取评论
    // 这里仅作为示例，实际实现需要根据具体网站结构调整
    
    return comments.slice(0, limit);
  }

  /**
   * 解析XML评���
   */
  private parseXMLComments(xml: string, rule: WhitelistRule, limit: number): PublicCommentData[] {
    // XML解析逻辑
    const comments: PublicCommentData[] = [];
    
    // 实际实现需要XML解析器
    
    return comments.slice(0, limit);
  }

  /**
   * 标准化评论数据
   */
  private normalizeCommentData(rawData: any, rule: WhitelistRule): PublicCommentData {
    return {
      id: rawData.id || rawData.comment_id || this.generateId(),
      content: rawData.content || rawData.text || rawData.message || '',
      author: rawData.author || rawData.user || rawData.username || 'Anonymous',
      timestamp: rawData.timestamp || rawData.created_at || rawData.date || new Date().toISOString(),
      likes: rawData.likes || rawData.like_count || 0,
      replies: rawData.replies || rawData.reply_count || 0,
      location: rawData.location || rawData.city || rawData.region,
      source_url: rawData.url || ''
    };
  }

  // ==================== 私有方法 - 合规性检查 ====================

  /**
   * 获取robots.txt规则
   */
  private async getRobotsRules(domain: string): Promise<RobotsTxtRules> {
    // 检查缓存
    if (this.robotsCache.has(domain)) {
      const cached = this.robotsCache.get(domain)!;
      // 如果缓存时间超过24小时，重新获取
      if (Date.now() - cached.last_updated.getTime() < 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.config.user_agent }
      });

      if (!response.ok) {
        // 如果没有robots.txt，默认允许所有路径
        const defaultRules: RobotsTxtRules = {
          allowed_paths: ['*'],
          disallowed_paths: [],
          crawl_delay: 1,
          last_updated: new Date()
        };
        this.robotsCache.set(domain, defaultRules);
        return defaultRules;
      }

      const robotsText = await response.text();
      const rules = this.parseRobotsTxt(robotsText);
      this.robotsCache.set(domain, rules);
      
      return rules;
    } catch {
      // 出错时返回保守的默认规则
      const defaultRules: RobotsTxtRules = {
        allowed_paths: [],
        disallowed_paths: ['*'],
        crawl_delay: 5,
        last_updated: new Date()
      };
      return defaultRules;
    }
  }

  /**
   * 解析robots.txt内容
   */
  private parseRobotsTxt(robotsText: string): RobotsTxtRules {
    const lines = robotsText.split('\n').map(line => line.trim());
    const rules: RobotsTxtRules = {
      allowed_paths: [],
      disallowed_paths: [],
      crawl_delay: 1,
      last_updated: new Date()
    };

    let isRelevantUserAgent = false;

    for (const line of lines) {
      if (line.startsWith('#') || line === '') continue;

      if (line.toLowerCase().startsWith('user-agent:')) {
        const userAgent = line.substring(11).trim();
        isRelevantUserAgent = userAgent === '*' || 
          this.config.user_agent.toLowerCase().includes(userAgent.toLowerCase());
        continue;
      }

      if (!isRelevantUserAgent) continue;

      if (line.toLowerCase().startsWith('disallow:')) {
        const path = line.substring(9).trim();
        if (path) rules.disallowed_paths.push(path);
      }

      if (line.toLowerCase().startsWith('allow:')) {
        const path = line.substring(6).trim();
        if (path) rules.allowed_paths.push(path);
      }

      if (line.toLowerCase().startsWith('crawl-delay:')) {
        const delay = parseInt(line.substring(12).trim());
        if (!isNaN(delay)) rules.crawl_delay = delay;
      }
    }

    return rules;
  }

  /**
   * 检查路径是否被robots.txt允许
   */
  private isPathAllowed(path: string, robotsRules: RobotsTxtRules): boolean {
    // 首先检查显式允许的路径
    for (const allowedPath of robotsRules.allowed_paths) {
      if (this.matchesPattern(path, allowedPath)) {
        return true;
      }
    }

    // 然后检查禁止的路径
    for (const disallowedPath of robotsRules.disallowed_paths) {
      if (this.matchesPattern(path, disallowedPath)) {
        return false;
      }
    }

    // 默认允许
    return true;
  }

  /**
   * 检查路径是否匹配模式
   */
  private matchesPattern(path: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === '/') return path === '/';
    
    // 简单的通配符匹配
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}`).test(path);
  }

  // ==================== 私有方法 - 速率限制 ====================

  /**
   * 检查速率限制
   */
  private checkRateLimit(domain: string, rule: WhitelistRule): boolean {
    const now = new Date();
    const requests = this.rateLimitTracker.get(domain) || [];
    
    // 移除超过1分钟的请求记录
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentRequests = requests.filter(requestTime => requestTime > oneMinuteAgo);
    
    // 检查是否超过限制
    return recentRequests.length < rule.max_requests_per_minute;
  }

  /**
   * 更新速率限制跟踪
   */
  private updateRateLimitTracker(domain: string): void {
    const now = new Date();
    const requests = this.rateLimitTracker.get(domain) || [];
    requests.push(now);
    this.rateLimitTracker.set(domain, requests);
  }

  /**
   * 获取速率限制信息
   */
  private getRateLimitInfo(domain: string, rule: WhitelistRule): {
    remaining: number;
    reset_time: Date;
  } {
    const requests = this.rateLimitTracker.get(domain) || [];
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentRequests = requests.filter(requestTime => requestTime > oneMinuteAgo);
    
    return {
      remaining: Math.max(0, rule.max_requests_per_minute - recentRequests.length),
      reset_time: new Date(Date.now() + 60 * 1000)
    };
  }

  // ==================== 私有方法 - 工具函数 ====================

  /**
   * 标准化评论数据为系统格式
   */
  private standardizeComment(rawComment: PublicCommentData, target: WatchTarget, platform: Platform): Comment {
    return {
      id: `${platform.toLowerCase()}_${rawComment.id}`,
      platform,
      video_id: this.extractVideoId(target.platform_id_or_url),
      author_id: rawComment.author,
      content: rawComment.content,
      like_count: rawComment.likes || 0,
      publish_time: new Date(rawComment.timestamp),
      region: this.mapLocationToRegion(rawComment.location),
      source_target_id: target.id,
      inserted_at: new Date()
    };
  }

  /**
   * 从URL提取域名
   */
  private extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  /**
   * 从URL提取视频ID
   */
  private extractVideoId(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || urlObj.hash.substring(1) || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * 将位置信息映射到地域标签
   */
  private mapLocationToRegion(location?: string): RegionTag | undefined {
    if (!location) return undefined;

    const locationMappings: Record<string, RegionTag> = {
      '北京': RegionTag.BEIJING,
      '上海': RegionTag.SHANGHAI,
      '广东': RegionTag.GUANGDONG,
      '浙江': RegionTag.ZHEJIANG,
      '江苏': RegionTag.JIANGSU,
      '山东': RegionTag.SHANDONG,
      '四川': RegionTag.SICHUAN,
    };

    for (const [key, region] of Object.entries(locationMappings)) {
      if (location.includes(key)) {
        return region;
      }
    }

    return undefined;
  }

  /**
   * 生成下一页游标
   */
  private generateNextCursor(comments: PublicCommentData[], currentCursor?: string): string {
    if (comments.length === 0) return '';
    
    const lastComment = comments[comments.length - 1];
    return lastComment.id || lastComment.timestamp;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `pub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // ==================== 私有方法 - 初始化 ====================

  /**
   * 初始化白名单规则
   */
  private initializeWhitelistRules(): void {
    // 示例白名单规则 - 实际使用时需要根据具体平台配置
    const rules: WhitelistRule[] = [
      {
        domain: 'example-blog.com',
        platform: Platform.PUBLIC,
        max_requests_per_minute: 30,
        requires_api_key: false,
        data_format: 'html',
        comment_selector: '.comment-content',
        pagination_type: 'page',
        robots_txt_url: 'https://example-blog.com/robots.txt'
      },
      {
        domain: 'api.example.com',
        platform: Platform.PUBLIC,
        max_requests_per_minute: 60,
        requires_api_key: true,
        api_endpoint: 'https://api.example.com/v1/comments',
        data_format: 'json',
        comment_selector: 'data.comments',
        pagination_type: 'cursor',
        robots_txt_url: 'https://api.example.com/robots.txt'
      }
    ];

    for (const rule of rules) {
      this.whitelistRules.set(rule.domain, rule);
    }
  }

  /**
   * 验证白名单域名
   */
  private async validateWhitelistDomains(): Promise<number> {
    let validCount = 0;
    
    for (const domain of this.config.allowed_domains) {
      if (this.whitelistRules.has(domain)) {
        validCount++;
      }
    }
    
    return validCount;
  }

  /**
   * 检查robots.txt合规性
   */
  private async checkRobotsCompliance(): Promise<boolean> {
    try {
      for (const domain of this.config.allowed_domains) {
        const robotsRules = await this.getRobotsRules(domain);
        
        // 检查是否有任何路径被完全禁止
        if (robotsRules.disallowed_paths.includes('*')) {
          console.warn(`Domain ${domain} disallows all crawling`);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  // ==================== 公共方法 ====================

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PublicWhitelistConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 添加白名单域名
   */
  addWhitelistDomain(domain: string, rule: WhitelistRule): void {
    this.config.allowed_domains.push(domain);
    this.whitelistRules.set(domain, rule);
  }

  /**
   * 移除白名单域名
   */
  removeWhitelistDomain(domain: string): void {
    this.config.allowed_domains = this.config.allowed_domains.filter(d => d !== domain);
    this.whitelistRules.delete(domain);
    this.robotsCache.delete(domain);
    this.rateLimitTracker.delete(domain);
  }

  /**
   * 获取支持的平台列表
   */
  getSupportedPlatforms(): Platform[] {
    const platforms = new Set<Platform>();
    for (const rule of this.whitelistRules.values()) {
      platforms.add(rule.platform);
    }
    return Array.from(platforms);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.robotsCache.clear();
    this.rateLimitTracker.clear();
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建公开白名单适配器实例
 */
export function createPublicWhitelistAdapter(config: PublicWhitelistConfig): PublicWhitelistAdapter {
  return new PublicWhitelistAdapter(config);
}

// ==================== 配置验证 ====================

/**
 * 验证公开白名单配置
 */
export function validatePublicWhitelistConfig(config: Partial<PublicWhitelistConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.allowed_domains || config.allowed_domains.length === 0) {
    errors.push('allowed_domains is required and cannot be empty');
  }

  if (config.rate_limit_per_minute !== undefined && config.rate_limit_per_minute <= 0) {
    errors.push('rate_limit_per_minute must be greater than 0');
  }

  if (!config.user_agent || config.user_agent.trim() === '') {
    errors.push('user_agent is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==================== 默认配置 ====================

/**
 * 获取默认公开白名单配置
 */
export function getDefaultPublicWhitelistConfig(): PublicWhitelistConfig {
  return {
    allowed_domains: [],
    robots_txt_compliance: true,
    rate_limit_per_minute: 30,
    user_agent: 'MarketingAutomation/1.0 (+https://example.com/bot)'
  };
}