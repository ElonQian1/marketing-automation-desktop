// src/utils/confidence-format.ts
// module: shared | layer: utils | role: 置信度格式化工具
// summary: 置信度数据的统一格式化、分级和展示逻辑

export type Evidence = Record<string, number>;
export type ConfidenceTier = 'high' | 'mid' | 'low' | 'none';

export function formatPercent(n?: number): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

export function getConfidenceTier(n?: number): ConfidenceTier {
  if (n == null || Number.isNaN(n)) return 'none';
  if (n >= 0.80) return 'high';  // 调整为80%阈值，更实用
  if (n >= 0.60) return 'mid';   // 与现有confidence-tag保持一致
  return 'low';
}

export function getTierColor(tier: ConfidenceTier): string {
  switch (tier) {
    case 'high': return 'var(--success, #10B981)';
    case 'mid':  return 'var(--warning, #F59E0B)';
    case 'low':  return 'var(--error, #EF4444)';
    default:     return 'var(--neutral-400, #94A3B8)';
  }
}

export function getTierLabel(tier: ConfidenceTier): string {
  switch (tier) {
    case 'high': return '高';
    case 'mid':  return '中';
    case 'low':  return '低';
    default:     return '—';
  }
}

// 🆕 结构匹配模式名称映射（从旧API迁移）
export type StructureMatchMode = 'CardSubtree' | 'LeafContext' | 'TextExact';

/**
 * 将后端结构匹配模式转换为用户友好的中文名称
 * 
 * 使用场景:
 * - 策略选择器显示模式名称
 * - 推荐摘要生成
 * - 日志输出
 * 
 * @example
 * getModeDisplayName('CardSubtree') // => "卡片子树"
 */
export function getModeDisplayName(mode: StructureMatchMode | string): string {
  switch (mode) {
    case 'CardSubtree': return '卡片子树';
    case 'LeafContext': return '叶子上下文';
    case 'TextExact': return '文本精确';
    default: return mode;
  }
}

// 证据标签映射
const EVIDENCE_LABELS: Record<string, string> = {
  text_similarity: '文本相似度',
  semantic_anchor: '语义锚点', 
  hierarchical_loc: '层次定位',
  history_success: '历史成功率',
  element_stability: '元素稳定性',
  context_match: '上下文匹配',
  auto_chain: '智能链式分析',
};

export interface NormalizedEvidence {
  key: string;
  label: string;
  value: number;
  percent: number;
}

export function normalizeEvidence(evidence?: Evidence): NormalizedEvidence[] {
  if (!evidence || typeof evidence !== 'object') return [];
  
  const entries = Object.entries(evidence);
  if (entries.length === 0) return [];
  
  const total = entries.reduce((sum, [_, value]) => sum + (value || 0), 0);
  if (total === 0) return [];
  
  return entries
    .map(([key, value]) => ({
      key,
      label: EVIDENCE_LABELS[key] ?? key,
      value: value || 0,
      percent: (value || 0) / total
    }))
    .sort((a, b) => b.value - a.value); // 按贡献度降序
}