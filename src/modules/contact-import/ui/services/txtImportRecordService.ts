// src/modules/contact-import/ui/services/txtImportRecordService.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import { invoke } from '@tauri-apps/api/core';

// ===== TXT文件导入记录类型定义 (V2.0) =====

export interface TxtImportRecordDto {
  id: number;
  filePath: string;           // camelCase from backend
  fileName: string;
  fileSize: number | null;
  // V2.0 字段 (camelCase)
  totalLines: number;         // 文件总行数
  validNumbers: number;       // 有效号码数
  importedNumbers: number;    // 成功导入数
  duplicateNumbers: number;   // 重复号码数
  invalidNumbers: number;     // 无效号码数
  status: 'success' | 'empty' | 'all_duplicates' | 'partial' | 'failed';
  errorMessage?: string | null;
  createdAt: string;
  importedAt?: string | null;
  industry?: string | null;
  notes?: string | null;
}

export interface TxtImportRecordList {
  total: number;
  items: TxtImportRecordDto[];
  limit?: number;
  offset?: number;
}

export interface DeleteTxtImportRecordResult {
  recordId: number;              // camelCase (来自后端)
  archivedNumberCount: number;   // camelCase (来自后端)
  success: boolean;
}

// ===== 服务函数 =====

/**
 * 获取TXT文件导入记录列表
 */
export async function listTxtImportRecords(params: { 
  limit?: number; 
  offset?: number; 
} = {}): Promise<TxtImportRecordList> {
  const { limit, offset } = params;
  return invoke<TxtImportRecordList>('plugin:contacts|list_import_records', { 
    limit, 
    offset 
  });
}

/**
 * 删除TXT文件导入记录
 * @param recordId 记录ID
 * @param archiveNumbers 是否将相关号码归档（重置为未导入状态）
 */
export async function deleteTxtImportRecord(
  recordId: number, 
  archiveNumbers: boolean = false
): Promise<DeleteTxtImportRecordResult> {
  return invoke<DeleteTxtImportRecordResult>('plugin:contacts|delete_import_record', {
    recordId,           // Tauri 2.0 使用 camelCase
    archiveNumbers,     // Tauri 2.0 使用 camelCase
  });
}

/**
 * 批量删除TXT文件导入记录
 */
export async function bulkDeleteTxtImportRecords(
  recordIds: number[],
  archiveNumbers: boolean = false
): Promise<{ 
  total: number; 
  succeeded: number; 
  failed: Array<{ recordId: number; message: string }>; 
  archivedNumberCount: number; 
}> {
  const results = await Promise.allSettled(
    recordIds.map(id => deleteTxtImportRecord(id, archiveNumbers))
  );

  let succeeded = 0;
  let archivedNumberCount = 0;
  const failed: Array<{ recordId: number; message: string }> = [];

  results.forEach((result, index) => {
    const recordId = recordIds[index];
    if (result.status === 'fulfilled') {
      succeeded++;
      archivedNumberCount += result.value.archivedNumberCount;
    } else {
      failed.push({
        recordId,
        message: result.reason?.toString() || '未知错误'
      });
    }
  });

  return {
    total: recordIds.length,
    succeeded,
    failed,
    archivedNumberCount
  };
}