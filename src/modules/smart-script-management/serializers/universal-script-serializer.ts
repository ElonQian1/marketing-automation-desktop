// src/modules/smart-script-management/serializers/universal-script-serializer.ts
// module: smart-script-management | layer: serializers | role: universal-script-serializer
// summary: 通用脚本序列化器 - 完整的脚本序列化和反序列化系统

import { serializerRegistry, SerializerRegistry } from './serializer-registry';
import { ExtendedStepData, SerializationContext } from '../types/serialization';
import { SmartScriptStep, ScriptConfig } from '../types';

/**
 * 数据转换工具 - 在现有格式和扩展格式之间转换
 */
export class DataTransformer {
  
  /**
   * 将现有的UI步骤数据转换为扩展步骤数据格式
   */
  static transformToExtendedStepData(step: any, index: number): ExtendedStepData {
    const stepData: ExtendedStepData = {
      id: step.id || `step_${Date.now()}_${index}`,
      stepType: step.step_type || step.type || 'tap',
      name: step.name || `步骤 ${index + 1}`,
      description: step.description || '',
      enabled: step.enabled !== false,
      order: step.order !== undefined ? step.order : index,
      status: step.status || 'active',
      parameters: { ...step.parameters, ...step.params }
    };

    // 转换循环数据
    if (this.hasLoopData(step)) {
      stepData.loopData = {
        loopId: step.loopId || step.loop_id || `loop_${Date.now()}`,
        loopName: step.loopName || step.loop_name,
        loopLevel: step.loopLevel || step.loop_level || 0,
        inLoop: step.inLoop || step.in_loop || false,
        parentLoopId: step.parentLoopId || step.parent_loop_id,
        loopConfig: step.loopConfig || step.loop_config
      };
    }

    // 转换智能分析数据
    if (this.hasSmartAnalysisData(step)) {
      stepData.smartAnalysis = this.extractSmartAnalysisData(step);
    }

    // 转换UI状态
    if (step.ui_state) {
      stepData.uiState = {
        collapsed: step.ui_state.collapsed,
        editedAt: step.ui_state.edited_at,
        notes: step.ui_state.notes,
        position: step.ui_state.position
      };
    }

    // 转换条件
    if (step.conditions) {
      stepData.conditions = step.conditions;
    }

    // 转换错误处理
    if (step.error_handling) {
      stepData.errorHandling = step.error_handling;
    }

    // 保存其他所有字段到扩展中
    stepData.extensions = this.extractOtherFields(step);

    return stepData;
  }

  /**
   * 将扩展步骤数据转换为现有UI格式
   */
  static transformFromExtendedStepData(stepData: ExtendedStepData): any {
    const step: any = {
      id: stepData.id,
      step_type: stepData.stepType,
      type: stepData.stepType, // 兼容性
      name: stepData.name,
      description: stepData.description,
      enabled: stepData.enabled,
      order: stepData.order,
      status: stepData.status,
      parameters: { ...stepData.parameters },
      params: { ...stepData.parameters } // 兼容性
    };

    // 恢复循环数据
    if (stepData.loopData) {
      step.loopId = stepData.loopData.loopId;
      step.loopName = stepData.loopData.loopName;
      step.loopLevel = stepData.loopData.loopLevel;
      step.inLoop = stepData.loopData.inLoop;
      step.parentLoopId = stepData.loopData.parentLoopId;
      step.loopConfig = stepData.loopData.loopConfig;
      
      // 向后兼容的字段
      step.loop_id = stepData.loopData.loopId;
      step.loop_name = stepData.loopData.loopName;
      step.loop_level = stepData.loopData.loopLevel;
      step.in_loop = stepData.loopData.inLoop;
      step.parent_loop_id = stepData.loopData.parentLoopId;
      step.loop_config = stepData.loopData.loopConfig;
    }

    // 恢复智能分析数据到参数中
    if (stepData.smartAnalysis) {
      step.parameters.smartAnalysis = stepData.smartAnalysis;
      step.parameters.smartDescription = stepData.smartAnalysis.description;
      step.parameters.bounds = stepData.smartAnalysis.bounds;
      step.parameters.content_desc = stepData.smartAnalysis.contentDesc;
      step.parameters.element_text = stepData.smartAnalysis.elementText;
      step.parameters.element_type = stepData.smartAnalysis.elementType;
      
      // 兼容性字段
      step.params.smartAnalysis = stepData.smartAnalysis;
      step.params.smartDescription = stepData.smartAnalysis.description;
      step.params.bounds = stepData.smartAnalysis.bounds;
      step.params.content_desc = stepData.smartAnalysis.contentDesc;
      step.params.element_text = stepData.smartAnalysis.elementText;
      step.params.element_type = stepData.smartAnalysis.elementType;
    }

    // 恢复UI状态
    if (stepData.uiState) {
      step.ui_state = {
        collapsed: stepData.uiState.collapsed,
        edited_at: stepData.uiState.editedAt,
        notes: stepData.uiState.notes,
        position: stepData.uiState.position
      };
    }

    // 恢复条件和错误处理
    if (stepData.conditions) {
      step.conditions = stepData.conditions;
    }

    if (stepData.errorHandling) {
      step.error_handling = stepData.errorHandling;
    }

    // 恢复扩展字段
    if (stepData.extensions) {
      Object.assign(step, stepData.extensions);
    }

    return step;
  }

