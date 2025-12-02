// src/pages/SmartScriptBuilderPage/helpers/keyevent-executor.ts
// module: smart-script-builder | layer: helpers | role: 系统按键执行器
// summary: 处理系统按键步骤（返回、首页、菜单等）和边缘手势，支持V2引擎

import { invoke } from "@tauri-apps/api/core";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";

/**
 * 系统按键代码映射
 */
export const KEYEVENT_CODES: Record<string, number> = {
  back: 4,           // 返回键
  home: 3,           // 首页键
  app: 187,          // 最近任务（App Switcher）
  menu: 82,          // 菜单键
  power: 26,         // 电源键
  lock: 26,          // 锁屏（同电源键）
  volume_up: 24,     // 音量+
  volume_down: 25,   // 音量-
  enter: 66,         // 回车
  delete: 67,        // 删除
  tab: 61,           // Tab
  space: 62,         // 空格
};

/**
 * 系统按键名称映射
 */
export const KEYEVENT_NAMES: Record<string, string> = {
  back: "返回键",
  home: "首页键",
  app: "最近任务",
  menu: "菜单键",
  power: "电源键",
  lock: "锁屏",
  volume_up: "音量+",
  volume_down: "音量-",
  enter: "回车",
  delete: "删除",
  tab: "Tab",
  space: "空格",
};

/**
 * 边缘返回手势配置
 */
interface EdgeGestureConfig {
  /** 手势类型 */
  type: "edgeBackLeft" | "edgeBackRight" | "edgeCustom";
  /** 起始X坐标 */
  start_x: number;
  /** 起始Y坐标 */
  start_y: number;
  /** 结束X坐标 */
  end_x: number;
  /** 结束Y坐标 */
  end_y: number;
  /** 滑动时长 */
  duration: number;
}

/**
 * V2引擎执行结果
 */
interface V2ExecutionResult {
  ok: boolean;
  message: string;
  [key: string]: unknown;
}

/**
 * 从步骤参数中提取按键代码
 */
export function extractKeyEventCode(step: ExtendedSmartScriptStep): number {
  const params = step.parameters || {};
  
  // 🎯 优先使用 code（新系统按键模板使用的参数名）
  if (params.code !== undefined) {
    return params.code as number;
  }
  
  // 其次使用 key_code
  if (params.key_code !== undefined) {
    return params.key_code as number;
  }
  
  // 再使用 keyCode
  if (params.keyCode !== undefined) {
    return params.keyCode as number;
  }
  
  // 再尝试从 key_name 映射
  if (params.key_name) {
    const keyName = params.key_name as string;
    return KEYEVENT_CODES[keyName] || 4; // 默认返回键
  }
  
  // 最后尝试从 keyName 映射
  if (params.keyName) {
    const keyName = params.keyName as string;
    return KEYEVENT_CODES[keyName] || 4;
  }
  
  // 默认返回键
  return 4;
}

/**
 * 从步骤名称中提取按键信息
 */
export function parseKeyEventFromName(stepName: string): { code: number; name: string } | null {
  const lowerName = stepName.toLowerCase();
  
  // 尝试匹配已知按键
  for (const [key, code] of Object.entries(KEYEVENT_CODES)) {
    const keyName = KEYEVENT_NAMES[key];
    if (lowerName.includes(keyName) || lowerName.includes(key)) {
      return { code, name: keyName };
    }
  }
  
  // 尝试匹配 "code=数字" 格式
  const codeMatch = stepName.match(/code[=\s]*(\d+)/i);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], 10);
    return { code, name: `按键代码${code}` };
  }
  
  return null;
}

/**
 * 判断是否为边缘返回手势
 */
export function isEdgeGesture(step: ExtendedSmartScriptStep): boolean {
  const params = step.parameters || {};
  return !!(params.gesture_type || params.edgeGesture);
}

/**
 * 提取边缘手势配置
 */
