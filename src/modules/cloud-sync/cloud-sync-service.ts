// src/modules/cloud-sync/cloud-sync-service.ts
// module: cloud-sync | layer: services | role: 云同步服务
// summary: 封装与服务端的 HTTP 通信

import { invoke } from '@tauri-apps/api/core';
import type {
  DeviceConfig,
  CommentData,
  BatchUploadRequest,
  BatchUploadResponse,
  CommentsPageResponse,
  StatsResponse,
  AIFallbackResponse,
} from './cloud-sync-types';

/** 云同步服务 - 单例 */
class CloudSyncService {
  private serverUrl: string | null = null;
  private deviceId: string | null = null;

  /** 获取服务器地址 */
  async getServerUrl(): Promise<string> {
    if (!this.serverUrl) {
      this.serverUrl = await invoke<string>('plugin:cloud_sync|get_cloud_server_url');
    }
    return this.serverUrl;
  }

  /** 获取本机设备ID */
  async getDeviceId(): Promise<string> {
    if (!this.deviceId) {
      this.deviceId = await invoke<string>('plugin:cloud_sync|get_machine_id');
    }
    return this.deviceId;
  }

  /** 通用请求方法 */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const baseUrl = await this.getServerUrl();
    const url = `${baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // ============ 设备配置 API ============

  /** 获取设备配置 */
  async getDeviceConfig(deviceId?: string): Promise<DeviceConfig | null> {
    const id = deviceId || (await this.getDeviceId());
    try {
      return await this.request<DeviceConfig>('GET', `/api/device/${id}/config`);
    } catch (error) {
      // 404 表示设备不存在，返回 null
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /** 保存设备配置 */
  async saveDeviceConfig(config: Partial<DeviceConfig>): Promise<DeviceConfig> {
    const deviceId = config.deviceId || (await this.getDeviceId());
    return this.request<DeviceConfig>('PUT', `/api/device/${deviceId}/config`, {
      ...config,
      deviceId: deviceId,
      deviceType: config.deviceType || 'pc',
    });
  }

  /** 同步配置（合并本地和云端） */
  async syncConfig(localConfig: Record<string, unknown>): Promise<DeviceConfig> {
    const deviceId = await this.getDeviceId();
    const remote = await this.getDeviceConfig(deviceId);

    // 合并策略：本地覆盖云端（本地优先）
    const merged: Partial<DeviceConfig> = {
      deviceId: deviceId,
      deviceType: 'pc',
      configJson: {
        ...(remote?.configJson || {}),
        ...localConfig,
      },
    };

    return this.saveDeviceConfig(merged);
  }

  // ============ 评论 API ============

  /** 批量上传评论 */
  async uploadComments(comments: CommentData[]): Promise<BatchUploadResponse> {
    const deviceId = await this.getDeviceId();
    const request: BatchUploadRequest = {
      deviceId: deviceId,
      comments,
    };
    return this.request<BatchUploadResponse>('POST', '/api/comments/batch', request);
  }

  /** 获取评论列表 */
  async getComments(
    page = 1,
    pageSize = 50,
    deviceId?: string
  ): Promise<CommentsPageResponse> {
    const id = deviceId || (await this.getDeviceId());
    return this.request<CommentsPageResponse>(
      'GET',
      `/api/comments?deviceId=${id}&page=${page}&pageSize=${pageSize}`
    );
  }

  // ============ AI 配置 API ============

  /** 获取备用 AI Key */
  async getAIFallback(): Promise<AIFallbackResponse> {
    return this.request<AIFallbackResponse>('GET', '/api/ai-config/fallback');
  }

  // ============ 统计 API ============

  /** 获取统计数据 */
  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('GET', '/api/stats');
  }

  /** 导出 CSV 下载链接 */
  async getExportCsvUrl(deviceId?: string): Promise<string> {
    const baseUrl = await this.getServerUrl();
    const id = deviceId ? `?device_id=${deviceId}` : '';
    return `${baseUrl}/api/export/csv${id}`;
  }

  // ============ 健康检查 ============

  /** 检查服务器是否可用 */
  async healthCheck(): Promise<boolean> {
    try {
      const baseUrl = await this.getServerUrl();
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/** 导出单例 */
export const cloudSyncService = new CloudSyncService();
