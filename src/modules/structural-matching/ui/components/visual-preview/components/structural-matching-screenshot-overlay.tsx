// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-screenshot-overlay.tsx
// module: structural-matching | layer: ui | role: 组件
// summary: 结构匹配截图叠加层组件 - 显示背景截图和元素边框

import React, { useState, useRef, useEffect } from "react";
import "./structural-matching-visual-preview.css";
import { ElementTreeData, CropConfig, ViewportAlignment } from "../types";
import { StructuralMatchingAlignedImage } from "./structural-matching-aligned-image";
import { structuralMatchingCoordinationBus } from "../core";
import type { VisualUIElement } from "../../../../../../components/universal-ui/xml-parser";

interface StructuralMatchingScreenshotOverlayProps {
  screenshotUrl: string;
  elementTreeData?: ElementTreeData;
  cropConfig?: CropConfig;
  viewportAlignment?: ViewportAlignment;
  onElementHover?: (elementId: string | null) => void;
  onElementClick?: (elementId: string) => void;
  selectedElementId?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 结构匹配截图叠加层组件
 * 显示背景截图和元素边框覆盖层
 */
export function StructuralMatchingScreenshotOverlay({
  screenshotUrl,
  elementTreeData,
  cropConfig,
  viewportAlignment,
  onElementHover,
  onElementClick,
  selectedElementId,
  className = "",
  style = {},
}: StructuralMatchingScreenshotOverlayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [busHighlightId, setBusHighlightId] = useState<string | null>(null);
  // 轻量节流（rAF 合并）：减少频繁 hover 事件对父组件/总线的压力
  const hoverRafRef = useRef<number | null>(null);
  const pendingHoverIdRef = useRef<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 调试：输出实际容器尺寸，核对与 viewportAlignment.imageDisplay.containerSize 一致性
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !viewportAlignment) return;

    const logSize = () => {
      const rect = el.getBoundingClientRect();
      const actual = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
      // 初次挂载或尚未布局完成时可能为 0×0，避免误报
      if (actual.width === 0 || actual.height === 0) {
        console.debug(
          "📏 [StructuralMatching] 容器尚未完成布局，跳过尺寸校验",
          actual
        );
        return;
      }
      const expected = {
        width: viewportAlignment.imageDisplay.containerSize.width,
        height: viewportAlignment.imageDisplay.containerSize.height,
      };
      if (
        actual.width !== expected.width ||
        actual.height !== expected.height
      ) {
        console.warn("📏 [StructuralMatching] 叠加层容器尺寸不一致", {
          actual,
          expected,
        });
      } else {
        console.log("📏 [StructuralMatching] 叠加层容器尺寸校验通过", {
          actual,
          expected,
        });
      }
    };

    // 初次与窗口尺寸变化时校验
    logSize();

