// src/modules/structural-matching/services/step-card-parameter-inference/step-card-inference-service.ts
// module: structural-matching | layer: services | role: 步骤卡片推理服务
// summary: 处理步骤卡片的参数推理逻辑和字段策略分析

import { 
  FieldStrategyInference, 
  ParameterInferenceOptions,
  ParsedUIElement
} from './types';
import { FieldType } from '../../domain/constants/field-types';
import { FieldMatchStrategy } from '../../domain/skeleton-match-strategy';

/**
 * 步骤卡片推理服务
 * 负责分析步骤卡片中的字段策略和参数配置
 */
export class StepCardInferenceService {
  /**
   * 推导字段匹配策略
   */
  inferFieldStrategies(
    element: ParsedUIElement,
    options: ParameterInferenceOptions
  ): FieldStrategyInference[] {
    const strategies: FieldStrategyInference[] = [];

    console.log('🔍 [StepCardInference] 开始推导字段策略', {
      elementTag: element.tag,
      hasText: !!element.text,
      attributeCount: Object.keys(element.attributes).length
    });

    // 分析各个字段类型
    const fieldTypes: FieldType[] = [
      FieldType.TEXT,
      FieldType.CONTENT_DESC,
      FieldType.RESOURCE_ID,
      FieldType.CLASS_NAME,
      FieldType.BOUNDS
    ];

    for (const fieldType of fieldTypes) {
      const inference = this.inferSingleFieldStrategy(element, fieldType, options);
      if (inference) {
        strategies.push(inference);
      }
    }

    console.log('✅ [StepCardInference] 字段策略推导完成', {
      strategiesCount: strategies.length,
      enabledCount: strategies.filter(s => s.enabled).length
    });

    return strategies;
  }

  /**
   * 分析元素的易变性
   */
  analyzeElementVolatility(element: ParsedUIElement): {
    isVolatile: boolean;
    volatileFields: string[];
    confidence: number;
    reasons: string[];
  } {
    const volatileFields: string[] = [];
    const reasons: string[] = [];

    // 检查文本易变性
    if (element.text) {
      if (this.isVolatileText(element.text)) {
        volatileFields.push('text');
        reasons.push(`文本包含易变内容: ${element.text}`);
      }
    }

    // 检查内容描述易变性
    const contentDesc = element.attributes['content-desc'];
    if (contentDesc && this.isVolatileText(contentDesc)) {
      volatileFields.push('content-desc');
      reasons.push(`内容描述包含易变内容: ${contentDesc}`);
    }

    // 检查资源ID稳定性
    const resourceId = element.attributes['resource-id'];
    if (resourceId && this.isVolatileResourceId(resourceId)) {
      volatileFields.push('resource-id');
      reasons.push(`资源ID可能不稳定: ${resourceId}`);
    }

    const isVolatile = volatileFields.length > 0;
    const confidence = this.calculateVolatilityConfidence(volatileFields.length, element);

    return {
      isVolatile,
      volatileFields,
      confidence,
      reasons
    };
  }

  /**
   * 生成推理摘要
   */
  generateInferenceSummary(
    strategies: FieldStrategyInference[]
  ): {
    recommendedMode: 'conservative' | 'balanced' | 'aggressive';
    confidence: number;
    warnings: string[];
    suggestions: string[];
  } {
    const enabledStrategies = strategies.filter(s => s.enabled);
    const avgConfidence = enabledStrategies.reduce((sum, s) => sum + s.confidence, 0) / enabledStrategies.length;
    
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 分析推荐模式
    let recommendedMode: 'conservative' | 'balanced' | 'aggressive' = 'balanced';
    
    const hasVolatileFields = strategies.some(s => s.isVolatile);
    const hasHighConfidence = avgConfidence > 0.8;
    const hasUniqueIdentifiers = strategies.some(s => 
      s.fieldType === FieldType.RESOURCE_ID && s.enabled && !s.isVolatile
    );

    if (hasVolatileFields) {
      recommendedMode = 'conservative';
      warnings.push('检测到易变字段，建议使用保守模式');
    } else if (hasHighConfidence && hasUniqueIdentifiers) {
      recommendedMode = 'aggressive';
      suggestions.push('元素特征稳定，可以使用快速模式');
    }

    // 生成建议
    if (!hasUniqueIdentifiers) {
      suggestions.push('建议增加更多稳定的标识字段');
    }

    if (enabledStrategies.length < 2) {
      warnings.push('启用的匹配策略较少，可能影响匹配准确性');
    }

    return {
      recommendedMode,
      confidence: avgConfidence,
      warnings,
      suggestions
    };
  }

