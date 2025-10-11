// src/pages/adb-layout-comparison/components/HeaderBar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Row, Col, Space, Typography, Button } from 'antd';
import { ThunderboltOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface HeaderBarProps {
  current: 'old' | 'new';
  onSwitch: (layout: 'old' | 'new') => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ current, onSwitch }) => {
  return (
    <Row justify="space-between" align="middle">
      <Col>
        <Space>
          <Title level={3}>ADB诊断UI布局演示</Title>
          <Text type="secondary">对比旧版Tab布局与新版Dashboard布局</Text>
        </Space>
      </Col>
      <Col>
        <Space>
          <Button
            type={current === 'old' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => onSwitch('old')}
          >
            原版Tab布局
          </Button>
          <Button
            type={current === 'new' ? 'primary' : 'default'}
            icon={<ThunderboltOutlined />}
            onClick={() => onSwitch('new')}
          >
            现代Dashboard布局
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

export default HeaderBar;
