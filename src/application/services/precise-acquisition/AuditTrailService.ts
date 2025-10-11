// src/application/services/precise-acquisition/AuditTrailService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客 - 审计服务
 *
 * 负责统一写入审计日志，方便其他模块复用
 */

import { invoke } from '@tauri-apps/api/core';
import type { AuditLog } from '../../../domain/precise-acquisition/entities';

export class AuditTrailService {
  async record(log: AuditLog): Promise<void> {
    try {
      const payload = log.toDatabasePayload();
      await invoke('insert_audit_log', { log: payload });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // 审计失败不应阻断主流程
    }
  }
}

export const auditTrailService = new AuditTrailService();
