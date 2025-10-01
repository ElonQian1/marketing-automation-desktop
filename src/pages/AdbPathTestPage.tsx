import { Alert, Button, Card, Space, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import DevicesResultCard from './adb-path-test/components/DevicesResultCard';
import { useAdb } from '../application/hooks/useAdb';
import { AdbConfig, Device, DeviceStatus } from '../domain/adb';

const { Title, Text, Paragraph } = Typography;

export const AdbPathTestPage: React.FC = () => {
  const [smartPath, setSmartPath] = useState<string>('');
  const [devicesOutput, setDevicesOutput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const {
    autoDetectAdbPath,
    updateConfig,
    refreshDevices,
    devices,
    isLoading,
    adbPath,
  } = useAdb();

  // 将当前 store 中的设备格式化为 adb devices 风格输出
  const adbDevicesLikeOutput = useMemo(() => {
    const header = 'List of devices attached';
    if (!devices || devices.length === 0) {
      return `${header}\n`;
    }
    const mapStatus = (d: Device) => {
      switch (d.status) {
        case DeviceStatus.ONLINE:
          return 'device';
        case DeviceStatus.OFFLINE:
          return 'offline';
        case DeviceStatus.UNAUTHORIZED:
          return 'unauthorized';
        default:
          return 'unknown';
      }
    };
    const lines = devices.map((d) => `${d.id}\t${mapStatus(d)}`);
    return `${header}\n${lines.join('\n')}`;
  }, [devices]);

  const testSmartAdbPath = async () => {
    setError('');
    try {
      const path = await autoDetectAdbPath();
      setSmartPath(path);
      // 将路径写入全局配置，便于后续设备刷新与连接
      await updateConfig(AdbConfig.default().withAdbPath(path));
      // 立即刷新一次设备
      await refreshDevices();
    } catch (err) {
      setError(`ADB路径检测失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('ADB路径检测失败:', err);
    }
  };

  const testDevices = async () => {
    if (!smartPath && !adbPath) {
      setError('请先检测ADB路径');
      return;
    }
    setError('');
    try {
      // 通过应用层刷新设备
      await refreshDevices();
      // 构造输出
      setDevicesOutput(adbDevicesLikeOutput);
      console.log('设备检测结果:', adbDevicesLikeOutput);
    } catch (err) {
      setError(`设备检测失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('设备检测失败:', err);
    }
  };

  return (
    <>
      <Title level={2}>ADB 路径检测测试</Title>

      <Space direction="vertical" size="large">
        <Card title="1. 智能 ADB 路径检测">
          <Space direction="vertical">
            <Button
              type="primary"
              onClick={testSmartAdbPath}
              loading={isLoading}
            >
              检测智能 ADB 路径
            </Button>

            {(smartPath || adbPath) && (
              <Alert
                type="success"
                message={`检测到 ADB 路径: ${smartPath || adbPath}`}
              />
            )}
          </Space>
        </Card>

        <Card title="2. 设备检测测试">
          <Space direction="vertical">
            <Button
              type="primary"
              onClick={testDevices}
              loading={isLoading}
              disabled={!smartPath && !adbPath}
            >
              检测连接的设备
            </Button>

            <DevicesResultCard devices={devicesOutput || adbDevicesLikeOutput} />
          </Space>
        </Card>

        {error && (
          <Alert type="error" message={error} />
        )}

        <Card title="环境信息">
          <Paragraph>
            <Text strong>当前环境:</Text> 开发环境 (npm run tauri dev)
          </Paragraph>
          <Paragraph>
            <Text strong>预期行为:</Text>
            <ul>
              <li>智能检测应该返回项目根目录下的 platform-tools/adb.exe</li>
              <li>设备检测应该能够列出连接的Android设备</li>
            </ul>
          </Paragraph>
        </Card>
      </Space>
    </>
  );
};

export default AdbPathTestPage;

