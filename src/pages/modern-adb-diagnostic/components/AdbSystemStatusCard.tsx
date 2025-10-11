// src/pages/modern-adb-diagnostic/components/AdbSystemStatusCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Typography, Space, Badge } from 'antd';

const { Paragraph, Text } = Typography;

export interface AdbSystemStatusCardProps {
  deviceCount: number;
  onlineCount: number;
  isLoading: boolean;
}

export const AdbSystemStatusCard: React.FC<AdbSystemStatusCardProps> = ({ deviceCount, onlineCount, isLoading }) => {
  return (
    <Card title="ADB 系统状态">
      <Space direction="vertical">
        <Paragraph>系统已重构为统一的DDD架构</Paragraph>
        <Paragraph>
          <Text>设备数量: </Text>
          <Badge status={deviceCount > 0 ? 'processing' : 'default'} text={deviceCount} />
        </Paragraph>
        <Paragraph>
          <Text>在线设备: </Text>
          <Badge status={onlineCount > 0 ? 'success' : 'default'} text={onlineCount} />
        </Paragraph>
        <Paragraph>
          <Text>状态: </Text>
          <Badge status={isLoading ? 'processing' : 'success'} text={isLoading ? '加载中' : '正常'} />
        </Paragraph>
      </Space>
    </Card>
  );
};

export default AdbSystemStatusCard;
