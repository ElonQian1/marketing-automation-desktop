// src/components/universal-ui/views/grid-view/utils.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { UiNode, AdvancedFilter, SearchOptions } from './types';
import { cleanXmlContent } from '../../xml-parser/cleanXml';
import { BoundsCalculator } from '../../../../shared/bounds/BoundsCalculator';

export function parseBounds(bounds?: string) {
  const info = BoundsCalculator.getBoundsInfo(bounds);
  if (!info) return null as any;
  return { x1: info.left, y1: info.top, x2: info.right, y2: info.bottom, w: info.width, h: info.height };
}

export function nodeLabel(n: UiNode) {
  const t = n.attrs['text']?.trim();
  if (t) return `"${t}"`;
  const id = n.attrs['resource-id']?.split('/').pop();
  if (id) return `#${id}`;
  const cd = n.attrs['content-desc'];
  if (cd) return `desc:${cd}`;
  return n.attrs['class'] || n.tag;
}

// buildXPath 已迁移到 src/utils/xpath/generation.ts
// 使用统一的 XPath 服务: import { buildXPath } from '../../../../utils/xpath';

export function parseUiAutomatorXml(xmlText: string): UiNode | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanXmlContent(xmlText), 'text/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error(err.textContent || 'XML 解析失败');

    function walk(el: Element, parent: UiNode | null): UiNode {
      const attrs: Record<string, string> = {};
      for (const a of Array.from(el.attributes)) {
        attrs[a.name] = a.value;
      }
      const node: UiNode = { tag: el.tagName, attrs, children: [], parent };
      node.children = Array.from(el.children).map(c => walk(c as Element, node));
      return node;
    }

    const rootEl = doc.documentElement;
    return walk(rootEl, null);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function attachParents(n: UiNode | null) {
  if (!n) return;
  const stack: UiNode[] = [n];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of cur.children) {
      c.parent = cur;
      stack.push(c);
    }
  }
}

export function matchNode(n: UiNode, kw: string, opts?: Partial<SearchOptions>): boolean {
  if (!kw) return true;
  const caseSensitive = !!opts?.caseSensitive;
  const useRegex = !!opts?.useRegex;
  const f = opts?.fields || {};
  const haystacks = [
    (f.id ?? true) ? n.attrs['resource-id'] : undefined,
    (f.text ?? true) ? n.attrs['text'] : undefined,
    (f.desc ?? true) ? n.attrs['content-desc'] : undefined,
    (f.className ?? true) ? n.attrs['class'] : undefined,
    (f.tag ?? true) ? n.tag : undefined,
    (f.pkg ?? false) ? n.attrs['package'] : undefined,
  ].filter(Boolean) as string[];

  if (useRegex) {
    try {
      const re = new RegExp(kw, caseSensitive ? 'g' : 'ig');
      return haystacks.some(s => re.test(s));
    } catch {
      // 回退到普通包含
    }
  }

  if (caseSensitive) {
    return haystacks.some(s => s.includes(kw));
  }
  const lower = kw.toLowerCase();
  return haystacks.some(s => s.toLowerCase().includes(lower));
}

export function matchNodeAdvanced(n: UiNode, filter: AdvancedFilter | null | undefined): boolean {
  if (!filter || !filter.enabled) return true;
  const rid = (filter.resourceId || '').toLowerCase();
  const txt = (filter.text || '').toLowerCase();
  const cls = (filter.className || '').toLowerCase();
  const pkg = (filter.packageName || '').toLowerCase();
  const clickable = filter.clickable; // boolean | null
  const nodeEnabled = filter.nodeEnabled; // boolean | null

  const checks: boolean[] = [];
  if (rid) checks.push((n.attrs['resource-id'] || '').toLowerCase().includes(rid));
  if (txt) {
    const t = (n.attrs['text'] || '').toLowerCase();
    const cd = (n.attrs['content-desc'] || '').toLowerCase();
    checks.push(t.includes(txt) || cd.includes(txt));
  }
  if (cls) checks.push((n.attrs['class'] || n.tag).toLowerCase().includes(cls));
  if (pkg) checks.push((n.attrs['package'] || '').toLowerCase().includes(pkg));
  if (clickable !== null && clickable !== undefined) checks.push(((n.attrs['clickable'] || '').toLowerCase() === 'true') === clickable);
  if (nodeEnabled !== null && nodeEnabled !== undefined) checks.push(((n.attrs['enabled'] || '').toLowerCase() === 'true') === nodeEnabled);

  if (checks.length === 0) return true; // 未填写任何条件则视为通过
  return filter.mode === 'AND' ? checks.every(Boolean) : checks.some(Boolean);
}

