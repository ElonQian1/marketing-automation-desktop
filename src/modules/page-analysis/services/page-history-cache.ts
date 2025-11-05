// src/modules/page-analysis/services/page-history-cache.ts
// module: page-analysis | layer: services | role: history-cache
// summary: 专门处理页面分析历史记录的缓存管理，从debug_xml目录读取历史页面数据

import { invoke } from '@tauri-apps/api/tauri';
import { readDir } from '@tauri-apps/api/fs';
import { appDataDir, join } from '@tauri-apps/api/path';

export interface PageHistoryEntry {
  /** 历史记录ID */
  historyId: string;
  /** 文件名（ui_dump_xxx.xml） */
  fileName: string;
  /** 文件路径 */
  filePath: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 应用包名（从文件名解析） */
  appPackage?: string;
  /** 页面标题（如果有） */
  pageTitle?: string;
  /** 缩略图路径（如果有对应截图） */
  thumbnailPath?: string;
  /** 是否已解析 */
  isParsed?: boolean;
}

export interface PageHistoryFilter {
  /** 按应用包名过滤 */
  appPackage?: string;
  /** 按时间范围过滤 */
  timeRange?: {
    start: number;
    end: number;
  };
  /** 按文件名关键词过滤 */
  keyword?: string;
  /** 最大返回数量 */
  limit?: number;
}

export interface PageHistoryLoadOptions {
  /** 每页加载数量 */
  pageSize?: number;
  /** 是否包含文件内容 */
  includeContent?: boolean;
  /** 是否预加载缩略图 */
  preloadThumbnails?: boolean;
}

/**
 * 页面历史缓存管理器
 * 
 * 职责：
 * 1. 管理debug_xml目录下的历史XML文件
 * 2. 提供分页和过滤功能
 * 3. 优化加载性能，支持懒加载
 * 4. 独立于核心XML缓存系统
 */
export class PageHistoryCache {
  private static instance: PageHistoryCache;
  private historyEntries: Map<string, PageHistoryEntry> = new Map();
  private isLoaded = false;
  private isLoading = false;
  private debugXmlDir: string | null = null;

  private constructor() {}

  static getInstance(): PageHistoryCache {
    if (!this.instance) {
      this.instance = new PageHistoryCache();
    }
    return this.instance;
  }

  /**
   * 初始化历史缓存
   * @param customPath 自定义debug_xml目录路径
   */
  async initialize(customPath?: string): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      // 确定debug_xml目录路径
      if (customPath) {
        this.debugXmlDir = customPath;
      } else {
        const appDataPath = await appDataDir();
        this.debugXmlDir = await join(appDataPath, 'debug_xml');
      }

      console.log(`📁 初始化页面历史缓存，目录: ${this.debugXmlDir}`);
      await this.scanHistoryFiles();
      
