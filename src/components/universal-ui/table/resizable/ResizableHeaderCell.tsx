import React from 'react';

interface Props {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onResizeStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
}

const ResizableHeaderCell: React.FC<Props> = ({ width, minWidth = 60, maxWidth = 600, onResizeStart, children }) => {
  return (
    <div style={{ position: 'relative', width, minWidth, maxWidth, display: 'flex', alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <div
        onPointerDown={onResizeStart}
        role="separator"
        aria-orientation="vertical"
        style={{
          position: 'absolute',
          top: 0,
          right: -4,
          width: 8,
          height: '100%',
          cursor: 'col-resize',
          touchAction: 'none',
          userSelect: 'none',
        }}
        title="拖拽调整列宽"
      />
    </div>
  );
};

export default ResizableHeaderCell;
