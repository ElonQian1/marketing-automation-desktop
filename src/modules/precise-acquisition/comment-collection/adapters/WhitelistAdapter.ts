/**
 * 公开白名单适配器
 * 
 * 实现对公开且允许抓取的白名单数据源的评论采集
 * 严格遵守robots.txt和网站条款，仅采集明确允许的内容
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  CommentCollectionAdapter, 
  CommentCollectionParams, 
  CommentCollectionResult, 
  AdapterStatus 
} from './CommentCollectionAdapter';
import { Platform, WatchTarget } from '../../shared/types/core';

/**
 * 白名单数据源配置
 */
interface WhitelistSource {
  domain: string;
  name: string;
  allowed_paths: string[];
  robots_compliant: boolean;
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
  };
  last_checked: Date;
  status: 'active' | 'suspended' | 'checking';
}

/**
 * 通用评论数据结构
 */
interface GenericComment {
  id: string;
  content: string;
  author: {
    id: string;
    name?: string;
    avatar?: string;
  };
  timestamp: string;
  likes?: number;
  replies?: number;
  metadata?: Record<string, any>;
}

export class WhitelistAdapter extends CommentCollectionAdapter {
  private whitelistSources: Map<string, WhitelistSource> = new Map();

  constructor() {
    super(Platform.PUBLIC);
    this.loadWhitelistSources();
  }

