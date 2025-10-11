/**
 * CSV导入校验工具
 * 
 * 根据 Round 2｜导入规范与校验规则（v1）文档实现
 * 提供完整的CSV数据验证功能
 */

import { 
  Platform, 
  TargetType, 
  SourceType,
  IndustryTag, 
  RegionTag
} from '../../../../../constants/precise-acquisition-enums';

// ==================== 错误码定义 ====================

export enum ValidationErrorCode {
  E_REQUIRED = 'E_REQUIRED',          // 缺少必填列
  E_ENUM = 'E_ENUM',                  // 枚举取值非法
  E_URL = 'E_URL',                    // URL非法
  E_DUP = 'E_DUP',                    // 重复记录
  E_NOT_ALLOWED = 'E_NOT_ALLOWED',    // 白名单不允许或缺失依据
  E_FORMAT = 'E_FORMAT',              // 格式错误
  E_LENGTH = 'E_LENGTH'               // 长度超限
}

// ==================== 校验规则配置 ====================

export const VALIDATION_RULES = {
  MAX_IMPORT_ROWS: 1000,
  MAX_TITLE_LENGTH: 200,
  MAX_NOTES_LENGTH: 500,
  REQUIRED_COLUMNS: ['type', 'platform', 'id_or_url', 'source'],
  OPTIONAL_COLUMNS: ['title', 'industry_tags', 'region', 'notes']
};

// ==================== URL校验模式 ====================

export const URL_PATTERNS: Record<Platform, Record<string, RegExp>> = {
  [Platform.DOUYIN]: {
    video: /^https?:\/\/(www\.)?douyin\.com\/video\/\d+/,
    user: /^https?:\/\/(www\.)?douyin\.com\/user\/[\w-]+/
  },
  [Platform.XIAOHONGSHU]: {
    video: /^https?:\/\/(www\.)?xiaohongshu\.com\/discovery\/item\/[\w-]+/,
    user: /^https?:\/\/(www\.)?xiaohongshu\.com\/user\/profile\/[\w-]+/
  },
  [Platform.OCEANENGINE]: {
    general: /^https?:\/\/.*oceanengine\.com\/.*/
  },
  [Platform.PUBLIC]: {
    general: /^https?:\/\/[\w.-]+\/.*/
  }
};

// ==================== 白名单数据源（示例） ====================

export const WHITELIST_SOURCES = [
  'https://example-allowed-site1.com',
  'https://example-allowed-site2.com',
  // 实际使用时应从配置文件或数据库加载
];

// ==================== CSV行数据接口 ====================

export interface CsvRowData {
  type: string;                    // 目标类型
  platform: string;               // 平台
  id_or_url: string;              // ID或URL
  title?: string;                 // 标题
  source: string;                 // 来源
  industry_tags?: string;         // 行业标签（分号分隔）
  region?: string;                // 地域
  notes?: string;                 // 备注
}

// ==================== 校验结果接口 ====================

export interface ValidationError {
  code: ValidationErrorCode;
  field: string;
  message: string;
  suggestion?: string;
}

export interface RowValidationResult {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  data?: any;
}

export interface CsvValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

export interface CsvValidationResult {
  summary: CsvValidationSummary;
  results: RowValidationResult[];
  globalErrors: string[];
}

// ==================== 核心校验函数 ====================

/**
 * 验证URL格式
 */
export function validateUrl(url: string, platform: Platform, targetType: TargetType): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url); // 基础URL格式检查
  } catch {
    return false;
  }
  
  const patterns = URL_PATTERNS[platform];
  if (!patterns) return false;
  
  if (platform === Platform.PUBLIC) {
    return patterns.general?.test(url) || false;
  }
  
  const typePattern = targetType === TargetType.VIDEO ? patterns.video : patterns.user;
  return typePattern?.test(url) || patterns.general?.test(url) || false;
}

/**
 * 验证行业标签
 */
export function validateIndustryTags(tagsString: string): {
  valid: IndustryTag[];
  invalid: string[];
} {
  if (!tagsString || typeof tagsString !== 'string') {
    return { valid: [], invalid: [] };
  }
  
  const tags = tagsString.split(';').map(tag => tag.trim()).filter(Boolean);
  const valid: IndustryTag[] = [];
  const invalid: string[] = [];
  
  for (const tag of tags) {
    const found = Object.values(IndustryTag).find(enumValue => enumValue === tag);
    if (found) {
      valid.push(found);
    } else {
      invalid.push(tag);
    }
  }
  
  return { valid, invalid };
}

