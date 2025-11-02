// src/modules/structural-matching/ui/components/visual-preview/floating-window/utils/viewport-alignment.ts
// module: structural-matching | layer: ui | role: utils
// summary: 视口对齐工具

import { ElementTreeData, CropConfig, ViewportAlignment } from "../types";

/**
 * 计算悬浮窗口的最佳视口对齐配置
 */
export function calculateViewportAlignment(
  elementTreeData: ElementTreeData,
  cropConfig: CropConfig,
  mousePosition?: { x: number; y: number },
  screenSize = { width: 1920, height: 1080 }
): ViewportAlignment {
  const { cropArea } = cropConfig;

  // 1. 基础参数与安全兜底
  const uiPadding = { width: 40, height: 80 }; // 工具栏和边框所需的额外空间
  const minWindowSize = { width: 400, height: 300 };
  const maxWindowSize = {
    width: Math.min(1200, screenSize.width * 0.8),
    height: Math.min(900, screenSize.height * 0.8),
  };

  const safeCropWidth = Math.max(1, cropArea.width);
  const safeCropHeight = Math.max(1, cropArea.height);

  const innerMinSize = {
    width: Math.max(0, minWindowSize.width - uiPadding.width),
    height: Math.max(0, minWindowSize.height - uiPadding.height),
  };

  const innerMaxSize = {
    width: Math.max(innerMinSize.width, maxWindowSize.width - uiPadding.width),
    height: Math.max(
      innerMinSize.height,
      maxWindowSize.height - uiPadding.height
    ),
  };

  // 2. 计算缩放比例，确保裁剪区域完整显示且不放大
  const scaleToFit = Math.min(
    1,
    innerMaxSize.width / safeCropWidth,
    innerMaxSize.height / safeCropHeight
  );

  const scaledCropSize = {
    width: safeCropWidth * scaleToFit,
    height: safeCropHeight * scaleToFit,
  };

  // 3. 计算最终容器尺寸，最小不低于 innerMin，最大由 innerMax 限制
  const containerSize = {
    width: Math.max(innerMinSize.width, scaledCropSize.width),
    height: Math.max(innerMinSize.height, scaledCropSize.height),
  };

  const windowSize = {
    width: containerSize.width + uiPadding.width,
    height: containerSize.height + uiPadding.height,
  };

  // 4. 当容器尺寸大于缩放后尺寸时，使用偏移量居中图片
  const imageOffset = {
    x: (containerSize.width - scaledCropSize.width) / 2,
    y: (containerSize.height - scaledCropSize.height) / 2,
  };

  // 5. 计算窗口位置：优先跟随鼠标，其次根据元素边界智能定位
  let windowPosition: { x: number; y: number };

  if (mousePosition) {
    const margin = 20;
    const clampedX = Math.max(
      margin,
      Math.min(
        screenSize.width - windowSize.width - margin,
        mousePosition.x - windowSize.width / 2
      )
    );
    const clampedY = Math.max(
      margin,
      Math.min(
        screenSize.height - windowSize.height - margin,
        mousePosition.y + 30
      )
    );

    windowPosition = {
      x: Math.round(clampedX),
      y: Math.round(clampedY),
    };
  } else {
    windowPosition = calculateSmartWindowPosition(
      elementTreeData.bounds,
      { width: windowSize.width, height: windowSize.height },
      screenSize
    );
  }

  const result: ViewportAlignment = {
    windowSize: {
      width: Math.round(windowSize.width),
      height: Math.round(windowSize.height),
    },
    windowPosition,
    imageDisplay: {
      scale: scaleToFit,
      offset: {
        x: Math.round(imageOffset.x),
        y: Math.round(imageOffset.y),
      },
      containerSize: {
        width: Math.round(containerSize.width),
        height: Math.round(containerSize.height),
      },
    },
  };

  return result;
}

/**
 * 根据元素边界计算智能窗口位置
 */
export function calculateSmartWindowPosition(
  elementBounds: { x: number; y: number; width: number; height: number },
  windowSize: { width: number; height: number },
  screenSize = { width: 1920, height: 1080 }
): { x: number; y: number } {
  // 尝试在元素右侧放置
  let x = elementBounds.x + elementBounds.width + 20;
  let y = elementBounds.y;

  // 如果右侧空间不够，尝试左侧
  if (x + windowSize.width > screenSize.width - 20) {
    x = elementBounds.x - windowSize.width - 20;
  }

  // 如果左侧也不够，使用居中
  if (x < 20) {
    x = (screenSize.width - windowSize.width) / 2;
  }

  // 垂直方向调整
  if (y + windowSize.height > screenSize.height - 20) {
    y = screenSize.height - windowSize.height - 20;
  }
  if (y < 20) {
    y = 20;
  }

  return { x: Math.round(x), y: Math.round(y) };
}
