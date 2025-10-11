// src/pages/execution-monitor/components/MonitorFeatureGrid.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Typography, Row, Col } from 'antd';

const { Title, Text } = Typography;

export const MonitorFeatureGrid: React.FC = () => (
  <Card title="监控功能说明">
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={12} lg={6}>
        <Title level={5}>📈 实时进度跟踪</Title>
        <Text type="secondary">实时显示脚本执行进度，包括当前步骤、完成状态和剩余时间预估</Text>
      </Col>
      <Col xs={24} sm={12} md={12} lg={6}>
        <Title level={5}>📝 详细日志记录</Title>
        <Text type="secondary">记录每个步骤的执行日志，包括成功、警告和错误信息</Text>
      </Col>
      <Col xs={24} sm={12} md={12} lg={6}>
        <Title level={5}>⏸️ 执行控制</Title>
        <Text type="secondary">支持暂停、继续、停止和重新执行脚本，灵活控制执行流程</Text>
      </Col>
      <Col xs={24} sm={12} md={12} lg={6}>
        <Title level={5}>📊 性能统计</Title>
        <Text type="secondary">提供执行时间、成功率、错误统计等性能数据分析</Text>
      </Col>
    </Row>
  </Card>
);

export default MonitorFeatureGrid;
