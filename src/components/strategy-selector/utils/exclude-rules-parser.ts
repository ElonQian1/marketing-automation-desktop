// src/components/strategy-selector/utils/exclude-rules-parser.ts
// module: strategy-selector | layer: utils | role: 排除规则解析器
// summary: 解析和格式化排除规则文本

import type { ExcludeRule } from '../../smart-selection/ExcludeRuleEditor';

/**
 * 将排除文本解析为规则数组
 * 
 * @param excludeText 排除文本（字符串或字符串数组）
 * @returns 规则数组
 */
export function parseExcludeTextToRules(excludeText: string | string[] | undefined): ExcludeRule[] {
  if (!excludeText) return [];
  
  const textArray = Array.isArray(excludeText) ? excludeText : [excludeText];
  
  return textArray.map((line, index) => {
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      return {
        id: `rule-${index}`,
        attr: parts[0] as 'text' | 'resource_id' | 'content_desc',
        op: parts[1] as 'contains' | 'equals' | 'startswith' | 'endswith',
        value: parts.slice(2).join(' ')
      };
    }
    return {
      id: `rule-${index}`,
      attr: 'text' as const,
      op: 'contains' as const,
      value: line
    };
  });
}

/**
 * 将规则数组格式化为排除文本
 * 
 * @param rules 规则数组
 * @returns 排除文本数组
 */
export function formatRulesToExcludeText(rules: ExcludeRule[]): string[] {
  return rules.map(rule => `${rule.attr} ${rule.op} ${rule.value}`);
}
