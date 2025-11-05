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
 * 从选择器ID获取缓存的UIElement信息
 * 集成步骤卡片参数推导系统，支持从XML快照重建元素信息
 */
export async function getElementFromSelectorId(selectorId: string): Promise<UIElement | null> {
  try {
    console.log('🔍 [SelectorBuilder] 查找元素信息', { selectorId });

    // 方式1: 从步骤卡片获取完整信息
    const elementFromStepCard = await getElementFromStepCard(selectorId);
    if (elementFromStepCard) {
      console.log('✅ [SelectorBuilder] 从步骤卡片获取元素信息');
      return elementFromStepCard;
    }

    // 方式2: 从XML缓存重建元素信息  
    const elementFromXmlCache = await getElementFromXmlCache(selectorId);
    if (elementFromXmlCache) {
      console.log('✅ [SelectorBuilder] 从XML缓存重建元素信息');
      return elementFromXmlCache;
    }

    console.warn('⚠️ [SelectorBuilder] 无法找到元素信息', { selectorId });
    return null;

  } catch (error) {
    console.error('❌ [SelectorBuilder] 元素信息获取失败:', error);
    return null;
  }
}

/**
 * 从步骤卡片获取元素信息
 */
async function getElementFromStepCard(selectorId: string): Promise<UIElement | null> {
  try {
    // 导入步骤卡片store（延迟导入避免循环依赖）
    const { useStepCardStore } = await import('../store/stepcards');
    const store = useStepCardStore.getState();
    
    // 查找包含此selectorId的步骤卡片
    const cards = store.getAllCards();
    const targetCard = cards.find(card => 
      card.elementUid === selectorId || 
      card.id === selectorId ||
      card.elementContext?.xpath === selectorId
    );

    if (!targetCard) return null;

    // 检查是否有原始元素数据
    if (targetCard.original_element) {
      console.log('📦 [SelectorBuilder] 找到原始元素数据');
      return targetCard.original_element;
    }

    // 从elementContext重建基本信息
    if (targetCard.elementContext) {
      const element: UIElement = {
        id: targetCard.elementUid,
        element_type: 'reconstructed',
        text: targetCard.elementContext.text || '',
        bounds: parseBoundsString(targetCard.elementContext.bounds || '[0,0][0,0]'),
        xpath: targetCard.elementContext.xpath || '',
        resource_id: targetCard.elementContext.resourceId,
        class_name: targetCard.elementContext.className,
        is_clickable: true, // 默认值
        is_scrollable: false,
        is_enabled: true,
        is_focused: false,
        checkable: false,
        checked: false,
        selected: false,
        password: false,
        content_desc: ''
      };
      
      console.log('🔧 [SelectorBuilder] 从elementContext重建元素');
      return element;
    }

    return null;
  } catch (error) {
    console.error('❌ [SelectorBuilder] 步骤卡片查找失败:', error);
    return null;
  }
}

/**
 * 从XML缓存重建元素信息
 */
async function getElementFromXmlCache(selectorId: string): Promise<UIElement | null> {
  try {
    // 这里需要实现从XML缓存中根据selectorId查找元素的逻辑
    // 目前先返回null，等待后续完善
    console.log('🔄 [SelectorBuilder] XML缓存查找功能待实现', { selectorId });
    return null;
  } catch (error) {
    console.error('❌ [SelectorBuilder] XML缓存查找失败:', error);
    return null;
  }
}

/**
 * 解析bounds字符串
 */
function parseBoundsString(boundsStr: string): { left: number; top: number; right: number; bottom: number } {
  try {
    // 格式：[x1,y1][x2,y2]
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }

    const [, x1, y1, x2, y2] = match.map(Number);
    return { left: x1, top: y1, right: x2, bottom: y2 };
  } catch {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }
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