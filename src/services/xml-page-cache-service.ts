// src/services/xml-page-cache-service.ts
// module: shared | layer: unknown | role: component
// summary: xml-page-cache-service.ts 文件

/**
 * XML页面缓存管理服务
 * 用于管理和重用历史分析过的XML页面数据
 */

import { invoke } from '@tauri-apps/api/core';
import { XmlAnalysisService } from './xml-analysis-service';
import { ElementFilter, ModuleFilterFactory, FilterStrategy } from './ui-element-filter';
import { BoundsCalculator } from '../shared/bounds/BoundsCalculator';

export interface CachedXmlPage {
  /** 文件路径 */
  filePath: string;
  /** 文件绝对路径 */
  absoluteFilePath: string;
  /** 文件名 */
  fileName: string;
  /** 设备ID */
  deviceId: string;
  /** 时间戳 */
  timestamp: string;
  /** 页面标题（通过智能识别生成） */
  pageTitle: string;
  /** 应用包名 */
  appPackage: string;
  /** 页面类型 */
  pageType: string;
  /** 元素数量 */
  elementCount: number;
  /** 可点击元素数量 */
  clickableCount: number;
  /** 文件大小（字节） */
  fileSize: number;
  /** 创建时间 */
  createdAt: Date;
  /** 页面描述 */
  description: string;
  /** 预览信息 */
  preview: {
    /** 主要文本内容 */
    mainTexts: string[];
    /** 主要按钮 */
    mainButtons: string[];
    /** 输入框数量 */
    inputCount: number;
  };
  /** 截图文件名（若存在） */
  screenshotFileName?: string;
  /** 截图绝对路径（若存在） */
  screenshotAbsolutePath?: string;
}

/**
 * 🚀 后端批量返回的元数据接口（与 Rust XmlCacheFileMetadata 对应）
 */
interface BackendXmlCacheMetadata {
  fileName: string;
  absolutePath: string;
  fileSize: number;
  deviceId: string;
  timestamp: string;
  screenshotFileName: string | null;
  screenshotAbsolutePath: string | null;
  appPackage: string;
  pageType: string;
  elementCount: number;
  clickableCount: number;
  description: string;
  mainButtons: string[];
  mainTexts: string[];
  inputCount: number;
}

/**
 * ⚡ 轻量版元数据接口（仅文件系统信息，不包含内容分析）
 */
interface BackendXmlCacheQuickMetadata {
  fileName: string;
  absolutePath: string;
  fileSize: number;
  deviceId: string;
  timestamp: string;
  screenshotFileName: string | null;
  screenshotAbsolutePath: string | null;
}

/**
 * 📊 按需分析结果接口（用户选择页面时返回）
 */
interface BackendXmlContentAnalysis {
  appPackage: string;
  pageType: string;
  elementCount: number;
  clickableCount: number;
  description: string;
  mainButtons: string[];
  mainTexts: string[];
  inputCount: number;
}

export interface XmlPageContent {
  /** XML原始内容 */
  xmlContent: string;
  /** 解析后的UI元素 */
  elements: any[];
  /** 页面信息 */
  pageInfo: CachedXmlPage;
}

export class XmlPageCacheService {
  private static readonly DEBUG_XML_DIR = 'debug_xml';
  private static cachedPages: CachedXmlPage[] | null = null;

  /**
   * 获取所有缓存的XML页面
   */
  static async getCachedPages(): Promise<CachedXmlPage[]> {
    if (this.cachedPages === null) {
      console.log('📦 [缓存] 首次加载或缓存已清空，开始扫描 XML 文件...');
      await this.loadCachedPages();
    } else {
      console.log(`✅ [缓存] 使用内存缓存，已有 ${this.cachedPages.length} 个页面，无需重新扫描`);
    }
    return this.cachedPages || [];
  }

