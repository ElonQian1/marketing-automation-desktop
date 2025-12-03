// src/modules/structural-matching/domain/services/structural-matching-data-provider.ts
// module: structural-matching | layer: domain | role: 数据统一提供者
// summary: 结构匹配功能的统一数据源管理服务

import XmlCacheManager from '../../../../services/xml-cache-manager';
import { parseXML, type VisualUIElement, type XmlParseResult } from '../../../../components/universal-ui/xml-parser';
import { adaptBackendElementToVisualUI, type BackendElementData } from '../../ui/components/visual-preview/utils/structural-matching-data-adapter';
import { EnhancedDataValidator, type ValidationResult, type ValidationRuleConfig } from './enhanced-data-validator';

/**
 * 统一的元素数据格式
 */
export interface UnifiedElementData {
  // 基础标识
  id: string;
  xmlCacheId?: string;
  
  // 标准化元素数据
  element: VisualUIElement;
  
  // 原始数据（用于调试和追溯）
  originalElement?: Record<string, unknown>;
  
  // 数据来源信息
  dataSource: {
    type: 'xml_cache' | 'step_card' | 'selection_context' | 'enhanced_element';
    timestamp: number;
    xmlCacheId?: string;
  };
  
  // 验证状态 (增强版)
  validation: ValidationResult;
}

/**
 * 数据获取配置
 */
export interface DataProviderConfig {
  // 数据源优先级
  priorityOrder: ('xml_cache' | 'step_card' | 'selection_context')[];
  
  // 是否启用数据验证
  enableValidation: boolean;
  
  // 是否启用数据增强
  enableEnhancement: boolean;
  
  // 缓存配置
  caching: {
    enabled: boolean;
    ttl: number; // 生存时间（毫秒）
  };
}

/**
 * 结构匹配数据统一提供者
 * 
 * 职责：
 * 1. 统一多个数据源的访问接口
 * 2. 提供数据验证和增强
 * 3. 确保数据一致性
 * 4. 提供调试和追溯能力
 */
export class StructuralMatchingDataProvider {
  private static instance: StructuralMatchingDataProvider;
  private cache = new Map<string, { data: UnifiedElementData; timestamp: number }>();
  private config: DataProviderConfig;
  private validator: EnhancedDataValidator;

  constructor(config?: Partial<DataProviderConfig>) {
    this.config = {
      priorityOrder: ['xml_cache', 'step_card', 'selection_context'],
      enableValidation: true,
      enableEnhancement: true,
      caching: {
        enabled: true,
        ttl: 30000, // 30秒
      },
      ...config,
    };

    // 初始化增强验证器
    this.validator = new EnhancedDataValidator({
      enableDetailedReporting: true,
      maxValidationTime: 100,
      validateSemanticConsistency: this.config.enableValidation,
      validateStructuralIntegrity: this.config.enableValidation,
    });
  }

  static getInstance(config?: Partial<DataProviderConfig>): StructuralMatchingDataProvider {
    if (!this.instance) {
      this.instance = new StructuralMatchingDataProvider(config);
    }
    return this.instance;
  }

  /**
   * 统一获取元素数据的主入口
   */
  async getUnifiedElementData(
    elementId: string,
    xmlCacheId?: string,
    fallbackSources?: {
      stepCard?: Record<string, unknown>;
      selectionContext?: Record<string, unknown>;
    }
  ): Promise<UnifiedElementData | null> {
    console.log('🔍 [StructuralDataProvider] 获取统一元素数据:', { elementId, xmlCacheId });

    // 检查缓存
    if (this.config.caching.enabled) {
      const cached = this.getCachedData(elementId);
      if (cached) {
        console.log('🎯 [StructuralDataProvider] 使用缓存数据');
        return cached;
      }
    }

    // 按优先级尝试不同数据源
    for (const source of this.config.priorityOrder) {
      try {
        let unifiedData: UnifiedElementData | null = null;

        switch (source) {
          case 'xml_cache':
            unifiedData = await this.getFromXmlCache(elementId, xmlCacheId);
            break;
          case 'step_card':
            unifiedData = await this.getFromStepCard(elementId, fallbackSources?.stepCard);
            break;
          case 'selection_context':
            unifiedData = await this.getFromSelectionContext(elementId, fallbackSources?.selectionContext);
            break;
        }

        if (unifiedData) {
          // 验证数据 (异步)
          if (this.config.enableValidation) {
            await this.validateElementData(unifiedData);
          }

          // 增强数据
          if (this.config.enableEnhancement) {
            unifiedData = await this.enhanceElementData(unifiedData);
          }

          // 缓存结果
          if (this.config.caching.enabled) {
            this.setCachedData(elementId, unifiedData);
          }

          console.log('✅ [StructuralDataProvider] 成功获取数据，来源:', source);
          return unifiedData;
        }
      } catch (error) {
        console.warn(`⚠️ [StructuralDataProvider] ${source} 数据源失败:`, error);
        continue;
      }
    }

    console.error('❌ [StructuralDataProvider] 所有数据源都失败');
    return null;
  }

  /**
   * 从XML缓存获取数据
   */
  private async getFromXmlCache(elementId: string, xmlCacheId?: string): Promise<UnifiedElementData | null> {
    if (!xmlCacheId) {
      throw new Error('xmlCacheId is required for xml_cache source');
    }

    const xmlCacheEntry = await XmlCacheManager.getInstance().getCachedXml(xmlCacheId);
    if (!xmlCacheEntry || !xmlCacheEntry.xmlContent) {
      throw new Error(`XML cache not found: ${xmlCacheId}`);
    }

    const parseResult = await parseXML(xmlCacheEntry.xmlContent);
    const targetElement = parseResult.elements.find(el => el.id === elementId);
    
    if (!targetElement) {
      throw new Error(`Element not found in XML: ${elementId}`);
    }

    const elementData: UnifiedElementData = {
      id: elementId,
      xmlCacheId,
      element: targetElement,
      dataSource: {
        type: 'xml_cache',
        timestamp: Date.now(),
        xmlCacheId,
      },
      validation: this.createDefaultValidationResult(), // 临时默认值，后续会被验证器替换
    };

    return elementData;
  }

