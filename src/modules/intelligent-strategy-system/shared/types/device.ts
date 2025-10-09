/**
 * 统一的设备和应用类型定义
 * 
 * @description 替换项目中重复的设备、应用、屏幕相关类型定义
 */

/**
 * 设备配置信息（统一 DeviceProfile 定义）
 */
export interface DeviceProfile {
  name: string;
  manufacturer: string;
  model: string;
  screenSize: string;
  resolution: string;
  androidVersion: string;
  characteristics: string[];
}

/**
 * 屏幕信息
 */
export interface ScreenInfo {
  width: number;
  height: number;
  density: number;
  orientation: 'portrait' | 'landscape';
  aspectRatio: string;
  scaleFactor: number;
}

/**
 * 分辨率配置（统一 ResolutionProfile 定义）
 */
export interface ResolutionProfile {
  name: string;
  width: number;
  height: number;
  density: number;
  aspectRatio: string;
}

/**
 * 应用信息
 */
export interface AppInfo {
  packageName: string;
  activityName: string;
  version: string;
  versionCode: number;
  targetSdk: number;
  minSdk: number;
  features: string[];
  permissions: string[];
}

/**
 * 应用版本配置
 */
export interface AppVersionProfile {
  version: string;
  releaseDate: string;
  majorChanges: string[];
  uiChanges: string[];
}

/**
 * 设备信息（运行时）
 */
export interface DeviceInfo {
  deviceId: string;
  brand: string;
  model: string;
  androidVersion: string;
  apiLevel: number;
  architecture: string;
  screenInfo: ScreenInfo;
  systemFeatures: string[];
  installedApps: string[];
}

/**
 * 设备兼容性结果
 */
export interface DeviceCompatibilityResult {
  device: string;
  isCompatible: boolean;
  compatibilityScore: number;
  issues: string[];
  recommendations: string[];
}

/**
 * 设备兼容性报告
 */
export interface DeviceCompatibilityReport {
  strategy: string;
  overallCompatibility: number;
  deviceResults: DeviceCompatibilityResult[];
  recommendedDevices: string[];
  problematicDevices: string[];
  optimizationSuggestions: string[];
}

/**
 * 分辨率测试结果
 */
export interface ResolutionTestResult {
  resolution: string;
  isAdaptable: boolean;
  adaptabilityScore: number;
  scalingIssues: string[];
  recommendations: string[];
}

/**
 * 分辨率适应性报告
 */
export interface ResolutionAdaptabilityReport {
  strategy: string;
  overallScore: number;
  adaptabilityLevel: string;
  resolutionResults: ResolutionTestResult[];
  criticalResolutions: string[];
  recommendations: string[];
}