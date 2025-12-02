// src/pages/SmartScriptBuilderPage/helpers/longpress-executor.ts
// module: smart-script-builder | layer: helpers | role: 长按执行器
// summary: 处理长按步骤，支持V2引擎

import { invoke } from "@tauri-apps/api/core";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";

/**
 * V2引擎执行结果
 */
interface V2ExecutionResult {
  ok: boolean;
  message: string;
  [key: string]: unknown;
}

/**
 * 长按参数
 */
export interface LongPressParams {
  /** 长按时长（毫秒）*/
  duration: number;
  /** 目标元素XPath */
  xpath?: string;
  /** 目标文本 */
  targetText?: string;
  /** 坐标X（如果有）*/
  x?: number;
  /** 坐标Y（如果有）*/
  y?: number;
}

/**
 * 从步骤中提取长按参数
 */
export function extractLongPressParams(step: ExtendedSmartScriptStep): LongPressParams {
  const params = step.parameters || {};
  
  return {
    duration: (params.duration as number) || (params.press_duration as number) || 2000,
    xpath: (params.selected_xpath as string) || (params.xpath as string),
    targetText: (params.targetText as string) || (params.text as string),
    x: params.x as number | undefined,
    y: params.y as number | undefined,
  };
}

/**
 * 执行长按操作（通过V2引擎）
 */
export async function executeLongPress(
  deviceId: string,
  step: ExtendedSmartScriptStep
): Promise<{ success: boolean; message: string }> {
  const lpParams = extractLongPressParams(step);
  
  console.log(`👆 [V2长按] 执行长按操作: 时长=${lpParams.duration}ms`);
  
  // 如果有坐标，直接长按坐标
  if (lpParams.x !== undefined && lpParams.y !== undefined) {
    console.log(`👆 [V2长按] 坐标模式: (${lpParams.x}, ${lpParams.y})`);
    
    try {
      const result = await invoke("plugin:intelligent_analysis|run_step_v2", {
        request: {
          device_id: deviceId,
          mode: "execute-step",
          strategy: "intelligent",
          step: {
            step_id: step.id,
            step_name: step.name,
            action: "long_press",
            x: lpParams.x,
            y: lpParams.y,
            duration_ms: lpParams.duration,
          },
        },
      }) as V2ExecutionResult;
      
      if (result.ok) {
        return {
          success: true,
          message: `✅ 长按坐标(${lpParams.x},${lpParams.y}) 执行成功`,
        };
      } else {
        return {
          success: false,
          message: `❌ 长按执行失败: ${result.message}`,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `❌ 长按执行异常: ${errorMsg}`,
      };
    }
  }
  
  // 否则需要先找元素再长按
  console.log(`👆 [V2长按] 元素模式: xpath=${lpParams.xpath || "auto"}, text=${lpParams.targetText || "auto"}`);
  
  try {
    const result = await invoke("plugin:intelligent_analysis|run_step_v2", {
      request: {
        device_id: deviceId,
        mode: "execute-step",
        strategy: "intelligent",
        step: {
          step_id: step.id,
          step_name: step.name,
          action: "long_press",
          xpath: lpParams.xpath,
          text: lpParams.targetText,
          duration_ms: lpParams.duration,
        },
      },
    }) as V2ExecutionResult;
    
    if (result.ok) {
      return {
        success: true,
        message: `✅ 长按元素 执行成功`,
      };
    } else {
      return {
        success: false,
        message: `❌ 长按执行失败: ${result.message}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ 长按执行异常: ${errorMsg}`,
    };
  }
}
