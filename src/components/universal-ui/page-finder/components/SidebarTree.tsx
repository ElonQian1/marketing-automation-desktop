import React from 'react';

export interface TreeNodeLite {
  id: string;
  label: string;
  children?: TreeNodeLite[];
}

export interface SidebarTreeProps {
  nodes: TreeNodeLite[];
  activeNodeId?: string;
  query: string;
  onSearch: (q: string) => void;
  onSelect: (id: string) => void;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({ nodes, activeNodeId, query, onSearch, onSelect }) => {
  const renderNode = (node: TreeNodeLite) => (
    <li key={node.id}>
      <button
        className={`pf-tree-item ${activeNodeId === node.id ? 'active' : ''}`}
        onClick={() => onSelect(node.id)}
        title={node.label}
      >
        {node.label}
      </button>
      {node.children && node.children.length > 0 && (
        <ul className="pf-tree-children">
          {node.children.map(renderNode)}
        </ul>
      )}
    </li>
  );

  return (
    <div className="pf-tree">
      <div className="pf-tree-search">
        <input
          className="pf-input"
          placeholder="搜索节点..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <ul className="pf-tree-root">
        {nodes.map(renderNode)}
      </ul>
    </div>
  );
};

export default SidebarTree;
