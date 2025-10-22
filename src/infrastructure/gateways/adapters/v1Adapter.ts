// src/infrastructure/gateways/adapters/v1Adapter.ts
// module: infrastructure | layer: gateways | role: V1适配器
// summary: 统一请求到V1协议的转换

import type { StepActionParams } from '../../../types/stepActions';

// 扩展请求接口，包含V1所需的基础信息
export interface V1ExecutionRequest {
  deviceId: string;
  mode: 'match-only' | 'execute-step';
  actionParams: StepActionParams;
  selectorId?: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

// V1请求接口（基于现有TauriStepExecutionRepository）
export interface V1StepExecutionRequest {
  device_id: string;
  step: V1StepDefinition;
  mode: 'match-only' | 'execute-step';
}

export interface V1StepDefinition {
  id: string;
  name: string;
  selector: V1MatchCriteriaDTO;
  action: V1ActionTypeDto;
  strategy: string;
}

export interface V1MatchCriteriaDTO {
  selector_type: string;
  selector_value: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface V1ActionTypeDto {
  kind: string;
  params?: Record<string, unknown>;
}

/**
 * 将统一请求转换为V1协议
 */
export function convertToV1Request(request: V1ExecutionRequest): V1StepExecutionRequest {
  const { deviceId, mode, actionParams, selectorId, bounds } = request;

  return {
    device_id: deviceId,
    mode: mode,
    step: {
      id: `v1_step_${Date.now()}`,
      name: `V1步骤_${actionParams.type}`,
      selector: convertToV1Selector(actionParams, selectorId, bounds),
      action: convertToV1Action(actionParams),
      strategy: 'intelligent', // V1默认策略
    },
  };
}

/**
 * 转换选择器信息
 */
function convertToV1Selector(
  params: StepActionParams, 
  selectorId?: string, 
  bounds?: { x: number; y: number; width: number; height: number }
): V1MatchCriteriaDTO {
  // 提取文本值（仅type动作有text）
  const textValue = params.type === 'type' ? params.params.text : '';
  const selectorValue = selectorId || textValue || 'unknown';
  
  return {
    selector_type: selectorId ? 'element_selector' : 'text',
    selector_value: selectorValue,
    bounds: bounds,
  };
}

/**
 * 转换动作信息
 */
function convertToV1Action(params: StepActionParams): V1ActionTypeDto {
  switch (params.type) {
    case 'tap':
      return {
        kind: 'tap',
        params: {
          pressDuration: params.params.pressDurationMs,
          offset: { 
            x: params.params.offsetX || 0, 
            y: params.params.offsetY || 0 
          },
        },
      };

    case 'doubleTap':
      return {
        kind: 'double_tap',
        params: {
          interval: 100, // V1固定间隔
        },
      };

    case 'longPress':
      return {
        kind: 'long_press',
        params: {
          duration: params.params.pressDurationMs || 1000,
        },
      };

    case 'swipe':
      return {
        kind: 'swipe',
        params: {
          direction: params.params.direction,
          distance: params.params.distance,
          duration: params.params.durationMs,
        },
      };

    case 'type':
      return {
        kind: 'input_text',
        params: {
          text: params.params.text || '',
          clear: params.params.clearBefore,
          submit: params.params.keyboardEnter,
        },
      };

    case 'wait':
      return {
        kind: 'wait',
        params: {
          duration: params.params.waitMs || 1000,
        },
      };

    case 'back':
      return {
        kind: 'back',
        params: {},
      };

    default:
      console.warn(`[V1Adapter] Unknown action type: ${(params as StepActionParams).type}`);
      return {
        kind: 'tap', // 默认降级为tap
        params: {},
      };
  }
}