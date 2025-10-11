// src/pages/statistics/StatisticsPageNative.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Typography,
  Spin,
  Space,
  Divider,
  theme
} from 'antd';
import {
  TeamOutlined,
  TrophyOutlined,
  PercentageOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { FollowStatistics } from '../../types';

const { Title, Paragraph, Text } = Typography;

/**
 * 关注统计页面 - 原生 Ant Design 版本
 * 显示关注数据、费用统计和任务进度，使用原生 Ant Design 5 组件和主题
 */
export const StatisticsPageNative: React.FC = () => {
  const [statistics, setStatistics] = useState<FollowStatistics>({
    total_follows: 0,
    daily_follows: 0,
    success_rate: 0,
    cost_today: 0,
    cost_total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const { token } = theme.useToken();

  // 模拟获取统计数据
  useEffect(() => {
    const fetchStatistics = async () => {
      // 模拟API调用延迟
      setTimeout(() => {
        setStatistics({
          total_follows: 1250,
          daily_follows: 45,
          success_rate: 92.5,
          cost_today: 4.5,
          cost_total: 125.0
        });
        setIsLoading(false);
      }, 1000);
    };

    fetchStatistics();
  }, []);

  if (isLoading) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%', padding: token.padding }}>
        <Title level={2}>关注统计</Title>
        <div style={{ 
          textAlign: 'center', 
          padding: token.paddingXL 
        }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: token.margin }}>
            正在加载统计数据...
          </Paragraph>
        </div>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: token.padding }}>
      {/* 页面标题 */}
      <div>
        <Title level={2} style={{ marginBottom: token.marginXS }}>
          关注统计
        </Title>
        <Paragraph type="secondary">
          查看关注数据、成功率和费用统计
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总关注人数"
              value={statistics.total_follows}
              prefix={<TeamOutlined style={{ color: token.colorPrimary }} />}
              suffix="人"
              valueStyle={{ color: token.colorPrimary }}
            />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              累计关注用户数
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新增关注"
              value={statistics.daily_follows}
              prefix={<TrophyOutlined style={{ color: token.colorSuccess }} />}
              suffix="人"
              valueStyle={{ color: token.colorSuccess }}
            />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              今日关注数量
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="关注成功率"
              value={statistics.success_rate}
              precision={1}
              prefix={<PercentageOutlined style={{ color: token.colorWarning }} />}
              suffix="%"
              valueStyle={{ color: token.colorWarning }}
            />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              成功关注比例
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日费用"
              value={statistics.cost_today}
              precision={2}
              prefix={<DollarOutlined style={{ color: token.colorError }} />}
              suffix="元"
              valueStyle={{ color: token.colorError }}
            />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              今日消费金额
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 费用详情 */}
      <Card title="费用详情" style={{ width: '100%' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong>总消费金额</Text>
            </Col>
            <Col>
              <Text strong style={{ fontSize: token.fontSizeLG }}>
                ¥{statistics.cost_total.toFixed(2)}
              </Text>
            </Col>
          </Row>
          
          <Divider style={{ margin: `${token.marginXS}px 0` }} />
          
          <Row justify="space-between" align="middle">
            <Col>
              <Text>平均每次关注成本</Text>
            </Col>
            <Col>
              <Text>
                ¥{(statistics.cost_total / statistics.total_follows).toFixed(3)}
              </Text>
            </Col>
          </Row>
          
          <Divider style={{ margin: `${token.marginXS}px 0` }} />
          
          <Row justify="space-between" align="middle">
            <Col>
              <Text>今日关注成本</Text>
            </Col>
            <Col>
              <Text>¥{statistics.cost_today.toFixed(2)}</Text>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* 成功率分析 */}
      <Card title="成功率分析" style={{ width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Col>
                  <Text>关注成功率</Text>
                </Col>
                <Col>
                  <Text strong>{statistics.success_rate}%</Text>
                </Col>
              </Row>
              <Progress 
                percent={statistics.success_rate} 
                strokeColor={token.colorSuccess}
                trailColor={token.colorBgLayout}
              />
            </Space>
          </div>
          
          <Row gutter={16}>
            <Col span={12}>
              <Card 
                size="small" 
                style={{ 
                  textAlign: 'center',
                  backgroundColor: token.green1,
                  borderColor: token.colorSuccess
                }}
              >
                <Statistic
                  value={Math.round((statistics.total_follows * statistics.success_rate) / 100)}
                  valueStyle={{ 
                    color: token.colorSuccess,
                    fontSize: token.fontSizeLG 
                  }}
                  prefix={<CheckCircleOutlined />}
                />
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  成功关注
                </Text>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card 
                size="small" 
                style={{ 
                  textAlign: 'center',
                  backgroundColor: token.red1,
                  borderColor: token.colorError
                }}
              >
                <Statistic
                  value={statistics.total_follows - Math.round((statistics.total_follows * statistics.success_rate) / 100)}
                  valueStyle={{ 
                    color: token.colorError,
                    fontSize: token.fontSizeLG 
                  }}
                  prefix={<CloseCircleOutlined />}
                />
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  关注失败
                </Text>
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* 使用提示 */}
      <Alert
        message="注意事项"
        description={
          <ul style={{ 
            margin: 0, 
            paddingLeft: token.paddingLG,
            lineHeight: token.lineHeight 
          }}>
            <li>费用仅在关注成功后才会扣除</li>
            <li>重复关注同一用户不会重复扣费</li>
            <li>数据每小时自动同步更新</li>
            <li>如有异常请及时联系管理员</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: token.margin }}
      />
    </Space>
  );
};

export default StatisticsPageNative;