// src/modules/structural-matching/ui/components/visual-preview/floating-window/types/index.ts
// module: structural-matching | layer: ui | role: types
// summary: 悬浮可视化窗口的类型定义

import type { VisualUIElement } from "../../../../../../components/universal-ui/views/visual-view/types/visual-types";

/**
 * 窗口状态接口
 */
export interface WindowState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

/**
 * 步骤卡片数据接口
 */
export interface StepCardData {
  /** 原始元素数据 */
  original_element?: VisualUIElement;
  /** XML缓存ID */
  xmlCacheId?: string;
  /** 元素上下文信息 */
  elementContext?: {
    xpath?: string;
    bounds?: string;
    text?: string;
    resourceId?: string;
    className?: string;
  };
}

/**
 * 元素结构树数据接口
 */
export interface ElementTreeData {
  /** 根元素信息 */
  rootElement: VisualUIElement;
  /** 子元素列表 */
  childElements: VisualUIElement[];
  /** 元素边界信息 */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 截图裁剪配置接口
 */
export interface CropConfig {
  /** 裁剪区域 */
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 缩放比例 */
  scale: number;
  /** 偏移量 */
  offset: {
    x: number;
    y: number;
  };
}

/**
 * 悬浮窗口主组件Props
 */
export interface FloatingVisualWindowProps {
  /** 是否显示 */
  visible: boolean;
  /** 步骤卡片数据 */
  stepCardData?: StepCardData;
  /** 高亮元素ID */
  highlightedElementId?: string | null;
  /** 初始位置 */
  initialPosition?: { x: number; y: number };
  /** 关闭回调 */
  onClose?: () => void;
}

/**
 * 数据加载状态接口
 */
export interface LoadingState {
  isLoading: boolean;
  loadingText: string;
  error?: string;
}