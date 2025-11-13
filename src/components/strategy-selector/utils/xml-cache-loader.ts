// src/components/strategy-selector/utils/xml-cache-loader.ts
// module: strategy-selector | layer: utils | role: XML缓存加载工具
// summary: 统一的XML缓存三级降级加载策略

import type { StepCard } from '../../../store/stepcards';

/**
 * XML缓存加载结果
 */
export interface XmlCacheLoadResult {
  /** XML内容 */
  xmlContent: string | null;
  /** 加载来源 */
  source: 'xmlCacheId' | 'embedded' | 'failed';
  /** 是否成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 三级降级策略加载XML缓存
 * 
 * 优先级：
 * 1. xmlCacheId → 从缓存管理器获取
 * 2. 内嵌xmlContent → 步骤卡片保存的快照
 * 3. 完全丢失 → 返回失败
 * 
 * @param card 步骤卡片
 * @param context 调用上下文（用于日志）
 * @returns XML加载结果
 */
export async function loadXmlWithFallback(
  card: StepCard,
  context: string
): Promise<XmlCacheLoadResult> {
  console.log(`📦 [${context}] 开始加载XML缓存`, {
    cardId: card.id?.slice(-8),
    hasXmlCacheId: !!card.xmlSnapshot?.xmlCacheId,
    hasEmbeddedXml: !!card.xmlSnapshot?.xmlContent,
  });

  // 优先级1: 从xmlCacheId获取
  if (card.xmlSnapshot?.xmlCacheId) {
    try {
      const XmlCacheManager = (await import('../../../services/xml-cache-manager')).default;
      const cacheManager = XmlCacheManager.getInstance();
      const cacheEntry = await cacheManager.getCachedXml(card.xmlSnapshot.xmlCacheId);
      
      if (cacheEntry && cacheEntry.xmlContent) {
        console.log(`✅ [${context}] 从xmlCacheId恢复XML成功`, {
          xmlCacheId: card.xmlSnapshot.xmlCacheId,
          xmlLength: cacheEntry.xmlContent.length,
        });
        
        return {
          xmlContent: cacheEntry.xmlContent,
          source: 'xmlCacheId',
          success: true,
        };
      }
    } catch (error) {
      console.warn(`⚠️ [${context}] xmlCacheId获取失败，尝试备用方案`, error);
    }
  }

  // 优先级2: 使用内嵌XML
  if (card.xmlSnapshot?.xmlContent) {
    console.log(`✅ [${context}] 使用内嵌XML`, {
      xmlLength: card.xmlSnapshot.xmlContent.length,
    });
    
    return {
      xmlContent: card.xmlSnapshot.xmlContent,
      source: 'embedded',
      success: true,
    };
  }

  // 优先级3: XML完全丢失
  console.error(`❌ [${context}] XML缓存完全丢失`);
  
  return {
    xmlContent: null,
    source: 'failed',
    success: false,
    error: 'XML缓存已失效，请重新分析页面或使用传统策略',
  };
}

/**
 * 验证XML内容完整性
 * 
 * @param xmlContent XML内容
 * @param context 调用上下文
 * @returns 是否有效
 */
export function validateXmlContent(
  xmlContent: string | null,
  context: string
): boolean {
  if (!xmlContent) {
    console.error(`❌ [${context}] XML内容为空`);
    return false;
  }

  if (xmlContent.length < 100) {
    console.warn(`⚠️ [${context}] XML内容过短（${xmlContent.length}字节），可能不完整`);
    return false;
  }

  return true;
}
