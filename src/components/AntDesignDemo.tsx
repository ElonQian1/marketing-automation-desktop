// src/components/AntDesignDemo.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Layout, Card, Typography, App } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

export default function AntDesignDemo() {
  return (
    <App>
      <Layout style={{ minHeight: '100vh', padding: '24px' }}>
        <Content>
          <Card>
            <Title level={2}>Employee Management System</Title>
            <Typography.Text>
              主应用界面 - 请通过菜单导航到具体功能页面
            </Typography.Text>
          </Card>
        </Content>
      </Layout>
    </App>
  );
}
