// src/modules/smart-script-management/serializers/smart-action-serializer.ts
// module: smart-script-management | layer: serializers | role: smart-action-serializer
// summary: 智能操作类步骤序列化器

import { BaseStepSerializer } from './base-serializer';
import { ExtendedStepData, SerializerConfig } from '../types/serialization';

/**
 * 智能点击序列化器
 */
export class SmartTapSerializer extends BaseStepSerializer {
  constructor(config?: SerializerConfig) {
    super({
      preserveOriginalFields: true,
      enableTypeConversion: false,
      ...config
    });
  }

  serialize(input: ExtendedStepData, index?: number): any {
    const base = this.createBaseStepData(input);
    
    // 强制保持步骤类型
    base.step_type = 'smart_tap';
    
    // 保存智能点击特有的参数
    base.parameters = {
      ...base.parameters,
      element_description: input.parameters?.element_description || input.parameters?.description || '',
      fallback_coordinates: input.parameters?.fallback_coordinates || { x: 0, y: 0 },
      search_area: input.parameters?.search_area,
      hold_duration_ms: input.parameters?.hold_duration_ms || 100,
      
      // 智能选择相关配置
      smartSelection: input.parameters?.smartSelection || {
        textMatchingMode: 'partial',
        enableAntonymDetection: true,
        confidenceThreshold: 0.8
      }
    };

    // 保存完整的智能分析数据
    if (input.smartAnalysis) {
      base.parameters = {
        ...base.parameters,
        smartAnalysis: input.smartAnalysis,
        smartDescription: input.smartAnalysis.description,
        bounds: input.smartAnalysis.bounds,
        content_desc: input.smartAnalysis.contentDesc,
        element_text: input.smartAnalysis.elementText,
        element_type: input.smartAnalysis.elementType,
        confidence: input.smartAnalysis.confidence
      };
    }

    console.log('🎯 [SmartTapSerializer] 序列化智能点击步骤:', {
      stepId: base.id,
      elementDescription: base.parameters?.element_description,
      hasSmartAnalysis: !!input.smartAnalysis,
      smartSelectionMode: base.parameters?.smartSelection?.textMatchingMode
    });

    return base;
  }

  deserialize(output: any): ExtendedStepData {
    const stepData = this.createExtendedStepData(output);
    
    // 确保步骤类型正确
    stepData.stepType = 'smart_tap';
    
    // 恢复智能分析数据
    if (this.hasSmartAnalysisData(output)) {
      stepData.smartAnalysis = this.extractSmartAnalysisData(output);
    }

    console.log('🎯 [SmartTapSerializer] 反序列化智能点击步骤:', {
      stepId: stepData.id,
      stepType: stepData.stepType,
      hasSmartAnalysis: !!stepData.smartAnalysis
    });

    return stepData;
  }

  canHandle(input: ExtendedStepData): boolean {
    return input.stepType === 'smart_tap' || input.stepType === 'smart_click';
  }

  getSupportedTypes(): string[] {
    return ['smart_tap', 'smart_click'];
  }
}

/**
 * 智能查找元素序列化器
 */
export class SmartFindElementSerializer extends BaseStepSerializer {
  constructor(config?: SerializerConfig) {
    super({
      preserveOriginalFields: true,
      enableTypeConversion: false,
      ...config
    });
  }

  serialize(input: ExtendedStepData, index?: number): any {
    const base = this.createBaseStepData(input);
    
    // 强制保持步骤类型
    base.step_type = 'smart_find_element';
    
    // 保存智能查找特有的参数
    base.parameters = {
      ...base.parameters,
      element_description: input.parameters?.element_description || input.parameters?.description || '',
      find_multiple: input.parameters?.find_multiple || false,
      return_coordinates: input.parameters?.return_coordinates !== false,
      search_timeout_ms: input.parameters?.search_timeout_ms || 5000,
      
      // 智能选择相关配置
      smartSelection: input.parameters?.smartSelection || {
        textMatchingMode: 'partial',
        enableAntonymDetection: true,
        confidenceThreshold: 0.8
      }
    };

    // 保存完整的智能分析数据
    if (input.smartAnalysis) {
      base.parameters = {
        ...base.parameters,
        smartAnalysis: input.smartAnalysis,
        smartDescription: input.smartAnalysis.description,
        bounds: input.smartAnalysis.bounds,
        content_desc: input.smartAnalysis.contentDesc,
        element_text: input.smartAnalysis.elementText,
        element_type: input.smartAnalysis.elementType,
        confidence: input.smartAnalysis.confidence,
        selector: input.smartAnalysis.selector
      };
    }

    console.log('🔍 [SmartFindElementSerializer] 序列化智能查找步骤:', {
      stepId: base.id,
      elementDescription: base.parameters?.element_description,
      findMultiple: base.parameters?.find_multiple,
      hasSmartAnalysis: !!input.smartAnalysis
    });

    return base;
  }

