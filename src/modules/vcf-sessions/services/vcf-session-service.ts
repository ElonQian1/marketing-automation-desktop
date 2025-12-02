// src/modules/vcf-sessions/services/vcf-session-service.ts
// module: vcf-sessions | layer: services | role: VCF会话服务
// summary: 管理VCF文件处理会话的持久化和状态跟踪

import { invoke } from '@tauri-apps/api/core';
import type { ContactNumberList } from '../../contact-import/ui/services/contactNumberService';

export async function createVcfBatchWithNumbers(params: {
  batchId: string;
  vcfFilePath: string;
  sourceStartId?: number;
  sourceEndId?: number;
  numberIds: number[];
}): Promise<number> {
  const { batchId, vcfFilePath, sourceStartId, sourceEndId, numberIds } = params;
  
  // Tauri 2.0 使用驼峰命名
  // 后端参数: batch_name, source_type, generation_method, description, number_ids
  const payload = {
    batchName: batchId,           // 使用 batchId 作为 batch_name
    sourceType: 'auto',           // 自动生成类型
    generationMethod: 'quick',    // 快速生成方法
    description: `VCF file: ${vcfFilePath}`,  // 描述包含文件路径
    numberIds,                    // 号码ID列表
  };
  
  console.debug('[vcfSession] createVcfBatchWithNumbers payload:', payload);
  return invoke<number>('plugin:contacts|create_batch_with_numbers', payload);
}

export async function listNumbersForVcfBatch(batchId: string, params: { limit?: number; offset?: number } = {}): Promise<ContactNumberList> {
  const { limit, offset } = params;
  return invoke<ContactNumberList>('list_numbers_for_vcf_batch_cmd', { batch_id: batchId, limit, offset });
}

export async function tagNumbersIndustryByVcfBatch(batchId: string, industry: string): Promise<number> {
  return invoke<number>('tag_numbers_industry_by_vcf_batch_cmd', { batch_id: batchId, industry });
}
