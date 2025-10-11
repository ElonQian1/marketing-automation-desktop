// src/components/universal-ui/views/visual-view/utils/coordinateCalibration.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 坐标校准算法模块
 * 
 * 自动检测 XML 视口与截图尺寸的差异，计算校准参数
 * 
 * 方案 A：自动检测 + 建议 overlayScale
 * 方案 B：统一坐标系（使用截图尺寸作为基准）
 */

import type { CoordinateCalibration } from './coordinateTransform';

/**
 * 校准检测结果
 */
export interface CalibrationDetectionResult {
  // 是否需要校准
  needsCalibration: boolean;
  
  // 校准对象（方案 B）
  calibration: CoordinateCalibration | null;
  
  // 建议的 overlayScale（方案 A，向后兼容）
  suggestedOverlayScale: number;
  
  // 检测置信度 (0-1)
  confidence: number;
  
  // 人类可读的原因说明
  reason: string;
  
  // 详细诊断信息
  details?: {
    xmlViewport: { w: number; h: number };
    screenshot: { w: number; h: number };
    scaleDiff: number;
    scaleX: number;
    scaleY: number;
  };
}

/**
 * 自动检测并生成校准参数
 * 
 * @param xmlViewportW - XML 视口宽度
 * @param xmlViewportH - XML 视口高度
 * @param screenshotW - 截图实际宽度
 * @param screenshotH - 截图实际高度
 * @returns 校准检测结果
 */
export function detectCalibrationNeeds(
  xmlViewportW: number,
  xmlViewportH: number,
  screenshotW: number,
  screenshotH: number
): CalibrationDetectionResult {
  // 计算缩放比例
  const scaleX = xmlViewportW / screenshotW;
  const scaleY = xmlViewportH / screenshotH;
  const avgScale = (scaleX + scaleY) / 2;
  const scaleDiff = Math.abs(avgScale - 1.0);
  
  // 详细诊断信息
  const details = {
    xmlViewport: { w: xmlViewportW, h: xmlViewportH },
    screenshot: { w: screenshotW, h: screenshotH },
    scaleDiff,
    scaleX,
    scaleY
  };
  
  // 情况 1：尺寸匹配（差异 < 5%），不需要校准
  if (scaleDiff < 0.05) {
    return {
      needsCalibration: false,
      calibration: null,
      suggestedOverlayScale: 1.0,
      confidence: 1.0,
      reason: '✅ XML 视口与截图尺寸匹配，无需校准',
      details
    };
  }
  
  // 情况 2：XML 视口小于截图（最常见）
  // 例如：XML=720x1484, 截图=720x1612
  if (scaleY < 1.0) {
    const calibration = createCalibration(
      xmlViewportW,
      xmlViewportH,
      screenshotW,
      screenshotH
    );
    
    return {
      needsCalibration: true,
      calibration,
      suggestedOverlayScale: parseFloat(scaleY.toFixed(3)),
      confidence: 0.9,
      reason: `⚠️ XML 视口 (${xmlViewportH}px) 小于截图 (${screenshotH}px)\n` +
              `建议使用统一坐标系校准（overlayScale=${scaleY.toFixed(3)}）`,
      details
    };
  }
  
  // 情况 3：XML 视口大于截图（罕见，可能是特殊设备）
  if (scaleY > 1.0) {
    const calibration = createCalibration(
      xmlViewportW,
      xmlViewportH,
      screenshotW,
      screenshotH
    );
    
    return {
      needsCalibration: true,
      calibration,
      suggestedOverlayScale: parseFloat(scaleY.toFixed(3)),
      confidence: 0.7,
      reason: `⚠️ XML 视口 (${xmlViewportH}px) 大于截图 (${screenshotH}px)\n` +
              `这是罕见情况，建议检查设备配置`,
      details
    };
  }
  
  // 默认返回（理论上不会到达）
  return {
    needsCalibration: false,
    calibration: null,
    suggestedOverlayScale: 1.0,
    confidence: 0.5,
    reason: '⚠️ 无法确定校准参数',
    details
  };
}

/**
 * 创建校准对象（方案 B 核心）
 * 
 * 计算 XML 坐标系到截图坐标系的转换参数
 */
