// src/components/universal-ui/views/grid-view/panels/node-detail/StrategyConfigurator.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { UnifiedStrategyConfigurator } from '../../../../strategy-selector';
import { ElementPresetsRow } from './element-presets/ElementPresetsRow';
import { SelectedFieldsTable } from './SelectedFieldsTable';
import { SelectedFieldsPreview } from './SelectedFieldsPreview';
import type { MatchCriteria, MatchStrategy } from './types';
import type { UiNode } from '../../types';
import { PRESET_FIELDS, normalizeExcludes, normalizeIncludes, inferStrategyFromFields, buildDefaultValues } from './helpers';
import { buildXPath } from '../../../../../../utils/xpath/generation';
import XPathService from '../../../../../../utils/xpath/XPathService';

export interface StrategyConfiguratorProps {
  node: UiNode | null;
  criteria: MatchCriteria | null;
  onChange: (next: MatchCriteria) => void;
}

export const StrategyConfigurator: React.FC<StrategyConfiguratorProps> = ({ node, criteria, onChange }) => {
  const current = criteria || { strategy: 'standard', fields: [], values: {}, includes: {}, excludes: {} } as MatchCriteria;

  // 小工具：转义正则特殊字符（与 NodeDetailPanel 中逻辑保持一致）
  const escapeRegex = (input: string): string => {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 从当前 criteria 推断“仅匹配关键词（正则精确）”开关状态
  const keywordOnly: Record<string, boolean> = React.useMemo(() => {
    const result: Record<string, boolean> = {};
    const textLike = ['text', 'content-desc'];
    const mode = (current as any).matchMode as Record<string, 'equals' | 'contains' | 'regex'> | undefined;
    const regexIncludes = (current as any).regexIncludes as Record<string, string[]> | undefined;
    for (const f of current.fields || []) {
      if (!textLike.includes(f)) continue;
      const isRegex = mode?.[f] === 'regex';
      const patterns = regexIncludes?.[f] || [];
      const val = (current.values || {})[f];
      // 若设置为 regex 且存在正则，即认为启用；
      // 若正则刚好为 ^值$ 则属于“仅关键词”精确匹配
      if (isRegex && patterns.length > 0) {
        if (val && patterns.some(p => p === `^${escapeRegex(String(val))}$`)) {
          result[f] = true;
        } else {
          // 自定义正则也视为“启用”（但非精确关键词），同样标记为 true 以提示已启用
          result[f] = true;
        }
      } else {
        result[f] = false;
      }
    }
    return result;
  }, [current]);

  return (
    <div>
      <UnifiedStrategyConfigurator
        matchCriteria={current}
        onChange={(newCriteria) => {
          // 处理 XPath 策略的特殊逻辑
          if (newCriteria.strategy.startsWith('xpath-') && node?.attrs) {
            const elementForXPath = {
              'resource-id': node.attrs['resource-id'],
              'content-desc': node.attrs['content-desc'],
              'text': node.attrs['text'],
              'class': node.attrs['class'],
              'index': node.attrs['index'] ? parseInt(String(node.attrs['index']), 10) : undefined,
              resource_id: node.attrs['resource-id'],
              content_desc: node.attrs['content-desc'],
              class_name: node.attrs['class'],
            };

            try {
              let generatedXPath = '';
              if (newCriteria.strategy === 'xpath-first-index') {
                generatedXPath = buildXPath(elementForXPath, { useIndex: true });
              } else {
                generatedXPath = buildXPath(elementForXPath);
              }
              
              if (generatedXPath) {
                newCriteria.values = {
                  ...newCriteria.values,
                  'xpath': generatedXPath
                };
              }
            } catch (error) {
              console.warn('⚠️ 生成 XPath 失败:', error);
            }
          }
          
          onChange(newCriteria);
        }}
        referenceElement={node}
        mode="compact"
        showScores={false}
      />

      <div className="mt-2">
        <ElementPresetsRow
          node={node}
          onPreviewFields={(fs) => {
            const next = {
              ...current,
              fields: fs,
              strategy: 'custom' as MatchStrategy,
            };
            onChange(next);
          }}
          onApply={(built) => {
            onChange({
              ...current,
              strategy: built.strategy,
              fields: built.fields,
              values: built.values,
              includes: built.includes,
              excludes: built.excludes,
            });
          }}
        />
      </div>

      <div className="mt-2">
        <SelectedFieldsTable
          node={node || ({ id: 'preview', attrs: current.values || {} } as any)}
          selected={current.fields || []}
          values={current.values || {}}
          onToggle={(field) => {
            const set = new Set<string>(current.fields || []);
            if (set.has(field)) set.delete(field); else set.add(field);
            const nextFields = Array.from(set);
            const normalizedExcludes = normalizeExcludes(current.excludes || {}, nextFields);
            const normalizedIncludes = normalizeIncludes(current.includes || {}, nextFields);
            const nextStrategy = inferStrategyFromFields(nextFields);
            onChange({
              ...current,
              strategy: nextStrategy,
              fields: nextFields,
              values: Object.fromEntries(Object.entries(current.values || {}).filter(([k]) => nextFields.includes(k))),
              excludes: normalizedExcludes,
              includes: normalizedIncludes,
            });
          }}
          onChangeValue={(field, v) => {
            // 基础值更新
            const nextValues = { ...(current.values || {}), [field]: v } as Record<string,string>;

            // 若该字段启用了“仅匹配关键词（正则）”，则同步更新 matchMode/regexIncludes
            const textLike = ['text', 'content-desc'];
            const isTextLike = textLike.includes(field);
            const isKeywordOnly = (keywordOnly as any)?.[field];
            let nextMatchMode = { ...((current as any).matchMode || {}) } as Record<string, 'equals' | 'contains' | 'regex'>;
            let nextRegexIncludes = { ...((current as any).regexIncludes || {}) } as Record<string, string[]>;
            if (isTextLike && isKeywordOnly) {
              nextMatchMode[field] = 'regex';
              const trimmed = (v ?? '').toString().trim();
              nextRegexIncludes[field] = trimmed ? [`^${escapeRegex(trimmed)}$`] : ['^$'];
            }

            onChange({
              ...current,
              values: nextValues,
              ...(Object.keys(nextMatchMode).length ? { matchMode: nextMatchMode } : {}),
              ...(Object.keys(nextRegexIncludes).length ? { regexIncludes: nextRegexIncludes } : {}),
            });
          }}
          includes={current.includes || {}}
          onChangeIncludes={(field, next) => {
            const combined = { ...(current.includes || {}), [field]: next } as Record<string,string[]>;
            const normalized = normalizeIncludes(combined, current.fields || []);
            onChange({ ...current, includes: normalized });
          }}
          excludes={current.excludes || {}}
          onChangeExcludes={(field, next) => {
            const combined = { ...(current.excludes || {}), [field]: next } as Record<string,string[]>;
            const normalized = normalizeExcludes(combined, current.fields || []);
            onChange({ ...current, excludes: normalized });
          }}
          // 将“仅匹配关键词（正则）”开关与 MatchCriteria 中的 matchMode/regexIncludes 进行双向绑定
          keywordOnly={keywordOnly}
          onToggleKeywordOnly={(field, enabled) => {
            const textLike = ['text', 'content-desc'];
            if (!textLike.includes(field)) return;
            const nextMatchMode = { ...((current as any).matchMode || {}) } as Record<string, 'equals' | 'contains' | 'regex'>;
            const nextRegexIncludes = { ...((current as any).regexIncludes || {}) } as Record<string, string[]>;

            if (enabled) {
              nextMatchMode[field] = 'regex';
              const val = (current.values || {})[field];
              if (val != null && String(val).trim() !== '') {
                nextRegexIncludes[field] = [`^${escapeRegex(String(val).trim())}$`];
              } else {
                // 没有值时给一个空串精确匹配，避免出现不一致
                nextRegexIncludes[field] = ['^$'];
              }
            } else {
              // 关闭时移除对应字段的 regex 设置
              if (field in nextMatchMode) delete nextMatchMode[field];
              if (field in nextRegexIncludes) delete nextRegexIncludes[field];
            }

            onChange({
              ...current,
              // 仅当有键时保留对象，避免无意义的空对象污染
              ...(Object.keys(nextMatchMode).length ? { matchMode: nextMatchMode } : { matchMode: undefined as any }),
              ...(Object.keys(nextRegexIncludes).length ? { regexIncludes: nextRegexIncludes } : { regexIncludes: undefined as any }),
            });
          }}
        />
      </div>

      {Array.isArray(current.fields) && current.fields.length > 0 && (
        <div className="mt-2 border-t pt-2">
          <SelectedFieldsPreview node={node || ({ id: 'preview', attrs: current.values || {} } as any)} fields={current.fields} />
        </div>
      )}
    </div>
  );
};

export default StrategyConfigurator;
