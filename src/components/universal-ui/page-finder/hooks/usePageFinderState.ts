// src/components/universal-ui/page-finder/hooks/usePageFinderState.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import { useMemo, useState } from 'react';

interface TreeNodeLite {
  id: string;
  label: string;
  children?: TreeNodeLite[];
}

export function usePageFinderState() {
  const [query, setQuery] = useState('');
  const tree = useMemo<TreeNodeLite[]>(() => ([
    { id: 'root', label: 'Root', children: [
      { id: 'n-1', label: 'Header' },
      { id: 'n-2', label: 'Content', children: [
        { id: 'n-2-1', label: 'Card' },
        { id: 'n-2-2', label: 'List' },
      ]},
      { id: 'n-3', label: 'Footer' },
    ]},
  ]), []);

  const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
  const [zoom, setZoom] = useState(1);

  const findNode = (id?: string): { id: string; label: string } | null => {
    if (!id) return null;
    const stack: TreeNodeLite[] = [...tree];
    while (stack.length) {
      const top = stack.pop()!;
      if (top.id === id) return { id: top.id, label: top.label };
      if (top.children) stack.push(...top.children);
    }
    return null;
  };

  const applyStrategy = (strategy: 'standard' | 'strict' | 'relaxed' | 'absolute' | 'positionless') => {
    // 仅占位：后续通过 useAdb() 应用策略
    console.log('[PageFinder] apply strategy:', strategy, 'on', activeNodeId);
  };

  return {
    tree,
    query,
    setQuery,
    activeNodeId,
    selectNode: setActiveNodeId,
    activeNode: findNode(activeNodeId),
    zoom,
    setZoom,
    applyStrategy,
  };
}
