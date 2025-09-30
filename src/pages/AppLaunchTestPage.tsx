import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  List,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAdb } from '../application/hooks/useAdb';

interface AppInfo {
  package_name: string;
  app_name: string;
  version_name?: string;
  is_system_app: boolean;
  main_activity?: string;
}

interface AppStateResult {
  state: string;
  is_functional: boolean;
  message: string;
  checked_elements: number;
  total_checks: number;
}

interface AppLaunchResult {
  success: boolean;
  message: string;
  package_name: string;
  launch_time_ms: number;
  app_state?: AppStateResult;
  ready_time_ms?: number;
  startup_issues: string[];
}

const AppLaunchTestPage: React.FC = () => {
  const { devices, refreshDevices } = useAdb();
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<AppLaunchResult | null>(null);
  const [launchHistory, setLaunchHistory] = useState<AppLaunchResult[]>([]);

  useEffect(() => {
    void handleRefreshDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDevice) void loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice]);

  const handleRefreshDevices = async () => {
    try {
      await refreshDevices();
      if (devices.length > 0) setSelectedDevice(devices[0].id);
    } catch (e) {
      console.error('获取设备列表失败:', e);
    }
  };

  const loadApps = async () => {
    if (!selectedDevice) return;
    try {
      const result = await invoke<AppInfo[]>('get_device_apps', { deviceId: selectedDevice });
      const filtered = result
        .filter((app) => !app.is_system_app)
        .sort((a, b) => a.app_name.localeCompare(b.app_name));
      setApps(filtered);
      const xhs = filtered.find((app) => app.package_name === 'com.xingin.xhs');
      if (xhs) setSelectedApp(xhs.package_name);
    } catch (e) {
      console.error('获取应用列表失败:', e);
    }
  };

  const handleLaunchApp = async () => {
    if (!selectedDevice || !selectedApp) return;
    setIsLaunching(true);
    setLaunchResult(null);
    try {
      const result = await invoke<AppLaunchResult>('launch_device_app', {
        deviceId: selectedDevice,
        packageName: selectedApp,
      });
      setLaunchResult(result);
      setLaunchHistory((prev) => [result, ...prev.slice(0, 9)]);
    } catch (e) {
      console.error('启动应用失败:', e);
      const fallback: AppLaunchResult = {
        success: false,
        message: `启动失败: ${e}`,
        package_name: selectedApp,
        launch_time_ms: 0,
        startup_issues: [String(e)],
      };
      setLaunchResult(fallback);
      setLaunchHistory((prev) => [fallback, ...prev.slice(0, 9)]);
    } finally {
      setIsLaunching(false);
    }
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'Ready':
        return 'success';
      case 'Loading':
        return 'processing';
      case 'SplashScreen':
      case 'PermissionDialog':
      case 'LoginRequired':
      case 'NetworkCheck':
        return 'warning';
      case 'NotStarted':
        return 'default';
      default:
        return 'error';
    }
  };

  const getStateText = (state: string): string => {
    const map: Record<string, string> = {
      Ready: '就绪',
      Loading: '加载中',
      SplashScreen: '启动画面',
      PermissionDialog: '权限弹窗',
      LoginRequired: '需要登录',
      NetworkCheck: '网络检查',
      NotStarted: '未启动',
    };
    return map[state] || state;
  };

  const selectedAppInfo = apps.find((app) => app.package_name === selectedApp);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          应用启动状态检测测试
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
          测试新的智能应用启动检测功能，确保应用真正就绪后再执行自动化操作
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="控制面板">
            <Form layout="vertical">
              <Form.Item label="选择设备">
                <Select
                  placeholder="请选择设备"
                  value={selectedDevice}
                  onChange={setSelectedDevice}
                  options={devices.map((d: any) => ({ value: d.id, label: `${d.name} (${d.id})` }))}
                />
              </Form.Item>

              <Form.Item label="选择应用">
                <Select
                  placeholder="请选择应用"
                  value={selectedApp}
                  onChange={setSelectedApp}
                  showSearch
                  filterOption={(input, option) =>
                    ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={apps.map((app) => ({ value: app.package_name, label: `${app.app_name} (${app.package_name})` }))}
                />
              </Form.Item>

              {selectedAppInfo && (
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="应用名称">{selectedAppInfo.app_name}</Descriptions.Item>
                  <Descriptions.Item label="包名">{selectedAppInfo.package_name}</Descriptions.Item>
                  {selectedAppInfo.version_name && (
                    <Descriptions.Item label="版本">{selectedAppInfo.version_name}</Descriptions.Item>
                  )}
                  {selectedAppInfo.main_activity && (
                    <Descriptions.Item label="主Activity">{selectedAppInfo.main_activity}</Descriptions.Item>
                  )}
                </Descriptions>
              )}

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleLaunchApp}
                  disabled={!selectedDevice || !selectedApp || isLaunching}
                  loading={isLaunching}
                  block
                >
                  {isLaunching ? '启动中...' : '启动应用并检测状态'}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleRefreshDevices} block>
                  刷新设备列表
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="启动结果">
            {isLaunching && (
              <Space direction="vertical" align="center" style={{ width: '100%', padding: 24 }}>
                <Spin size="large" />
                <Typography.Text>正在启动应用并检测状态...</Typography.Text>
                <Typography.Text type="secondary">这可能需要15-45秒</Typography.Text>
              </Space>
            )}

            {launchResult && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  type={launchResult.success ? 'success' : 'error'}
                  message={launchResult.success ? '启动成功' : '启动失败'}
                  description={launchResult.message}
                  showIcon
                />

                <Row gutter={16}>
                  <Col xs={12}>
                    <Card size="small">
                      <Space direction="vertical" size={4}>
                        <Typography.Text type="secondary">启动时间</Typography.Text>
                        <Typography.Text strong>{launchResult.launch_time_ms}ms</Typography.Text>
                      </Space>
                    </Card>
                  </Col>
                  {launchResult.ready_time_ms && (
                    <Col xs={12}>
                      <Card size="small">
                        <Space direction="vertical" size={4}>
                          <Typography.Text type="secondary">就绪时间</Typography.Text>
                          <Typography.Text strong>{launchResult.ready_time_ms}ms</Typography.Text>
                        </Space>
                      </Card>
                    </Col>
                  )}
                </Row>

                {launchResult.app_state && (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Typography.Text>应用状态：</Typography.Text>
                      <Tag color={getStateColor(launchResult.app_state.state)} style={{ marginLeft: 8 }}>
                        {getStateText(launchResult.app_state.state)}
                      </Tag>
                    </div>
                    <div>
                      <Typography.Text>检测进度：</Typography.Text>
                      <Progress
                        percent={Math.round(
                          (launchResult.app_state.checked_elements / launchResult.app_state.total_checks) * 100,
                        )}
                        format={() =>
                          `${launchResult.app_state?.checked_elements}/${launchResult.app_state?.total_checks}`
                        }
                      />
                    </div>
                    <div>
                      <Typography.Text>状态消息：</Typography.Text>
                      <Card size="small">
                        <Typography.Text type="secondary">{launchResult.app_state.message}</Typography.Text>
                      </Card>
                    </div>
                  </Space>
                )}

                {launchResult.startup_issues.length > 0 && (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Typography.Text>启动问题：</Typography.Text>
                    <List
                      size="small"
                      dataSource={launchResult.startup_issues}
                      renderItem={(item) => <List.Item>• {item}</List.Item>}
                    />
                  </Space>
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {launchHistory.length > 0 && (
        <Card title="启动历史">
          <Timeline>
            {launchHistory.map((result, index) => (
              <Timeline.Item key={index} color={result.success ? 'green' : 'red'}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space size={8}>
                      <Typography.Text strong>
                        {apps.find((app) => app.package_name === result.package_name)?.app_name || result.package_name}
                      </Typography.Text>
                      <Typography.Text type="secondary">{result.launch_time_ms}ms</Typography.Text>
                      {result.app_state && (
                        <Tag color={getStateColor(result.app_state.state)}>
                          {getStateText(result.app_state.state)}
                        </Tag>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date().toLocaleTimeString()}
                    </Typography.Text>
                  </Col>
                </Row>
                <Typography.Paragraph style={{ marginTop: 4 }}>{result.message}</Typography.Paragraph>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}

      <Card title="功能说明">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>新的应用启动检测功能特点：</Typography.Text>
            <List
              size="small"
              dataSource={[
                '多层次检测：从进程启动到UI就绪的完整检测链',
                '智能超时：针对不同应用的自适应超时设置',
                '状态识别：识别启动画面、权限弹窗、登录页面等中间状态',
                '小红书专用：特别优化了小红书应用的首页检测逻辑',
                '详细报告：提供完整的启动时间线和问题诊断',
              ]}
              renderItem={(item) => <List.Item>• {item}</List.Item>}
            />
          </div>
          <div>
            <Typography.Text strong>支持的应用状态：</Typography.Text>
            <Space wrap>
              <Tag color="success">Ready</Tag>
              <Tag color="processing">Loading</Tag>
              <Tag color="warning">SplashScreen</Tag>
              <Tag color="warning">PermissionDialog</Tag>
              <Tag color="warning">LoginRequired</Tag>
              <Tag color="warning">NetworkCheck</Tag>
            </Space>
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export default AppLaunchTestPage;