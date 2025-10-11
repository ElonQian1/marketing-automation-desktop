// src/pages/app-launch-test/types/AppLaunchTestTypes.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 应用启动测试相关类型定义
 */

export interface AppInfo {
  package_name: string;
  app_name: string;
  version_name?: string;
  is_system_app: boolean;
  main_activity?: string;
}

export interface AppStateResult {
  state: string;
  is_functional: boolean;
  message: string;
  checked_elements: number;
  total_checks: number;
}

export interface AppLaunchResult {
  success: boolean;
  message: string;
  package_name: string;
  launch_time_ms: number;
  app_state?: AppStateResult;
  ready_time_ms?: number;
  startup_issues: string[];
}

export interface Device {
  id: string;
  name: string;
  status: string;
}

export interface ControlPanelProps {
  devices: Device[];
  selectedDevice: string;
  setSelectedDevice: (deviceId: string) => void;
  apps: AppInfo[];
  selectedApp: string;
  setSelectedApp: (packageName: string) => void;
  isLaunching: boolean;
  onLaunchApp: () => void;
  onRefreshDevices: () => void;
}

export interface LaunchResultProps {
  isLaunching: boolean;
  launchResult: AppLaunchResult | null;
  getStateColor: (state: string) => string;
  getStateText: (state: string) => string;
}

export interface LaunchHistoryProps {
  launchHistory: AppLaunchResult[];
  apps: AppInfo[];
  getStateColor: (state: string) => string;
  getStateText: (state: string) => string;
}

export interface FeatureDescriptionProps {
  // 纯展示组件，暂无特定属性
}