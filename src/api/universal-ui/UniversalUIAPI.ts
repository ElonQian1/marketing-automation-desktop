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
      // 统一通过 invokeCompat 调用后端，失败时回退前端解析
      try {
        return await invokeUniversal<UIElement[]>('extractPageElements', { xmlContent });
      } catch (backendError) {
        console.warn('[UniversalUIAPI] 后端解析失败，使用前端上下文感知解析:', backendError);
        return this.parseXMLToElementsWithContext(xmlContent);
      }
    } catch (error) {
      console.error('[UniversalUIAPI] 提取页面元素失败:', error);
      throw new Error(`提取页面元素失败: ${error}`);
    }
  }

  /**
   * 前端XML解析器 - 上下文感知版本，构建完整的DOM树关系
   */
  private static parseXMLToElementsWithContext(xmlContent: string): UIElement[] {
    const elements: UIElement[] = [];
    const elementMap = new Map<Element, UIElement>(); // XML节点到UIElement的映射
    
    try {
      // 轻量清洗：去除非XML头信息，提取第一个 '<' 到最后一个 '>' 之间的内容
      let content = xmlContent;
      if (content) {
        const firstLt = content.indexOf('<');
        const lastGt = content.lastIndexOf('>');
        if (firstLt > 0 && lastGt > firstLt) {
          content = content.slice(firstLt, lastGt + 1);
        }
      }
      // 创建DOM解析器
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      // 检查解析错误
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error(`XML解析错误: ${parseError.textContent}`);
      }
      
      // 第一遍遍历：创建所有UIElement对象
      const firstPass = (node: Element, depth: number = 0) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'node') {
          const bounds = this.parseBounds(node.getAttribute('bounds') || '');
          const text = node.getAttribute('text') || '';
          const contentDesc = node.getAttribute('content-desc') || '';
          const resourceId = node.getAttribute('resource-id') || '';
          const className = node.getAttribute('class') || '';
          const clickable = node.getAttribute('clickable') === 'true';
          const scrollable = node.getAttribute('scrollable') === 'true';
          const enabled = node.getAttribute('enabled') !== 'false';
          const checkable = node.getAttribute('checkable') === 'true';
          const checked = node.getAttribute('checked') === 'true';
          const selected = node.getAttribute('selected') === 'true';
          const password = node.getAttribute('password') === 'true';
          
          // 🎯 保持基础过滤：保留所有有效的UI节点，让层级树视图负责显示控制
          const hasValidBounds = bounds.right > bounds.left && bounds.bottom > bounds.top;
          const hasMinimumSize = (bounds.right - bounds.left) >= 1 && (bounds.bottom - bounds.top) >= 1;
          
          if (hasValidBounds && hasMinimumSize) {
            const element: UIElement = {
              id: `element_${elements.length}`,
              element_type: className || 'unknown',
              text,
              bounds,
              xpath: this.generateXPath(node, depth),
              resource_id: resourceId,
              class_name: className,
              is_clickable: clickable,
              is_scrollable: scrollable,
              is_enabled: enabled,
              is_focused: false, // 添加缺失的字段
              checkable,
              checked,
              selected,
              password,
              content_desc: contentDesc,
              children: [], // 添加 children 字段
            };
            
            elements.push(element);
            elementMap.set(node, element);
          }
        }
        
        // 递归处理子节点
        for (let i = 0; i < node.children.length; i++) {
          firstPass(node.children[i], depth + 1);
        }
      };

      // 第二遍遍历：构建上下文关系
      const secondPass = (node: Element) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'node') {
          const currentElement = elementMap.get(node);
          
          if (currentElement) {
            // 🔍 构建父元素上下文
            const parentNode = node.parentElement;
            if (parentNode && elementMap.has(parentNode)) {
              const parentElement = elementMap.get(parentNode)!;
              currentElement.parent_element = this.createElementContext(parentElement);
            }
            
            // 🔍 构建兄弟元素上下文
            const siblings: UIElementContext[] = [];
            if (node.parentElement) {
              for (let i = 0; i < node.parentElement.children.length; i++) {
                const siblingNode = node.parentElement.children[i];
                if (siblingNode !== node && elementMap.has(siblingNode)) {
                  const siblingElement = elementMap.get(siblingNode)!;
                  siblings.push(this.createElementContext(siblingElement));
                }
              }
            }
            currentElement.sibling_elements = siblings;
            
            // 🔍 构建子元素上下文
            const children: UIElementContext[] = [];
            for (let i = 0; i < node.children.length; i++) {
              const childNode = node.children[i];
              if (elementMap.has(childNode)) {
                const childElement = elementMap.get(childNode)!;
                children.push(this.createElementContext(childElement));
              }
            }
            currentElement.child_elements = children;
            
            // 🎯 生成上下文指纹
            currentElement.context_fingerprint = this.generateContextFingerprint(
              currentElement, 
              currentElement.parent_element,
              siblings,
              children
            );
            
            // 🎯 生成相对位置信息
            currentElement.relative_position = this.generateRelativePosition(
              currentElement,
              siblings
            );
          }
        }
        
        // 递归处理子节点
        for (let i = 0; i < node.children.length; i++) {
          secondPass(node.children[i]);
        }
      };
      
      // 从根节点开始遍历
      const rootNodes = xmlDoc.querySelectorAll('hierarchy > node');
      
      // 执行两遍遍历
      rootNodes.forEach(node => firstPass(node, 0));
      rootNodes.forEach(node => secondPass(node));
      
      console.log(`🎯 上下文感知解析完成，提取到 ${elements.length} 个UI元素，包含完整上下文关系`);
      return elements;
      
    } catch (error) {
      console.error('上下文感知XML解析失败:', error);
      throw new Error(`XML解析失败: ${error}`);
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