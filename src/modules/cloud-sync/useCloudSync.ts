// src/modules/cloud-sync/useCloudSync.ts
// module: cloud-sync | layer: hooks | role: 云同步 Hook
// summary: React Hook 封装云同步服务

import { useState, useEffect, useCallback } from 'react';
import { cloudSyncService } from './cloud-sync-service';
import type { DeviceConfig, CommentData, StatsResponse } from './cloud-sync-types';

interface UseCloudSyncState {
  /** 设备ID */
  deviceId: string | null;
  /** 服务器是否可用 */
  serverOnline: boolean;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

interface UseCloudSyncActions {
  /** 检查服务器状态 */
  checkServer: () => Promise<boolean>;
  /** 获取设备配置 */
  getConfig: () => Promise<DeviceConfig | null>;
  /** 保存设备配置 */
  saveConfig: (config: Record<string, unknown>) => Promise<void>;
  /** 上传评论 */
  uploadComments: (comments: CommentData[]) => Promise<{ inserted: number; success: boolean }>;
  /** 获取统计 */
  getStats: () => Promise<StatsResponse | null>;
}

export function useCloudSync(): UseCloudSyncState & UseCloudSyncActions {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        const id = await cloudSyncService.getDeviceId();
        setDeviceId(id);
        
        const online = await cloudSyncService.healthCheck();
        setServerOnline(online);
      } catch (e) {
        setError(e instanceof Error ? e.message : '初始化失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const checkServer = useCallback(async () => {
    const online = await cloudSyncService.healthCheck();
    setServerOnline(online);
    return online;
  }, []);

  const getConfig = useCallback(async () => {
    if (!serverOnline) return null;
    try {
      return await cloudSyncService.getDeviceConfig();
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取配置失败');
      return null;
    }
  }, [serverOnline]);

  const saveConfig = useCallback(async (config: Record<string, unknown>) => {
    if (!serverOnline) {
      throw new Error('服务器不可用');
    }
    try {
      await cloudSyncService.syncConfig(config);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存配置失败';
      setError(msg);
      throw new Error(msg);
    }
  }, [serverOnline]);

  const uploadComments = useCallback(async (comments: CommentData[]) => {
    if (!serverOnline) {
      throw new Error('服务器不可用');
    }
    try {
      const result = await cloudSyncService.uploadComments(comments);
      return { inserted: result.insertedCount, success: result.success };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '上传评论失败';
      setError(msg);
      throw new Error(msg);
    }
  }, [serverOnline]);

  const getStats = useCallback(async () => {
    if (!serverOnline) return null;
    try {
      return await cloudSyncService.getStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取统计失败');
      return null;
    }
  }, [serverOnline]);

  return {
    deviceId,
    serverOnline,
    loading,
    error,
    checkServer,
    getConfig,
    saveConfig,
    uploadComments,
    getStats,
  };
}