  async getStatus(): Promise<AdapterStatus> {
    try {
      // 检查白名单源的整体状态
      const activeSourcesCount = Array.from(this.whitelistSources.values())
        .filter(source => source.status === 'active').length;

      const hasActiveSources = activeSourcesCount > 0;

      return {
        platform: Platform.PUBLIC,
        available: hasActiveSources,
        auth_status: 'authenticated', // 公开采集不需要认证
        last_error: hasActiveSources ? undefined : '没有可用的白名单数据源'
      };
    } catch (error) {
      console.error('Failed to get Whitelist adapter status:', error);
      return {
        platform: Platform.PUBLIC,
        available: false,
        auth_status: 'missing',
        last_error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  isTargetSupported(target: WatchTarget): boolean {
    if (target.platform !== Platform.PUBLIC) {
      return false;
    }

    // 检查URL是否在白名单中
    try {
      const url = new URL(target.platform_id_or_url);
      return this.whitelistSources.has(url.hostname);
    } catch {
      return false;
    }
  }

  async validatePermissions(target: WatchTarget): Promise<{
    canCollect: boolean;
    reason?: string;
    requiredScopes?: string[];
  }> {
    try {
      const url = new URL(target.platform_id_or_url);
      const source = this.whitelistSources.get(url.hostname);

      if (!source) {
        return {
          canCollect: false,
          reason: '域名不在白名单中'
        };
      }

      if (source.status !== 'active') {
        return {
          canCollect: false,
          reason: `数据源状态异常: ${source.status}`
        };
      }

      // 检查路径是否被允许
      const pathAllowed = source.allowed_paths.some(allowedPath => 
        url.pathname.startsWith(allowedPath)
      );

      if (!pathAllowed) {
        return {
          canCollect: false,
          reason: '路径不在允许范围内'
        };
      }

      // 检查robots.txt合规性
      if (!source.robots_compliant) {
        return {
          canCollect: false,
          reason: 'robots.txt不允许抓取'
        };
      }

      return { canCollect: true };

    } catch (error) {
      return {
        canCollect: false,
        reason: `权限验证失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  async collectComments(params: CommentCollectionParams): Promise<CommentCollectionResult> {
    const { target, limit = 20, since, until } = params;

    if (!this.isTargetSupported(target)) {
      throw new Error('不支持的目标类型');
    }

    // 验证权限
    const permissions = await this.validatePermissions(target);
    if (!permissions.canCollect) {
      throw new Error(`无权限采集: ${permissions.reason}`);
    }

    try {
      const url = new URL(target.platform_id_or_url);
      const source = this.whitelistSources.get(url.hostname)!;

      // 检查频率限制
      await this.checkRateLimit(source);

      // 调用Tauri后端进行采集
      const response = await invoke('collect_whitelist_comments', {
        targetUrl: target.platform_id_or_url,
        sourceDomain: url.hostname,
        limit,
        since: since?.toISOString(),
        until: until?.toISOString(),
        respectRobots: true,
        userAgent: 'PreciseAcquisition/1.0 (Compliant Crawler)'
      });

      const rawData = response as {
        comments: GenericComment[];
        total_found: number;
        next_page?: string;
        has_more: boolean;
        source_info: {
          domain: string;
          collected_at: string;
          rate_limit_remaining: number;
        };
      };

      // 转换为标准格式
      const comments = rawData.comments.map(rawComment => 
        this.standardizeComment({
          comment_id: rawComment.id,
          content: rawComment.content,
          author_id: rawComment.author.id,
          author_name: rawComment.author.name,
          like_count: rawComment.likes || 0,
          publish_time: rawComment.timestamp,
          metadata: rawComment.metadata
        }, target)
      );

      return {
        comments,
        total_count: rawData.total_found,
        next_cursor: rawData.next_page,
        has_more: rawData.has_more,
        collected_at: new Date(),
        source_platform: Platform.PUBLIC,
        target_id: target.id
      };

    } catch (error) {
      console.error('Failed to collect whitelist comments:', error);
      throw new Error(`白名单评论采集失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  protected generateCommentId(rawComment: any): string {
    return `public_${rawComment.comment_id}`;
  }

  /**
   * 加载白名单数据源配置
   */
  private async loadWhitelistSources(): Promise<void> {
    try {
      const sources = await invoke('get_whitelist_sources');
      const sourceList = sources as WhitelistSource[];

      this.whitelistSources.clear();
      sourceList.forEach(source => {
        this.whitelistSources.set(source.domain, source);
      });

      console.log(`Loaded ${sourceList.length} whitelist sources`);
    } catch (error) {
      console.error('Failed to load whitelist sources:', error);
    }
  }

  /**
   * 检查频率限制
   */
  private async checkRateLimit(source: WhitelistSource): Promise<void> {
    try {
      const rateLimitStatus = await invoke('check_whitelist_rate_limit', {
        domain: source.domain
      });

      const status = rateLimitStatus as {
        allowed: boolean;
        remaining_requests: number;
        reset_time: number;
      };

      if (!status.allowed) {
        const resetTime = new Date(status.reset_time * 1000);
        throw new Error(`频率限制：剩余请求 ${status.remaining_requests}，重置时间 ${resetTime.toLocaleString()}`);
      }
    } catch (error) {
      throw new Error(`频率检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 添加新的白名单数据源
   */
  async addWhitelistSource(domain: string, config: {
    name: string;
    allowed_paths: string[];
    rate_limit: {
      requests_per_minute: number;
      requests_per_hour: number;
    };
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // 首先验证域名的robots.txt
      const robotsCheck = await invoke('validate_robots_txt', { domain });
      const robotsValid = robotsCheck as { compliant: boolean; reason?: string };

      if (!robotsValid.compliant) {
        return {
          success: false,
          error: `robots.txt检查失败: ${robotsValid.reason}`
        };
      }

      // 添加到白名单
      const result = await invoke('add_whitelist_source', {
        domain,
        config: {
          ...config,
          robots_compliant: true,
          status: 'active'
        }
      });

      const added = result as { success: boolean; error?: string };
      
      if (added.success) {
        // 重新加载白名单
        await this.loadWhitelistSources();
      }

      return added;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 移除白名单数据源
   */
  async removeWhitelistSource(domain: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await invoke('remove_whitelist_source', { domain });
      const removed = result as { success: boolean; error?: string };

      if (removed.success) {
        this.whitelistSources.delete(domain);
      }

      return removed;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取白名单数据源列表
   */
  getWhitelistSources(): WhitelistSource[] {
    return Array.from(this.whitelistSources.values());
  }

  /**
   * 刷新白名单数据源状态
   */
  async refreshWhitelistSources(): Promise<void> {
    await this.loadWhitelistSources();
  }
}