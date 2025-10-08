/**
 * UIElement 和 UiNode 之间的适配器
 * 用于在不同的UI系统间转换数据格式
 */
import type { UIElement } from "../../../../api/universal-ui/types";
import type { UiNode } from "../../views/grid-view/types";

export class UIElementAdapter {
  /**
   * 将 UIElement 转换为 UiNode
   */
  static toUiNode(element: UIElement): UiNode {
    const attrs: Record<string, string> = {
      'resource-id': element.resource_id || '',
      'text': element.text || '',
      'class': element.class_name || '',
      'bounds': this.boundsToString(element.bounds),
      'clickable': element.is_clickable.toString(),
      'scrollable': element.is_scrollable.toString(),
      'enabled': element.is_enabled.toString(),
      'focused': element.is_focused?.toString() || 'false',
      'content-desc': '', // UIElement中没有这个字段，使用空值
      'package': '', // UIElement中没有这个字段，使用空值
      'index': '0' // UIElement中没有这个字段，使用默认值
    };

    return {
      tag: element.element_type,
      attrs,
      children: [], // UIElement是扁平结构，没有子元素信息
      parent: null
    };
  }

  /**
   * 将 UiNode 转换为 UIElement
   */
  static toUIElement(node: UiNode, index: number = 0): UIElement {
    const bounds = this.parseBounds(node.attrs.bounds || '[0,0][0,0]');
    
    return {
      id: `element_${index}`,
      element_type: node.tag,
      text: node.attrs.text || '',
      bounds,
      xpath: '', // UiNode中没有xpath信息
      resource_id: node.attrs['resource-id'],
      class_name: node.attrs.class,
      is_clickable: node.attrs.clickable === 'true',
      is_scrollable: node.attrs.scrollable === 'true',
      is_enabled: node.attrs.enabled === 'true',
      is_focused: node.attrs.focused === 'true',
      checkable: node.attrs.checkable === 'true',
      checked: node.attrs.checked === 'true',
      selected: node.attrs.selected === 'true',
      password: node.attrs.password === 'true',
      content_desc: node.attrs['content-desc'] || ''
    };
  }

  /**
   * 将 bounds 对象转换为字符串格式
   */
  private static boundsToString(bounds: any): string {
    if (!bounds) return '[0,0][0,0]';
    
    if (typeof bounds === 'string') return bounds;
    
    // 如果是对象格式，转换为字符串
    if (bounds.left !== undefined && bounds.top !== undefined && 
        bounds.right !== undefined && bounds.bottom !== undefined) {
      return `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
    }
    
    return '[0,0][0,0]';
  }

  /**
   * 解析 bounds 字符串为对象格式
   */
  private static parseBounds(boundsStr: string) {
    // 匹配 [left,top][right,bottom] 格式
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    
    if (!match) {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }
    
    return {
      left: parseInt(match[1]),
      top: parseInt(match[2]),
      right: parseInt(match[3]),
      bottom: parseInt(match[4])
    };
  }

  /**
   * 检查是否为隐藏元素（bounds为[0,0][0,0]）
   */
  static isHiddenElement(element: UIElement): boolean {
    const boundsStr = this.boundsToString(element.bounds);
    return boundsStr === '[0,0][0,0]';
  }

  /**
   * 批量转换 UIElement 数组为 UiNode 数组
   */
  static toUiNodeArray(elements: UIElement[]): UiNode[] {
    return elements.map(element => this.toUiNode(element));
  }

  /**
   * 批量转换 UiNode 数组为 UIElement 数组
   */
  static toUIElementArray(nodes: UiNode[]): UIElement[] {
    return nodes.map((node, index) => this.toUIElement(node, index));
  }
}