  /**
   * 清除内存缓存，强制重新加载
   */
  static clearCache(): void {
    this.cachedPages = null;
    console.log('🔄 已清除XML页面缓存');
  }

  /**
   * 解析XML内容为UI元素（用于元素发现 - 返回所有元素）
   * @param xmlContent XML内容
   * @returns 所有UI元素（不过滤）
   */
  static async parseXmlToAllElements(xmlContent: string): Promise<any[]> {
    console.log('🔍 [ElementDiscovery] 开始解析XML（非过滤模式），长度:', xmlContent.length);
    const elements = await this.parseXmlToElements(xmlContent, false);
    console.log('🔧 [ElementDiscovery] 从后端获取到', elements.length, '个元素');
    
    // 统计原始的clickable元素
    const clickableFromBackend = elements.filter(el => el.is_clickable === true);
    console.log('🎯 [ElementDiscovery] 后端返回的可点击元素数:', clickableFromBackend.length);
    
    // 详细输出所有clickable元素信息
    console.group("🖱️ 后端返回的所有可点击元素详情:");
    clickableFromBackend.forEach((el, index) => {
      console.log(`${index + 1}. 类型: ${el.element_type || 'unknown'}`);
      console.log(`   文本: "${el.text || ''}"  ID: "${el.resource_id || ''}"  描述: "${el.content_desc || ''}"`);
      console.log(`   位置: ${el.bounds ? JSON.stringify(el.bounds) : 'unknown'}  可点击: ${el.is_clickable}`);
      
      // 检查可能的过滤原因
      const issues = [];
      if (!el.text && !el.resource_id && !el.content_desc) {
        issues.push("无标识信息");
      }
      if (el.bounds && typeof el.bounds === 'object') {
        const width = el.bounds.right - el.bounds.left;
        const height = el.bounds.bottom - el.bounds.top;
        if (width < 10 || height < 10) {
          issues.push("尺寸过小");
        }
        console.log(`   尺寸: ${width}x${height} 面积: ${width * height}px²`);
      }
      if (issues.length > 0) {
        console.log(`   ⚠️ 潜在问题: ${issues.join(", ")}`);
      }
      console.log("");
    });
    console.groupEnd();

    // 检查是否有重叠元素（可能的遮蔽问题）
    console.group("🔍 检查元素重叠问题:");
    let overlapCount = 0;
    clickableFromBackend.forEach((el1, i) => {
      clickableFromBackend.forEach((el2, j) => {
        if (i !== j && this.elementsOverlap(el1, el2)) {
          overlapCount++;
          console.warn(`⚠️ 元素重叠检测: "${el1.text || el1.element_type}" 与 "${el2.text || el2.element_type}" 可能存在重叠`);
        }
      });
    });
    if (overlapCount === 0) {
      console.log("✅ 未发现重叠元素");
    }
    console.groupEnd();
    
    // 使用独立过滤器模块，明确指定不过滤
    const result = ModuleFilterFactory.forElementDiscovery(elements);
    console.log('✅ [ElementDiscovery] 解析完成，提取', result.length, '个元素（原始:', elements.length, '个）');
    
    // 检查过滤后的clickable元素
    const clickableAfterFilter = result.filter(el => el.is_clickable === true);
    console.log('🎯 [ElementDiscovery] 过滤后的可点击元素数:', clickableAfterFilter.length);
    
    if (clickableFromBackend.length !== clickableAfterFilter.length) {
      console.warn('⚠️ [ElementDiscovery] 过滤器丢失了可点击元素！');
      
      // 找出被过滤的元素
      const filteredClickableIds = new Set(clickableAfterFilter.map(el => `${el.id || el.bounds}`));
      const lostElements = clickableFromBackend.filter(el => !filteredClickableIds.has(`${el.id || el.bounds}`));
      
      console.group("❌ 被前端过滤器丢失的clickable元素:");
      lostElements.forEach((el, index) => {
        console.log(`${index + 1}. 类型: ${el.element_type || 'unknown'}, 文本: "${el.text || ''}", ID: "${el.resource_id || ''}", 位置: ${JSON.stringify(el.bounds)}`);
      });
      console.groupEnd();
    }
    
    return result;
  }

