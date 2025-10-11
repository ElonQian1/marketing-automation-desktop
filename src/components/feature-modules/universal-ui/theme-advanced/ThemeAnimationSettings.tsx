// src/components/feature-modules/universal-ui/theme-advanced/ThemeAnimationSettings.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 主题动画设置组件
 */

import React from 'react';
import { Card, Space, Switch, Slider, Typography, Divider } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useThemeManager } from '../../theme-system';

const { Title, Text } = Typography;

export interface ThemeAnimationSettingsProps {
  onAnimationChange?: (settings: {
    enabled: boolean;
    duration: number;
    easing: string;
    enableDarkModeTransition: boolean;
  }) => void;
}

export const ThemeAnimationSettings: React.FC<ThemeAnimationSettingsProps> = ({
  onAnimationChange,
}) => {
  const themeManager = useThemeManager();

  const animationSettings = {
    enabled: true,
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enableDarkModeTransition: true,
  };

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...animationSettings, [key]: value };
    onAnimationChange?.(newSettings);
  };

  const easingOptions = [
    { label: '线性', value: 'linear' },
    { label: '缓入', value: 'ease-in' },
    { label: '缓出', value: 'ease-out' },
    { label: '缓入缓出', value: 'ease-in-out' },
    { label: '自定义', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  ];

  return (
    <Card 
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#faad14' }} />
          动画设置
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>启用动画效果</Text>
          <Switch
            checked={animationSettings.enabled}
            onChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ opacity: animationSettings.enabled ? 1 : 0.5 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>动画持续时间</Text>
              <div style={{ padding: '8px 0' }}>
                <Slider
                  min={100}
                  max={1000}
                  step={50}
                  value={animationSettings.duration}
                  onChange={(value) => handleSettingChange('duration', value)}
                  tooltip={{ formatter: (value) => `${value}ms` }}
                  disabled={!animationSettings.enabled}
                  marks={{
                    100: '100ms',
                    300: '300ms',
                    500: '500ms',
                    1000: '1s',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>主题切换过渡</Text>
              <Switch
                checked={animationSettings.enableDarkModeTransition}
                onChange={(checked) => handleSettingChange('enableDarkModeTransition', checked)}
                disabled={!animationSettings.enabled}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <Space direction="vertical">
                  <span>• 动画效果可以提升用户体验</span>
                  <span>• 较慢的设备建议减少动画时长</span>
                  <span>• 主题切换过渡提供平滑的视觉效果</span>
                </Space>
              </Text>
            </div>
          </Space>
        </div>
      </Space>
    </Card>
  );
};