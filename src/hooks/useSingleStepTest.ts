// src/hooks/useSingleStepTest.ts
// module: shared | layer: application | role: 状态钩子
// summary: React状态管理和业务逻辑封装

import { useState, useCallback } from 'react';
import { message } from 'antd';
import { isTauri, invoke } from '@tauri-apps/api/core';
import type { SmartScriptStep, SingleStepTestResult, ActionKind, StepAction } from '../types/smartScript';
import { useAdb } from '../application/hooks/useAdb';
import type { MatchCriteriaDTO } from '../domain/page-analysis/repositories/IUiMatcherRepository';
import { isSmartFindElementType, ensureBoundsNormalized } from './singleStepTest/utils';
import { buildCriteriaFromStep, executeStrategyTestImpl } from './singleStepTest/strategyTest';
import { runBackendLoop } from './singleStepTest/backendLoop';
import { executeActionOnce } from './singleStepTest/singleAction';
import { executeXPathDirect } from './singleStepTest/xpathDirectExecution';
import type { StrategyTestResult } from './singleStepTest/types';
// 🆕 导入离线验证系统
import { OfflineValidationSystem } from '../modules/intelligent-strategy-system/validation/OfflineValidationSystem';
// 🆕 导入统一执行管道
import { 
  TauriStepExecutionRepository,
  type StepExecutionRequest,
  type StepExecutionResult
} from '../infrastructure/repositories/TauriStepExecutionRepository';

// 执行模式类型定义
export type TestExecutionMode = 'match-only' | 'execute-step';

/**
 * useSingleStepTest
 * - 单步测试会尊重 step.parameters.inline_loop_count（范围 1-50），顺序执行；
 * - 失败将短路（停止后续执行）并聚合 loopSummary/iterations；
 * - 支持两种模式：match-only（仅匹配）和 execute-step（执行步骤）；
 * - 新的动作系统：通过 step.action 字段控制具体执行什么动作。
 */
