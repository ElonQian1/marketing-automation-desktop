import React from 'react';

export interface GridCanvasProps {
  zoom: number; // 0.5 - 2
  onZoomChange: (z: number) => void;
  highlightNodeId?: string;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({ zoom, onZoomChange, highlightNodeId }) => {
  return (
    <div className="pf-grid-canvas">
      <div className="pf-toolbar">
        <span className="pf-toolbar-label">缩放</span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        />
        <span className="pf-zoom-value">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="pf-grid-stage" style={{ transform: `scale(${zoom})` }}>
        {/* 画布占位内容 */}
        <div className="pf-grid-placeholder">
          画布预览区域（高亮节点：{highlightNodeId ?? '无'}）
        </div>
      </div>
    </div>
  );
};

export default GridCanvas;
