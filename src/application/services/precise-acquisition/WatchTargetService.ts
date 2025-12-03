// src/application/services/precise-acquisition/WatchTargetService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客 - 候选池服务
 */

import { invoke } from '@tauri-apps/api/core';
import { AuditLog, WatchTarget, type EntityCreationParams } from '../../../domain/precise-acquisition/entities';
import type { WatchTargetRow } from '../../../types/precise-acquisition';
import { auditTrailService, AuditTrailService } from './AuditTrailService';
import { complianceService, ComplianceService } from './ComplianceService';

export class WatchTargetService {
  constructor(
    private readonly compliance: ComplianceService = complianceService,
    private readonly auditTrail: AuditTrailService = auditTrailService,
  ) {}

  async add(params: EntityCreationParams['watchTarget']): Promise<WatchTarget> {
    const watchTarget = WatchTarget.create(params);
    const complianceResult = await this.compliance.checkWatchTarget(watchTarget);
    if (!complianceResult.is_allowed) {
      throw new Error(`不符合合规要求: ${complianceResult.reason}`);
    }

    const payload = watchTarget.toDatabasePayload();
    const result = await invoke('plugin:prospecting|bulk_upsert_watch_targets', {
      payloads: [payload],
    }) as number;

    if (result !== 1) {
      throw new Error('Failed to insert watch target');
    }

    await this.auditTrail.record(AuditLog.createImport({
      operator: 'manual',
      importData: { action: 'add_watch_target', target: params },
    }));

    const saved = await this.getByDedupKey(watchTarget.dedupKey);
    if (!saved) {
      throw new Error('Failed to retrieve saved watch target');
    }
    return saved;
  }

  async bulkImport(targets: EntityCreationParams['watchTarget'][]): Promise<{
    success_count: number;
    failed_count: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    const results = {
      success_count: 0,
      failed_count: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };

    const payloads: any[] = [];
    for (let i = 0; i < targets.length; i++) {
      try {
        const target = WatchTarget.create(targets[i]);
        const complianceResult = await this.compliance.checkWatchTarget(target);
        if (!complianceResult.is_allowed) {
          throw new Error(complianceResult.reason || '未通过合规校验');
        }
        payloads.push(target.toDatabasePayload());
        results.success_count++;
      } catch (error) {
        results.failed_count++;
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (payloads.length > 0) {
      await invoke('plugin:prospecting|bulk_upsert_watch_targets', { payloads });
      await this.auditTrail.record(AuditLog.createImport({
        operator: 'system',
        importData: { action: 'bulk_import_watch_targets', count: payloads.length },
      }));
    }

    return results;
  }

  async list(params: {
    limit?: number;
    offset?: number;
    platform?: string;
    target_type?: string;
  } = {}): Promise<WatchTarget[]> {
    const rows = await invoke('plugin:prospecting|list_watch_targets', {
      limit: params.limit || null,
      offset: params.offset || null,
      platform: params.platform || null,
      targetType: params.target_type || null,
    }) as WatchTargetRow[];

    return rows.map(row => WatchTarget.fromDatabaseRow(row));
  }

  async getByDedupKey(dedupKey: string): Promise<WatchTarget | null> {
    const row = await invoke('plugin:prospecting|get_watch_target_by_dedup_key', { dedupKey }) as WatchTargetRow | null;
    return row ? WatchTarget.fromDatabaseRow(row) : null;
  }
}

export const watchTargetService = new WatchTargetService();
