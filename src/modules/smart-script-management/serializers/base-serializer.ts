// src/modules/smart-script-management/serializers/base-serializer.ts
// module: smart-script-management | layer: serializers | role: base-serializer
// summary: 序列化器基础抽象类和工具函数

import { 
  IStepSerializer, 
  SerializationContext, 
  SerializationResult, 
  ExtendedStepData,
  SerializerConfig
} from '../types/serialization';

/**
 * 抽象基础序列化器 - 所有具体序列化器的基类
 */
export abstract class BaseStepSerializer implements IStepSerializer<ExtendedStepData, any> {
  protected config: SerializerConfig;

  constructor(config: SerializerConfig = {}) {
    this.config = {
      preserveOriginalFields: true,
      enableTypeConversion: false,
      enableBackwardCompatibility: true,
      fieldMappings: {},
      ignoredFields: [],
      requiredFields: ['id', 'stepType'],
      ...config
    };
  }

  /**
   * 序列化步骤数据
   */
  abstract serialize(input: ExtendedStepData, index?: number): any;

  /**
   * 反序列化步骤数据
   */
  abstract deserialize(output: any): ExtendedStepData;

  /**
   * 检查是否可以处理该类型的数据
   */
  abstract canHandle(input: ExtendedStepData): boolean;

  /**
   * 获取支持的步骤类型
   */
  abstract getSupportedTypes(): string[];

