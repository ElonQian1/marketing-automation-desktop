// src/components/adb-xml-inspector/rendering/types.ts
// module: adb-xml-inspector | layer: domain | role: rendering-types
// summary: 定义渲染层相关的类型和接口

import { UiNode, ElementBounds } from '../types';

/**
 * 渲染节点 - 包含可视化渲染所需的所有信息
 * 
 * 设计原则：
 * - 将UI节点与渲染信息解耦
 * - 提供完整的层级上下文信息
 * - 支持复杂的Android视图层级
 */
export interface RenderableNode {
  /** 原始UI节点引用 */
  node: UiNode;
  
  /** 解析后的边界信息 */
  bounds: ElementBounds;
  
  /** 
   * 渲染层级 (z-index)
   * - 数值越大，越靠近用户（在最上层）
   * - 计算规则考虑 XML 文档顺序和特殊布局容器
   */
  zIndex: number;
  
  /** 节点深度（在树中的层级，根节点为0） */
  depth: number;
  
  /** 同级索引（在父节点children中的位置） */
  siblingIndex: number;
  
  /** 
   * 是否是覆盖层（如 DrawerLayout 的抽屉、Dialog、PopupWindow 等）
   * 覆盖层需要特殊的 z-index 处理
   */
  isOverlay: boolean;
  
  /** 节点的语义分类 */
  semanticType: SemanticNodeType;
}

/**
 * 语义节点类型
 * 用于识别特殊的Android布局容器，以便正确处理层级关系
 */
export enum SemanticNodeType {
  /** 普通节点 */
  NORMAL = 'normal',
  
  /** 抽屉布局容器 (DrawerLayout) */
  DRAWER_LAYOUT = 'drawer_layout',
  
  /** 抽屉内容（DrawerLayout的第二个child通常是抽屉） */
  DRAWER_CONTENT = 'drawer_content',
  
  /** 主内容区域（DrawerLayout的第一个child） */
  MAIN_CONTENT = 'main_content',
  
  /** 底部导航栏 */
  BOTTOM_NAVIGATION = 'bottom_navigation',
  
  /** 顶部导航栏/工具栏 */
  TOP_BAR = 'top_bar',
  
  /** 对话框 */
  DIALOG = 'dialog',
  
  /** 弹出窗口 */
  POPUP = 'popup',
  
  /** 浮动按钮 */
  FAB = 'fab',
  
  /** 系统UI（状态栏、导航栏背景等） */
  SYSTEM_UI = 'system_ui',
}

/**
 * 层级分析结果
 */
export interface LayerAnalysisResult {
  /** 按渲染顺序排列的节点（先底层后顶层） */
  renderOrder: RenderableNode[];
  
  /** 屏幕尺寸 */
  screenSize: { width: number; height: number };
  
  /** 检测到的覆盖层数量 */
  overlayCount: number;
  
  /** 分析元数据 */
  metadata: {
    totalNodes: number;
    clickableNodes: number;
    hasDrawerLayout: boolean;
    hasBottomNav: boolean;
  };
}

/**
 * 节点点击测试选项
 */
export interface HitTestOptions {
  /** 坐标点 */
  point: { x: number; y: number };
  
  /** 是否只返回最顶层节点（默认true） */
  topMostOnly?: boolean;
  
  /** 是否过滤不可点击的节点（默认false） */
  clickableOnly?: boolean;
}

/**
 * 节点点击测试结果
 */
export interface HitTestResult {
  /** 命中的节点（按层级从高到低排序） */
  hits: RenderableNode[];
  
  /** 最顶层命中的节点 */
  topMost: RenderableNode | null;
}
