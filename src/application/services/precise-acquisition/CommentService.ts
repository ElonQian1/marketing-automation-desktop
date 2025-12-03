// src/application/services/precise-acquisition/CommentService.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 精准获客 - 评论服务
 */

import { invoke } from '@tauri-apps/api/core';
import { AuditLog, CommentEntity, type EntityCreationParams } from '../../../domain/precise-acquisition/entities';
import { auditTrailService, AuditTrailService } from './AuditTrailService';
import type { CommentRow } from '../../../types/precise-acquisition';
import type { Platform, RegionTag } from '../../../constants/precise-acquisition-enums';

export class CommentService {
  constructor(private readonly auditTrail: AuditTrailService = auditTrailService) {}

  async add(params: EntityCreationParams['comment']): Promise<CommentEntity> {
    const comment = CommentEntity.create(params);
    const payload = comment.toDatabasePayload();
    const commentId = await invoke('plugin:prospecting|insert_comment', { comment: payload }) as string;

    await this.auditTrail.record(AuditLog.createCommentFetch({
      operator: 'system',
      fetchResult: { commentId, platform: params.platform },
    }));

    return CommentEntity.fromDatabaseRow({
      id: commentId,
      ...payload,
      inserted_at: new Date().toISOString(),
    });
  }

  async list(params: {
    limit?: number;
    offset?: number;
    platform?: Platform;
    source_target_id?: string;
    region?: RegionTag;
  } = {}): Promise<CommentEntity[]> {
    const rows = await invoke('plugin:prospecting|list_comments', {
      limit: params.limit || null,
      offset: params.offset || null,
      platform: params.platform || null,
      sourceTargetId: params.source_target_id || null,
      region: params.region || null,
    }) as CommentRow[];

    return rows.map(row => CommentEntity.fromDatabaseRow(row));
  }
}

export const commentService = new CommentService();