  /**
   * 带上下文的序列化方法
   */
  serializeWithContext(
    input: ExtendedStepData, 
    context: SerializationContext
  ): SerializationResult {
    try {
      if (!this.canHandle(input)) {
        return {
          data: null,
          success: false,
          error: `序列化器不支持类型: ${input.stepType}`,
          warnings: []
        };
      }

      const result = this.serialize(input, context.currentIndex);
      
      return {
        data: result,
        success: true,
        warnings: this.validateSerialization(input, result),
        metadata: {
          serializerType: this.constructor.name,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : '序列化失败',
        warnings: []
      };
    }
  }

  /**
   * 带上下文的反序列化方法
   */
  deserializeWithContext(
    output: any, 
    context: SerializationContext
  ): SerializationResult<ExtendedStepData> {
    try {
      const result = this.deserialize(output);
      
      return {
        data: result,
        success: true,
        warnings: this.validateDeserialization(output, result),
        metadata: {
          serializerType: this.constructor.name,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: error instanceof Error ? error.message : '反序列化失败',
        warnings: []
      };
    }
  }

  /**
   * 验证序列化结果
   */
  protected validateSerialization(input: ExtendedStepData, output: any): string[] {
    const warnings: string[] = [];

    // 检查必需字段
    for (const field of this.config.requiredFields || []) {
      if (!(field in output)) {
        warnings.push(`缺少必需字段: ${field}`);
      }
    }

    // 检查字段保留
    if (this.config.preserveOriginalFields) {
      const inputKeys = Object.keys(input);
      const outputKeys = Object.keys(output);
      
      for (const key of inputKeys) {
        if (!this.config.ignoredFields?.includes(key) && !outputKeys.includes(key)) {
          warnings.push(`原始字段可能丢失: ${key}`);
        }
      }
    }

    return warnings;
  }

  /**
   * 验证反序列化结果
   */
  protected validateDeserialization(input: any, output: ExtendedStepData): string[] {
    const warnings: string[] = [];

    // 检查基础字段
    if (!output.id) {
      warnings.push('反序列化结果缺少ID字段');
    }

    if (!output.stepType) {
      warnings.push('反序列化结果缺少步骤类型字段');
    }

    return warnings;
  }

  /**
   * 应用字段映射
   */
  protected applyFieldMappings(data: Record<string, any>): Record<string, any> {
    if (!this.config.fieldMappings) {
      return data;
    }

    const mapped = { ...data };
    
    for (const [oldField, newField] of Object.entries(this.config.fieldMappings)) {
      if (oldField in mapped) {
        mapped[newField] = mapped[oldField];
        delete mapped[oldField];
      }
    }

    return mapped;
  }

  /**
   * 过滤忽略的字段
   */
  protected filterIgnoredFields(data: Record<string, any>): Record<string, any> {
    if (!this.config.ignoredFields?.length) {
      return data;
    }

    const filtered = { ...data };
    
    for (const field of this.config.ignoredFields) {
      delete filtered[field];
    }

    return filtered;
  }

  /**
   * 规范化步骤类型
   */
  protected normalizeStepType(type: string): string {
    if (!this.config.enableTypeConversion) {
      return type;
    }

    // 统一格式：小写，用下划线连接
    return type.toLowerCase().replace(/[-\s]/g, '_');
  }

  /**
   * 创建基础步骤数据结构
   */
  protected createBaseStepData(input: ExtendedStepData): Record<string, any> {
    const base = {
      id: input.id,
      step_type: this.normalizeStepType(input.stepType),
      name: input.name,
      description: input.description || '',
      parameters: { ...input.parameters },
      enabled: input.enabled !== false,
      order: input.order,
      status: input.status || 'active'
    };

    // 创建扩展的基础对象，包含可选字段
    const extendedBase = base as any;

    // 添加条件字段
    if (input.conditions && input.conditions.length > 0) {
      extendedBase.conditions = input.conditions;
    }

    // 添加错误处理
    if (input.errorHandling) {
      extendedBase.error_handling = input.errorHandling;
    }

    // 添加UI状态
    if (input.uiState) {
      extendedBase.ui_state = {
        collapsed: input.uiState.collapsed || false,
        edited_at: input.uiState.editedAt || new Date().toISOString(),
        notes: input.uiState.notes || ''
      };
    }

    // 返回扩展的基础对象
    return extendedBase;
  }

  /**
   * 从序列化数据恢复扩展步骤数据
   */
  protected createExtendedStepData(serialized: any): ExtendedStepData {
    const stepData: ExtendedStepData = {
      id: serialized.id,
      stepType: serialized.step_type || serialized.type,
      name: serialized.name,
      description: serialized.description,
      enabled: serialized.enabled !== false,
      order: serialized.order,
      status: serialized.status || 'active',
      parameters: { ...serialized.parameters }
    };

    // 恢复条件
    if (serialized.conditions) {
      stepData.conditions = serialized.conditions;
    }

    // 恢复错误处理
    if (serialized.error_handling) {
      stepData.errorHandling = serialized.error_handling;
    }

    // 恢复UI状态
    if (serialized.ui_state) {
      stepData.uiState = {
        collapsed: serialized.ui_state.collapsed,
        editedAt: serialized.ui_state.edited_at,
        notes: serialized.ui_state.notes
      };
    }

    // 恢复循环数据
    if (this.hasLoopData(serialized)) {
      stepData.loopData = this.extractLoopData(serialized);
    }

    // 恢复智能分析数据
    if (this.hasSmartAnalysisData(serialized)) {
      stepData.smartAnalysis = this.extractSmartAnalysisData(serialized);
    }

    // 保留所有其他字段到扩展中
    if (this.config.preserveOriginalFields) {
      stepData.extensions = this.extractExtensions(serialized);
    }

    return stepData;
  }

  /**
   * 检查是否包含循环数据
   */
  protected hasLoopData(data: any): boolean {
    return !!(
      data.loopId || 
      data.loop_id || 
      data.inLoop || 
      data.in_loop ||
      data.loopLevel !== undefined ||
      data.loop_level !== undefined
    );
  }

  /**
   * 提取循环数据
   */
  protected extractLoopData(data: any): any {
    return {
      loopId: data.loopId || data.loop_id,
      loopName: data.loopName || data.loop_name,
      loopLevel: data.loopLevel || data.loop_level || 0,
      inLoop: data.inLoop || data.in_loop || false,
      parentLoopId: data.parentLoopId || data.parent_loop_id,
      loopConfig: data.loopConfig || data.loop_config
    };
  }

  /**
   * 检查是否包含智能分析数据
   */
  protected hasSmartAnalysisData(data: any): boolean {
    return !!(
      data.smartAnalysis ||
      data.smart_analysis ||
      data.parameters?.smartAnalysis ||
      data.parameters?.bounds ||
      data.parameters?.elementText
    );
  }

  /**
   * 提取智能分析数据
   */
  protected extractSmartAnalysisData(data: any): any {
    const params = data.parameters || {};
    const analysis = data.smartAnalysis || data.smart_analysis || {};
    
    return {
      description: analysis.description || params.smartDescription,
      bounds: analysis.bounds || params.bounds,
      contentDesc: analysis.contentDesc || params.content_desc,
      elementText: analysis.elementText || params.element_text,
      elementType: analysis.elementType || params.element_type,
      confidence: analysis.confidence,
      selector: analysis.selector
    };
  }

  /**
   * 提取扩展字段
   */
  protected extractExtensions(data: any): Record<string, any> {
    const extensions: Record<string, any> = {};
    const knownFields = new Set([
      'id', 'step_type', 'type', 'name', 'description', 'parameters',
      'enabled', 'order', 'status', 'conditions', 'error_handling', 'ui_state',
      'loopId', 'loop_id', 'loopName', 'loop_name', 'loopLevel', 'loop_level',
      'inLoop', 'in_loop', 'parentLoopId', 'parent_loop_id', 'loopConfig', 'loop_config',
      'smartAnalysis', 'smart_analysis'
    ]);

    for (const [key, value] of Object.entries(data)) {
      if (!knownFields.has(key)) {
        extensions[key] = value;
      }
    }

    return extensions;
  }
}

/**
 * 通用序列化器 - 处理所有基础步骤类型
 */
export class GenericStepSerializer extends BaseStepSerializer {
  private supportedTypes: string[];

  constructor(supportedTypes: string[] = ['*'], config?: SerializerConfig) {
    super(config);
    this.supportedTypes = supportedTypes;
  }

  serialize(input: ExtendedStepData, index?: number): any {
    const base = this.createBaseStepData(input);
    
    // 保存循环相关数据
    if (input.loopData) {
      Object.assign(base, {
        loopId: input.loopData.loopId,
        loopName: input.loopData.loopName,
        loopLevel: input.loopData.loopLevel,
        inLoop: input.loopData.inLoop,
        parentLoopId: input.loopData.parentLoopId,
        loopConfig: input.loopData.loopConfig
      });
    }

    // 保存智能分析数据到参数中
    if (input.smartAnalysis) {
      base.parameters = {
        ...base.parameters,
        smartAnalysis: input.smartAnalysis,
        smartDescription: input.smartAnalysis.description,
        bounds: input.smartAnalysis.bounds,
        content_desc: input.smartAnalysis.contentDesc,
        element_text: input.smartAnalysis.elementText,
        element_type: input.smartAnalysis.elementType
      };
    }

    // 保存扩展字段
    if (input.extensions) {
      Object.assign(base, input.extensions);
    }

    return this.config.preserveOriginalFields 
      ? base 
      : this.filterIgnoredFields(this.applyFieldMappings(base));
  }

  deserialize(output: any): ExtendedStepData {
    return this.createExtendedStepData(output);
  }

  canHandle(input: ExtendedStepData): boolean {
    if (this.supportedTypes.includes('*')) {
      return true;
    }
    
    return this.supportedTypes.includes(input.stepType);
  }

  getSupportedTypes(): string[] {
    return this.supportedTypes;
  }
}