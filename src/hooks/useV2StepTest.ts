// src/hooks/useV2StepTest.ts
// module: hooks | layer: hooks | role: V2版本单步测试Hook
// summary: 基于StepExecutionGateway的V2步骤测试，替代有问题的V1系统

import { useState, useCallback } from 'react';
import { getStepExecutionGateway, type StepExecutionRequest, type StepExecutionResponse } from '../infrastructure/gateways/StepExecutionGateway';
import type { SmartScriptStep } from '../types/smartScript';

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
 * 提取目标文本 - 完全保留原文，不做任何处理
 */
function extractTargetTextFromStep(step: SmartScriptStep, params: Record<string, unknown>): string {
  // 1. 优先使用params中明确的文本（原文不变）
  if (params.text && typeof params.text === 'string' && params.text.trim()) {
    console.log('🎯 使用params.text原文:', params.text);
    return params.text; // 保留原文，包括空格等
  }
  
  // 2. 使用content_desc原文（完全不处理）
  if (params.content_desc && typeof params.content_desc === 'string' && params.content_desc.trim()) {
    console.log('🎯 使用content_desc原文:', params.content_desc);
    return params.content_desc; // 完全保留原文
  }
  
  // 3. 从element_selector xpath提取文本条件（保留原文）
  if (params.element_selector && typeof params.element_selector === 'string') {
    const textMatch = params.element_selector.match(/@text\s*=\s*[""']([^""']+)[""']/);
    if (textMatch && textMatch[1]) {
      console.log('🎯 从XPath提取原文文本:', textMatch[1]);
      return textMatch[1]; // XPath中的文本通常就是原文
    }
  }
  
  // 4. ⚠️ 重要修复：不再使用step.name作为targetText
  // 当元素没有明确文本时，应该返回空字符串让后端进行智能分析
  // 而不是传递硬编码的步骤名称（如"智能操作 1"）
  console.log('🎯 元素无明确文本，返回空字符串触发后端智能分析:', {
    stepName: step.name,
    stepType: step.step_type,
    paramsText: params.text,
    contentDesc: params.content_desc,
    reason: '避免硬编码步骤名称误导后端匹配逻辑'
  });
  
  return '';
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
    case 'smart_tap':
    case 'click':
    case 'tap':
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

    case 'doubleTap':
    case 'double_tap':
      actionParams = {
        type: 'doubleTap',
        params: {
          x: undefined,
          y: undefined,
          offsetX: 0,
          offsetY: 0,
        },
      };
      break;

    case 'longPress':
    case 'long_press':
      actionParams = {
        type: 'longPress',
        params: {
          x: undefined,
          y: undefined,
          offsetX: 0,
          offsetY: 0,
          pressDurationMs: Number(params.hold_duration || params.duration) || 800,
        },
      };
      break;

    case 'smart_input':
    case 'type':
    case 'input':
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

    case 'smart_scroll':
      // 🎯 智能滚动转换为滑动操作
      actionParams = {
        type: 'swipe',
        params: {
          direction: (params.direction as 'up' | 'down' | 'left' | 'right') || 'down',
          distance: Number(params.distance) || 600,
          durationMs: Number(params.speed_ms || params.duration) || 300,
          startFrom: 'element' as const,
        },
      };
      break;

    case 'wait':
      actionParams = {
        type: 'wait',
        params: {
          waitMs: Number(params.duration || params.waitMs) || 1000, // 修复：使用正确的字段名
        },
      };
      break;

    case 'back':
      actionParams = {
        type: 'back',
        params: {},
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

  // 🎯 【关键修复】提取屏幕交互坐标参数
  const coordinateParams = (
    typeof params.start_x === 'number' &&
    typeof params.start_y === 'number' &&
    typeof params.end_x === 'number' &&
    typeof params.end_y === 'number'
  ) ? {
    start_x: params.start_x as number,
    start_y: params.start_y as number,
    end_x: params.end_x as number,
    end_y: params.end_y as number,
    duration: (params.duration || params.speed_ms) as number || 300,
  } : undefined;

  return {
    deviceId,
    mode,
    actionParams,
    selectorId: coordinateParams ? undefined : (params.element_selector || step.id), // 🎯 有坐标时不需要选择器
    stepId: step.id,  // ✅ 传递stepId用于Store查询
    bounds: parseBoundsFromParams(params),
    // 🎯 修复：智能提取目标文本信息，解决空文本匹配过度宽泛的问题
    targetText: extractTargetTextFromStep(step, params),
    contentDesc: params.content_desc as string || '',
    resourceId: params.resource_id as string || '',
    // 🎯 【关键修复】传递屏幕交互坐标参数
    coordinateParams,
  };
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
      // 简单的调试日志，替代validateMenuBounds函数
      console.log('🔍 [菜单元素调试] 检测到菜单元素:', {
        elementId,
        elementText,
        bounds,
        originalBounds
      });
      
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