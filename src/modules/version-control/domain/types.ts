// src/modules/version-control/domain/types.ts
// module: version-control | layer: domain | role: 类型定义与核心实体
// summary: 版本控制系统的类型定义和业务实体

export interface VersionInfo {
  id: string;
  timestamp: string;
  description: string;
  xmlPath: string;
  size: number;
}

export interface VersionDiff {
  added: VersionNode[];
  removed: VersionNode[];
  modified: VersionNode[];
}

export interface VersionNode {
  tag: string;
  attributes: Record<string, string>;
  children: VersionNode[];
  text?: string;
}

export interface BranchInfo {
  name: string;
  currentVersion?: string;
  versions: VersionInfo[];
}

export interface VersionState {
  currentBranch: string | null;
  branches: BranchInfo[];
  currentVersion: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateVersionRequest {
  xmlContent: string;
  description: string;
}

export interface SwitchVersionRequest {
  versionId: string;
}

export interface CreateBranchRequest {
  branchName: string;
  fromVersion?: string;
}

export interface DiffRequest {
  sourceVersion: string;
  targetVersion: string;
}

export interface MergeRequest {
  sourceBranch: string;
  targetBranch: string;
  strategy: 'ours' | 'theirs' | 'auto';
}