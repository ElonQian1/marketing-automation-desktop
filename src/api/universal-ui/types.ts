// src/api/universal-ui/types.ts
// module: api | layer: api | role: universal-ui-types
// summary: Universal UI API类型定义，包含所有UI相关的接口和类型

/**
 * Universal UI API 类型定义
 * 包含所有 Universal UI 相关的接口和类型
 */

// 元素边界信息
export interface ElementBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// 元素上下文信息（简化版本，避免循环引用）
export interface UIElementContext {
  id: string;
  text: string;
  class_name?: string;
  resource_id?: string;
  is_clickable: boolean;
  bounds: ElementBounds;
  element_type: string;
}

// 相对位置信息
export interface RelativePosition {
  relative_to_anchor: {
    anchor_text: string;
    direction: 'left' | 'right' | 'above' | 'below' | 'inside';
    distance_px: number;
    distance_percent: number;
  };
}

// 元素上下文指纹 - 用于唯一识别元素的关键特征组合
export interface ElementContextFingerprint {
  // 锚点元素信息（用于定位的关键文本，如用户名）
  anchor_elements: {
    text: string;
    element_type: string;
    relative_direction: 'parent' | 'sibling' | 'child';
    distance: number; // 层级距离或位置距离
  }[];
  
  // 容器特征
  container_signature: {
    class_name?: string;
    resource_id?: string;
    child_count: number;
    container_bounds: ElementBounds;
  };
  
  // 兄弟元素特征模式（用于在动态列表中识别）
  sibling_pattern: {
    total_siblings: number;
    clickable_siblings: number;
    text_siblings: string[]; // 兄弟元素的文本内容
    position_in_siblings: number; // 在兄弟元素中的位置
  };
  
  // 生成时间戳
  generated_at: string;
  
  // 匹配权重配置
  matching_weights: {
    anchor_weight: number;    // 锚点匹配权重
    container_weight: number; // 容器匹配权重
    sibling_weight: number;   // 兄弟模式权重
    position_weight: number;  // 位置权重
  };
}

// UI元素接口
export interface UIElement {
  id: string;
  element_type: string;
  text: string;
  bounds: ElementBounds;
  xpath: string;
  resource_id?: string;
  class_name?: string;
  is_clickable: boolean;  // 修正字段名，匹配Rust后端
  is_scrollable: boolean; // 修正字段名，匹配Rust后端
  is_enabled: boolean;    // 修正字段名，匹配Rust后端
  is_focused: boolean;    // 添加缺失的字段
  checkable: boolean;
  checked: boolean;
  selected: boolean;
  password: boolean;
  content_desc: string; // 修正：与Rust后端保持一致，为必需字段
  
  // 🎯 绝对路径定位（用于精确定位元素，替代不可靠的 element_N）
  indexPath?: number[];  // 🎯 新增：绝对下标链，如 [0,0,0,5,2]
  
  // 🆕 上下文关系信息 - 用于精准定位
  parent_element?: UIElementContext;           // 父元素信息
  sibling_elements?: UIElementContext[];       // 兄弟元素信息（同级）
  child_elements?: UIElementContext[];         // 子元素信息
  context_fingerprint?: ElementContextFingerprint; // 上下文指纹
  relative_position?: RelativePosition;        // 相对位置信息
  
  // 🆕 直接子元素（与 Rust 后端保持一致）
  children?: UIElement[];                      // 直接子元素数组（可选）
}

// 智能导航相关类型定义
export interface SmartNavigationParams {
  navigation_type: string;
  target_button: string;
  click_action: string;
  app_name?: string;
  position_ratio?: {
    x_start: number;
    x_end: number;
    y_start: number;
    y_end: number;
  };
  custom_config?: any;
}

export interface UniversalClickResult {
  success: boolean;
  element_found: boolean;
  click_executed: boolean;
  execution_time_ms: number;
  mode: string;
  error_message?: string;
  found_element?: {
    text: string;
    position: string;
  };
}

export interface NavigationPresets {
  apps: string[];
  navigation_types: string[];
  common_buttons: string[];
}

// 页面捕获结果（后端格式）
interface UniversalPageCaptureResultBackend {
  xml_content: string;
  xml_file_name: string;
  xml_relative_path: string;
  xml_absolute_path: string;
  screenshot_file_name?: string | null;
  screenshot_relative_path?: string | null;
  screenshot_absolute_path?: string | null;
}

// 页面捕获结果（前端格式）
export interface UniversalPageCaptureResult {
  xmlContent: string;
  xmlFileName: string;
  xmlRelativePath: string;
  xmlAbsolutePath: string;
  screenshotFileName?: string;
  screenshotRelativePath?: string;
  screenshotAbsolutePath?: string;
}

export type { UniversalPageCaptureResultBackend };