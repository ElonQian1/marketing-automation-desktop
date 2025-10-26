// src/pages/adb/auth/types.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

export enum AuthStep {
  PREREQUISITES = 'prereq',
  ADB_PATH = 'adb_path',
  USB_TRUST = 'usb',
  WIRELESS = 'wireless',
  VERIFY = 'verify',
  DONE = 'done',
}

export enum AuthStatus {
  IDLE = 'idle',
  IN_PROGRESS = 'in-progress',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export interface AuthProgress {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  message?: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'unauthorized' | 'unknown';
  isWireless: boolean;
  apiLevel?: number;
}

export interface AdbPathConfig {
  detectedPath: string | null;
  isDetecting: boolean;
  isCustomPath: boolean;
  customPath: string | null;
  isPathValid: boolean;
}

export interface WirelessConfig {
  ip: string;
  port: number;
  pairPort?: number;
  pairCode?: string;
  isConnected: boolean;
}

export interface AuthState {
  step: AuthStep;
  status: AuthStatus;
  busy: boolean;
  logs: string[];
  errors: AuthError[];
  progress: AuthProgress | null;
  
  // ADB路径检测状态
  adbPathConfig: AdbPathConfig;
  
  // USB 授权状态
  userConfirmedUsbAllow: boolean;
  hasShownUsbDialog: boolean;
  
  // 无线调试状态  
  wirelessConfig: WirelessConfig | null;
  wirelessEnabled: boolean;
  
  // 设备状态
  connectedDevices: DeviceInfo[];
  selectedDeviceId: string | null;
  
  // 持久化配置
  rememberSettings: boolean;
  autoSkipCompleted: boolean;
}

export type AuthAction =
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GOTO'; step: AuthStep }
  | { type: 'RESET' }
  | { type: 'SET_STATUS'; status: AuthStatus }
  | { type: 'SET_BUSY'; busy: boolean }
  | { type: 'LOG'; msg: string; level?: 'info' | 'success' | 'warning' | 'error' }
  | { type: 'CLEAR_LOGS' }
  | { type: 'ADD_ERROR'; error: Omit<AuthError, 'timestamp'> }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_PROGRESS'; progress: AuthProgress | null }
  | { type: 'SET_ADB_PATH_DETECTING'; isDetecting: boolean }
  | { type: 'SET_ADB_PATH_DETECTED'; path: string | null }
  | { type: 'SET_ADB_PATH_CUSTOM'; path: string; isCustom: boolean }
  | { type: 'SET_ADB_PATH_VALID'; isValid: boolean }
  | { type: 'SET_USB_CONFIRMED'; value: boolean }
  | { type: 'SET_USB_DIALOG_SHOWN'; value: boolean }
  | { type: 'SET_WIRELESS_CONFIG'; config: WirelessConfig | null }
  | { type: 'SET_WIRELESS_ENABLED'; enabled: boolean }
  | { type: 'UPDATE_DEVICES'; devices: DeviceInfo[] }
  | { type: 'SELECT_DEVICE'; deviceId: string | null }
  | { type: 'SET_REMEMBER_SETTINGS'; value: boolean }
  | { type: 'SET_AUTO_SKIP'; value: boolean };

export const initialAuthState: AuthState = {
  step: AuthStep.PREREQUISITES,
  status: AuthStatus.IDLE,
  busy: false,
  logs: [],
  errors: [],
  progress: null,
  adbPathConfig: {
    detectedPath: null,
    isDetecting: false,
    isCustomPath: false,
    customPath: null,
    isPathValid: false,
  },
  userConfirmedUsbAllow: false,
  hasShownUsbDialog: false,
  wirelessConfig: null,
  wirelessEnabled: false,
  connectedDevices: [],
  selectedDeviceId: null,
  rememberSettings: true,
  autoSkipCompleted: false,
};
