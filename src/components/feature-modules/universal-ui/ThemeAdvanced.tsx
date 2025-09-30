/**
 * 高级主题功能组件 - 重构版本
 * 整合各个子组件，保持文件小于500行
 */

import React, { useState } from 'react';
import { 
  Card, 
  Space, 
  Typography, 
  Tabs,
  Row,
  Col,
} from 'antd';
import { 
  BgColorsOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

// 导入拆分后的子组件
import {
  ThemeColorPicker,
  ThemePresetSelector,
  ThemeAnimationSettings,
  type ThemePreset,
} from './theme-advanced';

import { useThemeManager } from '../theme-system';

const { Title } = Typography;

/**
 * 高级主题功能主组件
 */
export const ThemeAdvanced: React.FC = () => {
  const themeManager = useThemeManager();
  const [activeTab, setActiveTab] = useState('colors');
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);

  const handleColorChange = (colorType: string, color: string) => {
    console.log(`${colorType} color changed to:`, color);
    // 这里可以添加实际的颜色应用逻辑
  };

  const handlePresetSelect = (preset: ThemePreset) => {
    console.log('Preset selected:', preset);
    // 这里可以添加预设应用逻辑
  };

  const handlePresetSave = (preset: ThemePreset) => {
    setCustomPresets(prev => [...prev, { ...preset, id: `custom-${Date.now()}` }]);
    console.log('Preset saved:', preset);
  };

  const handleAnimationChange = (settings: any) => {
    console.log('Animation settings changed:', settings);
    // 这里可以添加动画设置应用逻辑
  };

  const tabItems = [
    {
      key: 'colors',
      label: (
        <span>
          <BgColorsOutlined />
          颜色配置
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <ThemeColorPicker
                label="主色调"
                value="#1677ff"
                onChange={(color) => handleColorChange('primary', color)}
              />
            </Col>
            <Col xs={24} md={12}>
              <ThemeColorPicker
                label="成功色"
                value="#52c41a"
                onChange={(color) => handleColorChange('success', color)}
              />
            </Col>
            <Col xs={24} md={12}>
              <ThemeColorPicker
                label="警告色"
                value="#faad14"
                onChange={(color) => handleColorChange('warning', color)}
              />
            </Col>
            <Col xs={24} md={12}>
              <ThemeColorPicker
                label="错误色"
                value="#ff4d4f"
                onChange={(color) => handleColorChange('error', color)}
              />
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: 'presets',
      label: (
        <span>
          <SettingOutlined />
          主题预设
        </span>
      ),
      children: (
        <ThemePresetSelector
          presets={customPresets}
          onPresetSelect={handlePresetSelect}
          onPresetSave={handlePresetSave}
          allowCustom={true}
        />
      ),
    },
    {
      key: 'animation',
      label: (
        <span>
          <ThunderboltOutlined />
          动画设置
        </span>
      ),
      children: (
        <ThemeAnimationSettings
          onAnimationChange={handleAnimationChange}
        />
      ),
    },
  ];

  return (
    <Card title="高级主题配置" style={{ marginBottom: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            自定义主题外观
          </Title>
          <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            配置颜色、预设和动画，打造个性化的界面体验
          </Typography.Paragraph>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Space>
    </Card>
  );
};

export default ThemeAdvanced;