// src/components/adb-xml-inspector/rendering/semantic-detector.ts
// module: adb-xml-inspector | layer: domain | role: semantic-analysis
// summary: Android UI节点语义检测器 - 识别特殊布局容器和UI模式

import { UiNode } from '../types';
import { SemanticNodeType } from './types';

/**
 * Android 特殊布局容器的类名模式
 * 用于识别需要特殊层级处理的容器
 */
const LAYOUT_PATTERNS = {
  /** 抽屉布局 */
  DRAWER: [
    'androidx.drawerlayout.widget.DrawerLayout',
    'android.support.v4.widget.DrawerLayout',
    'DrawerLayout',
  ],
  
  /** 底部导航相关 */
  BOTTOM_NAV: [
    'BottomNavigationView',
    'BottomNavigation',
    'BottomTabBar',
  ],
  
  /** 顶部工具栏 */
  TOP_BAR: [
    'Toolbar',
    'ActionBar',
    'AppBarLayout',
  ],
  
  /** 对话框 */
  DIALOG: [
    'Dialog',
    'AlertDialog',
    'DialogFragment',
    'BottomSheetDialog',
  ],
  
  /** 弹出窗口 */
  POPUP: [
    'PopupWindow',
    'PopupMenu',
    'ListPopupWindow',
  ],
  
  /** 浮动按钮 */
  FAB: [
    'FloatingActionButton',
    'FAB',
  ],
  
  /** 系统UI */
  SYSTEM_UI: [
    'navigationBarBackground',
    'statusBarBackground',
  ],
} as const;

/**
 * 语义检测器
 * 负责识别Android UI节点的语义类型
 */
export class SemanticDetector {
  /**
   * 检测节点的语义类型
   */
  static detectType(node: UiNode, context?: SemanticContext): SemanticNodeType {
    const className = node.attrs['class'] || '';
    const resourceId = node.attrs['resource-id'] || '';
    const contentDesc = node.attrs['content-desc'] || '';
    
    // 1. 检查是否是 DrawerLayout
    if (this.matchesPattern(className, LAYOUT_PATTERNS.DRAWER)) {
      return SemanticNodeType.DRAWER_LAYOUT;
    }
    
    // 2. 检查是否是 DrawerLayout 的子节点
    if (context?.parentType === SemanticNodeType.DRAWER_LAYOUT) {
      // DrawerLayout 的第一个 child 是主内容，第二个是抽屉
      if (context.siblingIndex === 0) {
        return SemanticNodeType.MAIN_CONTENT;
      } else if (context.siblingIndex >= 1) {
        return SemanticNodeType.DRAWER_CONTENT;
      }
    }
    
    // 3. 检查底部导航
    if (this.isBottomNavigation(node, className, resourceId, contentDesc)) {
      return SemanticNodeType.BOTTOM_NAVIGATION;
    }
    
    // 4. 检查顶部工具栏
    if (this.matchesPattern(className, LAYOUT_PATTERNS.TOP_BAR)) {
      return SemanticNodeType.TOP_BAR;
    }
    
    // 5. 检查对话框
    if (this.matchesPattern(className, LAYOUT_PATTERNS.DIALOG)) {
      return SemanticNodeType.DIALOG;
    }
    
    // 6. 检查弹出窗口
    if (this.matchesPattern(className, LAYOUT_PATTERNS.POPUP)) {
      return SemanticNodeType.POPUP;
    }
    
    // 7. 检查浮动按钮
    if (this.matchesPattern(className, LAYOUT_PATTERNS.FAB)) {
      return SemanticNodeType.FAB;
    }
    
    // 8. 检查系统UI
    if (this.matchesPattern(resourceId, LAYOUT_PATTERNS.SYSTEM_UI)) {
      return SemanticNodeType.SYSTEM_UI;
    }
    
    return SemanticNodeType.NORMAL;
  }
  
  /**
   * 判断节点是否应该被视为覆盖层
   */
  static isOverlayType(type: SemanticNodeType): boolean {
    return [
      SemanticNodeType.DRAWER_CONTENT,
      SemanticNodeType.DIALOG,
      SemanticNodeType.POPUP,
      SemanticNodeType.FAB,
      SemanticNodeType.BOTTOM_NAVIGATION,
    ].includes(type);
  }
  
  /**
   * 获取语义类型的基础z-index偏移量
   * 用于确保特定类型的节点始终在正确的层级
   */
  static getZIndexBoost(type: SemanticNodeType): number {
    switch (type) {
      case SemanticNodeType.SYSTEM_UI:
        return 100000; // 系统UI始终最顶层
      case SemanticNodeType.DIALOG:
        return 50000;  // 对话框高于一切应用内容
      case SemanticNodeType.POPUP:
        return 40000;  // 弹出窗口
      case SemanticNodeType.DRAWER_CONTENT:
        return 30000;  // 抽屉内容覆盖主内容
      case SemanticNodeType.FAB:
        return 20000;  // 浮动按钮
      case SemanticNodeType.BOTTOM_NAVIGATION:
        return 10000;  // 底部导航
      case SemanticNodeType.TOP_BAR:
        return 5000;   // 顶部栏
      default:
        return 0;
    }
  }
  
  // ============ 私有辅助方法 ============
  
  private static matchesPattern(value: string, patterns: readonly string[]): boolean {
    const lowerValue = value.toLowerCase();
    return patterns.some(pattern => lowerValue.includes(pattern.toLowerCase()));
  }
  
  private static isBottomNavigation(
    node: UiNode, 
    className: string, 
    resourceId: string,
    contentDesc: string
  ): boolean {
    // 通过类名匹配
    if (this.matchesPattern(className, LAYOUT_PATTERNS.BOTTOM_NAV)) {
      return true;
    }
    
    // 通过位置和内容推断（常见的底部导航文字）
    const bottomNavTexts = ['首页', '发现', '消息', '我', '市集', '购物', '发布'];
    const bounds = node.attrs['bounds'];
    
    if (bounds) {
      // 检查是否在屏幕底部区域
      const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (match) {
        const y1 = parseInt(match[2]);
        const y2 = parseInt(match[4]);
        // 假设屏幕高度约2400，底部导航通常在最后200像素
        if (y1 > 2000 && y2 <= 2400) {
          // 检查子节点是否包含典型的导航文字
          const hasNavText = this.hasBottomNavContent(node, bottomNavTexts);
          if (hasNavText) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  private static hasBottomNavContent(node: UiNode, navTexts: string[]): boolean {
    const text = node.attrs['text'] || '';
    const desc = node.attrs['content-desc'] || '';
    
    if (navTexts.some(t => text.includes(t) || desc.includes(t))) {
      return true;
    }
    
    for (const child of node.children) {
      if (this.hasBottomNavContent(child, navTexts)) {
        return true;
      }
    }
    
    return false;
  }
}

/**
 * 语义检测上下文
 * 提供父节点信息以支持上下文相关的检测
 */
export interface SemanticContext {
  /** 父节点的语义类型 */
  parentType?: SemanticNodeType;
  
  /** 在父节点中的索引位置 */
  siblingIndex: number;
  
  /** 节点深度 */
  depth: number;
}
