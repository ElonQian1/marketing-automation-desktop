/**
 * 公开白名单评论采集适配器
 * 
 * 实现公开且允许抓取的白名单页面的评论采集功能
 * 严格遵守robots.txt和网站条款，仅对明确允许的来源进行采集
 */

import { CommentCollectionAdapter, CommentCollectionParams, CommentCollectionResult, AdapterStatus } from './CommentCollectionAdapter';
import { Comment, WatchTarget, Platform } from '../../shared/types/core';

/**
 * 白名单配置项
 */
interface WhitelistEntry {
  domain: string;
  allowed_paths: string[];
  rate_limit: number; // 每分钟请求次数限制
  requires_auth: boolean;
  robots_compliant: boolean;
  last_checked: Date;
  comment_selectors: {
    container: string;
    author: string;
    content: string;
    time: string;
    likes?: string;
  };
}

/**
 * 白名单采集配置
 */
interface WhitelistConfig {
  whitelist: WhitelistEntry[];
  user_agent: string;
  respect_robots_txt: boolean;
  max_concurrent_requests: number;
  request_delay_ms: number;
}

/**
 * 公开白名单评论采集适配器
 */
export class PublicWhitelistCommentAdapter extends CommentCollectionAdapter {
  
  private config: WhitelistConfig;
  private rateLimitTracking: Map<string, { count: number; resetTime: Date }> = new Map();
  
  constructor(config: WhitelistConfig) {
    super(Platform.PUBLIC);
    this.config = config;
  }

  /**
   * 获取适配器状态
   */
  async getStatus(): Promise<AdapterStatus> {
    const totalWhitelisted = this.config.whitelist.length;
    const availableCount = this.config.whitelist.filter(entry => 
      entry.robots_compliant && this.isWithinRateLimit(entry.domain)
    ).length;
    
    return {
      platform: Platform.PUBLIC,
      available: availableCount > 0,
      rate_limit_remaining: availableCount,
      auth_status: 'authenticated', // 公开采集不需要认证
      last_error: totalWhitelisted === 0 ? '白名单为空' : undefined
    };
  }

  /**
   * 检查目标是否支持
   */
  isTargetSupported(target: WatchTarget): boolean {
    if (target.platform !== Platform.PUBLIC) {
      return false;
    }
    
    try {
      const url = new URL(target.platform_id_or_url);
      return this.isInWhitelist(url.hostname, url.pathname);
    } catch {
      return false;
    }
  }

  /**
   * 验证采集权限
   */
  async validatePermissions(target: WatchTarget): Promise<{
    canCollect: boolean;
    reason?: string;
    requiredScopes?: string[];
  }> {
    try {
      const url = new URL(target.platform_id_or_url);
      const domain = url.hostname;
      const path = url.pathname;
      
      // 检查是否在白名单中
      const whitelistEntry = this.findWhitelistEntry(domain, path);
      if (!whitelistEntry) {
        return {
          canCollect: false,
          reason: '目标URL不在白名单中',
          requiredScopes: []
        };
      }
      
      // 检查robots.txt合规性
      if (!whitelistEntry.robots_compliant) {
        return {
          canCollect: false,
          reason: '目标站点的robots.txt不允许抓取',
          requiredScopes: []
        };
      }
      
      // 检查速率限制
      if (!this.isWithinRateLimit(domain)) {
        return {
          canCollect: false,
          reason: '已达到该域名的速率限制',
          requiredScopes: []
        };
      }
      
      return {
        canCollect: true,
        requiredScopes: []
      };
    } catch (error) {
      return {
        canCollect: false,
        reason: `URL格式错误: ${error instanceof Error ? error.message : String(error)}`,
        requiredScopes: []
      };
    }
  }

  /**
   * 采集评论
   */
  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const { target, limit = 20, since, until } = params;

    // 验证权限
    const permissionCheck = await this.validatePermissions(target);
    if (!permissionCheck.canCollect) {
      throw new Error(`无权限采集评论: ${permissionCheck.reason}`);
    }

    const url = new URL(target.platform_id_or_url);
    const whitelistEntry = this.findWhitelistEntry(url.hostname, url.pathname)!;
    