  private static hasLoopData(step: any): boolean {
    return !!(
      step.loopId || step.loop_id || 
      step.inLoop || step.in_loop ||
      step.loopLevel !== undefined || step.loop_level !== undefined
    );
  }

  private static hasSmartAnalysisData(step: any): boolean {
    return !!(
      step.smartAnalysis ||
      step.smart_analysis ||
      (step.parameters && (
        step.parameters.smartAnalysis ||
        step.parameters.bounds ||
        step.parameters.element_text
      )) ||
      (step.params && (
        step.params.smartAnalysis ||
        step.params.bounds ||
        step.params.element_text
      ))
    );
  }

  private static extractSmartAnalysisData(step: any): any {
    const params = step.parameters || step.params || {};
    const analysis = step.smartAnalysis || step.smart_analysis || {};
    
    return {
      description: analysis.description || params.smartDescription,
      bounds: analysis.bounds || params.bounds,
      contentDesc: analysis.contentDesc || params.content_desc,
      elementText: analysis.elementText || params.element_text,
      elementType: analysis.elementType || params.element_type,
      confidence: analysis.confidence || params.confidence,
      selector: analysis.selector || params.selector
    };
  }

  private static extractOtherFields(step: any): Record<string, any> {
    const knownFields = new Set([
      'id', 'step_type', 'type', 'name', 'description', 'enabled', 'order', 'status',
      'parameters', 'params', 'conditions', 'error_handling', 'ui_state',
      'loopId', 'loop_id', 'loopName', 'loop_name', 'loopLevel', 'loop_level',
      'inLoop', 'in_loop', 'parentLoopId', 'parent_loop_id', 'loopConfig', 'loop_config',
      'smartAnalysis', 'smart_analysis'
    ]);

    const extensions: Record<string, any> = {};
    for (const [key, value] of Object.entries(step)) {
      if (!knownFields.has(key)) {
        extensions[key] = value;
      }
    }

    return extensions;
  }
}

/**
 * 通用脚本序列化器 - 使用模块化序列化器系统
 */
export class UniversalScriptSerializer {
  private registry: SerializerRegistry;

  constructor() {
    this.registry = serializerRegistry;
  }

