// src/modules/smart-script-management/utils/universal-serializer.ts
// module: smart-script-management | layer: application | role: universal-serializer
// summary: 通用序列化器 - 支持所有卡片类型的原样序列化

import { SmartScriptStep, ScriptConfig } from '../types';

/**
 * 通用步骤序列化器
 * 
 * 设计原则：
 * 1. 原样保存 - 不对步骤类型进行转换
 * 2. 完整保留 - 保存所有字段和参数
 * 3. 向前兼容 - 支持新增的卡片类型
 * 4. 向后兼容 - 保持与现有数据的兼容性
 */
export class UniversalStepSerializer {
  
  /**
   * 序列化单个步骤 - 通用版本
   * 
   * 核心思想：不做任何类型转换，原样保存所有数据
   */
  static serializeStep(step: any, index: number): SmartScriptStep {
    // 保持原始 step_type，支持所有类型
    const originalStepType = step.step_type || step.type;
    
    // 保持所有参数原样，只添加必要的默认值
    const originalParameters = {
      // 保留所有原始参数（这是关键！）
      ...(step.parameters || step.params || {}),
      
      // 只添加必要的基础字段默认值
      timeout_ms: (step.parameters || step.params || {}).timeout_ms || 10000,
      retry_count: (step.parameters || step.params || {}).retry_count || 3,
      screenshot_on_error: (step.parameters || step.params || {}).screenshot_on_error !== false,
    };

    const baseStep: SmartScriptStep = {
      id: step.id || `step_${Date.now()}_${index}`,
      step_type: originalStepType, // 保持原始类型，不转换
      name: step.name || `步骤 ${index + 1}`,
      description: step.description || '',
      parameters: originalParameters, // 保持原始参数，不处理
      enabled: step.enabled !== false,
      order: index,
      status: step.status || 'active',
    };

    // 保存条件和错误处理
    if (step.conditions) {
      baseStep.conditions = step.conditions;
    }

    if (step.error_handling) {
      baseStep.error_handling = step.error_handling;
    }

    // 保存UI状态
    if (step.ui_state) {
      baseStep.ui_state = {
        collapsed: step.ui_state.collapsed || false,
        edited_at: new Date().toISOString(),
        notes: step.ui_state.notes || ''
      };
    }

    // 🔥 关键改进：保存所有可能的额外字段
    // 这样无论是循环、条件、或者未来的新卡片类型，都能正确保存
    const extraFields = [
      'loopId', 'loopLevel', 'inLoop', 'parentLoopId', 'loop_config',
      'condition_config', 'branch_config', 'parallel_config',
      // 可以继续添加新的字段，不需要修改核心逻辑
    ];
    
    extraFields.forEach(field => {
      if (step[field] !== undefined) {
        (baseStep as any)[field] = step[field];
      }
    });

    return baseStep;
  }

  /**
   * 序列化步骤数组
   */
  static serializeSteps(steps: any[]): SmartScriptStep[] {
    return steps.map((step, index) => this.serializeStep(step, index));
  }

  /**
   * 反序列化步骤为UI状态 - 通用版本
   * 
   * 核心思想：原样恢复所有数据，不做类型假设
   */
  static deserializeStep(step: SmartScriptStep): any {
    const result = {
      // 基础字段
      id: step.id,
      step_type: step.step_type, // 保持原始类型
      type: step.step_type, // 兼容性字段
      name: step.name,
      description: step.description,
      parameters: step.parameters, // 原样恢复所有参数
      params: step.parameters, // 兼容性字段
      enabled: step.enabled,
      order: step.order,
      status: step.status || 'active',
      
      // 条件和错误处理
      conditions: step.conditions,
      error_handling: step.error_handling,
      ui_state: step.ui_state || { collapsed: false },
    };

    // 🔥 关键改进：恢复所有额外字段
    // 直接将所有字段复制过来，确保不丢失任何信息
    Object.keys(step).forEach(key => {
      if (!result.hasOwnProperty(key)) {
        (result as any)[key] = (step as any)[key];
      }
    });

    return result;
  }

  /**
   * 反序列化步骤数组
   */
  static deserializeSteps(steps: SmartScriptStep[]): any[] {
    return steps
      .sort((a, b) => a.order - b.order)
      .map(step => this.deserializeStep(step));
  }
}

/**
 * 通用脚本配置序列化器
 */
export class UniversalConfigSerializer {
  
  /**
   * 序列化脚本配置 - 保持原样
   */
  static serializeConfig(config: any): ScriptConfig {
    return {
      // 保留所有原始配置
      ...config,
      
      // 确保关键字段存在
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
   * 反序列化脚本配置 - 原样恢复
   */
  static deserializeConfig(config: ScriptConfig): any {
    // 直接返回，保持所有字段
    return { ...config };
  }
}

/**
 * 通用脚本序列化器
 */
export class UniversalScriptSerializer {
  
  /**
   * 将UI状态序列化为完整脚本
   */
  static serializeScript(
    name: string,
    description: string,
    steps: any[],
    config: any,
    metadata: any = {}
  ): any {
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
      
      // 使用通用序列化器
      steps: UniversalStepSerializer.serializeSteps(steps),
      config: UniversalConfigSerializer.serializeConfig(config),
      
      metadata: {
        execution_count: metadata.execution_count || 0,
        success_rate: metadata.success_rate || 0,
        average_duration_ms: metadata.average_duration_ms || 0,
        dependencies: metadata.dependencies || [],
        // 保留所有其他元数据
        ...metadata
      }
    };
  }

  /**
   * 反序列化脚本到UI状态
   */
  static deserializeScript(script: any): {
    steps: any[];
    config: any;
    metadata: any;
  } {
    return {
      steps: UniversalStepSerializer.deserializeSteps(script.steps || []),
      config: UniversalConfigSerializer.deserializeConfig(script.config || {}),
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
}

// 向后兼容的导出
export const ScriptSerializer = UniversalScriptSerializer;
export const StepSerializer = UniversalStepSerializer;
export const ConfigSerializer = UniversalConfigSerializer;