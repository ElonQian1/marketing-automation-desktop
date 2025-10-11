// contact-import/domain/entities | Device | 设备核心实体定义
// 包含设备连接、状态、性能等业务概念

/**
 * 设备核心实体
 * 代表参与联系人导入的物理设备
 */
export interface Device {
  /** 设备唯一标识 */
  id: string;
  
  /** 设备名称 */
  name: string;
  
  /** 设备型号 */
  model?: string;
  
  /** 设备序列号 */
  serialNumber?: string;
  
  /** 设备类型 */
  type: DeviceType;
  
  /** 设备状态 */
  status: DeviceStatus;
  
  /** 连接类型 */
  connectionType: DeviceConnectionType;
  
  /** 设备性能指标 */
  performance: DevicePerformance;
  
  /** 设备配置信息 */
  configuration: DeviceConfiguration;
  
  /** 最后连接时间 */
  lastConnected?: Date;
  
  /** 设备能力标识 */
  capabilities: DeviceCapability[];
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 设备类型枚举
 */
export enum DeviceType {
  /** Android 手机 */
  ANDROID_PHONE = "android_phone",
  
  /** Android 平板 */
  ANDROID_TABLET = "android_tablet",
  
  /** 模拟器 */
  EMULATOR = "emulator",
  
  /** 其他设备 */
  OTHER = "other",
}

/**
 * 设备状态枚举
 */
export enum DeviceStatus {
  /** 已连接 */
  CONNECTED = "connected",
  
  /** 已断开 */
  DISCONNECTED = "disconnected",
  
  /** 连接中 */
  CONNECTING = "connecting",
  
  /** 授权中 */
  AUTHORIZING = "authorizing",
  
  /** 错误状态 */
  ERROR = "error",
  
  /** 未知状态 */
  UNKNOWN = "unknown",
}

/**
 * 设备连接类型枚举
 */
export enum DeviceConnectionType {
  /** USB连接 */
  USB = "usb",
  
  /** WiFi连接 */
  WIFI = "wifi",
  
  /** 蓝牙连接 */
  BLUETOOTH = "bluetooth",
  
  /** 网络连接 */
  NETWORK = "network",
}

/**
 * 设备性能指标
 */
export interface DevicePerformance {
  /** CPU使用率 (0-100) */
  cpuUsage: number;
  
  /** 内存使用率 (0-100) */
  memoryUsage: number;
  
  /** 电池电量 (0-100) */
  batteryLevel: number;
  
  /** 温度 (摄氏度) */
  temperature?: number;
  
  /** 网络延迟 (毫秒) */
  networkLatency?: number;
  
  /** 磁盘可用空间 (MB) */
  availableStorage?: number;
}

/**
 * 设备配置信息
 */
export interface DeviceConfiguration {
  /** Android版本 */
  androidVersion?: string;
  
  /** API级别 */
  apiLevel?: number;
  
  /** 屏幕分辨率 */
  screenResolution?: string;
  
  /** 屏幕密度 */
  screenDensity?: number;
  
  /** ADB端口 */
  adbPort?: number;
  
  /** 是否已Root */
  isRooted?: boolean;
  
  /** 安装的应用包名列表 */
  installedApps?: string[];
}

/**
 * 设备能力枚举
 */
export enum DeviceCapability {
  /** 支持ADB调试 */
  ADB_DEBUG = "adb_debug",
  
  /** 支持截屏 */
  SCREENSHOT = "screenshot",
  
  /** 支持文件传输 */
  FILE_TRANSFER = "file_transfer",
  
  /** 支持应用安装 */
  APP_INSTALL = "app_install",
  
  /** 支持通讯录访问 */
  CONTACTS_ACCESS = "contacts_access",
  
  /** 支持自动化操作 */
  AUTOMATION = "automation",
}