  // 辅助方法：检查两个元素是否重叠
  private static elementsOverlap(el1: any, el2: any): boolean {
    if (!el1.bounds || !el2.bounds) return false;
    
    const bounds1 = el1.bounds;
    const bounds2 = el2.bounds;
    
    if (!bounds1 || !bounds2) return false;
    
    return !(bounds1.right <= bounds2.left || 
             bounds2.right <= bounds1.left || 
             bounds1.bottom <= bounds2.top || 
             bounds2.bottom <= bounds1.top);
  }

  /**
   * 解析XML内容为UI元素（用于页面分析 - 返回有价值的元素）
   * @param xmlContent XML内容  
   * @returns 过滤后的UI元素
   */
  static async parseXmlToValuableElements(xmlContent: string): Promise<any[]> {
    console.log('🔍 [PageAnalysis] 开始解析XML，长度:', xmlContent.length);
    // 先获取所有元素
    const allElements = await this.parseXmlToElements(xmlContent, false);
    // 使用页面分析专用过滤器
    const valuableElements = ModuleFilterFactory.forPageAnalysis(allElements);
    console.log('✅ [PageAnalysis] 解析完成，从', allElements.length, '个元素中筛选出', valuableElements.length, '个有价值元素');
    return valuableElements;
  }

  /**
   * 在文件管理器中打开指定的缓存页面文件
   */
  static async revealCachedPage(cachedPage: CachedXmlPage): Promise<void> {
    const targetPath = cachedPage.absoluteFilePath || cachedPage.filePath;

    try {
      console.log('📂 打开缓存文件所在位置:', targetPath);
      await invoke('plugin:file_manager|reveal', { path: targetPath });
    } catch (error) {
      console.error('❌ 打开文件管理器失败:', error);
      throw error;
    }
  }

  /**
   * 🚀 加载所有缓存页面的元数据（优化版：延迟内容分析）
   * 
   * 优化前：读取所有XML文件内容并分析（1480ms）
   * 优化后：仅获取文件系统信息，内容分析延迟到用户选择时（目标 <50ms）
   */
  private static async loadCachedPages(): Promise<void> {
    try {
      const startTime = performance.now();
      console.log('⚡ [性能优化] 开始快速加载XML缓存元数据（仅文件系统信息）...');
      
      // 🔥 一次调用获取所有文件的轻量元数据（不读取文件内容）
      const quickMetadataList: BackendXmlCacheQuickMetadata[] = await invoke(
        'plugin:xml_cache|list_xml_cache_files_quick'
      );
      
      // 转换为前端格式（使用占位符，等待用户选择时再分析）
      const pages: CachedXmlPage[] = quickMetadataList.map(meta => 
        this.convertQuickMetadataToPage(meta)
      );
      
      this.cachedPages = pages;
      
      const elapsed = performance.now() - startTime;
      console.log(`⚡ 快速加载 ${pages.length} 个缓存页面完成，耗时 ${elapsed.toFixed(0)}ms`);
      
    } catch (error) {
      console.error('❌ 快速加载XML缓存失败，回退到完整加载:', error);
      // 回退到完整加载方式
      await this.loadCachedPagesFull();
    }
  }

