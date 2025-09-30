import React, { useState } from 'react';
import { Card, Col, Empty, Row, Tabs, Typography, Space } from 'antd';
import { useAdb } from '../application/hooks/useAdb';
import { VcfImporter } from '../components/contact';
import DeviceSelector from './contact-automation/components/DeviceSelector';
import ImportResultSummary from './contact-automation/components/ImportResultSummary';
import { MobileOutlined } from '@ant-design/icons';
import type { VcfImportResult } from '../types';

export const ContactAutomationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vcf-import'>('vcf-import');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [results, setResults] = useState<{ vcfImport?: VcfImportResult }>({});

  const { devices, isLoading: devicesLoading, lastError: devicesError, refreshDevices } = useAdb();

  // 处理设备选择
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const tabs = [
    { key: 'vcf-import', label: 'VCF 导入' },
  ] as const;

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title={<Space size={8}><MobileOutlined /><Typography.Text strong>联系人自动化</Typography.Text></Space>}>
          <DeviceSelector
            devices={devices}
            loading={devicesLoading}
            error={devicesError}
            selectedDeviceId={selectedDevice}
            onRefresh={refreshDevices}
            onSelect={handleDeviceSelect}
          />
        </Card>
      </Col>

      <Col span={24}>
        <Card>
          <Tabs
            items={tabs.map((t) => ({ key: t.key, label: t.label }))}
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as typeof activeTab)}
          />
          {!selectedDevice ? (
            <Empty description="请先选择一个设备" />
          ) : (
            <Card type="inner" title="VCF 导入">
              {activeTab === 'vcf-import' && (
                <VcfImporter
                  selectedDevice={selectedDevice}
                  contacts={[]}
                  onImportComplete={(result) => setResults((prev) => ({ ...prev, vcfImport: result }))}
                />
              )}
            </Card>
          )}
        </Card>
      </Col>

      {results.vcfImport && (
        <Col span={24}>
          <ImportResultSummary result={{
            importedContacts: results.vcfImport.importedContacts,
          }} />
        </Col>
      )}
    </Row>
  );
};

