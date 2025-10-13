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
  try {
    await createVcfBatchWithNumbers({
      batchId,
      vcfFilePath,
      sourceStartId,
      sourceEndId,
      numberIds,
    });
    bindBatchToDevice(deviceId, batchId);
  } catch (error) {
    mappingOk = false;
    console.warn('[vcf] registerGeneratedBatch: bind batch failed', error);
  }

  let sessionId: number | null = null;
  try {
    sessionId = await createImportSessionRecord(batchId, deviceId);
  } catch (error) {
    console.warn('[vcf] registerGeneratedBatch: create session record failed', error);
  }

  return {
    batchId,
    sessionId,
    mappingOk,
  };
}
