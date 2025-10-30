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
  // 🔧 新增：循环执行特殊标记
  needsLoopExecution?: boolean;
  loopId?: string;
  loopIterations?: number;
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
 * 🔧 修复：优先使用 step_type 精确匹配，避免被名称误导
 */
export function identifyStepType(step: ExtendedSmartScriptStep): string {
  const stepType = step.step_type?.toLowerCase();
  const stepName = step.name?.toLowerCase() || "";
  
  // ✅ 优先级1：严格匹配 step_type（最可靠）
  // 0. 循环控制类型（最高优先级 - 应该被后端预处理器处理，前端直接跳过）
  if (stepType === "loop_start" || stepType === "loop_end") {
    return "loop_control";
  }
  
  // 1. 滚动类型
  if (stepType === "smart_scroll" || stepType === "swipe") {
    return "scroll";
  }
  
  // 2. 系统按键类型
  if (stepType === "keyevent" || stepType === "system_key") {
    return "keyevent";
  }
  
  // 3. 长按类型
  if (stepType === "long_press" || stepType === "longpress") {
    return "long_press";
  }
  
  // 4. 输入文本类型
  if (stepType === "input" || stepType === "type") {
    return "input";
  }
  
  // 5. 等待类型
  if (stepType === "wait" || stepType === "delay") {
    return "wait";
  }
  
  // ✅ 优先级2：参数特征判断（参数比名称更可靠）
  if (step.parameters?.key_code !== undefined || 
      step.parameters?.keyCode !== undefined || 
      step.parameters?.gesture_type !== undefined) {
    return "keyevent";
  }
  
  if (step.parameters?.input_text !== undefined) {
    return "input";
  }
  
  // ✅ 优先级3：名称辅助判断（最后手段）
  if (stepName.includes("滚动") || stepName.includes("滑动")) {
    return "scroll";
  }
  
  if (stepName.includes("返回键") || stepName.includes("首页键") || 
      stepName.includes("系统按键") || stepName.includes("按键") || 
      stepName.includes("边缘")) {
    return "keyevent";
  }
  
  if (stepName.includes("长按")) {
    return "long_press";
  }
  
  if (stepName.includes("输入") || stepName.includes("填写")) {
    return "input";
  }
  
  if (stepName.includes("等待") || stepName.includes("延时")) {
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
 * 处理循环控制步骤（loop_start/loop_end）
 * 🔧 修复：使用统一的循环执行逻辑，与循环卡片播放按钮保持一致
 */
async function executeLoopControl(step: ExtendedSmartScriptStep): Promise<StepExecutionResult> {
  console.log(`🔄 [循环控制] 检测到循环控制步骤: ${step.step_type}`);
  
  // 对于 loop_start，交给统一的循环处理逻辑
  // 对于 loop_end，标记为已处理（循环在 loop_start 时已完整执行）
  if (step.step_type === 'loop_end') {
    console.log(`✅ [循环控制] 循环结束标记已到达，循环已在开始时完整执行`);
    return {
      success: true,
      message: `✅ 循环结束标记已处理`,
      executorType: "loop_control",
    };
  }
  
  // 对于 loop_start，返回特殊标记，由上层处理器识别并调用循环执行逻辑
  console.log(`🎯 [循环控制] 检测到循环开始，需要统一循环处理`);
  return {
    success: true,
    message: `🔄 循环开始标记，需要特殊处理`,
    executorType: "loop_control",
    needsLoopExecution: true, // 特殊标记
    loopId: step.parameters?.loop_id as string || `loop_${step.id}`,
    loopIterations: step.parameters?.loop_count as number || 1,
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
    case "loop_control": {
      return await executeLoopControl(step);
    }
    
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
  loop_control: "循环控制",
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
  loop_control: "🔄",
  scroll: "📜",
  keyevent: "🔑",
  long_press: "👆",
  input: "⌨️",
  wait: "⏱️",
  click: "🎯",
};
