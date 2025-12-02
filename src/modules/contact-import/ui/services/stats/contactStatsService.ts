// src/modules/contact-import/ui/services/stats/contactStatsService.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import { invoke } from '@tauri-apps/api/core';

export interface IndustryCountDto {
  industry: string;
  count: number;
}

export interface ContactNumberStatsDto {
  total: number;
  unclassified: number;
  not_imported: number;
  per_industry: IndustryCountDto[];
}

export async function getContactNumberStats(): Promise<ContactNumberStatsDto> {
  return invoke<ContactNumberStatsDto>('plugin:contacts|get_stats');
}

export async function setIndustryByIdRange(startId: number, endId: number, industry: string): Promise<number> {
  return invoke<number>('set_contact_numbers_industry_by_id_range', { start_id: startId, end_id: endId, industry });
}
