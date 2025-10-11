// src/modules/contact-import/ui/components/DeviceAssignmentGrid/useDeviceAssignmentState.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAdb } from '../../../../../application/hooks/useAdb';
import { getGlobalDeviceTracker } from '../../../../../infrastructure/RealTimeDeviceTracker';

export interface DeviceAssignmentRow {
  deviceId: string;
  deviceName?: string;
  industry?: string;
  idStart?: number;
  idEnd?: number;
  contactCount?: number;
}

export function useDeviceAssignmentState(value?: Record<string, Omit<DeviceAssignmentRow, 'deviceId' | 'deviceName'>>, onChange?: (v: Record<string, Omit<DeviceAssignmentRow, 'deviceId' | 'deviceName'>>) => void) {
  const { devices, getDeviceContactCount, getDeviceInfo, refreshDevices } = useAdb();
  const [rowState, setRowState] = useState<Record<string, Omit<DeviceAssignmentRow, 'deviceId' | 'deviceName'>>>(value || {});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [meta, setMeta] = useState<Record<string, { manufacturer?: string; model?: string }>>({});
  const [assignCount, setAssignCount] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isTracking, setIsTracking] = useState<boolean>(() => {
    try { return getGlobalDeviceTracker().isRunning(); } catch { return false; }
  });

  useEffect(() => { if (value) setRowState(value); }, [value]);

  const data = useMemo<DeviceAssignmentRow[]>(() => {
    return (devices || []).map(d => ({
      deviceId: d.id,
      deviceName: d.name || d.id,
      industry: rowState[d.id]?.industry,
      idStart: rowState[d.id]?.idStart,
      idEnd: rowState[d.id]?.idEnd,
      contactCount: counts[d.id],
    }));
  }, [devices, rowState, counts]);

  // 🔄 自动启动实时设备跟踪 + 首次主动刷新（兜底）
  useEffect(() => {
    const tracker = getGlobalDeviceTracker();
    
    console.log('📱 [DeviceAssignment] 检查设备跟踪器状态:', tracker.isRunning());
    
    // 启动跟踪（如果尚未启动）
    if (!tracker.isRunning()) {
      console.log('🚀 [DeviceAssignment] 启动实时设备跟踪器...');
      tracker.startTracking()
        .then(() => {
          console.log('✅ [DeviceAssignment] 实时设备跟踪器已启动');
          setIsTracking(true);
          // 兜底：触发一次设备刷新，确保初次渲染就有列表
          try {
            void refreshDevices();
          } catch (e) {
            console.warn('⚠️ [DeviceAssignment] 初次 refreshDevices 失败（可忽略）:', e);
          }
        })
        .catch((error) => {
          console.error('❌ [DeviceAssignment] 实时设备跟踪启动失败:', error);
        });
    } else {
      console.log('✅ [DeviceAssignment] 实时设备跟踪器已在运行');
      setIsTracking(true);
      // 兜底：若已在运行也主动刷一次，避免用户误以为需要手动
      try {
        void refreshDevices();
      } catch (e) {
        console.warn('⚠️ [DeviceAssignment] refreshDevices 失败（可忽略）:', e);
      }
    }

    // 组件卸载时不停止跟踪（其他组件可能需要）
    // 只在应用退出时自动清理
  }, []);

  const updateRow = (deviceId: string, patch: Partial<Omit<DeviceAssignmentRow, 'deviceId' | 'deviceName'>>) => {
    setRowState(prev => { const next = { ...prev, [deviceId]: { ...prev[deviceId], ...patch } }; onChange?.(next); return next; });
  };

  const refreshCount = async (deviceId: string) => {
    // 检查设备是否仍在列表中且在线
    const device = devices?.find(d => d.id === deviceId);
    if (!device) {
      console.warn(`[设备分配] 设备 ${deviceId} 已不存在，跳过查询`);
      setCounts(prev => ({ ...prev, [deviceId]: 0 }));
      return;
    }
    if (!device.isOnline()) {
      console.warn(`[设备分配] 设备 ${deviceId} 已断开，跳过查询`);
      setCounts(prev => ({ ...prev, [deviceId]: 0 }));
      return;
    }

    setLoadingIds(prev => ({ ...prev, [deviceId]: true }));
    try { const c = await getDeviceContactCount(deviceId); setCounts(prev => ({ ...prev, [deviceId]: c })); }
    finally { setLoadingIds(prev => ({ ...prev, [deviceId]: false })); }
  };

  const refreshAllCounts = async () => {
    const list = devices || [];
    // 仅对在线设备查询
    const onlineDevices = list.filter(d => d.isOnline());
    console.log(`[设备分配] 刷新所有设备联系人数量: ${onlineDevices.length}/${list.length} 在线`);
    
    const queue = [...onlineDevices.map(d => d.id)];
    while (queue.length) { const id = queue.shift(); if (!id) break; await refreshCount(id); }
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      const list = devices || [];
      const results: Record<string, { manufacturer?: string; model?: string }> = {};
      for (const d of list) {
        try { const info = await getDeviceInfo(d.id).catch(() => null); if (info && !canceled) { results[d.id] = { manufacturer: (info as any)?.manufacturer, model: (info as any)?.model }; } }
        catch {}
      }
      if (!canceled) setMeta(results);
    })();
    return () => { canceled = true; };
  }, [devices, getDeviceInfo]);

  // 设备变化时，自动刷新所有设备的联系人计数（轻微延迟，避免抖动）
  useEffect(() => {
    const list = devices || [];
    console.log('🧮 [DeviceAssignment] 设备变化，准备刷新联系人计数:', { count: list.length, ids: list.map(d => d.id) });
    const timer = setTimeout(() => {
      if (list.length === 0) {
        // 清空计数以保持 UI 一致
        setCounts({});
        console.log('🧹 [DeviceAssignment] 设备为空，清空联系人计数');
      } else {
        void refreshAllCounts();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [devices]);

  const autoAssignRange = useCallback((deviceId: string, count: number) => {
    const n = Math.max(1, Math.floor(count || 0));
    const all = Object.values(rowState);
    const maxEnd = all.reduce((m, r) => (typeof r.idEnd === 'number' ? Math.max(m, r.idEnd!) : m), -1);
    const start = Math.max(0, maxEnd + 1);
    const end = start + (n - 1);
    updateRow(deviceId, { idStart: start, idEnd: end });
  }, [rowState]);

  // selection helpers
  const allIds = useMemo(() => (devices || []).map(d => d.id), [devices]);
  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => !!v).map(([id]) => id), [selected]);
  const allSelected = allIds.length > 0 && allIds.every(id => !!selected[id]);
  const toggleSelectAll = (checked: boolean) => { const next: Record<string, boolean> = {}; for (const id of allIds) next[id] = checked; setSelected(next); };
  const clearSelection = () => setSelected({});

  useEffect(() => {
    const next: Record<string, number> = { ...assignCount };
    for (const [did, r] of Object.entries(rowState)) {
      if (typeof r?.idStart === 'number' && typeof r?.idEnd === 'number' && r.idEnd >= r.idStart) next[did] = r.idEnd - r.idStart + 1;
      else if (next[did] == null) next[did] = 100;
    }
    setAssignCount(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowState]);

  return {
    devices,
    refreshDevices,
    rowState, setRowState, updateRow,
    counts, loadingIds, refreshCount, refreshAllCounts,
    meta,
    assignCount, setAssignCount,
    selected, setSelected, selectedIds, allSelected, toggleSelectAll, clearSelection,
    autoAssignRange,
    data,
    isTracking,
  };
}