  /**
   * 将轻量元数据转换为前端 CachedXmlPage 格式（使用占位符）
   */
  private static convertQuickMetadataToPage(meta: BackendXmlCacheQuickMetadata): CachedXmlPage {
    // 使用文件大小估算元素数量（约 1KB = 10 个元素）
    const estimatedElementCount = Math.round(meta.fileSize / 100);
    const estimatedClickableCount = Math.round(estimatedElementCount * 0.15);
    
    const pageTitle = `快照 ${this.formatTimestamp(meta.timestamp)}`;
    const description = `${(meta.fileSize / 1024).toFixed(1)}KB • 点击查看详情`;
    
    return {
      filePath: `${this.DEBUG_XML_DIR}/${meta.fileName}`,
      absoluteFilePath: meta.absolutePath,
      fileName: meta.fileName,
      deviceId: meta.deviceId,
      timestamp: meta.timestamp,
      pageTitle,
      appPackage: 'pending', // 延迟分析
      pageType: 'pending', // 延迟分析
      elementCount: estimatedElementCount,
      clickableCount: estimatedClickableCount,
      fileSize: meta.fileSize,
      createdAt: this.parseTimestampToDate(meta.timestamp),
      description,
      preview: {
        mainTexts: [],
        mainButtons: [],
        inputCount: 0,
      },
      screenshotFileName: meta.screenshotFileName ?? undefined,
      screenshotAbsolutePath: meta.screenshotAbsolutePath ?? undefined,
    };
  }

  /**
   * 📊 按需分析指定页面的内容（用户选择时调用）
   */
  static async analyzePageOnDemand(fileName: string): Promise<BackendXmlContentAnalysis> {
    console.log(`📊 [按需分析] 分析页面: ${fileName}`);
    const startTime = performance.now();
    
    const analysis: BackendXmlContentAnalysis = await invoke(
      'plugin:xml_cache|analyze_xml_cache_file',
      { fileName }
    );
    
    const elapsed = performance.now() - startTime;
    console.log(`📊 [按需分析] 完成，耗时 ${elapsed.toFixed(0)}ms`);
    
    return analysis;
  }

  /**
   * 📊 更新页面的分析数据（分析完成后更新缓存）
   */
  static updatePageWithAnalysis(fileName: string, analysis: BackendXmlContentAnalysis): void {
    if (!this.cachedPages) return;
    
    const pageIndex = this.cachedPages.findIndex(p => p.fileName === fileName);
    if (pageIndex === -1) return;
    
    const page = this.cachedPages[pageIndex];
    page.appPackage = analysis.appPackage;
    page.pageType = analysis.pageType;
    page.elementCount = analysis.elementCount;
    page.clickableCount = analysis.clickableCount;
    page.description = analysis.description;
    page.pageTitle = `${analysis.pageType} - ${this.formatTimestamp(page.timestamp)}`;
    page.preview = {
      mainTexts: analysis.mainTexts,
      mainButtons: analysis.mainButtons,
      inputCount: analysis.inputCount,
    };
  }

  /**
   * 🔄 完整加载方法（包含内容分析，作为回退方案）
   */
  private static async loadCachedPagesFull(): Promise<void> {
    try {
      const startTime = performance.now();
      console.log('🚀 [回退] 开始完整加载XML缓存元数据...');
      
      // 🔥 一次调用获取所有文件的完整元数据
      const metadataList: BackendXmlCacheMetadata[] = await invoke(
        'plugin:xml_cache|list_xml_cache_files_with_metadata'
      );
      
      // 转换为前端格式
      const pages: CachedXmlPage[] = metadataList.map(meta => 
        this.convertBackendMetadataToPage(meta)
      );
      
      this.cachedPages = pages;
      
      const elapsed = performance.now() - startTime;
      console.log(`✅ 完整加载 ${pages.length} 个缓存页面，耗时 ${elapsed.toFixed(0)}ms`);
      
    } catch (error) {
      console.error('❌ 完整加载XML缓存失败，回退到逐个加载:', error);
      // 回退到旧的逐个加载方式（兼容性保障）
      await this.loadCachedPagesLegacy();
    }
  }

