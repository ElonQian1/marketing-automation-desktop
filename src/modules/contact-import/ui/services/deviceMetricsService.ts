// src/modules/contact-import/ui/services/deviceMetricsService.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import { invoke } from '@tauri-apps/api/core';

/**
 * 获取指定设备的联系人数量（通过后端 ADB content query）
 */
export async function getDeviceContactCount(deviceId: string): Promise<number> {
  try {
    // 后端命令参数为 snake_case: device_id
    const payload = { device_id: deviceId, deviceId } as any; // 兼容双写法
    try { console.debug('[deviceMetricsService.getDeviceContactCount] invoke payload:', payload); } catch {}
    const count = await invoke<number>('plugin:contacts|get_device_contact_count', payload);
    // 后端返回 i32，这里转为 number 并确保非负
    return Math.max(0, Number(count || 0));
  } catch (e) {
    console.error('getDeviceContactCount failed:', e);
    return 0;
  }
}