    // 监听尺寸变化（更稳健）
    const ro = new ResizeObserver(() => logSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportAlignment]);

  // 加载图片并获取尺寸
  useEffect(() => {
    if (!screenshotUrl) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("❌ [StructuralMatching] 截图加载失败:", screenshotUrl);
      setImageLoaded(false);
    };
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  // 订阅协调总线高亮事件：来自树的高亮应在叠加层中可见
  useEffect(() => {
    const unsubscribe = structuralMatchingCoordinationBus.subscribe((evt) => {
      if (evt.type === "highlight") {
        const normalized = evt.elementId
          ? evt.elementId.replace(/element[_-](\d+)/, (_m, g1) => `element-${g1}`)
          : null;
        setBusHighlightId(normalized);
      } else if (evt.type === "clear") {
        setBusHighlightId(null);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 计算裁剪样式（仅用于回退渲染路径）
  const getCropStyle = (): React.CSSProperties => {
    if (!cropConfig) {
      return {};
    }

    const { cropArea } = cropConfig;

    console.log("🎨 [StructuralMatching] 应用裁剪样式:", {
      cropArea,
      imageSize,
      viewportAlignment,
      screenshotUrl,
    });

    // 使用视口对齐信息来计算更精确的显示样式
    if (viewportAlignment) {
      const { imageDisplay } = viewportAlignment;
      return {
        objectFit: "none" as const,
        objectPosition: `-${cropArea.x}px -${cropArea.y}px`,
        width: cropArea.width * imageDisplay.scale,
        height: cropArea.height * imageDisplay.scale,
        transform: `translate(${imageDisplay.offset.x}px, ${imageDisplay.offset.y}px)`,
        maxWidth: "none",
        maxHeight: "none",
      };
    }

    // 回退到原始逻辑
    return {
      objectFit: "none" as const,
      objectPosition: `-${cropArea.x}px -${cropArea.y}px`,
      width: cropArea.width,
      height: cropArea.height,
      maxWidth: "none",
      maxHeight: "none",
    };
  };

  // 处理元素悬停
  const scheduleHoverEmit = (id: string | null) => {
    pendingHoverIdRef.current = id;
    if (hoverRafRef.current == null) {
      hoverRafRef.current = requestAnimationFrame(() => {
        hoverRafRef.current = null;
        const value = pendingHoverIdRef.current ?? null;
        setHoveredElementId(value);
        onElementHover?.(value);
      });
    }
  };

  const handleElementMouseEnter = (elementId: string) => {
    scheduleHoverEmit(elementId);
  };

  const handleElementMouseLeave = () => {
    scheduleHoverEmit(null);
  };

  useEffect(() => {
    return () => {
      if (hoverRafRef.current != null) {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = null;
      }
    };
  }, []);

  // 处理元素点击
  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onElementClick?.(elementId);
  };

  // 渲染元素边框覆盖层
  const renderElementOverlays = () => {
    if (!elementTreeData || !cropConfig) {
      return null;
    }

    const { rootElement, childElements } = elementTreeData;
    const { cropArea } = cropConfig;
    const displayConfig = viewportAlignment?.imageDisplay;
    const scale = displayConfig?.scale ?? 1;
    const offset = displayConfig?.offset ?? { x: 0, y: 0 };

    // 计算元素在裁剪区域内的相对位置
    const calculateRelativePosition = (element: {
      position?: { x: number; y: number; width: number; height: number };
      bounds?: string;
    }) => {
      let elementBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      };

      if (element.position) {
        elementBounds = element.position;
      } else if (element.bounds && typeof element.bounds === "string") {
        const matches = element.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (matches) {
          const [, left, top, right, bottom] = matches.map(Number);
          elementBounds = {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
          };
        } else {
          return null;
        }
      } else {
        return null;
      }

      // 转换为相对于裁剪区域的坐标
      return {
        x: elementBounds.x - cropArea.x,
        y: elementBounds.y - cropArea.y,
        width: elementBounds.width,
        height: elementBounds.height,
      };
    };

    const rootBounds = calculateRelativePosition(rootElement);
    if (!rootBounds) return null;

    const toScaledBounds = (bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => ({
      left: bounds.x * scale + offset.x,
      top: bounds.y * scale + offset.y,
      width: Math.max(1, bounds.width * scale),
      height: Math.max(1, bounds.height * scale),
    });

  const scaledRoot = toScaledBounds(rootBounds);
  const isRootSelected = selectedElementId && rootElement.id === selectedElementId;

    return (
      <>
        {/* 根元素边框 */}
        <div
          key={`root-${rootElement.id}`}
          className="element-overlay root-element"
          style={{
            position: "absolute",
            left: scaledRoot.left,
            top: scaledRoot.top,
            width: scaledRoot.width,
            height: scaledRoot.height,
            border: isRootSelected ? "2px solid #faad14" : "2px solid #722ed1",
            borderRadius: "4px",
            pointerEvents: "none",
            backgroundColor: isRootSelected ? "rgba(250, 173, 20, 0.12)" : "rgba(114, 46, 209, 0.1)",
            zIndex: isRootSelected ? 20 : 10,
          }}
        />

        {/* 子元素边框 */}
  {childElements.map((element: VisualUIElement) => {
          const relativeBounds = calculateRelativePosition(element);
          if (!relativeBounds) return null;

          // 检查元素是否在可见区域内
          const isVisible =
            relativeBounds.x + relativeBounds.width > 0 &&
            relativeBounds.y + relativeBounds.height > 0 &&
            relativeBounds.x < cropArea.width &&
            relativeBounds.y < cropArea.height;

          if (!isVisible) return null;

          const isHovered =
            hoveredElementId === element.id || busHighlightId === element.id;
          const isSelected = selectedElementId === element.id;
          const scaledChild = toScaledBounds(relativeBounds);

          const label = ((): string => {
            const text = element.text?.trim?.();
            if (text) return `"${text}"`;
            const desc = element.description?.trim?.();
            if (desc) return `[${desc}]`;
            const rid = element.resourceId;
            if (rid) return `#${rid}`;
            return element.type || element.className || "Element";
          })();

          return (
            <div
              key={`child-${element.id}`}
              className={`element-overlay child-element ${
                isHovered ? "hovered" : ""
              }`}
              style={{
                position: "absolute",
                left: scaledChild.left,
                top: scaledChild.top,
                width: scaledChild.width,
                height: scaledChild.height,
                border: isSelected
                  ? "2px solid #faad14"
                  : `1px solid ${isHovered ? "#ff6b6b" : "#52c41a"}`,
                borderRadius: "2px",
                backgroundColor: isSelected
                  ? "rgba(250, 173, 20, 0.15)"
                  : isHovered
                  ? "rgba(255, 107, 107, 0.2)"
                  : "rgba(82, 196, 26, 0.1)",
                cursor: "pointer",
                pointerEvents: "auto",
                transition: "all 0.2s ease",
                zIndex: isSelected ? 20 : isHovered ? 15 : 11,
              }}
              onMouseEnter={() => handleElementMouseEnter(element.id)}
              onMouseLeave={handleElementMouseLeave}
              onClick={(e) => handleElementClick(element.id, e)}
              title={`${element.type || element.className || "Element"} - ${
                element.text || element.description || element.id
              }`}
            >
              {(isSelected || isHovered) && (
                <div
                  className={`overlay-badge light-theme-force ${
                    isSelected ? "is-selected" : isHovered ? "is-hovered" : ""
                  }`}
                  style={{
                    // 若靠近容器顶部，避免上方溢出（保守处理，必要时可进一步改为可视区域判断）
                    top: scaledChild.top < 20 ? 0 : undefined,
                  }}
                >
                  {label} · {element.id}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };

  if (!screenshotUrl) {
    return (
      <div
        className={`structural-matching-screenshot-placeholder ${className}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "200px",
          backgroundColor: "var(--bg-2)",
          color: "var(--text-2)",
          border: "1px dashed var(--border-color)",
          borderRadius: "4px",
          ...style,
        }}
      >
        📷 暂无截图数据
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`structural-matching-screenshot-overlay ${className}`}
      style={{
        // 先合入外部样式，但在有 viewportAlignment 时，后续强制覆盖宽高，避免 100% 抢占
        ...style,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--bg-2)",
        // ✅ 强制容器尺寸与视口对齐算法一致，修复父容器100%导致的错位
        width: viewportAlignment
          ? viewportAlignment.imageDisplay.containerSize.width
          : style?.width,
        height: viewportAlignment
          ? viewportAlignment.imageDisplay.containerSize.height
          : style?.height,
      }}
    >
      {/* 使用对齐的图片显示组件 */}
      {viewportAlignment && cropConfig ? (
        <StructuralMatchingAlignedImage
          imageUrl={screenshotUrl}
          cropConfig={cropConfig}
          viewportAlignment={viewportAlignment}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <>
          {/* 回退到原始图片显示 */}
          <img
            ref={imageRef}
            src={screenshotUrl}
            alt="UI Screenshot"
            style={{
              display: imageLoaded ? "block" : "none",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              ...getCropStyle(),
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />

          {/* 加载状态 */}
          {!imageLoaded && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "var(--text-2)",
              }}
            >
              📷 加载截图中...
            </div>
          )}
        </>
      )}

      {/* 元素覆盖层 */}
      {
        <div
          className="element-overlays"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: viewportAlignment
              ? viewportAlignment.imageDisplay.containerSize.width
              : "100%",
            height: viewportAlignment
              ? viewportAlignment.imageDisplay.containerSize.height
              : "100%",
            pointerEvents: "none",
          }}
        >
          {renderElementOverlays()}
        </div>
      }
    </div>
  );
}