  deserialize(output: any): ExtendedStepData {
    const stepData = this.createExtendedStepData(output);
    
    // 确保步骤类型正确
    stepData.stepType = 'smart_find_element';
    
    // 恢复智能分析数据
    if (this.hasSmartAnalysisData(output)) {
      stepData.smartAnalysis = this.extractSmartAnalysisData(output);
    }

    console.log('🔍 [SmartFindElementSerializer] 反序列化智能查找步骤:', {
      stepId: stepData.id,
      stepType: stepData.stepType,
      hasSmartAnalysis: !!stepData.smartAnalysis
    });

    return stepData;
  }

  canHandle(input: ExtendedStepData): boolean {
    return input.stepType === 'smart_find_element' || input.stepType === 'find_element';
  }

  getSupportedTypes(): string[] {
    return ['smart_find_element', 'find_element'];
  }
}

/**
 * 基础操作序列化器（点击、输入、等待等）
 */
export class BasicActionSerializer extends BaseStepSerializer {
  private static readonly BASIC_TYPES = [
    'tap', 'click', 'input', 'type', 'wait', 'delay', 
    'swipe', 'screenshot', 'verify', 'navigation',
    'launch_app', 'start_app', 'recognize_page'
  ];

  constructor(config?: SerializerConfig) {
    super({
      preserveOriginalFields: true,
      enableTypeConversion: true,
      ...config
    });
  }

  serialize(input: ExtendedStepData, index?: number): any {
    const base = this.createBaseStepData(input);
    
    // 根据类型调整参数结构
    switch (input.stepType) {
      case 'tap':
      case 'click':
        base.parameters = {
          ...base.parameters,
          x: input.parameters?.x || 0,
          y: input.parameters?.y || 0,
          hold_duration_ms: input.parameters?.hold_duration_ms || 100
        };
        break;
        
      case 'input':
      case 'type':
        base.parameters = {
          ...base.parameters,
          x: input.parameters?.x || 0,
          y: input.parameters?.y || 0,
          text: input.parameters?.text || '',
          clear_before_input: input.parameters?.clear_before_input !== false
        };
        break;
        
      case 'wait':
      case 'delay':
        base.parameters = {
          ...base.parameters,
          duration_ms: input.parameters?.duration_ms || input.parameters?.duration || 1000,
          wait_for_element: input.parameters?.wait_for_element
        };
        break;
        
      case 'swipe':
        base.parameters = {
          ...base.parameters,
          start_x: input.parameters?.start_x || 0,
          start_y: input.parameters?.start_y || 0,
          end_x: input.parameters?.end_x || 0,
          end_y: input.parameters?.end_y || 0,
          duration_ms: input.parameters?.duration_ms || 300
        };
        break;
        
      case 'launch_app':
      case 'start_app':
        base.parameters = {
          ...base.parameters,
          package_name: input.parameters?.package_name || input.parameters?.app_package || '',
          activity_name: input.parameters?.activity_name,
          wait_for_launch: input.parameters?.wait_for_launch !== false
        };
        break;
        
      default:
        // 保持所有原始参数
        break;
    }

    console.log('⚡ [BasicActionSerializer] 序列化基础操作步骤:', {
      stepId: base.id,
      stepType: base.step_type,
      parametersCount: Object.keys(base.parameters).length
    });

    return base;
  }

  deserialize(output: any): ExtendedStepData {
    const stepData = this.createExtendedStepData(output);
    
    console.log('⚡ [BasicActionSerializer] 反序列化基础操作步骤:', {
      stepId: stepData.id,
      stepType: stepData.stepType
    });

    return stepData;
  }

  canHandle(input: ExtendedStepData): boolean {
    return BasicActionSerializer.BASIC_TYPES.includes(input.stepType);
  }

  getSupportedTypes(): string[] {
    return BasicActionSerializer.BASIC_TYPES;
  }
}