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
  bounds?: { x: number; y: number; width: number; height: number };
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
  const { deviceId, mode, actionParams, selectorId, bounds, verify, retry } =
    request;

  // 根据动作类型构造不同的StepPayload
  const baseStep = {
    step_id: `step_${Date.now()}`,
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
