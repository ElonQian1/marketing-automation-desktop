// src/modules/contact-import/ui/batch-manager/hooks/useBatchData.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import { useCallback, useEffect, useState } from 'react';
import {
  listVcfBatchRecords,
  listImportSessionRecords,
  listNumbersByVcfBatch,
  listContactNumbers,
  listNumbersWithoutVcfBatch,
  listNumbersByVcfBatchFiltered,
  type VcfBatchList,
  type ImportSessionList,
  type ContactNumberList,
} from '../../services/contactNumberService';
import type { BatchFilterState } from '../types';

interface PageOptions { limit?: number; offset?: number }
interface UseBatchDataPaging {
  numbers?: PageOptions;
  sessions?: PageOptions;
}

export function useBatchData(filter: BatchFilterState & { numbersStatus?: string | null; numbersIndustry?: string | null }, paging?: UseBatchDataPaging) {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<VcfBatchList | null>(null);
  const [sessions, setSessions] = useState<ImportSessionList | null>(null);
  const [numbers, setNumbers] = useState<ContactNumberList | null>(null);

  // 提取稳定的原始依赖，避免因 filter 引用变化造成无限刷新
  const mode = filter.mode;
  const deviceId = filter.deviceId;
  const batchId = filter.batchId;
  const onlyUsed = filter.onlyUsed;
  const search = filter.search;
  const nLimit = paging?.numbers?.limit ?? 50;
  const nOffset = paging?.numbers?.offset ?? 0;
  const numbersStatus = filter.numbersStatus ?? undefined;
  const numbersIndustry = filter.numbersIndustry ?? undefined;
  // 会话维度的行业过滤（来自 FiltersBar 的 value.industry）
  const sessionsIndustry = filter.industry ?? undefined;
  const sLimit = paging?.sessions?.limit ?? 50;
  const sOffset = paging?.sessions?.offset ?? 0;

  const reload = useCallback(async () => {
    let isActive = true;
    setLoading(true);
    try {
      // 1) 批次列表（独立分页可后续扩展）
      const [b] = await Promise.all([
        listVcfBatchRecords({ limit: 50, offset: 0 }),
      ]);
      if (!isActive) return;
      setBatches(b);

      // 2) 会话列表（按设备/批次过滤）
        // 会话查询按模式拆分，不要同时传递 deviceId 与 batchId 以避免过度收窄
        const sessionsDeviceId = mode === 'by-device' ? deviceId : (mode === 'all' ? deviceId : undefined);
        const sessionsBatchId = mode === 'by-batch' ? batchId : undefined;
        const s = await listImportSessionRecords({
          deviceId: sessionsDeviceId,
          batchId: sessionsBatchId,
          industry: filter.industry,
          limit: sLimit,
          offset: sOffset,
        });
      if (!isActive) return;
      setSessions(s);

      // 3) 号码列表（根据筛选模式）
      let nums: ContactNumberList;
      if (mode === 'by-batch' && batchId) {
        // 若存在 industry/status 过滤，则使用服务端过滤版本；否则使用原有 onlyUsed 版本
        if ((numbersIndustry && numbersIndustry.trim()) || (numbersStatus && numbersStatus.trim())) {
          nums = await listNumbersByVcfBatchFiltered(batchId, { industry: numbersIndustry || undefined, status: numbersStatus || undefined, limit: nLimit, offset: nOffset });
        } else {
          nums = await listNumbersByVcfBatch(batchId, onlyUsed, { limit: nLimit, offset: nOffset });
        }
      } else if (mode === 'by-device' && deviceId) {
        // 按设备模式：显示该设备相关的所有号码（通过会话关联的批次）
        // 这里简化处理，可以根据实际需求优化
        nums = await listContactNumbers({ limit: nLimit, offset: nOffset, search, status: numbersStatus || undefined, industry: numbersIndustry || undefined });
      } else if (mode === 'no-batch') {
        nums = await listNumbersWithoutVcfBatch({ limit: nLimit, offset: nOffset, status: numbersStatus || undefined, industry: numbersIndustry || undefined });
      } else {
        nums = await listContactNumbers({ limit: nLimit, offset: nOffset, search, status: numbersStatus || undefined, industry: numbersIndustry || undefined });
      }
      if (!isActive) return;
      setNumbers(nums);
    } finally {
      if (!isActive) return;
      setLoading(false);
    }
  }, [mode, deviceId, batchId, sessionsIndustry, onlyUsed, search, numbersStatus, numbersIndustry, nLimit, nOffset, sLimit, sOffset]);

  useEffect(() => { reload(); }, [reload]);

  return { loading, batches, sessions, numbers, reload };
}