/**
 * 验证地域标签
 */
export function validateRegionTag(region: string): boolean {
  if (!region || typeof region !== 'string') return true; // 可选字段
  return Object.values(RegionTag).includes(region as RegionTag);
}

/**
 * 检查白名单合规性
 */
export function checkWhitelistCompliance(url: string, platform: Platform): {
  allowed: boolean;
  reason?: string;
} {
  if (platform !== Platform.PUBLIC) {
    return { allowed: true };
  }
  
  // 检查是否在白名单中
  const isInWhitelist = WHITELIST_SOURCES.some(whitelistUrl => 
    url.toLowerCase().includes(whitelistUrl.toLowerCase())
  );
  
  if (!isInWhitelist) {
    return {
      allowed: false,
      reason: '公开来源必须在白名单中并标记"允许抓取"'
    };
  }
  
  return { allowed: true };
}

/**
 * 校验单行数据
 */
export function validateCsvRow(rowData: CsvRowData, index: number): RowValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  // 必填字段检查
  for (const field of VALIDATION_RULES.REQUIRED_COLUMNS) {
    if (!rowData[field as keyof CsvRowData] || String(rowData[field as keyof CsvRowData]).trim() === '') {
      errors.push({
        code: ValidationErrorCode.E_REQUIRED,
        field,
        message: `第${index + 1}行：${field}字段不能为空`,
        suggestion: '请填写该必填字段'
      });
    }
  }
  
  // 平台枚举验证
  if (rowData.platform && !Object.values(Platform).includes(rowData.platform as Platform)) {
    errors.push({
      code: ValidationErrorCode.E_ENUM,
      field: 'platform',
      message: `第${index + 1}行：平台值"${rowData.platform}"无效`,
      suggestion: `请使用以下值之一：${Object.values(Platform).join(', ')}`
    });
  }
  
  // 目标类型验证
  if (rowData.type && !Object.values(TargetType).includes(rowData.type as TargetType)) {
    errors.push({
      code: ValidationErrorCode.E_ENUM,
      field: 'type',
      message: `第${index + 1}行：目标类型"${rowData.type}"无效`,
      suggestion: `请使用以下值之一：${Object.values(TargetType).join(', ')}`
    });
  }
  
  // 来源类型验证
  if (rowData.source && !Object.values(SourceType).includes(rowData.source as SourceType)) {
    errors.push({
      code: ValidationErrorCode.E_ENUM,
      field: 'source',
      message: `第${index + 1}行：来源类型"${rowData.source}"无效`,
      suggestion: `请使用以下值之一：${Object.values(SourceType).join(', ')}`
    });
  }
  
  // URL格式验证
  if (rowData.id_or_url && rowData.platform && rowData.type) {
    const isValidUrl = validateUrl(
      rowData.id_or_url, 
      rowData.platform as Platform, 
      rowData.type as TargetType
    );
    
    if (!isValidUrl) {
      errors.push({
        code: ValidationErrorCode.E_URL,
        field: 'id_or_url',
        message: `第${index + 1}行：URL格式无效或不匹配平台规则`,
        suggestion: '请检查URL格式是否正确'
      });
    }
  }
  
  // 行业标签验证
  if (rowData.industry_tags) {
    const { invalid } = validateIndustryTags(rowData.industry_tags);
    if (invalid.length > 0) {
      warnings.push(`第${index + 1}行：以下行业标签无效：${invalid.join(', ')}`);
    }
  }
  
  // 地域标签验证
  if (rowData.region && !validateRegionTag(rowData.region)) {
    warnings.push(`第${index + 1}行：地域标签"${rowData.region}"无效`);
  }
  
  // 白名单合规性检查
  if (rowData.platform === Platform.PUBLIC && rowData.id_or_url) {
    const compliance = checkWhitelistCompliance(rowData.id_or_url, Platform.PUBLIC);
    if (!compliance.allowed) {
      errors.push({
        code: ValidationErrorCode.E_NOT_ALLOWED,
        field: 'id_or_url',
        message: `第${index + 1}行：${compliance.reason}`,
        suggestion: '请与PM/法务确认后再导入'
      });
    }
  }
  
  // 长度限制检查
  if (rowData.title && rowData.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    warnings.push(`第${index + 1}行：标题过长，建议控制在${VALIDATION_RULES.MAX_TITLE_LENGTH}字符以内`);
  }
  
  if (rowData.notes && rowData.notes.length > VALIDATION_RULES.MAX_NOTES_LENGTH) {
    warnings.push(`第${index + 1}行：备注过长，建议控制在${VALIDATION_RULES.MAX_NOTES_LENGTH}字符以内`);
  }
  
  return {
    rowIndex: index,
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? rowData : undefined
  };
}

