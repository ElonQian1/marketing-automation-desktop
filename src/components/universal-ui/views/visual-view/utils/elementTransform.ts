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
  // 🔍 调试：检查输入元素的 indexPath
  if (element.id === 'element_32' || element.id === 'element-32' || !element.indexPath) {
    console.log('🔍 [convertVisualToUIElement] 输入元素检查:', {
      id: element.id,
      hasIndexPath: !!element.indexPath,
      indexPath: element.indexPath,
      indexPathLength: element.indexPath?.length,
      elementKeys: Object.keys(element).slice(0, 20)
    });
  }

  let position = element.position || { x: 0, y: 0, width: 100, height: 50 };
  
  // 🔧 修复：前端使用 element-N，后端使用 element_N
  // 需要统一为后端格式（下划线）
  const backendId = element.id.replace('element-', 'element_');
  
  // 🔧 保留原始 bounds、resource_id、class_name 等关键信息
  const bounds = {
    left: position.x,
    top: position.y,
    right: position.x + position.width,
    bottom: position.y + position.height,
  };
  
  // 🔧 Debug: 仅菜单元素转换调试
  const isMenuElement = element.category === 'menu' || element.content_desc === '菜单' || 
                       element.id === 'element_71' || element.description === '菜单';
  
  // 🔧 Debug: "通讯录"元素转换调试
  const isContactElement = element.text?.includes('通讯录') || element.contentDesc?.includes('通讯录') ||
                          element.description?.includes('通讯录');
  
  if (isMenuElement || isContactElement) {
    console.log(`🎯 [convertVisualToUIElement] ${isContactElement ? '通讯录' : '菜单'}元素转换:`, {
      原始id: element.id,
      转换后id: backendId,
      text: element.text,
      content_desc: element.content_desc || element.contentDesc,
      clickable: element.clickable,
      category: element.category,
      description: element.description,
      type: element.type,
      originalPosition: element.position,
      resourceId: element.resourceId,
      className: element.className,
      bounds对象: bounds,
      bounds字符串: element.bounds
    });
  }
  
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
  
  const result = {
    id: backendId,  // 🔧 使用后端格式的 ID (element_N)
    element_type: element.element_type || element.type || '',
    text: element.text || '',
    bounds: bounds,  // 🔧 使用计算好的 bounds 对象
    xpath: backendId,  // 🔧 XPath 也使用后端格式
    resource_id: element.resourceId || '',  // 🔧 保留 resource_id
    class_name: element.className || '',  // 🔧 保留 class_name
    is_clickable: element.is_clickable || element.clickable || false,
    is_scrollable: element.scrollable || false,
    is_enabled: element.enabled !== false,
    is_focused: element.focused || false,
    checkable: false,
    checked: false,
    selected: element.selected || element.id === selectedId,
    password: false,
    content_desc: element.content_desc || element.contentDesc || '', // 🔧 保留 content_desc
    indexPath: element.indexPath, // 🔥 关键：保留 indexPath 用于结构匹配评分
  };

  // 🔍 调试：验证 indexPath 是否保留
  if (element.indexPath) {
    console.log('✅ [convertVisualToUIElement] indexPath 已保留:', {
      id: result.id,
      hasIndexPath: true,
      indexPathLength: element.indexPath.length
    });
  }

  return result;
}
