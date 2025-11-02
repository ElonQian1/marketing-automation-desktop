// src/modules/structural-matching/ui/components/visual-preview/core/structural-matching-xml-loader.ts
// module: structural-matching | layer: ui | role: XML内容加载核心逻辑
// summary: 负责从步骤卡片或缓存获取XML内容，处理多种数据源

import XmlCacheManager from "../../../../../../services/xml-cache-manager";
import type { StepCardData } from "../types";

export interface StructuralMatchingXmlOptions {
  xmlCacheId?: string;
  xmlSnapshot?: {
    xmlContent?: string;
  };
}

/**
 * XML内容加载器类
 */
export class StructuralMatchingXmlLoader {
  /**
   * 加载XML内容
   */
  public static async loadXmlContent(options: StructuralMatchingXmlOptions): Promise<string> {
    console.log("🔍 [StructuralMatching] 开始加载XML内容");

    // 1. 优先使用步骤卡片内联快照
    if (
      options.xmlSnapshot?.xmlContent &&
      options.xmlSnapshot.xmlContent.trim().length > 0
    ) {
      console.log("✅ [StructuralMatching] 使用步骤卡片内联 XML 内容");
      return options.xmlSnapshot.xmlContent;
    }

    // 2. 回退：从缓存ID获取
    if (options.xmlCacheId) {
      console.log("🔍 [StructuralMatching] 从缓存获取XML:", options.xmlCacheId);
      
      const xmlCacheManager = XmlCacheManager.getInstance();
      const cacheEntry = await xmlCacheManager.getCachedXml(options.xmlCacheId);
      
      if (!cacheEntry?.xmlContent) {
        throw new Error(`XML缓存数据不存在: ${options.xmlCacheId}`);
      }

      console.log(
        "✅ [StructuralMatching] XML加载成功，长度:",
        cacheEntry.xmlContent.length
      );
      
      return cacheEntry.xmlContent;
    }

    throw new Error("缺少XML数据源：需要提供xmlCacheId或xmlSnapshot.xmlContent");
  }

  /**
   * 从步骤卡片数据加载XML内容
   */
  public static async loadXmlFromStepCard(stepCardData: StepCardData): Promise<string> {
    if (!stepCardData.xmlCacheId && !stepCardData.xmlSnapshot?.xmlContent) {
      throw new Error("步骤卡片数据中缺少XML内容");
    }

    return this.loadXmlContent({
      xmlCacheId: stepCardData.xmlCacheId,
      xmlSnapshot: stepCardData.xmlSnapshot,
    });
  }

  /**
   * 验证XML内容是否有效
   */
  public static validateXmlContent(xmlContent: string): boolean {
    if (!xmlContent || xmlContent.trim().length === 0) {
      return false;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // 检查是否有解析错误
      const parseErrors = xmlDoc.querySelectorAll("parsererror");
      if (parseErrors.length > 0) {
        console.error("❌ [StructuralMatching] XML解析错误:", parseErrors);
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ [StructuralMatching] XML验证失败:", error);
      return false;
    }
  }

  /**
   * 获取XML统计信息
   */
  public static getXmlStats(xmlContent: string): {
    totalNodes: number;
    hasText: number;
    hasContentDesc: number;
    hasResourceId: number;
    totalSize: number;
  } {
    if (!this.validateXmlContent(xmlContent)) {
      throw new Error("XML内容无效");
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const allNodes = Array.from(xmlDoc.querySelectorAll('*'));

      const stats = {
        totalNodes: allNodes.length,
        hasText: 0,
        hasContentDesc: 0,
        hasResourceId: 0,
        totalSize: xmlContent.length,
      };

      allNodes.forEach(node => {
        if (node.getAttribute('text')) stats.hasText++;
        if (node.getAttribute('content-desc')) stats.hasContentDesc++;
        if (node.getAttribute('resource-id')) stats.hasResourceId++;
      });

      console.log("📊 [StructuralMatching] XML统计信息:", stats);
      return stats;
    } catch (error) {
      console.error("❌ [StructuralMatching] XML统计计算失败:", error);
      throw error;
    }
  }

  /**
   * 预加载XML内容（用于性能优化）
   */
  public static async preloadXmlContent(options: StructuralMatchingXmlOptions): Promise<void> {
    try {
      await this.loadXmlContent(options);
      console.log("✅ [StructuralMatching] XML内容预加载完成");
    } catch (error) {
      console.warn("⚠️ [StructuralMatching] XML内容预加载失败:", error);
    }
  }
}