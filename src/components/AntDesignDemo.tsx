import {
  AimOutlined,
    BarChartOutlined,
    EyeOutlined,
    FolderOutlined,
  InboxOutlined,
    MobileOutlined,
    SecurityScanOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    UserOutlined,
    RobotOutlined,
    BgColorsOutlined
} from '@ant-design/icons';
import { App, Avatar, Badge, Button, Card, Divider, Layout, Menu, Progress, Space, Statistic, Typography, Switch, Tooltip } from 'antd';
// 使用新的增强主题提供者
import { EnhancedThemeProvider, ThemeSwitcher, useTheme, useThemeState } from '../components/feature-modules/theme-system';
// 旧的主题CSS已被现代设计系统替代
// import '../styles/theme.css';
import React, { useState } from 'react';
import { GlobalAdbProvider } from '../providers';
import InspectorPage from '../pages/InspectorPage';
import PermissionTestPage from '../pages/PermissionTestPage';
import AdbCenterPage from '../pages/adb/AdbCenterPage';
import SmartScriptBuilderPage from '../pages/SmartScriptBuilderPage'; // 智能脚本构建器
import RealTimeDeviceMonitorPage from '../pages/device-monitor/RealTimeDeviceMonitorPage';
import SmartVcfImporter from './SmartVcfImporter';
import TemplateLibrary from './template/TemplateLibrary'; // 模板库
import { ContactImportWizard } from '../modules/contact-import';
import { featureFlags } from '../config/featureFlags';
import ContactImportPage from '../pages/contact-import/ContactImportPage';
import QuickPhoneMirror from './QuickPhoneMirror';
import { AppShell } from './app-shell';
import { Sidebar as ShellSidebar } from './app-shell/Sidebar';
import { HeaderBar } from './app-shell/HeaderBar';
import { PageFinderView } from './universal-ui/page-finder';
import { ThemeSettingsPage } from '../pages/ThemeSettingsPage';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DemoInner: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard'); // 默认选中仪表板
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [inspectorOpen, setInspectorOpen] = useState<{open: boolean; sessionId?: string; stepId?: string}>({ open: false });
  const { mode } = useThemeState();
  const { toggleMode } = useTheme();

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
      key: 'contact-import',
      icon: <InboxOutlined />,
      label: '联系人导入向导',
    },
    // 旧版入口：可通过特性开关开启/隐藏，避免与新向导产生歧义
    ...(featureFlags.SHOW_LEGACY_VCF_IMPORT
      ? [{ key: 'smart-vcf', icon: <ThunderboltOutlined />, label: 'VCF 导入（旧版）' } as const]
      : []),
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
    ,
    {
      key: 'page-finder',
      icon: <EyeOutlined />,
      label: '页面查找器（新）',
    },
    {
      key: 'theme-settings',
      icon: <BgColorsOutlined />,
      label: '主题设置',
    }
  ];

  return (
      <App>
        <AppShell
          sidebar={
            <ShellSidebar
              brand={(
                <div className="modern-brand">
                  <div className="modern-brand-icon">🦄</div>
                  <div className="modern-brand-text">
                    <h3 className="modern-brand-title">Flow Farm</h3>
                    <p className="modern-brand-subtitle">Automation Platform</p>
                  </div>
                </div>
              )}
              items={menuItems}
              activeKey={selectedKey}
              onChange={setSelectedKey}
            />
          }
          headerTitle={<h2>{menuItems.find(item => item.key === selectedKey)?.label || '仪表板'}</h2>}
          headerActions={(
            <Space size="middle">
              <ThemeSwitcher 
                variant="dropdown"
                size="middle"
                className="modern-theme-switcher"
              />
              <Button 
                onClick={() => setInspectorOpen({ open: true })} 
                type="primary"
                className="modern-action-btn"
              >
                打开检查器
              </Button>
              <QuickPhoneMirror 
                type="default" 
                onMirrorStarted={(sessionId, deviceId) => {
                  console.log(`手机镜像已启动: 会话ID=${sessionId}, 设备=${deviceId}`);
                }} 
              />
              <Badge count={5} className="modern-badge">
                <Button 
                  icon={<SyncOutlined />} 
                  size="large"
                  className="modern-refresh-btn"
                >
                  刷新设备
                </Button>
              </Badge>
              <Avatar className="modern-avatar">U</Avatar>
            </Space>
          )}
        >
          <>
            {inspectorOpen.open && (
              <div className="modal-overlay" onClick={() => setInspectorOpen({ open: false })}>
                <div className="modal-content" style={{ width: '95vw', height: '90vh' }} onClick={e => e.stopPropagation()}>
                  <InspectorPage sessionId={inspectorOpen.sessionId} stepId={inspectorOpen.stepId} />
                </div>
              </div>
            )}
            {selectedKey === 'dashboard' && (
              <div className="modern-dashboard">
                {/* 统计卡片 */}
                <div className="modern-stats-grid">
                  <Card className="modern-stat-card card-hover">
                    <Statistic
                      title="在线设备"
                      value={2}
                      suffix="/ 5"
                      valueStyle={{ color: 'var(--color-success-500)', fontSize: '2rem' }}
                      prefix={<MobileOutlined />}
                    />
                  </Card>
                  <Card className="modern-stat-card card-hover">
                    <Statistic
                      title="今日任务"
                      value={23}
                      valueStyle={{ color: 'var(--color-primary-500)', fontSize: '2rem' }}
                      prefix={<AimOutlined />}
                    />
                  </Card>
                  <Card className="modern-stat-card card-hover">
                    <Statistic
                      title="成功关注"
                      value={189}
                      valueStyle={{ color: 'var(--color-secondary-500)', fontSize: '2rem' }}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                  <Card className="modern-stat-card card-hover">
                    <Statistic
                      title="账户余额"
                      value={1250}
                      prefix="¥"
                      valueStyle={{ color: 'var(--color-warning-500)', fontSize: '2rem' }}
                    />
                  </Card>
                </div>

                {/* 进度显示 */}
                <Card 
                  title="任务进度" 
                  extra={<Button type="link" className="modern-link-btn">查看详情</Button>}
                  className="modern-progress-card card-hover"
                >
                  <div className="modern-progress-list">
                    <div className="modern-progress-item">
                      <div className="flex justify-between mb-2">
                        <Text className="progress-label">小红书关注任务</Text>
                        <Text className="progress-value">15/20 完成</Text>
                      </div>
                      <Progress percent={75} strokeColor="var(--color-primary-500)" />
                    </div>
                    <div className="modern-progress-item">
                      <div className="flex justify-between mb-2">
                        <Text className="progress-label">通讯录导入</Text>
                        <Text className="progress-value">100/100 完成</Text>
                      </div>
                      <Progress percent={100} strokeColor="var(--color-success-500)" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {selectedKey === 'adb-center' && (
              <AdbCenterPage />
            )}


            {selectedKey === 'contact-import' && (
              <ContactImportPage />
            )}

            {featureFlags.SHOW_LEGACY_VCF_IMPORT && selectedKey === 'smart-vcf' && (
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

            {selectedKey === 'page-finder' && (
              <PageFinderView />
            )}

            {selectedKey === 'theme-settings' && (
              <ThemeSettingsPage />
            )}
          </>
        </AppShell>
      </App>
  );
};

export const AntDesignIntegrationDemo: React.FC = () => {
  return (
    <EnhancedThemeProvider 
      options={{ 
        defaultMode: 'dark',
        detectSystemTheme: true,
        animation: {
          enabled: true,
          duration: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          enableDarkModeTransition: true,
        }
      }}
    >
      <GlobalAdbProvider>
        <DemoInner />
      </GlobalAdbProvider>
    </EnhancedThemeProvider>
  );
};