  /**
   * 推导单个字段策略
   */
  private inferSingleFieldStrategy(
    element: ParsedUIElement,
    fieldType: FieldType,
    options: ParameterInferenceOptions
  ): FieldStrategyInference | null {
    const fieldValue = this.getFieldValue(element, fieldType);
    if (!fieldValue) {
      return null;
    }

    let strategy: FieldMatchStrategy;
    let confidence: number;
    let enabled: boolean;
    let reason: string;
    let isVolatile: boolean;

    switch (fieldType) {
      case FieldType.TEXT:
        ({ strategy, confidence, enabled, reason, isVolatile } = this.inferTextStrategy(fieldValue, options));
        break;
      
      case FieldType.CONTENT_DESC:
        ({ strategy, confidence, enabled, reason, isVolatile } = this.inferContentDescStrategy(fieldValue, options));
        break;
      
      case FieldType.RESOURCE_ID:
        ({ strategy, confidence, enabled, reason, isVolatile } = this.inferResourceIdStrategy(fieldValue));
        break;
      
      case FieldType.CLASS_NAME:
        ({ strategy, confidence, enabled, reason, isVolatile } = this.inferClassNameStrategy(fieldValue));
        break;
      
      case FieldType.BOUNDS:
        ({ strategy, confidence, enabled, reason, isVolatile } = this.inferBoundsStrategy(element, options));
        break;
      
      default:
        return null;
    }

    return {
      fieldType,
      recommendedStrategy: strategy,
      enabled,
      confidence,
      reason,
      value: fieldValue,
      isVolatile
    };
  }

  /**
   * 获取字段值
   */
  private getFieldValue(element: ParsedUIElement, fieldType: FieldType): string {
    switch (fieldType) {
      case FieldType.TEXT:
        return element.text || '';
      case FieldType.CONTENT_DESC:
        return element.attributes['content-desc'] || '';
      case FieldType.RESOURCE_ID:
        return element.attributes['resource-id'] || '';
      case FieldType.CLASS_NAME:
        return element.attributes.class || element.tag;
      case FieldType.BOUNDS:
        return element.attributes.bounds || '';
      default:
        return '';
    }
  }

  /**
   * 推导文本策略
   */
  private inferTextStrategy(text: string, options: ParameterInferenceOptions) {
    const isVolatile = this.isVolatileText(text);
    const hasNumbers = /\d/.test(text);
    const isShort = text.length < 20;
    const isCommon = this.isCommonText(text);

    let strategy: FieldMatchStrategy;
    let confidence: number;
    let enabled: boolean;
    let reason: string;

    if (isVolatile) {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.6;
      enabled = options.ignoreVolatileFields === false;
      reason = '文本内容易变，使用模式匹配';
    } else if (hasNumbers && !isCommon) {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.7;
      enabled = true;
      reason = '包含数字，使用模式匹配';
    } else if (isShort && !isCommon) {
      strategy = FieldMatchStrategy.EQUALS;
      confidence = 0.9;
      enabled = true;
      reason = '短文本且非通用，使用精确匹配';
    } else {
      strategy = FieldMatchStrategy.CONTAINS;
      confidence = 0.8;
      enabled = true;
      reason = '使用包含匹配以提高兼容性';
    }

    return { strategy, confidence, enabled, reason, isVolatile };
  }

  /**
   * 推导内容描述策略
   */
  private inferContentDescStrategy(contentDesc: string, options: ParameterInferenceOptions) {
    const isVolatile = this.isVolatileText(contentDesc);
    const hasNumbers = /\d/.test(contentDesc);

    let strategy: FieldMatchStrategy;
    let confidence: number;
    let enabled: boolean;
    let reason: string;

    if (isVolatile) {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.5;
      enabled = options.ignoreVolatileFields === false;
      reason = '内容描述易变';
    } else if (hasNumbers) {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.7;
      enabled = true;
      reason = '内容描述包含数字';
    } else {
      strategy = FieldMatchStrategy.EQUALS;
      confidence = 0.85;
      enabled = true;
      reason = '内容描述稳定，适合精确匹配';
    }

    return { strategy, confidence, enabled, reason, isVolatile };
  }

  /**
   * 推导资源ID策略
   */
  private inferResourceIdStrategy(resourceId: string) {
    const isVolatile = this.isVolatileResourceId(resourceId);
    const isGeneric = this.isGenericResourceId(resourceId);

    let strategy: FieldMatchStrategy;
    let confidence: number;
    let enabled: boolean;
    let reason: string;

    if (isVolatile) {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.6;
      enabled = true;
      reason = '资源ID可能不稳定，使用模式匹配';
    } else if (isGeneric) {
      strategy = FieldMatchStrategy.EQUALS;
      confidence = 0.7;
      enabled = true;
      reason = '通用资源ID，适合精确匹配';
    } else {
      strategy = FieldMatchStrategy.EQUALS;
      confidence = 0.95;
      enabled = true;
      reason = '唯一资源ID，最高优先级';
    }

    return { strategy, confidence, enabled, reason, isVolatile };
  }