/**
 * 解析CSV内容
 */
export function parseCsvContent(content: string): CsvRowData[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV文件至少需要包含标题行和一行数据');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // 验证必需的列是否存在
  const missingHeaders = VALIDATION_RULES.REQUIRED_COLUMNS.filter(h => 
    !headers.includes(h)
  );
  
  if (missingHeaders.length > 0) {
    throw new Error(`CSV文件缺少必需的列：${missingHeaders.join(', ')}`);
  }
  
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
}

/**
 * 完整的CSV校验
 */
export function validateCsvData(content: string): CsvValidationResult {
  const globalErrors: string[] = [];
  
  try {
    // 解析CSV内容
    const rows = parseCsvContent(content);
    
    // 行数限制检查
    if (rows.length > VALIDATION_RULES.MAX_IMPORT_ROWS) {
      globalErrors.push(`导入行数超限：当前${rows.length}行，最大允许${VALIDATION_RULES.MAX_IMPORT_ROWS}行`);
    }
    
    // 逐行校验
    const results: RowValidationResult[] = [];
    const dedupKeys = new Set<string>();
    let duplicateCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const result = validateCsvRow(rows[i], i);
      
      // 去重检查
      if (result.isValid && result.data) {
        const dedupKey = `${result.data.platform}:${result.data.id_or_url}`;
        if (dedupKeys.has(dedupKey)) {
          result.isValid = false;
          result.errors.push({
            code: ValidationErrorCode.E_DUP,
            field: 'id_or_url',
            message: `第${i + 1}行：与之前的记录重复（平台+URL相同）`,
            suggestion: '重复记录将被自动合并或跳过'
          });
          duplicateCount++;
        } else {
          dedupKeys.add(dedupKey);
        }
      }
      
      results.push(result);
    }
    
    const validCount = results.filter(r => r.isValid).length;
    
    return {
      summary: {
        total: rows.length,
        valid: validCount,
        invalid: rows.length - validCount,
        duplicates: duplicateCount
      },
      results,
      globalErrors
    };
    
  } catch (error) {
    globalErrors.push(`CSV解析失败：${error instanceof Error ? error.message : String(error)}`);
    
    return {
      summary: {
        total: 0,
        valid: 0,
        invalid: 0,
        duplicates: 0
      },
      results: [],
      globalErrors
    };
  }
}

/**
 * CSV导入数据校验（外部接口）
 * 兼容性别名，实际调用 validateCsvData
 */
export function validateCsvImportData(csvData: any[]): any {
  // 如果传入的是已解析的数组，转换为CSV字符串格式
  if (Array.isArray(csvData) && csvData.length > 0) {
    // 假设第一个元素包含所有键作为列名
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n');
    
    return validateCsvData(csvContent);
  }
  
  // 如果是字符串，直接使用
  if (typeof csvData === 'string') {
    return validateCsvData(csvData);
  }
  
  // 其他情况返回错误
  return {
    summary: {
      total: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0
    },
    results: [],
    globalErrors: ['无效的输入数据格式']
  };
}

/**
 * 生成CSV模板
 */
export function generateCsvTemplate(): string {
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
  
  const exampleRows = [
    [
      'video',
      'douyin',
      'https://www.douyin.com/video/1234567890',
      '示例视频',
      'csv',
      '口腔;健康',
      '华东',
      '导入示例'
    ],
    [
      'account',
      'xiaohongshu',
      'https://www.xiaohongshu.com/user/profile/abc123',
      '示例账号',
      'manual',
      '美妆',
      '全国',
      '手动添加示例'
    ]
  ];
  
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}