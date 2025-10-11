// src/pages/AdbLayoutComparisonPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState } from 'react';
import { Layout, Space, Divider } from 'antd';
import HeaderBar from './adb-layout-comparison/components/HeaderBar';
import LayoutOverviewCards from './adb-layout-comparison/components/LayoutOverviewCards';
import DesignPrincipleAlert from './adb-layout-comparison/components/DesignPrincipleAlert';
import LayoutPreview from './adb-layout-comparison/components/LayoutPreview';

const { Content } = Layout;

export const AdbLayoutComparisonPage: React.FC = () => {
  const [currentLayout, setCurrentLayout] = useState<'old' | 'new'>('new');

  return (
    <Layout>
      <Content>
        <Space direction="vertical" size="large">
          <HeaderBar current={currentLayout} onSwitch={setCurrentLayout} />
          <LayoutOverviewCards />
          <DesignPrincipleAlert layout={currentLayout} />
          <Divider />
          <LayoutPreview layout={currentLayout} />
        </Space>
      </Content>
    </Layout>
  );
};

export default AdbLayoutComparisonPage;

