// src/pages/SmartScriptBuilderPage/components/step-edit-modal/components/ThemeControlSection.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Space, Typography, theme } from 'antd';
import { OverlayThemeSwitch } from '../../../../../components/ui/overlay';
import type { ThemeControlSectionProps } from '../types';

const { Text } = Typography;

/**
 * 主题控制部分
 * 提供模态框主题切换功能
 */
export const ThemeControlSection: React.FC<ThemeControlSectionProps> = ({
  theme: overlayTheme,
  setTheme,
}) => {
  const { token } = theme.useToken();

  return (
    <Space 
      align="center" 
      style={{ 
        marginBottom: token.marginSM,
        padding: `${token.paddingXS}px 0`
      }}
    >
      <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
        模态框主题：
      </Text>
      <OverlayThemeSwitch 
        value={overlayTheme} 
        onChange={setTheme} 
      />
    </Space>
  );
};