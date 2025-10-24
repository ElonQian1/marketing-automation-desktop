// src/hooks/useV2StepTest.ts
// module: hooks | layer: hooks | role: V2版本单步测试Hook
// summary: 基于StepExecutionGateway的V2步骤测试，替代有问题的V1系统

import { useState, useCallback } from 'react';
import { getStepExecutionGateway, type StepExecutionRequest, type StepExecutionResponse } from '../infrastructure/gateways/StepExecutionGateway';
import type { SmartScriptStep } from '../types/smartScript';
import { debugBoundsConversion, validateMenuBounds } from '../debug/bounds-debugging';

// V2测试结果接口
export interface V2StepTestResult {
  success: boolean;
  stepId: string;
  stepName: string;
  message: string;
  durationMs: number;
  timestamp: number;
  engine: 'v2' | 'shadow';
  matched?: {
    id: string;
    score: number;
    confidence: number;
    bounds: { left: number; top: number; right: number; bottom: number };
    text?: string;
  };
  executedAction?: string;
  verifyPassed?: boolean;
  errorCode?: string;
  logs?: string[];
  rawResponse?: StepExecutionResponse;
}

export interface UseV2StepTestState {
  isLoading: boolean;
  lastResult: V2StepTestResult | null;
  error: string | null;
}

export interface UseV2StepTestActions {
  executeStep: (
    step: SmartScriptStep,
    deviceId: string,
    mode?: 'match-only' | 'execute-step'
  ) => Promise<V2StepTestResult>;
  executeStepDirect: (request: StepExecutionRequest) => Promise<V2StepTestResult>;
  clearResult: () => void;
  clearError: () => void;
}

/**
 * 🚀 V2版本的单步测试Hook
 * 
 * 特点：
 * - 基于最新的StepExecutionGateway
 * - 支持V2引擎直接执行
 * - 类型安全，无V1兼容性问题
 * - 清晰的错误处理和日志
 */
