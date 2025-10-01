import React from 'react';
import { Row, Col, Typography, Space, Button, theme } from 'antd';
import {
  BarChartOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface StatisticsHeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * 统计页面头部组件
 * 使用原生 Ant Design 组件的商业化页面标题
 */
export const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({
  onRefresh,
  isLoading = false
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
            <BarChartOutlined 
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
              数据统计中心
            </Title>
          </Space>
          <Text 
            type="secondary"
            style={{ fontSize: token.fontSize }}
          >
            实时监控关注任务的执行情况和成本分析
          </Text>
        </Space>
      </Col>
      <Col>
        <Space size={token.sizeMS}>
          <Button 
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={isLoading}
            size="middle"
          >
            刷新数据
          </Button>
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            size="middle"
          >
            导出报告
          </Button>
        </Space>
      </Col>
    </Row>
  );
};