/**
 * GridElementView 树形视图组件
 * 包装现有的树形视图组件
 */

import React from 'react';
import { UiNode } from '../types';
import { TreeRow } from '../TreeRow';
import { AdvancedFilterSummary } from '../AdvancedFilterSummary';
import { MatchCountSummary } from '../MatchCountSummary';
import { Breadcrumbs } from '../Breadcrumbs';
import styles from '../GridElementView.module.css';

interface TreeViewProps {
  root: UiNode | null;
  selected: UiNode | null;
  onSelect: (node: UiNode | null) => void;
  expandAll: boolean;
  collapseVersion: number;
  expandDepth: number;
  showMatchedOnly: boolean;
  matchedSet: Set<UiNode>;
  selectedAncestors: UiNode[];
  onHoverNode: (node: UiNode | null) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  root,
  selected,
  onSelect,
  expandAll,
  collapseVersion,
  expandDepth,
  showMatchedOnly,
  matchedSet,
  selectedAncestors,
  onHoverNode,
}) => {
  if (!root) {
    return (
      <div className={`${styles.leftPanel} p-4 text-gray-500`}>
        未解析 XML 或解析失败
      </div>
    );
  }

  const renderNode = (node: UiNode, depth = 0): React.ReactNode => {
    return (
      <TreeRow
        key={`${node.id}-${collapseVersion}`}
        node={node}
        depth={depth}
        expandAll={expandAll}
        collapseVersion={collapseVersion}
        expandDepth={expandDepth}
        showMatchedOnly={showMatchedOnly}
        matchedSet={matchedSet}
        selectedAncestors={selectedAncestors}
        selected={selected}
        onSelect={onSelect}
        onHover={onHoverNode}
      />
    );
  };

  return (
    <div className={`${styles.leftPanel} flex flex-col h-full`}>
      <div className="p-2 border-b">
        <MatchCountSummary matchedSet={matchedSet} />
        <AdvancedFilterSummary />
        <Breadcrumbs selected={selected} onSelect={onSelect} />
      </div>
      <div className="flex-1 overflow-auto">
        {renderNode(root)}
      </div>
    </div>
  );
};