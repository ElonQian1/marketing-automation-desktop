// src/types/runStepV2.ts
// module: types | layer: domain | role: RunStep V2 协议定义
// summary: 前后端统一的 RunStep V2 请求响应协议，解决策略字段和动作参数问题

import type { StepActionParams } from './stepActions';
import type { StructuredSelector } from './structuredSelector';

export type ActionType = 
  | 'tap' 
  | 'doubleTap' 
  | 'longPress'
  | 'swipe' 
  | 'type' 
  | 'wait' 
  | 'back'
  | 'keyevent';

export type StrategyKind = 'intelligent' | 'standard' | 'absolute' | 'custom';
export type StepRunMode = 'match-only' | 'execute-step';

export interface Bounds { 
  left: number; 
  top: number; 
  right: number; 
  bottom: number; 
}

export interface Offset { 
  x: number; 
  y: number; 
}

export interface RetryPolicy { 
  max: number; 
  interval_ms: number; 
}

export interface VerifySpec {
  type: 'exists' | 'text' | 'gone';
  timeout_ms: number;
  expected_text?: string;
}

export interface BaseStep {
  step_id: string;
  selector?: string;                 // element_element_63 / XPath 等（兼容旧版）
  structured_selector?: StructuredSelector; // 🆕 结构化选择器对象
  selector_preferred?: boolean;      // 选择器优先
  bounds?: Bounds;                   // 兜底坐标
  fallback_to_bounds?: boolean;      // 打开才会用坐标兜底
  // 🛡️ 安全与质量控制
  require_uniqueness?: boolean;      // 强制唯一性约束
  min_confidence?: number;           // 最低置信度阈值 (0.0-1.0)
  forbid_fullscreen_or_container?: boolean; // 禁止整屏/容器节点
  revalidate?: "device_required" | "cache_ok" | "auto"; // 缓存策略
  retry?: RetryPolicy;
  verify_after?: VerifySpec;         // 执行后验证（可选）
}

export type ActionPayload =
  | { action: 'tap' | 'doubleTap' | 'longPress'; press_ms?: number; offset?: Offset }
  | { action: 'swipe'; direction: 'up'|'down'|'left'|'right'; distance_dp?: number; duration_ms?: number; start?: 'center'|'edge'|'custom'; start_offset?: Offset }
  | { action: 'swipe'; start_x: number; start_y: number; end_x: number; end_y: number; duration: number } // 🎯 【关键修复】坐标滑动
  | { action: 'type'; text: string; secure?: boolean; clear?: boolean; submit?: boolean }
  | { action: 'wait'; duration_ms: number }
  | { action: 'back' }
  | { action: 'keyevent'; key_code: number };

export type StepPayload = BaseStep & ActionPayload;

export interface RunStepRequestV2 {
  device_id: string;
  mode: StepRunMode;                 // 'match-only' or 'execute-step'
  strategy: StrategyKind;            // ✅ 顶层必须携带
  step: StepPayload;
}

export interface MatchCandidate {
  id: string;
  score: number;           // 算法匹配分（0~1）
  confidence: number;      // 置信度（0~1）
  bounds: Bounds;
  text?: string;
  class_name?: string;
  package_name?: string;
}

export interface RunStepResponseV2 {
  ok: boolean;
  message: string;
  matched?: MatchCandidate;     // match-only 返回它；execute-step 也会带上
  executed_action?: ActionType; // execute-step 成功才有
  verify_passed?: boolean;      // 若配置 verify_after，会返回
  error_code?: string;          // 'NO_CANDIDATE' | 'INVALID_ARGS' | 'ADB_ERROR' ...
  raw_logs?: string[];          // 可选：方便你把后端关键日志抛给前端显示
}

// 错误码常量
export const ERROR_CODES = {
  INVALID_ARGS: 'INVALID_ARGS',
  NO_CANDIDATE: 'NO_CANDIDATE', 
  ADB_ERROR: 'ADB_ERROR',
  VERIFY_FAILED: 'VERIFY_FAILED',
  UNSUPPORTED_ACTION: 'UNSUPPORTED_ACTION',
} as const;

// 从新动作系统转换为 V2 协议的工具函数
export function convertToV2Request(
  deviceId: string,
  mode: StepRunMode,
  stepCard: import('./stepActions').StepCardModel,
  structuredSelector?: StructuredSelector
): RunStepRequestV2 {
  const { currentAction, common, selectorId } = stepCard;
  
  // 基础步骤信息
  const baseStep: BaseStep = {
    step_id: stepCard.id,
    selector: selectorId, // 兼容旧版内部ID
    structured_selector: structuredSelector, // 🆕 结构化选择器对象
    selector_preferred: common.useSelector,
    fallback_to_bounds: common.allowAbsolute,
    // 🛡️ 安全配置（按严格标准）
    require_uniqueness: true, // 强制唯一性
    min_confidence: 0.70, // 最低置信度阈值（提升到0.70）
    forbid_fullscreen_or_container: true, // 禁止整屏/容器节点
    revalidate: "device_required", // 要求设备重新验证
    retry: common.retries > 0 ? {
      max: common.retries,
      interval_ms: common.retryBackoffMs
    } : undefined,
    verify_after: common.verifyAfter ? {
      type: 'exists',
      timeout_ms: 3000
    } : undefined,
  };

  // 动作载荷转换
  let actionPayload: ActionPayload;
  
  switch (currentAction.type) {
    case 'tap':
    case 'doubleTap': 
    case 'longPress':
      actionPayload = {
        action: currentAction.type,
        press_ms: currentAction.params.pressDurationMs,
        offset: (currentAction.params.offsetX || currentAction.params.offsetY) ? {
          x: currentAction.params.offsetX || 0,
          y: currentAction.params.offsetY || 0
        } : undefined
      };
      break;
      
    case 'swipe':
      actionPayload = {
        action: 'swipe',
        direction: currentAction.params.direction,
        distance_dp: Math.round((currentAction.params.distance || 0.6) * 100), // 转换为dp
        duration_ms: currentAction.params.durationMs || 250,
        start: currentAction.params.startFrom === 'element' ? 'center' : 
               currentAction.params.startFrom === 'screenCenter' ? 'center' : 'custom',
        start_offset: currentAction.params.customStart
      };
      break;
      
    case 'type':
      actionPayload = {
        action: 'type',
        text: currentAction.params.text,
        secure: currentAction.params.secure,
        clear: currentAction.params.clearBefore,
        submit: currentAction.params.keyboardEnter
      };
      break;
      
    case 'wait':
      actionPayload = {
        action: 'wait',
        duration_ms: currentAction.params.waitMs || 500
      };
      break;
      
    case 'back':
      actionPayload = {
        action: 'back'
      };
      break;
      
    case 'keyevent':
      actionPayload = {
        action: 'keyevent',
        key_code: currentAction.params.keyCode || 4 // 默认返回键
      };
      break;
      
    default:
      const exhaustiveCheck: never = currentAction;
      throw new Error(`Unsupported action type: ${(exhaustiveCheck as StepActionParams).type}`);
  }

  // 合并步骤载荷
  const stepPayload: StepPayload = { ...baseStep, ...actionPayload };

  return {
    device_id: deviceId,
    mode,
    strategy: 'intelligent', // 默认智能策略
    step: stepPayload
  };
}