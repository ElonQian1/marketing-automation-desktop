// src/hooks/singleStepTest/singleAction.ts
// module: shared | layer: application | role: 状态钩子
// summary: React状态管理和业务逻辑封装

import { isTauri, invoke } from '@tauri-apps/api/core';
import type { SingleStepTestResult, SmartScriptStep } from '../../types/smartScript';
import { buildBackendPayloadStep, normalizeStepForExecution, createMockResult } from './utils';
import { normalizeStepForBackend } from '../../workflow/normalizeStepForBackend';

export async function executeActionOnce(step: SmartScriptStep, deviceId: string): Promise<SingleStepTestResult> {
  const isInTauriEnv = await isTauri();
  if (!isInTauriEnv) {
    console.log('🔄 非Tauri环境，使用模拟结果（单次）');
    await new Promise(resolve => setTimeout(resolve, 300));
    return createMockResult(step);
  }

  const normalizedStep = normalizeStepForExecution(step);
  const payloadStep = buildBackendPayloadStep(normalizedStep);

  // 🆕 应用类型映射层：将 UI 语义标签规范化为后端动作
  const backendStep = normalizeStepForBackend({
    stepId: payloadStep.id || step.id,
    type: payloadStep.step_type,
    params: payloadStep.parameters || {},
    ...payloadStep,
  });

  console.log(`📋 传递参数 (映射后):`, { 
    deviceId, 
    action: backendStep.action, 
    stepName: payloadStep.name, 
    order: payloadStep.order,
    originalType: payloadStep.step_type,
  });
  
  const result = await invoke('execute_single_step_test', {
    deviceId,
    step: {
      ...payloadStep,
      step_type: backendStep.action, // 使用映射后的动作类型
      parameters: backendStep.params, // 使用合并后的参数
    },
  }) as SingleStepTestResult;
  
  console.log(`📊 后端测试结果:`, result);
  return result;
}
