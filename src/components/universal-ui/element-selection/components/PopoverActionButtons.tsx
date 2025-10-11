// src/components/universal-ui/element-selection/components/PopoverActionButtons.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Space, Button, Row, Col } from 'antd';
import { CheckOutlined, EyeInvisibleOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { PopoverActionTokens, defaultPopoverActionTokens } from './tokens';

export interface PopoverActionButtonsProps {
  onConfirm: (e?: React.MouseEvent) => void;
  onDiscovery?: (e?: React.MouseEvent) => void;
  onHide?: (e?: React.MouseEvent) => void;
  onCancel: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  tokens?: Partial<PopoverActionTokens>;
  compact?: boolean;      // 强制紧凑
  autoCompact?: boolean;  // 根据屏幕宽度自动紧凑
}

const useIsNarrow = (enabled?: boolean) => {
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) return;
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setNarrow(!!e.matches);
    onChange(mq as any);
    mq.addEventListener?.('change', onChange as any);
    return () => mq.removeEventListener?.('change', onChange as any);
  }, [enabled]);
  return narrow;
};

/**
 * Modular action button row for ElementSelectionPopover
 * - Order: 确定 / 发现元素 / 隐藏 / 取消
 * - Cancel uses ghost style with Close icon to emphasize close semantics
 * - Supports tokens for spacing/size and responsive compact grid
 */
export const PopoverActionButtons: React.FC<PopoverActionButtonsProps> = ({
  onConfirm,
  onDiscovery,
  onHide,
  onCancel,
  disabled = false,
  tokens,
  compact,
  autoCompact,
}) => {
  const t = { ...defaultPopoverActionTokens, ...(tokens || {}) };
  const isNarrow = useIsNarrow(autoCompact);
  const useCompact = compact || isNarrow;

  // 统一样式
  const btnStyle: React.CSSProperties = {
    fontSize: t.fontSize,
    minWidth: t.buttonMinWidth,
  };

  if (!useCompact) {
    return (
      <Space size={t.gap} wrap={t.rowWrap}>
        <Button type="primary" size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
          确定
        </Button>
        {onDiscovery && (
          <Button size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
            发现元素
          </Button>
        )}
        {onHide && (
          <Button size="small" icon={<EyeInvisibleOutlined />} onClick={onHide} style={btnStyle} disabled={disabled}>
            隐藏
          </Button>
        )}
        <Button size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
          取消
        </Button>
      </Space>
    );
  }

  // 紧凑布局：两列栅格，自动换行
  return (
    <Row gutter={[t.gap, t.gap]} style={{ width: 240 }}>
      <Col span={12}>
        <Button block type="primary" size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
          确定
        </Button>
      </Col>
      <Col span={12}>
        {onDiscovery && (
          <Button block size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
            发现元素
          </Button>
        )}
      </Col>
      <Col span={12}>
        {onHide && (
          <Button block size="small" icon={<EyeInvisibleOutlined />} onClick={onHide} style={btnStyle} disabled={disabled}>
            隐藏
          </Button>
        )}
      </Col>
      <Col span={12}>
        <Button block size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
          取消
        </Button>
      </Col>
    </Row>
  );
};

export default PopoverActionButtons;
