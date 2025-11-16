// src/components/universal-ui/types/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Universal UI 组件共享类型定义
 * 为可视化视图、列表视图、树形视图提供统一的数据接口
 */

import React from 'react';
import { UIElement } from '../../../api/universalUIAPI';

// ========== 基础类型定义 ==========

/**
 * 视觉UI元素接口
 * 用于可视化视图和列表视图
 */
export interface VisualUIElement {
  /** 元素唯一标识 */
  id: string;
  /** 显示文本 */
  text: string;
  /** 元素描述 */
  description: string;
  /** 元素类型 */
  type: string;
  /** 元素分类 */
  category: string;
  /** 元素位置信息 */
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 是否可点击 */
  clickable: boolean;
  /** 重要程度 */
  importance: 'high' | 'medium' | 'low';
  /** 用户友好名称 */
  userFriendlyName: string;
  /** 是否可滚动 */
  scrollable?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 是否选中 */
  selected?: boolean;
  /** 是否聚焦 */
  focused?: boolean;
  /** 原始元素数据 */
  element_type?: string;
  /** 是否可点击 (兼容性) */
  is_clickable?: boolean;
  /** 内容描述 (兼容性) */
  content_desc?: string;
  /** 🔧 新增：Android XML关键属性 */
  resourceId?: string;
  contentDesc?: string;
  className?: string;
  bounds?: string; // 原始bounds字符串
  xmlIndex?: number; // 原始 XML 节点索引
  indexPath?: number[]; // 🎯 绝对下标链（用于静态定位，如 [0,0,0,5,2]）
}

/**
 * 元素分类定义
 * 用于组织和展示不同类型的UI元素
 */
export interface VisualElementCategory {
  /** 分类名称 */
  name: string;
  /** 分类图标 */
  icon: React.ReactNode;
  /** 分类颜色 */
  color: string;
  /** 分类描述 */
  description: string;
  /** 该分类下的元素列表 */
  elements: VisualUIElement[];
}

/**
 * 元素统计信息
 * 用于显示页面元素的统计数据
 */
export interface ElementStatistics {
  /** 总元素数 */
  total: number;
  /** 可交互元素数 */
  interactive: number;
  /** 元素类型数 */
  types: number;
  /** 按类型分组的元素 */
  grouped: Record<string, VisualUIElement[]>;
}

// ========== 过滤配置（可视化） ==========

/**
 * 可视化元素过滤配置
 * 仅作用于前端展示层，不影响后台解析。
 */
export interface VisualFilterConfig {
  /** 仅显示可点击元素（或被视为可点击的Button类） */
  onlyClickable: boolean;
  /** 将类名包含“Button”的元素视为可点击 */
  treatButtonAsClickable: boolean;
  /** 需要存在 text 或 content-desc */
  requireTextOrDesc: boolean;
  /** 最小宽度（像素） */
  minWidth: number;
  /** 最小高度（像素） */
  minHeight: number;
  /** 类名包含关键字（任意一个命中即通过） */
  includeClasses: string[];
  /** 类名排除关键字（任意一个命中即排除） */
  excludeClasses: string[];
}

/** 默认过滤配置 */
export const defaultVisualFilterConfig: VisualFilterConfig = {
  onlyClickable: false,
  treatButtonAsClickable: true,
  requireTextOrDesc: false,
  minWidth: 1,
  minHeight: 1,
  includeClasses: [],
  excludeClasses: [],
};

// ========== 组件 Props 接口 ==========

/**
 * 基础视图组件 Props
 */
export interface BaseViewProps {
  /** UI元素列表 */
  elements: UIElement[];
  /** 元素选择回调 */
  onElementSelect?: (element: UIElement) => void;
  /** 当前选中的元素ID */
  selectedElementId?: string;
  /** 搜索关键词 */
  searchText?: string;
  /** 选中的分类 */
  selectedCategory?: string;
  /** 是否只显示可点击元素 */
  showOnlyClickable?: boolean;
  /** 元素分类列表 */
  categories?: VisualElementCategory[];
  /** 统计信息 */
  stats?: ElementStatistics;
}

/**
 * 可视化视图 Props
 */
export interface VisualViewProps extends BaseViewProps {
  /** 是否显示网格辅助线 */
  showGrid?: boolean;
  /** 缩放比例 */
  scale?: number;
  /** 设备尺寸 */
  deviceSize?: {
    width: number;
    height: number;
  };
}

/**
 * 列表视图 Props
 */
