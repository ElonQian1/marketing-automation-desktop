// src/components/universal-ui/views/visual-view/types/visual-types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// VisualElementView 相关桥接类型
// 复用统一的 VisualUIElement 类型，避免重复定义造成不兼容
export type { VisualUIElement } from "../../../types";

// 提供与旧 UIElement 桥接所需最小结构（方便独立测试转换函数）
export interface BridgeUIElementBounds { left: number; top: number; right: number; bottom: number; }
export interface BridgeUIElement {
  id: string;
  element_type: string;
  text: string;
  bounds: BridgeUIElementBounds;
  xpath: string;
  resource_id: string;
  class_name: string;
  is_clickable: boolean;
  is_scrollable: boolean;
  is_enabled: boolean;
  is_focused: boolean;
  checkable: boolean;
  checked: boolean;
  selected: boolean;
  password: boolean;
  content_desc: string;
  // 🔥 关键修复：添加 child_elements 以支持结构匹配
  child_elements?: BridgeUIElement[];
  indexPath?: number[];
  xmlCacheId?: string;
}
