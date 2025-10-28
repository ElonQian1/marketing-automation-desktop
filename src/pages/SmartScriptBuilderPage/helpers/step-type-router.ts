// src/pages/SmartScriptBuilderPage/helpers/step-type-router.ts
// module: smart-script-builder | layer: helpers | role: 步骤类型路由器
// summary: 根据步骤类型路由到正确的执行器（滚动/按键/长按/输入/点击）

import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import { executeScrollStep } from "./scroll-executor";
import { executeKeyEventStep } from "./keyevent-executor";
import { executeLongPress } from "./longpress-executor";
import { executeInput } from "./input-executor";

/**
 * 步骤执行结果
 */
export interface StepExecutionResult {
  success: boolean;
  message: string;
  executorType: string;
}

/**
 * 设备屏幕信息
 */
export interface DeviceScreen {
  width: number;
  height: number;
}

/**
 * 识别步骤类型
 */
export function identifyStepType(step: ExtendedSmartScriptStep): string {
  const stepType = step.step_type?.toLowerCase();
  const stepName = step.name?.toLowerCase() || "";
  
  // 1. 滚动类型
  if (
    stepType === "smart_scroll" ||
    stepType === "swipe" ||
    stepName.includes("滚动") ||
    stepName.includes("滑动")
  ) {
    return "scroll";
  }
  
  // 2. 系统按键类型
  if (
    stepType === "keyevent" ||
    stepType === "system_key" ||
    stepName.includes("返回键") ||
    stepName.includes("首页键") ||
    stepName.includes("系统按键") ||
    stepName.includes("按键") ||
    stepName.includes("边缘") ||
    step.parameters?.key_code !== undefined ||
    step.parameters?.keyCode !== undefined ||
    step.parameters?.gesture_type !== undefined
  ) {
    return "keyevent";
  }
  
  // 3. 长按类型
  if (
    stepType === "long_press" ||
    stepType === "longpress" ||
    stepName.includes("长按")
  ) {
    return "long_press";
  }
  
  // 4. 输入文本类型
  if (
    stepType === "input" ||
    stepType === "type" ||
    stepName.includes("输入") ||
    stepName.includes("填写") ||
    step.parameters?.input_text !== undefined
  ) {
    return "input";
  }
  
  // 5. 等待类型
  if (
    stepType === "wait" ||
    stepType === "delay" ||
    stepName.includes("等待") ||
    stepName.includes("延时")
  ) {
    return "wait";
  }
  
  // 6. 默认为点击类型（使用V3智能匹配）
  return "click";
}

/**
 * 执行等待步骤
 */
async function executeWait(step: ExtendedSmartScriptStep): Promise<StepExecutionResult> {
  const duration = (step.parameters?.duration as number) || 
                  (step.parameters?.wait_duration as number) || 
                  1000;
  
  console.log(`⏱️ [等待] 等待 ${duration}ms...`);
  
  await new Promise(resolve => setTimeout(resolve, duration));
  
  return {
    success: true,
    message: `✅ 等待 ${duration}ms 完成`,
    executorType: "wait",
  };
}

/**
 * 执行点击步骤（使用V3引擎）
 */
async function executeClick(
  deviceId: string,
  step: ExtendedSmartScriptStep,
  executeV3Fn: (step: ExtendedSmartScriptStep) => Promise<unknown>
): Promise<StepExecutionResult> {
  console.log(`🎯 [V3点击] 使用V3引擎执行智能点击`);
  
  try {
    await executeV3Fn(step);
    
    return {
      success: true,
      message: "✅ V3点击执行成功",
      executorType: "click_v3",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ V3点击失败: ${errorMsg}`,
      executorType: "click_v3",
    };
  }
}

/**
 * 路由并执行步骤
 * 
 * @param deviceId 设备ID
 * @param step 步骤对象
 * @param executeV3Fn V3引擎执行函数（用于点击步骤）
 * @param screen 屏幕尺寸
 * @returns 执行结果
 */
export async function routeAndExecuteStep(
  deviceId: string,
  step: ExtendedSmartScriptStep,
  executeV3Fn: (step: ExtendedSmartScriptStep) => Promise<unknown>,
  screen: DeviceScreen = { width: 1080, height: 2340 }
): Promise<StepExecutionResult> {
  // 识别步骤类型
  const stepType = identifyStepType(step);
  
  console.log(`🔍 [路由器] 步骤类型识别: ${stepType} (step_type=${step.step_type}, name=${step.name})`);
  
  // 根据类型路由到对应执行器
  switch (stepType) {
    case "scroll": {
      const result = await executeScrollStep(deviceId, step, screen);
      return {
        success: result.success,
        message: result.message,
        executorType: "scroll_v2",
      };
    }
    
    case "keyevent": {
      const result = await executeKeyEventStep(deviceId, step, screen.width, screen.height);
      return {
        success: result.success,
        message: result.message,
        executorType: "keyevent_v2",
      };
    }
    
    case "long_press": {
      const result = await executeLongPress(deviceId, step);
      return {
        success: result.success,
        message: result.message,
        executorType: "longpress_v2",
      };
    }
    
    case "input": {
      const result = await executeInput(deviceId, step);
      return {
        success: result.success,
        message: result.message,
        executorType: "input_v2",
      };
    }
    
    case "wait": {
      return await executeWait(step);
    }
    
    case "click":
    default: {
      return await executeClick(deviceId, step, executeV3Fn);
    }
  }
}

/**
 * 步骤类型中文名映射
 */
export const STEP_TYPE_NAMES: Record<string, string> = {
  scroll: "滚动",
  keyevent: "系统按键",
  long_press: "长按",
  input: "输入文本",
  wait: "等待",
  click: "点击",
};

/**
 * 步骤类型图标映射
 */
export const STEP_TYPE_ICONS: Record<string, string> = {
  scroll: "📜",
  keyevent: "🔑",
  long_press: "👆",
  input: "⌨️",
  wait: "⏱️",
  click: "🎯",
};
