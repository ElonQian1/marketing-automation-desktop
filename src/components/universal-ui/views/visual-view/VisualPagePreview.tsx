// src/components/universal-ui/views/visual-view/VisualPagePreview.tsx
// module: universal-ui-visual-view | layer: ui | role: page-preview
// summary: 可视化视图的页面预览组件 - 展示解析后的UI元素，支持语义层级渲染
// 
// 📍 调用链: UniversalPageFinderModal → VisualElementView → VisualPagePreview
// 📍 用途: 智能页面查找器的【可视化模式】中的页面预览
// 📍 数据类型: VisualUIElement[] (解析转换后的元素数组)
// ⚠️ 注意: 与以下组件功能相似但完全独立：
//    - adb-xml-inspector/AdbXmlInspector.tsx 内部的 ScreenPreview（调试工具用）
//    - grid-view/ScreenPreview.tsx（网格模式用，数据类型不同）

/**
 * 可视化页面预览组件
 * 从 UniversalPageFinderModal 的 renderPagePreview 函数提取
 */

import React, { useMemo } from "react";
import { Typography } from "antd";
import type { VisualUIElement, VisualElementCategory } from "../../types";
import type { UIElement } from "../../../../api/universalUIAPI";
import { useElementSelectionManager } from "../../element-selection";
import {
  calculateCanvasScale,
  analyzeAppAndPageInfo,
  calculateScaledElementBounds,
  generateElementTooltip,
  shouldShowElementLabel,
  calculateLabelFontSize,
  type AppPageInfo,
} from "./VisualViewUtils";

const { Text, Title } = Typography;

// ============================================================================
// 语义层级分析 - 用于正确处理 DrawerLayout、底部导航等覆盖层
// ============================================================================

/**
 * Android 布局语义类型
 */
enum SemanticNodeType {
  NORMAL = 0,           // 普通节点
  DRAWER_MAIN = 1,      // DrawerLayout 主内容 (第一个子元素)
  DRAWER_CONTENT = 2,   // DrawerLayout 抽屉内容 (覆盖层)
  BOTTOM_NAV = 3,       // 底部导航栏
  TAB_BAR = 4,          // 顶部 Tab 栏
  DIALOG = 5,           // 对话框/弹窗
  SYSTEM_UI = 6,        // 系统 UI (状态栏、导航栏)
}

/**
 * DrawerLayout 信息 - 从 XML 中解析
 */
interface DrawerLayoutInfo {
  /** DrawerLayout 的 indexPath */
  path: number[];
  /** 主内容的 indexPath 前缀 (第一个子元素) */
  mainContentPrefix: number[];
  /** 抽屉内容的 indexPath 前缀列表 (第二个及后续子元素) */
  drawerPrefixes: number[][];
}

/**
 * 从元素列表中查找 DrawerLayout 信息
 * 🚀 改进：直接从 VisualUIElement 列表查找，确保 indexPath 与渲染元素完全一致
 * 避免了 XML 解析与 Rust 解析不一致的问题
 */
function findDrawerLayoutsFromElements(elements: VisualUIElement[]): DrawerLayoutInfo[] {
  const drawerLayouts: DrawerLayoutInfo[] = [];
  
  // 1. 找到所有 DrawerLayout 元素
  const drawerElements = elements.filter(e => 
    e.className?.includes('DrawerLayout') && e.indexPath
  );
  
  for (const drawer of drawerElements) {
    if (!drawer.indexPath) continue;
    
    const parentPath = drawer.indexPath;
    const parentDepth = parentPath.length;
    
    // 2. 找到该 DrawerLayout 的所有直接子节点
    // 直接子节点特征：路径以父路径开头，且长度恰好 +1
    const children = elements.filter(e => {
      if (!e.indexPath || e.indexPath.length !== parentDepth + 1) return false;
      // 检查前缀匹配
      for (let i = 0; i < parentDepth; i++) {
        if (e.indexPath[i] !== parentPath[i]) return false;
      }
      return true;
    });
    
    // 3. 按最后一个索引排序 (DOM 顺序)
    children.sort((a, b) => {
      const idxA = a.indexPath![parentDepth];
      const idxB = b.indexPath![parentDepth];
      return idxA - idxB;
    });
    
    if (children.length >= 2) {
      // 第一个子节点是主内容
      const mainContent = children[0];
      // 后续子节点是抽屉内容
      const drawerContents = children.slice(1);
      
      drawerLayouts.push({
        path: parentPath,
        mainContentPrefix: mainContent.indexPath!,
        drawerPrefixes: drawerContents.map(c => c.indexPath!),
      });
      
      console.log('[VisualPagePreview] 📦 发现 DrawerLayout:', {
        path: parentPath,
        main: mainContent.indexPath,
        drawers: drawerContents.map(c => c.indexPath)
      });
    }
  }
  
  return drawerLayouts;
}

