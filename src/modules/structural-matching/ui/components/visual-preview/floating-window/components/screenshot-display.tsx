// src/modules/structural-matching/ui/components/visual-preview/floating-window/components/screenshot-display.tsx
// module: structural-matching | layer: ui | role: component
// summary: 截图显示组件

import React, { useState, useRef, useEffect } from "react";
import { ElementTreeData, CropConfig } from "../types";

interface ScreenshotDisplayProps {
  screenshotUrl: string;
  elementTreeData?: ElementTreeData;
  cropConfig?: CropConfig;
  onElementHover?: (elementId: string | null) => void;
  onElementClick?: (elementId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 截图显示组件 - 显示背景截图和元素边框
 */
export function ScreenshotDisplay({
  screenshotUrl,
  elementTreeData,
  cropConfig,
  onElementHover,
  onElementClick,
  className = "",
  style = {},
}: ScreenshotDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
      console.error("Failed to load screenshot:", screenshotUrl);
      setImageLoaded(false);
    };
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  // 计算裁剪样式
  const getCropStyle = (): React.CSSProperties => {
    if (!cropConfig || !imageLoaded) {
      return {};
    }

    const { cropArea } = cropConfig;
    
    console.log("🎨 [ScreenshotDisplay] 应用裁剪样式:", {
      cropArea,
      imageSize,
      screenshotUrl,
    });

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
  const handleElementMouseEnter = (elementId: string) => {
    setHoveredElementId(elementId);
    onElementHover?.(elementId);
  };

  const handleElementMouseLeave = () => {
    setHoveredElementId(null);
    onElementHover?.(null);
  };

  // 处理元素点击
  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onElementClick?.(elementId);
  };

  // 渲染元素边框覆盖层
  const renderElementOverlays = () => {
    if (!elementTreeData || !cropConfig || !imageLoaded) {
      return null;
    }

    const { rootElement, childElements } = elementTreeData;
    const { cropArea } = cropConfig;

    console.log("🎨 [ScreenshotDisplay] 渲染元素覆盖层:", {
      rootElement: rootElement.id,
      childElementsCount: childElements.length,
      cropArea,
    });

    // 计算元素在裁剪区域内的相对位置
    const calculateRelativePosition = (element: {
      position?: { x: number; y: number; width: number; height: number };
      bounds?: string;
    }) => {
      let elementBounds: { x: number; y: number; width: number; height: number };
      
      if (element.position) {
        elementBounds = element.position;
      } else if (element.bounds && typeof element.bounds === 'string') {
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

    return (
      <>
        {/* 根元素边框 */}
        <div
          key={`root-${rootElement.id}`}
          className="element-overlay root-element"
          style={{
            position: "absolute",
            left: rootBounds.x,
            top: rootBounds.y,
            width: rootBounds.width,
            height: rootBounds.height,
            border: "2px solid #722ed1",
            borderRadius: "4px",
            pointerEvents: "none",
            backgroundColor: "rgba(114, 46, 209, 0.1)",
            zIndex: 10,
          }}
        />

        {/* 子元素边框 */}
        {childElements.map((element) => {
          const relativeBounds = calculateRelativePosition(element);
          if (!relativeBounds) return null;

          // 检查元素是否在可见区域内
          const isVisible = 
            relativeBounds.x + relativeBounds.width > 0 &&
            relativeBounds.y + relativeBounds.height > 0 &&
            relativeBounds.x < cropArea.width &&
            relativeBounds.y < cropArea.height;

          if (!isVisible) return null;

          const isHovered = hoveredElementId === element.id;

          return (
            <div
              key={`child-${element.id}`}
              className={`element-overlay child-element ${isHovered ? "hovered" : ""}`}
              style={{
                position: "absolute",
                left: relativeBounds.x,
                top: relativeBounds.y,
                width: relativeBounds.width,
                height: relativeBounds.height,
                border: `1px solid ${isHovered ? "#ff6b6b" : "#52c41a"}`,
                borderRadius: "2px",
                backgroundColor: isHovered 
                  ? "rgba(255, 107, 107, 0.2)" 
                  : "rgba(82, 196, 26, 0.1)",
                cursor: "pointer",
                pointerEvents: "auto",
                transition: "all 0.2s ease",
                zIndex: isHovered ? 15 : 11,
              }}
              onMouseEnter={() => handleElementMouseEnter(element.id)}
              onMouseLeave={handleElementMouseLeave}
              onClick={(e) => handleElementClick(element.id, e)}
              title={`${element.type || element.className || 'Element'} - ${element.text || element.description || element.id}`}
            />
          );
        })}
      </>
    );
  };

  if (!screenshotUrl) {
    return (
      <div
        className={`screenshot-display-placeholder ${className}`}
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
        暂无截图数据
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`screenshot-display ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--bg-2)",
        ...style,
      }}
    >
      {/* 截图图片 */}
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
          加载截图中...
        </div>
      )}

      {/* 元素覆盖层 */}
      {imageLoaded && (
        <div
          className="element-overlays"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {renderElementOverlays()}
        </div>
      )}
    </div>
  );
}