      this.isLoaded = true;
      console.log(`✅ 页面历史缓存初始化完成，发现 ${this.historyEntries.size} 个历史文件`);
    } catch (error) {
      console.error('❌ 页面历史缓存初始化失败:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 扫描历史文件（性能优化版）
   * 只扫描文件列表，不立即读取内容
   */
  private async scanHistoryFiles(): Promise<void> {
    if (!this.debugXmlDir) {
      throw new Error('Debug XML目录未设置');
    }

    try {
      const entries = await readDir(this.debugXmlDir);
      let validFileCount = 0;

      for (const entry of entries) {
        if (!entry.name || !entry.name.endsWith('.xml')) {
          continue;
        }

        // 提取文件信息
        const historyEntry = this.parseFileEntry(entry);
        if (historyEntry) {
          this.historyEntries.set(historyEntry.historyId, historyEntry);
          validFileCount++;
        }
      }

      console.log(`📄 扫描完成: ${validFileCount} 个有效XML文件`);
    } catch (error) {
      console.error('❌ 扫描历史文件失败:', error);
      throw error;
    }
  }

  /**
   * 解析文件信息
   */
  private parseFileEntry(entry: any): PageHistoryEntry | null {
    try {
      const fileName = entry.name;
      const historyId = fileName.replace('.xml', '');
      
      // 从文件名尝试提取信息
      // 例如: ui_dump_com.xiaohongshu_20231201_143022.xml
      const appPackageMatch = fileName.match(/ui_dump_([^_]+)_/);
      const timestampMatch = fileName.match(/_(\d{8}_\d{6})\.xml$/);
      
      let timestamp = 0;
      if (timestampMatch) {
        const timeStr = timestampMatch[1];
        // 转换 YYYYMMDD_HHMMSS 格式
        const year = parseInt(timeStr.substring(0, 4));
        const month = parseInt(timeStr.substring(4, 6)) - 1; // 月份从0开始
        const day = parseInt(timeStr.substring(6, 8));
        const hour = parseInt(timeStr.substring(9, 11));
        const minute = parseInt(timeStr.substring(11, 13));
        const second = parseInt(timeStr.substring(13, 15));
        timestamp = new Date(year, month, day, hour, minute, second).getTime();
      } else {
        // 使用文件修改时间作为备选
        timestamp = Date.now();
      }

      const historyEntry: PageHistoryEntry = {
        historyId,
        fileName,
        filePath: entry.path,
        timestamp,
        appPackage: appPackageMatch ? appPackageMatch[1] : undefined,
        isParsed: false,
      };

      return historyEntry;
    } catch (error) {
      console.error('❌ 解析文件条目失败:', fileName, error);
      return null;
    }
  }

  /**
   * 获取历史记录列表（分页和过滤）
   */
  async getHistoryList(
    filter: PageHistoryFilter = {},
    options: PageHistoryLoadOptions = {}
  ): Promise<{ entries: PageHistoryEntry[]; total: number; hasMore: boolean }> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    const { pageSize = 20, limit } = options;
    const maxLimit = limit || pageSize;

    // 获取所有条目并排序（按时间倒序）
    let allEntries = Array.from(this.historyEntries.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    // 应用过滤器
    if (filter.appPackage) {
      allEntries = allEntries.filter(entry => entry.appPackage === filter.appPackage);
    }

    if (filter.timeRange) {
      allEntries = allEntries.filter(entry => 
        entry.timestamp >= filter.timeRange!.start && 
        entry.timestamp <= filter.timeRange!.end
      );
    }

    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      allEntries = allEntries.filter(entry => 
        entry.fileName.toLowerCase().includes(keyword) ||
        entry.appPackage?.toLowerCase().includes(keyword) ||
        entry.pageTitle?.toLowerCase().includes(keyword)
      );
    }

    // 分页处理
    const total = allEntries.length;
    const entries = allEntries.slice(0, maxLimit);
    const hasMore = total > maxLimit;

    console.log(`📋 获取历史记录: ${entries.length}/${total} 条 (hasMore: ${hasMore})`);

    return { entries, total, hasMore };
  }

  /**
   * 根据ID获取历史记录详情
   */
  async getHistoryById(historyId: string): Promise<PageHistoryEntry | null> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    return this.historyEntries.get(historyId) || null;
  }

  /**
   * 加载XML文件内容
   */
  async loadXmlContent(historyId: string): Promise<string | null> {
    const entry = await this.getHistoryById(historyId);
    if (!entry) {
      console.warn(`⚠️ 历史记录不存在: ${historyId}`);
      return null;
    }

    try {
      console.log(`📖 加载XML内容: ${entry.fileName}`);
      const xmlContent = await invoke<string>('read_file_content', {
        filePath: entry.filePath
      });
      
      // 标记为已解析
      entry.isParsed = true;
      this.historyEntries.set(historyId, entry);
      
      return xmlContent;
    } catch (error) {
      console.error('❌ 加载XML内容失败:', error);
      return null;
    }
  }

  /**
   * 刷新历史记录（重新扫描目录）
   */
  async refresh(): Promise<void> {
    console.log('🔄 刷新页面历史缓存...');
    this.isLoaded = false;
    this.historyEntries.clear();
    await this.initialize();
  }

  /**
   * 清理缓存
   */
  clear(): void {
    this.historyEntries.clear();
    this.isLoaded = false;
    console.log('🧹 页面历史缓存已清理');
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalFiles: number;
    parsedFiles: number;
    appPackages: string[];
    timeRange: { earliest: number; latest: number } | null;
  } {
    const entries = Array.from(this.historyEntries.values());
    const appPackages = [...new Set(entries.map(e => e.appPackage).filter(Boolean))];
    const timestamps = entries.map(e => e.timestamp).filter(t => t > 0);
    
    const timeRange = timestamps.length > 0 ? {
      earliest: Math.min(...timestamps),
      latest: Math.max(...timestamps)
    } : null;

    return {
      totalFiles: entries.length,
      parsedFiles: entries.filter(e => e.isParsed).length,
      appPackages,
      timeRange
    };
  }

  /**
   * 按应用分组获取历史记录
   */
  async getHistoryByApp(): Promise<Map<string, PageHistoryEntry[]>> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    const groupedHistory = new Map<string, PageHistoryEntry[]>();
    
    for (const entry of this.historyEntries.values()) {
      const appPackage = entry.appPackage || 'unknown';
      
      if (!groupedHistory.has(appPackage)) {
        groupedHistory.set(appPackage, []);
      }
      
      groupedHistory.get(appPackage)!.push(entry);
    }

    // 每个应用内按时间排序
    for (const [app, entries] of groupedHistory) {
      entries.sort((a, b) => b.timestamp - a.timestamp);
    }

    return groupedHistory;
  }
}

// 导出单例实例
export const pageHistoryCache = PageHistoryCache.getInstance();
export default PageHistoryCache;