/**
 * 检查 indexPath 是否以指定前缀开头
 */
function startsWithPath(indexPath: number[] | undefined, prefix: number[]): boolean {
  if (!indexPath || indexPath.length < prefix.length) return false;
  return prefix.every((v, i) => indexPath[i] === v);
}

/**
 * 语义类型对应的 z-index 提升值
 */
const SEMANTIC_Z_BOOST: Record<SemanticNodeType, number> = {
  [SemanticNodeType.NORMAL]: 0,
  [SemanticNodeType.DRAWER_MAIN]: 0,
  [SemanticNodeType.DRAWER_CONTENT]: 30000,  // 抽屉在主内容之上
  [SemanticNodeType.BOTTOM_NAV]: 10000,      // 底部导航较高
  [SemanticNodeType.TAB_BAR]: 8000,          // Tab 栏
  [SemanticNodeType.DIALOG]: 50000,          // 对话框最高
  [SemanticNodeType.SYSTEM_UI]: 100000,      // 系统 UI
};

/**
 * 检测元素的语义类型（使用预解析的 DrawerLayout 信息）
 */
function detectSemanticType(
  element: VisualUIElement,
  drawerLayouts: DrawerLayoutInfo[]
): SemanticNodeType {
  const className = element.className || '';
  const indexPath = element.indexPath;
  
  // 1. 检测系统 UI
  if (className.includes('StatusBar') || className.includes('NavigationBar')) {
    return SemanticNodeType.SYSTEM_UI;
  }
  
  // 2. 检测对话框
  if (className.includes('Dialog') || className.includes('AlertDialog') || className.includes('PopupWindow')) {
    return SemanticNodeType.DIALOG;
  }
  
  // 3. 检测底部导航
  if (className.includes('BottomNavigation') || className.includes('BottomBar')) {
    return SemanticNodeType.BOTTOM_NAV;
  }
  
  // 4. 检测 Tab 栏
  if (className.includes('TabLayout') || className.includes('TabBar')) {
    return SemanticNodeType.TAB_BAR;
  }
  
  // 5. 使用预解析的 DrawerLayout 信息检测抽屉
  if (indexPath && drawerLayouts.length > 0) {
    for (const drawer of drawerLayouts) {
      // 检查是否是抽屉内容（第二个及后续子元素的后代）
      for (const drawerPrefix of drawer.drawerPrefixes) {
        if (startsWithPath(indexPath, drawerPrefix)) {
          return SemanticNodeType.DRAWER_CONTENT;
        }
      }
      // 检查是否是主内容（第一个子元素的后代）
      if (startsWithPath(indexPath, drawer.mainContentPrefix)) {
        return SemanticNodeType.DRAWER_MAIN;
      }
    }
  }
  
  // 6. 直接检测自身是否是抽屉相关（回退方案）
  if (className.includes('NavigationView') || 
      className.includes('DrawerContent') ||
      className.includes('Drawer')) {
    // 检查位置：如果靠左或靠右边缘，可能是侧边抽屉
    const pos = element.position;
    if (pos && (pos.x <= 0 || pos.x + pos.width >= 1080)) {
      return SemanticNodeType.DRAWER_CONTENT;
    }
  }
  
  return SemanticNodeType.NORMAL;
}