  /**
   * 将后端元数据转换为前端 CachedXmlPage 格式
   */
  private static convertBackendMetadataToPage(meta: BackendXmlCacheMetadata): CachedXmlPage {
    const pageTitle = `${meta.pageType} - ${this.formatTimestamp(meta.timestamp)}`;
    
    return {
      filePath: `${this.DEBUG_XML_DIR}/${meta.fileName}`,
      absoluteFilePath: meta.absolutePath,
      fileName: meta.fileName,
      deviceId: meta.deviceId,
      timestamp: meta.timestamp,
      pageTitle,
      appPackage: meta.appPackage,
      pageType: meta.pageType,
      elementCount: meta.elementCount,
      clickableCount: meta.clickableCount,
      fileSize: meta.fileSize,
      createdAt: this.parseTimestampToDate(meta.timestamp),
      description: meta.description,
      preview: {
        mainTexts: meta.mainTexts,
        mainButtons: meta.mainButtons,
        inputCount: meta.inputCount,
      },
      screenshotFileName: meta.screenshotFileName ?? undefined,
      screenshotAbsolutePath: meta.screenshotAbsolutePath ?? undefined,
    };
  }

  /**
   * 🔄 旧版逐个加载方法（作为回退方案保留）
   * @deprecated 请使用 loadCachedPages() 的批量版本
   */
  private static async loadCachedPagesLegacy(): Promise<void> {
    try {
      console.log('🔍 [Legacy] 开始逐个扫描XML缓存页面...');
      
      const xmlFiles: string[] = await invoke('plugin:xml_cache|list_xml_cache_files');
      const pages: CachedXmlPage[] = [];
      
      for (const fileName of xmlFiles) {
        try {
          const pageInfo = await this.analyzeXmlFile(fileName);
          if (pageInfo) {
            pages.push(pageInfo);
          }
        } catch (error) {
          console.warn(`❌ 分析XML文件失败: ${fileName}`, error);
        }
      }
      
      pages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      this.cachedPages = pages;
      console.log(`✅ [Legacy] 成功加载 ${pages.length} 个缓存页面`);
      
    } catch (error) {
      console.error('❌ 加载XML缓存页面失败:', error);
      this.cachedPages = [];
    }
  }

  /**
   * 分析单个XML文件并提取页面信息
   */
  private static async analyzeXmlFile(fileName: string): Promise<CachedXmlPage | null> {
    try {
      // 解析文件名获取基础信息
      const fileInfo = this.parseFileName(fileName);
      if (!fileInfo) {
        return null;
      }

      // 读取XML文件内容
      const xmlContent: string = await invoke('plugin:xml_cache|read_xml_cache_file', { fileName });
      
      // 获取文件大小
      const fileSize: number = await invoke('plugin:xml_cache|get_xml_file_size', { fileName });
      
      // 使用RealXMLAnalysisService进行智能分析
      const appPackage = this.detectAppPackage(xmlContent);
      const pageAnalysis = this.analyzePageContent(xmlContent, appPackage);
      const absoluteFilePath: string = await invoke('plugin:xml_cache|get_xml_file_absolute_path', { fileName });

      const screenshotFileName = fileName.replace(/\.xml$/, '.png');
      let screenshotAbsolutePath: string | undefined;
      try {
        screenshotAbsolutePath = await invoke('plugin:xml_cache|get_xml_file_absolute_path', { fileName: screenshotFileName });
      } catch (error) {
        console.info(`ℹ️ 未找到对应截图: ${screenshotFileName}`, error);
      }
      
      // 生成页面标题
      const pageTitle = this.generatePageTitle(xmlContent, appPackage, fileInfo.timestamp);
      
      const cachedPage: CachedXmlPage = {
        filePath: `${this.DEBUG_XML_DIR}/${fileName}`,
        absoluteFilePath,
        fileName,
        deviceId: fileInfo.deviceId,
        timestamp: fileInfo.timestamp,
        pageTitle,
        appPackage,
        pageType: pageAnalysis.pageType,
        elementCount: pageAnalysis.elementCount,
        clickableCount: pageAnalysis.clickableCount,
        fileSize,
        createdAt: this.parseTimestampToDate(fileInfo.timestamp),
        description: pageAnalysis.description,
        preview: pageAnalysis.preview,
        screenshotFileName: screenshotAbsolutePath ? screenshotFileName : undefined,
        screenshotAbsolutePath
      };

      return cachedPage;
      
    } catch (error) {
      console.error(`❌ 分析XML文件失败: ${fileName}`, error);
      return null;
    }
  }

