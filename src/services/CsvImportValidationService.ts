/**
 * CSV导入验证服务
 * 
 * 基于文档：round_2_｜导入规范与校验规则（v_1_）.md
 * 提供完整的CSV验证、错误处理、合规检查功能
 */

import { 
  Platform, 
  TargetType, 
  SourceType,
  IndustryTag,
  RegionTag,
  validateIndustryTags,
  parseIndustryTagsString,
  mapExternalTagToInternal,
  mapExternalRegionToInternal,
  getIndustryTagLabel,
  getRegionTagLabel
} from '../constants/precise-acquisition-enums';

// ==================== 验证结果类型 ====================

/**
 * 验证错误码枚举
 */
export enum ValidationErrorCode {
  E_REQUIRED = 'E_REQUIRED',           // 缺少必填列
  E_ENUM = 'E_ENUM',                   // 枚举取值非法
  E_URL = 'E_URL',                     // URL 非法
  E_DUP = 'E_DUP',                     // 重复记录
  E_NOT_ALLOWED = 'E_NOT_ALLOWED',     // 白名单不允许或缺失依据
  E_FORMAT = 'E_FORMAT',               // 格式错误
  E_LENGTH = 'E_LENGTH',               // 长度超限
  E_TAG_INVALID = 'E_TAG_INVALID',     // 标签非法
}

/**
 * 验证错误详情
 */
export interface ValidationError {
  code: ValidationErrorCode;
  field: string;
  value: any;
  message: string;
  suggestion?: string;
}

/**
 * 行验证结果
 */
export interface RowValidationResult {
  rowIndex: number;
  originalData: Record<string, any>;
  normalizedData: CandidatePoolRecord | null;
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
}

/**
 * CSV验证总结果
 */
export interface CsvValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  results: RowValidationResult[];
  globalErrors: ValidationError[];
  stats: {
    byPlatform: Record<Platform, number>;
    byType: Record<TargetType, number>;
    bySource: Record<SourceType, number>;
  };
}

// ==================== 数据模型 ====================

/**
 * 候选池记录接口（规范化后）
 */
export interface CandidatePoolRecord {
  type: TargetType;
  platform: Platform;
  id_or_url: string;
  title?: string;
  source: SourceType;
  industry_tags: IndustryTag[];
  region?: RegionTag;
  notes?: string;
  dedup_key: string;
}

/**
 * CSV原始记录接口
 */
export interface CsvRawRecord {
  type?: string;
  platform?: string;
  id_or_url?: string;
  title?: string;
  source?: string;
  industry_tags?: string;
  region?: string;
  notes?: string;
  [key: string]: any; // 允许额外字段
}

// ==================== 白名单验证配置 ====================

/**
 * 白名单数据源配置
 */
interface WhitelistSource {
  domain: string;
  platform: Platform;
  allowed: boolean;
  reason: string;
  robotsTxtCompliant: boolean;
  lastVerified: string;
}

/**
 * 默认白名单配置（示例）
 */
const DEFAULT_WHITELIST_SOURCES: WhitelistSource[] = [
  {
    domain: 'example-public-platform.com',
    platform: Platform.PUBLIC,
    allowed: true,
    reason: '平台条款明确允许数据抓取',
    robotsTxtCompliant: true,
    lastVerified: '2025-01-01'
  }
];

// ==================== URL验证规则 ====================

/**
 * 平台URL验证模式
 */
const URL_PATTERNS: Record<Platform, RegExp[]> = {
  [Platform.DOUYIN]: [
    /^https?:\/\/(?:www\.)?douyin\.com\/video\/\d+/i,
    /^https?:\/\/(?:www\.)?douyin\.com\/user\/[\w\-]+/i
  ],
  [Platform.OCEANENGINE]: [
    /^https?:\/\/(?:www\.)?oceanengine\.com\//i
  ],
  [Platform.PUBLIC]: [
    /^https?:\/\/[\w\-\.]+/i // 通用URL格式，需要白名单验证
  ]
};

// ==================== 验证服务类 ====================

/**
 * CSV导入验证服务
 */
export class CsvImportValidationService {
  private whitelistSources: WhitelistSource[];
  
