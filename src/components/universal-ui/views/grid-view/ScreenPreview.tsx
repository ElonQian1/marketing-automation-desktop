// src/components/universal-ui/views/grid-view/ScreenPreview.tsx
// module: universal-ui/grid-view | layer: ui | role: screen-preview
// summary: 网格视图的屏幕预览组件 - 可视化Android UI元素，支持正确的层级渲染
// 
// 📍 调用链: UniversalPageFinderModal → GridElementView → ScreenPreview
// 📍 用途: 智能页面查找器的【网格模式】中的屏幕预览
// 📍 数据类型: UiNode (原始XML树结构)
// ⚠️ 注意: 与以下组件功能相似但完全独立：
//    - adb-xml-inspector/AdbXmlInspector.tsx 内部的 ScreenPreview（调试工具用）
//    - visual-view/VisualPagePreview.tsx（可视化模式用，数据类型不同）

import React, { useEffect, useMemo, useRef, useState } from "react";
import { UiNode } from "./types";
import { parseBounds } from "./utils";
import styles from "./GridElementView.module.css";

type ScaleMode = "fit" | "actual" | "custom";

/**
 * 语义节点类型 - 用于识别需要特殊层级处理的Android布局容器
 */
enum SemanticNodeType {
  NORMAL = 'normal',
  DRAWER_LAYOUT = 'drawer_layout',
  DRAWER_CONTENT = 'drawer_content',
  MAIN_CONTENT = 'main_content',
  BOTTOM_NAVIGATION = 'bottom_navigation',
  DIALOG = 'dialog',
  POPUP = 'popup',
  SYSTEM_UI = 'system_ui',
}

/**
 * 可渲染节点 - 包含层级信息
 */
interface RenderableBox {
  n: UiNode;
  b: ReturnType<typeof parseBounds>;
  zIndex: number;
  isOverlay: boolean;
  semanticType: SemanticNodeType;
}

/**
 * 检测节点的语义类型
 */
function detectSemanticType(
  node: UiNode, 
  parentType?: SemanticNodeType,
  siblingIndex?: number
): SemanticNodeType {
  const className = node.attrs['class'] || '';
  const resourceId = node.attrs['resource-id'] || '';
  
  // DrawerLayout
  if (className.includes('DrawerLayout')) {
    return SemanticNodeType.DRAWER_LAYOUT;
  }
  
  // DrawerLayout 的子节点
  if (parentType === SemanticNodeType.DRAWER_LAYOUT) {
    if (siblingIndex === 0) return SemanticNodeType.MAIN_CONTENT;
    if (siblingIndex !== undefined && siblingIndex >= 1) return SemanticNodeType.DRAWER_CONTENT;
  }
  
  // 系统UI
  if (resourceId.includes('navigationBarBackground') || resourceId.includes('statusBarBackground')) {
    return SemanticNodeType.SYSTEM_UI;
  }
  
  // 底部导航检测
  const bounds = node.attrs['bounds'];
  if (bounds) {
    const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (match) {
      const y1 = parseInt(match[2]);
      const y2 = parseInt(match[4]);
      // 在屏幕底部区域，且包含常见导航文字
      if (y1 > 2000 && y2 <= 2500) {
        if (hasBottomNavContent(node)) {
          return SemanticNodeType.BOTTOM_NAVIGATION;
        }
      }
    }
  }
  
  return SemanticNodeType.NORMAL;
}

function hasBottomNavContent(node: UiNode): boolean {
  const navTexts = ['首页', '发现', '消息', '我', '市集', '购物', '发布'];
  const text = node.attrs['text'] || '';
  const desc = node.attrs['content-desc'] || '';
  
  if (navTexts.some(t => text.includes(t) || desc.includes(t))) {
    return true;
  }
  
  for (const child of node.children) {
    if (hasBottomNavContent(child)) return true;
  }
  return false;
}


function isOverlayType(type: SemanticNodeType): boolean {
  return [
    SemanticNodeType.DRAWER_CONTENT,
    SemanticNodeType.DIALOG,
    SemanticNodeType.POPUP,
    SemanticNodeType.BOTTOM_NAVIGATION,
  ].includes(type);
}

