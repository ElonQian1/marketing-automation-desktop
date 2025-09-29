import { invoke } from '@tauri-apps/api/core';

export interface NumberIdsFilter {
  search?: string | null;
  industry?: string | null;
  status?: string | null;
}

/**
 * 获取满足筛选条件的所有号码 ID（不分页）。
 * 兼容 snake/camel 传参，避免命名差异带来的问题。
 */
export async function listAllContactNumberIds(filter: NumberIdsFilter = {}): Promise<number[]> {
  const payload: any = {
    search: filter.search ?? null,
    industry: filter.industry ?? null,
    status: filter.status ?? null,
    Search: filter.search ?? null,
    Industry: filter.industry ?? null,
    Status: filter.status ?? null,
  };
  return invoke<number[]>('list_all_contact_number_ids', payload);
}
