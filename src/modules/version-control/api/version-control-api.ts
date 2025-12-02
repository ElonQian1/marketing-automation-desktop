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

// Backend types (mapped locally for now)
interface BackendCreateVersionRequest {
  snapshot_id: string;
  parent_version_id?: string;
  branch: string;
  message: string;
  author: string;
  tags?: string[];
  custom_properties?: Record<string, string>;
}

interface BackendVersionQueryRequest {
  branch?: string;
  limit?: number;
  since?: string;
  version_type?: string;
}

interface BackendBranchRequest {
  name: string;
  base_version_id: string;
  description: string;
}

interface BackendComputeDiffRequest {
  old_snapshot_id: string;
  new_snapshot_id: string;
  algorithm?: string;
  optimize_moves?: boolean;
}

interface BackendRebuildVersionRequest {
  version_id: string;
  force_rebuild?: boolean;
}

export class VersionControlApi {
  /**
   * 创建新版本
   */
  static async createVersion(request: CreateVersionRequest): Promise<string> {
    // TODO: The backend expects a snapshot_id that exists in DOM_CACHE.
    // We need to ensure the XML content is cached before calling this.
    // For now, we map the request as best as we can.
    const backendRequest: BackendCreateVersionRequest = {
      snapshot_id: "pending_implementation", // Placeholder
      branch: "main", // Default branch
      message: request.description,
      author: "user",
      // We might need to pass xmlContent via another channel or hash it
    };
    
    return invoke('plugin:version_control|create_version', { request: backendRequest });
  }

  /**
   * 获取版本列表
   */
  static async getVersions(): Promise<VersionInfo[]> {
    const request: BackendVersionQueryRequest = {
      branch: "main",
      limit: 100
    };
    return invoke('plugin:version_control|query_versions', { request });
  }

  /**
   * 切换到指定版本 (Rebuild XML)
   */
  static async switchToVersion(request: SwitchVersionRequest): Promise<string> {
    const backendRequest: BackendRebuildVersionRequest = {
      version_id: request.versionId
    };
    return invoke('plugin:version_control|rebuild_version', { request: backendRequest });
  }

  /**
   * 获取当前版本
   */
  static async getCurrentVersion(): Promise<VersionInfo | null> {
    // Not implemented in backend yet
    console.warn("getCurrentVersion not implemented in backend");
    return null;
  }

  /**
   * 创建分支
   */
  static async createBranch(request: CreateBranchRequest): Promise<void> {
    const backendRequest: BackendBranchRequest = {
      name: request.branchName,
      base_version_id: request.fromVersion || "root",
      description: ""
    };
    return invoke('plugin:version_control|create_branch', { request: backendRequest });
  }

  /**
   * 获取分支列表
   */
  static async getBranches(): Promise<BranchInfo[]> {
    return invoke('plugin:version_control|list_branches');
  }

  /**
   * 切换分支
   */
  static async switchBranch(branchName: string): Promise<void> {
    // Client-side state change or not implemented
    console.warn("switchBranch not implemented in backend");
  }

  /**
   * 获取当前分支
   */
  static async getCurrentBranch(): Promise<string | null> {
    // Not implemented in backend
    return "main";
  }

  /**
   * 比较版本差异
   */
  static async compareVersions(request: DiffRequest): Promise<VersionDiff> {
    const backendRequest: BackendComputeDiffRequest = {
      old_snapshot_id: request.sourceVersion,
      new_snapshot_id: request.targetVersion
    };
    return invoke('plugin:version_control|compute_xml_diff', { request: backendRequest });
  }

  /**
   * 合并分支
   */
  static async mergeBranch(request: MergeRequest): Promise<string> {
    console.warn("mergeBranch not implemented in backend");
    return "";
  }

  /**
   * 删除版本
   */
  static async deleteVersion(versionId: string): Promise<void> {
    return invoke('plugin:version_control|delete_version', { version_id: versionId });
  }
}