/**
 * 计算元素的渲染 z-index
 * 
 * 策略 A：回归自然流
 * 不再进行复杂的 z-index 计算，而是依赖 DOM 顺序。
 * 此函数现在仅用于返回语义类型和是否为覆盖层，z-index 将由列表索引决定。
 */
function calculateElementZIndex(
  element: VisualUIElement,
  drawerLayouts: DrawerLayoutInfo[],
  elementIndex: number
): { zIndex: number; semanticType: SemanticNodeType; isOverlay: boolean } {
  // 仅检测语义类型，不再计算复杂的 z-index
  const semanticType = detectSemanticType(element, drawerLayouts);
  
  const isOverlay = semanticType === SemanticNodeType.DRAWER_CONTENT || 
                    semanticType === SemanticNodeType.DIALOG ||
                    semanticType === SemanticNodeType.SYSTEM_UI;
  
  return { 
    zIndex: 0, // 占位符，实际 z-index 由 map 索引决定
    semanticType, 
    isOverlay 
  };
}

/**
 * 带层级信息的可渲染元素
 */
interface RenderableVisualElement {
  element: VisualUIElement;
  zIndex: number;
  semanticType: SemanticNodeType;
  isOverlay: boolean;
}

interface VisualPagePreviewProps {
  xmlContent: string;
  elements: VisualUIElement[];
  categories: VisualElementCategory[];
  filteredElements: VisualUIElement[];
  selectionManager: ReturnType<typeof useElementSelectionManager>;
  onElementClick: (element: VisualUIElement) => void;
  convertVisualToUIElement: (element: VisualUIElement) => UIElement;
}

