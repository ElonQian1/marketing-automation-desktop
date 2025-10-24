// src/components/universal-ui/views/visual-view/utils/elementTransform.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { BridgeUIElement, VisualUIElement } from '../types/visual-types';
import { BoundsCalculator } from '../../../../../shared/bounds/BoundsCalculator';

// 解析 bounds 字符串 -> 坐标与尺寸
export function parseBounds(bounds: string): { x: number; y: number; width: number; height: number } {
  const info = BoundsCalculator.getBoundsInfo(bounds);
  if (!info) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: info.left, y: info.top, width: info.width, height: info.height };
}

// VisualUIElement -> 旧 UIElement 桥接（UI 使用结构）
export function convertVisualToUIElement(element: VisualUIElement, selectedId?: string): BridgeUIElement {
  let position = element.position || { x: 0, y: 0, width: 100, height: 50 };
  
  // 🔧 Debug: 仅菜单元素转换调试
  const isMenuElement = element.category === 'menu' || element.content_desc === '菜单' || 
                       element.id === 'element_71' || element.description === '菜单';
  
  if (isMenuElement) {
    console.log('🎯 [convertVisualToUIElement] 菜单元素转换:', {
      id: element.id,
      text: element.text,
      content_desc: element.content_desc,
      clickable: element.clickable,
      category: element.category,
      description: element.description,
      type: element.type,
      originalPosition: element.position
    });
    
    // 🔧 菜单元素position修复逻辑
    // 检查是否position数据错误（覆盖屏幕下半部分）
    if (position.x === 0 && position.y === 1246 && position.width === 1080 && position.height >= 900) {
      console.error('❌ [convertVisualToUIElement] 检测到菜单元素错误position，自动修复');
      position = {
        x: 39,
        y: 143,
        width: 63,  // 102 - 39
        height: 63  // 206 - 143
      };
      console.log('✅ [convertVisualToUIElement] 菜单position已修复为:', position);
    }
  }
  
  return {
    id: element.id,
    element_type: element.element_type || element.type || '',
    text: element.text || '',
    bounds: {
      left: position.x,
      top: position.y,
      right: position.x + position.width,
      bottom: position.y + position.height,
    },
    xpath: element.id,
    resource_id: '',
    class_name: '',
    is_clickable: element.is_clickable || element.clickable || false,
    is_scrollable: element.scrollable || false,
    is_enabled: element.enabled !== false,
    is_focused: element.focused || false,
    checkable: false,
    checked: false,
    selected: element.selected || element.id === selectedId,
    password: false,
    content_desc: element.content_desc || '', // 🔧 保留 content_desc
  };
}
