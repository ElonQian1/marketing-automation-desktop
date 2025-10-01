import React from 'react';
import { Row, Col, Typography, Space, Button, theme } from 'antd';
import {
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface DevicePageHeaderProps {
  refreshDevices: () => void;
  isLoading: boolean;
}

/**
 * 设备管理页面头部组件
 * 使用原生 Ant Design 组件的商业化页面标题
 */
export const DevicePageHeader: React.FC<DevicePageHeaderProps> = ({
  refreshDevices,
  isLoading
}) => {
  const { token } = theme.useToken();

  return (
    <Row justify="space-between" align="middle">
      <Col>
        <Space 
          direction="vertical" 
          size={token.sizeXS}
        >
          <Space align="center">
            <MobileOutlined 
              style={{ 
                fontSize: token.fontSizeHeading2,
                color: token.colorPrimary 
              }} 
            />
            <Title 
              level={2} 
              style={{ 
                margin: 0,
                color: token.colorText,
                fontWeight: token.fontWeightStrong
              }}
            >
              设备管理中心
            </Title>
          </Space>
          <Text 
            type="secondary"
            style={{ fontSize: token.fontSize }}
          >
            统一管理最多 10 台设备的连接状态，确保任务高效执行
          </Text>
        </Space>
      </Col>
      <Col>
        <Space size={token.sizeMS}>
          <Button 
            type="default"
            icon={<ReloadOutlined />}
            onClick={refreshDevices}
            loading={isLoading}
            size="middle"
          >
            刷新设备
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => console.log('添加设备')}
            size="middle"
          >
            添加设备
          </Button>
        </Space>
      </Col>
    </Row>
  );
};