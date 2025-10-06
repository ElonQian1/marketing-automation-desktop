/**
 * Universal UI API 核心类
 * 处理页面分析、元素提取和智能匹配
 */

import { invokeUniversal } from './commands/registry';
import { normalizeUniversalPageCaptureResult } from './adapters/normalize';
import type {
  UIElement,
  UIElementContext,
  ElementBounds,
  ElementContextFingerprint,
  RelativePosition,
  UniversalPageCaptureResult,
  UniversalPageCaptureResultBackend
} from './types';

/**
 * Universal UI页面分析API类
 */
export class UniversalUIAPI {
  
  /**
   * 分析Universal UI页面
   */
  static async analyzeUniversalUIPage(deviceId: string): Promise<UniversalPageCaptureResult> {
    try {
      // 统一通过 invokeCompat：默认 snake_case，必要时自动回退 camelCase
      const result = await invokeUniversal<UniversalPageCaptureResultBackend>('analyzeUniversalUIPage', { deviceId });
      return normalizeUniversalPageCaptureResult(result);
    } catch (error) {
      console.error('Failed to analyze universal UI page:', error);
      throw new Error(`Universal UI页面分析失败: ${error}`);
    }
  }

  /**
   * 提取页面元素 - 使用统一智能解析器，失败时使用前端解析
   */
  static async extractPageElements(xmlContent: string): Promise<UIElement[]> {
    try {
      console.log('🔍 [UniversalUIAPI] 开始提取页面元素，XML长度:', xmlContent.length);
      
      // 🎯 使用统一的 XmlPageCacheService 进行解析
      try {
        // 动态导入以避免循环依赖
        const { XmlPageCacheService } = await import('../../services/XmlPageCacheService');
        const elements = await XmlPageCacheService.parseXmlToAllElements(xmlContent);
        console.log('✅ [UniversalUIAPI] XmlPageCacheService 解析成功，返回', elements.length, '个元素');
        return elements;
      } catch (serviceError) {
        console.warn('[UniversalUIAPI] XmlPageCacheService 解析失败，尝试后端调用:', serviceError);
        
        // 后备方案：调用后端
        return await invokeUniversal<UIElement[]>('extractPageElements', { xmlContent });
      }
    } catch (error) {
      console.error('[UniversalUIAPI] 提取页面元素失败:', error);
      throw new Error(`提取页面元素失败: ${error}`);
    }
  }

  /**
   * 🔧 创建元素上下文信息（避免循环引用）
   */
  private static createElementContext(element: UIElement): UIElementContext {
    return {
      id: element.id,
      text: element.text,
      class_name: element.class_name,
      resource_id: element.resource_id,
      is_clickable: element.is_clickable,
      bounds: element.bounds,
      element_type: element.element_type
    };
  }

  /**
   * 🎯 生成上下文指纹 - 用于精准识别元素的关键特征组合
   */
  private static generateContextFingerprint(
    element: UIElement,
    parent: UIElementContext | undefined,
    siblings: UIElementContext[],
    children: UIElementContext[]
  ): ElementContextFingerprint {
    // 🔍 寻找锚点元素（有文本的兄弟元素，通常是用户名等标识信息）
    const anchorElements = siblings
      .filter(sibling => sibling.text && sibling.text.trim().length > 0)
      .map(sibling => ({
        text: sibling.text,
        element_type: sibling.element_type,
        relative_direction: 'sibling' as const,
        distance: Math.abs(sibling.bounds.left - element.bounds.left) + 
                 Math.abs(sibling.bounds.top - element.bounds.top)
      }))
      .slice(0, 3); // 取前3个最相关的锚点

    // 🏠 容器特征
    const containerSignature = {
      class_name: parent?.class_name,
      resource_id: parent?.resource_id,
      child_count: siblings.length + 1, // 包括自己
      container_bounds: parent?.bounds || element.bounds
    };

    // 👥 兄弟元素特征模式
    const siblingPattern = {
      total_siblings: siblings.length,
      clickable_siblings: siblings.filter(s => s.is_clickable).length,
      text_siblings: siblings.map(s => s.text).filter(t => t),
      position_in_siblings: siblings.filter(s => 
        s.bounds.top < element.bounds.top || 
        (s.bounds.top === element.bounds.top && s.bounds.left < element.bounds.left)
      ).length
    };

    return {
      anchor_elements: anchorElements,
      container_signature: containerSignature,
      sibling_pattern: siblingPattern,
      generated_at: new Date().toISOString(),
      matching_weights: {
        anchor_weight: 0.4,    // 锚点匹配权重最高
        container_weight: 0.3, // 容器匹配权重
        sibling_weight: 0.2,   // 兄弟模式权重
        position_weight: 0.1   // 位置权重最低（因为会变化）
      }
    };
  }

  /**
   * 📍 生成相对位置信息
   */
  private static generateRelativePosition(
    element: UIElement,
    siblings: UIElementContext[]
  ): RelativePosition | undefined {
    // 寻找最近的有文本的兄弟元素作为锚点
    const textSiblings = siblings.filter(s => s.text && s.text.trim().length > 0);
    
    if (textSiblings.length === 0) return undefined;

    // 选择最近的文本兄弟作为锚点
    const closestAnchor = textSiblings.reduce((closest, current) => {
      const closestDistance = Math.abs(closest.bounds.left - element.bounds.left) + 
                            Math.abs(closest.bounds.top - element.bounds.top);
      const currentDistance = Math.abs(current.bounds.left - element.bounds.left) + 
                            Math.abs(current.bounds.top - element.bounds.top);
      return currentDistance < closestDistance ? current : closest;
    });

    // 计算相对方向
    let direction: 'left' | 'right' | 'above' | 'below' | 'inside' = 'right';
    if (element.bounds.right < closestAnchor.bounds.left) {
      direction = 'left';
    } else if (element.bounds.left > closestAnchor.bounds.right) {
      direction = 'right';
    } else if (element.bounds.bottom < closestAnchor.bounds.top) {
      direction = 'above';
    } else if (element.bounds.top > closestAnchor.bounds.bottom) {
      direction = 'below';
    } else {
      direction = 'inside';
    }

    const distancePx = Math.abs(element.bounds.left - closestAnchor.bounds.left) + 
                     Math.abs(element.bounds.top - closestAnchor.bounds.top);

    return {
      relative_to_anchor: {
        anchor_text: closestAnchor.text,
        direction,
        distance_px: distancePx,
        distance_percent: distancePx / 1080 * 100 // 基于屏幕宽度的百分比
      }
    };
  }

  /**
   * 解析bounds字符串为ElementBounds对象
   */
  private static parseBounds(boundsStr: string): ElementBounds {
    // bounds格式: [left,top][right,bottom]
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (match) {
      return {
        left: parseInt(match[1]),
        top: parseInt(match[2]),
        right: parseInt(match[3]),
        bottom: parseInt(match[4]),
      };
    }
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  /**
   * 为节点生成简单的XPath
   */
  private static generateXPath(node: Element, depth: number): string {
    const className = node.getAttribute('class') || 'unknown';
    const resourceId = node.getAttribute('resource-id');
    
    if (resourceId) {
      return `//*[@resource-id='${resourceId}']`;
    }
    
    return `//*[@class='${className}'][${depth}]`;
  }
}