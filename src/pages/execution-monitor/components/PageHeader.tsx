import React from 'react';
import { Typography, Space } from 'antd';

const { Title, Paragraph } = Typography;

export const PageHeader: React.FC = () => (
  <Space direction="vertical">
    <Title level={2}>📊 脚本执行监控</Title>
    <Paragraph type="secondary">
      选择一个脚本开始执行监控，实时查看执行进度和状态
    </Paragraph>
  </Space>
);

export default PageHeader;
