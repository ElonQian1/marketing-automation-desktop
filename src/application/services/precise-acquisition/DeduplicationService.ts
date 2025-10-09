/**
 * 精准获客 - 查重服务
 *
 * 抽离查重逻辑，统一处理评论级、用户级等去重操作
 */

import { invoke } from '@tauri-apps/api/core';
import { TaskStatus } from '../../../constants/precise-acquisition-enums';
import type { CommentEntity, TaskEntity } from '../../../domain/precise-acquisition/entities';
import type { TaskRow } from '../../../types/precise-acquisition';

export class DeduplicationService {
  /**
   * 预留评论级去重键
   */
  async reserveComment(comment: CommentEntity, accountId: string): Promise<boolean> {
    const commentDedupKey = comment.generateDedupKey();
    return this.reserveKey(commentDedupKey, 'comment', 90, accountId);
  }

  /**
   * 预留用户级去重键
   */
  async reserveUser(comment: CommentEntity, accountId: string): Promise<boolean> {
    const userDedupKey = comment.generateUserDedupKey();
    return this.reserveKey(userDedupKey, 'user', 7, accountId);
  }

  /**
   * 文本级去重（基于指纹桶）
   */
  async reserveText(comment: CommentEntity, accountId: string): Promise<boolean> {
    const buckets = comment.generateTextFingerprintBuckets();
    let reservedAll = true;

    for (let i = 0; i < buckets.length; i++) {
      const bucketKey = `${comment.platform}:${buckets[i]}`;
      const reserved = await this.reserveKey(bucketKey, `text_band_${i}`, 2, accountId);
      if (!reserved) {
        reservedAll = false;
        break;
      }
    }

    return reservedAll;
  }

  /**
   * 统一的去重键预留实现
   */
  async reserveKey(
    key: string,
    scope: 'comment' | 'user' | 'text',
    ttlDays: number,
    accountId: string,
  ): Promise<boolean> {
    try {
      const reserved = await invoke('check_and_reserve_dedup', {
        key,
        scope,
        ttlDays,
        byAccount: accountId,
      }) as boolean;
      return reserved;
    } catch (error) {
      console.error('Failed to reserve dedup key', { key, scope, error });
      // 失败时不阻断流程，让上层根据业务继续处理
      return false;
    }
  }

  /**
   * 判断任务是否已存在重复记录
   */
  async isDuplicateTask(task: TaskEntity): Promise<boolean> {
    try {
      const rows = await invoke('list_tasks', {
        limit: 100,
        offset: 0,
      }) as TaskRow[];

      return rows
        .filter(row => row.dedup_key === task.dedupKey)
        .some(row => row.status !== TaskStatus.FAILED);
    } catch (error) {
      console.error('Failed to check task duplication:', error);
      // 出错时默认不视为重复，交由上层继续处理
      return false;
    }
  }
}

export const deduplicationService = new DeduplicationService();
