// src/modules/version-control/api/version-control-api.ts
// module: version-control | layer: api | role: Tauri命令接口封装
// summary: 版本控制Tauri命令的TypeScript接口封装

import { invoke } from '@tauri-apps/api/core';
import type {
  VersionInfo,
  VersionDiff,
  BranchInfo,
  CreateVersionRequest,
  SwitchVersionRequest,
  CreateBranchRequest,
  DiffRequest,
  MergeRequest,
} from '../domain/types';

export class VersionControlApi {
  /**
   * 创建新版本
   */
  static async createVersion(request: CreateVersionRequest): Promise<string> {
    return invoke('create_version', {
      xmlContent: request.xmlContent,
      description: request.description,
    });
  }

  /**
   * 获取版本列表
   */
  static async getVersions(): Promise<VersionInfo[]> {
    return invoke('get_versions');
  }

  /**
   * 切换到指定版本
   */
  static async switchToVersion(request: SwitchVersionRequest): Promise<string> {
    return invoke('switch_to_version', {
      versionId: request.versionId,
    });
  }

  /**
   * 获取当前版本
   */
  static async getCurrentVersion(): Promise<VersionInfo | null> {
    return invoke('get_current_version');
  }

  /**
   * 创建分支
   */
  static async createBranch(request: CreateBranchRequest): Promise<void> {
    return invoke('create_branch', {
      branchName: request.branchName,
      fromVersion: request.fromVersion,
    });
  }

  /**
   * 获取分支列表
   */
  static async getBranches(): Promise<BranchInfo[]> {
    return invoke('get_branches');
  }

  /**
   * 切换分支
   */
  static async switchBranch(branchName: string): Promise<void> {
    return invoke('switch_branch', { branchName });
  }

  /**
   * 获取当前分支
   */
  static async getCurrentBranch(): Promise<string | null> {
    return invoke('get_current_branch');
  }

  /**
   * 比较版本差异
   */
  static async compareVersions(request: DiffRequest): Promise<VersionDiff> {
    return invoke('compare_versions', {
      sourceVersion: request.sourceVersion,
      targetVersion: request.targetVersion,
    });
  }

  /**
   * 合并分支
   */
  static async mergeBranch(request: MergeRequest): Promise<string> {
    return invoke('merge_branch', {
      sourceBranch: request.sourceBranch,
      targetBranch: request.targetBranch,
      strategy: request.strategy,
    });
  }

  /**
   * 删除版本
   */
  static async deleteVersion(versionId: string): Promise<void> {
    return invoke('delete_version', { versionId });
  }
}