function createCalibration(
  xmlW: number,
  xmlH: number,
  screenW: number,
  screenH: number
): CoordinateCalibration {
  // 计算缩放比例
  const scaleX = screenW / xmlW;
  const scaleY = screenH / xmlH;
  
  // 计算 Y 轴偏移
  // 假设：XML 视口在截图中居中（或从某个固定偏移开始）
  // 实际偏移 = (截图高度 - XML 视口映射后的高度) / 2
  const xmlMappedHeight = xmlH * scaleY;
  const offsetY = (screenH - xmlMappedHeight) / 2;
  
  // X 轴通常对齐，无偏移
  const offsetX = 0;
  
  return {
    xmlOffsetX: offsetX,
    xmlOffsetY: offsetY,
    xmlToScreenScaleX: scaleX,
    xmlToScreenScaleY: scaleY,
    confidence: 0.9
  };
}

/**
 * 从 XML 内容检测状态栏高度
 * 
 * 用于更精确的 Y 轴偏移计算
 */
export function detectStatusBarHeight(xmlContent: string): number {
  try {
    // 方法 1：查找 status_bar 相关元素
    const statusBarMatch = xmlContent.match(
      /id="[^"]*status_bar[^"]*"[^>]*bounds="\[0,0\]\[(\d+),(\d+)\]"/i
    );
    if (statusBarMatch) {
      const height = parseInt(statusBarMatch[2], 10);
      console.log(`📏 检测到状态栏高度: ${height}px`);
      return height;
    }
    
    // 方法 2：查找 keyguard_header（锁屏状态栏）
    const keyguardMatch = xmlContent.match(
      /id="[^"]*keyguard_header[^"]*"[^>]*bounds="\[0,0\]\[(\d+),(\d+)\]"/i
    );
    if (keyguardMatch) {
      const height = parseInt(keyguardMatch[2], 10);
      console.log(`📏 检测到锁屏状态栏高度: ${height}px`);
      return height;
    }
    
    // 方法 3：查找顶部系统栏容器
    const systemBarMatch = xmlContent.match(
      /package="com\.android\.systemui"[^>]*bounds="\[0,0\]\[(\d+),(\d+)\]"/
    );
    if (systemBarMatch) {
      const height = parseInt(systemBarMatch[2], 10);
      if (height < 200) { // 合理的状态栏高度
        console.log(`📏 检测到系统栏高度: ${height}px`);
        return height;
      }
    }
  } catch (error) {
    console.warn('检测状态栏高度失败:', error);
  }
  
  // 返回 0 表示无法检测
  return 0;
}

/**
 * 优化校准参数（考虑状态栏）
 * 
 * @param baseCalibration - 基础校准参数
 * @param statusBarHeight - 检测到的状态栏高度
 * @returns 优化后的校准参数
 */
export function optimizeCalibration(
  baseCalibration: CoordinateCalibration,
  statusBarHeight: number
): CoordinateCalibration {
  if (statusBarHeight <= 0) {
    return baseCalibration;
  }
  
  // 调整 Y 轴偏移，考虑状态栏
  return {
    ...baseCalibration,
    xmlOffsetY: baseCalibration.xmlOffsetY - statusBarHeight,
    confidence: Math.min(1.0, baseCalibration.confidence + 0.05)
  };
}

/**
 * 验证校准参数的合理性
 */
export function validateCalibration(calibration: CoordinateCalibration): boolean {
  // 检查缩放比例是否在合理范围内 (0.5 - 2.0)
  if (calibration.xmlToScreenScaleX < 0.5 || calibration.xmlToScreenScaleX > 2.0) {
    console.warn('⚠️ X 轴缩放比例异常:', calibration.xmlToScreenScaleX);
    return false;
  }
  if (calibration.xmlToScreenScaleY < 0.5 || calibration.xmlToScreenScaleY > 2.0) {
    console.warn('⚠️ Y 轴缩放比例异常:', calibration.xmlToScreenScaleY);
    return false;
  }
  
  // 检查偏移是否在合理范围内 (-500 到 500)
  if (Math.abs(calibration.xmlOffsetX) > 500 || Math.abs(calibration.xmlOffsetY) > 500) {
    console.warn('⚠️ 偏移值异常:', calibration.xmlOffsetX, calibration.xmlOffsetY);
    return false;
  }
  
  return true;
}
