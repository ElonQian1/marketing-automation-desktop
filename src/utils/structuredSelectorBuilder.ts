// src/utils/structuredSelectorBuilder.ts
// module: utils | layer: application | role: 结构化选择器构建器
// summary: 从UIElement和步骤卡信息构建完整的结构化选择器对象

import type { 
  StructuredSelector, 
  ElementSelectors,
  GeometricAids,
  ActionSpec
} from '../types/structuredSelector';
import {
  DEFAULT_SAFETY_CONFIG,
  DEFAULT_VALIDATION_CONFIG,
  extractSelectorsFromElement,
  calculateBoundsSignature
} from '../types/structuredSelector';
import type { StepCardModel } from '../types/stepActions';

// UIElement 类型定义（简化版）
interface UIElement {
  id?: string;
  xpath?: string;
  resource_id?: string;
  text?: string;
  content_desc?: string;
  class_name?: string;
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  element_type?: string;
}

/**
 * 从UIElement构建结构化选择器
 */
export function buildStructuredSelector(
  element: UIElement,
  stepCard: StepCardModel,
  screenSize?: { width: number; height: number }
): StructuredSelector {
  // A. 提取元素选择器
  const selectors: ElementSelectors = extractSelectorsFromElement(element);
  
  // B. 构建几何辅助信息
  let geometric: GeometricAids | undefined;
  if (element.bounds && screenSize) {
    geometric = {
      bounds: element.bounds,
      bounds_signature: calculateBoundsSignature(element.bounds, screenSize)
    };
  } else if (element.bounds) {
    geometric = {
      bounds: element.bounds
    };
  }
  
  // E. 构建执行动作
  const action: ActionSpec = convertStepActionToActionSpec(stepCard.currentAction);
  
  // 构建完整的结构化选择器
  const structuredSelector: StructuredSelector = {
    selectors,
    geometric,
    // C. 邻近锚点暂时留空，后续可扩展
    neighbors: undefined,
    // D. 验证与兜底配置
    validation: {
      ...DEFAULT_VALIDATION_CONFIG,
      fallback_to_bounds: stepCard.common.allowAbsolute,
      revalidate: stepCard.common.verifyAfter ? 'device_required' : 'device_optional',
    },
    action,
    // F. 安全阈值配置
    safety: {
      ...DEFAULT_SAFETY_CONFIG,
      min_confidence: stepCard.common.confidenceThreshold,
    },
    step_id: stepCard.id,
    selector_id: stepCard.selectorId,
    selector_preferred: stepCard.common.useSelector,
  };
  
  return structuredSelector;
}

/**
 * 将StepActionParams转换为ActionSpec
 */
function convertStepActionToActionSpec(stepAction: StepCardModel['currentAction']): ActionSpec {
  switch (stepAction.type) {
    case 'tap':
      return {
        type: 'tap',
        params: {
          offset_x: stepAction.params.offsetX,
          offset_y: stepAction.params.offsetY,
        }
      };
      
    case 'longPress':
      return {
        type: 'longPress',
        params: {
          press_ms: stepAction.params.pressDurationMs,
          offset_x: stepAction.params.offsetX,
          offset_y: stepAction.params.offsetY,
        }
      };
      
    case 'swipe':
      return {
        type: 'swipe',
        params: {
          direction: stepAction.params.direction,
          distance_dp: Math.round((stepAction.params.distance || 0.6) * 100),
          duration_ms: stepAction.params.durationMs || 250,
        }
      };
      
    case 'type':
      return {
        type: 'type',
        params: {
          text: stepAction.params.text,
          clear: stepAction.params.clearBefore,
          submit: stepAction.params.keyboardEnter,
        }
      };
      
    case 'wait':
      return {
        type: 'wait',
        params: {
          duration_ms: stepAction.params.waitMs || 500,
        }
      };
      
    case 'back':
      return {
        type: 'back',
      };
      
    default:
      // 默认返回tap
      return {
        type: 'tap',
      };
  }
}

/**
 * 从选择器ID获取缓存的UIElement信息（如果需要）
 * 这个函数需要与现有的元素缓存系统集成
 */
export function getElementFromSelectorId(selectorId: string): UIElement | null {
  // TODO: 集成现有的元素缓存系统
  // 可能需要从 XmlCacheManager 或其他地方获取元素信息
  console.warn('getElementFromSelectorId 需要与现有缓存系统集成:', selectorId);
  return null;
}

/**
 * 验证结构化选择器的完整性
 */
export function validateStructuredSelector(selector: StructuredSelector): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // 检查是否有基本选择器
  const hasBasicSelector = !!(
    selector.selectors.absolute_xpath ||
    selector.selectors.resource_id ||
    selector.selectors.text ||
    selector.selectors.class_name
  );
  
  if (!hasBasicSelector) {
    issues.push('缺少基本选择器（xpath, resource_id, text, class_name 至少需要一个）');
  }
  
  // 检查是否有强锚点
  const hasStrongAnchor = !!(
    selector.selectors.absolute_xpath ||
    selector.selectors.resource_id
  );
  
  if (!hasStrongAnchor) {
    recommendations.push('建议添加强锚点（absolute_xpath 或 resource_id）以提高稳定性');
  }
  
  // 检查xpath前缀和索引的一致性
  if (selector.selectors.xpath_prefix && !selector.selectors.leaf_index) {
    issues.push('有 xpath_prefix 但缺少 leaf_index');
  }
  
  if (!selector.selectors.xpath_prefix && selector.selectors.leaf_index) {
    issues.push('有 leaf_index 但缺少 xpath_prefix');
  }
  
  // 检查动作参数
  if (!selector.action.type) {
    issues.push('缺少动作类型');
  }
  
  // 检查置信度设置
  if (selector.safety?.min_confidence && selector.safety.min_confidence < 0.5) {
    recommendations.push('置信度阈值建议设置在0.5以上');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}