  /**
   * 解析文件名获取设备ID和时间戳
   * 格式: ui_dump_emulator-5554_20250918_164711.xml
   */
  private static parseFileName(fileName: string): { deviceId: string; timestamp: string } | null {
    const match = fileName.match(/ui_dump_([^_]+)_(\d{8}_\d{6})\.xml$/);
    if (!match) {
      return null;
    }
    return {
      deviceId: match[1],
      timestamp: match[2]
    };
  }

  /**
   * 将时间戳转换为Date对象
   * 注意：Rust后端生成的时间戳是UTC时间，需要正确解析
   */
  private static parseTimestampToDate(timestamp: string): Date {
    // 格式: 20250918_164711 (UTC时间)
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1; // 月份从0开始
    const day = parseInt(timestamp.substring(6, 8));
    const hour = parseInt(timestamp.substring(9, 11));
    const minute = parseInt(timestamp.substring(11, 13));
    const second = parseInt(timestamp.substring(13, 15));
    
    // 创建UTC时间对象，避免时区转换问题
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
    
    // 🔕 移除每次解析都输出的调试日志（42个文件 = 42行日志太多了）
    // 如需调试，可使用 window.loggerConfig.enableAll() 启用
    
    return utcDate;
  }

  /**
   * 检测应用包名
   */
  private static detectAppPackage(xmlContent: string): string {
    if (xmlContent.includes('com.xingin.xhs')) {
      return 'com.xingin.xhs';
    } else if (xmlContent.includes('com.tencent.mm')) {
      return 'com.tencent.mm';
    } else if (xmlContent.includes('com.android.contacts')) {
      return 'com.android.contacts';
    }
    return 'unknown';
  }

  /**
   * 分析页面内容
   */
  private static analyzePageContent(xmlContent: string, appPackage: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    // 统计元素
    const allElements = doc.querySelectorAll('*');
    const clickableElements = doc.querySelectorAll('[clickable="true"]');
    const inputElements = doc.querySelectorAll('EditText');
    
    // 提取主要文本内容
    const textElements = Array.from(doc.querySelectorAll('*'))
      .map(el => el.getAttribute('text'))
      .filter(text => text && text.trim().length > 0 && text.trim().length < 20)
      .slice(0, 10); // 取前10个

    // 提取主要按钮
    const buttonTexts = Array.from(clickableElements)
      .map(el => el.getAttribute('text'))
      .filter(text => text && text.trim().length > 0 && text.trim().length < 15)
      .slice(0, 8); // 取前8个

    // 识别页面类型
    const pageType = this.identifyPageType(xmlContent, appPackage);
    const description = this.generatePageDescription(xmlContent, appPackage, pageType);

    return {
      elementCount: allElements.length,
      clickableCount: clickableElements.length,
      pageType,
      description,
      preview: {
        mainTexts: textElements,
        mainButtons: buttonTexts,
        inputCount: inputElements.length
      }
    };
  }

  /**
   * 识别页面类型
   */
  private static identifyPageType(xmlContent: string, appPackage: string): string {
    if (appPackage === 'com.xingin.xhs') {
      if (xmlContent.includes('发现') && xmlContent.includes('首页')) {
        return '小红书首页';
      } else if (xmlContent.includes('搜索')) {
        return '小红书搜索页';
      } else if (xmlContent.includes('消息') || xmlContent.includes('聊天')) {
        return '小红书消息页';
      } else if (xmlContent.includes('我') && (xmlContent.includes('关注') || xmlContent.includes('粉丝'))) {
        return '小红书个人中心';
      } else if (xmlContent.includes('笔记详情') || xmlContent.includes('评论')) {
        return '小红书详情页';
      } else {
        return '小红书页面';
      }
    } else if (appPackage === 'com.tencent.mm') {
      return '微信页面';
    } else if (appPackage === 'com.android.contacts') {
      return '系统通讯录';
    }
    return '未知页面';
  }