export const ScreenPreview: React.FC<{
  root: UiNode | null;
  selected: UiNode | null;
  onSelect?: (n: UiNode) => void;
  onElementClick?: (n: UiNode) => void;
  matchedSet?: Set<UiNode>;
  highlightNode?: UiNode | null;
  highlightKey?: number;
  enableFlashHighlight?: boolean;
  previewAutoCenter?: boolean;
  // 🆕 可选截图 URL（通过 Tauri convertFileSrc 或 base64）
  screenshotUrl?: string;
}> = ({
  root,
  selected,
  onSelect,
  onElementClick,
  matchedSet,
  highlightNode,
  highlightKey,
  enableFlashHighlight = true,
  previewAutoCenter = true,
  screenshotUrl,
}) => {
  const [scaleMode, setScaleMode] = useState<ScaleMode>("fit");
  const [zoom, setZoom] = useState<number>(100); // percent for custom
  const flashRef = useRef<number>(0);
  const rectRefs = useRef<Array<HTMLDivElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const centerTimerRef = useRef<number | null>(null);
  const lastUserScrollRef = useRef<number>(0);
  const lastCenteredNodeRef = useRef<UiNode | null>(null);
  const screen = useMemo(() => {
    function findBounds(n?: UiNode | null): ReturnType<typeof parseBounds> | null {
      if (!n) return null;
      const b = parseBounds(n.attrs["bounds"]);
      if (b) return b;
      for (const c of n.children) {
        const r = findBounds(c);
        if (r) return r;
      }
      return null;
    }
    const fb = findBounds(root) || {
      x1: 0,
      y1: 0,
      x2: 1080,
      y2: 2400,
      w: 1080,
      h: 2400,
    };
    return { width: fb.w, height: fb.h };
  }, [root]);

  /**
   * 扁平化节点并计算正确的层级顺序
   * 策略 A：回归自然流
   * 1. 移除手动 z-index 计算，依赖 DOM 顺序
   * 2. 使用 pointer-events 控制交互
   */
  const boxes = useMemo(() => {
    const result: RenderableBox[] = [];
    
    function walk(
      n: UiNode | null | undefined, 
      depth: number, 
      siblingIndex: number, 
      parentType?: SemanticNodeType
    ) {
      if (!n) return;
      
      const b = parseBounds(n.attrs["bounds"]);
      const semanticType = detectSemanticType(n, parentType, siblingIndex);
      
      if (b && b.w > 0 && b.h > 0) {
        // 策略 A：不再计算复杂的 z-index，仅记录语义类型
        // 实际渲染顺序由 result 数组顺序决定（DFS 遍历顺序）
        result.push({ 
          n, 
          b, 
          zIndex: 0, // 占位符
          isOverlay: isOverlayType(semanticType),
          semanticType,
        });
      }
      
      // 递归处理子节点
      n.children.forEach((child, idx) => {
        walk(child, depth + 1, idx, semanticType);
      });
    }
    
    walk(root, 0, 0);
    
    // 策略 A：不需要排序，DFS 遍历顺序即为正确的渲染顺序（后进先出）
    // result.sort((a, b) => a.zIndex - b.zIndex);
    
    return result;
  }, [root]);

  // 监听滚动/滚轮，短时间内判定为用户主动滚动，避免“自动居中”打断用户操作
  useEffect(() => {
    const c = containerRef.current;
    const mark = () => {
      lastUserScrollRef.current = Date.now();
    };
    c?.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("wheel", mark, { passive: true });
    return () => {
      c?.removeEventListener("scroll", mark);
      window.removeEventListener("scroll", mark);
      window.removeEventListener("wheel", mark);
    };
  }, []);

  function isInView(_container: HTMLElement, el: HTMLElement, margin = 12) {
    // 使用窗口视口判断，而不是内部容器（容器本身不滚动）
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const er = el.getBoundingClientRect();
    const fullyAbove = er.bottom < 0 + margin;
    const fullyBelow = er.top > vh - margin;
    const fullyLeft = er.right < 0 + margin;
    const fullyRight = er.left > vw - margin;
    return !(fullyAbove || fullyBelow || fullyLeft || fullyRight);
  }

  function scrollIntoViewSafe(el: HTMLElement) {
    if (typeof el.scrollIntoView === "function") {
      try {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      } catch {
        el.scrollIntoView(true);
      }
    }
  }

  const baseW = 300;
  let scale = screen.width > 0 ? baseW / screen.width : 1;
  if (scaleMode === "actual") scale = 1;
  if (scaleMode === "custom") scale = zoom / 100;
  const viewW = Math.round(screen.width * scale);
  const viewH = Math.max(100, Math.round(screen.height * scale));

  // 触发闪烁：当 highlightKey 变化时，记录一次闪烁计数
  useEffect(() => {
    if (typeof highlightKey === "number") {
      flashRef.current = (flashRef.current || 0) + 1;
    }
  }, [highlightKey]);

  // 自动滚动/定位：仅在选中元素变化时触发，并带去抖与视口检测，避免“滚动锁死”
  useEffect(() => {
    if (!previewAutoCenter) return;
    if (!selected) return;
    const idx = boxes.findIndex(({ n }) => n === selected);
    if (idx < 0) return;
    const el = rectRefs.current[idx];
    const container = containerRef.current;
    if (!el || !container) return;

    // 距离用户滚动太近则跳过自动定位
    if (Date.now() - lastUserScrollRef.current < 300) return;

    // 已在视口范围内则不再滚动
    if (isInView(container, el, 12)) return;

    // 去抖：短暂延迟合并多次变更
    if (centerTimerRef.current) {
      window.clearTimeout(centerTimerRef.current);
    }
    centerTimerRef.current = window.setTimeout(() => {
      scrollIntoViewSafe(el);
      lastCenteredNodeRef.current = selected;
    }, 120);
  }, [previewAutoCenter, selected, boxes]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-base font-semibold">屏幕预览</div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>
            {screen.width}×{screen.height}
          </span>
          <span>·</span>
          <button
            className="underline"
            onClick={() => setScaleMode("fit")}
            title="适配宽度"
          >
            适配
          </button>
          <button
            className="underline"
            onClick={() => setScaleMode("actual")}
            title="实际像素"
          >
            实际
          </button>
          <span>
            <label className="mr-1">缩放</label>
            <input
              type="range"
              min={25}
              max={300}
              step={5}
              value={scaleMode === "custom" ? zoom : Math.round(scale * 100)}
              onChange={(e) => {
                setScaleMode("custom");
                setZoom(parseInt(e.target.value, 10) || 100);
              }}
            />
            <span className="ml-1">{Math.round(scale * 100)}%</span>
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className={`${styles.previewBox} relative`}
        style={{ width: viewW, height: viewH }}
      >
        {/* 背景截图层（不拦截事件） */}
        {screenshotUrl && (
          <img
            src={screenshotUrl}
            alt="device-screenshot"
            draggable={false}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: viewW,
              height: viewH,
              objectFit: "fill",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        )}
        {/* 按 z-index 顺序渲染节点（先画底层，后画顶层） */}
        {boxes.map(({ n, b, zIndex, isOverlay }, i) => {
          const sel = n === selected;
          const matched = matchedSet?.has(n);
          const isHL = highlightNode === n;
          
          // 覆盖层使用特殊样式
          const overlayClassName = isOverlay ? styles.elementRectOverlay : '';
          
          return (
            <div
              key={`${zIndex}-${i}`}
              ref={(el) => {
                rectRefs.current[i] = el;
              }}
              className={`${styles.elementRect} ${
                matched ? styles.elementRectMatched : ""
              } ${sel ? styles.elementRectActive : ""} ${
                isHL && enableFlashHighlight ? styles.elementRectFlash : ""
              } ${overlayClassName}`}
              style={{
                left: Math.round(b.x1 * scale),
                top: Math.round(b.y1 * scale),
                width: Math.max(1, Math.round(b.w * scale)),
                height: Math.max(1, Math.round(b.h * scale)),
                // 使用实际 z-index 确保正确的层叠顺序
                zIndex: zIndex,
              }}
              title={`${n.attrs["class"] || n.tag}${isOverlay ? ' [覆盖层]' : ''}`}
              onClick={() => {
                if (onElementClick) {
                  onElementClick(n);
                } else {
                  onSelect?.(n);
                }
              }}
            />
          );
        })}
      </div>
      {selected?.attrs["bounds"] && (
        <div className="text-xs text-neutral-600 dark:text-neutral-300">
          选中元素 bounds:{" "}
          <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            {selected.attrs["bounds"]}
          </code>
        </div>
      )}
    </div>
  );
};
