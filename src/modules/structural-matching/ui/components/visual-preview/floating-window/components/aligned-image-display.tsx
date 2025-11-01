// src/modules/structural-matching/ui/components/visual-preview/floating-window/components/aligned-image-display.tsx
// module: structural-matching | layer: ui | role: component
// summary: 对齐的图片显示组件

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ViewportAlignment, CropConfig } from "../types";

interface AlignedImageDisplayProps {
  /** 图片URL */
  imageUrl: string;
  /** 裁剪配置 */
  cropConfig: CropConfig;
  /** 视口对齐配置 */
  viewportAlignment: ViewportAlignment;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** CSS类名 */
  className?: string;
}

/**
 * 对齐的图片显示组件
 * 确保裁剪区域精确对齐到容器视口
 */
export function AlignedImageDisplay({
  imageUrl,
  cropConfig,
  viewportAlignment,
  style = {},
  className = "",
}: AlignedImageDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用useCallback稳定函数引用，避免无限渲染
  const handleImageLoadInternal = useCallback(
    (img: HTMLImageElement) => {
      setImageNaturalSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setImageLoaded(true);
      if (process.env.NODE_ENV === "development") {
        console.log("🖼️ [AlignedImageDisplay] 图片加载完成:", {
          naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
          imageUrl: imageUrl.substring(0, 50) + "...",
        });
      }
    },
    [imageUrl]
  );

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      setImageNaturalSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setImageLoaded(true);
    },
    []
  );

  const handleImageError = useCallback(() => {
    console.error("❌ [AlignedImageDisplay] 图片加载失败:", imageUrl);
    setImageLoaded(false);
  }, [imageUrl]);

  // 加载图片并获取自然尺寸
  useEffect(() => {
    if (!imageUrl) {
      setImageLoaded(false);
      return;
    }

    setImageLoaded(false); // 重置加载状态
    const img = new Image();
    img.onload = () => handleImageLoadInternal(img);
    img.onerror = handleImageError;
    img.src = imageUrl;

    // 清理函数
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, handleImageLoadInternal, handleImageError]);

  // 使用useMemo缓存样式计算，避免频繁重新计算
  const imageDisplayStyle = useMemo((): React.CSSProperties => {
    if (!imageLoaded || !cropConfig || !viewportAlignment) {
      return { display: "none" };
    }

    const { cropArea } = cropConfig;
    const { imageDisplay } = viewportAlignment;

    // 只在开发模式下输出调试日志，并且限制频率
    if (process.env.NODE_ENV === "development") {
      // 使用简化的日志避免性能问题
      console.debug("🎨 [AlignedImageDisplay] 样式计算:", {
        cropSize: `${cropArea.width}x${cropArea.height}`,
        scale: imageDisplay.scale.toFixed(2),
        containerSize: `${imageDisplay.containerSize.width}x${imageDisplay.containerSize.height}`,
      });
    }

    // 🔧 修复: 分离定位和裁剪逻辑，避免复杂的负值计算
    return {
      position: "absolute" as const,
      left: imageDisplay.offset.x, // 只用offset做容器内居中
      top: imageDisplay.offset.y, // 只用offset做容器内居中
      width: imageNaturalSize.width * imageDisplay.scale,
      height: imageNaturalSize.height * imageDisplay.scale,
      // 用transform处理裁剪区域偏移，更精确且直观
      transform: `translate(-${cropArea.x * imageDisplay.scale}px, -${
        cropArea.y * imageDisplay.scale
      }px)`,
      transformOrigin: "0 0", // 确保变换从左上角开始
      maxWidth: "none",
      maxHeight: "none",
    };
  }, [imageLoaded, cropConfig, viewportAlignment, imageNaturalSize]);

  // 使用useMemo缓存容器样式
  const containerStyle = useMemo((): React.CSSProperties => {
    if (!viewportAlignment) {
      return {
        position: "relative",
        width: 400,
        height: 300,
        overflow: "hidden",
        backgroundColor: "var(--bg-2)",
        ...style,
      };
    }

    const { containerSize } = viewportAlignment.imageDisplay;

    return {
      position: "relative",
      width: containerSize.width,
      height: containerSize.height,
      overflow: "hidden",
      backgroundColor: "var(--bg-2)",
      ...style,
    };
  }, [viewportAlignment, style]);

  return (
    <div
      ref={containerRef}
      className={`aligned-image-display ${className}`}
      style={containerStyle}
    >
      {/* 图片元素 */}
      <img
        src={imageUrl}
        alt="UI Screenshot"
        style={imageDisplayStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
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
            fontSize: "14px",
          }}
        >
          📷 加载截图中...
        </div>
      )}

      {/* 调试信息（开发模式） */}
      {process.env.NODE_ENV === "development" && imageLoaded && (
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            left: "4px",
            fontSize: "10px",
            color: "var(--text-3)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: "4px 6px",
            borderRadius: "3px",
            fontFamily: "monospace",
            maxWidth: "200px",
            wordBreak: "break-all",
          }}
        >
          <div>
            裁剪: [{cropConfig.cropArea.x},{cropConfig.cropArea.y}]{" "}
            {cropConfig.cropArea.width}×{cropConfig.cropArea.height}
          </div>
          <div>
            缩放: {Math.round(viewportAlignment.imageDisplay.scale * 100)}% |
            偏移: {Math.round(viewportAlignment.imageDisplay.offset.x)},
            {Math.round(viewportAlignment.imageDisplay.offset.y)}
          </div>
          <div>
            图片: {imageNaturalSize.width}×{imageNaturalSize.height}
          </div>
        </div>
      )}
    </div>
  );
}