export function makeCombinedMatcher(keyword: string, adv: AdvancedFilter | null | undefined, opts?: Partial<SearchOptions>) {
  const kw = (keyword || '').trim();
  return (n: UiNode) => {
    const kwOk = !kw || matchNode(n, kw, opts);
    const advOk = matchNodeAdvanced(n, adv);
    return kwOk && advOk;
  };
}

export function findByXPathRoot(root: UiNode | null, xp: string): UiNode | null {
  if (!root || !xp) return null;
  const parts = xp.split('/').filter(Boolean);
  let cur: UiNode | null = root;
  for (const seg of parts) {
    const m = seg.match(/^(\w+)(?:\[(\d+)\])?$/);
    if (!m) return null;
    const tag = m[1];
    const idx = m[2] ? parseInt(m[2], 10) : 1;
    if (!cur) return null;
    const siblings = cur.children.filter(c => c.tag === tag);
    const next = siblings[idx - 1] || null;
    cur = next;
    if (!cur) return null;
  }
  return cur;
}

export function findByPredicateXPath(root: UiNode | null, xp: string): UiNode | null {
  if (!root) return null;
  // 支持：
  // 1) //*[@attr='val'] 绝对等值
  // 2) //tag[@attr="val"] 指定标签等值
  // 3) //tag[contains(@attr,'val')] 包含匹配
  // 4) //tag[text()='val'] 文本等值
  // 5) //*[contains(text(),'val')] 文本包含
  const equalRe = /^\/\/(\*|[A-Za-z_][\w.-]*)(?:\[@([\w:-]+)=(['"])((?:\\.|[^\\])*?)\3\])?$/;
  const containsAttrRe = /^\/\/(\*|[A-Za-z_][\w.-]*)\[contains\(@([\w:-]+),(['"])((?:\\.|[^\\])*?)\3\)\]$/;
  const textEqualRe = /^\/\/(\*|[A-Za-z_][\w.-]*)\[text\(\)=(['"])((?:\\.|[^\\])*?)\2\]$/;
  const textContainsRe = /^\/\/(\*|[A-Za-z_][\w.-]*)\[contains\(text\(\),(['"])((?:\\.|[^\\])*?)\2\)\]$/;

  let mode: 'equal' | 'containsAttr' | 'textEqual' | 'textContains' | null = null;
  let tag = '*';
  let attr: string | null = null;
  let val: string | null = null;

  let m: RegExpMatchArray | null = null;
  if ((m = xp.match(equalRe))) {
    mode = 'equal';
    tag = m[1];
    attr = m[2] || null;
    val = (m[4] ?? null) as any;
  } else if ((m = xp.match(containsAttrRe))) {
    mode = 'containsAttr';
    tag = m[1];
    attr = m[2];
    val = m[4];
  } else if ((m = xp.match(textEqualRe))) {
    mode = 'textEqual';
    tag = m[1];
    val = m[3];
  } else if ((m = xp.match(textContainsRe))) {
    mode = 'textContains';
    tag = m[1];
    val = m[3];
  } else {
    return null;
  }

  const stk: UiNode[] = [root];
  const cand: UiNode[] = [];
  const lowerVal = (val || '').toLowerCase();

  while (stk.length) {
    const n = stk.pop()!;
    const tagOk = tag === '*' || n.tag === tag;
    let predOk = true;
    if (mode === 'equal' && attr) {
      predOk = (n.attrs[attr] ?? '') === (val ?? '');
    } else if (mode === 'containsAttr' && attr) {
      predOk = (n.attrs[attr] ?? '').toLowerCase().includes(lowerVal);
    } else if (mode === 'textEqual') {
      predOk = (n.attrs['text'] ?? '') === (val ?? '');
    } else if (mode === 'textContains') {
      predOk = (n.attrs['text'] ?? '').toLowerCase().includes(lowerVal);
    }
    if (tagOk && predOk) cand.push(n);
    for (let i = n.children.length - 1; i >= 0; i--) stk.push(n.children[i]);
  }
  return cand[0] ?? null;
}

export function findAllByPredicateXPath(root: UiNode | null, xp: string): UiNode[] {
  if (!root) return [];
  const equalRe = /^\/\/(\*|[A-Za-z_][\w.-]*)(?:\[@([\w:-]+)=(['\"])((?:\\.|[^\\])*?)\3\])?$/;
  const containsAttrRe = /^\/\/(\*|[A-Za-z_][\w.-]*)\[contains\(@([\w:-]+),(['\"])((?:\\.|[^\\])*?)\3\)\]$/;
  const textEqualRe = /^\/\/(\*|[A-Za-z_][\w.-]*)\[text\(\)=(['\"])((?:\\.|[^\\])*?)\2\]$/;
  const textContainsRe = /^\/\/(\*|[A-Za-z_][\w.-]*)\[contains\(text\(\),(['\"])((?:\\.|[^\\])*?)\2\)\]$/;

  type Mode = 'equal' | 'containsAttr' | 'textEqual' | 'textContains';
  let mode: Mode | null = null;
  let tag = '*';
  let attr: string | null = null;
  let val: string | null = null;
  let m: RegExpMatchArray | null = null;
  if ((m = xp.match(equalRe))) {
    mode = 'equal'; tag = m[1]; attr = m[2] || null; val = (m[4] ?? null) as any;
  } else if ((m = xp.match(containsAttrRe))) {
    mode = 'containsAttr'; tag = m[1]; attr = m[2]; val = m[4];
  } else if ((m = xp.match(textEqualRe))) {
    mode = 'textEqual'; tag = m[1]; val = m[3];
  } else if ((m = xp.match(textContainsRe))) {
    mode = 'textContains'; tag = m[1]; val = m[3];
  } else {
    return [];
  }

  const stk: UiNode[] = [root];
  const res: UiNode[] = [];
  const lowerVal = (val || '').toLowerCase();
  while (stk.length) {
    const n = stk.pop()!;
    const tagOk = tag === '*' || n.tag === tag;
    let predOk = true;
    if (mode === 'equal' && attr) predOk = (n.attrs[attr] ?? '') === (val ?? '');
    else if (mode === 'containsAttr' && attr) predOk = (n.attrs[attr] ?? '').toLowerCase().includes(lowerVal);
    else if (mode === 'textEqual') predOk = (n.attrs['text'] ?? '') === (val ?? '');
    else if (mode === 'textContains') predOk = (n.attrs['text'] ?? '').toLowerCase().includes(lowerVal);
    if (tagOk && predOk) res.push(n);
    for (let i = n.children.length - 1; i >= 0; i--) stk.push(n.children[i]);
  }
  return res;
}

export function findNearestClickableAncestor(n: UiNode | null | undefined): UiNode | null {
  let cur = n || null;
  while (cur) {
    if ((cur.attrs['clickable'] || '').toLowerCase() === 'true') return cur;
    cur = cur.parent || null;
  }
  return null;
}

// 🆕 根据 NodeLocator 的属性从候选集中挑选最匹配的节点
import type { NodeLocator } from '../../../../domain/inspector/entities/NodeLocator';
export function pickByAttributes(candidates: UiNode[] | null | undefined, locator?: NodeLocator | null): UiNode | null {
  if (!candidates || candidates.length === 0 || !locator) return null;
  const attrs = locator.attributes || {} as any;
  const wantedBounds = locator.bounds;
  const scoreNode = (n: UiNode): number => {
    let s = 0;
    // resource-id 严格优先：完全匹配加高分；后缀匹配次之
    const rid = attrs.resourceId?.trim();
    const nid = (n.attrs['resource-id'] || '').trim();
    if (rid) {
      if (nid === rid) s += 100;
      else if (nid.endsWith(rid) || nid.split('/').pop() === rid) s += 70;
    }
    // text
    const t = attrs.text?.trim();
    const nt = (n.attrs['text'] || '').trim();
    if (t) {
      if (nt === t) s += 40;
      else if (nt.includes(t)) s += 20;
    }
    // content-desc
    const cd = attrs.contentDesc?.trim();
    const ncd = (n.attrs['content-desc'] || '').trim();
    if (cd) {
      if (ncd === cd) s += 30;
      else if (ncd.includes(cd)) s += 15;
    }
    // className
    const cls = attrs.className?.trim();
    const ncls = (n.attrs['class'] || '').trim();
    if (cls) {
      if (ncls === cls) s += 25;
      else if (ncls.endsWith(cls) || ncls.split('.').pop() === cls) s += 10;
    }
    // bounds 精确匹配
    if (wantedBounds) {
      if ((n.attrs['bounds'] || '') === wantedBounds) s += 60;
    }
    return s;
  };
  let best: UiNode | null = null;
  let bestScore = -1;
  for (const n of candidates) {
    const sc = scoreNode(n);
    if (sc > bestScore) {
      bestScore = sc;
      best = n;
    }
  }
  return bestScore > 0 ? best : null;
}
