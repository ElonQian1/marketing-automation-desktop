import { invoke } from '@tauri-apps/api/core';
import React, { useState } from 'react';
import { Typography, Space, Card, Row, Col, Input, Button, Alert, List, message } from 'antd';
import { ImportStrategyDialog } from '../modules/contact-import/import-strategies/ui/ImportStrategyDialog';
import { AndroidOutlined, FileTextOutlined, PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons';

interface PermissionTestPageProps {}
const { Title, Text } = Typography;

const PermissionTestPage: React.FC<PermissionTestPageProps> = () => {
  const [deviceId, setDeviceId] = useState('emulator-5556');
  const [contactsFile, setContactsFile] = useState('D:\\repositories\\employeeGUI\\test_contacts_permission.txt');
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);

  const testPermissionHandling = async () => {
    setIsLoading(true);
    setTestResult('正在测试权限对话框处理...');
    
    try {
      const result = await invoke('test_permission_handling', {
        deviceId: deviceId
      });
      setTestResult(`权限处理测试结果: ${result}`);
    } catch (error) {
      setTestResult(`权限处理测试失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportStrategySelect = (result: any) => {
    // 这里可以处理导入结果
    setTestResult(`VCF导入测试成功: ${JSON.stringify(result, null, 2)}`);
    message.success('VCF导入测试成功');
    setShowStrategyDialog(false);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <AndroidOutlined />
            <Title level={3} style={{ margin: 0 }}>权限处理测试页面</Title>
          </Space>
        }
        extra={
          <Space>
            <Button type="primary" icon={<PlayCircleOutlined />} loading={isLoading} onClick={testPermissionHandling}>
              {isLoading ? '测试中...' : '测试权限对话框处理'}
            </Button>
            <Button icon={<ExperimentOutlined />} onClick={() => setShowStrategyDialog(true)} disabled={isLoading}>
              {isLoading ? '导入中...' : '测试完整VCF导入'}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card title="设备配置">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">设备ID</Text>
                  <Input
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    prefix={<AndroidOutlined />}
                    placeholder="例如: emulator-5556"
                  />
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">联系人文件路径</Text>
                  <Input
                    value={contactsFile}
                    onChange={(e) => setContactsFile(e.target.value)}
                    prefix={<FileTextOutlined />}
                    placeholder="联系人文件完整路径"
                  />
                </Space>
              </Col>
            </Row>
          </Card>

          <ImportStrategyDialog
            visible={showStrategyDialog}
            onClose={() => setShowStrategyDialog(false)}
            vcfFilePath={contactsFile}
            onSuccess={handleImportStrategySelect}
          />

          {testResult && (
            <Card title="测试结果">
              <pre>{testResult}</pre>
            </Card>
          )}

          <Alert
            type="warning"
            showIcon
            message={<Text strong>使用说明</Text>}
            description={
              <List
                size="small"
                dataSource={[
                  '确保 Android 设备已连接且 ADB 可访问',
                  '设备需要安装联系人应用',
                  '测试会自动处理权限对话框',
                  '联系人文件格式：姓名, 电话, 地址, 职业, 邮箱',
                ]}
                renderItem={(item) => <List.Item>• {item}</List.Item>}
              />
            }
          />
        </Space>
      </Card>
    </Space>
  );
};

export default PermissionTestPage;

