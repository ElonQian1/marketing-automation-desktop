import React from 'react';

export interface SimpleNodeInfo {
  id: string;
  label: string;
  className?: string;
  text?: string;
}

export interface NodeDetailPanelProps {
  node?: SimpleNodeInfo | null;
  onApplyStrategy: (strategy: 'standard' | 'strict' | 'relaxed' | 'absolute' | 'positionless') => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onApplyStrategy }) => {
  return (
    <div className="pf-detail-panel">
      <h3 className="pf-detail-title">节点详情</h3>
      {!node ? (
        <div className="pf-empty">未选择节点</div>
      ) : (
        <div className="pf-node-preview">
          <div><strong>ID:</strong> {node.id}</div>
          <div><strong>Label:</strong> {node.label}</div>
          {node.className && <div><strong>Class:</strong> {node.className}</div>}
          {node.text && <div><strong>Text:</strong> {node.text}</div>}
        </div>
      )}

      <div className="pf-strategy">
        <div className="pf-section-title">匹配策略</div>
        <div className="pf-strategy-grid">
          {(['standard','strict','relaxed','absolute','positionless'] as const).map(s => (
            <button key={s} className="pf-btn" onClick={() => onApplyStrategy(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailPanel;
