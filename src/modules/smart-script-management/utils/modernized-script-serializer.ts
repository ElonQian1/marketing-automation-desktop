// src/modules/smart-script-management/utils/modernized-script-serializer.ts
// module: smart-script-management | layer: utils | role: modernized-serializer
// summary: 现代化的脚本序列化器 - 与现有系统兼容的升级版

import { universalScriptSerializer } from '../serializers';
import { SmartScriptStep, StepActionType, StepParams, ScriptConfig } from '../types';

/**
 * 现代化的步骤序列化器 - 向后兼容的升级版
 * 
 * 这个类提供与原有 StepSerializer 相同的接口，但内部使用新的模块化序列化系统
 */
export class StepSerializer {

  /**
   * 序列化单个步骤 - 使用新的模块化系统
   */
  static serializeStep(step: any, index: number): SmartScriptStep {
    console.log('📝 [ModernizedStepSerializer] 使用新的模块化序列化系统...');
    
    try {
      // 使用新的序列化系统
      const result = universalScriptSerializer.serializeSteps([step]);
      return result[0] || this.createFallbackStep(step, index);
    } catch (error) {
      console.error('❌ [ModernizedStepSerializer] 序列化失败，使用fallback:', error);
      return this.createFallbackStep(step, index);
    }
  }

  /**
   * 序列化步骤数组 - 使用新的模块化系统
   */
  static serializeSteps(steps: any[]): SmartScriptStep[] {
    console.log(`📦 [ModernizedStepSerializer] 序列化 ${steps.length} 个步骤...`);
    
    try {
      return universalScriptSerializer.serializeSteps(steps);
    } catch (error) {
      console.error('❌ [ModernizedStepSerializer] 批量序列化失败，使用fallback:', error);
      return steps.map((step, index) => this.createFallbackStep(step, index));
    }
  }

  /**
   * 反序列化步骤为UI状态 - 使用新的模块化系统
   */
  static deserializeStep(step: SmartScriptStep): any {
    console.log('📤 [ModernizedStepSerializer] 使用新的模块化反序列化系统...');
    
    try {
      // 使用新的反序列化系统
      const result = universalScriptSerializer.deserializeSteps([step]);
      return result[0] || this.createFallbackDeserializedStep(step);
    } catch (error) {
      console.error('❌ [ModernizedStepSerializer] 反序列化失败，使用fallback:', error);
      return this.createFallbackDeserializedStep(step);
    }
  }

  /**
   * 反序列化步骤数组 - 使用新的模块化系统
   */
  static deserializeSteps(steps: SmartScriptStep[]): any[] {
    console.log(`📤 [ModernizedStepSerializer] 反序列化 ${steps.length} 个步骤...`);
    
    try {
      return universalScriptSerializer.deserializeSteps(steps);
    } catch (error) {
      console.error('❌ [ModernizedStepSerializer] 批量反序列化失败，使用fallback:', error);
      return steps.map(step => this.createFallbackDeserializedStep(step));
    }
  }

  /**
   * 创建fallback序列化步骤
   */
  private static createFallbackStep(step: any, index: number): SmartScriptStep {
    console.warn(`🚨 [ModernizedStepSerializer] 创建fallback序列化步骤 ${index}`);
    
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
   * 创建fallback反序列化步骤
   */
  private static createFallbackDeserializedStep(step: SmartScriptStep): any {
    console.warn(`🚨 [ModernizedStepSerializer] 创建fallback反序列化步骤`);
    
    const params = step.parameters as any;
    
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
      status: step.status || 'active',
      ui_state: { collapsed: false },
      
      // 保留所有可能的扩展字段
      ...params,
      
      // 显式传递关键字段
      smartAnalysis: params?.smartAnalysis,
      smartDescription: params?.smartDescription,
      bounds: params?.bounds,
      content_desc: params?.content_desc,
      element_text: params?.element_text,
      element_type: params?.element_type,
      text: params?.text
    };
  }

  // ===== 保留旧接口的兼容性方法 =====

