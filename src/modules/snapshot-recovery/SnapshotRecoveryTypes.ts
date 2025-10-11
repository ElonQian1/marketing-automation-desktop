// src/modules/snapshot-recovery/SnapshotRecoveryTypes.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

export interface SnapshotInfo {
  xmlContent: string;
  xmlCacheId: string;
  deviceId?: string;
  deviceName?: string;
  timestamp: number;
  elementCount?: number;
  appPackage?: string;
  pageTitle?: string;
}