  /**
   * 从步骤卡片获取数据
   */
  private async getFromStepCard(elementId: string, stepCardData?: Record<string, unknown>): Promise<UnifiedElementData | null> {
    if (!stepCardData?.original_element) {
      throw new Error('Step card original_element is missing');
    }

    const originalElement = stepCardData.original_element as Record<string, unknown>;
    
    // 转换为标准格式
    const visualElement = adaptBackendElementToVisualUI(originalElement as BackendElementData);

    const elementData: UnifiedElementData = {
      id: elementId,
      element: visualElement,
      originalElement,
      dataSource: {
        type: 'step_card',
        timestamp: Date.now(),
      },
      validation: this.createDefaultValidationResult(), // 临时默认值
    };

    return elementData;
  }

  /**
   * 从选择上下文获取数据
   */
  private async getFromSelectionContext(elementId: string, selectionData?: Record<string, unknown>): Promise<UnifiedElementData | null> {
    if (!selectionData) {
      throw new Error('Selection context data is missing');
    }

    // 转换为标准格式
    const visualElement = adaptBackendElementToVisualUI(selectionData as BackendElementData);

    const elementData: UnifiedElementData = {
      id: elementId,
      element: visualElement,
      originalElement: selectionData,
      dataSource: {
        type: 'selection_context',
        timestamp: Date.now(),
      },
      validation: this.createDefaultValidationResult(), // 临时默认值
    };

    return elementData;
  }

  /**
   * 验证元素数据 (使用增强验证器)
   */
  private async validateElementData(data: UnifiedElementData): Promise<void> {
    if (!this.config.enableValidation) {
      // 如果禁用验证，使用简单的默认验证结果
      data.validation = this.createDefaultValidationResult();
      return;
    }

    try {
      const validationResult = await this.validator.validateElementData(data);
      data.validation = validationResult;

      if (!validationResult.isValid) {
        console.error('❌ [StructuralDataProvider] 数据验证失败:', {
          errors: validationResult.criticalErrors.length,
          warnings: validationResult.warnings.length,
          score: validationResult.score
        });
      } else {
        console.log('✅ [StructuralDataProvider] 数据验证通过:', {
          score: validationResult.score,
          warnings: validationResult.warnings.length
        });
      }
    } catch (error) {
      console.error('❌ [StructuralDataProvider] 验证器执行失败:', error);
      data.validation = this.createDefaultValidationResult(false, ['验证器执行失败']);
    }
  }

  /**
   * 创建默认验证结果
   */
  private createDefaultValidationResult(isValid = true, errorMessages: string[] = []): ValidationResult {
    return {
      isValid,
      score: isValid ? 85 : 30,
      criticalErrors: errorMessages.map(msg => ({
        code: 'UNKNOWN_ERROR',
        message: msg,
        field: 'unknown',
        severity: 'critical' as const,
        context: {}
      })),
      warnings: [],
      suggestions: [],
      validationTime: 0,
      rulesExecuted: 0,
      qualityReport: {
        completeness: isValid ? 80 : 30,
        accuracy: isValid ? 90 : 40,
        consistency: isValid ? 85 : 50,
        accessibility: isValid ? 75 : 60,
        freshness: 95,
        metrics: {
          hasRequiredFields: isValid,
          hasValidBounds: isValid,
          hasSemanticInfo: isValid,
          hasAccessibilityLabels: isValid,
          dataAge: 0
        }
      },
      repairActions: []
    };
  }

  /**
   * 增强元素数据
   */
  private async enhanceElementData(data: UnifiedElementData): Promise<UnifiedElementData> {
    // 这里可以添加数据增强逻辑
    // 例如：补充缺失的属性、计算衍生属性等
    
    return {
      ...data,
      element: {
        ...data.element,
        // 确保有用户友好的名称
        userFriendlyName: data.element.userFriendlyName || 
          data.element.text || 
          data.element.contentDesc || 
          data.element.type || 
          'Unknown Element',
      },
    };
  }

  /**
   * 缓存管理
   */
  private getCachedData(elementId: string): UnifiedElementData | null {
    const cached = this.cache.get(elementId);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.caching.ttl) {
      this.cache.delete(elementId);
      return null;
    }

    return cached.data;
  }

  private setCachedData(elementId: string, data: UnifiedElementData): void {
    this.cache.set(elementId, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 清理过期缓存
   */
  public cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.caching.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): {
    cacheSize: number;
    config: DataProviderConfig;
    cacheEntries: Array<{ elementId: string; source: string; age: number }>;
  } {
    const now = Date.now();
    return {
      cacheSize: this.cache.size,
      config: this.config,
      cacheEntries: Array.from(this.cache.entries()).map(([elementId, cached]) => ({
        elementId,
        source: cached.data.dataSource.type,
        age: now - cached.timestamp,
      })),
    };
  }

  /**
   * 重置实例（用于测试）
   */
  public static resetInstance(): void {
    // 重置单例实例用于测试
    (StructuralMatchingDataProvider as unknown as { instance: StructuralMatchingDataProvider | undefined }).instance = undefined;
  }
}

export default StructuralMatchingDataProvider;