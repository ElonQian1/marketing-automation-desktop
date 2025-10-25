// src/modules/contact-import/ui/services/deviceBatchBinding.ts
// module: contact-import | layer: ui | role: service
// summary: 设备批次绑定服务

// 内存中的设备绑定映射
const deviceBindings = new Map<string, { pending: string[]; imported: string[] }>();

/**
 * 获取设备的批次绑定统计数据
 * @param deviceId 设备ID
 * @returns 返回该设备的待处理和已导入批次数量
 */
export function getBindingStats(deviceId: string): { pending: number; imported: number } {
  const bindings = getBindings(deviceId);
  return {
    pending: bindings.pending.length,
    imported: bindings.imported.length
  };
}

/**
 * 获取设备的批次绑定状态
 * @param deviceId 设备ID
 * @returns 返回该设备的待处理和已导入批次状态对象
 */
export function getBindings(deviceId: string) {
  const bindings = deviceBindings.get(deviceId);
  if (!bindings) {
    // 初始化设备绑定状态
    const newBindings = { pending: [], imported: [] };
    deviceBindings.set(deviceId, newBindings);
    return {
      pending: newBindings.pending,
      imported: newBindings.imported
    };
  }
  return {
    pending: bindings.pending,
    imported: bindings.imported
  };
}

/**
 * 将批次绑定到设备（标记为待处理状态）
 * @param deviceId 设备ID
 * @param batchId 批次ID
 */
export function bindBatchToDevice(deviceId: string, batchId: string) {
  const bindings = getBindings(deviceId);
  
  // 避免重复添加
  if (!bindings.pending.includes(batchId)) {
    bindings.pending.push(batchId);
  }
  
  console.log(`✅ 批次 ${batchId} 已绑定到设备 ${deviceId}，当前待处理: ${bindings.pending.length}`);
  
  return Promise.resolve();
}

/**
 * 标记批次为已导入状态（从待处理移动到已导入）
 * @param deviceId 设备ID
 * @param batchId 批次ID
 */
export function markBatchImportedForDevice(deviceId: string, batchId: string) {
  const bindings = getBindings(deviceId);
  
  // 从待处理列表中移除
  const pendingIndex = bindings.pending.indexOf(batchId);
  if (pendingIndex !== -1) {
    bindings.pending.splice(pendingIndex, 1);
  }
  
  // 添加到已导入列表（避免重复）
  if (!bindings.imported.includes(batchId)) {
    bindings.imported.push(batchId);
  }
  
  console.log(`✅ 批次 ${batchId} 已标记为导入完成，设备 ${deviceId} 已导入: ${bindings.imported.length}`);
  
  return Promise.resolve();
}

/**
 * 清理设备的所有绑定（调试/重置用）
 * @param deviceId 设备ID
 */
export function clearDeviceBindings(deviceId: string) {
  deviceBindings.delete(deviceId);
  console.log(`🧹 已清理设备 ${deviceId} 的所有绑定状态`);
}

/**
 * 获取所有设备的绑定状态概览（调试用）
 */
export function getAllBindingsOverview() {
  const overview: Record<string, { pending: number; imported: number }> = {};
  
  for (const [deviceId, bindings] of deviceBindings.entries()) {
    overview[deviceId] = {
      pending: bindings.pending.length,
      imported: bindings.imported.length
    };
  }
  
  return overview;
}
