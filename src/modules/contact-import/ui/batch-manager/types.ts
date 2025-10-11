// src/modules/contact-import/ui/batch-manager/types.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import type { ContactNumberList, VcfBatchDto, ImportSessionDto, ImportSessionList, VcfBatchList } from "../services/contactNumberService";

export type { ContactNumberList, VcfBatchDto, ImportSessionDto, ImportSessionList, VcfBatchList };

export interface BatchFilterState {
  mode: 'all' | 'by-batch' | 'by-device' | 'no-batch';
  batchId?: string;
  deviceId?: string;
  onlyUsed?: boolean; // 仅显示已导入（used_batch 命中批次）
  search?: string;
  industry?: string; // 行业筛选：不限/电商/医疗/...
}