export function useV2StepTest(): UseV2StepTestState & UseV2StepTestActions {
  const [state, setState] = useState<UseV2StepTestState>({
    isLoading: false,
    lastResult: null,
    error: null,
  });

  /**
   * 执行智能脚本步骤（从SmartScriptStep转换）
   */
  const executeStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode: 'match-only' | 'execute-step' = 'execute-step'
  ): Promise<V2StepTestResult> => {
    console.log('🚀 V2步骤测试开始:', {
      stepId: step.id,
      stepType: step.step_type,
      deviceId,
      mode,
    });

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const startTime = Date.now();

      // 转换SmartScriptStep到V2请求格式
      const request: StepExecutionRequest = convertSmartStepToV2Request(step, deviceId, mode);
      
      console.log('📋 V2请求参数:', JSON.stringify(request, null, 2));

      // 执行V2步骤
      const gateway = getStepExecutionGateway();
      const response = await gateway.executeStep(request);
      
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      console.log('✅ V2执行完成:', {
        success: response.success,
        message: response.message,
        engine: response.engine,
        durationMs,
      });

      // 转换响应为测试结果
      const result: V2StepTestResult = {
        success: response.success,
        stepId: step.id || 'unknown',
        stepName: step.name || step.step_type || 'unknown',
        message: response.message,
        durationMs,
        timestamp: endTime,
        engine: response.engine as 'v2' | 'shadow',
        matched: response.matched,
        executedAction: response.executedAction,
        verifyPassed: response.verifyPassed,
        errorCode: response.errorCode,
        logs: response.logs,
        rawResponse: response,
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResult: result,
        error: null,
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ V2步骤测试失败:', error);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // 仍然返回失败结果以保持接口一致性
      const failedResult: V2StepTestResult = {
        success: false,
        stepId: step.id || 'unknown',
        stepName: step.name || step.step_type || 'unknown',
        message: `V2测试失败: ${errorMessage}`,
        durationMs: 0,
        timestamp: Date.now(),
        engine: 'v2',
        errorCode: 'V2_TEST_ERROR',
        logs: [errorMessage],
      };

      setState(prev => ({ ...prev, lastResult: failedResult }));
      return failedResult;
    }
  }, []);

  /**
   * 直接执行V2请求（高级用法）
   */
  const executeStepDirect = useCallback(async (
    request: StepExecutionRequest
  ): Promise<V2StepTestResult> => {
    console.log('🚀 V2直接执行:', request);

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const startTime = Date.now();

      const gateway = getStepExecutionGateway();
      const response = await gateway.executeStep(request);
      
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      const result: V2StepTestResult = {
        success: response.success,
        stepId: request.selectorId || 'direct',
        stepName: request.actionParams.type || 'direct-action',
        message: response.message,
        durationMs,
        timestamp: endTime,
        engine: response.engine as 'v2' | 'shadow',
        matched: response.matched,
        executedAction: response.executedAction,
        verifyPassed: response.verifyPassed,
        errorCode: response.errorCode,
        logs: response.logs,
        rawResponse: response,
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResult: result,
        error: null,
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ V2直接执行失败:', error);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, []);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, lastResult: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    executeStep,
    executeStepDirect,
    clearResult,
    clearError,
  };
}

/**
 * 转换SmartScriptStep到V2请求格式
 */
function convertSmartStepToV2Request(
  step: SmartScriptStep,
  deviceId: string,
  mode: 'match-only' | 'execute-step'
): StepExecutionRequest {
  const params = step.parameters || {};

  // 根据步骤类型转换动作参数
  let actionParams: StepExecutionRequest['actionParams'];

  switch (step.step_type) {
    case 'smart_find_element':
    case 'click':
      actionParams = {
        type: 'tap', // 修复：使用正确的StepActionParams类型
        params: {
          x: undefined,
          y: undefined,
          offsetX: 0,
          offsetY: 0,
        },
      };
      break;

    case 'smart_input':
    case 'type':
      actionParams = {
        type: 'type',
        params: {
          text: params.text as string || '',
          clearBefore: params.clear_before !== false,
          keyboardEnter: params.keyboard_enter === true,
        },
      };
      break;

    case 'smart_swipe':
    case 'swipe':
      actionParams = {
        type: 'swipe',
        params: {
          direction: (params.direction as 'up' | 'down' | 'left' | 'right') || 'up',
          distance: Number(params.distance) || 500,
          durationMs: Number(params.duration) || 300, // 修复：使用正确的字段名
          startFrom: 'element' as const,
        },
      };
      break;

    case 'wait':
      actionParams = {
        type: 'wait',
        params: {
          waitMs: Number(params.duration) || 1000, // 修复：使用正确的字段名
        },
      };
      break;

    default:
      // 默认点击动作，修复：使用tap代替click
      actionParams = {
        type: 'tap',
        params: {
          x: undefined,
          y: undefined,
          offsetX: 0,
          offsetY: 0,
        },
      };
  }

  return {
    deviceId,
    mode,
    actionParams,
    selectorId: params.element_selector || step.id,
    bounds: parseBoundsFromParams(params),
  };
}

/**
 * 从参数生成XPath选择器
 */
function generateXPathFromParams(params: Record<string, unknown>): string {
  // 优先使用existing selector
  if (params.element_selector && typeof params.element_selector === 'string') {
    return params.element_selector;
  }

  // 使用resource_id
  if (params.resource_id && typeof params.resource_id === 'string') {
    return `//*[@resource-id="${params.resource_id}"]`;
  }

  // 使用content_desc
  if (params.content_desc && typeof params.content_desc === 'string') {
    return `//*[@content-desc="${params.content_desc}"]`;
  }

  // 使用text
  if (params.text && typeof params.text === 'string') {
    return `//*[@text="${params.text}"]`;
  }

  // 最后使用bounds坐标（兜底方案）
  if (params.bounds && typeof params.bounds === 'string') {
    try {
      const bounds = JSON.parse(params.bounds);
      const centerX = Math.round((bounds.left + bounds.right) / 2);
      const centerY = Math.round((bounds.top + bounds.bottom) / 2);
      return `//*[contains(@bounds,"${centerX},${centerY}")]`;
    } catch {
      // bounds解析失败，使用通用选择器
    }
  }

  // 兜底选择器
  return '//*';
}

/**
 * 解析边界坐标
 */
function parseBoundsFromParams(params: Record<string, unknown>): StepExecutionRequest['bounds'] {
  if (!params.bounds) return undefined;

  try {
    let bounds: { left: number; top: number; right: number; bottom: number };
    const originalBounds = params.bounds;
    
    if (typeof params.bounds === 'string') {
      // 🔧 修复：支持 [left,top][right,bottom] 格式
      const bracketFormat = params.bounds.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
      if (bracketFormat) {
        bounds = {
          left: parseInt(bracketFormat[1]),
          top: parseInt(bracketFormat[2]),
          right: parseInt(bracketFormat[3]),
          bottom: parseInt(bracketFormat[4]),
        };
      } else {
        // 尝试JSON解析
        bounds = JSON.parse(params.bounds);
      }
    } else if (typeof params.bounds === 'object') {
      bounds = params.bounds as { left: number; top: number; right: number; bottom: number };
    } else {
      return undefined;
    }
    
    // 🔍 调试：验证菜单元素的bounds是否正确
    const elementId = params.element_selector as string || params.id as string || 'unknown';
    const elementText = params.text as string || params.content_desc as string;
    
    // 验证菜单元素bounds
    if (elementText === '菜单' || elementId.includes('menu') || originalBounds === '[39,143][102,206]') {
      validateMenuBounds(elementId, elementText, bounds);
      
      // 记录bounds转换过程
      const expectedBounds = '[39,143][102,206]';
      const actualBounds = `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
      
      if (actualBounds !== expectedBounds && elementText === '菜单') {
        console.warn('⚠️ [菜单元素警告] 检测到菜单元素使用了不符合预期的bounds:', {
          elementId,
          elementText,
          expected: expectedBounds,
          actual: actualBounds,
          originalInput: originalBounds
        });
      }
    }
    
    console.log('🔧 [parseBoundsFromParams] 解析bounds:', {
      original: originalBounds,
      parsed: bounds,
      elementId: elementId.length > 15 ? `...${elementId.slice(-12)}` : elementId,
      elementText
    });

    return {
      x: bounds.left || 0,
      y: bounds.top || 0,
      width: (bounds.right || 100) - (bounds.left || 0),
      height: (bounds.bottom || 50) - (bounds.top || 0),
    };
  } catch (error) {
    console.error('❌ [parseBoundsFromParams] bounds解析失败:', error, params.bounds);
    return undefined;
  }
}

/**
 * 🎯 快捷方式：创建V2测试实例
 */
export function createV2StepTest() {
  return useV2StepTest();
}

/**
 * 📊 V2系统优势说明
 * 
 * 与V1系统对比：
 * ✅ 类型安全 - 完整TypeScript支持
 * ✅ 稳定可靠 - 无V1兼容性问题  
 * ✅ 性能更好 - 新架构优化
 * ✅ 清晰错误 - 详细错误信息和日志
 * ✅ 支持影子执行 - 可选的V1/V2对比
 * ✅ 灵活配置 - 运行时引擎切换
 */