// src/hooks/useCsvImport.ts
// module: shared | layer: application | role: 状态钩子
// summary: React状态管理和业务逻辑封装

/**
 * CSV 导入相关的 Hook
 * 
 * 提供候选池 CSV 文件导入、验证、解析功能
 */

import { useState, useCallback } from 'react';
import { preciseAcquisitionService } from '../application/services';
import { Platform, TargetType, SourceType, IndustryTag, RegionTag } from '../constants/precise-acquisition-enums';
import type { EntityCreationParams } from '../domain/precise-acquisition/entities';

/**
 * CSV 行数据接口
 */
export interface CsvRowData {
  platform: string;
  target_type: string;
  target_url: string;
  target_id: string;
  title?: string;
  description?: string;
  follow_count?: string;
  like_count?: string;
  region?: string;
  industry?: string;
  content_tags?: string;
  is_business_account?: string;
  content_quality_score?: string;
  source?: string;
  priority?: string;
  notes?: string;
}

/**
 * CSV 验证结果
 */
export interface CsvValidationResult {
  isValid: boolean;
  rowIndex: number;
  errors: string[];
  warnings: string[];
  data?: EntityCreationParams['watchTarget'];
}

/**
 * 导入结果统计
 */
export interface ImportStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  duplicateRows: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * CSV 导入状态
 */
export interface CsvImportState {
  isLoading: boolean;
  isValidating: boolean;
  isImporting: boolean;
  validationResults: CsvValidationResult[];
  importStats: ImportStats | null;
  error: string | null;
}

/**
 * 使用 CSV 导入功能的 Hook
 */
