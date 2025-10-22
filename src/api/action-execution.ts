// src/api/action-execution.ts
// module: api | layer: api | role: 操作执行API
// summary: 前端调用后端操作执行的API封装

import { invoke } from '@tauri-apps/api/tauri';
import type { ActionType } from '../types/action-types';

// 操作执行结果
export interface ActionResult {
  success: boolean;
  message: string;
  duration: number;
  data?: any;
}

// 导出执行结果类型别名
export type ActionExecutionResult = ActionResult;

// 操作推荐结果
export interface ActionRecommendation {
  action: ActionType;
  confidence: number;
  reason: string;
  alternatives: Array<{
    action: ActionType;
    confidence: number;
    reason: string;
  }>;
  element_index?: number; // 批量推荐时使用
}

/**
 * 执行单个操作
 */
export const executeAction = async (
  deviceId: string,
  action: ActionType,
  elementBounds?: [number, number, number, number], // [left, top, right, bottom]
  timeout?: number
): Promise<ActionResult> => {
  try {
    console.log('🎯 [executeAction] 执行操作:', {
      deviceId,
      actionType: action.type,
      params: action.params,
      elementBounds,
      timeout
    });

    const result = await invoke<ActionResult>('execute_action_command', {
      deviceId,
      action,
      elementBounds,
      timeout: timeout || 10000
    });

    console.log('✅ [executeAction] 操作执行完成:', result);
    return result;
  } catch (error) {
    console.error('❌ [executeAction] 操作执行失败:', error);
    throw error;
  }
};

/**
 * 推荐单个元素的操作类型
 */
export const recommendAction = async (
  xmlElement: string
): Promise<ActionRecommendation> => {
  try {
    console.log('🧠 [recommendAction] 请求操作推荐');

    const result = await invoke<ActionRecommendation>('recommend_action_command', {
      xmlElement
    });

    console.log('💡 [recommendAction] 推荐结果:', result);
    return result;
  } catch (error) {
    console.error('❌ [recommendAction] 推荐失败:', error);
    throw error;
  }
};

/**
 * 批量推荐多个元素的操作类型
 */
export const batchRecommendActions = async (
  xmlElements: string[]
): Promise<ActionRecommendation[]> => {
  try {
    console.log('🧠 [batchRecommendActions] 批量推荐请求，元素数量:', xmlElements.length);

    const results = await invoke<ActionRecommendation[]>('batch_recommend_actions_command', {
      xmlElements
    });

    console.log('💡 [batchRecommendActions] 批量推荐完成:', results.length);
    return results;
  } catch (error) {
    console.error('❌ [batchRecommendActions] 批量推荐失败:', error);
    throw error;
  }
};

/**
 * 验证操作参数
 */
export const validateActionParams = async (
  action: ActionType
): Promise<boolean> => {
  try {
    console.log('✅ [validateActionParams] 验证参数:', action);

    const result = await invoke<boolean>('validate_action_params_command', {
      action
    });

    return result;
  } catch (error) {
    console.error('❌ [validateActionParams] 验证失败:', error);
    // 验证失败时返回false而不是抛出错误
    return false;
  }
};

// 默认导出所有API函数
export default {
  executeAction,
  recommendAction,
  batchRecommendActions,
  validateActionParams
};