/**
 * Shared sorting helpers for UI/Visual element lists.
 * Goal: move items with unknown/unnamed/generic labels to the end, keep others stable.
 */

/** Detects if a label should be considered "unknown" or generic placeholder. */
export function isUnknownLabel(label: string | undefined | null): boolean {
  if (!label) return true;
  const trimmed = String(label).trim();
  if (!trimmed) return true;
  const hasUnknownWord = trimmed.includes('未知') || trimmed.includes('未命名');
  const isGeneric = /^元素\s+\d+$/i.test(trimmed);
  return hasUnknownWord || isGeneric;
}

/**
 * Stable sort: place unknown-labeled items after known ones, preserving original order within groups.
 * @param items Input array
 * @param getLabel Function to get label per item (receives item and original index)
 */
export function sortUnknownLastStable<T>(items: readonly T[], getLabel: (item: T, index: number) => string): T[] {
  const enriched = items.map((item, i) => ({ item, i, label: getLabel(item, i) }));
  enriched.sort((a, b) => {
    const aU = isUnknownLabel(a.label);
    const bU = isUnknownLabel(b.label);
    if (aU === bU) return a.i - b.i; // stable within the same group
    return aU ? 1 : -1; // unknown goes last
  });
  return enriched.map(x => x.item);
}

/**
 * Generic stable sort combining an optional semantic score and the unknown-last strategy.
 * - When prioritizeSemantic=true, higher score goes first.
 * - Items with unknown/generic labels are moved after known ones.
 * - Stability preserved within groups by original index.
 */
export function sortByScoreThenUnknownLastStable<T>(
  items: readonly T[],
  getScore: (item: T, index: number) => number,
  getLabel: (item: T, index: number) => string,
  prioritizeSemantic: boolean = true
): T[] {
  const enriched = items.map((item, i) => ({ item, i, score: getScore(item, i), label: getLabel(item, i) }));
  enriched.sort((a, b) => {
    if (prioritizeSemantic) {
      if (a.score !== b.score) return b.score - a.score; // high score first
    }
    const aU = isUnknownLabel(a.label);
    const bU = isUnknownLabel(b.label);
    if (aU !== bU) return aU ? 1 : -1; // unknown goes last
    return a.i - b.i; // stable within same group
  });
  return enriched.map(x => x.item);
}
