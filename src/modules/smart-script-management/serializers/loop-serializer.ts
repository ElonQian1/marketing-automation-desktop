// src/modules/smart-script-management/serializers/loop-serializer.ts
// module: smart-script-management | layer: serializers | role: loop-serializer
// summary: 循环卡片专用序列化器

import { BaseStepSerializer } from './base-serializer';
import { ExtendedStepData, SerializerConfig } from '../types/serialization';

/**
 * 循环开始卡片序列化器
 */
export class LoopStartSerializer extends BaseStepSerializer {
  constructor(config?: SerializerConfig) {
    super({
      preserveOriginalFields: true,
      enableTypeConversion: false,
      ...config
    });
  }

  serialize(input: ExtendedStepData, index?: number): any {
    const base = this.createBaseStepData(input);
    
    // 强制保持步骤类型为 loop_start
    base.step_type = 'loop_start';
    
    // 保存循环特有的配置
    if (input.loopData) {
      base.loopId = input.loopData.loopId;
      base.loopName = input.loopData.loopName;
      base.loopLevel = input.loopData.loopLevel;
      base.inLoop = true; // 循环开始卡片标记为在循环中
      base.parentLoopId = input.loopData.parentLoopId;
      
      // 循环配置保存到参数中
      if (input.loopData.loopConfig) {
        base.parameters = {
          ...base.parameters,
          loop_config: input.loopData.loopConfig,
          max_iterations: input.loopData.loopConfig.maxIterations,
          break_condition: input.loopData.loopConfig.breakCondition,
          continue_on_error: input.loopData.loopConfig.continueOnError
        };
      }
    }

    // 循环开始卡片特有的参数
    base.parameters = {
      ...base.parameters,
      loop_type: input.parameters?.loop_type || 'standard',
      iteration_variable: input.parameters?.iteration_variable || 'i',
      start_value: input.parameters?.start_value || 0,
      end_value: input.parameters?.end_value || 10,
      step_value: input.parameters?.step_value || 1
    };

    // 保存扩展字段
    if (input.extensions) {
      Object.assign(base, input.extensions);
    }

    console.log('🔄 [LoopStartSerializer] 序列化循环开始卡片:', {
      stepId: base.id,
      stepType: base.step_type,
      loopId: base.loopId,
      loopConfig: base.parameters?.loop_config
    });

    return base;
  }

  deserialize(output: any): ExtendedStepData {
    const stepData = this.createExtendedStepData(output);
    
    // 确保步骤类型正确
    stepData.stepType = 'loop_start';
    
    // 恢复循环数据
    if (this.hasLoopData(output)) {
      stepData.loopData = {
        loopId: output.loopId || output.loop_id,
        loopName: output.loopName || output.loop_name,
        loopLevel: output.loopLevel || output.loop_level || 0,
        inLoop: true,
        parentLoopId: output.parentLoopId || output.parent_loop_id,
        loopConfig: output.parameters?.loop_config || {
          maxIterations: output.parameters?.max_iterations,
          breakCondition: output.parameters?.break_condition,
          continueOnError: output.parameters?.continue_on_error
        }
      };
    }

    console.log('🔄 [LoopStartSerializer] 反序列化循环开始卡片:', {
      stepId: stepData.id,
      stepType: stepData.stepType,
      hasLoopData: !!stepData.loopData
    });

    return stepData;
  }

  canHandle(input: ExtendedStepData): boolean {
    return input.stepType === 'loop_start' || input.stepType === 'loop-start';
  }

  getSupportedTypes(): string[] {
    return ['loop_start', 'loop-start'];
  }
}

/**
 * 循环结束卡片序列化器
 */
export class LoopEndSerializer extends BaseStepSerializer {
  constructor(config?: SerializerConfig) {
    super({
      preserveOriginalFields: true,
      enableTypeConversion: false,
      ...config
    });
  }

  serialize(input: ExtendedStepData, index?: number): any {
    const base = this.createBaseStepData(input);
    
    // 强制保持步骤类型为 loop_end
    base.step_type = 'loop_end';
    
    // 保存循环结束相关数据
    if (input.loopData) {
      base.loopId = input.loopData.loopId;
      base.loopName = input.loopData.loopName;
      base.loopLevel = input.loopData.loopLevel;
      base.inLoop = false; // 循环结束卡片标记为不在循环中
      base.parentLoopId = input.loopData.parentLoopId;
    }

    // 循环结束卡片特有的参数
    base.parameters = {
      ...base.parameters,
      target_loop_id: input.parameters?.target_loop_id || input.loopData?.loopId,
      break_on_condition: input.parameters?.break_on_condition || false,
      break_condition: input.parameters?.break_condition
    };

    // 保存扩展字段
    if (input.extensions) {
      Object.assign(base, input.extensions);
    }

    console.log('🔚 [LoopEndSerializer] 序列化循环结束卡片:', {
      stepId: base.id,
      stepType: base.step_type,
      loopId: base.loopId,
      targetLoopId: base.parameters?.target_loop_id
    });

    return base;
  }

  deserialize(output: any): ExtendedStepData {
    const stepData = this.createExtendedStepData(output);
    
    // 确保步骤类型正确
    stepData.stepType = 'loop_end';
    
    // 恢复循环数据
    if (this.hasLoopData(output)) {
      stepData.loopData = {
        loopId: output.loopId || output.loop_id,
        loopName: output.loopName || output.loop_name,
        loopLevel: output.loopLevel || output.loop_level || 0,
        inLoop: false,
        parentLoopId: output.parentLoopId || output.parent_loop_id
      };
    }

    console.log('🔚 [LoopEndSerializer] 反序列化循环结束卡片:', {
      stepId: stepData.id,
      stepType: stepData.stepType,
      hasLoopData: !!stepData.loopData
    });

    return stepData;
  }

  canHandle(input: ExtendedStepData): boolean {
    return input.stepType === 'loop_end' || input.stepType === 'loop-end';
  }

  getSupportedTypes(): string[] {
    return ['loop_end', 'loop-end'];
  }
}