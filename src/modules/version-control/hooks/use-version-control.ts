// src/modules/version-control/hooks/use-version-control.ts
// module: version-control | layer: hooks | role: 版本控制状态管理Hook
// summary: 统一的版本控制状态管理和操作接口

import { useState, useEffect, useCallback } from 'react';
import { VersionControlApi } from '../api/version-control-api';
import type {
  VersionState,
  VersionInfo,
  BranchInfo,
  CreateVersionRequest,
  CreateBranchRequest,
  DiffRequest,
  MergeRequest,
  VersionDiff,
} from '../domain/types';

export const useVersionControl = () => {
  const [state, setState] = useState<VersionState>({
    currentBranch: null,
    branches: [],
    currentVersion: null,
    isLoading: false,
    error: null,
  });

  // 设置加载状态
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // 设置错误状态
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // 加载初始数据
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [branches, currentBranch, currentVersion] = await Promise.all([
        VersionControlApi.getBranches(),
        VersionControlApi.getCurrentBranch(),
        VersionControlApi.getCurrentVersion(),
      ]);

      setState(prev => ({
        ...prev,
        branches,
        currentBranch,
        currentVersion: currentVersion?.id || null,
        isLoading: false,
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : '加载数据失败');
      setLoading(false);
    }
  }, [setLoading, setError]);

  // 创建新版本
  const createVersion = useCallback(async (request: CreateVersionRequest) => {
    try {
      setLoading(true);
      setError(null);

      const versionId = await VersionControlApi.createVersion(request);
      
      // 重新加载数据
      await loadInitialData();
      
      return versionId;
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建版本失败');
      throw error;
    }
  }, [loadInitialData, setLoading, setError]);

  // 切换版本
  const switchToVersion = useCallback(async (versionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const xmlContent = await VersionControlApi.switchToVersion({ versionId });
      
      setState(prev => ({
        ...prev,
        currentVersion: versionId,
        isLoading: false,
      }));

      return xmlContent;
    } catch (error) {
      setError(error instanceof Error ? error.message : '切换版本失败');
      throw error;
    }
  }, [setLoading, setError]);

  // 创建分支
  const createBranch = useCallback(async (request: CreateBranchRequest) => {
    try {
      setLoading(true);
      setError(null);

      await VersionControlApi.createBranch(request);
      
      // 重新加载数据
      await loadInitialData();
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建分支失败');
      throw error;
    }
  }, [loadInitialData, setLoading, setError]);

  // 切换分支
  const switchBranch = useCallback(async (branchName: string) => {
    try {
      setLoading(true);
      setError(null);

      await VersionControlApi.switchBranch(branchName);
      
      setState(prev => ({
        ...prev,
        currentBranch: branchName,
        isLoading: false,
      }));

      // 重新加载当前版本信息
      const currentVersion = await VersionControlApi.getCurrentVersion();
      setState(prev => ({
        ...prev,
        currentVersion: currentVersion?.id || null,
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : '切换分支失败');
      throw error;
    }
  }, [setLoading, setError]);

  // 比较版本
  const compareVersions = useCallback(async (request: DiffRequest): Promise<VersionDiff> => {
    try {
      setError(null);
      return await VersionControlApi.compareVersions(request);
    } catch (error) {
      setError(error instanceof Error ? error.message : '比较版本失败');
      throw error;
    }
  }, [setError]);

  // 合并分支
  const mergeBranch = useCallback(async (request: MergeRequest) => {
    try {
      setLoading(true);
      setError(null);

      const result = await VersionControlApi.mergeBranch(request);
      
      // 重新加载数据
      await loadInitialData();
      
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : '合并分支失败');
      throw error;
    }
  }, [loadInitialData, setLoading, setError]);

  // 删除版本
  const deleteVersion = useCallback(async (versionId: string) => {
    try {
      setLoading(true);
      setError(null);

      await VersionControlApi.deleteVersion(versionId);
      
      // 重新加载数据
      await loadInitialData();
    } catch (error) {
      setError(error instanceof Error ? error.message : '删除版本失败');
      throw error;
    }
  }, [loadInitialData, setLoading, setError]);

  // 获取版本列表
  const getVersions = useCallback(async (): Promise<VersionInfo[]> => {
    try {
      return await VersionControlApi.getVersions();
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取版本列表失败');
      throw error;
    }
  }, [setError]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    // 状态
    ...state,
    
    // 操作方法
    createVersion,
    switchToVersion,
    createBranch,
    switchBranch,
    compareVersions,
    mergeBranch,
    deleteVersion,
    getVersions,
    
    // 辅助方法
    loadInitialData,
    setError,
  };
};