// src/modules/cloud-sync/cloud-sync-types.ts
// module: cloud-sync | layer: domain | role: 云同步类型定义
// summary: 与服务端 API 对应的数据结构（使用 camelCase 匹配 Rust serde）

/** 设备类型 */
export type DeviceType = 'pc' | 'android';

/** 设备配置 */
export interface DeviceConfig {
  deviceId: string;
  deviceType: DeviceType;
  deviceName?: string;
  aiApiKey?: string;
  aiProvider?: string;
  configJson: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/** 评论数据 */
export interface CommentData {
  id: string;
  platform: string;
  videoUrl?: string;
  author: string;
  content: string;
  ts?: number;
}

/** 批量上传请求 */
export interface BatchUploadRequest {
  deviceId: string;
  comments: CommentData[];
}

/** 批量上传响应 */
export interface BatchUploadResponse {
  success: boolean;
  insertedCount: number;
  message?: string;
}

/** 分页评论响应 */
export interface CommentsPageResponse {
  comments: CommentData[];
  total: number;
  page: number;
  pageSize: number;
}

/** 统计数据 */
export interface StatsResponse {
  success: boolean;
  totalComments: number;
  byPlatform: { platform: string; count: number }[];
  byDevice: { deviceId: string; count: number }[];
}

/** AI 配置回退响应 */
export interface AIFallbackResponse {
  hasFallback: boolean;
  provider?: string;
  key?: string;
}
