/**
 * 统一视图数据管理器 - 主类
 * 中心化管理三个视图的数据，避免重复计算
 */

import { UnifiedViewData, ProcessingOptions } from './types';
import { CacheManager } from './utils/CacheManager';
import { ElementEnhancer } from './utils/ElementEnhancer';
import { TreeViewDataGenerator } from './generators/TreeViewDataGenerator';
import { VisualViewDataGenerator } from './generators/VisualViewDataGenerator';
import { ListViewDataGenerator } from './generators/ListViewDataGenerator';
import UniversalUIAPI from '../../api/universalUIAPI';

export class UnifiedViewDataManager {
  /**
   * 生成统一视图数据
   */
  static async generateUnifiedData(
    xmlContent: string, 
    deviceId: string = 'unknown',
    options: ProcessingOptions = {}
  ): Promise<UnifiedViewData> {
    const startTime = Date.now();
    const cacheKey = CacheManager.generateCacheKey(xmlContent);
    
    // 检查缓存（除非强制重新分析）
    if (!options.forceReanalyze && options.enableCaching !== false) {
      const cached = CacheManager.get(cacheKey);
      if (cached && CacheManager.isValid(cached)) {
        if (options.verbose) {
          console.log('🎯 使用缓存的统一视图数据');
        }
        return cached;
      }
    } else {
      if (options.verbose) {
        console.log('🔄 强制重新分析，忽略缓存');
      }
      CacheManager.delete(cacheKey);
    }

    console.log('🔄 生成新的统一视图数据...');

    try {
      // 1. 解析基础UI元素
      const rawElements = await UniversalUIAPI.extractPageElements(xmlContent);
      
      // 应用最大元素限制
      const limitedElements = options.maxElements 
        ? rawElements.slice(0, options.maxElements)
        : rawElements;
      
      // 2. 增强元素
      const enhancedElements = await ElementEnhancer.enhance(limitedElements);
      
      // 3. 并行生成各视图的特定数据
      const [treeViewData, visualViewData, listViewData] = await Promise.all([
        TreeViewDataGenerator.generate(enhancedElements),
        VisualViewDataGenerator.generate(enhancedElements),
        ListViewDataGenerator.generate(enhancedElements)
      ]);

      const processingTime = Date.now() - startTime;
      
      const unifiedData: UnifiedViewData = {
        xmlContent,
        rawElements: limitedElements,
        enhancedElements,
        treeViewData,
        visualViewData,
        listViewData,
        metadata: {
          generatedAt: new Date(),
          xmlSource: xmlContent.substring(0, 100) + (xmlContent.length > 100 ? '...' : ''),
          deviceId,
          processingTimeMs: processingTime,
          elementCount: enhancedElements.length,
          enhancementVersion: '2.0.0',
        },
      };

      // 缓存结果
      if (options.enableCaching !== false) {
        CacheManager.set(cacheKey, unifiedData);
      }

      if (options.verbose) {
        console.log(`✅ 统一视图数据生成完成 (${processingTime}ms)`, {
          rawElements: limitedElements.length,
          enhancedElements: enhancedElements.length,
          treeRoots: treeViewData.rootNodes.length,
          visualCategories: visualViewData.visualCategories.length,
          listGroups: Object.keys(listViewData.groupedElements).length,
        });
      }

      return unifiedData;
      
    } catch (error) {
      console.error('❌ 统一视图数据生成失败:', error);
      throw new Error(`Failed to generate unified view data: ${error}`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats() {
    return CacheManager.getStats();
  }

  /**
   * 清空缓存
   */
  static clearCache(): void {
    CacheManager.clear();
  }

  /**
   * 预热缓存（批量处理多个XML）
   */
  static async preloadCache(
    xmlContents: string[],
    deviceId?: string,
    options: ProcessingOptions = {}
  ): Promise<void> {
    console.log(`🔥 预热缓存，处理 ${xmlContents.length} 个页面...`);
    
    const promises = xmlContents.map(xml => 
      this.generateUnifiedData(xml, deviceId, { ...options, verbose: false })
    );
    
    await Promise.all(promises);
    console.log('✅ 缓存预热完成');
  }

  /**
   * 增量更新（当XML部分变化时）
   */
  static async incrementalUpdate(
    existingData: UnifiedViewData,
    newXmlContent: string,
    options: ProcessingOptions = {}
  ): Promise<UnifiedViewData> {
    // 简单实现：检查是否有重大变化
    const similarity = this.calculateSimilarity(existingData.xmlContent, newXmlContent);
    
    if (similarity > 0.95) {
      // 变化很小，直接返回现有数据
      if (options.verbose) {
        console.log('📊 XML相似度高，使用现有数据');
      }
      return existingData;
    }
    
    // 变化较大，重新生成
    return this.generateUnifiedData(newXmlContent, existingData.metadata.deviceId, options);
  }

  /**
   * 计算XML相似度
   */
  private static calculateSimilarity(xml1: string, xml2: string): number {
    if (xml1 === xml2) return 1.0;
    
    const len1 = xml1.length;
    const len2 = xml2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    // 简单的相似度计算（可以改进为更复杂的算法）
    let commonChars = 0;
    const minLen = Math.min(len1, len2);
    
    for (let i = 0; i < minLen; i++) {
      if (xml1[i] === xml2[i]) {
        commonChars++;
      }
    }
    
    return commonChars / maxLen;
  }

  /**
   * 验证数据完整性
   */
  static validateData(data: UnifiedViewData): boolean {
    try {
      return !!(
        data &&
        data.rawElements &&
        data.enhancedElements &&
        data.treeViewData &&
        data.visualViewData &&
        data.listViewData &&
        data.metadata &&
        data.enhancedElements.length === data.rawElements.length
      );
    } catch {
      return false;
    }
  }
}