  constructor(whitelistSources?: WhitelistSource[]) {
    this.whitelistSources = whitelistSources || DEFAULT_WHITELIST_SOURCES;
  }

  /**
   * 验证完整的CSV数据
   */
  async validateCsvData(csvData: CsvRawRecord[]): Promise<CsvValidationResult> {
    const results: RowValidationResult[] = [];
    const globalErrors: ValidationError[] = [];
    const dedupKeys = new Set<string>();
    
    // 统计信息
    const stats = {
      byPlatform: {} as Record<Platform, number>,
      byType: {} as Record<TargetType, number>,
      bySource: {} as Record<SourceType, number>
    };

    // 初始化统计
    Object.values(Platform).forEach(p => stats.byPlatform[p] = 0);
    Object.values(TargetType).forEach(t => stats.byType[t] = 0);
    Object.values(SourceType).forEach(s => stats.bySource[s] = 0);

    // 验证表头
    if (csvData.length === 0) {
      globalErrors.push({
        code: ValidationErrorCode.E_REQUIRED,
        field: 'csv',
        value: '',
        message: 'CSV文件为空',
        suggestion: '请确保CSV文件包含数据行'
      });
    }

    // 逐行验证
    for (let i = 0; i < csvData.length; i++) {
      const rowResult = await this.validateRow(csvData[i], i + 1, dedupKeys);
      results.push(rowResult);

      // 更新统计
      if (rowResult.isValid && rowResult.normalizedData) {
        const { platform, type, source } = rowResult.normalizedData;
        stats.byPlatform[platform]++;
        stats.byType[type]++;
        stats.bySource[source]++;
      }
    }

    const validRows = results.filter(r => r.isValid).length;

    return {
      totalRows: csvData.length,
      validRows,
      invalidRows: csvData.length - validRows,
      results,
      globalErrors,
      stats
    };
  }

  /**
   * 验证单行数据
   */
  private async validateRow(
    raw: CsvRawRecord, 
    rowIndex: number, 
    dedupKeys: Set<string>
  ): Promise<RowValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. 必填字段验证
    this.validateRequiredFields(raw, errors);

    // 2. 枚举字段验证
    const platform = this.validatePlatform(raw.platform, errors);
    const targetType = this.validateTargetType(raw.type, errors);
    const sourceType = this.validateSourceType(raw.source, errors);

    // 3. URL格式验证
    const normalizedUrl = this.validateUrl(raw.id_or_url, platform, errors);

    // 4. 标签验证
    const industryTags = this.validateIndustryTags(raw.industry_tags, errors, warnings);
    const regionTag = this.validateRegionTag(raw.region, errors, warnings);

    // 5. 合规性验证
    if (platform === Platform.PUBLIC && normalizedUrl) {
      await this.validateComplianceForPublicSource(normalizedUrl, errors);
    }

    // 6. 生成去重键并检查唯一性
    let dedupKey = '';
    let normalizedData: CandidatePoolRecord | null = null;

    if (platform && targetType && normalizedUrl && sourceType) {
      dedupKey = this.generateDedupKey(platform, normalizedUrl);
      
      if (dedupKeys.has(dedupKey)) {
        errors.push({
          code: ValidationErrorCode.E_DUP,
          field: 'dedup_key',
          value: dedupKey,
          message: '重复记录：相同平台和URL的记录已存在',
          suggestion: '重复记录将被视为更新操作'
        });
      } else {
        dedupKeys.add(dedupKey);
      }

      // 构建规范化数据
      normalizedData = {
        type: targetType,
        platform,
        id_or_url: normalizedUrl,
        title: raw.title?.trim() || undefined,
        source: sourceType,
        industry_tags: industryTags,
        region: regionTag,
        notes: raw.notes?.trim() || undefined,
        dedup_key: dedupKey
      };
    }

    return {
      rowIndex,
      originalData: raw,
      normalizedData,
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }

