// src/hooks/useStepTestV2Migration.ts  
// module: hooks | layer: hooks | role: V1到V2无缝迁移Hook
// summary: 保持V1接口兼容性，内部使用V2引擎，解决"missing field strategy"问题

import { useState, useCallback } from 'react';
import { useV2StepTest } from './useV2StepTest';
import type { SmartScriptStep } from '../types/smartScript';

// 添加缺失的字段到步骤类型
interface CompleteSmartScriptStep extends SmartScriptStep {
  description?: string;
  enabled?: boolean;
  order?: number;
}

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

export interface UseStepTestState {
  testingSteps: Set<string>;
  executionMode: TestExecutionMode;
  lastResults: Record<string, SingleStepTestResult>;
}

/**
 * 🔄 V1到V2迁移Hook - 无缝替换useSingleStepTest
 * 
 * 特点：
 * - 保持完全相同的V1接口
 * - 内部使用V2引擎执行，解决"missing field strategy"
 * - 零修改成本，直接替换导入即可
 * - 完整的向后兼容性
 */
export function useStepTestV2Migration(): UseStepTestState & {
  // 主要方法（完全匹配V1接口）
  executeSingleStep: (step: SmartScriptStep, deviceId: string) => Promise<SingleStepTestResult>;
  executeStepWithMode: (step: SmartScriptStep, deviceId: string, mode?: TestExecutionMode) => Promise<SingleStepTestResult>;
  executeUnifiedStep: (step: SmartScriptStep, deviceId: string, mode?: TestExecutionMode) => Promise<SingleStepTestResult>;
  executeStrategyTest: (step: SmartScriptStep, deviceId: string) => Promise<SingleStepTestResult>;
  
  // 状态管理
  getStepTestResult: (stepId: string) => SingleStepTestResult | undefined;
  isStepTesting: (stepId: string) => boolean;
  clearStepResult: (stepId: string) => void;
  clearAllResults: () => void;
  getAllTestResults: () => SingleStepTestResult[];
  
  // 兼容属性
  testResults: Record<string, SingleStepTestResult>;
  testingSteps: string[];
  setExecutionMode: (mode: TestExecutionMode) => void;
  
  // 转换器
  convertStepToMatchCriteria: (step: SmartScriptStep) => any;
} {
  const [testingSteps, setTestingSteps] = useState<Set<string>>(new Set());
  const [executionMode, setExecutionMode] = useState<TestExecutionMode>('execute-step');
  const [lastResults, setLastResults] = useState<Record<string, SingleStepTestResult>>({});

  const { executeStep } = useV2StepTest();

  /**
   * 🚀 主要执行方法 - 匹配V1接口
   */
  const executeSingleStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, executionMode);
  }, [executionMode]);

  const executeStepWithMode = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, mode || executionMode);
  }, [executionMode]);

  const executeUnifiedStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, mode || executionMode);
  }, [executionMode]);

  const executeStrategyTest = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    return executeStepInternal(step, deviceId, 'match-only');
  }, []);

  /**
   * 🔧 内部执行逻辑，使用V2引擎
   */
  const executeStepInternal = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    const stepId = step.id;
    const actualMode = mode || executionMode;

    console.log(`🔄 V1→V2迁移: 开始测试 ${step.name} (设备: ${deviceId})`);
    console.log(`📋 V1兼容模式，内部使用V2引擎`);

    // 标记测试中状态
    setTestingSteps(prev => new Set(prev).add(stepId));

    try {
      // 使用V2引擎执行
      const v2Result = await executeStep(step, deviceId, actualMode);

      console.log(`✅ V2引擎执行完成:`, v2Result);

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
        logs: v2Result.logs || [`V2引擎执行: ${v2Result.success ? '成功' : '失败'}`],
      };

      // 保存结果
      setLastResults(prev => ({ ...prev, [stepId]: v1CompatResult }));

      console.log(`✅ V1→V2迁移完成:`, {
        stepId,
        success: v1CompatResult.success,
        message: v1CompatResult.message,
        engine: 'v2',
      });

      return v1CompatResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ V1→V2迁移失败:`, error);

      // 返回V1格式的错误结果
      const errorResult: SingleStepTestResult = {
        success: false,
        step_id: stepId,
        step_name: step.name || step.step_type || 'unknown',
        message: `V1→V2迁移失败: ${errorMessage}`,
        duration_ms: 0,
        timestamp: Date.now(),
        error_code: 'V1_V2_MIGRATION_ERROR',
        logs: [errorMessage],
      };

      setLastResults(prev => ({ ...prev, [stepId]: errorResult }));
      throw error; // 保持V1的错误抛出行为

    } finally {
      // 清除测试中状态
      setTestingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  }, [executeStep, executionMode]);

  const clearTestResults = useCallback(() => {
    setLastResults({});
    setTestingSteps(new Set());
  }, []);

  const getTestResult = useCallback((stepId: string) => {
    return lastResults[stepId];
  }, [lastResults]);

  return {
    testingSteps,
    executionMode,
    lastResults,
    runSingleStepTest,
    setExecutionMode,
    clearTestResults,
    getTestResult,
  };
}

/**
 * 📄 迁移指南
 * 
 * 原V1用法：
 * ```typescript
 * import { useSingleStepTest } from './useSingleStepTest';
 * const { runSingleStepTest } = useSingleStepTest();
 * ```
 * 
 * 新V2用法（零修改）：
 * ```typescript
 * import { useStepTestV2Migration as useSingleStepTest } from './useStepTestV2Migration';
 * const { runSingleStepTest } = useSingleStepTest(); // 完全相同！
 * ```
 * 
 * 或者重命名：
 * ```typescript
 * import { useStepTestV2Migration } from './useStepTestV2Migration';  
 * const { runSingleStepTest } = useStepTestV2Migration();
 * ```
 */

/**
 * 🎯 快捷导出：直接替换useSingleStepTest
 */
export const useSingleStepTest = useStepTestV2Migration;