  /**
   * 生成页面标题
   */
  private static generatePageTitle(xmlContent: string, appPackage: string, timestamp: string): string {
    const pageType = this.identifyPageType(xmlContent, appPackage);
    const timeStr = this.formatTimestamp(timestamp);
    return `${pageType} - ${timeStr}`;
  }

  /**
   * 生成页面描述
   */
  private static generatePageDescription(xmlContent: string, appPackage: string, pageType: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    const clickableCount = doc.querySelectorAll('[clickable="true"]').length;
    const inputCount = doc.querySelectorAll('EditText').length;
    
    let description = `${pageType}`;
    
    if (clickableCount > 0) {
      description += ` • ${clickableCount}个可点击元素`;
    }
    if (inputCount > 0) {
      description += ` • ${inputCount}个输入框`;
    }
    
    return description;
  }

  /**
   * 格式化时间戳显示
   */
  private static formatTimestamp(timestamp: string): string {
    // 20250918_164711 => 09-18 16:47
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(9, 11);
    const minute = timestamp.substring(11, 13);
    return `${month}-${day} ${hour}:${minute}`;
  }

  /**
   * 加载指定缓存页面的完整内容
   */
  static async loadPageContent(cachedPage: CachedXmlPage): Promise<XmlPageContent> {
    try {
      console.log(`🔄 加载缓存页面: ${cachedPage.pageTitle}`);
      console.log(`📁 文件名: ${cachedPage.fileName}`);
      console.log(`📅 时间戳: ${cachedPage.timestamp}`);
      
      // 读取XML内容
      const xmlContent: string = await invoke('plugin:xml_cache|read_xml_cache_file', { 
        fileName: cachedPage.fileName 
      });
      
      console.log(`📄 读取到XML内容: 长度=${xmlContent.length}, 前200字符=${xmlContent.substring(0, 200)}`);
      
      // ✅ 使用非过滤模式解析，获取所有元素（包括完整的可点击元素）
      const elements = await this.parseXmlToElements(xmlContent, false);
      
      return {
        xmlContent,
        elements,
        pageInfo: cachedPage
      };
      
    } catch (error) {
      console.error(`❌ 加载缓存页面失败: ${cachedPage.fileName}`, error);
      throw error;
    }
  }

