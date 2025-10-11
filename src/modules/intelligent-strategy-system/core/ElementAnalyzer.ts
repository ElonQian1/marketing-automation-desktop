// src/modules/intelligent-strategy-system/core/ElementAnalyzer.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 统一元素分析器
 * 整合 ElementFieldAnalyzer、SmartConditionGenerator、StrategyDecisionEngine 的元素分析功能
 * 
 * 根据文档6、7、8的要求，作为"智能识别匹配策略"模块的核心组件
 */

import type { MatchStrategy, StrategyRecommendation } from '../types/StrategyTypes';

/**
 * 元素属性定义（整合自三个模块）
 */
interface FieldDefinition {
  priority: number;
  type: 'identifier' | 'semantic' | 'structural' | 'behavioral';
  confidence: number;
  description: string;
}

/**
 * 元素分析上下文
 */
interface ElementContext {
  level: 'self' | 'parent' | 'child' | 'sibling';
  depth: number;
  hasClickableParent: boolean;
  containerType?: string;
  siblingCount: number;
}

/**
 * 统一的元素属性结构
 */
interface ElementProperties {
  // 基础属性
  resourceId?: string;
  text?: string;
  contentDesc?: string;
  className?: string;
  packageName?: string;
  
  // 行为属性
  clickable: boolean;
  enabled: boolean;
  focusable: boolean;
  selected: boolean;
  
  // 层级信息
  context: ElementContext;
  
  // 置信度评估
  fieldConfidences: Record<string, number>;
  overallConfidence: number;
}

/**
 * 统一元素分析器
 * 
 * 设计原则：
 * 1. 单一职责：只做元素分析，不做策略决策
 * 2. 高内聚：所有元素分析逻辑集中在此
 * 3. 低耦合：通过接口与策略决策引擎交互
 */
export class ElementAnalyzer {
  
