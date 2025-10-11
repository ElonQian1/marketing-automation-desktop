// src/modules/contact-import/ui/services/contactNumberService.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

﻿// modules/contact-import/ui/services | contactNumberService | 联系人号码服务
// 负责联系人号码的导入、验证和管理，提供文件上传和批量处理功能

import { invoke } from '@tauri-apps/api/core';

export interface ImportNumbersResult {
  success: boolean;
  total_files: number;
  total_numbers: number;
  inserted: number;
  duplicates: number;
  errors: string[];
}

export async function importNumbersFromTxtFile(filePath: string): Promise<ImportNumbersResult> {
  return invoke<ImportNumbersResult>('import_contact_numbers_from_file', { filePath });
}

export async function importNumbersFromFolder(folderPath: string): Promise<ImportNumbersResult> {
  return invoke<ImportNumbersResult>('import_contact_numbers_from_folder', { folderPath });
}

export async function importNumbersFromFolders(folderPaths: string[]): Promise<ImportNumbersResult> {
  // 顺序执行并聚合结果，避免并发导致数据库锁竞争（如使用SQLite）
  const aggregate: ImportNumbersResult = { success: true, total_files: 0, total_numbers: 0, inserted: 0, duplicates: 0, errors: [] };
  for (const dir of folderPaths) {
    try {
      const res = await importNumbersFromFolder(dir);
      aggregate.total_files += res.total_files;
      aggregate.total_numbers += res.total_numbers;
      aggregate.inserted += res.inserted;
      aggregate.duplicates += res.duplicates;
      if (!res.success) {
        aggregate.success = false;
        aggregate.errors.push(...(res.errors || []));
      }
    } catch (e: any) {
      aggregate.success = false;
      aggregate.errors.push(String(e?.message || e));
    }
  }
  return aggregate;
}

export interface ContactNumberDto {
  id: number;
  phone: string;
  name: string;
  source_file: string;
  created_at: string;
  // V2.0 字段：业务元数据（与后端模型保持一致）
  industry?: string | null;
  status?: 'available' | 'assigned' | 'imported' | 'not_imported' | 'vcf_generated' | null;
  assigned_at?: string | null;
  assigned_batch_id?: string | null;
  imported_session_id?: number | null;
  imported_device_id?: string | null;
}

export interface ContactNumberList {
  total: number;
  items: ContactNumberDto[];
}

export async function listContactNumbers(params: { limit?: number; offset?: number; search?: string; industry?: string; status?: string } = {}): Promise<ContactNumberList> {
  const { limit, offset, search, industry, status } = params;
  // 混合大小写键，兼容后端命名差异；行业“未分类”用特殊键传递 __UNCLASSIFIED__
  const payload = { limit, offset, search, industry, status, Industry: industry, Status: status } as const;
  return invoke<ContactNumberList>('list_contact_numbers', payload as any);
}

export async function fetchContactNumbers(count: number): Promise<ContactNumberDto[]> {
  return invoke<ContactNumberDto[]>('fetch_contact_numbers', { count });
}

export async function fetchContactNumbersByIdRange(startId: number, endId: number): Promise<ContactNumberDto[]> {
  if (endId < startId) return [];
  return invoke<ContactNumberDto[]>('fetch_contact_numbers_by_id_range', { start_id: startId, end_id: endId, startId, endId });
}

export async function fetchContactNumbersByIdRangeUnconsumed(startId: number, endId: number): Promise<ContactNumberDto[]> {
  if (endId < startId) return [];
  return invoke<ContactNumberDto[]>('fetch_contact_numbers_by_id_range_unconsumed', { start_id: startId, end_id: endId, startId, endId });
}

export async function markContactNumbersUsedByIdRange(startId: number, endId: number, batchId: string): Promise<number> {
  if (endId < startId) return 0;
  return invoke<number>('mark_contact_numbers_used_by_id_range', { start_id: startId, end_id: endId, batch_id: batchId });
}

/**
 * 批量将指定ID的号码重置为未导入状态
 * @param numberIds 要归档的号码ID数组
 * @returns 操作影响的行数
 */
export async function markContactNumbersAsNotImported(numberIds: number[]): Promise<number> {
  if (numberIds.length === 0) return 0;
  // 同时传递 snake_case 与 camelCase，兼容不同命名约定的命令参数
  return invoke<number>('mark_contact_numbers_as_not_imported', {
    number_ids: numberIds,
    numberIds: numberIds,
  } as any);
}

/**
 * 批量（分片）将号码重置为未导入状态，自动处理：
 * - 将 Key 转为 number 并去重
 * - 大集合分片（默认 800/批）避免 SQLite 参数数量上限
 */
export async function markContactNumbersAsNotImportedBatch(keys: Array<number | string>, chunkSize = 800): Promise<number> {
  // 强制转 number 并过滤无效
  const uniq = Array.from(new Set(keys.map(k => Number(k)).filter(n => Number.isFinite(n)))) as number[];
  if (uniq.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < uniq.length; i += chunkSize) {
    const slice = uniq.slice(i, i + chunkSize);
    // 直接调用现有命令
    const affected = await markContactNumbersAsNotImported(slice);
    total += affected;
  }
  return total;
}

