// src/pages/SmartScriptBuilderPage/helpers/input-executor.ts
// module: smart-script-builder | layer: helpers | role: 文本输入执行器
// summary: 处理文本输入步骤，支持V2引擎

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
 * 输入参数
 */
export interface InputParams {
  /** 要输入的文本 */
  text: string;
  /** 目标元素XPath */
  xpath?: string;
  /** 目标文本（用于定位输入框）*/
  targetText?: string;
  /** 是否清空原有文本 */
  clear_before: boolean;
}

/**
 * 从步骤中提取输入参数
 */
export function extractInputParams(step: ExtendedSmartScriptStep): InputParams {
  const params = step.parameters || {};
  
  return {
    text: (params.input_text as string) || (params.text as string) || "",
    xpath: (params.selected_xpath as string) || (params.xpath as string),
    targetText: (params.targetText as string) || (params.placeholder as string),
    clear_before: (params.clear_before as boolean) ?? true, // 默认清空
  };
}

/**
 * 执行文本输入（通过V2引擎）
 */
export async function executeInput(
  deviceId: string,
  step: ExtendedSmartScriptStep
): Promise<{ success: boolean; message: string }> {
  const inputParams = extractInputParams(step);
  
  if (!inputParams.text) {
    return {
      success: false,
      message: "❌ 输入文本为空",
    };
  }
  
  console.log(`⌨️ [V2输入] 输入文本: "${inputParams.text}"`);
  console.log(`⌨️ [V2输入] 清空原文本: ${inputParams.clear_before}`);
  
  try {
    const result = await invoke("plugin:intelligent_analysis|run_step_v2", {
      request: {
        device_id: deviceId,
        mode: "execute-step",
        strategy: "intelligent",
        step: {
          step_id: step.id,
          step_name: step.name,
          action: "input",
          input_text: inputParams.text,
          xpath: inputParams.xpath,
          target_text: inputParams.targetText,
          clear_before: inputParams.clear_before,
        },
      },
    }) as V2ExecutionResult;
    
    if (result.ok) {
      return {
        success: true,
        message: `✅ 输入文本 "${inputParams.text}" 成功`,
      };
    } else {
      return {
        success: false,
        message: `❌ 输入文本失败: ${result.message}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `❌ 输入文本异常: ${errorMsg}`,
    };
  }
}
