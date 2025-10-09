/**
 * 数据处理工具
 * 
 * 提供数据转换、去重、模板处理等功能
 */

import { WatchTarget, Platform, Comment, ComplianceCheckResult } from '../../types/core';
import { SENSITIVE_WORDS } from '../../constants';

/**
 * 生成去重键
 */
export function generateDedupKey(platform: Platform, identifier: string): string {
  return `${platform}_${identifier}`;
}

/**
 * 生成评论去重键
 */
export function generateCommentDedupKey(platform: Platform, commentId: string): string {
  return `comment_${platform}_${commentId}`;
}

/**
 * 生成用户去重键
 */
export function generateUserDedupKey(platform: Platform, userId: string): string {
  return `user_${platform}_${userId}`;
}

/**
 * CSV行转换为WatchTarget对象
 */
export function csvRowToWatchTarget(row: any): WatchTarget {
  return {
    id: row.id || null,
    url: row.url,
    platform: row.platform,
    target_type: row.target_type,
    target_id: row.target_id || '',
    title: row.title || '',
    notes: row.notes || '',
    industry_tags: Array.isArray(row.industry_tags) 
      ? row.industry_tags 
      : (row.industry_tags || '').split(',').filter((tag: string) => tag.trim()),
    region: row.region || null,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date()
  };
}

/**
 * WatchTarget对象转换为CSV行
 */
export function watchTargetToCsvRow(target: WatchTarget): any {
  return {
    id: target.id,
    url: target.url,
    platform: target.platform,
    target_type: target.target_type,
    target_id: target.target_id,
    title: target.title,
    notes: target.notes,
    industry_tags: Array.isArray(target.industry_tags) 
      ? target.industry_tags.join(',') 
      : target.industry_tags,
    region: target.region,
    created_at: target.created_at.toISOString(),
    updated_at: target.updated_at.toISOString()
  };
}

/**
 * 检测文本中的敏感词
 */
export function detectSensitiveWords(text: string): {
  found: string[];
  positions: Array<{ word: string; start: number; end: number }>;
  clean_text: string;
} {
  const found: string[] = [];
  const positions: Array<{ word: string; start: number; end: number }> = [];
  let cleanText = text;

  SENSITIVE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      found.push(word);
      positions.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
      
      // 替换为星号
      cleanText = cleanText.replace(match[0], '*'.repeat(match[0].length));
    }
  });

  return {
    found: [...new Set(found)], // 去重
    positions,
    clean_text: cleanText
  };
}

/**
 * 解析模板变量
 */
export function parseTemplateVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1]);
  }

  return [...new Set(variables)]; // 去重
}

/**
 * 替换模板变量
 */
export function replaceTemplateVariables(
  template: string, 
  variables: Record<string, string>
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * 数组去重（基于指定字段）
 */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (typeof obj === 'object') {
    const cloned = {} as any;
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }

  return obj;
}

/**
 * 分页处理
 */
export function paginate<T>(
  array: T[], 
  page: number, 
  pageSize: number
): {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const total = array.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = array.slice(start, end);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * 数据排序
 */
export function sortBy<T>(
  array: T[], 
  keyFn: (item: T) => any, 
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * 数据分组
 */
export function groupBy<T>(
  array: T[], 
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 合规性检查
 */
export function checkCompliance(target: WatchTarget): ComplianceCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // 检查URL合规性
  if (!target.url || target.url.trim() === '') {
    issues.push('URL不能为空');
  }

  // 检查标题敏感词
  if (target.title) {
    const sensitiveCheck = detectSensitiveWords(target.title);
    if (sensitiveCheck.found.length > 0) {
      warnings.push(`标题包含敏感词: ${sensitiveCheck.found.join(', ')}`);
    }
  }

  // 检查备注敏感词
  if (target.notes) {
    const sensitiveCheck = detectSensitiveWords(target.notes);
    if (sensitiveCheck.found.length > 0) {
      warnings.push(`备注包含敏感词: ${sensitiveCheck.found.join(', ')}`);
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
    warnings,
    risk_level: issues.length > 0 ? 'high' : warnings.length > 0 ? 'medium' : 'low'
  };
}