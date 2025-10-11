// src/components/universal-ui/views/visual-view/hooks/useVisualViewPreferences.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 可视化视图偏好管理 Hook
 * 
 * 统一管理所有可视化视图的偏好设置：
 * - 全局偏好（overlayScale, offset, verticalAlign）
 * - 设备/应用特定校准参数（方案 C）
 * - 自动校准开关
 * 
 * 替代分散在 VisualElementView 中的 10+ 个 useEffect hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VerticalAlign } from '../utils/screenGeometry';
import type { CoordinateCalibration } from '../utils/coordinateTransform';
import {
  loadCalibrationProfile,
  saveCalibrationProfile,
  createCalibrationProfile,
  touchCalibrationProfile,
  type CalibrationProfile
} from '../utils/calibrationStorage';
import {
  detectCalibrationNeeds,
  type CalibrationDetectionResult
} from '../utils/coordinateCalibration';

/**
 * 全局偏好（向后兼容）
 */
export interface GlobalPreferences {
  overlayScale: number;
  offsetX: number;
  offsetY: number;
  verticalAlign: VerticalAlign;
  autoCalibration: boolean;
}

/**
 * Hook 返回值
 */
export interface VisualViewPreferences {
  // 全局偏好
  global: GlobalPreferences;
  updateGlobal: (key: keyof GlobalPreferences, value: any) => void;
  
  // 当前设备/应用的校准配置
  currentCalibration: CoordinateCalibration | null;
  calibrationProfile: CalibrationProfile | null;
  
  // 自动检测结果
  detectionResult: CalibrationDetectionResult | null;
  
  // 操作
  applyAutoCalibration: () => void;
  saveCurrentAsProfile: (note?: string) => void;
  resetToDefault: () => void;
  
  // 状态
  isAutoCalibrationApplied: boolean;
}

/**
 * 默认全局偏好
 */
const DEFAULT_GLOBAL: GlobalPreferences = {
  overlayScale: 1.0,
  offsetX: 0,
  offsetY: 0,
  verticalAlign: 'center' as VerticalAlign,
  autoCalibration: true
};

/**
 * localStorage key 前缀
 */
const STORAGE_PREFIX = 'visualView.';

/**
 * Hook 实现
 */