  /**
   * 验证必填字段
   */
  private validateRequiredFields(raw: CsvRawRecord, errors: ValidationError[]): void {
    const requiredFields = ['type', 'platform', 'id_or_url', 'source'];
    
    for (const field of requiredFields) {
      if (!raw[field]?.toString().trim()) {
        errors.push({
          code: ValidationErrorCode.E_REQUIRED,
          field,
          value: raw[field],
          message: `必填字段 "${field}" 不能为空`,
          suggestion: `请填写 ${field} 字段的值`
        });
      }
    }
  }

  /**
   * 验证平台枚举
   */
  private validatePlatform(value: any, errors: ValidationError[]): Platform | null {
    if (!value) return null;
    
    const normalized = value.toString().toLowerCase().trim();
    const platformValue = Object.values(Platform).find(p => p === normalized);
    
    if (!platformValue) {
      errors.push({
        code: ValidationErrorCode.E_ENUM,
        field: 'platform',
        value,
        message: `平台值 "${value}" 不在允许范围内`,
        suggestion: `请使用: ${Object.values(Platform).join(', ')}`
      });
      return null;
    }
    
    return platformValue;
  }

  /**
   * 验证目标类型枚举
   */
  private validateTargetType(value: any, errors: ValidationError[]): TargetType | null {
    if (!value) return null;
    
    const normalized = value.toString().toLowerCase().trim();
    const typeValue = Object.values(TargetType).find(t => t === normalized);
    
    if (!typeValue) {
      errors.push({
        code: ValidationErrorCode.E_ENUM,
        field: 'type',
        value,
        message: `目标类型 "${value}" 不在允许范围内`,
        suggestion: `请使用: ${Object.values(TargetType).join(', ')}`
      });
      return null;
    }
    
    return typeValue;
  }

  /**
   * 验证来源类型枚举
   */
  private validateSourceType(value: any, errors: ValidationError[]): SourceType | null {
    if (!value) return null;
    
    const normalized = value.toString().toLowerCase().trim();
    const sourceValue = Object.values(SourceType).find(s => s === normalized);
    
    if (!sourceValue) {
      errors.push({
        code: ValidationErrorCode.E_ENUM,
        field: 'source',
        value,
        message: `来源类型 "${value}" 不在允许范围内`,
        suggestion: `请使用: ${Object.values(SourceType).join(', ')}`
      });
      return null;
    }
    
    return sourceValue;
  }

  /**
   * 验证URL格式
   */
  private validateUrl(value: any, platform: Platform | null, errors: ValidationError[]): string | null {
    if (!value || !platform) return null;
    
    const url = value.toString().trim();
    
    // 基础URL格式检查
    try {
      new URL(url);
    } catch {
      errors.push({
        code: ValidationErrorCode.E_URL,
        field: 'id_or_url',
        value,
        message: 'URL格式无效',
        suggestion: '请提供完整的HTTP/HTTPS URL'
      });
      return null;
    }

    // 平台特定格式检查
    const patterns = URL_PATTERNS[platform];
    if (patterns && !patterns.some(pattern => pattern.test(url))) {
      errors.push({
        code: ValidationErrorCode.E_URL,
        field: 'id_or_url',
        value,
        message: `URL格式不符合 ${platform} 平台规范`,
        suggestion: `请检查URL格式是否正确`
      });
      return null;
    }

    return url;
  }

  /**
   * 验证行业标签
   */
  private validateIndustryTags(
    value: any, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): IndustryTag[] {
    if (!value?.toString().trim()) {
      return [];
    }

    const tagsString = value.toString().trim();
    const { valid, invalid } = parseIndustryTagsString(tagsString);

    // 处理无效标签
    for (const invalidTag of invalid) {
      // 尝试映射外部标签
      const mapped = mapExternalTagToInternal(invalidTag);
      if (mapped) {
        valid.push(mapped);
        warnings.push({
          code: ValidationErrorCode.E_TAG_INVALID,
          field: 'industry_tags',
          value: invalidTag,
          message: `标签 "${invalidTag}" 已自动映射为 "${getIndustryTagLabel(mapped)}"`,
          suggestion: '建议使用标准标签名称'
        });
      } else {
        errors.push({
          code: ValidationErrorCode.E_TAG_INVALID,
          field: 'industry_tags',
          value: invalidTag,
          message: `无效的行业标签: "${invalidTag}"`,
          suggestion: '请使用标准行业标签或联系管理员添加新标签'
        });
      }
    }

    return valid;
  }

