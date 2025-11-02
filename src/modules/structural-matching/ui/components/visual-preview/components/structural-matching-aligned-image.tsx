// src/modules/structural-matching/ui/components/visual-preview/components/structural-matching-aligned-image.tsx
// module: structural-matching | layer: ui | role: 组件
// summary: 结构匹配对齐图片显示组件

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { ViewportAlignment, CropConfig } from "../types";

interface StructuralMatchingAlignedImageProps {
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
 * 结构匹配对齐图片显示组件
 * 确保裁剪区域精确对齐到容器视口
 */
export function StructuralMatchingAlignedImage({
  imageUrl,
  cropConfig,
  viewportAlignment,
  style = {},
  className = "",
}: StructuralMatchingAlignedImageProps) {
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
        console.log("🖼️ [StructuralMatching] 图片加载完成:", {
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
    console.error("❌ [StructuralMatching] 图片加载失败:", imageUrl);
    setImageLoaded(false);
  }, [imageUrl]);

  // 加载图片并获取自然尺寸
  useEffect(() => {
    if (!imageUrl) {
      setImageLoaded(false);
      return;
    }

    setImageLoaded(false);
    const img = new Image();
    img.onload = () => handleImageLoadInternal(img);
    img.onerror = handleImageError;
    img.src = imageUrl;

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

    if (process.env.NODE_ENV === "development") {
      console.debug("🎨 [StructuralMatching] 样式计算:", {
        cropArea: `[${cropArea.x},${cropArea.y}] ${cropArea.width}x${cropArea.height}`,
        scale: imageDisplay.scale.toFixed(2),
        containerSize: `${imageDisplay.containerSize.width}x${imageDisplay.containerSize.height}`,
        imageNaturalSize: `${imageNaturalSize.width}x${imageNaturalSize.height}`,
      });
    }

    // 🔧 修复: 直接使用负定位来实现裁剪，不叠加offset和transform
    const fixedStyle: React.CSSProperties = {
      position: "absolute" as const,
      left: imageDisplay.offset.x - cropArea.x * imageDisplay.scale,
      top: imageDisplay.offset.y - cropArea.y * imageDisplay.scale,
      width: imageNaturalSize.width * imageDisplay.scale,
      height: imageNaturalSize.height * imageDisplay.scale,
      maxWidth: "none",
      maxHeight: "none",
    };

    if (process.env.NODE_ENV === "development") {
      console.debug("🎨 [StructuralMatching] 图片定位:", {
        left: fixedStyle.left,
        top: fixedStyle.top,
        width: fixedStyle.width,
        height: fixedStyle.height,
      });
    }

    return fixedStyle;
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
      className={`structural-matching-aligned-image ${className}`}
      style={containerStyle}
    >
      <img
        src={imageUrl}
        alt="UI Screenshot"
        style={imageDisplayStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

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
