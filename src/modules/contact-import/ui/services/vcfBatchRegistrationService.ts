// src/modules/contact-import/ui/services/vcfBatchRegistrationService.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

// modules/contact-import/ui/services | vcfBatchRegistrationService | VCF批次注册服务
// 负责VCF批次的创建、注册和设备绑定，管理生成的联系人批次与设备的关联关系

import { createVcfBatchWithNumbers } from '../../../vcf-sessions/services/vcf-session-service';
import { bindBatchToDevice } from './deviceBatchBinding';
import { createImportSessionRecord } from './contactNumberService';

export interface RegisterGeneratedBatchParams {
  deviceId: string;
  batchId: string;
  vcfFilePath: string;
  numberIds: number[];
  sourceStartId?: number;
  sourceEndId?: number;
}

export interface RegisterGeneratedBatchResult {
  batchId: string;
  sessionId: number | null;
  mappingOk: boolean;
}

export async function registerGeneratedBatch({
  deviceId,
  batchId,
  vcfFilePath,
  numberIds,
  sourceStartId,
  sourceEndId,
}: RegisterGeneratedBatchParams): Promise<RegisterGeneratedBatchResult> {
  let mappingOk = true;
  
  // 步骤1：创建VCF批次并关联号码
  try {
    await createVcfBatchWithNumbers({
      batchId,
      vcfFilePath,
      sourceStartId,
      sourceEndId,
      numberIds,
    });
    
    // 步骤2：绑定批次到设备（可选）
    try {
      bindBatchToDevice(deviceId, batchId);
    } catch (bindError) {
      console.warn('[vcf] registerGeneratedBatch: device binding failed (non-critical)', bindError);
      // 绑定失败不影响主流程
    }
  } catch (error) {
    mappingOk = false;
    console.error('[vcf] registerGeneratedBatch: batch creation failed', error);
    throw error; // 批次创建失败应该抛出错误
  }

  // 步骤3：创建导入会话记录（可选，命令暂时禁用）
  let sessionId: number | null = null;
  try {
    sessionId = await createImportSessionRecord(batchId, deviceId);
  } catch (error) {
    // 导入会话命令已被禁用，这是预期的错误
    console.info('[vcf] registerGeneratedBatch: session creation skipped (command disabled)', error);
    // 不影响主流程，继续
  }

  return {
    batchId,
    sessionId,
    mappingOk,
  };
}