  /**
   * 标准化步骤类型 - 保留兼容性
   */
  private static normalizeStepType(type: any): StepActionType {
    if (typeof type === 'string') {
      const normalizedType = type.toLowerCase().replace(/[-_\s]/g, '_');
      
      switch (normalizedType) {
        case 'tap':
        case 'click':
          return StepActionType.TAP;
        case 'input':
        case 'type':
          return StepActionType.INPUT;
        case 'wait':
        case 'delay':
          return StepActionType.WAIT;
        case 'smart_tap':
        case 'smart_click':
          return StepActionType.SMART_TAP;
        case 'smart_find_element':
        case 'find_element':
          return StepActionType.SMART_FIND_ELEMENT;
        case 'recognize_page':
        case 'page_recognition':
          return StepActionType.RECOGNIZE_PAGE;
        case 'launch_app':
        case 'start_app':
          return StepActionType.LAUNCH_APP;
        case 'navigation':
        case 'navigate':
          return StepActionType.NAVIGATION;
        case 'screenshot':
          return StepActionType.SCREENSHOT;
        case 'swipe':
          return StepActionType.SWIPE;
        case 'verify':
        case 'verification':
          return StepActionType.VERIFY;
        case 'loop_start':
        case 'loop-start':
          return 'loop_start' as StepActionType;
        case 'loop_end':
        case 'loop-end':
          return 'loop_end' as StepActionType;
        default:
          console.warn(`Unknown step type: ${type}, defaulting to TAP`);
          return StepActionType.TAP;
      }
    }
    
    return type as StepActionType;
  }
}

/**
 * 现代化的脚本配置序列化器 - 向后兼容
 */
export class ConfigSerializer {
  
  /**
   * 序列化脚本配置 - 使用新系统
   */
  static serializeConfig(config: any): ScriptConfig {
    console.log('⚙️ [ModernizedConfigSerializer] 序列化配置...');
    
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
   * 反序列化脚本配置 - 使用新系统
   */
  static deserializeConfig(config: ScriptConfig): any {
    console.log('⚙️ [ModernizedConfigSerializer] 反序列化配置...');
    
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
}

/**
 * 现代化的完整脚本序列化器 - 向后兼容
 */
export class ScriptSerializer {
  
  /**
   * 将UI状态序列化为完整脚本 - 使用新的模块化系统
   */
  static serializeScript(
    name: string,
    description: string,
    steps: any[],
    config: any,
    metadata: any = {}
  ): any {
    console.log(`🎬 [ModernizedScriptSerializer] 序列化脚本: ${name}`);
    
    try {
      return universalScriptSerializer.serializeScript(name, description, steps, config, metadata);
    } catch (error) {
      console.error('❌ [ModernizedScriptSerializer] 脚本序列化失败，使用fallback:', error);
      return this.createFallbackScript(name, description, steps, config, metadata);
    }
  }

  /**
   * 反序列化脚本到UI状态 - 使用新的模块化系统
   */
  static deserializeScript(script: any): {
    steps: any[];
    config: any;
    metadata: any;
  } {
    console.log(`🎬 [ModernizedScriptSerializer] 反序列化脚本: ${script.name}`);
    
    try {
      return universalScriptSerializer.deserializeScript(script);
    } catch (error) {
      console.error('❌ [ModernizedScriptSerializer] 脚本反序列化失败，使用fallback:', error);
      return this.createFallbackDeserializedScript(script);
    }
  }

  /**
   * 创建fallback脚本序列化
   */
  private static createFallbackScript(
    name: string,
    description: string,
    steps: any[],
    config: any,
    metadata: any
  ): any {
    console.warn('🚨 [ModernizedScriptSerializer] 使用fallback脚本序列化');
    
    const currentTime = new Date().toISOString();
    const scriptId = metadata.id || `script_${Date.now()}`;

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
      steps: StepSerializer.serializeSteps(steps),
      config: ConfigSerializer.serializeConfig(config),
      metadata: {
        execution_count: metadata.execution_count || 0,
        success_rate: metadata.success_rate || 0,
        average_duration_ms: metadata.average_duration_ms || 0,
        dependencies: metadata.dependencies || [],
        fallback_used: true,
        ...metadata
      }
    };
  }

  /**
   * 创建fallback脚本反序列化
   */
  private static createFallbackDeserializedScript(script: any): {
    steps: any[];
    config: any;
    metadata: any;
  } {
    console.warn('🚨 [ModernizedScriptSerializer] 使用fallback脚本反序列化');
    
    return {
      steps: StepSerializer.deserializeSteps(script.steps || []),
      config: ConfigSerializer.deserializeConfig(script.config || {}),
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
        fallback_used: true,
        ...script.metadata
      }
    };
  }
}