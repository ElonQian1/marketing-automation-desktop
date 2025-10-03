import { invoke } from '@tauri-apps/api/core';

// ===== TXT文件导入记录类型定义 =====

export interface TxtImportRecordDto {
  id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_modified_at?: string | null;
  total_numbers: number;
  successful_imports: number;
  duplicate_numbers: number;
  invalid_numbers: number;
  import_status: 'success' | 'failed' | 'partial' | 'pending';
  // 向后兼容的别名字段（与后端一致）
  imported_numbers: number; // = successful_imports
  status: 'success' | 'failed' | 'partial' | 'pending'; // = import_status
  error_message?: string | null;
  created_at: string;
  imported_at?: string | null;
  updated_at?: string | null;
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
  record_id: number;
  archived_number_count: number;
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
  return invoke<TxtImportRecordList>('list_txt_import_records_cmd', { 
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
  return invoke<DeleteTxtImportRecordResult>('delete_txt_import_record_cmd', {
    record_id: recordId,
    archive_numbers: archiveNumbers,
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
      archivedNumberCount += result.value.archived_number_count;
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