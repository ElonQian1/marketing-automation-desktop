// src/modules/contact-import/ui/services/unclassifiedService.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import { invoke } from '@tauri-apps/api/core';
import type { ContactNumberDto } from './contactNumberService';

export async function fetchUnclassifiedNumbers(count: number, onlyUnconsumed = true): Promise<ContactNumberDto[]> {
  return invoke<ContactNumberDto[]>('fetch_unclassified_contact_numbers', { count, only_unconsumed: onlyUnconsumed });
}

export function pickFirstNIds(items: ContactNumberDto[], n: number): number[] {
  const ids = items.map(i => i.id);
  return ids.slice(0, Math.max(0, n));
}
