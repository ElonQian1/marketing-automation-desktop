// src/components/common/PlatformSelector.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Select, Typography } from 'antd';
import type { Platform } from '../../types';
import { PLATFORMS } from '../../constants';

const { Text } = Typography;

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  availablePlatforms?: Platform[];
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 平台选择器组件 - 使用原生 Ant Design Select
 * 统一的平台选择UI，支持下拉菜单形式
 */
export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onPlatformChange,
  availablePlatforms = ['xiaohongshu', 'douyin'],
  disabled = false,
  className,
  style,
}) => {
  const options = availablePlatforms.map((platform) => {
    const config = PLATFORMS[platform];
    return {
      label: `${config.icon} ${config.name}`,
      value: platform,
    };
  });

  return (
    <div className={className} style={style}>
      <Text
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: 8,
        }}
      >
        选择平台
      </Text>
      <Select
        value={selectedPlatform}
        onChange={onPlatformChange}
        disabled={disabled}
        options={options}
        style={{ width: '100%' }}
        placeholder="请选择平台"
      />
    </div>
  );
};

