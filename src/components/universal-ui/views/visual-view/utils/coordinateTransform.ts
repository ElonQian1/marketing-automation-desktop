/**
 * 坐标转换核心模块
 * 
 * 实现 XML 视口 → 截图 → 容器 → 叠加层的完整坐标转换管道
 * 
 * 方案 B：统一坐标系
 * - 优先使用截图尺寸作为基准坐标系
 * - 计算 XML 到截图的校准系数
 * - 在映射时应用校准，消除对手动 overlayScale 的依赖
 */

import { computeContainRect, type VerticalAlign } from './screenGeometry';

/**
 * 坐标校准参数（方案 B 核心）
 */
export interface CoordinateCalibration {
  // XML 视口在截图中的偏移（像素）
  xmlOffsetX: number;  // 通常 0（水平对齐）
  xmlOffsetY: number;  // 例如状态栏高度
  
  // XML 到截图的缩放比例
  xmlToScreenScaleX: number;  // 通常 1.0
  xmlToScreenScaleY: number;  // 例如 1.087 (1612/1484)
  
  // 自动检测置信度 (0-1)
  confidence: number;
}

/**
 * 坐标转换输入参数
 */
export interface CoordinateTransformParams {
  // XML 视口尺寸
  xmlViewportW: number;
  xmlViewportH: number;
  
  // 截图实际尺寸
  screenshotW: number;
  screenshotH: number;
  
  // 容器尺寸
  containerW: number;
  containerH: number;
  
  // 校准参数（方案 B：如果提供，则优先使用统一坐标系）
  calibration?: CoordinateCalibration;
  
  // 用户手动调整参数（向后兼容）
  overlayScale?: number;
  overlayScaleX?: number;
  overlayScaleY?: number;
  offsetX?: number;
  offsetY?: number;
  verticalAlign?: VerticalAlign;
}

/**
 * 坐标转换结果
 */
export interface TransformResult {
  // Contain rect (截图在容器中的位置)
  containRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  
  // 转换函数：XML 坐标 → 叠加层坐标
  xmlToOverlay: (xmlX: number, xmlY: number) => { x: number; y: number };
  
  // 诊断信息
  diagnostics: {
    xmlViewport: { w: number; h: number };
    screenshot: { w: number; h: number };
    scaleRatio: { x: number; y: number };
    calibrationApplied: boolean;
    calibration?: CoordinateCalibration;
  };
}

/**
 * 创建完整的坐标转换管道
 * 
 * 转换流程（6 阶段）：
 * 1. XML 坐标归一化 (0-1)
 * 2. 应用校准系数（方案 B：XML → 截图坐标系）
 * 3. 映射到 contain rect（截图 → 容器）
 * 4. 应用 overlayScale（围绕中心缩放）
 * 5. 应用偏移微调
 * 6. 最终叠加层坐标
 */
export function createCoordinateTransform(
  params: CoordinateTransformParams
): TransformResult {
  const {
    xmlViewportW,
    xmlViewportH,
    screenshotW,
    screenshotH,
    containerW,
    containerH,
    calibration,
    overlayScale = 1.0,
    overlayScaleX,
    overlayScaleY,
    offsetX = 0,
    offsetY = 0,
    verticalAlign = 'center'
  } = params;
  
  // 第 1 步：计算 contain rect (截图在容器中的位置)
  const containRect = computeContainRect(
    containerW,
    containerH,
    screenshotW,
    screenshotH,
    verticalAlign
  );
  
  // 第 2 步：创建 XML → 叠加层坐标转换函数
  const xmlToOverlay = (xmlX: number, xmlY: number): { x: number; y: number } => {
    let screenX: number;
    let screenY: number;
    
    // Stage 1-2: XML → 截图坐标系（方案 B 核心逻辑）
    if (calibration) {
      // 方案 B：使用统一坐标系（截图作为基准）
      // 应用校准系数将 XML 坐标转换为截图坐标
      screenX = xmlX * calibration.xmlToScreenScaleX + calibration.xmlOffsetX;
      screenY = xmlY * calibration.xmlToScreenScaleY + calibration.xmlOffsetY;
    } else {
      // 传统方式：直接按 XML 视口归一化
      // 这种方式在 XML 视口 != 截图尺寸时会导致不对齐
      screenX = (xmlX / xmlViewportW) * screenshotW;
      screenY = (xmlY / xmlViewportH) * screenshotH;
    }
    
    // Stage 3: 截图坐标 → 容器坐标（归一化到 0-1，然后映射到 rect）
    const normX = screenX / screenshotW;
    const normY = screenY / screenshotH;
    
    let x = containRect.left + normX * containRect.width;
    let y = containRect.top + normY * containRect.height;
    
  // Stage 4: 应用 overlayScale（围绕 rect 中心缩放）
  // 注意：当使用方案 B 校准后，overlayScale 应该接近 1.0
    const centerX = containRect.left + containRect.width / 2;
    const centerY = containRect.top + containRect.height / 2;
  const scaleXUsed = (typeof overlayScaleX === 'number') ? overlayScaleX : overlayScale;
  const scaleYUsed = (typeof overlayScaleY === 'number') ? overlayScaleY : overlayScale;
  x = centerX + (x - centerX) * scaleXUsed;
  y = centerY + (y - centerY) * scaleYUsed;
    
    // Stage 5: 应用偏移微调
    x += offsetX;
    y += offsetY;
    
    // Stage 6: 返回最终坐标
    return { x, y };
  };
  
  // 诊断信息
  const diagnostics = {
    xmlViewport: { w: xmlViewportW, h: xmlViewportH },
    screenshot: { w: screenshotW, h: screenshotH },
    scaleRatio: {
      x: screenshotW / xmlViewportW,
      y: screenshotH / xmlViewportH
    },
    calibrationApplied: !!calibration,
    calibration
  };
  
  return { containRect, xmlToOverlay, diagnostics };
}

/**
 * 辅助函数：从 bounds 字符串创建转换函数
 * 
 * @example
 * const transform = createBoundsTransform(xmlToOverlay, "[10,20][100,200]");
 * const rect = transform(); // { left: ..., top: ..., width: ..., height: ... }
 */
export function createBoundsTransform(
  xmlToOverlay: (x: number, y: number) => { x: number; y: number },
  boundsStr: string
): { left: number; top: number; width: number; height: number } | null {
  const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;
  
  const x1 = parseInt(match[1], 10);
  const y1 = parseInt(match[2], 10);
  const x2 = parseInt(match[3], 10);
  const y2 = parseInt(match[4], 10);
  
  const topLeft = xmlToOverlay(x1, y1);
  const bottomRight = xmlToOverlay(x2, y2);
  
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y
  };
}