export function useVisualViewPreferences(
  deviceId: string | null,
  packageName: string | null,
  xmlViewportW: number,
  xmlViewportH: number,
  screenshotW: number,
  screenshotH: number
): VisualViewPreferences {
  // 全局偏好状态
  const [global, setGlobal] = useState<GlobalPreferences>(() => {
    return loadGlobalPreferences();
  });
  
  // 当前校准配置
  const [currentCalibration, setCurrentCalibration] = useState<CoordinateCalibration | null>(null);
  const [calibrationProfile, setCalibrationProfile] = useState<CalibrationProfile | null>(null);
  
  // 自动检测结果
  const [detectionResult, setDetectionResult] = useState<CalibrationDetectionResult | null>(null);
  
  // 标记是否已应用自动校准
  const [isAutoCalibrationApplied, setIsAutoCalibrationApplied] = useState(false);
  
  // 防止重复检测
  const lastDetectionKey = useRef<string>('');
  
  // 保存全局偏好到 localStorage
  useEffect(() => {
    saveGlobalPreferences(global);
  }, [global]);
  
  // 加载设备/应用特定校准配置（方案 C）
  useEffect(() => {
    if (!deviceId || !packageName) {
      setCalibrationProfile(null);
      setCurrentCalibration(null);
      return;
    }
    
    const profile = loadCalibrationProfile(deviceId, packageName);
    if (profile) {
      setCalibrationProfile(profile);
      setCurrentCalibration(profile.calibration);
      console.log('📂 加载校准配置:', profile);
      
      // 更新使用时间
      touchCalibrationProfile(deviceId, packageName);
    } else {
      setCalibrationProfile(null);
      setCurrentCalibration(null);
    }
  }, [deviceId, packageName]);
  
  // 自动检测校准需求（方案 A+B）
  useEffect(() => {
    if (!global.autoCalibration) {
      return;
    }
    
    // 检测键：防止重复检测
    const detectionKey = `${xmlViewportW}x${xmlViewportH}_${screenshotW}x${screenshotH}`;
    if (detectionKey === lastDetectionKey.current) {
      return;
    }
    lastDetectionKey.current = detectionKey;
    
    // 跳过无效尺寸
    if (xmlViewportW <= 0 || xmlViewportH <= 0 || screenshotW <= 0 || screenshotH <= 0) {
      return;
    }
    
    const result = detectCalibrationNeeds(
      xmlViewportW,
      xmlViewportH,
      screenshotW,
      screenshotH
    );
    
    setDetectionResult(result);
    
    // 如果需要校准且没有设备特定配置，自动应用
    if (result.needsCalibration && !calibrationProfile && result.calibration) {
      console.log('🎯 自动应用检测到的校准:', result);
      setCurrentCalibration(result.calibration);
      setIsAutoCalibrationApplied(true);
      
      // 可选：自动更新 overlayScale（方案 A，向后兼容）
      // setGlobal(prev => ({
      //   ...prev,
      //   overlayScale: result.suggestedOverlayScale
      // }));
    }
  }, [xmlViewportW, xmlViewportH, screenshotW, screenshotH, global.autoCalibration, calibrationProfile]);
  
  // 更新全局偏好
  const updateGlobal = useCallback((key: keyof GlobalPreferences, value: any) => {
    setGlobal(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // 手动应用自动校准
  const applyAutoCalibration = useCallback(() => {
    if (detectionResult?.calibration) {
      setCurrentCalibration(detectionResult.calibration);
      setIsAutoCalibrationApplied(true);
      console.log('✅ 手动应用自动校准');
    }
  }, [detectionResult]);
  
  // 保存当前配置为设备/应用特定档案
  const saveCurrentAsProfile = useCallback((note?: string) => {
    if (!deviceId || !packageName || !currentCalibration) {
      console.warn('⚠️ 无法保存：缺少必要信息');
      return;
    }
    
    const profile = createCalibrationProfile(
      deviceId,
      packageName,
      currentCalibration,
      note
    );
    
    saveCalibrationProfile(profile);
    setCalibrationProfile(profile);
    console.log('💾 已保存校准配置档案');
  }, [deviceId, packageName, currentCalibration]);
  
  // 重置为默认
  const resetToDefault = useCallback(() => {
    setGlobal(DEFAULT_GLOBAL);
    setCurrentCalibration(null);
    setIsAutoCalibrationApplied(false);
    console.log('🔄 已重置为默认配置');
  }, []);
  
  return {
    global,
    updateGlobal,
    currentCalibration,
    calibrationProfile,
    detectionResult,
    applyAutoCalibration,
    saveCurrentAsProfile,
    resetToDefault,
    isAutoCalibrationApplied
  };
}

/**
 * 从 localStorage 加载全局偏好
 */
function loadGlobalPreferences(): GlobalPreferences {
  try {
    const overlayScale = parseFloat(
      localStorage.getItem(STORAGE_PREFIX + 'overlayScale') || '1.0'
    );
    const offsetX = parseFloat(
      localStorage.getItem(STORAGE_PREFIX + 'offsetX') || '0'
    );
    const offsetY = parseFloat(
      localStorage.getItem(STORAGE_PREFIX + 'offsetY') || '0'
    );
    const verticalAlign = (
      localStorage.getItem(STORAGE_PREFIX + 'verticalAlign') || 'center'
    ) as VerticalAlign;
    const autoCalibration = 
      localStorage.getItem(STORAGE_PREFIX + 'autoCalibration') !== 'false';
    
    return {
      overlayScale,
      offsetX,
      offsetY,
      verticalAlign,
      autoCalibration
    };
  } catch (error) {
    console.error('加载全局偏好失败:', error);
    return DEFAULT_GLOBAL;
  }
}

/**
 * 保存全局偏好到 localStorage
 */
function saveGlobalPreferences(prefs: GlobalPreferences): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'overlayScale', prefs.overlayScale.toString());
    localStorage.setItem(STORAGE_PREFIX + 'offsetX', prefs.offsetX.toString());
    localStorage.setItem(STORAGE_PREFIX + 'offsetY', prefs.offsetY.toString());
    localStorage.setItem(STORAGE_PREFIX + 'verticalAlign', prefs.verticalAlign);
    localStorage.setItem(STORAGE_PREFIX + 'autoCalibration', prefs.autoCalibration.toString());
  } catch (error) {
    console.error('保存全局偏好失败:', error);
  }
}
