// src/pages/SmartScriptBuilderPage/helpers/scroll-executor.ts
// module: smart-script-builder | layer: helpers | role: 滚动步骤执行器
// summary: 处理滚动步骤的完整参数（方向、距离、次数、间隔等），支持V2引擎

import { invoke } from "@tauri-apps/api/core";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";

/**
 * 滚动参数接口
 */
export interface ScrollParams {
  /** 滚动方向: up/down/left/right */
  direction: "up" | "down" | "left" | "right";
  /** 滚动距离（像素）*/
  distance: number;
  /** 滑动时长（毫秒）*/
  duration: number;
  /** 执行次数 */
  repeat_count: number;
  /** 是否在每次执行间隔等待 */
  wait_between: boolean;
  /** 间隔等待时长（毫秒）*/
  wait_duration?: number;
}

/**
 * 设备屏幕信息
 */
interface DeviceScreen {
  width: number;
  height: number;
}

/**
 * 滑动坐标计算结果
 */
interface SwipeCoordinates {
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
}

/**
 * 从步骤参数中提取滚动配置
 */
export function extractScrollParams(step: ExtendedSmartScriptStep): ScrollParams {
  const params = step.parameters || {};
  
  return {
    direction: (params.direction as ScrollParams["direction"]) || "down",
    distance: (params.distance as number) || 600,
    duration: (params.duration as number) || 300,
    repeat_count: (params.repeat_count as number) || 1,
    wait_between: (params.wait_between as boolean) || false,
    wait_duration: (params.wait_duration as number) || 500,
  };
}

/**
 * 根据方向和距离计算滑动坐标
 * 
 * @param direction 滚动方向
 * @param distance 滚动距离（像素）
 * @param screen 屏幕尺寸
 * @returns 起止坐标
 */
export function calculateSwipeCoordinates(
  direction: ScrollParams["direction"],
  distance: number,
  screen: DeviceScreen
): SwipeCoordinates {
  const { width, height } = screen;
  const centerX = width / 2;
  const centerY = height / 2;
  
  switch (direction) {
    case "down":
      // 向下滚动：手指从下往上滑
      return {
        start_x: centerX,
        start_y: height * 0.7,
        end_x: centerX,
        end_y: height * 0.7 - distance,
      };
      
    case "up":
      // 向上滚动：手指从上往下滑
      return {
        start_x: centerX,
        start_y: height * 0.3,
        end_x: centerX,
        end_y: height * 0.3 + distance,
      };
      
    case "left":
      // 向左滚动：手指从左往右滑
      return {
        start_x: width * 0.2,
        start_y: centerY,
        end_x: width * 0.2 + distance,
        end_y: centerY,
      };
      
    case "right":
      // 向右滚动：手指从右往左滑
      return {
        start_x: width * 0.8,
        start_y: centerY,
        end_x: width * 0.8 - distance,
        end_y: centerY,
      };
      
    default:
      // 默认向下
      return {
        start_x: centerX,
        start_y: height * 0.7,
        end_x: centerX,
        end_y: height * 0.7 - distance,
      };
  }
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
 * 执行单次滚动操作（调用V2引擎）
 * 
 * @param deviceId 设备ID
 * @param stepId 步骤ID
 * @param stepName 步骤名称
 * @param coords 滑动坐标
 * @param duration 滑动时长
 * @returns 执行结果
 */
async function executeSingleSwipe(
  deviceId: string,
  stepId: string,
  stepName: string,
  coords: SwipeCoordinates,
  duration: number
): Promise<V2ExecutionResult> {
  console.log(
    `📜 [V2滚动-单次] 坐标: (${coords.start_x},${coords.start_y}) → (${coords.end_x},${coords.end_y}), 时长:${duration}ms`
  );
  
  return await invoke("run_step_v2", {
    request: {
      device_id: deviceId,
      mode: "execute-step",
      strategy: "intelligent",
      step: {
        step_id: stepId,
        step_name: stepName,
        action: "swipe",
        start_x: coords.start_x,
        start_y: coords.start_y,
        end_x: coords.end_x,
        end_y: coords.end_y,
        duration_ms: duration,
      },
    },
  });
}

/**
 * 执行完整的滚动步骤（支持多次执行和间隔等待）
 * 
 * @param deviceId 设备ID
 * @param step 步骤对象
 * @param screen 屏幕尺寸（可选，默认1080x2340）
 * @returns 执行结果
 */
export async function executeScrollStep(
  deviceId: string,
  step: ExtendedSmartScriptStep,
  screen: DeviceScreen = { width: 1080, height: 2340 }
): Promise<{ success: boolean; message: string; executedCount: number }> {
  // 提取参数
  const scrollParams = extractScrollParams(step);
  
  console.log(`📜 [V2滚动] 完整参数:`, {
    direction: scrollParams.direction,
    distance: scrollParams.distance,
    duration: scrollParams.duration,
    repeat_count: scrollParams.repeat_count,
    wait_between: scrollParams.wait_between,
    wait_duration: scrollParams.wait_duration,
  });
  
  // 计算滑动坐标
  const coords = calculateSwipeCoordinates(
    scrollParams.direction,
    scrollParams.distance,
    screen
  );
  
  // 执行多次滚动
  let executedCount = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < scrollParams.repeat_count; i++) {
    try {
      console.log(
        `📜 [V2滚动] 执行第 ${i + 1}/${scrollParams.repeat_count} 次滚动...`
      );
      
      // 执行滚动
      await executeSingleSwipe(
        deviceId,
        step.id,
        step.name,
        coords,
        scrollParams.duration
      );
      
      executedCount++;
      console.log(`✅ [V2滚动] 第 ${i + 1} 次滚动成功`);
      
      // 间隔等待（最后一次不等待）
      if (
        scrollParams.wait_between &&
        i < scrollParams.repeat_count - 1 &&
        scrollParams.wait_duration
      ) {
        console.log(
          `⏱️ [V2滚动] 等待 ${scrollParams.wait_duration}ms 后继续...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, scrollParams.wait_duration)
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ [V2滚动] 第 ${i + 1} 次滚动失败:`, errorMsg);
      errors.push(`第${i + 1}次: ${errorMsg}`);
      
      // 如果失败，可以选择继续或中断
      // 这里选择中断
      break;
    }
  }
  
  // 返回结果
  if (executedCount === scrollParams.repeat_count) {
    return {
      success: true,
      message: `✅ 滚动执行成功（${executedCount}/${scrollParams.repeat_count}次）`,
      executedCount,
    };
  } else if (executedCount > 0) {
    return {
      success: false,
      message: `⚠️ 部分成功（${executedCount}/${scrollParams.repeat_count}次）: ${errors.join(", ")}`,
      executedCount,
    };
  } else {
    return {
      success: false,
      message: `❌ 滚动失败: ${errors.join(", ")}`,
      executedCount: 0,
    };
  }
}

/**
 * 方向箭头映射（用于日志显示）
 */
export const DIRECTION_ARROWS: Record<ScrollParams["direction"], string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

/**
 * 方向中文映射（用于日志显示）
 */
export const DIRECTION_NAMES: Record<ScrollParams["direction"], string> = {
  up: "向上",
  down: "向下",
  left: "向左",
  right: "向右",
};
