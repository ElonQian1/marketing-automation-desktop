// 🚫 已废弃：buildXPath 已迁移到统一的 XPath 服务
// ✅ 新的使用方式: import { buildXPath } from '../../../utils/xpath';
//
// 保留此文件作为迁移说明，后续版本中将完全移除

import type { UiNode } from '../../../components/universal-ui/views/grid-view/types';

/**
 * @deprecated 使用 import { buildXPath } from '../../../utils/xpath' 替代
 */
export function buildXPath(n: UiNode | null | undefined): string {
  console.warn('⚠️ buildXPath from domain/inspector/utils/xpath.ts is deprecated. Use utils/xpath instead.');
  
  // 临时兼容实现，将在下个版本移除
  if (!n) return '';
  const parts: string[] = [];
  let cur: UiNode | null | undefined = n;
  while (cur) {
    let idx = 1;
    if (cur.parent) {
      const siblings = cur.parent.children.filter(c => c.tag === cur!.tag);
      const meIndex = siblings.indexOf(cur) + 1;
      idx = meIndex > 0 ? meIndex : 1;
    }
    parts.unshift(`${cur.tag}[${idx}]`);
    cur = cur.parent;
  }
  return '/' + parts.join('/');
}
