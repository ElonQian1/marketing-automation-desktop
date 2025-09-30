/**
 * 主题增强系统演示页面
 * 展示所有主题感知组件的使用效果
 */

import React, { useState } from 'react';
import { Space, Button, Card, Row, Col, Divider, Typography, Alert } from 'antd';
import { 
  DashboardOutlined, 
  ExperimentOutlined, 
  BgColorsOutlined,
  SettingOutlined,
  AndroidOutlined,
  PhoneOutlined,
  UserOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import {
  ThemeAwarePageContainer,
  ThemeAwareStatCard,
  ThemeAwareProgressCard,
  ThemeAwareUserCard,
  ThemeAwareFeatureCard,
  ThemeAwareEmpty,
  ThemeAwareGridLayout,
  ThemeAwareCardGrid,
  ThemeAwareDeviceCard,
  ThemeAwareSessionTable,
  ThemeColorPicker,
  ThemePresetSelector,
  ThemeAnimationSettings,
  type ImportSession,
  type ThemePreset,
} from '../components/feature-modules/universal-ui';
import { useThemeManager } from '../components/feature-modules/theme-system';

const { Title, Text, Paragraph } = Typography;

/**
 * 主题增强演示页面
 */
export const ThemeEnhancementDemo: React.FC = () => {
  const themeManager = useThemeManager();
  const isDark = themeManager.mode === 'dark';
  const [selectedColor, setSelectedColor] = useState('#1677ff');
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [animationSettings, setAnimationSettings] = useState({
    enableTransitions: true,
    transitionDuration: 300,
    enableHoverEffects: true,
    enableLoadingAnimations: true,
    reducedMotion: false,
  });

  // 模拟数据
  const mockDevices = [
    {
      id: 'device-1',
      name: 'Xiaomi 13 Pro',
      status: 'online' as const,
      model: '13 Pro',
      androidVersion: '14',
      brand: 'Xiaomi',
      batteryLevel: 85,
      isCharging: false,
      connectionType: 'usb' as const,
    },
    {
      id: 'device-2',
      name: 'Samsung Galaxy S23',
      status: 'offline' as const,
      model: 'Galaxy S23',
      androidVersion: '13',
      brand: 'Samsung',
      batteryLevel: 42,
      isCharging: true,
      connectionType: 'wifi' as const,
    },
    {
      id: 'device-3',
      name: 'OnePlus 11',
      status: 'unauthorized' as const,
      model: '11',
      androidVersion: '13',
      brand: 'OnePlus',
      connectionType: 'tcp' as const,
    },
  ];

  const mockSessions: ImportSession[] = [
    {
      id: 'session-1',
      deviceId: 'device-1',
      deviceName: 'Xiaomi 13 Pro',
      startTime: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T10:35:00Z',
      status: 'success',
      totalContacts: 150,
      importedContacts: 150,
      failedContacts: 0,
      category: '工作联系人',
    },
    {
      id: 'session-2',
      deviceId: 'device-2',
      deviceName: 'Samsung Galaxy S23',
      startTime: '2024-01-15T11:00:00Z',
      status: 'running',
      totalContacts: 200,
      importedContacts: 120,
      failedContacts: 5,
      category: '客户名单',
    },
    {
      id: 'session-3',
      deviceId: 'device-3',
      deviceName: 'OnePlus 11',
      startTime: '2024-01-15T09:15:00Z',
      endTime: '2024-01-15T09:20:00Z',
      status: 'failed',
      totalContacts: 100,
      importedContacts: 20,
      failedContacts: 80,
      errorMessage: '设备连接超时',
      category: '测试数据',
    },
  ];

  const mockPresets: ThemePreset[] = [
    {
      id: 'default',
      name: '默认蓝色',
      description: 'Ant Design 经典蓝色主题',
      primary: '#1677ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1677ff',
      favorite: true,
    },
    {
      id: 'green',
      name: '自然绿色',
      description: '清新自然的绿色主题',
      primary: '#52c41a',
      success: '#389e0d',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#52c41a',
    },
    {
      id: 'purple',
      name: '优雅紫色',
      description: '优雅神秘的紫色主题',
      primary: '#722ed1',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#722ed1',
      favorite: true,
    },
    {
      id: 'orange',
      name: '活力橙色',
      description: '充满活力的橙色主题',
      primary: '#fa541c',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#fa541c',
    },
  ];

  const cardGridItems = [
    {
      key: '1',
      title: '设备连接',
      content: <Text>实时监控设备连接状态</Text>,
      actions: [<Button key="connect" type="primary" size="small">连接</Button>],
    },
    {
      key: '2',
      title: '联系人导入',
      content: <Text>批量导入联系人到设备</Text>,
      actions: [<Button key="import" size="small">开始导入</Button>],
    },
    {
      key: '3',
      title: '脚本执行',
      content: <Text>自动化脚本执行管理</Text>,
      actions: [<Button key="run" size="small">运行脚本</Button>],
    },
  ];

  return (
    <ThemeAwarePageContainer
      title="主题增强系统演示"
      subtitle="展示所有主题感知组件的使用效果和功能特性"
      breadcrumb={[
        { title: '组件库' },
        { title: '主题系统' },
        { title: '演示页面' },
      ]}
      extra={
        <Space>
          <Button 
            icon={isDark ? <BulbOutlined /> : <BulbOutlined />}
            onClick={() => themeManager.setMode(isDark ? 'light' : 'dark')}
          >
            {isDark ? '切换到浅色' : '切换到深色'}
          </Button>
          <Button type="primary" icon={<SettingOutlined />}>
            主题设置
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 使用说明 */}
        <Alert
          message="主题增强系统"
          description="这个演示页面展示了完整的主题感知组件库，包括统计卡片、设备管理、会话表格、颜色选择器等。所有组件都会根据当前主题模式（浅色/深色）自动调整样式。"
          type="info"
          showIcon
          icon={<BgColorsOutlined />}
        />

        {/* 统计卡片演示 */}
        <Card title={<Title level={4}><DashboardOutlined /> 统计卡片</Title>}>
          <ThemeAwareGridLayout columns={4}>
            <ThemeAwareStatCard
              title="在线设备"
              value={3}
              color="success"
              trend="up"
              trendValue={12}
              prefix={<AndroidOutlined />}
            />
            <ThemeAwareStatCard
              title="今日导入"
              value="1,234"
              color="primary"
              trend="up"
              trendValue={8}
              prefix={<PhoneOutlined />}
            />
            <ThemeAwareStatCard
              title="成功率"
              value={95.6}
              suffix="%"
              color="success"
              trend="up"
              trendValue={2.3}
            />
            <ThemeAwareStatCard
              title="错误数量"
              value={12}
              color="error"
              trend="down"
              trendValue={15}
            />
          </ThemeAwareGridLayout>
        </Card>

        {/* 设备卡片演示 */}
        <Card title={<Title level={4}><AndroidOutlined /> 设备管理</Title>}>
          <ThemeAwareGridLayout columns={3}>
            {mockDevices.map((device, index) => (
              <ThemeAwareDeviceCard
                key={device.id}
                device={device}
                selected={index === 0}
                onConnect={(id) => console.log('连接设备:', id)}
                onDisconnect={(id) => console.log('断开设备:', id)}
                onRefresh={(id) => console.log('刷新设备:', id)}
                onClick={() => console.log('选择设备:', device.id)}
              />
            ))}
          </ThemeAwareGridLayout>
        </Card>

        {/* 进度和用户卡片 */}
        <Row gutter={24}>
          <Col span={12}>
            <ThemeAwareProgressCard
              title="导入进度统计"
              items={[
                { label: '联系人导入', percent: 75, color: '#1677ff' },
                { label: '脚本执行', percent: 60, color: '#52c41a' },
                { label: '设备连接', percent: 90, color: '#faad14' },
              ]}
            />
          </Col>
          <Col span={12}>
            <ThemeAwareUserCard
              name="管理员"
              description="系统管理员账户"
              stats={[
                { label: '设备数', value: 8 },
                { label: '任务数', value: 24 },
                { label: '成功率', value: '96%' },
              ]}
              actions={
                <Button type="primary" block>
                  查看详情
                </Button>
              }
            />
          </Col>
        </Row>

        {/* 功能卡片网格 */}
        <Card title={<Title level={4}><ExperimentOutlined /> 功能卡片</Title>}>
          <ThemeAwareCardGrid
            items={cardGridItems}
            columns={3}
          />
        </Card>

        {/* 会话表格演示 */}
        <Card title={<Title level={4}><PhoneOutlined /> 导入会话</Title>}>
          <ThemeAwareSessionTable
            sessions={mockSessions}
            onRetry={(id) => console.log('重试会话:', id)}
            onCancel={(id) => console.log('取消会话:', id)}
            onViewDetails={(id) => console.log('查看详情:', id)}
          />
        </Card>

        {/* 高级主题组件演示 */}
        <Row gutter={24}>
          <Col span={8}>
            <ThemeColorPicker
              label="主要颜色"
              value={selectedColor}
              onChange={setSelectedColor}
              showPresets={true}
            />
          </Col>
          <Col span={16}>
            <ThemeAnimationSettings
              onAnimationChange={(newSettings) => 
                setAnimationSettings({ ...animationSettings, ...newSettings })
              }
            />
          </Col>
        </Row>

        {/* 主题预设选择器 */}
        <Card title={<Title level={4}><BgColorsOutlined /> 主题预设</Title>}>
          <ThemePresetSelector
            presets={mockPresets}
            selectedPreset={selectedPreset}
            onPresetSelect={(preset) => setSelectedPreset(preset.id)}
            onPresetSave={(preset) => console.log('保存自定义主题:', preset)}
            allowCustom={true}
          />
        </Card>

        {/* 空状态演示 */}
        <Card title={<Title level={4}>空状态演示</Title>}>
          <ThemeAwareEmpty
            description="没有找到相关数据"
            action={
              <Button type="primary">
                添加数据
              </Button>
            }
          />
        </Card>
      </Space>
    </ThemeAwarePageContainer>
  );
};