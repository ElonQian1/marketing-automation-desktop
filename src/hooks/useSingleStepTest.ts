import { useState, useCallback } from 'react';
import { message } from 'antd';
import { isTauri, invoke } from '@tauri-apps/api/core';
import type { SmartScriptStep, SingleStepTestResult } from '../types/smartScript';
import { useAdb } from '../application/hooks/useAdb';
import type { MatchCriteriaDTO } from '../domain/page-analysis/repositories/IUiMatcherRepository';
import { isSmartFindElementType, ensureBoundsNormalized } from './singleStepTest/utils';
import { buildCriteriaFromStep, executeStrategyTestImpl } from './singleStepTest/strategyTest';
import { runBackendLoop } from './singleStepTest/backendLoop';
import { executeActionOnce } from './singleStepTest/singleAction';
import type { StrategyTestResult } from './singleStepTest/types';

/**
 * useSingleStepTest
 * - 单步测试会尊重 step.parameters.inline_loop_count（范围 1-50），顺序执行；
 * - 失败将短路（停止后续执行）并聚合 loopSummary/iterations；
 * - SmartFindElement（智能元素查找）仅走“策略匹配”验证，不执行点击/输入等动作；
 * - 只有动作类步骤（tap/swipe/input/wait/...）才会调用后端 execute_single_step_test。
 */