/**
 * 批量（分片）永久删除号码记录（物理删除），自动处理：
 * - 将 Key 转为 number 并去重
 * - 大集合分片（默认 800/批）避免 SQLite 参数数量上限
 * ⚠️ 警告：此操作不可恢复！
 */
export async function deleteContactNumbersBatch(keys: Array<number | string>, chunkSize = 800): Promise<number> {
  // 强制转 number 并过滤无效
  const uniq = Array.from(new Set(keys.map(k => Number(k)).filter(n => Number.isFinite(n)))) as number[];
  if (uniq.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < uniq.length; i += chunkSize) {
    const slice = uniq.slice(i, i + chunkSize);
    // 调用永久删除命令
    const affected = await invoke<number>('delete_contact_numbers', { numberIds: slice });
    total += affected;
  }
  return total;
}

// -------- 批次与导入会话：前端服务封装 --------

export interface VcfBatchDto {
  batch_id: string;
  created_at: string;
  vcf_file_path: string;
  source_start_id?: number | null;
  source_end_id?: number | null;
  // 可选：批次统一分类（若后端在创建批次时写入）
  industry?: string | null;
}

export interface VcfBatchList {
  total: number;
  items: VcfBatchDto[];
}

export interface ImportSessionDto {
  id: number;
  batch_id: string;
  device_id: string;
  status: 'pending' | 'success' | 'failed';
  imported_count: number;
  failed_count: number;
  started_at: string;
  finished_at?: string | null;
  error_message?: string | null;
  // 可选：该会话所对应号码集的行业/分类（前端选择后通过后端记录）
  industry?: string | null;
}

export interface ImportSessionList {
  total: number;
  items: ImportSessionDto[];
}

// 分配结果（与后端 AllocationResultDto 对齐）
export interface AllocationResultDto {
  device_id: string;
  batch_id: string;
  vcf_file_path: string;
  number_count: number;
  number_ids: number[];
  session_id: number;
}

export async function createVcfBatchRecord(params: { batchId: string; vcfFilePath: string; sourceStartId?: number; sourceEndId?: number; }): Promise<void> {
  const { batchId, vcfFilePath, sourceStartId, sourceEndId } = params;
  return invoke<void>('create_vcf_batch_cmd', { batch_id: batchId, vcf_file_path: vcfFilePath, source_start_id: sourceStartId, source_end_id: sourceEndId });
}

export async function listVcfBatchRecords(params: { limit?: number; offset?: number } = {}): Promise<VcfBatchList> {
  const { limit, offset } = params;
  return invoke<VcfBatchList>('list_vcf_batch_records_cmd', { limit, offset });
}

export async function getVcfBatchRecord(batchId: string): Promise<VcfBatchDto | null> {
  // 同时传递 snake_case 与 camelCase，兼容不同命名约定的命令参数
  const payload = { batch_id: batchId, batchId } as const;
  const res = await invoke<VcfBatchDto | null>('get_vcf_batch_cmd', payload as any);
  return res;
}

export async function listNumbersByVcfBatch(batchId: string, onlyUsed?: boolean, params: { limit?: number; offset?: number } = {}): Promise<ContactNumberList> {
  const { limit, offset } = params;
  // 兼容后端参数命名差异：同时发送 snake_case 与 camelCase，避免 "missing required key batchId" 错误
  const payload = { batch_id: batchId, batchId, only_used: onlyUsed, onlyUsed, limit, offset } as const;
  console.debug('[numbers] listNumbersByVcfBatch payload (mixed):', payload);
  return invoke<ContactNumberList>('list_numbers_by_vcf_batch', payload as any);
}

export async function listNumbersByVcfBatchFiltered(batchId: string, params: { industry?: string; status?: string; limit?: number; offset?: number } = {}): Promise<ContactNumberList> {
  const { industry, status, limit, offset } = params;
  const ind = industry && industry.trim() && industry.trim() !== '不限' ? industry.trim() : undefined;
  const payload = { batch_id: batchId, batchId, industry: ind, Industry: ind, status, Status: status, limit, offset } as const;
  return invoke<ContactNumberList>('list_numbers_by_vcf_batch_filtered', payload as any);
}

export async function listNumbersWithoutVcfBatch(params: { limit?: number; offset?: number; industry?: string; status?: string } = {}): Promise<ContactNumberList> {
  const { limit, offset, industry, status } = params;
  const payload = { limit, offset, industry, status, Industry: industry, Status: status } as const;
  return invoke<ContactNumberList>('list_numbers_without_vcf_batch', payload as any);
}

// ---- 行业下拉缓存（避免仅当前页可见行业） ----
let cachedIndustries: string[] | null = null;
export async function getDistinctIndustries(forceRefresh = false): Promise<string[]> {
  if (cachedIndustries && !forceRefresh) return cachedIndustries;
  const list = await invoke<string[]>('get_distinct_industries_cmd');
  cachedIndustries = list;
  return list;
}

