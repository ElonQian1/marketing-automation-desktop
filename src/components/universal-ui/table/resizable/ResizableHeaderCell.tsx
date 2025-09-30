import React from 'react';

type ThProps = React.ThHTMLAttributes<HTMLTableCellElement>;

interface Props extends ThProps {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onResizeStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const ResizableHeaderCell: React.FC<Props> = ({ width, minWidth = 60, maxWidth = 600, onResizeStart, children, style, ...rest }) => {
  const mergedStyle: React.CSSProperties = {
    position: 'relative',
    width,
    minWidth,
    maxWidth,
    ...style,
  };
  return (
    <th {...rest} style={mergedStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
    </th>
  );
};

export default ResizableHeaderCell;
