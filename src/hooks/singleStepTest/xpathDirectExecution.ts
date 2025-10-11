// src/hooks/singleStepTest/xpathDirectExecution.ts
// module: shared | layer: application | role: 状态钩子
// summary: React状态管理和业务逻辑封装

import { invoke } from '@tauri-apps/api/core';
import type { SmartScriptStep, SingleStepTestResult } from '../../types/smartScript';

/**
 * 直接执行 XPath 操作（一步完成匹配+执行）
 * 
 * 这个函数专门为 XPath 策略设计，避免两阶段流程：
 * - 不需要先调用 matchElementByCriteria 获取坐标
 * - 不需要前端计算坐标再发送 tap 命令
 * - 后端直接根据 XPath 表达式完成匹配和操作
 */
export async function executeXPathDirect(
  step: SmartScriptStep, 
  deviceId: string
): Promise<SingleStepTestResult> {
  console.log('🎯 XPath 直接执行模式启动');
  
  // 提取 XPath 表达式
  const stepParams = step.parameters as any;
  const matchingParams = stepParams?.matching;
  
  // 尝试从多个可能的位置提取 XPath 表达式
  let xpathExpression: string | undefined;
  
  if (matchingParams?.strategy?.includes('xpath')) {
    // 从匹配参数中提取
    xpathExpression = matchingParams.xpath || 
                     matchingParams.xpathExpression ||
                     matchingParams.values?.xpath ||
                     matchingParams.fields?.xpath;
  }
  
  // 如果没有找到，尝试从步骤参数根级别查找
  if (!xpathExpression) {
    xpathExpression = stepParams?.xpath || 
                     stepParams?.xpathExpression ||
                     stepParams?.selector;
  }
  
  if (!xpathExpression) {
    return {
      success: false,
      step_id: step.id,
      step_name: step.name,
      message: '未找到有效的 XPath 表达式',
      duration_ms: 0,
      timestamp: Date.now(),
      ui_elements: [],
      logs: ['XPath 直接执行失败：缺少 XPath 表达式'],
      error_details: '参数中未包含 xpath、xpathExpression 或 selector',
      extracted_data: {}
    };
  }
  
  // 确定操作类型
  const actionType = determineActionType(step);
  
  console.log(`📋 XPath 执行参数:`, {
    deviceId,
    xpath: xpathExpression,
    action: actionType
  });
  
  const startTime = Date.now();
  
  try {
    // 调用简化的后端命令：device_id, xpath_expr, action
    const result: string = await invoke('execute_xpath_action', {
      deviceId,
      xpathExpr: xpathExpression,
      action: actionType
    });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      step_id: step.id,
      step_name: step.name,
      message: result,
      duration_ms: duration,
      timestamp: Date.now(),
      ui_elements: [{
        text: 'XPath元素已匹配',
        bounds: '',
        class: null,
        content_desc: null
      }],
      logs: [
        `XPath 表达式: ${xpathExpression}`,
        `操作类型: ${actionType}`,
        `执行结果: ${result}`
      ],
      error_details: undefined,
      extracted_data: {
        xpath: xpathExpression,
        actionType,
        result
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      step_id: step.id,
      step_name: step.name,
      message: `XPath 直接执行失败: ${errorMessage}`,
      duration_ms: duration,
      timestamp: Date.now(),
      ui_elements: [],
      logs: [
        `XPath 表达式: ${xpathExpression}`,
        `操作类型: ${actionType}`,
        `执行失败: ${errorMessage}`
      ],
      error_details: errorMessage,
      extracted_data: {
        xpath: xpathExpression,
        actionType,
        error: errorMessage
      }
    };
  }
}

/**
 * 根据步骤信息确定操作类型
 */
function determineActionType(step: SmartScriptStep): string {
  const stepName = step.name?.toLowerCase() || '';
  const stepType = step.step_type?.toString().toLowerCase() || '';
  
  // 根据步骤名称判断
  if (stepName.includes('点击') || stepName.includes('click') || stepName.includes('操作')) {
    return 'click';
  }
  
  if (stepName.includes('输入') || stepName.includes('文本') || stepName.includes('input') || stepName.includes('text')) {
    return 'text';
  }
  
  // 根据步骤类型判断
  if (stepType.includes('tap') || stepType.includes('click')) {
    return 'click';
  }
  
  if (stepType.includes('text') || stepType.includes('input')) {
    return 'text';
  }
  
  // 默认为点击操作
  return 'click';
}