export function useCsvImport() {
  const [state, setState] = useState<CsvImportState>({
    isLoading: false,
    isValidating: false,
    isImporting: false,
    validationResults: [],
    importStats: null,
    error: null,
  });

  /**
   * 解析 CSV 文件内容
   */
  const parseCsvContent = useCallback((content: string): CsvRowData[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV 文件至少需要包含标题行和一行数据');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expectedHeaders = [
      'platform', 'target_type', 'target_url', 'target_id', 'title',
      'description', 'follow_count', 'like_count', 'region', 'industry',
      'content_tags', 'is_business_account', 'content_quality_score',
      'source', 'priority', 'notes'
    ];

    // 验证必需的列是否存在
    const requiredHeaders = ['platform', 'target_type', 'target_url', 'target_id'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`缺少必需的列: ${missingHeaders.join(', ')}`);
    }

    // 解析数据行
    const rows: CsvRowData[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue; // 跳过空行

      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row as CsvRowData);
    }

    return rows;
  }, []);

  /**
   * 验证单行数据
   */
  const validateRow = useCallback((rowData: CsvRowData, index: number): CsvValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证平台
    if (!Platform[rowData.platform as keyof typeof Platform]) {
      errors.push(`无效的平台: ${rowData.platform}`);
    }

    // 验证目标类型
    if (!TargetType[rowData.target_type as keyof typeof TargetType]) {
      errors.push(`无效的目标类型: ${rowData.target_type}`);
    }

    // 验证URL格式
    if (!rowData.target_url) {
      errors.push('目标URL不能为空');
    } else {
      try {
        new URL(rowData.target_url);
      } catch {
        errors.push(`无效的URL格式: ${rowData.target_url}`);
      }
    }

    // 验证目标ID
    if (!rowData.target_id) {
      errors.push('目标ID不能为空');
    }

    // 验证可选字段
    if (rowData.region && !RegionTag[rowData.region as keyof typeof RegionTag]) {
      warnings.push(`未识别的地区标签: ${rowData.region}`);
    }

    if (rowData.industry && !IndustryTag[rowData.industry as keyof typeof IndustryTag]) {
      warnings.push(`未识别的行业标签: ${rowData.industry}`);
    }

    if (rowData.follow_count && isNaN(Number(rowData.follow_count))) {
      warnings.push(`无效的关注数: ${rowData.follow_count}`);
    }

    if (rowData.like_count && isNaN(Number(rowData.like_count))) {
      warnings.push(`无效的点赞数: ${rowData.like_count}`);
    }

    if (rowData.content_quality_score && 
        (isNaN(Number(rowData.content_quality_score)) || 
         Number(rowData.content_quality_score) < 0 || 
         Number(rowData.content_quality_score) > 100)) {
      warnings.push(`内容质量评分应为0-100之间的数字: ${rowData.content_quality_score}`);
    }

    if (rowData.is_business_account && 
        !['true', 'false', '1', '0', 'yes', 'no'].includes(rowData.is_business_account.toLowerCase())) {
      warnings.push(`商业账号标识应为true/false或1/0: ${rowData.is_business_account}`);
    }

    // 如果基本验证通过，转换为实体创建参数
    let data: EntityCreationParams['watchTarget'] | undefined;
    if (errors.length === 0) {
      try {
        data = {
          platform: rowData.platform as Platform,
          targetType: rowData.target_type as TargetType,
          idOrUrl: rowData.target_url, // 使用URL作为主要标识
          title: rowData.title || undefined,
          source: rowData.source as SourceType || SourceType.MANUAL,
          industryTags: rowData.industry ? [rowData.industry as IndustryTag] : undefined,
          region: rowData.region as RegionTag || undefined,
          notes: rowData.notes || undefined,
        };
      } catch (conversionError) {
        errors.push(`数据转换失败: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
      }
    }

    return {
      isValid: errors.length === 0,
      rowIndex: index,
      errors,
      warnings,
      data,
    };
  }, []);

  /**
   * 验证整个 CSV 文件
   */
  const validateCsv = useCallback(async (content: string): Promise<CsvValidationResult[]> => {
    setState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const rows = parseCsvContent(content);
      const validationResults: CsvValidationResult[] = [];

      for (let i = 0; i < rows.length; i++) {
        const result = validateRow(rows[i], i + 2); // +2 因为行号从1开始，且第1行是标题
        validationResults.push(result);
      }

      setState(prev => ({ 
        ...prev, 
        isValidating: false, 
        validationResults 
      }));

      return validationResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ 
        ...prev, 
        isValidating: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [parseCsvContent, validateRow]);

  /**
   * 导入已验证的数据
   */
  const importValidatedData = useCallback(async (validationResults: CsvValidationResult[]): Promise<ImportStats> => {
    setState(prev => ({ ...prev, isImporting: true, error: null }));

    try {
      const validData = validationResults
        .filter(result => result.isValid && result.data)
        .map(result => result.data!);

      if (validData.length === 0) {
        throw new Error('没有有效的数据可以导入');
      }

      // 批量导入
      const importResult = await preciseAcquisitionService.bulkImportWatchTargets(validData);

      const stats: ImportStats = {
        totalRows: validationResults.length,
        validRows: validData.length,
        invalidRows: validationResults.filter(r => !r.isValid).length,
        importedRows: importResult.success_count,
        duplicateRows: validData.length - importResult.success_count,
        errors: importResult.errors.map(e => ({ row: e.index + 2, message: e.error })),
      };

      setState(prev => ({ 
        ...prev, 
        isImporting: false, 
        importStats: stats 
      }));

      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ 
        ...prev, 
        isImporting: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  /**
   * 一键导入（验证 + 导入）
   */
  const importCsv = useCallback(async (content: string): Promise<ImportStats> => {
    const validationResults = await validateCsv(content);
    return await importValidatedData(validationResults);
  }, [validateCsv, importValidatedData]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isValidating: false,
      isImporting: false,
      validationResults: [],
      importStats: null,
      error: null,
    });
  }, []);

  /**
   * 生成 CSV 模板
   */
  const generateCsvTemplate = useCallback((): string => {
    const headers = [
      'platform', 'target_type', 'target_url', 'target_id', 'title',
      'description', 'follow_count', 'like_count', 'region', 'industry',
      'content_tags', 'is_business_account', 'content_quality_score',
      'source', 'priority', 'notes'
    ];

    const exampleRow = [
      'XIAOHONGSHU', 'USER', 'https://www.xiaohongshu.com/user/12345', '12345',
      '示例用户标题', '用户描述信息', '1000', '500', 'SHANGHAI', 'TECH',
      '科技;数码;互联网', 'true', '85', 'MANUAL', '5', '这是一个示例用户'
    ];

    return [headers.join(','), exampleRow.join(',')].join('\n');
  }, []);

  return {
    ...state,
    parseCsvContent,
    validateRow,
    validateCsv,
    importValidatedData,
    importCsv,
    reset,
    generateCsvTemplate,
  };
}