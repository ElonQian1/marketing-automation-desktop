// src/application/services/precise-acquisition/ComplianceService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客 - 合规校验服务
 */

import { Platform, SourceType } from '../../../constants/precise-acquisition-enums';
import type { WatchTarget } from '../../../domain/precise-acquisition/entities';
import type { ComplianceCheckResult } from '../../../types/precise-acquisition';

export class ComplianceService {
  async checkWatchTarget(watchTarget: WatchTarget): Promise<ComplianceCheckResult> {
    const info = watchTarget.getComplianceInfo();
    if (!info.isCompliant) {
      return {
        passed: false,
        violations: [info.reason],
        warnings: [],
        source_verified: false,
        whitelist_approved: false,
        compliant: false,
        is_allowed: false,
        source_type: watchTarget.source || SourceType.MANUAL,
        reason: info.reason,
      };
    }

    if (watchTarget.platform === Platform.PUBLIC) {
      // TODO: 接入真实白名单校验
      return {
        passed: true,
        violations: [],
        warnings: [],
        source_verified: true,
        whitelist_approved: true,
        compliant: true,
        is_allowed: true,
        source_type: watchTarget.source || SourceType.MANUAL,
      };
    }

    return {
      passed: true,
      violations: [],
      warnings: [],
      source_verified: true,
      whitelist_approved: false,
      compliant: true,
      is_allowed: true,
      source_type: watchTarget.source || SourceType.MANUAL,
    };
  }
}

export const complianceService = new ComplianceService();
