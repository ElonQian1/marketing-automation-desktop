// src/pages/BusinessComponentsDemo.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Button, Row, Col } from 'antd';
import {
  MobileOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  PercentageOutlined,
  ReloadOutlined,
  PlusOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import {
  BusinessPageHeader,
  BusinessPageLayout,
  MetricCard
} from '@/components/business';

/**
 * 商业化组件演示页面
 * 展示统一的商业化设计组件库的使用效果
 */
export const BusinessComponentsDemo: React.FC = () => {
  return (
    <BusinessPageLayout>
      {/* 演示页面标题 */}
      <BusinessPageHeader
        title="商业化组件演示"
        subtitle="展示项目中统一的原生 Ant Design 商业化组件库"
        icon={<BarChartOutlined />}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />}>
            刷新数据
          </Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />}>
            添加项目
          </Button>
        ]}
      />

      {/* 指标卡片演示 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="总用户数"
            value={1250}
            icon={<TeamOutlined />}
            description="累计注册用户数量"
            variant="gradient"
            gradientColors={['#1890ff', '#096dd9']}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="今日活跃"
            value={345}
            icon={<TrophyOutlined />}
            description="今日活跃用户数"
            variant="gradient"
            gradientColors={['#52c41a', '#389e0d']}
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="成功率"
            value={87.5}
            suffix="%"
            icon={<PercentageOutlined />}
            description="任务执行成功率"
            variant="bordered"
            valueColor="#faad14"
          />
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <MetricCard
            title="今日费用"
            value={125.50}
            prefix="¥"
            precision={2}
            icon={<DollarOutlined />}
            description="今日营销费用"
            variant="default"
            valueColor="#f5222d"
          />
        </Col>
      </Row>

      {/* 设备管理演示 */}
      <BusinessPageHeader
        title="设备管理中心"
        subtitle="统一管理最多 10 台设备的连接状态，确保任务高效执行"
        icon={<MobileOutlined />}
        actions={[
          <Button key="refresh" icon={<ReloadOutlined />}>
            刷新设备
          </Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />}>
            添加设备
          </Button>
        ]}
        bordered={false}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <MetricCard
            title="在线设备"
            value="7/10"
            icon={<MobileOutlined />}
            description="设备连接状态"
            variant="gradient"
            gradientColors={['#52c41a', '#389e0d']}
          />
        </Col>
        
        <Col xs={24} sm={8}>
          <MetricCard
            title="离线设备"
            value={3}
            icon={<MobileOutlined />}
            description="需要重新连接"
            valueColor="#f5222d"
          />
        </Col>
        
        <Col xs={24} sm={8}>
          <MetricCard
            title="设备利用率"
            value={70}
            suffix="%"
            icon={<PercentageOutlined />}
            description="平均设备使用率"
            variant="bordered"
            valueColor="#1890ff"
          />
        </Col>
      </Row>
    </BusinessPageLayout>
  );
};

export default BusinessComponentsDemo;