export async function createImportSessionRecord(batchId: string, deviceId: string): Promise<number> {
  const payload = { batch_id: batchId, batchId, device_id: deviceId, deviceId } as const;
  console.debug('[importSession] createImportSessionRecord payload (mixed):', payload);
  return invoke<number>('create_import_session_cmd', payload as any);
}

export async function finishImportSessionRecord(sessionId: number, status: 'success' | 'failed', importedCount: number, failedCount: number, errorMessage?: string): Promise<void> {
  const payload = {
    session_id: sessionId,
    sessionId,
    status,
    imported_count: importedCount,
    importedCount,
    failed_count: failedCount,
    failedCount,
    error_message: errorMessage,
    errorMessage,
  } as const;
  console.debug('[importSession] finishImportSessionRecord payload (mixed):', payload);
  return invoke<void>('finish_import_session_cmd', payload as any);
}

export async function listImportSessionRecords(params: { deviceId?: string; batchId?: string; industry?: string; limit?: number; offset?: number } = {}): Promise<ImportSessionList> {
  const { deviceId, batchId, industry, limit, offset } = params;
  // 兼容大小写键并传递行业过滤（空串与“不限”不传）
  const ind = industry && industry.trim() && industry.trim() !== '不限' ? industry.trim() : undefined;
  return invoke<ImportSessionList>('list_import_sessions_cmd', { device_id: deviceId, batch_id: batchId, industry: ind, Industry: ind, limit, offset });
}

// 为设备在数据库层分配号码并创建 VCF 批次与 pending 会话
export async function allocateNumbersToDevice(deviceId: string, count: number = 100, industry?: string): Promise<AllocationResultDto> {
  // 兼容 snake/camel 命名；industry 为空或“不限”时不传递
  const ind = industry && industry.trim() && industry.trim() !== '不限' ? industry.trim() : undefined;
  const payload = { device_id: deviceId, deviceId, count, industry: ind, Industry: ind } as const;
  return invoke<AllocationResultDto>('allocate_contact_numbers_to_device', payload as any);
}

// ---- 新增：会话分类编辑 & 成功回滚为失败 ----

export async function updateImportSessionIndustry(sessionId: number, industry?: string | null): Promise<void> {
  const ind = industry && industry.trim() ? industry.trim() : undefined;
  const payload = { session_id: sessionId, sessionId, industry: ind, Industry: ind } as const;
  return invoke<void>('update_import_session_industry_cmd', payload as any);
}

export async function revertImportSessionToFailed(sessionId: number, reason?: string): Promise<number> {
  const payload = { session_id: sessionId, sessionId, reason } as const;
  return invoke<number>('revert_import_session_to_failed_cmd', payload as any);
}

export interface ImportSessionEventDto {
  id: number;
  session_id: number;
  occurred_at: string;
  device_id?: string | null;
  status?: 'pending' | 'success' | 'failed' | string | null;
  imported_count?: number | null;
  failed_count?: number | null;
  error_message?: string | null;
}

export interface ImportSessionEventList {
  total: number;
  items: ImportSessionEventDto[];
}

export interface DeleteImportSessionResult {
  session_id: number;
  archived_number_count: number;
  removed_event_count: number;
  removed_batch_link_count: number;
  removed_batch_record: boolean;
}

export async function listImportSessionEvents(sessionId: number, params: { limit?: number; offset?: number } = {}): Promise<ImportSessionEventList> {
  const { limit, offset } = params;
  const payload = { session_id: sessionId, sessionId, limit, offset } as const;
  return invoke<ImportSessionEventList>('list_import_session_events_cmd', payload as any);
}

export async function deleteImportSession(sessionId: number, options: { archiveNumbers?: boolean } = {}): Promise<DeleteImportSessionResult> {
  const { archiveNumbers } = options;
  const payload = {
    session_id: sessionId,
    sessionId,
    archive_numbers: archiveNumbers,
    archiveNumbers,
  } as const;
  return invoke<DeleteImportSessionResult>('delete_import_session_cmd', payload as any);
}

export interface BulkDeleteFailure {
  sessionId: number;
  message: string;
}

export interface BulkDeleteImportSessionsSummary {
  total: number;
  succeeded: number[];
  failed: BulkDeleteFailure[];
  archivedNumberCount: number;
}

export async function bulkDeleteImportSessions(sessionIds: number[], options: { archiveNumbers?: boolean } = {}): Promise<BulkDeleteImportSessionsSummary> {
  const summary: BulkDeleteImportSessionsSummary = {
    total: sessionIds.length,
    succeeded: [],
    failed: [],
    archivedNumberCount: 0,
  };

  for (const rawId of sessionIds) {
    const sessionId = Number(rawId);
    if (!Number.isFinite(sessionId)) {
      summary.failed.push({ sessionId: rawId as number, message: '无效的会话 ID' });
      continue;
    }

    try {
      const result = await deleteImportSession(sessionId, options);
      summary.succeeded.push(sessionId);
      summary.archivedNumberCount += result.archived_number_count ?? 0;
    } catch (error: any) {
      summary.failed.push({
        sessionId,
        message: String(error?.message ?? error ?? '未知错误'),
      });
    }
  }

  return summary;
}
