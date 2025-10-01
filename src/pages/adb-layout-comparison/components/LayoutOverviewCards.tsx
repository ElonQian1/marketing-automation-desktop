import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { ThunderboltOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const LayoutOverviewCards: React.FC = () => {
  return (
    <Card>
      <Row gutter={24}>
        <Col span={12}>
          <div>
            <AppstoreOutlined />
            <Title level={4}>原版Tab布局</Title>
            <Paragraph type="secondary">
              基于Ant Design Tabs组件的传统布局方式：
              <br />• 功能分散在4个不同标签页
              <br />• 需要切换查看不同信息
              <br />• 无法同时监控多个状态
              <br />• 缺少实时概览
            </Paragraph>
          </div>
        </Col>
        <Col span={12}>
          <div>
            <ThunderboltOutlined />
            <Title level={4}>现代Dashboard布局</Title>
            <Paragraph type="secondary">
              遵循DevOps工具最佳实践的仪表板设计：
              <br />• 状态概览一目了然
              <br />• 主操作区突出重点功能
              <br />• 实时信息同屏显示
              <br />• 专业诊断工具体验
            </Paragraph>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default LayoutOverviewCards;
