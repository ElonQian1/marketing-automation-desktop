// src/modules/universal-ui/adapters/step-card-adapter.ts
// module: universal-ui | layer: adapters | role: adapter
// summary: 步骤卡片数据适配器，统一不同模块的步骤数据到智能分析格式

import type {
  IntelligentStepCard,
  StrategyCandidate,
} from "../types/intelligent-analysis-types";
import type { SmartScriptStep } from "../../../types/smartScript";

/**
 * 创建默认兜底策略
 */
function createDefaultFallbackStrategy(): StrategyCandidate {
  return {
    key: "fallback_default",
    name: "默认兜底策略",
    description: "基础XPath定位策略",
    confidence: 0.6,
    xpath: "//unknown",
    variant: "index_fallback",
    enabled: true,
    isRecommended: false,
  };
}

/**
 * 脚本步骤数据转换为智能步骤卡片数据
 */
export function adaptScriptStepToIntelligent(
  scriptStep: SmartScriptStep,
  index: number
): IntelligentStepCard {
  const now = Date.now();
  const fallbackStrategy = createDefaultFallbackStrategy();

  return {
    stepId: scriptStep.id,
    stepName: scriptStep.name || `步骤 ${index + 1}`,
    stepType: scriptStep.step_type,
    elementContext: {
      snapshotId: "script_step",
      elementPath: extractElementPath(scriptStep),
      elementText: extractElementText(scriptStep),
      elementType: scriptStep.step_type,
      elementBounds: extractElementBounds(scriptStep),
      keyAttributes: extractKeyAttributes(scriptStep),
    },
    selectionHash: generateSelectionHash(scriptStep),
    analysisState: "idle",
    analysisProgress: 0,
    strategyMode: "intelligent",
    smartCandidates: [],
    staticCandidates: [],
    fallbackStrategy,
    activeStrategy: fallbackStrategy,
    autoFollowSmart: true,
    lockContainer: false,
    smartThreshold: 0.82,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 从脚本步骤中提取元素路径
 */
function extractElementPath(step: SmartScriptStep): string {
  if (step.parameters?.element_path) {
    return step.parameters.element_path;
  }

  // 尝试从其他参数中提取
  const params = step.parameters || {};
  if (params.xpath) return params.xpath;
  if (params.selector) return params.selector;
  if (params.resource_id) return `//*[@resource-id="${params.resource_id}"]`;

  return "//unknown";
}

/**
 * 从脚本步骤中提取元素文本
 */
function extractElementText(step: SmartScriptStep): string | undefined {
  const params = step.parameters || {};
  return params.text || params.content_desc || params.element_text;
}

/**
 * 从脚本步骤中提取元素边界
 */
function extractElementBounds(step: SmartScriptStep): string {
  const params = step.parameters || {};
  if (params.bounds) return params.bounds;
  if (params.element_bounds) return params.element_bounds;
  return "[0,0][100,100]";
}

/**
 * 从脚本步骤中提取关键属性
 */
function extractKeyAttributes(step: SmartScriptStep): Record<string, string> {
  const params = step.parameters || {};
  const attributes: Record<string, string> = {};

  if (params.resource_id) attributes["resource-id"] = params.resource_id;
  if (params.class_name) attributes.class = params.class_name;
  if (params.content_desc) attributes["content-desc"] = params.content_desc;
  if (params.text) attributes.text = params.text;

  return attributes;
}

/**
 * 生成选择哈希（简化版本）
 */
function generateSelectionHash(step: SmartScriptStep): string {
  const key = `script_${step.id}_${step.step_type}`;
  return btoa(key).slice(0, 16);
}
