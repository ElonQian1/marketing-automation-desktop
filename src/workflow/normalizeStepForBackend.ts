// src/workflow/normalizeStepForBackend.ts
// module: workflow | layer: application | role: 类型映射层
// summary: 统一规范化 UI 语义标签到后端动作枚举

/**
 * 后端标准动作集合（与 src-tauri/src/services/execution/model/smart.rs 保持一致）
 */
const BACKEND_STANDARD_ACTIONS = new Set([
  'tap',
  'input',
  'wait',
  'swipe',
  'smart_tap',
  'smart_find_element',
  'batch_match',
  'recognize_page',
  'verify_action',
  'wait_for_page_state',
  'extract_element',
  'smart_navigation',
  'loop_start',
  'loop_end',
  'contact_generate_vcf',
  'contact_import_to_device',
]);

export interface UIStep {
  stepId: string;
  type: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BackendStep {
  stepId: string;
  action: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 规范化 UI 步骤到后端执行格式
 * 
 * 核心逻辑：
 * 1. 如果 type 已是标准动作，直接作为 action 传递
 * 2. 如果是语义标签（footer/header/content 前缀），映射到对应动作
 * 3. 其他未知类型统一映射到 smart_tap，由后端统一处理
 * 
 * @param uiStep - 前端步骤卡片数据
 * @returns 后端可识别的标准格式
 */
export function normalizeStepForBackend(uiStep: UIStep): BackendStep {
  const { stepId, type, params = {}, ...rest } = uiStep;

  // 1. 已是标准动作，直接传递
  if (BACKEND_STANDARD_ACTIONS.has(type)) {
    return {
      stepId,
      action: type,
      params,
      ...rest,
    };
  }

  // 2. 语义标签：footer_* / header_* / content_* → smart_navigation
  if (type.startsWith('footer_') || type.startsWith('header_') || type.startsWith('content_')) {
    return {
      stepId,
      action: 'smart_navigation',
      params: {
        target: type, // 保留原始语义标签给后端决策
        ...params,
      },
      ...rest,
    };
  }

  // 3. 其他未知类型 → smart_tap（通用兜底）
  // 后端可通过 params.uiType 了解原始类型，用于日志和错误提示
  return {
    stepId,
    action: 'smart_tap',
    params: {
      uiType: type,
      ...params,
    },
    ...rest,
  };
}

/**
 * 批量规范化步骤数组
 */
export function normalizeStepsForBackend(uiSteps: UIStep[]): BackendStep[] {
  return uiSteps.map(normalizeStepForBackend);
}
