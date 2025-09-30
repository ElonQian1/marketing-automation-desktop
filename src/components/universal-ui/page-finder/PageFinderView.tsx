import React from 'react';
import { usePageFinderState } from './hooks/usePageFinderState.ts';
import { SidebarTree } from './components/SidebarTree.tsx';
import { GridCanvas } from './components/GridCanvas.tsx';
import { NodeDetailPanel } from './components/NodeDetailPanel.tsx';
import './styles/index.css';

/**
 * PageFinderView
 * 三栏布局：左树（层级/筛选）+ 中央网格（画布/预览）+ 右详情（匹配策略/字段预览）
 * 仅布局与占位，不引入 ADB 数据；后续通过 props 或应用层接入。
 */
export const PageFinderView: React.FC = () => {
  const state = usePageFinderState();

  return (
    <div className="pf-wrapper">
      <aside className="pf-sidebar card-hover">
        <SidebarTree
          nodes={state.tree}
          activeNodeId={state.activeNodeId}
          onSelect={state.selectNode}
          onSearch={state.setQuery}
          query={state.query}
        />
      </aside>

      <section className="pf-canvas card-hover">
        <GridCanvas
          zoom={state.zoom}
          onZoomChange={state.setZoom}
          highlightNodeId={state.activeNodeId}
        />
      </section>

      <aside className="pf-detail card-hover">
        <NodeDetailPanel
          node={state.activeNode}
          onApplyStrategy={state.applyStrategy}
        />
      </aside>
    </div>
  );
};

export default PageFinderView;
