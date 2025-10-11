// src/pages/ThemeSettingsPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 主题设置页面
 * 提供完整的主题配置和预览功能
 */

import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Space, 
  Typography, 
  Divider,
  Button,
  message,
} from 'antd';
import { 
  SettingOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { 
  ThemeSwitcher, 
  ThemePreview, 
  ThemeComparison, 
  ThemeConfigPanel,
  useThemeState,
  useThemeActions,
} from '../components/feature-modules/theme-system';

const { Title, Paragraph, Text } = Typography;

/**
 * 主题设置页面组件
 */
export const ThemeSettingsPage: React.FC = () => {
  const { mode, isTransitioning } = useThemeState();
  const { resetConfig, followSystemTheme } = useThemeActions();
  const [activeTab, setActiveTab] = useState<'switcher' | 'preview' | 'config' | 'comparison'>('switcher');

  const handleResetTheme = () => {
    resetConfig();
    message.success('主题配置已重置为默认设置');
  };

  const handleFollowSystem = () => {
    followSystemTheme();
    message.success('已切换到跟随系统主题模式');
  };

  const tabItems = [
    { key: 'switcher', label: '主题切换', icon: <SettingOutlined /> },
    { key: 'preview', label: '主题预览', icon: <EyeOutlined /> },
    { key: 'config', label: '高级配置', icon: <SettingOutlined /> },
    { key: 'comparison', label: '对比预览', icon: <EyeOutlined /> },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          🎨 主题设置
        </Title>
        <Paragraph type="secondary">
          自定义应用程序的外观主题，基于原生 Ant Design 5 暗黑模式设计
        </Paragraph>
      </div>

      {/* 当前主题状态 */}
      <Card 
        size="small" 
        style={{ marginBottom: '24px' }}
        title={
          <Space>
            <span>当前主题状态</span>
            {isTransitioning && <SyncOutlined spin />}
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Text strong>主题模式：</Text>
            <br />
            <Text type={mode === 'dark' ? 'success' : 'warning'}>
              {mode === 'dark' ? '🌙 暗色模式' : '☀️ 亮色模式'}
            </Text>
          </Col>
          <Col span={6}>
            <Text strong>状态：</Text>
            <br />
            <Text type={isTransitioning ? 'warning' : 'success'}>
              {isTransitioning ? '切换中...' : '就绪'}
            </Text>
          </Col>
          <Col span={12}>
            <Space>
              <Button 
                size="small" 
                onClick={handleFollowSystem}
                icon={<SyncOutlined />}
              >
                跟随系统
              </Button>
              <Button 
                size="small" 
                onClick={handleResetTheme}
                icon={<DownloadOutlined />}
              >
                重置主题
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 标签导航 */}
      <Card size="small" style={{ marginBottom: '24px' }}>
        <Space wrap>
          {tabItems.map(item => (
            <Button
              key={item.key}
              type={activeTab === item.key ? 'primary' : 'default'}
              icon={item.icon}
              onClick={() => setActiveTab(item.key as any)}
            >
              {item.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* 内容区域 */}
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'switcher' && (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="快速切换" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>开关样式：</Text>
                    <br />
                    <ThemeSwitcher variant="switch" showLabel={true} />
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>按钮样式：</Text>
                    <br />
                    <ThemeSwitcher variant="button" showLabel={true} />
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>下拉菜单：</Text>
                    <br />
                    <ThemeSwitcher variant="dropdown" />
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>图标按钮：</Text>
                    <br />
                    <ThemeSwitcher variant="icon" />
                  </div>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="使用说明" size="small">
                <Space direction="vertical">
                  <Text>• <strong>开关样式</strong>：经典的开关切换器，适合设置页面</Text>
                  <Text>• <strong>按钮样式</strong>：简洁的按钮形式，适合工具栏</Text>
                  <Text>• <strong>下拉菜单</strong>：包含系统跟随选项的完整菜单</Text>
                  <Text>• <strong>图标按钮</strong>：最小化的图标按钮，适合空间受限场景</Text>
                  
                  <Divider />
                  
                  <Text type="secondary">
                    所有切换器都支持：
                  </Text>
                  <Text>• 自动检测系统主题偏好</Text>
                  <Text>• 平滑的切换动画效果</Text>
                  <Text>• 本地存储记忆用户选择</Text>
                  <Text>• 实时同步到全局主题状态</Text>
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        {activeTab === 'preview' && (
          <ThemePreview showSwitcher={true} />
        )}

        {activeTab === 'config' && (
          <ThemeConfigPanel showAdvanced={true} />
        )}

        {activeTab === 'comparison' && (
          <div>
            <Title level={4} style={{ marginBottom: '16px' }}>
              主题对比预览
            </Title>
            <Paragraph type="secondary">
              并排对比亮色和暗色主题的视觉效果
            </Paragraph>
            <ThemeComparison />
          </div>
        )}
      </div>
    </div>
  );
};