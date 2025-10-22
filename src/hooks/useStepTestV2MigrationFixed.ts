// src/hooks/useStepTestV2MigrationFixed.ts  
// module: hooks | layer: hooks | role: V1到V2无缝迁移Hook修复版
// summary: 保持V1接口兼容性，内部使用V2引擎，解决"missing field strategy"问题

import { useState, useCallback } from 'react';
import { useV2StepTest } from './useV2StepTest';
import type { SmartScriptStep } from '../types/smartScript';

// 保持V1接口兼容性的结果类型
export interface SingleStepTestResult {
  success: boolean;
  step_id: string;
  step_name: string;
  message: string;
  duration_ms: number;
  timestamp: number;
  ui_elements?: Array<{
    id: string;
    score: number;
    confidence: number;
    bounds: { left: number; top: number; right: number; bottom: number };
    text?: string;
  }>;
  executed_action?: string;
  verify_passed?: boolean;
  error_code?: string;
  logs?: string[];
}

export type TestExecutionMode = 'match-only' | 'execute-step';

/**
 * 🔄 V1到V2迁移Hook - 无缝替换useSingleStepTest
 * 
 * 🎯 解决"missing field strategy"错误
 * ✅ 保持V1接口100%兼容  
 * 🚀 内部使用V2引擎执行
 * 📦 零修改成本，直接替换导入
 */
export function useStepTestV2Migration() {
  const [testingSteps, setTestingSteps] = useState<Set<string>>(new Set());
  const [executionMode, setExecutionMode] = useState<TestExecutionMode>('execute-step');
  const [testResults, setTestResults] = useState<Record<string, SingleStepTestResult>>({});

  const { executeStep } = useV2StepTest();

  /**
   * 🔧 内部执行逻辑，使用V2引擎
   */
  const executeStepInternal = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    // 确保step有必需字段（兼容V1接口）
    const completeStep: SmartScriptStep = {
      ...step,
      description: step.description || '',
      enabled: step.enabled ?? true,
      order: step.order ?? 0,
    };

    const stepId = completeStep.id;
    const actualMode = mode || executionMode;

    console.log(`🔄 V1→V2迁移: ${completeStep.name} (设备: ${deviceId})`);
    console.log(`📋 使用V2引擎，解决"missing field strategy"问题`);

    // 标记测试中状态
    setTestingSteps(prev => new Set(prev).add(stepId));

    try {
      // 🚀 使用V2引擎执行，无V1兼容性问题
      const v2Result = await executeStep(completeStep, deviceId, actualMode);

      // 转换V2结果为V1兼容格式
      const v1CompatResult: SingleStepTestResult = {
        success: v2Result.success,
        step_id: v2Result.stepId,
        step_name: v2Result.stepName,
        message: v2Result.message,
        duration_ms: v2Result.durationMs,
        timestamp: v2Result.timestamp,
        ui_elements: v2Result.matched ? [{
          id: v2Result.matched.id,
          score: v2Result.matched.score,
          confidence: v2Result.matched.confidence,
          bounds: v2Result.matched.bounds,
          text: v2Result.matched.text,
        }] : undefined,
        executed_action: v2Result.executedAction,
        verify_passed: v2Result.verifyPassed,
        error_code: v2Result.errorCode,
        logs: v2Result.logs || [`V2引擎: ${v2Result.success ? '✅成功' : '❌失败'}`],
      };

      // 保存结果
      setTestResults(prev => ({ ...prev, [stepId]: v1CompatResult }));

      console.log(`✅ V1→V2迁移成功: ${v1CompatResult.success ? '执行成功' : '执行失败'}`);
      return v1CompatResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ V1→V2迁移异常:`, error);

      const errorResult: SingleStepTestResult = {
        success: false,
        step_id: stepId,
        step_name: completeStep.name || completeStep.step_type || 'unknown',
        message: `V2引擎执行失败: ${errorMessage}`,
        duration_ms: 0,
        timestamp: Date.now(),
        error_code: 'V2_ENGINE_ERROR',
        logs: [`V2错误: ${errorMessage}`],
      };

      setTestResults(prev => ({ ...prev, [stepId]: errorResult }));
      throw error; // 保持V1的错误抛出行为

    } finally {
      setTestingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  }, [executeStep, executionMode]);

  // 🎯 V1兼容的主要方法 - 完全匹配原接口
  const executeSingleStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, executionMode);
  }, [executeStepInternal, executionMode]);

  const executeStepWithMode = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, mode);
  }, [executeStepInternal]);

  const executeUnifiedStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, mode);
  }, [executeStepInternal]);

  const executeStrategyTest = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, 'match-only');
  }, [executeStepInternal]);

  // 📊 状态管理方法
  const getStepTestResult = useCallback((stepId: string) => {
    return testResults[stepId];
  }, [testResults]);

  const isStepTesting = useCallback((stepId: string) => {
    return testingSteps.has(stepId);
  }, [testingSteps]);

  const clearStepResult = useCallback((stepId: string) => {
    setTestResults(prev => {
      const newResults = { ...prev };
      delete newResults[stepId];
      return newResults;
    });
  }, []);

  const clearAllResults = useCallback(() => {
    setTestResults({});
    setTestingSteps(new Set());
  }, []);

  const getAllTestResults = useCallback(() => {
    return Object.values(testResults);
  }, [testResults]);

  const convertStepToMatchCriteria = useCallback((step: SmartScriptStep) => {
    return step.parameters || {};
  }, []);

  // 📦 返回完全兼容V1的接口
  return {
    // 主要执行方法
    executeSingleStep,
    executeStepWithMode,
    executeUnifiedStep,
    executeStrategyTest,
    
    // 状态管理
    getStepTestResult,
    isStepTesting,
    clearStepResult,
    clearAllResults,
    getAllTestResults,
    
    // 状态属性
    testResults,
    testingSteps: Array.from(testingSteps), // 转换为数组以匹配V1接口
    executionMode,
    setExecutionMode,
    
    // 转换器
    convertStepToMatchCriteria,
  };
}

/**
 * 🎯 快捷导出：直接替换useSingleStepTest
 * 
 * 使用方法：
 * 1. 找到导入useSingleStepTest的地方
 * 2. 修改导入：
 *    // 从这个
 *    import { useSingleStepTest } from './useSingleStepTest';
 * 
 *    // 改为这个
 *    import { useSingleStepTest } from './useStepTestV2Migration';
 * 
 * 3. 其他代码完全不用改！
 */
export const useSingleStepTest = useStepTestV2Migration;

/**
 * 📝 迁移说明
 * 
 * ❌ V1问题：
 * - "missing field strategy" 错误
 * - 类型不安全
 * - 接口不兼容
 * 
 * ✅ V2解决：
 * - 使用稳定的V2引擎
 * - 完整的类型安全
 * - 保持V1接口兼容
 * - 详细的错误信息
 */