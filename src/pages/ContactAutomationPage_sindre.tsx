import React, { useState } from 'react';
import { Card, Tabs, Row, Col, Typography, Space, Alert, Empty, Button, List } from 'antd';
import { MobileOutlined, ReloadOutlined } from '@ant-design/icons';
import { ImportAndFollow, VcfImporter, XiaohongshuAutoFollow } from '../components/contact';
import { useAdb } from '../application/hooks/useAdb';
import AutomationResults, { type VcfImportResult, type XiaohongshuFollowResult, type CompleteFlowResult } from './contact-automation-sindre/components/AutomationResults';

export const ContactAutomationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vcf-import' | 'auto-follow' | 'complete-flow'>('complete-flow');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [results, setResults] = useState<{
    vcfImport?: VcfImportResult;
    autoFollow?: XiaohongshuFollowResult;
    completeFlow?: CompleteFlowResult;
  }>({});

  const { devices, isLoading: devicesLoading, lastError: devicesError, refreshDevices } = useAdb();

  // 处理设备选择
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const tabItems = [
    { key: 'complete-flow', label: '完整流程' },
    { key: 'vcf-import', label: 'VCF 导入' },
    { key: 'auto-follow', label: '自动关注' },
  ] as const;

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card
          title={
            <Space>
              <MobileOutlined />
              <span>联系人自动化</span>
            </Space>
          }
          extra={
            <Button icon={<ReloadOutlined />} onClick={refreshDevices} loading={devicesLoading}>
              刷新设备
            </Button>
          }
        >
          {devicesError && (
            <Alert type="error" showIcon message={devicesError.message} style={{ marginBottom: 16 }} />
          )}

          {devices.length === 0 ? (
            <Empty description="暂无已连接设备" />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={devices}
              rowKey={(d) => d.id}
              renderItem={(device) => (
                <List.Item
                  actions={[
                    <Button
                      key="select"
                      type={selectedDevice === device.id ? 'primary' : 'default'}
                      onClick={() => handleDeviceSelect(device.id)}
                    >
                      {selectedDevice === device.id ? '已选择' : '选择'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<MobileOutlined />}
                    title={device.name || device.id}
                    description={`${device.id} • ${device.status}`}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Col>

      <Col span={24}>
        <Card>
          <Tabs
            items={tabItems.map((t) => ({ key: t.key, label: t.label }))}
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as typeof activeTab)}
          />
          {!selectedDevice ? (
            <Empty description="请选择设备后继续" />
          ) : (
            <>
              {activeTab === 'complete-flow' && (
                <ImportAndFollow
                  selectedDevice={selectedDevice}
                  onComplete={(result) =>
                    setResults((prev) => ({
                      ...prev,
                      completeFlow: {
                        importResult: { importedContacts: result.importResult.importedContacts },
                        followResult: { totalFollowed: result.followResult.totalFollowed },
                      },
                    }))
                  }
                />
              )}
              {activeTab === 'vcf-import' && (
                <VcfImporter
                  selectedDevice={selectedDevice}
                  contacts={[]}
                  onImportComplete={(result) =>
                    setResults((prev) => ({
                      ...prev,
                      vcfImport: { importedContacts: result.importedContacts },
                    }))
                  }
                />
              )}
              {activeTab === 'auto-follow' && (
                <XiaohongshuAutoFollow
                  selectedDevice={selectedDevice}
                  onWorkflowComplete={(result) =>
                    setResults((prev) => ({
                      ...prev,
                      // 适配 XiaohongshuAutoFollow 的结果为展示所需的精简形状
                      autoFollow: { totalFollowed: result.successfulFollows },
                    }))
                  }
                />
              )}
            </>
          )}
        </Card>
      </Col>

      <Col span={24}>
        <AutomationResults
          completeFlow={results.completeFlow}
          vcfImport={results.vcfImport}
          autoFollow={results.autoFollow}
        />
      </Col>
    </Row>
  );
};

