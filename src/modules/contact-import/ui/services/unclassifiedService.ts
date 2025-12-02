// src/modules/contact-import/ui/services/unclassifiedService.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import { invoke } from '@tauri-apps/api/core';
import type { ContactNumberDto } from './contactNumberService';

export async function fetchUnclassifiedNumbers(count: number, onlyUnconsumed = true): Promise<ContactNumberDto[]> {
  // Tauri 2.0 使用驼峰命名序列化参数
  return invoke<ContactNumberDto[]>('plugin:contacts|fetch_unclassified_contact_numbers', { count, onlyUnconsumed });
}

export function pickFirstNIds(items: ContactNumberDto[], n: number): number[] {
  const ids = items.map(i => i.id);
  return ids.slice(0, Math.max(0, n));
}