  /**
   * 解析XML内容为UI元素数组（纯解析，不进行过滤）
   * @param xmlContent XML内容
   * @param enableFiltering 保留参数兼容性，但实际总是使用false（纯解析）
   * @returns 完整的UI元素列表
   */
  private static async parseXmlToElements(xmlContent: string, enableFiltering: boolean = false): Promise<any[]> {
    // 检查XML内容是否有效
    if (!xmlContent || xmlContent.trim().length === 0) {
      console.warn('⚠️ XML内容为空，返回空数组');
      return [];
    }

    try {
      // 🔧 强制使用非过滤模式，确保这是纯解析函数
      const elements = await invoke('plugin:xml_cache|parse_cached_xml_to_elements', { 
        xmlContent: xmlContent, 
        enableFiltering: false  // 总是使用false，过滤由ElementFilter模块负责
      });
      
      // 🐛 调试：检查后端返回的元素是否有 indexPath
      console.log('🔍 [parseXmlToElements] 后端返回元素数量:', (elements as any[]).length);
      const elementsWithIndexPath = (elements as any[]).filter(el => el.indexPath && el.indexPath.length > 0);
      console.log('🔍 [parseXmlToElements] 有 indexPath 的元素数量:', elementsWithIndexPath.length);
      if (elementsWithIndexPath.length > 0) {
        console.log('🔍 [parseXmlToElements] 示例元素 indexPath:', {
          id: elementsWithIndexPath[0].id,
          indexPath: elementsWithIndexPath[0].indexPath,
          text: elementsWithIndexPath[0].text,
        });
      } else {
        console.warn('⚠️ [parseXmlToElements] 后端返回的元素没有 indexPath！');
      }
      
      return elements as any[];
    } catch (error) {
      console.error('❌ XML解析失败，使用前端备用解析器:', error);
      
      // 前端备用解析器
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'text/xml');
      const elements: any[] = [];
      
      doc.querySelectorAll('*').forEach((el, index) => {
        const bounds = el.getAttribute('bounds');
        const text = el.getAttribute('text');
        const resourceId = el.getAttribute('resource-id');
        const className = el.getAttribute('class');
        const clickable = el.getAttribute('clickable') === 'true';
        
        if (bounds) {
          elements.push({
            id: `element_${index}`,
            text: text || '',
            element_type: className || 'View',
            resource_id: resourceId || '',
            bounds: this.parseBounds(bounds),
            is_clickable: clickable,
            is_scrollable: el.getAttribute('scrollable') === 'true',
            is_enabled: el.getAttribute('enabled') !== 'false',
            checkable: el.getAttribute('checkable') === 'true',
            checked: el.getAttribute('checked') === 'true',
            selected: el.getAttribute('selected') === 'true',
            password: el.getAttribute('password') === 'true',
            content_desc: el.getAttribute('content-desc') || ''
          });
        }
      });
      
      return elements;
    }
  }

  /**
   * 解析bounds字符串
   * @deprecated 使用 BoundsCalculator.parseBounds() 统一接口替代
   */
  private static parseBounds(boundsStr: string) {
    const bounds = BoundsCalculator.parseBounds(boundsStr);
    return bounds || { left: 0, top: 0, right: 0, bottom: 0 };
  }

  /**
   * 刷新缓存页面列表
   */
  static async refreshCache(): Promise<void> {
    this.cachedPages = null;
    await this.loadCachedPages();
  }

  /**
   * 删除指定的缓存页面
   */
  static async deleteCachedPage(fileName: string, screenshotFileName?: string): Promise<void> {
    try {
      await invoke('plugin:xml_cache|delete_xml_cache_artifacts', {
        xmlFileName: fileName,
        screenshotFileName: screenshotFileName ?? null,
      });
      
      // 更新本地缓存
      if (this.cachedPages) {
        this.cachedPages = this.cachedPages.filter(page => page.fileName !== fileName);
      }
      
      console.log(`✅ 已删除缓存页面: ${fileName}`);
    } catch (error) {
      console.error(`❌ 删除缓存页面失败: ${fileName}`, error);
      throw error;
    }
  }

  /**
   * 获取缓存统计信息
   */
  static async getCacheStats(): Promise<{
    totalPages: number;
    totalSize: number;
    appPackages: { [key: string]: number };
    oldestPage?: Date;
    newestPage?: Date;
  }> {
    const pages = await this.getCachedPages();
    
    const stats = {
      totalPages: pages.length,
      totalSize: pages.reduce((sum, page) => sum + page.fileSize, 0),
      appPackages: {},
      oldestPage: pages.length > 0 ? new Date(Math.min(...pages.map(p => p.createdAt.getTime()))) : undefined,
      newestPage: pages.length > 0 ? new Date(Math.max(...pages.map(p => p.createdAt.getTime()))) : undefined
    };

    // 统计应用分布
    pages.forEach(page => {
      const app = page.appPackage;
      stats.appPackages[app] = (stats.appPackages[app] || 0) + 1;
    });

    return stats;
  }
}