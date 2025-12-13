// src/pages/statistics/components/StatisticsCards.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Row, Col, Statistic, Space, Typography, theme, Progress } from 'antd';
import {
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import type { FollowStatistics } from '../../../types';

const { Text } = Typography;

interface StatisticsCardsProps {
  statistics: FollowStatistics;
}

/**
 * 统计卡片组件
 * 使用原生 Ant Design 组件展示关注统计数据
 */
export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  statistics
}) => {
  const { token } = theme.useToken();

  return (
    <Row gutter={[token.marginLG, token.marginLG]}>
      {/* 总关注数 */}
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            borderRadius: token.borderRadiusLG,
            background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryHover})`
          }}
          styles={{ body: { padding: token.paddingLG } }}
        >
          <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
            <Space align="center">
              <TeamOutlined 
                style={{ 
                  fontSize: token.fontSizeHeading3,
                  color: 'white'
                }} 
              />
              <Text style={{ color: 'white', fontSize: token.fontSize }}>
                总关注数
              </Text>
            </Space>
            <Statistic
              value={statistics.total_follows}
              valueStyle={{
                color: 'white',
                fontSize: token.fontSizeHeading1,
                fontWeight: token.fontWeightStrong
              }}
            />
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: token.fontSizeSM }}>
              累计关注用户数量
            </Text>
          </Space>
        </Card>
      </Col>

      {/* 今日关注 */}
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            borderRadius: token.borderRadiusLG,
            background: `linear-gradient(135deg, ${token.colorSuccess}, ${token.colorSuccessBg})`
          }}
          styles={{ body: { padding: token.paddingLG } }}
        >
          <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
            <Space align="center">
              <TrophyOutlined 
                style={{ 
                  fontSize: token.fontSizeHeading3,
                  color: 'white'
                }} 
              />
              <Text style={{ color: 'white', fontSize: token.fontSize }}>
                今日关注
              </Text>
            </Space>
            <Statistic
              value={statistics.daily_follows}
              valueStyle={{
                color: 'white',
                fontSize: token.fontSizeHeading1,
                fontWeight: token.fontWeightStrong
              }}
            />
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: token.fontSizeSM }}>
              今日新增关注数
            </Text>
          </Space>
        </Card>
      </Col>

      {/* 成功率 */}
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`
          }}
          styles={{ body: { padding: token.paddingLG } }}
        >
          <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
            <Space align="center">
              <PercentageOutlined 
                style={{ 
                  fontSize: token.fontSizeHeading3,
                  color: token.colorWarning
                }} 
              />
              <Text style={{ fontSize: token.fontSize }}>
                成功率
              </Text>
            </Space>
            <Statistic
              value={statistics.success_rate}
              suffix="%"
              valueStyle={{
                color: token.colorWarning,
                fontSize: token.fontSizeHeading1,
                fontWeight: token.fontWeightStrong
              }}
            />
            <Progress
              percent={statistics.success_rate}
              size="small"
              strokeColor={token.colorWarning}
              showInfo={false}
            />
          </Space>
        </Card>
      </Col>

      {/* 今日费用 */}
      <Col xs={24} sm={12} md={6}>
        <Card
          style={{
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`
          }}
          styles={{ body: { padding: token.paddingLG } }}
        >
          <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
            <Space align="center">
              <DollarOutlined 
                style={{ 
                  fontSize: token.fontSizeHeading3,
                  color: token.colorError
                }} 
              />
              <Text style={{ fontSize: token.fontSize }}>
                今日费用
              </Text>
            </Space>
            <Statistic
              value={statistics.cost_today}
              prefix="¥"
              precision={2}
              valueStyle={{
                color: token.colorError,
                fontSize: token.fontSizeHeading1,
                fontWeight: token.fontWeightStrong
              }}
            />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              总费用: ¥{statistics.cost_total?.toFixed(2) || '0.00'}
            </Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};