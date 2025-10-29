// src/infrastructure/gateways/adapters/v2Adapter.ts
// module: infrastructure | layer: gateways | role: V2适配器
// summary: StepActionParams到RunStepRequestV2的转换

import type { StepActionParams } from "../../../types/stepActions";
import type { RunStepRequestV2, StepPayload } from "../../../types/runStepV2";

// V2执行请求接口
export interface V2ExecutionRequest {
  deviceId: string;
  mode: "match-only" | "execute-step";
  actionParams: StepActionParams;
  selectorId?: string;
  stepId?: string;  // ✅ 新增：步骤ID，用于Store查询
  bounds?: { x: number; y: number; width: number; height: number };
  // 🎯 【关键修复】屏幕交互坐标参数
  coordinateParams?: {
    start_x?: number;
    start_y?: number;
    end_x?: number;
    end_y?: number;
    duration?: number;
  };
  // 🔥 【关键修复】智能选择配置参数
  smartSelection?: {
    mode?: string; // 'first' | 'all' | 'random' | 'match-original'
    targetText?: string;
    textMatchingMode?: string; // 'exact' | 'partial' | 'fuzzy'
    antonymCheckEnabled?: boolean;
    semanticAnalysisEnabled?: boolean;
    minConfidence?: number;
    batchConfig?: {
      intervalMs?: number;
      maxCount?: number;
      continueOnError?: boolean;
      showProgress?: boolean;
    };
  };
  // 🔥 【关键修复】其他必要参数
  targetText?: string; // 用户选择的元素文本
  contentDesc?: string; // 元素的content-desc
  resourceId?: string; // 元素的resource-id
  elementPath?: string; // 用户选择的 XPath
  xpath?: string; // 备用 XPath 字段
  text?: string; // 元素文本
  className?: string; // 元素类名
  xmlSnapshot?: {  // XML 快照数据
    xmlContent?: string;
    xmlHash?: string;
    elementGlobalXPath?: string;
    elementSignature?: {
      childrenTexts?: string[];
      resourceId?: string;
      text?: string;
      contentDesc?: string;
      bounds?: string;
    };
  };
  verify?: {
    type: "exists" | "text" | "gone";
    timeoutMs?: number;
    expectedText?: string;
  };
  retry?: {
    maxAttempts: number;
    intervalMs: number;
  };
}

/**
 * 将统一请求转换为V2协议
 */
export function convertToV2Request(
  request: V2ExecutionRequest
): RunStepRequestV2 {
  const { 
    deviceId, 
    mode, 
    actionParams, 
    selectorId, 
    stepId, 
    bounds, 
    coordinateParams, 
    verify, 
    retry,
    // 🔥 【关键修复】提取智能选择和其他参数
    smartSelection,
    targetText,
    contentDesc,
    resourceId,
    elementPath,
    xpath,
    text,
    className,
    xmlSnapshot
  } = request;

  console.log('🔍 [V2Adapter] 转换请求参数:', {
    stepId,
    hasSmartSelection: !!smartSelection,
    smartSelectionMode: smartSelection?.mode,
    targetText,
    contentDesc,
    elementPath,
  });

  // 根据动作类型构造不同的StepPayload
  const baseStep = {
    step_id: stepId || `step_${Date.now()}`,  // ✅ 优先使用传入的stepId
    selector: selectorId,
    selector_preferred: true,
    bounds: bounds
      ? {
          left: bounds.x,
          top: bounds.y,
          right: bounds.x + bounds.width,
          bottom: bounds.y + bounds.height,
        }
      : undefined,
    fallback_to_bounds: !!bounds,
    retry: retry
      ? {
          max: retry.maxAttempts,
          interval_ms: retry.intervalMs,
        }
      : undefined,
    verify_after: verify
      ? {
          type: verify.type,
          timeout_ms: verify.timeoutMs || 5000,
          expected_text: verify.expectedText,
        }
      : undefined,
    // 🔥 【关键修复】添加智能选择和其他参数
    smartSelection,
    targetText,
    contentDesc,
    resourceId,
    elementPath,
    xpath,
    text,
    className,
    xmlSnapshot,
  };

  let stepPayload: StepPayload;

  switch (actionParams.type) {
    case "tap":
    case "doubleTap":
    case "longPress":
      stepPayload = {
        ...baseStep,
        action: actionParams.type,
        press_ms: actionParams.params.pressDurationMs,
        offset:
          actionParams.params.offsetX || actionParams.params.offsetY
            ? {
                x: actionParams.params.offsetX || 0,
                y: actionParams.params.offsetY || 0,
              }
            : undefined,
      };
      break;

    case "swipe":
      // 🎯 【关键修复】优先使用具体坐标参数
      if (coordinateParams && 
          typeof coordinateParams.start_x === 'number' &&
          typeof coordinateParams.start_y === 'number' &&
          typeof coordinateParams.end_x === 'number' &&
          typeof coordinateParams.end_y === 'number') {
        // 使用具体坐标的滑动操作，不需要元素选择器
        stepPayload = {
          step_id: stepId || `step_${Date.now()}`,
          action: "swipe" as const,
          // 🎯 传递具体坐标给后端
          start_x: coordinateParams.start_x,
          start_y: coordinateParams.start_y,
          end_x: coordinateParams.end_x,
          end_y: coordinateParams.end_y,
          duration: coordinateParams.duration || 300,
          // 🚫 不需要选择器相关参数，直接使用坐标
        };
      } else {
        // 使用基于元素的滑动操作
        stepPayload = {
          ...baseStep,
          action: "swipe",
          direction: actionParams.params.direction,
          distance_dp: actionParams.params.distance,
          duration_ms: actionParams.params.durationMs,
          start:
            actionParams.params.startFrom === "element"
              ? "center"
              : actionParams.params.startFrom === "screenCenter"
              ? "center"
              : "custom",
          start_offset: actionParams.params.customStart
            ? {
                x: actionParams.params.customStart.x,
                y: actionParams.params.customStart.y,
              }
            : undefined,
        };
      }
      break;

    case "type":
      stepPayload = {
        ...baseStep,
        action: "type",
        text: actionParams.params.text || "",
        secure: actionParams.params.secure,
        clear: actionParams.params.clearBefore,
        submit: actionParams.params.keyboardEnter,
      };
      break;

    case "wait":
      stepPayload = {
        ...baseStep,
        action: "wait",
        duration_ms: actionParams.params.waitMs || 1000,
      };
      break;

    case "back":
      stepPayload = {
        ...baseStep,
        action: "back",
      };
      break;

    case "keyevent":
      // 🎯 系统按键操作
      stepPayload = {
        ...baseStep,
        action: "keyevent",
        key_code: actionParams.params.keyCode || 4, // 默认返回键
      };
      break;

    default:
      console.warn(
        `[V2Adapter] Unknown action type: ${
          (actionParams as StepActionParams).type
        }`
      );
      stepPayload = {
        ...baseStep,
        action: "tap", // 默认降级
      };
      break;
  }

  return {
    device_id: deviceId,
    mode: mode === "match-only" ? "match-only" : "execute-step",
    strategy: "intelligent", // V2协议必需字段
    step: stepPayload,
  };
}