export interface ListViewProps extends BaseViewProps {
  /** 每页显示数量 */
  pageSize?: number;
  /** 当前页码 */
  currentPage?: number;
  /** 排序方式 */
  sortBy?: 'name' | 'type' | 'importance' | 'position';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 树形视图 Props
 */
export interface TreeViewProps {
  /** UI元素列表 */
  elements: UIElement[];
  /** 元素选择回调 */
  onElementSelect?: (element: UIElement) => void;
  /** 选中的元素ID */
  selectedElementId?: string;
  /** 是否展开所有节点 */
  defaultExpandAll?: boolean;
}

// ========== 视图模式枚举 ==========

/**
 * 视图模式
 */
export enum ViewMode {
  /** 可视化视图 */
  VISUAL = 'visual',
  /** 列表视图 */
  LIST = 'list',
  /** 树形视图 */
  TREE = 'tree'
}

// ========== 工具类型 ==========

/**
 * 元素转换函数类型
 */
export type ElementTransformer = (element: UIElement) => VisualUIElement;

/**
 * 元素过滤函数类型
 */
export type ElementFilter = (element: UIElement) => boolean;

/**
 * 元素分类函数类型
 */
export type ElementCategorizer = (element: UIElement) => string;

/**
 * UIElement转换为VisualUIElement的工具函数
 */
export const transformUIElement = (element: UIElement): VisualUIElement => {
  // 🔧 DEBUG: 检查所有元素的可点击属性，重点关注菜单
  if (element.content_desc === '菜单' || element.text?.includes('菜单') || JSON.stringify(element).includes('菜单')) {
    console.log('🔍 [transformUIElement] 菜单相关元素:', {
      id: element.id,
      text: element.text,
      content_desc: element.content_desc,
      is_clickable: element.is_clickable,
      class_name: element.class_name,
      element_type: element.element_type,
      bounds: element.bounds,
      '完整对象': element
    });
  }
  
  // 🔧 修复：兼容多种clickable字段名，确保XML中真正可点击的元素不会被过滤
  const isClickable = element.is_clickable === true || 
                      (element as any).clickable === true ||
                      element.class_name?.includes('Button');
  
  // 🔧 修复：使用新的分类逻辑，确保菜单按钮被正确识别
  let categoryKey = 'others'; // 默认分类
  
  // 检查菜单按钮 - 兼容多种字段
  const contentDesc = element.content_desc || (element as any).contentDesc || '';
  const text = element.text || '';
  
  if (contentDesc === '菜单' || contentDesc === '设置' || contentDesc === '更多' ||
      text === '菜单' || text === '设置' || text === '更多') {
    categoryKey = 'menu';
  }
  // 检查导航元素
  else if (element.content_desc?.includes('导航') || 
           element.content_desc?.includes('返回') || 
           element.content_desc?.includes('后退')) {
    categoryKey = 'navigation';
  }
  // 检查按钮
  else if (isClickable) {
    categoryKey = 'buttons';
  }
  // 检查文本
  else if (element.text && element.text.trim()) {
    categoryKey = 'text';
  }
  // 检查输入框
  else if (element.element_type?.toLowerCase().includes('edit') || 
           element.class_name?.toLowerCase().includes('edit')) {
    categoryKey = 'inputs';
  }
  // 检查图片
  else if (element.element_type?.toLowerCase().includes('image')) {
    categoryKey = 'images';
  }
  
  const result = {
    id: element.id,
    text: element.text || '',
    description: element.content_desc || element.resource_id || element.class_name || '',
    type: element.element_type || element.class_name || 'Unknown',
    category: categoryKey,
    position: {
      x: element.bounds.left,
      y: element.bounds.top,
      width: element.bounds.right - element.bounds.left,
      height: element.bounds.bottom - element.bounds.top,
    },
    clickable: isClickable,
    scrollable: element.is_scrollable === true,
    importance: (isClickable ? 'high' : element.text ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    userFriendlyName: element.text || element.content_desc || element.resource_id || '未命名元素',
    enabled: element.is_enabled !== false,
    selected: element.selected === true,
    element_type: element.element_type,
    is_clickable: element.is_clickable,
    content_desc: element.content_desc,
    // 🔥 关键修复：保留 indexPath 以支持精确元素定位
    indexPath: element.indexPath
  };

  // 🔧 DEBUG: 输出转换结果，特别关注菜单元素
  if (contentDesc === '菜单' || text === '菜单') {
    console.log('✅ [transformUIElement] 菜单元素转换完成:', {
      原始clickable字段: {
        is_clickable: element.is_clickable,
        clickable: (element as any).clickable
      },
      最终clickable: result.clickable,
      category: result.category,
      description: result.description
    });
  }

  return result;
};

// 🔧 旧的categorizeElement函数已移除，统一使用transformUIElement中的新分类逻辑
