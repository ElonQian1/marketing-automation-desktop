// src/pages/SmartScriptBuilderPage/helpers/step-type-router.ts
// module: smart-script-builder | layer: helpers | role: 步骤类型路由器
// summary: 根据步骤类型路由到正确的执行器（滚动/按键/长按/输入/点击）

import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import { executeScrollStep } from "./scroll-executor";
import { executeKeyEventStep } from "./keyevent-executor";
import { executeLongPress } from "./longpress-executor";
import { executeInput } from "./input-executor";
import { 
  inferParametersForStepCard, 
  stepCardNeedsInference 
} from "../../../modules/structural-matching";
import { useStepCardStore } from "../../../store/stepcards";

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
 * 这些步骤应该被后端预处理器展开，前端直接跳过即可
 */
async function executeLoopControl(step: ExtendedSmartScriptStep): Promise<StepExecutionResult> {
  console.log(`🔄 [循环控制] 步骤 ${step.step_type} 已被后端预处理器展开，前端跳过`);
  
  return {
    success: true,
    message: `✅ 循环控制标记 ${step.step_type} 已处理（后端展开）`,
    executorType: "loop_control",
  };
}

/**
 * 执行点击步骤（使用V3引擎）
 * 集成运行时参数推理系统
 */
async function executeClick(
  deviceId: string,
  step: ExtendedSmartScriptStep,
  executeV3Fn: (step: ExtendedSmartScriptStep) => Promise<unknown>
): Promise<StepExecutionResult> {
  console.log(`🎯 [V3点击] 使用V3引擎执行智能点击`);
  
  try {
    // 🧠 Phase 2: 运行时参数推理集成
    const enhancedStep = await ensureStructuralMatchParameters(step);
    
    // 使用增强后的步骤执行
    await executeV3Fn(enhancedStep);
    
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
 * 确保步骤具有结构匹配参数
 * 如果缺少参数，则使用推理系统自动填充
 * 
 * @param step 原始步骤
 * @returns 增强后的步骤（含结构匹配参数）
 */
async function ensureStructuralMatchParameters(step: ExtendedSmartScriptStep): Promise<ExtendedSmartScriptStep> {
  try {
    // 获取步骤卡片（通过步骤ID查找）
    const stepCardStore = useStepCardStore.getState();
    const stepCard = stepCardStore.byStepId[step.id] ? 
      stepCardStore.cards[stepCardStore.byStepId[step.id]] : null;

    if (!stepCard) {
      console.log(`🔍 [参数推理] 步骤 ${step.id} 没有对应的步骤卡片，跳过推理`);
      return step;
    }

    // 检查是否需要推理
    if (!stepCardNeedsInference(stepCard)) {
      console.log(`🔍 [参数推理] 步骤 ${step.id} 无需推理`);
      return step;
    }

    console.log(`🧠 [参数推理] 开始为步骤 ${step.id} 推理结构匹配参数...`);
    
    // 执行推理
    const inferenceResult = await inferParametersForStepCard(stepCard);
    
    if (inferenceResult.status === 'completed' && inferenceResult.plan) {
      console.log(`✅ [参数推理] 步骤 ${step.id} 推理完成，耗时 ${inferenceResult.inferenceTime}ms`);
      
      // 将推理结果添加到步骤参数中
      const enhancedStep: ExtendedSmartScriptStep = {
        ...step,
        parameters: {
          ...step.parameters,
          // 添加结构匹配参数
          structuralMatchPlan: inferenceResult.plan,
          // 标记参数来源
          _parameterSource: 'runtime_inference',
          _inferenceMetadata: inferenceResult.metadata,
        }
      };

      return enhancedStep;
    } else {
      console.warn(`⚠️ [参数推理] 步骤 ${step.id} 推理失败: ${inferenceResult.error || '未知错误'}`);
      return step;
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [参数推理] 步骤 ${step.id} 推理过程出错: ${errorMsg}`);
    // 推理失败时返回原始步骤，不阻断执行
    return step;
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
