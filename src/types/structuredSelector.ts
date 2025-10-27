// src/types/structuredSelector.ts
// module: types | layer: domain | role: 结构化选择器定义
// summary: 完整的结构化选择器类型定义，支持智能自动链的稳定真机执行

/**
 * A. 元素选择器（至少1个，建议多条组成SelectorStack）
 */
export interface ElementSelectors {
  /** 全局绝对XPath路径 - 强锚点 */
  absolute_xpath?: string;
  /** 资源ID - 最稳定的选择器 */
  resource_id?: string;
  /** 文本内容 - 支持equals/contains/regex */
  text?: string;
  /** 内容描述 - 无障碍标签 */
  content_desc?: string;
  /** 类名 */
  class_name?: string;
  /** XPath前缀 + 兄弟序号 - 区分同类多实例 */
  xpath_prefix?: string;
  /** 元素在兄弟节点中的索引 */
  leaf_index?: number;
}

/**
 * B. 结构/几何辅助（只作tie-break，不能单独执行）
 */
export interface GeometricAids {
  /** 静态时的矩形边界 */
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  /** 面积占比、相对坐标signature */
  bounds_signature?: {
    /** 相对屏幕宽度的占比 0..1 */
    width_ratio: number;
    /** 相对屏幕高度的占比 0..1 */
    height_ratio: number;
    /** 相对屏幕的中心点坐标 0..1 */
    center_x_ratio: number;
    center_y_ratio: number;
  };
}

/**
 * C. 邻近锚点（可选但很实用）
 */
export interface NeighborAnchor {
  /** 锚点位置：上方/下方/左侧/右侧 */
  position: 'above' | 'below' | 'left' | 'right';
  /** 距离范围（像素） */
  distance_px: number;
  /** 锚点选择器 */
  anchor: ElementSelectors;
  /** 锚点描述 */
  description: string;
}

export interface NeighborAnchors {
  /** 邻近锚点列表 */
  neighbor_anchors?: NeighborAnchor[];
}

/**
 * D. 复核与兜底策略
 */
export interface ValidationAndFallback {
  /** 重新验证模式 */
  revalidate?: 'device_required' | 'device_optional' | 'none';
  /** 是否允许坐标兜底 */
  fallback_to_bounds?: boolean;
  /** 是否允许后端兜底策略 */
  allow_backend_fallback?: boolean;
}

/**
 * E. 执行动作
 */
export interface ActionSpec {
  /** 动作类型 */
  type: 'tap' | 'longPress' | 'swipe' | 'type' | 'wait' | 'back';
  /** 动作参数 */
  params?: {
    // tap/longPress
    press_ms?: number;
    offset_x?: number;
    offset_y?: number;
    
    // swipe
    direction?: 'up' | 'down' | 'left' | 'right';
    distance_dp?: number;
    
    // type
    text?: string;
    clear?: boolean;
    submit?: boolean;
    
    // wait/swipe duration (通用持续时间参数)
    duration_ms?: number;
  };
}

/**
 * F. 安全/阈值
 */
export interface SafetyThresholds {
  /** 最小置信度 */
  min_confidence?: number;
  /** 要求唯一性匹配 */
  require_uniqueness?: boolean;
  /** 禁止匹配全屏或容器节点 */
  forbid_fullscreen_or_container?: boolean;
}

/**
 * 完整的结构化选择器
 * 
 * 最小可用组合：absolute_xpath 或 resource_id（任一即可）+ action
 * 稳定推荐组合：absolute_xpath + xpath_prefix + leaf_index + (补充 resource_id / text)
 */
export interface StructuredSelector {
  /** A. 元素选择器组合 */
  selectors: ElementSelectors;
  
  /** B. 几何辅助信息 */
  geometric?: GeometricAids;
  
  /** C. 邻近锚点 */
  neighbors?: NeighborAnchors;
  
  /** D. 验证与兜底 */
  validation?: ValidationAndFallback;
  
  /** E. 执行动作 */
  action: ActionSpec;
  
  /** F. 安全阈值 */
  safety?: SafetyThresholds;
  
  /** 步骤ID */
  step_id: string;
  
  /** 内部选择器ID（兼容现有系统） */
  selector_id?: string;
  
  /** 选择器优先级 */
  selector_preferred?: boolean;
}

/**
 * 默认安全配置
 */
export const DEFAULT_SAFETY_CONFIG: Required<SafetyThresholds> = {
  min_confidence: 0.70,
  require_uniqueness: true,
  forbid_fullscreen_or_container: true,
};

/**
 * 默认验证配置
 */
export const DEFAULT_VALIDATION_CONFIG: Required<ValidationAndFallback> = {
  revalidate: 'device_required',
  fallback_to_bounds: false,
  allow_backend_fallback: true,
};

import type { UIElement } from '../api/universal-ui/types';

/**
 * 从UIElement提取ElementSelectors的工具函数
 */
export function extractSelectorsFromElement(element: UIElement): ElementSelectors {
  return {
    absolute_xpath: element.xpath || undefined,
    resource_id: element.resource_id || undefined,
    text: element.text || undefined,
    content_desc: element.content_desc || undefined,
    class_name: element.class_name || undefined,
    xpath_prefix: extractXPathPrefix(element.xpath),
    leaf_index: extractLeafIndex(element.xpath),
  };
}

/**
 * 提取XPath前缀（移除最后的索引部分）
 */
function extractXPathPrefix(xpath?: string): string | undefined {
  if (!xpath) return undefined;
  
  // 匹配如 "/hierarchy/.../RecyclerView[1]/TextView[3]" 中的 "/hierarchy/.../RecyclerView[1]/"
  const match = xpath.match(/^(.*\/)([^\/]+)$/);
  return match ? match[1] : undefined;
}

/**
 * 提取叶子节点索引
 */
function extractLeafIndex(xpath?: string): number | undefined {
  if (!xpath) return undefined;
  
  // 匹配如 "TextView[3]" 中的 3
  const match = xpath.match(/\[(\d+)\]$/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * 计算几何签名
 */
export function calculateBoundsSignature(
  bounds: { left: number; top: number; right: number; bottom: number },
  screenSize: { width: number; height: number }
): GeometricAids['bounds_signature'] {
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const centerX = bounds.left + width / 2;
  const centerY = bounds.top + height / 2;
  
  return {
    width_ratio: width / screenSize.width,
    height_ratio: height / screenSize.height,
    center_x_ratio: centerX / screenSize.width,
    center_y_ratio: centerY / screenSize.height,
  };
}