  /**
   * 验证地域标签
   */
  private validateRegionTag(
    value: any, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): RegionTag | undefined {
    if (!value?.toString().trim()) {
      return undefined;
    }

    const regionString = value.toString().trim();
    
    // 直接匹配标准枚举
    const directMatch = Object.values(RegionTag).find(r => r === regionString.toLowerCase());
    if (directMatch) {
      return directMatch;
    }

    // 尝试映射外部标签
    const mapped = mapExternalRegionToInternal(regionString);
    if (mapped) {
      warnings.push({
        code: ValidationErrorCode.E_TAG_INVALID,
        field: 'region',
        value: regionString,
        message: `地域标签 "${regionString}" 已自动映射为 "${getRegionTagLabel(mapped)}"`,
        suggestion: '建议使用标准地域标签名称'
      });
      return mapped;
    }

    errors.push({
      code: ValidationErrorCode.E_TAG_INVALID,
      field: 'region',
      value: regionString,
      message: `无效的地域标签: "${regionString}"`,
      suggestion: '请使用标准地域标签'
    });

    return undefined;
  }

  /**
   * 验证公开来源的合规性
   */
  private async validateComplianceForPublicSource(
    url: string, 
    errors: ValidationError[]
  ): Promise<void> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      const whitelistEntry = this.whitelistSources.find(s => 
        s.domain === domain || url.includes(s.domain)
      );

      if (!whitelistEntry) {
        errors.push({
          code: ValidationErrorCode.E_NOT_ALLOWED,
          field: 'id_or_url',
          value: url,
          message: `域名 "${domain}" 不在白名单中`,
          suggestion: '请联系管理员确认该数据源是否允许抓取'
        });
        return;
      }

      if (!whitelistEntry.allowed) {
        errors.push({
          code: ValidationErrorCode.E_NOT_ALLOWED,
          field: 'id_or_url',
          value: url,
          message: `数据源 "${domain}" 已被标记为不允许抓取`,
          suggestion: `原因: ${whitelistEntry.reason}`
        });
        return;
      }

      if (!whitelistEntry.robotsTxtCompliant) {
        errors.push({
          code: ValidationErrorCode.E_NOT_ALLOWED,
          field: 'id_or_url',
          value: url,
          message: `数据源 "${domain}" 不符合robots.txt规范`,
          suggestion: '请确认是否有权限抓取该网站数据'
        });
      }
    } catch (error) {
      errors.push({
        code: ValidationErrorCode.E_URL,
        field: 'id_or_url',
        value: url,
        message: 'URL解析失败，无法进行合规性检查',
        suggestion: '请检查URL格式是否正确'
      });
    }
  }

  /**
   * 生成去重键
   */
  private generateDedupKey(platform: Platform, url: string): string {
    return `${platform}:${url}`;
  }

  /**
   * 生成CSV模板
   */
  generateCsvTemplate(): string {
    const headers = [
      'type',
      'platform', 
      'id_or_url',
      'title',
      'source',
      'industry_tags',
      'region',
      'notes'
    ];

    const examples = [
      [
        'video',
        'douyin',
        'https://www.douyin.com/video/xxxx',
        '示例视频',
        'csv',
        'oral-care;medical-health',
        'east-china',
        '口腔护理相关视频'
      ],
      [
        'account',
        'douyin',
        'https://www.douyin.com/user/yyyy',
        '示例账号',
        'manual',
        'beauty-cosmetics',
        'nationwide',
        '美妆博主账号'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...examples.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * 格式化验证错误为用户友好的消息
   */
  formatValidationErrors(errors: ValidationError[]): string {
    return errors.map(error => {
      let message = `[${error.code}] ${error.field}: ${error.message}`;
      if (error.suggestion) {
        message += ` (${error.suggestion})`;
      }
      return message;
    }).join('\n');
  }

  /**
   * 更新白名单配置
   */
  updateWhitelistSources(sources: WhitelistSource[]): void {
    this.whitelistSources = sources;
  }
}

// ==================== 导出默认实例 ====================

export const csvValidationService = new CsvImportValidationService();