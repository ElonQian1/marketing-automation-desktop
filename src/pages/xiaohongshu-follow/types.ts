/**
 * 小红书关注页面类型定义
 */

export interface FollowConfig {
  max_pages: number;
  follow_interval: number;
  skip_existing: boolean;
  return_to_home: boolean;
}

export interface SimpleFollowResult {
  success: boolean;
  totalFollowed: number;
  failedAttempts: number;
  message: string;
}

export interface FollowProgress {
  currentPage: number;
  totalPages: number;
  followedCount: number;
  skippedCount: number;
  errorCount: number;
  isRunning: boolean;
  logs: string[];
}

export interface DeviceConfig {
  selectedDevice: string;
  connectionType: 'short' | 'long';
}