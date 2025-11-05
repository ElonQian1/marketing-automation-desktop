// src/modules/version-control/index.ts
// module: version-control | layer: public | role: 模块导出入口
// summary: 版本控制模块的统一导出接口

// 导出类型定义
export type {
  VersionInfo,
  VersionDiff,
  VersionNode,
  BranchInfo,
  VersionState,
  CreateVersionRequest,
  SwitchVersionRequest,
  CreateBranchRequest,
  DiffRequest,
  MergeRequest,
} from './domain/types';

// 导出Hook
export { useVersionControl } from './hooks/use-version-control';

// 导出UI组件
export { VersionControlPanel } from './ui/version-control-panel';

// 导出API（仅在需要直接调用时使用）
export { VersionControlApi } from './api/version-control-api';