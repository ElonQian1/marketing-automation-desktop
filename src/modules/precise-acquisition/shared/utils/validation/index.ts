export * from './csvValidation';export * from './csvValidation';/**/**/**

 * 精准获客数据验证模块统一导出

 *  * 数据验证工具统一导出 * 数据验证工具统一导出

 * 提供CSV导入、数据校验、合规性检查等功能

 */ *  * 



export * from './csvValidation'; * 提供候选池数据验证的完整功能 * 提供候选池数据验证的完整功能

 */ */



// 导出CSV校验相关功能// 导出CSV校验相关功能

export * from './csvValidation';export * from './csvValidation';



// 导出兼容性函数// 导出兼容性函数

import { checkWhitelistCompliance } from './csvValidation';import { checkWhitelistCompliance } from './csvValidation';



/**/**

 * 生成去重键 * 验证URL格式

 */ */

export function generateDedupKey(platform: string, idOrUrl: string): string {export function validateUrl(url: string, platform: Platform, targetType: TargetType): boolean {

  return `${platform}:${idOrUrl}`;  const patterns = URL_PATTERNS[platform];

}  if (!patterns) return false;

  

/**  if (platform === Platform.PUBLIC) {

 * 合规性检查    // 公开平台需要额外的白名单验证

 */    return 'general' in patterns && patterns.general.test(url);

export function checkCompliance(target: any): {  }

  passed: boolean;  

  violations: string[];  if (targetType === TargetType.VIDEO && 'video' in patterns) {

} {    return patterns.video.test(url);

  const violations: string[] = [];  }

    

  // 使用新的白名单检查函数  if (targetType === TargetType.ACCOUNT && 'user' in patterns) {

  if (target.platform === 'public') {    return patterns.user.test(url);

    const compliance = checkWhitelistCompliance(target.idOrUrl || target.id_or_url, 'public' as any);  }

    if (!compliance.allowed) {  

      violations.push(compliance.reason || '不符合白名单要求');  return false;

    }}

  }

  /**

  return { * 验证行业标签

    passed: violations.length === 0, */

    violationsexport function validateIndustryTags(tags: string[]): {

  };  valid: IndustryTag[];

}  invalid: string[];
} {
  const valid: IndustryTag[] = [];
  const invalid: string[] = [];
  
  tags.forEach(tag => {
    if (Object.values(IndustryTag).includes(tag as IndustryTag)) {
      valid.push(tag as IndustryTag);
    } else {
      invalid.push(tag);
    }
  });
  
  return { valid, invalid };
}

/**
 * 验证地区标签
 */
export function validateRegionTag(region: string): RegionTag | null {
  if (Object.values(RegionTag).includes(region as RegionTag)) {
    return region as RegionTag;
  }
  return null;
}

/**
 * 验证CSV导入数据
 */
export function validateCsvImportData(data: any[]): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validRows: any[] = [];
  const invalidRows: any[] = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push('数据为空或格式错误');
    return {
      valid: false,
      errors,
      warnings,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      summary: {
        total: 0,
        valid: 0,
        invalid: 0
      }
    };
  }

  // 检查必要的字段
  const requiredFields = ['url', 'platform', 'target_type'];
  const firstRow = data[0];
  
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  if (missingFields.length > 0) {
    errors.push(`缺少必要字段: ${missingFields.join(', ')}`);
  }

  // 逐行验证
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    // 验证URL
    if (!row.url || typeof row.url !== 'string') {
      rowErrors.push('URL为空或格式错误');
    } else if (!validateUrl(row.url, row.platform, row.target_type)) {
      rowErrors.push('URL格式不符合平台规范');
    }
    
    // 验证平台
    if (!row.platform || !Object.values(Platform).includes(row.platform)) {
      rowErrors.push('平台参数无效');
    }
    
    // 验证目标类型
    if (!row.target_type || !Object.values(TargetType).includes(row.target_type)) {
      rowErrors.push('目标类型无效');
    }
    
    // 验证行业标签（可选）
    if (row.industry_tags) {
      const tags = Array.isArray(row.industry_tags) 
        ? row.industry_tags 
        : row.industry_tags.split(',').map((t: string) => t.trim());
      
      const { invalid } = validateIndustryTags(tags);
      if (invalid.length > 0) {
        warnings.push(`第${index + 1}行: 无效的行业标签 ${invalid.join(', ')}`);
      }
    }
    
    // 验证地区标签（可选）
    if (row.region && !validateRegionTag(row.region)) {
      warnings.push(`第${index + 1}行: 无效的地区标签 ${row.region}`);
    }
    
    if (rowErrors.length > 0) {
      invalidRows.push({
        ...row,
        row_index: index + 1,
        errors: rowErrors
      });
    } else {
      validRows.push(row);
    }
  });

  return {
    valid: errors.length === 0 && invalidRows.length === 0,
    errors,
    warnings,
    valid_rows: validRows,
    invalid_rows: invalidRows,
    summary: {
      total: data.length,
      valid: validRows.length,
      invalid: invalidRows.length
    }
  };
}

/**
 * 验证批量导入数据的大小限制
 */
export function validateImportSize(data: any[]): {
  valid: boolean;
  message?: string;
} {
  const maxRows = VALIDATION_RULES.MAX_IMPORT_ROWS || 1000;
  
  if (data.length > maxRows) {
    return {
      valid: false,
      message: `导入数据超过限制，最多支持 ${maxRows} 条记录，当前 ${data.length} 条`
    };
  }
  
  return { valid: true };
}

/**
 * 验证文本内容（敏感词检查）
 */
export function validateTextContent(text: string): {
  valid: boolean;
  sensitive_words: string[];
  filtered_text: string;
} {
  // 这里可以接入敏感词检测服务
  // 目前提供基础实现
  const sensitiveWords: string[] = [];
  let filteredText = text;
  
  // 基础敏感词列表（可扩展）
  const basicSensitiveWords = ['spam', 'advertising', '广告', '推广'];
  
  basicSensitiveWords.forEach(word => {
    if (text.toLowerCase().includes(word.toLowerCase())) {
      sensitiveWords.push(word);
      filteredText = filteredText.replace(new RegExp(word, 'gi'), '***');
    }
  });
  
  return {
    valid: sensitiveWords.length === 0,
    sensitive_words: sensitiveWords,
    filtered_text: filteredText
  };
}