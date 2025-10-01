import React from 'react';
import { Card, Row, Col, Statistic, Space, Typography, theme } from 'antd';
import {
  MobileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface DeviceStatusCardsProps {
  connectedCount: number;
  offlineCount: number;
  totalCount: number;
}

/**
 * 设备状态统计卡片组件
 * 使用原生 Ant Design 组件展示设备统计信息
 */
export const DeviceStatusCards: React.FC<DeviceStatusCardsProps> = ({
  connectedCount,
  offlineCount,
  totalCount
}) => {
  const { token } = theme.useToken();

  return (
    <Row gutter={[token.marginLG, token.marginLG]}>
      <Col xs={24} sm={8}>
        <Card
          style={{ 
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer
          }}
        >
          <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
            <Space align="center">
              <CheckCircleOutlined 
                style={{ 
                  fontSize: token.fontSizeXL,
                  color: token.colorSuccess 
                }} 
              />
              <Text type="secondary">在线设备</Text>
            </Space>
            <Statistic
              value={connectedCount}
              suffix={`/ 10`}
              valueStyle={{ 
                color: token.colorSuccess,
                fontSize: token.fontSizeHeading2,
                fontWeight: token.fontWeightStrong
              }}
            />
          </Space>
        </Card>
      </Col>
      
      <Col xs={24} sm={8}>
        <Card
          style={{ 
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer
          }}
        >
          <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
            <Space align="center">
              <CloseCircleOutlined 
                style={{ 
                  fontSize: token.fontSizeXL,
                  color: offlineCount > 0 ? token.colorError : token.colorTextSecondary
                }} 
              />
              <Text type="secondary">离线设备</Text>
            </Space>
            <Statistic
              value={offlineCount}
              valueStyle={{ 
                color: offlineCount > 0 ? token.colorError : token.colorTextSecondary,
                fontSize: token.fontSizeHeading2,
                fontWeight: token.fontWeightStrong
              }}
            />
          </Space>
        </Card>
      </Col>
      
      <Col xs={24} sm={8}>
        <Card
          style={{ 
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer
          }}
        >
          <Space direction="vertical" size={token.sizeXS} style={{ width: '100%' }}>
            <Space align="center">
              <DatabaseOutlined 
                style={{ 
                  fontSize: token.fontSizeXL,
                  color: token.colorPrimary 
                }} 
              />
              <Text type="secondary">总设备数</Text>
            </Space>
            <Statistic
              value={totalCount}
              valueStyle={{ 
                color: token.colorPrimary,
                fontSize: token.fontSizeHeading2,
                fontWeight: token.fontWeightStrong
              }}
            />
          </Space>
        </Card>
      </Col>
    </Row>
  );
};