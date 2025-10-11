// src/pages/ModernAdbDiagnosticPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Typography, Space } from 'antd';
import { useAdb } from '../application/hooks/useAdb';
import AdbSystemStatusCard from './modern-adb-diagnostic/components/AdbSystemStatusCard';

const { Title } = Typography;

interface ModernAdbDiagnosticPageProps {
  className?: string;
}

export const ModernAdbDiagnosticPage: React.FC<ModernAdbDiagnosticPageProps> = ({ className }) => {
  const { devices, isLoading } = useAdb();
  const onlineCount = devices.filter(d => d.isOnline()).length;

  return (
    <Space direction="vertical" size="large" className={className}>
      <Title level={3}>ADB 诊断中心</Title>
      <AdbSystemStatusCard
        deviceCount={devices.length}
        onlineCount={onlineCount}
        isLoading={isLoading}
      />
    </Space>
  );
};

export default ModernAdbDiagnosticPage;

