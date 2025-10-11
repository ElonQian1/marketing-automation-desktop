// src/pages/adb-path-test/components/DevicesResultCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Typography } from 'antd';

const { Paragraph, Text } = Typography;

export interface DevicesResultCardProps {
  devices: string;
}

export const DevicesResultCard: React.FC<DevicesResultCardProps> = ({ devices }) => {
  if (!devices) return null;
  return (
    <Card title="设备检测结果" size="small">
      <Paragraph>
        <Text type="secondary">adb devices 输出：</Text>
      </Paragraph>
      <Paragraph>
        <pre>{devices}</pre>
      </Paragraph>
    </Card>
  );
};

export default DevicesResultCard;