  /**
   * 字段定义（整合自三个模块的最佳实践）
   */
  private static readonly FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
    'resource-id': {
      priority: 0.95,
      type: 'identifier',
      confidence: 0.95,
      description: '元素的资源标识符，最稳定的匹配方式'
    },
    'content-desc': {
      priority: 0.90,
      type: 'semantic',
      confidence: 0.90,
      description: '无障碍描述，语义化匹配'
    },
    'text': {
      priority: 0.85,
      type: 'semantic',
      confidence: 0.85,
      description: '文本内容，用户可见的语义信息'
    },
    'class': {
      priority: 0.70,
      type: 'structural',
      confidence: 0.70,
      description: '控件类型，结构化匹配'
    },
    'clickable': {
      priority: 0.60,
      type: 'behavioral',
      confidence: 0.60,
      description: '可点击性，行为特征'
    },
    'package': {
      priority: 0.45,
      type: 'structural',
      confidence: 0.45,
      description: '应用包名，应用范围限定'
    },
    'enabled': {
      priority: 0.55,
      type: 'behavioral',
      confidence: 0.55,
      description: '启用状态，可交互性'
    },
    'selected': {
      priority: 0.50,
      type: 'behavioral',
      confidence: 0.50,
      description: '选中状态，状态特征'
    }
  };

  /**
   * 统一的元素属性解析
   * 
   * 整合三个模块的解析逻辑：
   * - ElementFieldAnalyzer 的字段定义
   * - SmartConditionGenerator 的层级分析
   * - StrategyDecisionEngine 的上下文感知
   */
  static analyzeElementProperties(element: any, xmlContent?: string): ElementProperties {
    // 1. 提取基础属性
    const attrs = element.attrs || element.attributes || {};
    
    // 2. 分析元素上下文
    const context = this.analyzeElementContext(element, xmlContent);
    
    // 3. 计算字段置信度
    const fieldConfidences = this.calculateAllFieldConfidences(attrs, context);
    
    // 4. 计算整体置信度
    const overallConfidence = this.calculateOverallConfidence(fieldConfidences);

    return {
      resourceId: attrs['resource-id'],
      text: attrs['text'],
      contentDesc: attrs['content-desc'],
      className: attrs['class'],
      packageName: attrs['package'],
      
      clickable: attrs['clickable'] === 'true',
      enabled: attrs['enabled'] === 'true',
      focusable: attrs['focusable'] === 'true',
      selected: attrs['selected'] === 'true',
      
      context,
      fieldConfidences,
      overallConfidence
    };
  }

  /**
   * 分析元素上下文
   * 整合 SmartConditionGenerator 的层级分析逻辑
   */
  private static analyzeElementContext(element: any, xmlContent?: string): ElementContext {
    // 基础上下文
    const context: ElementContext = {
      level: 'self',
      depth: 0,
      hasClickableParent: false,
      siblingCount: 0
    };

    // TODO: 实现完整的层级分析
    // 这里应该整合 SmartConditionGenerator 的 HierarchyAnalyzer 逻辑
    
    return context;
  }

  /**
   * 计算所有字段的置信度
   * 整合 SmartConditionGenerator 的置信度计算逻辑
   */
  private static calculateAllFieldConfidences(
    attrs: Record<string, string>, 
    context: ElementContext
  ): Record<string, number> {
    const confidences: Record<string, number> = {};

    Object.entries(attrs).forEach(([fieldName, value]) => {
      if (this.FIELD_DEFINITIONS[fieldName] && value) {
        confidences[fieldName] = this.calculateFieldConfidence(fieldName, value, context);
      }
    });

    return confidences;
  }

  /**
   * 计算单个字段的置信度
   * 整合 SmartConditionGenerator 的复杂置信度逻辑
   */
  private static calculateFieldConfidence(
    fieldName: string,
    value: string,
    context: ElementContext
  ): number {
    const fieldDef = this.FIELD_DEFINITIONS[fieldName];
    if (!fieldDef) return 0;

    let confidence = fieldDef.confidence;

    // 根据字段类型和值调整置信度
    switch (fieldName) {
      case 'text':
        // 空文本或单字符降权
        if (!value || value.trim().length <= 1) {
          confidence *= 0.6;
        }
        break;
        
      case 'clickable':
        // 上下文相关的clickable置信度调整
        if (context.level === 'parent' && value === 'true') {
          confidence *= 0.75; // 父节点的clickable相关性较低
        }
        break;
        
      case 'resource-id':
        // resource-id 为空或过短时降权
        if (!value || value.length < 10) {
          confidence *= 0.8;
        }
        break;
    }

    // 根据上下文层级调整
    switch (context.level) {
      case 'parent':
        confidence *= 0.85;
        break;
      case 'child':
        confidence *= 0.90;
        break;
      case 'sibling':
        confidence *= 0.75;
        break;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * 计算整体置信度
   */
  private static calculateOverallConfidence(fieldConfidences: Record<string, number>): number {
    const confidenceValues = Object.values(fieldConfidences);
    if (confidenceValues.length === 0) return 0;

    // 使用加权平均，高置信度字段权重更大
    const weightedSum = confidenceValues.reduce((sum, conf) => sum + conf * conf, 0);
    const weightSum = confidenceValues.reduce((sum, conf) => sum + conf, 0);

    return weightSum > 0 ? weightedSum / weightSum : 0;
  }

  /**
   * 快速策略推荐（简化版）
   * 实际的复杂决策应该使用 StrategyDecisionEngine
   */
  static recommendQuickStrategy(properties: ElementProperties): MatchStrategy {
    const { fieldConfidences, context } = properties;

    // 快速决策规则
    if (fieldConfidences['resource-id'] > 0.9) {
      return 'strict';
    }
    
    if (fieldConfidences['text'] > 0.8 && context.hasClickableParent) {
      return 'standard';
    }
    
    if (fieldConfidences['content-desc'] > 0.8) {
      return 'positionless';
    }

    return 'custom'; // 默认使用自定义策略
  }

  /**
   * 获取字段定义（用于UI显示）
   */
  static getFieldDefinition(fieldName: string): FieldDefinition | undefined {
    return this.FIELD_DEFINITIONS[fieldName];
  }

  /**
   * 获取所有支持的字段
   */
  static getSupportedFields(): string[] {
    return Object.keys(this.FIELD_DEFINITIONS);
  }

  /**
   * 向后兼容：获取所有元素类型的分析结果
   * 为现有 UI 组件提供兼容性支持
   */
  static getAllElementAnalysis(): Record<string, ElementAnalysisResult> {
    return {
      follow_button: this.analyzeFollowButtonFields(),
      username: this.analyzeUserNameFields(),
      avatar: this.analyzeAvatarFields()
    };
  }

  /**
   * 分析关注按钮字段（向后兼容）
   */
  private static analyzeFollowButtonFields(): ElementAnalysisResult {
    const commonFields = [
      { field: 'text', displayName: '文本内容', type: 'string', description: '按钮显示的文本', examples: ['关注', '已关注', '+关注'] },
      { field: 'clickable', displayName: '可点击', type: 'boolean', description: '元素是否可点击', examples: ['true'] },
      { field: 'className', displayName: '类名', type: 'string', description: 'UI元素的CSS类名或Android类名', examples: ['follow-btn', 'button'] }
    ];

    const specificFields = [
      { field: 'resourceId', displayName: '资源ID', type: 'string', description: '元素的唯一标识符', examples: ['follow_button', 'btn_follow'] },
      { field: 'contentDesc', displayName: '内容描述', type: 'string', description: '无障碍描述', examples: ['关注按钮', 'Follow button'] }
    ];

    return { commonFields, specificFields };
  }

  /**
   * 分析用户名字段（向后兼容）
   */
  private static analyzeUserNameFields(): ElementAnalysisResult {
    const commonFields = [
      { field: 'text', displayName: '文本内容', type: 'string', description: '用户名文本', examples: ['用户123', '@username'] },
      { field: 'className', displayName: '类名', type: 'string', description: 'UI元素的类名', examples: ['username', 'profile-name'] }
    ];

    const specificFields = [
      { field: 'resourceId', displayName: '资源ID', type: 'string', description: '用户名元素ID', examples: ['username_text', 'profile_name'] }
    ];

    return { commonFields, specificFields };
  }

  /**
   * 分析头像字段（向后兼容）
   */
  private static analyzeAvatarFields(): ElementAnalysisResult {
    const commonFields = [
      { field: 'className', displayName: '类名', type: 'string', description: '头像元素类名', examples: ['avatar', 'profile-pic'] },
      { field: 'clickable', displayName: '可点击', type: 'boolean', description: '头像是否可点击', examples: ['true'] }
    ];

    const specificFields = [
      { field: 'resourceId', displayName: '资源ID', type: 'string', description: '头像元素ID', examples: ['avatar_image', 'profile_avatar'] },
      { field: 'contentDesc', displayName: '内容描述', type: 'string', description: '头像的描述', examples: ['用户头像', 'Profile picture'] }
    ];

    return { commonFields, specificFields };
  }
}

/**
 * 向后兼容的类型定义
 */
export interface ElementAnalysisResult {
  commonFields: ElementFieldInfo[];
  specificFields: ElementFieldInfo[];
}

export interface ElementFieldInfo {
  field: string;
  displayName: string;
  type: string;
  description: string;
  examples?: string[];
}