export const useSingleStepTest = () => {
  const [testingSteps, setTestingSteps] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, SingleStepTestResult>>({});
  const { matchElementByCriteria } = useAdb();

  // 使用提取后的工具函数 isSmartFindElementType, buildCriteriaFromStep 等

  /**
   * 将步骤参数转换为匹配条件
   */
  const convertStepToMatchCriteria = useCallback((step: SmartScriptStep): MatchCriteriaDTO | null => buildCriteriaFromStep(step), []);

  /**
   * 使用策略匹配测试步骤
   */
  const executeStrategyTest = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<StrategyTestResult> => {
    return executeStrategyTestImpl(step, deviceId, matchElementByCriteria, buildCriteriaFromStep);
  }, [matchElementByCriteria]);

  // 执行单个步骤测试（支持 inline_loop_count 循环展开）
  const executeSingleStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    const stepId = step.id;

    console.log(`🧪 开始单步测试: ${step.name} (设备: ${deviceId})`);
    console.log(`🔧 步骤类型: ${step.step_type}`);
    console.log('📋 步骤参数:', step.parameters);

    // 标记为测试中
    setTestingSteps(prev => new Set(prev).add(stepId));

    // 工具: 夹取范围
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const inlineCount = clamp(Number((step.parameters as any)?.inline_loop_count ?? 1) || 1, 1, 50);

    // 单次执行封装（SmartFindElement → 策略匹配；其他 → 调后端执行）
    const runOnce = async (): Promise<SingleStepTestResult> => {
      // 智能元素查找：走策略匹配（不下发到后端执行动作）
      if (isSmartFindElementType(step.step_type)) {
        console.log('🎯 使用策略匹配模式测试元素查找（单次）');
        const strategyResult = await executeStrategyTest(step, deviceId);
        const once: SingleStepTestResult = {
          success: strategyResult.success,
          step_id: stepId,
          step_name: step.name,
          message: strategyResult.output,
          duration_ms: 0,
          timestamp: Date.now(),
          ui_elements: strategyResult.matchResult?.preview ? [strategyResult.matchResult.preview] : [],
          logs: [`策略匹配测试: ${strategyResult.success ? '成功' : '失败'}`],
          error_details: strategyResult.error,
          extracted_data: strategyResult.criteria ? { matchCriteria: strategyResult.criteria } : {}
        };
        return once;
      }

      // 非 SmartFindElement → 执行动作
      return executeActionOnce(step, deviceId);
    };

    try {
      // 说明：单步测试会尊重 parameters.inline_loop_count，并在 1-50 范围内顺序执行；
      // 失败将短路（后续不再继续），并在结果中提供 loopSummary 与 iterations 聚合信息。
      // 若 inline_loop_count > 1：优先采用“后端循环卡片”模式（loop_start/step/loop_end），一次性下发
      if (inlineCount > 1) {
        const isTauriEnvForLoop = await isTauri();
        if (isTauriEnvForLoop) {
          console.log('🧩 后端循环执行模式（loop_start/step/loop_end）');
          const aggregated = await runBackendLoop(step, inlineCount, deviceId);
          setTestResults(prev => ({ ...prev, [stepId]: aggregated }));
          if (aggregated.success) {
            message.success(`✅ ${step.name} - 循环测试通过 (×${inlineCount})`);
          } else {
            message.error(`❌ ${step.name} - 循环测试失败 (×${inlineCount})`);
          }
          return aggregated;
        }

        // 非 Tauri 环境：回退到前端循环（聚合）
        console.log(`🔁 启用单步循环测试: ${inlineCount} 次`);
        const aggregated = await (await import('./singleStepTest/frontendLoop')).runFrontendLoop(step, inlineCount, runOnce);
        setTestResults(prev => ({ ...prev, [stepId]: aggregated }));
        if (aggregated.success) {
          message.success(`✅ ${step.name} - 循环测试通过 (${aggregated.extracted_data?.loopSummary?.successCount}/${inlineCount})`);
        } else {
          message.error(`❌ ${step.name} - 循环测试失败 (${aggregated.extracted_data?.loopSummary?.failureCount}/${inlineCount})`);
        }
        return aggregated;
      }

      // 单次执行
      const single = await runOnce();
      setTestResults(prev => ({ ...prev, [stepId]: single }));
      if (single.success) {
        console.log(`✅ 单步测试成功: ${step.name} (${single.duration_ms}ms)`);
        message.success(`✅ ${step.name} - 测试成功 (${single.duration_ms}ms)`);
      } else {
        console.log(`❌ 单步测试失败: ${step.name}`, single.error_details);
        message.error(`❌ ${step.name} - 测试失败: ${single.message}`);
      }
      return single;
    } catch (error) {
      const errorMessage = `测试执行失败: ${error}`;
      console.error(`❌ 单步测试异常: ${step.name}`, error);
      const failureResult: SingleStepTestResult = {
        success: false,
        step_id: step.id,
        step_name: step.name,
        duration_ms: 0,
        timestamp: Date.now(),
        message: errorMessage,
        logs: [errorMessage],
        ui_elements: [],
        extracted_data: {},
        error_details: String(error)
      };
      setTestResults(prev => ({ ...prev, [stepId]: failureResult }));
      message.error(`❌ ${step.name} - ${errorMessage}`);
      return failureResult;
    } finally {
      setTestingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  }, [executeStrategyTest]);

  // 创建模拟测试结果
  // 统一使用公共 createMockResult

  // 获取步骤的测试结果
  const getStepTestResult = useCallback((stepId: string) => {
    return testResults[stepId];
  }, [testResults]);

  // 检查步骤是否正在测试
  const isStepTesting = useCallback((stepId: string) => {
    return testingSteps.has(stepId);
  }, [testingSteps]);

  // 清除步骤测试结果
  const clearStepResult = useCallback((stepId: string) => {
    setTestResults(prev => {
      const newResults = { ...prev };
      delete newResults[stepId];
      return newResults;
    });
  }, []);

  // 清除所有测试结果
  const clearAllResults = useCallback(() => {
    setTestResults({});
    setTestingSteps(new Set());
  }, []);

  // 获取所有测试结果
  const getAllTestResults = useCallback(() => {
    return Object.values(testResults);
  }, [testResults]);

  return {
    executeSingleStep,
    executeStrategyTest, // 新增：策略匹配测试方法
    convertStepToMatchCriteria, // 新增：参数转换器
    getStepTestResult,
    isStepTesting,
    clearStepResult,
    clearAllResults,
    getAllTestResults,
    testResults,
    testingSteps: Array.from(testingSteps)
  };
};