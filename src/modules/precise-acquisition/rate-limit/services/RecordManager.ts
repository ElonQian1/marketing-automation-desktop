// src/modules/precise-acquisition/rate-limit/services/RecordManager.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 查重频控 - 记录管理器
 * 
 * 负责去重记录的存储、查询和清理
 */

import { invoke } from '@tauri-apps/api/core';
import { generateId } from '../../shared/utils';
import { Platform, TaskType } from '../../shared/types/core';
import { DedupLevel, DedupRecord, DedupStats } from '../types';

export class RecordManager {
  /**
   * 保存去重记录
   */
  async saveRecord(
    level: DedupLevel,
    key: string,
    value: string,
    platform: Platform,
    taskType: TaskType,
    deviceId: string,
    expiresAt?: Date,
    metadata?: Record<string, any>
  ): Promise<DedupRecord> {
    const record: DedupRecord = {
      id: generateId(),
      level,
      key,
      value,
      platform,
      task_type: taskType,
      device_id: deviceId,
      created_at: new Date(),
      expires_at: expiresAt,
      metadata
    };

    try {
      await this.saveDedupRecords([record]);
      return record;
    } catch (error) {
      console.error('Failed to save dedup record:', error);
      throw error;
    }
  }

  /**
   * 批量保存去重记录
   */
  async saveBatchRecords(records: DedupRecord[]): Promise<void> {
    try {
      await this.saveDedupRecords(records);
    } catch (error) {
      console.error('Failed to save batch dedup records:', error);
      throw error;
    }
  }

  /**
   * 查找单条去重记录
   */
  async findRecord(level: DedupLevel, key: string): Promise<DedupRecord | null> {
    try {
      const record = await invoke<DedupRecord | null>('find_dedup_record', {
        level,
        key
      });
      return record;
    } catch (error) {
      console.error('Failed to find dedup record:', error);
      return null;
    }
  }

  /**
   * 查找多条去重记录
   */
  async findRecords(level: DedupLevel, key: string): Promise<DedupRecord[]> {
    try {
      const records = await invoke<DedupRecord[]>('find_dedup_records', {
        level,
        key
      });
      return records;
    } catch (error) {
      console.error('Failed to find dedup records:', error);
      return [];
    }
  }

  /**
   * 根据设备查找记录
   */
  async findRecordsByDevice(deviceId: string, limit?: number): Promise<DedupRecord[]> {
    try {
      const records = await invoke<DedupRecord[]>('find_dedup_records_by_device', {
        device_id: deviceId,
        limit: limit || 100
      });
      return records;
    } catch (error) {
      console.error('Failed to find records by device:', error);
      return [];
    }
  }

  /**
   * 根据平台查找记录
   */
  async findRecordsByPlatform(
    platform: Platform, 
    level?: DedupLevel,
    limit?: number
  ): Promise<DedupRecord[]> {
    try {
      const records = await invoke<DedupRecord[]>('find_dedup_records_by_platform', {
        platform,
        level: level || null,
        limit: limit || 100
      });
      return records;
    } catch (error) {
      console.error('Failed to find records by platform:', error);
      return [];
    }
  }

  /**
   * 删除过期记录
   */
  async cleanExpiredRecords(): Promise<number> {
    try {
      const deletedCount = await invoke<number>('clean_expired_dedup_records');
      console.log(`Cleaned ${deletedCount} expired dedup records`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to clean expired records:', error);
      return 0;
    }
  }

  /**
   * 按条件删除记录
   */
  async deleteRecords(conditions: {
    level?: DedupLevel;
    platform?: Platform;
    device_id?: string;
    before_date?: Date;
  }): Promise<number> {
    try {
      const deletedCount = await invoke<number>('delete_dedup_records', {
        level: conditions.level || null,
        platform: conditions.platform || null,
        device_id: conditions.device_id || null,
        before_date: conditions.before_date?.toISOString() || null
      });
      return deletedCount;
    } catch (error) {
      console.error('Failed to delete records:', error);
      return 0;
    }
  }

  /**
   * 获取去重统计信息
   */
  async getStats(): Promise<DedupStats> {
    try {
      const stats = await invoke<DedupStats>('get_dedup_stats');
      return stats;
    } catch (error) {
      console.error('Failed to get dedup stats:', error);
      return {
        total_records: 0,
        active_records: 0,
        expired_records: 0,
        by_level: {
          [DedupLevel.COMMENT]: 0,
          [DedupLevel.USER]: 0,
          [DedupLevel.DEVICE]: 0,
          [DedupLevel.FREQUENCY]: 0
        },
        by_platform: {} as Record<Platform, number>,
        by_task_type: {} as Record<TaskType, number>,
        recent_blocks: [],
        effectiveness_rate: 0
      };
    }
  }

  /**
   * 导出记录数据
   */
  async exportRecords(conditions?: {
    level?: DedupLevel;
    platform?: Platform;
    device_id?: string;
    date_range?: { start: Date; end: Date };
  }): Promise<DedupRecord[]> {
    try {
      const records = await invoke<DedupRecord[]>('export_dedup_records', {
        level: conditions?.level || null,
        platform: conditions?.platform || null,
        device_id: conditions?.device_id || null,
        start_date: conditions?.date_range?.start.toISOString() || null,
        end_date: conditions?.date_range?.end.toISOString() || null
      });
      return records;
    } catch (error) {
      console.error('Failed to export records:', error);
      return [];
    }
  }

  // === 私有辅助方法 ===

  private async saveDedupRecords(records: DedupRecord[]): Promise<void> {
    try {
      await invoke('save_dedup_records', { records });
    } catch (error) {
      console.error('Failed to save dedup records:', error);
      throw error;
    }
  }
}