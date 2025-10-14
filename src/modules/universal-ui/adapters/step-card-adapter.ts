// src/modules/universal-ui/adapters/step-card-adapter.ts
// module: universal-ui | layer: adapters | role: adapter
// summary: 步骤卡片数据适配器，统一不同模块的步骤数据到智能分析格式

import type { IntelligentStepCard } from '../types/intelligent-analysis-types';
import type { SmartScriptStep } from '../../../types/smartScript';

/**
 * 脚本步骤数据转换为智能步骤卡片数据
 */
export function adaptScriptStepToIntelligent(
  scriptStep: SmartScriptStep,
  index: number
): IntelligentStepCard {
  const now = Date.now();
  
  return {
    stepId: scriptStep.id,
    stepName: scriptStep.name || `步骤 ${index + 1}`,
    stepType: scriptStep.step_type,
    elementContext: {
      snapshotId: scriptStep.xml_snapshot_id || 'unknown',
      elementPath: extractElementPath(scriptStep),
      elementText: extractElementText(scriptStep),
      elementType: scriptStep.step_type,
      elementBounds: extractElementBounds(scriptStep),
      keyAttributes: extractKeyAttributes(scriptStep)
    },
    selectionHash: generateSelectionHash(scriptStep),
    analysisState: 'idle',
    analysisProgress: 0,
    strategyMode: 'intelligent',
    smartCandidates: [],
    staticCandidates: [],
    autoFollowSmart: true,
    smartThreshold: 0.82,
    createdAt: now,
    updatedAt: now
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
  
  return '//unknown';
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
  return '[0,0][100,100]';
}

/**
 * 从脚本步骤中提取关键属性
 */
function extractKeyAttributes(step: SmartScriptStep): Record<string, string> {
  const params = step.parameters || {};
  const attributes: Record<string, string> = {};
  
  if (params.resource_id) attributes['resource-id'] = params.resource_id;
  if (params.class_name) attributes.class = params.class_name;
  if (params.content_desc) attributes['content-desc'] = params.content_desc;
  if (params.text) attributes.text = params.text;
  
  return attributes;
}

/**
 * 生成选择哈希（简化版本）
 */
function generateSelectionHash(step: SmartScriptStep): string {
  const key = `${step.xml_snapshot_id || 'unknown'}_${step.id}_${step.step_type}`;
  return btoa(key).slice(0, 16);
}

/**
 * 导航步骤数据适配器
 */
export function adaptNavigationStepToIntelligent(
  navStep: any, // 替换为实际的导航步骤类型
  index: number
): IntelligentStepCard {
  const now = Date.now();
  
  return {
    stepId: navStep.id || `nav_${index}`,
    stepName: navStep.name || `导航步骤 ${index + 1}`,
    stepType: 'navigation',
    elementContext: {
      snapshotId: navStep.snapshotId || 'navigation',
      elementPath: navStep.elementPath || '//unknown',
      elementType: 'navigation',
      elementBounds: '[0,0][100,100]',
      keyAttributes: {}
    },
    selectionHash: `nav_${navStep.id || index}`,
    analysisState: 'idle',
    analysisProgress: 0,
    strategyMode: 'intelligent',
    smartCandidates: [],
    staticCandidates: [],
    autoFollowSmart: true,
    smartThreshold: 0.82,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 循环步骤数据适配器
 */
export function adaptLoopStepToIntelligent(
  loopStep: any, // 替换为实际的循环步骤类型
  index: number
): IntelligentStepCard {
  const now = Date.now();
  
  return {
    stepId: loopStep.id || `loop_${index}`,
    stepName: loopStep.name || `循环步骤 ${index + 1}`,
    stepType: 'loop',
    elementContext: {
      snapshotId: loopStep.snapshotId || 'loop',
      elementPath: '//loop-container',
      elementType: 'loop',
      elementBounds: '[0,0][100,100]',
      keyAttributes: {
        'loop-type': loopStep.loopType || 'unknown'
      }
    },
    selectionHash: `loop_${loopStep.id || index}`,
    analysisState: 'idle',
    analysisProgress: 0,
    strategyMode: 'static_user', // 循环通常使用静态策略
    smartCandidates: [],
    staticCandidates: [],
    autoFollowSmart: false, // 循环不需要智能跟随
    smartThreshold: 0.82,
    createdAt: now,
    updatedAt: now
  };
}