export function extractEdgeGestureConfig(
  step: ExtendedSmartScriptStep,
  screenWidth: number = 1080,
  screenHeight: number = 2340
): EdgeGestureConfig {
  const params = step.parameters || {};
  const gestureType = (params.gesture_type || params.edgeGesture) as string;
  
  const centerY = screenHeight / 2;
  
  switch (gestureType) {
    case "edgeBackLeft":
      // 左边缘向右滑（返回）
      return {
        type: "edgeBackLeft",
        start_x: 10,
        start_y: centerY,
        end_x: screenWidth * 0.4,
        end_y: centerY,
        duration: 200,
      };
      
    case "edgeBackRight":
      // 右边缘向左滑（返回）
      return {
        type: "edgeBackRight",
        start_x: screenWidth - 10,
        start_y: centerY,
        end_x: screenWidth * 0.6,
        end_y: centerY,
        duration: 200,
      };
      
    case "edgeCustom":
      // 自定义边缘手势
      return {
        type: "edgeCustom",
        start_x: (params.start_x as number) || 10,
        start_y: (params.start_y as number) || centerY,
        end_x: (params.end_x as number) || screenWidth * 0.4,
        end_y: (params.end_y as number) || centerY,
        duration: (params.duration as number) || 200,
      };
      
    default:
      // 默认左边缘返回
      return {
        type: "edgeBackLeft",
        start_x: 10,
        start_y: centerY,
        end_x: screenWidth * 0.4,
        end_y: centerY,
        duration: 200,
      };
  }
}

/**
 * 执行系统按键（通过V2引擎）
 */
export async function executeKeyEvent(
  deviceId: string,
  step: ExtendedSmartScriptStep
): Promise<{ success: boolean; message: string }> {
  // 提取按键代码
  let keyCode = extractKeyEventCode(step);
  let keyName = "";
  
  // 如果参数中没有，尝试从步骤名称解析
  if (!step.parameters?.key_code && !step.parameters?.keyCode) {
    const parsed = parseKeyEventFromName(step.name);
    if (parsed) {
      keyCode = parsed.code;
      keyName = parsed.name;
    }
  } else {
    // 查找按键名称
    for (const [key, code] of Object.entries(KEYEVENT_CODES)) {
      if (code === keyCode) {
        keyName = KEYEVENT_NAMES[key];
        break;
      }
    }
  }
  
  console.log(`🔑 [V2按键] 执行系统按键: ${keyName || `code=${keyCode}`}`);
  
  try {
    const result = await invoke("plugin:intelligent_analysis|run_step_v2", {
      request: {
        device_id: deviceId,
        mode: "execute-step",
        strategy: "intelligent",
        step: {
          step_id: step.id,
          step_name: step.name,
          action: "keyevent",
          key_code: keyCode,
        },
      },
    }) as V2ExecutionResult;
    
    if (result.ok) {
      return {
        success: true,
        message: `✅ ${keyName || `按键${keyCode}`} 执行成功`,
      };
    } else {
      return {
        success: false,
        message: `❌ ${keyName || `按键${keyCode}`} 执行失败: ${result.message}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ 按键执行异常: ${errorMsg}`,
    };
  }
}

/**
 * 执行边缘返回手势（通过V2引擎的swipe）
 */
export async function executeEdgeGesture(
  deviceId: string,
  step: ExtendedSmartScriptStep,
  screenWidth: number = 1080,
  screenHeight: number = 2340
): Promise<{ success: boolean; message: string }> {
  const config = extractEdgeGestureConfig(step, screenWidth, screenHeight);
  
  const gestureName = config.type === "edgeBackLeft" ? "左边缘返回" :
                     config.type === "edgeBackRight" ? "右边缘返回" :
                     "自定义边缘手势";
  
  console.log(`📱 [V2手势] 执行边缘手势: ${gestureName}`);
  console.log(`📱 [V2手势] 坐标: (${config.start_x},${config.start_y}) → (${config.end_x},${config.end_y})`);
  
  try {
    const result = await invoke("plugin:intelligent_analysis|run_step_v2", {
      request: {
        device_id: deviceId,
        mode: "execute-step",
        strategy: "intelligent",
        step: {
          step_id: step.id,
          step_name: step.name,
          action: "swipe",
          start_x: config.start_x,
          start_y: config.start_y,
          end_x: config.end_x,
          end_y: config.end_y,
          duration_ms: config.duration,
        },
      },
    }) as V2ExecutionResult;
    
    if (result.ok) {
      return {
        success: true,
        message: `✅ ${gestureName} 执行成功`,
      };
    } else {
      return {
        success: false,
        message: `❌ ${gestureName} 执行失败: ${result.message}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ 边缘手势执行异常: ${errorMsg}`,
    };
  }
}

/**
 * 统一的按键/手势执行入口
 */
export async function executeKeyEventStep(
  deviceId: string,
  step: ExtendedSmartScriptStep,
  screenWidth?: number,
  screenHeight?: number
): Promise<{ success: boolean; message: string }> {
  // 判断是边缘手势还是按键
  if (isEdgeGesture(step)) {
    return executeEdgeGesture(deviceId, step, screenWidth, screenHeight);
  } else {
    return executeKeyEvent(deviceId, step);
  }
}
