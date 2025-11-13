// src/protocol/v3/envelope-builder.ts
// module: protocol | layer: infrastructure | role: ContextEnvelope构建器
// summary: 统一构建ContextEnvelope的工具函数，自动处理xmlContent降级

import type { ContextEnvelope } from './types';
import type { SmartStepCard } from '../../types/smartStepCard';

/**
 * 📦 ContextEnvelope 构建器选项
 */
export interface EnvelopeBuilderOptions {
  /** 设备ID（必需） */
  deviceId: string;
  /** 应用包名 */
  appPackage?: string;
  /** 应用Activity */
  appActivity?: string | null;
  /** 分析缓存ID */
  analysisId?: string;
  /** 屏幕哈希 */
  screenHash?: string | null;
  /** XML缓存ID */
  xmlCacheId?: string | null;
  /** XML内容（用于跨机器执行） */
  xmlContent?: string | null;
  /** 执行模式 */
  executionMode?: 'strict' | 'relaxed';
}

/**
 * 🎯 从步骤卡片构建 ContextEnvelope
 * 
 * **自动处理 xmlContent 降级：**
 * 1. 优先从 card.xmlSnapshot.xmlContent 获取
 * 2. 降级到 null（后端会从设备实时读取）
 * 
 * @param deviceId - 设备ID
 * @param card - 步骤卡片（可选，用于提取xmlSnapshot）
 * @param options - 其他选项
 * @returns ContextEnvelope
 */
export function buildEnvelopeFromCard(
  deviceId: string,
  card?: SmartStepCard | null,
  options?: Partial<EnvelopeBuilderOptions>
): ContextEnvelope {
  // 🔍 检测 xmlContent 降级情况
  const xmlContent = card?.xmlSnapshot?.xmlContent || options?.xmlContent || null;
  const hasXmlSnapshot = !!xmlContent;
  
  if (!hasXmlSnapshot) {
    console.warn('⚠️ [envelope-builder] xmlContent 缺失，将降级到实时设备XML', {
      cardId: card?.id,
      hasCard: !!card,
      hasXmlSnapshot: !!card?.xmlSnapshot,
      dataSource: 'real-time-device'
    });
  } else {
    console.log('✅ [envelope-builder] 使用 xmlSnapshot (跨机器模式)', {
      cardId: card?.id,
      xmlLength: xmlContent.length,
      dataSource: 'xml-snapshot'
    });
  }

  return {
    deviceId,
    app: {
      package: options?.appPackage || card?.appPackage || '',
      activity: options?.appActivity ?? null,
    },
    snapshot: {
      analysisId: options?.analysisId,
      screenHash: options?.screenHash ?? null,
      xmlCacheId: options?.xmlCacheId ?? card?.xmlSnapshot?.xmlCacheId ?? null,
      xmlContent: xmlContent  // 🎯 使用检测后的 xmlContent
    },
    executionMode: options?.executionMode ?? 'relaxed',
  };
}

/**
 * 🔧 直接构建 ContextEnvelope（不依赖卡片）
 * 
 * @param options - 完整选项
 * @returns ContextEnvelope
 */
export function buildEnvelope(options: EnvelopeBuilderOptions): ContextEnvelope {
  // 🔍 检测 xmlContent 降级情况
  const xmlContent = options.xmlContent || null;
  const hasXmlContent = !!xmlContent;
  
  if (!hasXmlContent) {
    console.warn('⚠️ [envelope-builder] xmlContent 未提供，将降级到实时设备XML', {
      deviceId: options.deviceId,
      dataSource: 'real-time-device'
    });
  } else {
    console.log('✅ [envelope-builder] 使用 xmlContent (跨机器模式)', {
      deviceId: options.deviceId,
      xmlLength: xmlContent.length,
      dataSource: 'xml-content-provided'
    });
  }

  return {
    deviceId: options.deviceId,
    app: {
      package: options.appPackage || '',
      activity: options.appActivity ?? null,
    },
    snapshot: {
      analysisId: options.analysisId,
      screenHash: options.screenHash ?? null,
      xmlCacheId: options.xmlCacheId ?? null,
      xmlContent: xmlContent  // 🎯 使用检测后的 xmlContent
    },
    executionMode: options.executionMode ?? 'strict',
  };
}

/**
 * 🔍 检查 envelope 是否包含 XML 快照
 */
export function hasXmlSnapshot(envelope: ContextEnvelope): boolean {
  return !!(envelope.snapshot.xmlContent && envelope.snapshot.xmlContent.length > 0);
}

/**
 * 📊 获取 envelope 的数据源类型（用于日志）
 */
export function getEnvelopeDataSource(envelope: ContextEnvelope): 'snapshot' | 'realtime' {
  return hasXmlSnapshot(envelope) ? 'snapshot' : 'realtime';
}
