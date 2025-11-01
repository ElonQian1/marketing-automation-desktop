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

  // 调试日志已禁用以避免性能问题
  // console.log("🎯 [ViewportAlignment] 开始计算视口对齐:", {
  //   cropArea,
  //   mousePosition,
  //   screenSize,
  // });

  // 1. 计算最佳窗口尺寸
  // 基于裁剪区域，但添加一些边距用于UI元素
  const uiPadding = { width: 40, height: 80 }; // 工具栏和边框
  const minWindowSize = { width: 400, height: 300 };
  const maxWindowSize = {
    width: Math.min(1200, screenSize.width * 0.8),
    height: Math.min(900, screenSize.height * 0.8),
  };

  let optimalWidth = Math.max(
    minWindowSize.width,
    Math.min(maxWindowSize.width, cropArea.width + uiPadding.width)
  );
  let optimalHeight = Math.max(
    minWindowSize.height,
    Math.min(maxWindowSize.height, cropArea.height + uiPadding.height)
  );

  // 2. 计算图片显示配置
  const contentArea = {
    width: optimalWidth - uiPadding.width,
    height: optimalHeight - uiPadding.height,
  };

  // 计算缩放比例，确保裁剪区域完整显示
  const scaleX = contentArea.width / cropArea.width;
  const scaleY = contentArea.height / cropArea.height;
  const optimalScale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

  // 如果需要缩放，调整窗口尺寸以匹配
  const scaledCropSize = {
    width: cropArea.width * optimalScale,
    height: cropArea.height * optimalScale,
  };

  optimalWidth = scaledCropSize.width + uiPadding.width;
  optimalHeight = scaledCropSize.height + uiPadding.height;

  // 3. 计算窗口位置
  let windowX = 100;
  let windowY = 100;

  if (mousePosition) {
    // 基于鼠标位置，确保窗口不超出屏幕
    windowX = Math.max(
      20,
      Math.min(
        screenSize.width - optimalWidth - 20,
        mousePosition.x - optimalWidth / 2
      )
    );
    windowY = Math.max(
      20,
      Math.min(screenSize.height - optimalHeight - 20, mousePosition.y + 30)
    );
  }

  // 4. 计算图片在容器内的位置偏移
  const imageOffset = {
    x: (contentArea.width - scaledCropSize.width) / 2,
    y: (contentArea.height - scaledCropSize.height) / 2,
  };

  const result: ViewportAlignment = {
    windowSize: { width: optimalWidth, height: optimalHeight },
    windowPosition: { x: windowX, y: windowY },
    imageDisplay: {
      scale: optimalScale,
      offset: imageOffset,
      containerSize: contentArea,
    },
  };

  // 调试日志已禁用以避免性能问题
  // console.log("✅ [ViewportAlignment] 计算完成:", result);

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
