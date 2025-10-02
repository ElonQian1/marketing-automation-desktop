/**
 * 元素发现功能的类型定义
 */

import type React from 'react';
import type { UIElement } from '../../../../api/universalUIAPI';

// 发现的元素信息
export interface DiscoveredElement {
  element: UIElement;
  relationship: 'parent' | 'child' | 'sibling' | 'self' | 'direct-parent' | 'grandparent' | 'ancestor' | 'direct-child' | 'grandchild' | 'descendant';
  confidence: number; // 0-1，匹配置信度
  reason: string; // 发现原因描述
  hasText: boolean; // 是否包含文本
  isClickable: boolean; // 是否可点击
  depth?: number; // 层级深度（可选）
  path?: string; // 元素路径（可选）
}

// 元素发现结果
export interface ElementDiscoveryResult {
  originalElement: UIElement;
  selfElement: DiscoveredElement; // 自己元素
  parentElements: DiscoveredElement[];
  childElements: DiscoveredElement[];
  siblingElements: DiscoveredElement[];
  recommendedMatches: DiscoveredElement[]; // 推荐的匹配元素
}

// 发现配置选项
export interface DiscoveryOptions {
  includeParents: boolean;
  includeChildren: boolean;
  includeSiblings: boolean;
  maxDepth: number; // 最大搜索深度
  minConfidence: number; // 最小置信度阈值
  prioritizeText: boolean; // 优先考虑包含文本的元素
  prioritizeClickable: boolean; // 优先考虑可点击的元素
  prioritizeTextElements: boolean; // 向后兼容
  prioritizeClickableElements: boolean; // 向后兼容
}

// 元素卡片属性
export interface ElementCardProps {
  element: DiscoveredElement;
  onSelect: (element: DiscoveredElement) => void;
  onPreview?: (element: DiscoveredElement) => void;
  onShowDetails?: (element: DiscoveredElement) => void;
  compact?: boolean;
  style?: React.CSSProperties;
}

// 子元素卡片额外属性
export interface ChildElementCardProps extends ElementCardProps {
  onShowDetails?: (element: DiscoveredElement) => void;
}

// 发现模态框属性
export interface ElementDiscoveryModalProps {
  visible: boolean;
  originalElement: UIElement | null;
  allElements: UIElement[];
  onClose: () => void;
  onElementSelect: (element: UIElement) => void;
  options?: Partial<DiscoveryOptions>;
}