  /**
   * 推导类名策略
   */
  private inferClassNameStrategy(className: string) {
    const isAndroidSystem = className.includes('android.');
    const isCommon = this.isCommonClassName(className);

    let strategy: FieldMatchStrategy;
    let confidence: number;
    let enabled: boolean;
    let reason: string;

    if (isAndroidSystem) {
      strategy = FieldMatchStrategy.EQUALS;
      confidence = 0.9;
      enabled = true;
      reason = '系统类名，高可靠性';
    } else if (isCommon) {
      strategy = FieldMatchStrategy.EQUALS;
      confidence = 0.6;
      enabled = true;
      reason = '通用类名，中等可靠性';
    } else {
      strategy = FieldMatchStrategy.EQUALS;
      confidence = 0.8;
      enabled = true;
      reason = '自定义类名，较高可靠性';
    }

    return { strategy, confidence, enabled, reason, isVolatile: false };
  }

  /**
   * 推导边界策略
   */
  private inferBoundsStrategy(element: ParsedUIElement, options: ParameterInferenceOptions) {
    const bounds = element.bounds;
    const isLargeElement = bounds.width > 300 || bounds.height > 100;
    const hasStablePosition = this.hasStablePosition(element);

    let strategy: FieldMatchStrategy;
    let confidence: number;
    let enabled: boolean;
    let reason: string;

    if (isLargeElement && hasStablePosition) {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.8;
      enabled = true;
      reason = '大尺寸元素，位置相对稳定';
    } else if (hasStablePosition) {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.7;
      enabled = true;
      reason = '位置稳定，允许小幅偏移';
    } else {
      strategy = FieldMatchStrategy.PATTERN;
      confidence = 0.5;
      enabled = options.geometricWeight !== 0;
      reason = '位置可能变动，谨慎使用';
    }

    return { strategy, confidence, enabled, reason, isVolatile: !hasStablePosition };
  }

  /**
   * 检查文本是否易变
   */
  private isVolatileText(text: string): boolean {
    // 检查时间格式
    if (/\d{2}:\d{2}|\d{4}-\d{2}-\d{2}/.test(text)) return true;
    
    // 检查数字（可能是计数、价格等）
    if (/^\d+$/.test(text.trim())) return true;
    
    // 检查百分比
    if (/\d+%/.test(text)) return true;
    
    // 检查常见易变词汇
    const volatileKeywords = ['刚刚', '分钟前', '小时前', '天前', '在线', '离线'];
    return volatileKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * 检查资源ID是否易变
   */
  private isVolatileResourceId(resourceId: string): boolean {
    // 检查是否包含动态生成的标识
    if (/\d{6,}/.test(resourceId)) return true;
    
    // 检查是否为临时ID格式
    if (/temp_|tmp_|generated_/.test(resourceId)) return true;
    
    return false;
  }

  /**
   * 检查是否为通用文本
   */
  private isCommonText(text: string): boolean {
    const commonTexts = [
      '确定', '取消', '返回', '下一步', '提交', '保存',
      '登录', '注册', '搜索', '更多', '刷新', '加载',
      'OK', 'Cancel', 'Next', 'Back', 'Submit', 'Save'
    ];
    return commonTexts.includes(text.trim());
  }

  /**
   * 检查是否为通用资源ID
   */
  private isGenericResourceId(resourceId: string): boolean {
    const genericIds = [
      'button', 'text', 'image', 'view', 'layout',
      'confirm', 'cancel', 'ok', 'next', 'back'
    ];
    return genericIds.some(id => resourceId.toLowerCase().includes(id));
  }

  /**
   * 检查是否为通用类名
   */
  private isCommonClassName(className: string): boolean {
    const commonClasses = [
      'Button', 'TextView', 'ImageView', 'EditText',
      'LinearLayout', 'RelativeLayout', 'FrameLayout'
    ];
    return commonClasses.some(cls => className.includes(cls));
  }

  /**
   * 检查元素是否有稳定位置
   */
  private hasStablePosition(element: ParsedUIElement): boolean {
    // 检查是否在固定容器中（如导航栏、工具栏）
    let current = element.parent;
    while (current) {
      const className = current.attributes.class || current.tag;
      if (className.includes('Toolbar') || className.includes('ActionBar') || className.includes('TabLayout')) {
        return true;
      }
      current = current.parent;
    }
    
    // 检查是否为全屏元素
    const isFullWidth = element.bounds.width > 800;
    const isTopElement = element.bounds.y < 200;
    
    return isFullWidth && isTopElement;
  }

  /**
   * 计算易变性置信度
   */
  private calculateVolatilityConfidence(volatileFieldCount: number, element: ParsedUIElement): number {
    const totalFields = Object.keys(element.attributes).length + (element.text ? 1 : 0);
    if (totalFields === 0) return 0;
    
    const volatileRatio = volatileFieldCount / totalFields;
    return Math.max(0, 1 - volatileRatio);
  }
}