export const VisualPagePreview: React.FC<VisualPagePreviewProps> = ({
  xmlContent,
  elements,
  categories,
  filteredElements,
  selectionManager,
  onElementClick,
  convertVisualToUIElement,
}) => {
  // 设备外框（bezel）内边距，让设备看起来比页面更大，但不改变页面坐标/缩放
  const DEVICE_FRAME_PADDING = 24; // px，可调
  // 如果没有元素，显示等待状态
  if (elements.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          backgroundColor: "#f9fafb",
        }}
      >
        <Text type="secondary">等待页面分析数据...</Text>
      </div>
    );
  }

  // 计算画布尺寸和缩放比例
  // 仅按宽度缩放，父容器高度自适应，尽量避免滚动
  const canvasData = calculateCanvasScale(
    elements,
    380,
    Number.MAX_SAFE_INTEGER
  );
  const { maxX, maxY, scale, scaledWidth, scaledHeight } = canvasData;

  // 智能分析APP和页面信息
  const { appName, pageName }: AppPageInfo = analyzeAppAndPageInfo(xmlContent);

  // ============================================================================
  // 从元素列表解析 DrawerLayout 信息 - 用于正确识别抽屉内容
  // ============================================================================
  const drawerLayouts = useMemo(() => {
    // 🚀 使用 elements (全量列表) 而不是 xmlContent 解析
    // 这样能保证 indexPath 的一致性
    const layouts = findDrawerLayoutsFromElements(elements);
    if (layouts.length > 0) {
      console.log('[VisualPagePreview] 检测到 DrawerLayout:', layouts.length, '个');
    }
    return layouts;
  }, [elements]);

  // ============================================================================
  // 计算带语义层级的元素列表 - 确保 DrawerLayout 抽屉在主内容之上
  // ============================================================================
  const sortedElements = useMemo((): RenderableVisualElement[] => {
    // 策略 A：回归自然流
    // 1. 移除手动 z-index 计算，依赖 DOM 顺序（sortedElements 已经是按 XML 顺序排列的）
    // 2. 使用 pointer-events 控制交互
    return filteredElements.map((element, index): RenderableVisualElement => {
      // 仍然保留语义类型检测用于样式区分，但不再用于 z-index
      const semanticType = detectSemanticType(element, drawerLayouts);
      const isOverlay = semanticType === SemanticNodeType.DRAWER_CONTENT || 
                        semanticType === SemanticNodeType.DIALOG ||
                        semanticType === SemanticNodeType.SYSTEM_UI;
      
      // 策略 A+：自然流 + 语义层级保障
      // 虽然自然流（DOM顺序）通常是正确的，但为了防止 hover 状态下的 z-index 提升导致
      // 底层元素（如主内容区的头像）意外覆盖顶层元素（如侧边栏按钮），
      // 我们必须强制应用语义层级提升。
      const semanticBoost = SEMANTIC_Z_BOOST[semanticType] || 0;
      
      return { 
        element, 
        zIndex: index + semanticBoost, // 基础索引 + 语义提升 = 稳健的层级
        semanticType, 
        isOverlay 
      };
    });
  }, [filteredElements, drawerLayouts]);

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid #4b5563",
        borderRadius: 8,
        backgroundColor: "#1f2937",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #374151",
          backgroundColor: "#111827",
        }}
      >
        <Title
          level={5}
          style={{
            textAlign: "center",
            margin: 0,
            color: "#e5e7eb",
            fontWeight: "bold",
          }}
        >
          📱 {appName}的{pageName}
        </Title>
        <div
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#9ca3af",
            marginTop: "4px",
          }}
        >
          设备分辨率: {maxX} × {maxY} | 缩放比例: {(scale * 100).toFixed(0)}%
        </div>
      </div>

      {/* 预览区域（自适应高度，无滚动） */}
      <div
        style={{
          padding: "16px",
          position: "relative",
          backgroundColor: "#1f2937",
        }}
      >
        {/* 设备边框模拟（外框有额外 padding，不影响内层页面坐标） */}
        <div
          style={{
            width: scaledWidth + DEVICE_FRAME_PADDING * 2,
            height: scaledHeight + DEVICE_FRAME_PADDING * 2,
            margin: "0 auto",
            position: "relative",
            backgroundColor: "#000",
            borderRadius: "20px",
            padding: `${DEVICE_FRAME_PADDING}px`,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* 实际页面内容区域 */}
          <div
            style={{
              width: scaledWidth,
              height: scaledHeight,
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {sortedElements.map(({ element, zIndex: semanticZIndex, isOverlay }) => {
              const category = categories.find(
                (cat) => cat.name === element.category
              );

              // 计算元素在缩放后的位置和大小
              const scaledBounds = calculateScaledElementBounds(element, scale);

              // 获取元素的显示状态
              const displayState = selectionManager.getElementDisplayState(
                element.id
              );

              // 计算最终 z-index：语义层级 + 交互状态提升
              // 策略 A：仅在 hover/pending 时提升 z-index，否则使用自然层级
              // 修正：interactionBoost 不应超过层级之间的间隙 (30000)，否则 hover 底层元素会覆盖顶层
              const interactionBoost = displayState.isPending
                ? 2000  // pending 状态局部提升
                : displayState.isHovered
                ? 1000  // hover 局部提升
                : 0;
              const finalZIndex = semanticZIndex + interactionBoost;

              // 策略 A：使用 pointer-events 控制交互
              // 1. 可点击元素 -> auto
              // 2. 覆盖层元素 (Drawer/Dialog) -> auto (即使不可点击，也要作为背景遮挡下层)
              // 3. Pending 状态 -> auto
              const shouldBlockClicks = element.clickable || displayState.isPending || isOverlay;
              const pointerEvents = shouldBlockClicks ? 'auto' : 'none';

              return (
                <div
                  key={element.id}
                  title={generateElementTooltip(element)}
                  style={{
                    position: "absolute",
                    left: scaledBounds.left,
                    top: scaledBounds.top,
                    width: scaledBounds.width,
                    height: scaledBounds.height,
                    backgroundColor: category?.color || "#8b5cf6",
                    opacity: displayState.isHidden
                      ? 0.1
                      : displayState.isPending
                      ? 1
                      : isOverlay && !element.clickable 
                      ? 0.4 // 覆盖层背景稍微不透明一点，以便视觉上遮挡
                      : element.clickable
                      ? 0.7
                      : 0.2, // 普通非交互元素更透明
                    border: displayState.isPending
                      ? "2px solid #52c41a"
                      : displayState.isHovered
                      ? "2px solid #faad14"
                      : isOverlay
                      ? "2px dashed #f59e0b"  // 覆盖层使用琥珀色虚线
                      : element.clickable
                      ? "1px solid #fff"
                      : "1px solid rgba(255,255,255,0.1)", // 非交互元素边框更淡
                    borderRadius:
                      Math.min(scaledBounds.width, scaledBounds.height) > 10
                        ? "2px"
                        : "1px",
                    cursor: displayState.isHidden
                      ? "default"
                      : element.clickable
                      ? "pointer"
                      : "default",
                    pointerEvents: pointerEvents as any, // 关键：控制鼠标穿透
                    transition: "all 0.2s ease",
                    zIndex: finalZIndex,
                    transform: displayState.isPending
                      ? "scale(1.1)"
                      : displayState.isHovered
                      ? "scale(1.05)"
                      : "scale(1)",
                    boxShadow: displayState.isPending
                      ? "0 4px 16px rgba(82, 196, 26, 0.4)"
                      : displayState.isHovered
                      ? "0 2px 8px rgba(0,0,0,0.2)"
                      : isOverlay
                      ? "0 2px 8px rgba(245, 158, 11, 0.3)"  // 覆盖层阴影
                      : "none",
                    filter: displayState.isHidden
                      ? "grayscale(100%) blur(1px)"
                      : "none",
                  }}
                  onClick={(e) => {
                    // 如果是覆盖层背景（不可点击），阻止冒泡但不触发点击事件
                    if (isOverlay && !element.clickable) {
                      e.stopPropagation();
                      return;
                    }

                    if (!element.clickable || displayState.isHidden) return;

                    // 阻止事件冒泡
                    e.stopPropagation();

                    // 获取预览容器的位置信息
                    const previewContainer = e.currentTarget.parentElement;
                    if (!previewContainer) return;

                    const containerRect =
                      previewContainer.getBoundingClientRect();

                    // 计算相对于预览容器的点击位置
                    const relativeX = e.clientX - containerRect.left;
                    const relativeY = e.clientY - containerRect.top;

                    // 将点击位置转换回设备坐标（反向缩放）
                    const deviceX = relativeX / scale;
                    const deviceY = relativeY / scale;

                    // 获取点击位置（相对于页面的绝对位置，用于定位气泡）
                    const clickPosition = {
                      x: e.clientX, // 使用页面绝对坐标来定位气泡
                      y: e.clientY,
                    };

                    console.log(
                      "🎯 点击坐标 - 页面绝对:",
                      e.clientX,
                      e.clientY,
                      "相对容器:",
                      relativeX,
                      relativeY,
                      "设备坐标:",
                      deviceX.toFixed(0),
                      deviceY.toFixed(0)
                    );

                    // 🔥 智能容器检测：如果点击的是容器元素，尝试找到最匹配的子元素
                    let targetElement = element;
                    
                    // 检查是否为容器类型（FrameLayout, LinearLayout, RelativeLayout等）
                    const isContainerClass = /Layout|Container|ViewGroup/i.test(element.className || '');
                    const hasNoText = !element.text || element.text.trim() === '';
                    const hasNoContentDesc = !element.contentDesc || element.contentDesc.trim() === '';
                    
                    if (isContainerClass && hasNoText && hasNoContentDesc) {
                      console.warn('⚠️ [智能检测] 检测到可能点击了容器元素，尝试查找匹配的子元素', {
                        容器className: element.className,
                        容器bounds: `[${element.position?.x},${element.position?.y}][${element.position?.x + element.position?.width},${element.position?.y + element.position?.height}]`,
                        点击位置: `(${deviceX.toFixed(0)}, ${deviceY.toFixed(0)})`
                      });
                      
                      // 🔥 关键修复: 从 **所有元素** 中查找子元素,而不仅仅是 filteredElements
                      // 这样可以找到被策略2过滤掉的中层可点击元素
                      const clickableChildren = elements.filter(child => {
                        if (!child.clickable || child.id === element.id) return false;
                        
                        const childPos = child.position;
                        if (!childPos) return false;
                        
                        // ✅ 新增: 检查子元素是否在容器内
                        const containerPos = element.position;
                        if (!containerPos) return false;
                        
                        const isInContainer = 
                          childPos.x >= containerPos.x &&
                          childPos.y >= containerPos.y &&
                          (childPos.x + childPos.width) <= (containerPos.x + containerPos.width) &&
                          (childPos.y + childPos.height) <= (containerPos.y + containerPos.height);
                        
                        // 检查是否在点击位置
                        const inClickPosition = 
                          deviceX >= childPos.x && 
                          deviceX <= childPos.x + childPos.width &&
                          deviceY >= childPos.y && 
                          deviceY <= childPos.y + childPos.height;
                        
                        return isInContainer && inClickPosition;
                      });
                      
                      if (clickableChildren.length > 0) {
                        // 找到最小的匹配元素（最具体的）
                        targetElement = clickableChildren.reduce((smallest, current) => {
                          const smallestArea = (smallest.position?.width || 0) * (smallest.position?.height || 0);
                          const currentArea = (current.position?.width || 0) * (current.position?.height || 0);
                          return currentArea < smallestArea ? current : smallest;
                        });
                        
                        console.log('✅ [智能检测] 找到更精确的子元素:', {
                          原容器: element.id,
                          新元素: targetElement.id,
                          新元素text: targetElement.text,
                          新元素resourceId: targetElement.resourceId,
                          新元素bounds: `[${targetElement.position?.x},${targetElement.position?.y}][${targetElement.position?.x + targetElement.position?.width},${targetElement.position?.y + targetElement.position?.height}]`
                        });
                      } else {
                        console.warn('⚠️ [智能检测] 未找到匹配的子元素，使用原容器');
                      }
                    }

                    // 使用选择管理器处理点击（使用智能检测后的目标元素）
                    const uiElement = convertVisualToUIElement(targetElement);
                    selectionManager.handleElementClick(
                      uiElement,
                      clickPosition
                    );
                  }}
                  onMouseEnter={() => {
                    if (displayState.isHidden) return;

                    // 通知选择管理器悬停状态
                    selectionManager.handleElementHover(element.id);
                  }}
                  onMouseLeave={() => {
                    // 清除悬停状态
                    selectionManager.handleElementHover(null);
                  }}
                >
                  {/* 元素标签（仅在足够大时显示）*/}
                  {shouldShowElementLabel(
                    scaledBounds.width,
                    scaledBounds.height,
                    element.text
                  ) && (
                    <div
                      style={{
                        fontSize: calculateLabelFontSize(scaledBounds.height),
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                        padding: "1px 2px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        lineHeight: 1.2,
                      }}
                    >
                      {element.text.substring(0, 10)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 网格辅助线（可选） */}
            {scaledWidth > 200 && (
              <>
                {/* 垂直辅助线 */}
                {[0.25, 0.5, 0.75].map((ratio, index) => (
                  <div
                    key={`v-${index}`}
                    style={{
                      position: "absolute",
                      left: scaledWidth * ratio,
                      top: 0,
                      bottom: 0,
                      width: "1px",
                      backgroundColor: "rgba(156, 163, 175, 0.1)",
                      pointerEvents: "none",
                    }}
                  />
                ))}

                {/* 水平辅助线 */}
                {[0.25, 0.5, 0.75].map((ratio, index) => (
                  <div
                    key={`h-${index}`}
                    style={{
                      position: "absolute",
                      top: scaledHeight * ratio,
                      left: 0,
                      right: 0,
                      height: "1px",
                      backgroundColor: "rgba(156, 163, 175, 0.1)",
                      pointerEvents: "none",
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* 取消滚动提示：容器已根据设备高度自适应 */}
      </div>
    </div>
  );
};

export default VisualPagePreview;