  /**
   * 序列化步骤数组
   */
  serializeSteps(steps: any[]): SmartScriptStep[] {
    const results: SmartScriptStep[] = [];
    const context: SerializationContext = {
      direction: 'serialize',
      metadata: {
        totalSteps: steps.length,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`📦 [UniversalScriptSerializer] 开始序列化 ${steps.length} 个步骤...`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      context.currentIndex = i;

      try {
        // 转换为扩展步骤数据格式
        const extendedData = DataTransformer.transformToExtendedStepData(step, i);
        
        // 使用注册的序列化器进行序列化
        const serializationResult = this.registry.serialize(extendedData, context);
        
        if (serializationResult.success && serializationResult.data) {
          results.push(serializationResult.data as SmartScriptStep);
          
          // 输出警告（如果有）
          if (serializationResult.warnings?.length) {
            console.warn(`⚠️ [UniversalScriptSerializer] 步骤 ${i} 序列化警告:`, serializationResult.warnings);
          }
        } else {
          console.error(`❌ [UniversalScriptSerializer] 步骤 ${i} 序列化失败:`, serializationResult.error);
          
          // 使用fallback序列化
          const fallbackResult = this.createFallbackSerialization(step, i);
          results.push(fallbackResult);
        }
      } catch (error) {
        console.error(`💥 [UniversalScriptSerializer] 步骤 ${i} 序列化异常:`, error);
        
        // 使用fallback序列化
        const fallbackResult = this.createFallbackSerialization(step, i);
        results.push(fallbackResult);
      }
    }

    console.log(`✅ [UniversalScriptSerializer] 序列化完成: ${results.length}/${steps.length} 个步骤成功`);
    return results;
  }

  /**
   * 反序列化步骤数组
   */
  deserializeSteps(steps: SmartScriptStep[]): any[] {
    const results: any[] = [];
    const context: SerializationContext = {
      direction: 'deserialize',
      metadata: {
        totalSteps: steps.length,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`📤 [UniversalScriptSerializer] 开始反序列化 ${steps.length} 个步骤...`);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      context.currentIndex = i;

      try {
        // 使用注册的序列化器进行反序列化
        const deserializationResult = this.registry.deserialize(step, context);
        
        if (deserializationResult.success && deserializationResult.data) {
          // 转换回UI格式
          const uiStepData = DataTransformer.transformFromExtendedStepData(deserializationResult.data);
          results.push(uiStepData);
          
          // 输出警告（如果有）
          if (deserializationResult.warnings?.length) {
            console.warn(`⚠️ [UniversalScriptSerializer] 步骤 ${i} 反序列化警告:`, deserializationResult.warnings);
          }
        } else {
          console.error(`❌ [UniversalScriptSerializer] 步骤 ${i} 反序列化失败:`, deserializationResult.error);
          
          // 使用fallback反序列化
          const fallbackResult = this.createFallbackDeserialization(step, i);
          results.push(fallbackResult);
        }
      } catch (error) {
        console.error(`💥 [UniversalScriptSerializer] 步骤 ${i} 反序列化异常:`, error);
        
        // 使用fallback反序列化
        const fallbackResult = this.createFallbackDeserialization(step, i);
        results.push(fallbackResult);
      }
    }

    // 按order字段排序
    results.sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log(`✅ [UniversalScriptSerializer] 反序列化完成: ${results.length}/${steps.length} 个步骤成功`);
    return results;
  }

  /**
   * 序列化完整脚本
   */
  serializeScript(
    name: string,
    description: string,
    steps: any[],
    config: any,
    metadata: any = {}
  ): any {
    const currentTime = new Date().toISOString();
    const scriptId = metadata.id || `script_${Date.now()}`;

    console.log(`🎬 [UniversalScriptSerializer] 序列化脚本: ${name} (${steps.length} 步骤)`);

    return {
      id: scriptId,
      name: name || `智能脚本_${new Date().toLocaleString()}`,
      description: description || `包含 ${steps.length} 个步骤的自动化脚本`,
      version: metadata.version || '1.0.0',
      
      created_at: metadata.created_at || currentTime,
      updated_at: currentTime,
      last_executed_at: metadata.last_executed_at,
      
      author: metadata.author || '用户',
      category: metadata.category || '通用',
      tags: metadata.tags || ['智能脚本', '自动化'],
      
      // 使用模块化序列化器序列化步骤
      steps: this.serializeSteps(steps),
      config: this.serializeConfig(config),
      
      metadata: {
        execution_count: metadata.execution_count || 0,
        success_rate: metadata.success_rate || 0,
        average_duration_ms: metadata.average_duration_ms || 0,
        dependencies: metadata.dependencies || [],
        serializer_version: '2.0.0', // 标记使用新版序列化器
        ...metadata
      }
    };
  }

  /**
   * 反序列化完整脚本
   */
  deserializeScript(script: any): {
    steps: any[];
    config: any;
    metadata: any;
  } {
    console.log(`🎬 [UniversalScriptSerializer] 反序列化脚本: ${script.name} (${script.steps?.length || 0} 步骤)`);

    return {
      steps: this.deserializeSteps(script.steps || []),
      config: this.deserializeConfig(script.config || {}),
      metadata: {
        id: script.id,
        name: script.name,
        description: script.description,
        version: script.version,
        created_at: script.created_at,
        updated_at: script.updated_at,
        last_executed_at: script.last_executed_at,
        author: script.author,
        category: script.category,
        tags: script.tags,
        ...script.metadata
      }
    };
  }

  /**
   * 序列化脚本配置
   */
  private serializeConfig(config: any): ScriptConfig {
    return {
      continue_on_error: config.continue_on_error || config.smart_recovery_enabled || true,
      auto_verification_enabled: config.auto_verification_enabled !== false,
      smart_recovery_enabled: config.smart_recovery_enabled !== false,
      detailed_logging: config.detailed_logging !== false,
      default_timeout_ms: config.default_timeout_ms || 10000,
      default_retry_count: config.default_retry_count || 3,
      page_recognition_enabled: config.page_recognition_enabled !== false,
      screenshot_on_error: config.screenshot_on_error !== false,
      parallel_execution: config.parallel_execution || false,
      execution_delay_ms: config.execution_delay_ms || 0,
      device_specific: config.device_specific || false
    };
  }

  /**
   * 反序列化脚本配置
   */
  private deserializeConfig(config: ScriptConfig): any {
    return {
      continue_on_error: config.continue_on_error,
      auto_verification_enabled: config.auto_verification_enabled,
      smart_recovery_enabled: config.smart_recovery_enabled,
      detailed_logging: config.detailed_logging,
      default_timeout_ms: config.default_timeout_ms,
      default_retry_count: config.default_retry_count,
      page_recognition_enabled: config.page_recognition_enabled,
      screenshot_on_error: config.screenshot_on_error,
      parallel_execution: config.parallel_execution,
      execution_delay_ms: config.execution_delay_ms,
      device_specific: config.device_specific
    };
  }

  /**
   * 创建fallback序列化（当专用序列化器失败时使用）
   */
  private createFallbackSerialization(step: any, index: number): SmartScriptStep {
    console.warn(`🚨 [UniversalScriptSerializer] 使用fallback序列化步骤 ${index}`);
    
    return {
      id: step.id || `step_${Date.now()}_${index}`,
      step_type: step.step_type || step.type || 'tap',
      name: step.name || `步骤 ${index + 1}`,
      description: step.description || '',
      parameters: {
        ...step.parameters,
        ...step.params,
        timeout_ms: 10000,
        retry_count: 3,
        screenshot_on_error: true
      },
      enabled: step.enabled !== false,
      order: step.order !== undefined ? step.order : index,
      status: step.status || 'active'
    } as SmartScriptStep;
  }

  /**
   * 创建fallback反序列化（当专用序列化器失败时使用）
   */
  private createFallbackDeserialization(step: SmartScriptStep, index: number): any {
    console.warn(`🚨 [UniversalScriptSerializer] 使用fallback反序列化步骤 ${index}`);
    
    return {
      id: step.id,
      step_type: step.step_type,
      type: step.step_type,
      name: step.name,
      description: step.description,
      parameters: step.parameters,
      params: step.parameters,
      enabled: step.enabled,
      order: step.order,
      status: step.status,
      ui_state: { collapsed: false }
    };
  }
}

// 导出全局实例
export const universalScriptSerializer = new UniversalScriptSerializer();

// 向后兼容的导出
export { universalScriptSerializer as ScriptSerializer };