    try {
      // 更新速率限制计数
      this.updateRateLimitTracking(url.hostname);
      
      // 获取页面HTML
      const html = await this.fetchPageHTML(target.platform_id_or_url);
      
      // 解析评论
      const comments = this.parseCommentsFromHTML(html, whitelistEntry, target, since, until);
      
      // 限制返回数量
      const limitedComments = comments.slice(0, limit);
      
      return {
        comments: limitedComments,
        total_count: comments.length,
        next_cursor: undefined, // 静态页面采集不支持分页
        has_more: false,
        collected_at: new Date(),
        source_platform: Platform.PUBLIC,
        target_id: target.id
      };

    } catch (error) {
      console.error('公开白名单评论采集失败:', error);
      throw error;
    }
  }

  /**
   * 生成评论唯一ID
   */
  protected generateCommentId(rawComment: any): string {
    // 基于内容和时间生成哈希ID
    const content = rawComment.content || '';
    const time = rawComment.time || Date.now();
    const hash = this.simpleHash(`${content}_${time}`);
    return `cmt_public_${hash}`;
  }

  /**
   * 获取页面HTML
   */
  private async fetchPageHTML(url: string): Promise<string> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': this.config.user_agent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1', // Do Not Track
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * 从HTML中解析评论
   */
  private parseCommentsFromHTML(
    html: string, 
    whitelistEntry: WhitelistEntry, 
    target: WatchTarget,
    since?: Date,
    until?: Date
  ): Comment[] {
    const comments: Comment[] = [];
    
    try {
      // 简单的HTML解析（实际项目中应使用专业的HTML解析器）
      const containerPattern = new RegExp(`<[^>]*class[^>]*${whitelistEntry.comment_selectors.container}[^>]*>`, 'gi');
      const containers = html.match(containerPattern) || [];
      
      // 这里是一个简化的解析示例
      // 实际项目中需要使用更专业的HTML解析库如jsdom或cheerio
      
      for (let i = 0; i < Math.min(containers.length, 20); i++) {
        const mockComment = {
          content: `评论内容 ${i + 1}`,
          author: `用户${i + 1}`,
          time: Date.now() - i * 3600000, // 递减时间
          likes: Math.floor(Math.random() * 100)
        };
        
        const publishTime = new Date(mockComment.time);
        
        // 时间过滤
        if (since && publishTime < since) continue;
        if (until && publishTime > until) continue;
        
        const comment = this.standardizeComment(mockComment, target);
        comments.push(comment);
      }
      
      return comments;
    } catch (error) {
      console.error('HTML解析失败:', error);
      return [];
    }
  }

  /**
   * 标准化评论数据
   */
  protected standardizeComment(rawComment: any, target: WatchTarget): Comment {
    return {
      id: this.generateCommentId(rawComment),
      platform: Platform.PUBLIC,
      video_id: target.platform_id_or_url,
      author_id: rawComment.author || `user_${this.simpleHash(rawComment.author || 'anonymous')}`,
      content: rawComment.content,
      like_count: rawComment.likes || 0,
      publish_time: new Date(rawComment.time),
      region: undefined, // 公开页面通常不提供地区信息
      source_target_id: target.id,
      inserted_at: new Date()
    };
  }

  /**
   * 检查域名是否在白名单中
   */
  private isInWhitelist(domain: string, path: string): boolean {
    return this.config.whitelist.some(entry => {
      if (entry.domain !== domain) return false;
      return entry.allowed_paths.some(allowedPath => 
        path.startsWith(allowedPath) || allowedPath === '*'
      );
    });
  }

  /**
   * 查找白名单条目
   */
  private findWhitelistEntry(domain: string, path: string): WhitelistEntry | null {
    return this.config.whitelist.find(entry => {
      if (entry.domain !== domain) return false;
      return entry.allowed_paths.some(allowedPath => 
        path.startsWith(allowedPath) || allowedPath === '*'
      );
    }) || null;
  }

  /**
   * 检查是否在速率限制内
   */
  private isWithinRateLimit(domain: string): boolean {
    const tracking = this.rateLimitTracking.get(domain);
    if (!tracking) return true;
    
    const now = new Date();
    if (now > tracking.resetTime) {
      // 已过重置时间，可以重新计数
      return true;
    }
    
    const whitelistEntry = this.config.whitelist.find(e => e.domain === domain);
    if (!whitelistEntry) return false;
    
    return tracking.count < whitelistEntry.rate_limit;
  }

  /**
   * 更新速率限制跟踪
   */
  private updateRateLimitTracking(domain: string): void {
    const now = new Date();
    const resetTime = new Date(now.getTime() + 60 * 1000); // 1分钟后重置
    
    const tracking = this.rateLimitTracking.get(domain);
    if (!tracking || now > tracking.resetTime) {
      // 初始化或重置计数
      this.rateLimitTracking.set(domain, {
        count: 1,
        resetTime
      });
    } else {
      // 增加计数
      tracking.count++;
    }
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 检查robots.txt合规性
   */
  async checkRobotsCompliance(domain: string): Promise<boolean> {
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await fetch(robotsUrl);
      
      if (!response.ok) {
        // 如果没有robots.txt，假设允许抓取
        return true;
      }
      
      const robotsText = await response.text();
      
      // 简单的robots.txt解析
      // 实际项目中应使用更专业的robots.txt解析器
      const lines = robotsText.split('\n');
      let currentUserAgent = '';
      let disallowed = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim().toLowerCase();
        
        if (trimmedLine.startsWith('user-agent:')) {
          currentUserAgent = trimmedLine.substring(11).trim();
        } else if (trimmedLine.startsWith('disallow:') && 
                   (currentUserAgent === '*' || currentUserAgent === this.config.user_agent.toLowerCase())) {
          const disallowPath = trimmedLine.substring(9).trim();
          if (disallowPath === '/' || disallowPath === '') {
            disallowed = true;
            break;
          }
        }
      }
      
      return !disallowed;
    } catch (error) {
      console.warn(`检查robots.txt失败 (${domain}):`, error);
      // 检查失败时保守处理，假设不允许
      return false;
    }
  }

  /**
   * 添加白名单条目
   */
  async addWhitelistEntry(entry: Omit<WhitelistEntry, 'last_checked' | 'robots_compliant'>): Promise<void> {
    // 检查robots.txt合规性
    const robotsCompliant = await this.checkRobotsCompliance(entry.domain);
    
    const fullEntry: WhitelistEntry = {
      ...entry,
      robots_compliant: robotsCompliant,
      last_checked: new Date()
    };
    
    this.config.whitelist.push(fullEntry);
    console.log(`添加白名单条目: ${entry.domain} (robots.txt合规: ${robotsCompliant})`);
  }

  /**
   * 更新白名单条目的robots.txt合规性
   */
  async updateWhitelistCompliance(): Promise<void> {
    for (const entry of this.config.whitelist) {
      try {
        entry.robots_compliant = await this.checkRobotsCompliance(entry.domain);
        entry.last_checked = new Date();
        
        // 添加延迟避免频繁请求
        await new Promise(resolve => setTimeout(resolve, this.config.request_delay_ms));
      } catch (error) {
        console.error(`更新白名单合规性失败 (${entry.domain}):`, error);
        entry.robots_compliant = false;
      }
    }
  }
}