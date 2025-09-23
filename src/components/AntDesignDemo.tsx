import {
    AimOutlined,
    BarChartOutlined,
    EyeOutlined,
    FolderOutlined,
    MobileOutlined,
    SecurityScanOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    UserOutlined,
    RobotOutlined
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Layout,
  Menu,
  Progress,
  Space,
  Statistic,
  Typography,
  Switch,
  Tooltip
} from 'antd';
import { AppThemeProvider, useTheme } from '../theme';
import '../styles/theme.css';
import React, { useState } from 'react';
import InspectorPage from '../pages/InspectorPage';
import ContactManagementPage from '../pages/ContactManagementPage';
import PermissionTestPage from '../pages/PermissionTestPage';
import XiaohongshuFollowPage from '../pages/XiaohongshuFollowPage';
import AdbCenterPage from '../pages/adb/AdbCenterPage';
import SmartScriptBuilderPage from '../pages/SmartScriptBuilderPage'; // 智能脚本构建器
import RealTimeDeviceMonitorPage from '../pages/device-monitor/RealTimeDeviceMonitorPage';
import SmartVcfImporter from './SmartVcfImporter';
import TemplateLibrary from './template/TemplateLibrary'; // 模板库

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DemoInner: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard'); // 默认选中仪表板
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [inspectorOpen, setInspectorOpen] = useState<{open: boolean; sessionId?: string; stepId?: string}>({ open: false });
  const { mode, setMode } = useTheme();

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: '仪表板',
    },
    {
      key: 'adb-center',
      icon: <MobileOutlined />,
      label: 'ADB 中心',
    },
    {
      key: 'contacts',
      icon: <UserOutlined />,
      label: '通讯录管理',
    },
    {
      key: 'xiaohongshu-follow',
      icon: <UserOutlined />,
      label: '小红书关注',
    },
    {
      key: 'smart-vcf',
      icon: <ThunderboltOutlined />,
      label: '智能VCF导入',
    },
    {
      key: 'permission-test',
      icon: <SecurityScanOutlined />,
      label: '权限测试',
    },
    {
      key: 'acquisition',
      icon: <AimOutlined />,
      label: '精准获客',
    },
    {
      key: 'smart-script-builder',
      icon: <RobotOutlined />,
      label: '智能脚本构建器',
    },
    {
      key: 'template-library',
      icon: <FolderOutlined />,
      label: '模板库',
    }
  ];

  return (
      <App>
        <Layout style={{ minHeight: '100vh' }}>
        {/* 侧边栏 */}
        <Sider width={240} style={{ background: '#161b22' }}>
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #ff6b8a, #4ecdc4)' }}
              >
                🦄
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
                  Flow Farm
                </Title>
                <Text type="secondary">Automation Platform</Text>
              </div>
            </div>
          </div>

          <Menu
            selectedKeys={[selectedKey]}
            mode="inline"
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
            style={{ border: 'none' }}
          />
        </Sider>

        <Layout>
          {/* 顶部栏 */}
          <Header style={{
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
              {menuItems.find(item => item.key === selectedKey)?.label || '仪表板'}
            </Title>

            <Space>
              <Tooltip title={mode === 'dark' ? '切换到浅色' : '切换到深色'}>
                <Switch
                  checkedChildren="🌙"
                  unCheckedChildren="☀️"
                  checked={mode === 'dark'}
                  onChange={(v) => setMode(v ? 'dark' : 'light')}
                />
              </Tooltip>
              <Button onClick={() => setInspectorOpen({ open: true })} type="primary">打开检查器</Button>
              <Badge count={5} style={{ backgroundColor: '#ff6b8a' }}>
                <Button icon={<SyncOutlined />} size="large">
                  刷新设备
                </Button>
              </Badge>
              <Avatar style={{ backgroundColor: '#722ed1' }}>
                U
              </Avatar>
            </Space>
          </Header>

          {/* 主内容区域 */}
          <Content style={{ 
            margin: '0', 
            padding: '0',
            background: '#0d1117',
            height: 'calc(100vh - 64px)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '24px',
              height: '100%',
              overflow: 'auto'
            }}>
            {inspectorOpen.open && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={() => setInspectorOpen({ open: false })}>
                <div style={{ width: '95vw', height: '90vh', margin: '4vh auto 0', background: '#111', borderRadius: 12, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                  <InspectorPage sessionId={inspectorOpen.sessionId} stepId={inspectorOpen.stepId} />
                </div>
              </div>
            )}
            {selectedKey === 'dashboard' && (
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <Statistic
                      title="在线设备"
                      value={2}
                      suffix="/ 5"
                      valueStyle={{ color: '#52c41a', fontSize: '2rem' }}
                      prefix={<MobileOutlined />}
                    />
                  </Card>
                  <Card>
                    <Statistic
                      title="今日任务"
                      value={23}
                      valueStyle={{ color: '#ff6b8a', fontSize: '2rem' }}
                      prefix={<AimOutlined />}
                    />
                  </Card>
                  <Card>
                    <Statistic
                      title="成功关注"
                      value={189}
                      valueStyle={{ color: '#722ed1', fontSize: '2rem' }}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                  <Card>
                    <Statistic
                      title="账户余额"
                      value={1250}
                      prefix="¥"
                      valueStyle={{ color: '#faad14', fontSize: '2rem' }}
                    />
                  </Card>
                </div>

                {/* 进度显示 */}
                <Card title="任务进度" extra={<Button type="link">查看详情</Button>}>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Text>小红书关注任务</Text>
                        <Text>15/20 完成</Text>
                      </div>
                      <Progress percent={75} strokeColor="#ff6b8a" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <Text>通讯录导入</Text>
                        <Text>100/100 完成</Text>
                      </div>
                      <Progress percent={100} strokeColor="#52c41a" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {selectedKey === 'adb-center' && (
              <AdbCenterPage />
            )}

            {selectedKey === 'contacts' && (
              <ContactManagementPage />
            )}

            {selectedKey === 'xiaohongshu-follow' && (
              <XiaohongshuFollowPage />
            )}

            {selectedKey === 'smart-vcf' && (
              <SmartVcfImporter />
            )}

            {selectedKey === 'permission-test' && (
              <PermissionTestPage />
            )}

            {/* 旧的 ADB 诊断入口已并入 ADB 中心 */}

            {selectedKey === 'acquisition' && (
              <Card title={`${menuItems.find(item => item.key === selectedKey)?.label} 功能`}>
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🚧</div>
                  <Title level={3} style={{ color: 'var(--text-secondary)' }}>
                    功能开发中
                  </Title>
                  <Text type="secondary">
                    这个功能正在开发中，敬请期待...
                  </Text>
                  <Divider />
                  <Button type="primary" size="large">
                    返回仪表板
                  </Button>
                </div>
              </Card>
            )}

            {selectedKey === 'smart-script-builder' && (
              <SmartScriptBuilderPage />
            )}

            {selectedKey === 'template-library' && (
              <TemplateLibrary />
            )}
            </div>
          </Content>
        </Layout>
      </Layout>
      </App>
  );
};

export const AntDesignIntegrationDemo: React.FC = () => {
  return (
    <AppThemeProvider>
      <DemoInner />
    </AppThemeProvider>
  );
};

