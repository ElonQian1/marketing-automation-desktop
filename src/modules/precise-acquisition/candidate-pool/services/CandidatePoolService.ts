/**
 * 候选池服务
 * 
 * 提供候选池的增删改查、导入导出、验证等核心业务逻辑
 */

import { invoke } from '@tauri-apps/api/core';
import { 
  WatchTarget, 
  WatchTargetQueryParams, 
  ImportValidationResult,
  ComplianceCheckResult,
  Platform,
  TargetType,
  SourceType
} from '../../shared/types/core';
import { validateCsvImportData, generateDedupKey, checkCompliance } from '../../shared/utils';

export interface CandidatePoolStats {
  total_count: number;
  by_platform: Record<Platform, number>;
  by_type: Record<TargetType, number>;
  by_source: Record<SourceType, number>;
  recent_added: number; // 最近7天新增
}

export class CandidatePoolService {
  /**
   * 获取候选池列表
   */
  async getWatchTargets(params: WatchTargetQueryParams = {}): Promise<WatchTarget[]> {
    try {
      const rows = await invoke('get_watch_targets', {
        limit: params.limit || null,
        offset: params.offset || null,
        platform: params.platform || null,
        targetType: params.target_type || null,
        source: params.source || null,
        industryTags: params.industry_tags || null,
        regionTag: params.region_tag || null,
        keyword: params.keyword || null
      });
      
      return rows as WatchTarget[];
    } catch (error) {
      console.error('Failed to get watch targets:', error);
      throw error;
    }
  }

  /**
   * 添加单个候选目标
   */
  async addWatchTarget(target: Omit<WatchTarget, 'id' | 'created_at' | 'updated_at'>): Promise<WatchTarget> {
    try {
      // 合规性检查
      const compliance = checkCompliance(target as WatchTarget);
      if (!compliance.passed) {
        throw new Error(`合规检查失败: ${compliance.violations.join(', ')}`);
      }

      const result = await invoke('add_watch_target', {
        targetType: target.target_type,
        platform: target.platform,
        platformIdOrUrl: target.platform_id_or_url,
        title: target.title || null,
        source: target.source,
        industryTags: target.industry_tags || null,
        regionTag: target.region_tag || null,
        notes: target.notes || null
      });
      
      return result as WatchTarget;
    } catch (error) {
      console.error('Failed to add watch target:', error);
      throw error;
    }
  }

  /**
   * 更新候选目标
   */
  async updateWatchTarget(id: string, updates: Partial<WatchTarget>): Promise<WatchTarget> {
    try {
      const result = await invoke('update_watch_target', {
        id,
        updates: {
          title: updates.title,
          industryTags: updates.industry_tags,
          regionTag: updates.region_tag,
          notes: updates.notes
        }
      });
      
      return result as WatchTarget;
    } catch (error) {
      console.error('Failed to update watch target:', error);
      throw error;
    }
  }

  /**
   * 删除候选目标
   */
  async deleteWatchTarget(id: string): Promise<void> {
    try {
      await invoke('delete_watch_target', { id });
    } catch (error) {
      console.error('Failed to delete watch target:', error);
      throw error;
    }
  }

  /**
   * 批量删除候选目标
   */
  async batchDeleteWatchTargets(ids: string[]): Promise<{ success: number; failed: number }> {
    try {
      const result = await invoke('batch_delete_watch_targets', { ids });
      return result as { success: number; failed: number };
    } catch (error) {
      console.error('Failed to batch delete watch targets:', error);
      throw error;
    }
  }

  /**
   * CSV导入预验证
   */
  validateCsvImport(csvData: any[]): ImportValidationResult {
    return validateCsvImportData(csvData);
  }

  /**
   * 执行CSV导入
   */
  async importFromCsv(
    validatedData: WatchTarget[],
    options: {
      update_existing?: boolean;
      skip_duplicates?: boolean;
    } = {}
  ): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ target: WatchTarget; error: string }>;
  }> {
    try {
      const result = await invoke('import_watch_targets_from_csv', {
        targets: validatedData,
        updateExisting: options.update_existing || false,
        skipDuplicates: options.skip_duplicates || true
      });
      
      return result as {
        imported: number;
        updated: number;
        skipped: number;
        errors: Array<{ target: WatchTarget; error: string }>;
      };
    } catch (error) {
      console.error('Failed to import from CSV:', error);
      throw error;
    }
  }

  /**
   * 导出为CSV
   */
  async exportToCsv(filters?: WatchTargetQueryParams): Promise<string> {
    try {
      const targets = await this.getWatchTargets(filters);
      
      // 转换为CSV格式
      const csvData = targets.map(target => ({
        type: target.target_type,
        platform: target.platform,
        id_or_url: target.platform_id_or_url,
        title: target.title || '',
        source: target.source,
        industry_tags: target.industry_tags?.join(';') || '',
        region: target.region_tag || '',
        notes: target.notes || '',
        created_at: target.created_at.toISOString(),
        last_fetch_at: target.last_fetch_at?.toISOString() || ''
      }));

      // 生成CSV内容
      const headers = ['类型', '平台', 'ID或URL', '标题', '来源', '行业标签', '地区', '备注', '创建时间', '最后拉取时间'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export to CSV:', error);
      throw error;
    }
  }

  /**
   * 获取统计数据
   */
  async getStats(): Promise<CandidatePoolStats> {
    try {
      const result = await invoke('get_candidate_pool_stats');
      return result as CandidatePoolStats;
    } catch (error) {
      console.error('Failed to get candidate pool stats:', error);
      throw error;
    }
  }

  /**
   * 检查去重
   */
  async checkDuplication(platform: Platform, identifier: string): Promise<{
    exists: boolean;
    existing_target?: WatchTarget;
  }> {
    try {
      const dedupKey = generateDedupKey(platform, identifier);
      const result = await invoke('check_watch_target_duplication', { dedupKey });
      return result as { exists: boolean; existing_target?: WatchTarget };
    } catch (error) {
      console.error('Failed to check duplication:', error);
      throw error;
    }
  }

  /**
   * 批量合规性检查
   */
  async batchComplianceCheck(targets: WatchTarget[]): Promise<Array<{
    target: WatchTarget;
    compliance: ComplianceCheckResult;
  }>> {
    return targets.map(target => ({
      target,
      compliance: checkCompliance(target)
    }));
  }

  /**
   * 根据行业标签获取推荐关键词
   */
  async getRecommendedKeywords(industryTags: string[]): Promise<string[]> {
    try {
      const result = await invoke('get_recommended_keywords', { industryTags });
      return result as string[];
    } catch (error) {
      console.error('Failed to get recommended keywords:', error);
      return [];
    }
  }
}