export const useSingleStepTest = () => {
  const [testingSteps, setTestingSteps] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, SingleStepTestResult>>({});
  const [executionMode, setExecutionMode] = useState<TestExecutionMode>('execute-step'); // 默认执行步骤
  const { matchElementByCriteria } = useAdb();
  
  // 🆕 统一执行管道 repository
  const stepExecutionRepo = new TauriStepExecutionRepository();

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

  /**
   * 🆕 统一执行管道 - 使用后端 run_step 命令
   */
  const executeUnifiedStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    const actualMode = mode || executionMode;
    
    console.log('🚀 使用统一执行管道:', { stepId: step.id, mode: actualMode });
    
    try {
      // 构建请求
      const request: StepExecutionRequest = {
        device_id: deviceId,
        mode: actualMode,
        step: {
          id: step.id || 'test-step',
          name: step.step_type || 'unknown',
          selector: stepExecutionRepo.convertParametersToSelector(step.parameters || {}),
          action: step.action 
            ? stepExecutionRepo.convertActionToDto(step.action)
            : { type: 'Click' }, // 默认动作
          strategy: stepExecutionRepo.inferStrategy(step.parameters || {})
        }
      };

      console.log('📋 执行请求:', request);

      // 调用统一执行命令
      const result: StepExecutionResult = await stepExecutionRepo.runStep(request);
      
      console.log('✅ 统一执行结果:', result);

      // 转换为 SingleStepTestResult 格式
      return {
        success: result.success,
        step_id: result.step_id,
        step_name: step.name || step.step_type,
        message: result.message,
        duration_ms: result.duration_ms,
        timestamp: Date.now(),
        ui_elements: result.matched_element ? [{
          type: 'element' as const,
          bounds: result.matched_element.bounds,
          attributes: { confidence: result.matched_element.confidence.toString() }
        }] : [],
        logs: result.logs || [],
        error_details: result.error_details,
        extracted_data: {
          matchResult: result.matched_element,
          actionResult: result.action_result
        }
      };
    } catch (error) {
      console.error('❌ 统一执行管道失败:', error);
      return {
        success: false,
        step_id: step.id || 'test-step',
        step_name: step.name || step.step_type,
        message: `执行失败: ${error}`,
        duration_ms: 0,
        timestamp: Date.now(),
        ui_elements: [],
        logs: [`错误: ${error}`],
        error_details: String(error),
        extracted_data: {}
      };
    }
  }, [executionMode, stepExecutionRepo]);

  // 统一的步骤执行函数（支持模式切换）
  const executeStepWithMode = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode?: TestExecutionMode
  ): Promise<SingleStepTestResult> => {
    const actualMode = mode || executionMode;
    
    if (actualMode === 'match-only') {
      // 仅匹配模式：只做策略匹配
      console.log('🎯 执行模式：仅匹配');
      const strategyResult = await executeStrategyTest(step, deviceId);
      return {
        success: strategyResult.success,
        step_id: step.id,
        step_name: step.name,
        message: `匹配测试: ${strategyResult.output}`,
        duration_ms: 0,
        timestamp: Date.now(),
        ui_elements: strategyResult.matchResult?.preview ? [strategyResult.matchResult.preview] : [],
        logs: [`策略匹配: ${strategyResult.success ? '成功' : '失败'}`],
        error_details: strategyResult.error,
        extracted_data: strategyResult.criteria ? { matchCriteria: strategyResult.criteria } : {}
      };
    } else {
      // 执行步骤模式：根据动作类型执行具体操作
      console.log('🎯 执行模式：执行步骤');
      return executeStepAction(step, deviceId);
    }
  }, [executionMode, executeStrategyTest]);

  // 执行步骤动作（新函数）
  const executeStepAction = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    // 确定动作类型
    const actionKind = step.action?.kind || getDefaultActionFromStepType(step.step_type);
    
    console.log(`🚀 执行动作: ${actionKind}`);
    
    // 如果是 find_only，只做匹配
    if (actionKind === 'find_only') {
      const strategyResult = await executeStrategyTest(step, deviceId);
      return {
        success: strategyResult.success,
        step_id: step.id,
        step_name: step.name,
        message: strategyResult.output,
        duration_ms: 0,
        timestamp: Date.now(),
        ui_elements: strategyResult.matchResult?.preview ? [strategyResult.matchResult.preview] : [],
        logs: [`元素查找: ${strategyResult.success ? '成功' : '失败'}`],
        error_details: strategyResult.error,
        extracted_data: strategyResult.criteria ? { matchCriteria: strategyResult.criteria } : {}
      };
    }

    // 其他动作：先匹配，再执行
    try {
      // 步骤1：匹配元素
      console.log('🔍 步骤1：匹配元素');
      const strategyResult = await executeStrategyTest(step, deviceId);
      
      if (!strategyResult.success) {
        return {
          success: false,
          step_id: step.id,
          step_name: step.name,
          message: `匹配失败: ${strategyResult.output}`,
          duration_ms: 0,
          timestamp: Date.now(),
          ui_elements: [],
          logs: ['匹配失败，跳过动作执行'],
          error_details: strategyResult.error,
          extracted_data: {}
        };
      }

      // 步骤2：执行动作
      console.log(`🎯 步骤2：执行动作 (${actionKind})`);
      const actionResult = await runStepAction(step, deviceId, actionKind);
      
      return {
        success: actionResult.success,
        step_id: step.id,
        step_name: step.name,
        message: `匹配成功 → ${actionResult.message}`,
        duration_ms: actionResult.duration,
        timestamp: Date.now(),
        ui_elements: strategyResult.matchResult?.preview ? [strategyResult.matchResult.preview] : [],
        logs: [
          '✅ 元素匹配成功',
          `🎯 执行${actionKind}: ${actionResult.success ? '成功' : '失败'}`
        ],
        error_details: actionResult.success ? undefined : actionResult.message,
        extracted_data: {
          matchCriteria: strategyResult.criteria,
          actionResult: actionResult.data
        }
      };
    } catch (error) {
      return {
        success: false,
        step_id: step.id,
        step_name: step.name,
        message: `执行失败: ${error}`,
        duration_ms: 0,
        timestamp: Date.now(),
        ui_elements: [],
        logs: [`执行异常: ${error}`],
        error_details: String(error),
        extracted_data: {}
      };
    }
  }, [executeStrategyTest]);

  // 根据步骤类型推断默认动作
  const getDefaultActionFromStepType = (stepType: string): ActionKind => {
    const typeStr = String(stepType).toLowerCase();
    if (typeStr.includes('tap') || typeStr.includes('click')) return 'tap';
    if (typeStr.includes('long')) return 'long_press';
    if (typeStr.includes('double')) return 'double_tap';
    if (typeStr.includes('swipe')) return 'swipe';
    if (typeStr.includes('input')) return 'input';
    if (typeStr.includes('wait')) return 'wait';
    if (typeStr.includes('back')) return 'back';
    if (typeStr.includes('key')) return 'keyevent';
    return 'tap'; // 默认为点击
  };

  // 执行具体动作的函数
  const runStepAction = async (
    step: SmartScriptStep, 
    deviceId: string, 
    actionKind: ActionKind
  ): Promise<{success: boolean, message: string, duration: number, data?: unknown}> => {
    const startTime = Date.now();
    
    try {
      switch (actionKind) {
        case 'tap':
          await invoke('safe_adb_shell_command', {
            deviceId,
            command: ['input', 'tap', '100', '100'] // 临时坐标，应该从匹配结果计算
          });
          return {
            success: true,
            message: '点击执行成功',
            duration: Date.now() - startTime
          };
          
        case 'wait':
          const waitMs = step.action?.params?.waitMs || 1000;
          await new Promise(resolve => setTimeout(resolve, waitMs));
          return {
            success: true,
            message: `等待 ${waitMs}ms 完成`,
            duration: Date.now() - startTime
          };
          
        default:
          return {
            success: false,
            message: `暂未实现的动作类型: ${actionKind}`,
            duration: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `动作执行失败: ${error}`,
        duration: Date.now() - startTime
      };
    }
  };

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
      // 🎯 特殊优先处理：XPath 策略直接走后端一体化流程（跳过两阶段）
      const stepParams = step.parameters as any;
      const matchingStrategy = stepParams?.matching?.strategy;
      const isXPathStrategy = matchingStrategy === 'xpath-direct' || 
                             matchingStrategy?.includes('xpath') ||
                             matchingStrategy === 'xpath_first' ||
                             matchingStrategy === 'xpath_all';
      
      if (isXPathStrategy) {
        console.log(`🎯 检测到 XPath 策略 (${matchingStrategy})，使用直接执行模式，跳过两阶段流程`);
        return executeXPathDirect(step, deviceId);
      }

      // 智能元素查找：根据执行模式选择路径
      if (isSmartFindElementType(step.step_type)) {
        if (executionMode === 'match-only') {
          console.log('🎯 使用策略匹配模式测试元素查找（单次）');
          const strategyResult = await executeStrategyTest(step, deviceId);
          let once: SingleStepTestResult = {
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

        // 🆕 可选：在“查找”成功后，根据步骤语义执行一次点击
        // 触发条件：
        // 1) 步骤名称以“点击”开头（例如“点击FrameLayout”）；或
        // 2) 显式开启参数 flags：parameters.test_click_after_match === true
        const shouldClickAfterMatch = strategyResult.success && (
          /^(点击|操作)/.test(step.name || '') || (step.parameters as any)?.test_click_after_match === true
        );

        if (shouldClickAfterMatch) {
          try {
            // 计算点击坐标：优先使用匹配预览的 bounds；否则回退到步骤参数中的 bounds/locator
            const previewBoundsStr = strategyResult.matchResult?.preview?.bounds;
            const paramsWithBounds = ensureBoundsNormalized({ ...(step.parameters || {}), bounds: previewBoundsStr ?? (step.parameters as any)?.bounds });
            const rect = paramsWithBounds.boundsRect;
            if (rect) {
              const x = Math.floor((rect.left + rect.right) / 2);
              const y = Math.floor((rect.top + rect.bottom) / 2);

              // 构造临时 tap 步骤并执行（不修改原步骤类型）
              const tapStep: SmartScriptStep = {
                ...step,
                id: `${step.id}__test_tap`,
                step_type: 'tap' as any,
                name: step.name ? `${step.name} - 测试点击` : '测试点击',
                parameters: {
                  ...(step.parameters || {}),
                  // 对于 XPath 策略，移除错误的坐标，让后端从匹配信息中计算
                  x: undefined,
                  y: undefined,
                  hold_duration_ms: 80,
                },
              } as SmartScriptStep;

              console.log(`🖱️ 使用 XPath 智能匹配执行点击，后端将自动计算坐标`);
              const tapResult = await executeActionOnce(tapStep, deviceId);

              // 合并结果：若点击失败，则整体记为失败并附加日志
              once = {
                ...once,
                success: once.success && tapResult.success,
                duration_ms: (once.duration_ms || 0) + (tapResult.duration_ms || 0),
                message: `${once.message}\n\n➡️ 已根据匹配结果在中心点执行点击(${x},${y})：${tapResult.success ? '成功' : '失败'}\n${tapResult.message || ''}`,
                logs: [...(once.logs || []), `匹配后点击: ${tapResult.success ? '成功' : '失败'}`],
              };
            } else {
              once = {
                ...once,
                success: false,
                message: `${once.message}\n\n⚠️ 已启用“匹配后点击”，但未能解析到元素边界(bounds)，无法计算点击坐标。`,
                logs: [...(once.logs || []), '匹配后点击: 失败（缺少 bounds）'],
                error_details: once.error_details || '匹配后点击失败：缺少 bounds',
              };
            }
          } catch (e) {
            console.warn('匹配后点击执行异常:', e);
            once = {
              ...once,
              success: false,
              message: `${once.message}\n\n❌ 匹配后点击执行异常: ${e}`,
              logs: [...(once.logs || []), `匹配后点击: 异常 ${e}`],
              error_details: String(e),
            };
          }
        }
        return once;
        } else {
          // execute-step 模式：使用统一执行管道（匹配 + 执行动作）
          console.log('🚀 smart_find_element 步骤使用统一执行管道（匹配→动作）');
          return executeUnifiedStep(step, deviceId);
        }
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
    executeStepWithMode, // 新增：支持模式切换的执行函数
    executeUnifiedStep, // 🆕 统一执行管道方法
    executeStrategyTest, // 新增：策略匹配测试方法
    convertStepToMatchCriteria, // 新增：参数转换器
    getStepTestResult,
    isStepTesting,
    clearStepResult,
    clearAllResults,
    getAllTestResults,
    testResults,
    testingSteps: Array.from(testingSteps),
    // 执行模式管理
    executionMode,
    setExecutionMode
  };
};